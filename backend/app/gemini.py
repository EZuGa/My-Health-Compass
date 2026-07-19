"""Normalize free-text lab results from clinic EHR uploads into structured JSON.

Primary path: Google Gemini (google-genai) with a JSON response schema —
handles Georgian analyte names and maps them onto our metric catalog so the
values become chartable observations.
Fallback path: rule-based parser for the "სახელი (ABBR): value; ..." format,
used when no Gemini key is configured or the API call fails.
"""
import logging
import re

from pydantic import BaseModel, Field

from .config import settings

logger = logging.getLogger("uvicorn.error")


class NormalizedLabValue(BaseModel):
    metric: str = Field(description="Metric code from the catalog, or a new snake_case English code if none fits")
    name_original: str = Field(description="Analyte name exactly as written in the source text")
    name_en: str = Field(description="Standard English analyte name")
    abbreviation: str | None = Field(default=None, description="Standard abbreviation, e.g. HGB, WBC")
    value_num: float | None = Field(default=None, description="Numeric value, converted to `unit`")
    value_text: str | None = Field(default=None, description="Value for non-numeric results")
    unit: str | None = Field(default=None, description="Unit of value_num (catalog unit when mapped)")
    reference_range: str | None = Field(default=None, description="Reference range if stated in the source")


class NormalizedLabReport(BaseModel):
    test_name_en: str | None = Field(default=None, description="English name of the overall test/panel")
    values: list[NormalizedLabValue]


def _catalog_prompt(catalog: list[tuple[str, str, str | None]]) -> str:
    lines = "\n".join(f"- {code}: {name}" + (f" ({unit})" if unit else "")
                      for code, name, unit in catalog)
    return (
        "You normalize a clinic laboratory result written as free text (often in "
        "Georgian) into structured JSON. Extract every analyte with its value.\n"
        "Map each analyte to a metric code from this catalog when it is the same "
        "quantity:\n"
        f"{lines}\n\n"
        "Rules:\n"
        "- name_original must be the analyte name verbatim from the source text.\n"
        "- When mapping to a catalog metric, convert the value to the catalog unit "
        "if the source plainly used another one (e.g. hemoglobin 15 g/dL -> 150 g/L, "
        "hematocrit 52% -> 0.52 L/L). If the source unit is ambiguous, keep the "
        "number as written and set `unit` to the most likely source unit.\n"
        "- If an analyte fits no catalog metric, invent a clear snake_case English "
        "code (e.g. rbc, mcv, neutrophils_pct).\n"
        "- Only extract values present in the text; never invent analytes or values."
    )


def normalize_with_gemini(
    text: str, test_name: str | None, catalog: list[tuple[str, str, str | None]]
) -> NormalizedLabReport:
    from google import genai
    from google.genai import types

    key = settings.gemini_api_key
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    # "AQ."-prefixed keys are Vertex AI express-mode keys; others are AI Studio keys.
    client = genai.Client(api_key=key, vertexai=key.startswith("AQ."))
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=(f"Lab test: {test_name}\n\n" if test_name else "") + f"Result text:\n{text}",
        config=types.GenerateContentConfig(
            system_instruction=_catalog_prompt(catalog),
            response_mime_type="application/json",
            response_schema=NormalizedLabReport,
            temperature=0,
        ),
    )
    parsed = response.parsed
    if isinstance(parsed, NormalizedLabReport):
        return parsed
    return NormalizedLabReport.model_validate_json(response.text)


def transcribe_audio(audio: bytes, mime_type: str, language: str | None = None) -> str:
    """Speech-to-text for the voice-intake features: the browser records with
    MediaRecorder (webm/mp4) and we ask Gemini for a verbatim transcript."""
    from google import genai
    from google.genai import types

    key = settings.gemini_api_key
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    client = genai.Client(api_key=key, vertexai=key.startswith("AQ."))
    instruction = (
        "Transcribe this audio recording verbatim, in the language spoken"
        + (f" (likely {language})" if language else "")
        + ". Return only the transcribed text with normal punctuation — no "
        "commentary, no labels. If there is no intelligible speech, return "
        "an empty string."
    )
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=[
            types.Part.from_bytes(data=audio, mime_type=mime_type.split(";")[0]),
            instruction,
        ],
        config=types.GenerateContentConfig(temperature=0),
    )
    return (response.text or "").strip()


# ---------- rule-based fallback ----------

# Catalog codes for common CBC abbreviations, so the fallback still maps
# the frequent analytes even without Gemini.
_ABBREV_TO_METRIC = {
    "HGB": "hemoglobin",
    "HCT": "hematocrit",
    "WBC": "wbc",
    "PLT": "platelets",
}

_SEGMENT = re.compile(r"^(?P<name>.+?)\s*:\s*(?P<value>[-+]?\d+(?:[.,]\d+)?)\s*$")
_ABBREV = re.compile(r"\(([A-Za-z][A-Za-z0-9 _-]*)\)")


def normalize_with_rules(text: str) -> NormalizedLabReport:
    values: list[NormalizedLabValue] = []
    for segment in text.split(";"):
        m = _SEGMENT.match(segment.strip())
        if not m:
            continue
        name = m.group("name").strip()
        abbrev_match = _ABBREV.search(name)
        abbrev = abbrev_match.group(1).strip().upper() if abbrev_match else None
        metric = _ABBREV_TO_METRIC.get(abbrev or "") or (
            re.sub(r"[^a-z0-9]+", "_", abbrev.lower()).strip("_") if abbrev else "lab_value"
        )
        values.append(NormalizedLabValue(
            metric=metric,
            name_original=name,
            name_en=abbrev or name,
            abbreviation=abbrev,
            value_num=float(m.group("value").replace(",", ".")),
        ))
    return NormalizedLabReport(values=values)


def normalize_lab_result(
    text: str, test_name: str | None, catalog: list[tuple[str, str, str | None]]
) -> tuple[NormalizedLabReport, str]:
    """Returns (report, parser) where parser is 'gemini' or 'rules'."""
    try:
        return normalize_with_gemini(text, test_name, catalog), "gemini"
    except Exception:
        # no API key / no network / quota — degrade to the rule parser
        logger.exception("Gemini lab normalization failed; using rule-based fallback")
        return normalize_with_rules(text), "rules"

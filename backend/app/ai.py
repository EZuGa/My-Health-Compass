"""Turn a patient's free-text health message into structured observations.

Primary path: Claude (Anthropic SDK) with structured outputs — handles any
phrasing, any language (incl. Georgian), unit conversion, multiple values.
Fallback path: rule-based regex parser for common vitals, used when no
Anthropic credentials are configured or the API call fails.
"""
import re

from pydantic import BaseModel, Field

CLAUDE_MODEL = "claude-opus-4-8"


class ExtractedObservation(BaseModel):
    metric: str = Field(description="Metric code from the catalog, or a new snake_case code if none fits")
    value_num: float | None = Field(default=None, description="Numeric value if the metric is numeric")
    value_text: str | None = Field(default=None, description="Textual value for non-numeric metrics")
    unit: str | None = Field(default=None, description="Unit, e.g. bpm, mmHg, kg")


class ExtractionResult(BaseModel):
    observations: list[ExtractedObservation]


def _catalog_prompt(catalog: list[tuple[str, str, str | None]]) -> str:
    lines = "\n".join(f"- {code}: {name}" + (f" ({unit})" if unit else "")
                      for code, name, unit in catalog)
    return (
        "You extract structured health observations from a patient's chat message.\n"
        "Map each measurement to a metric code from this catalog whenever possible:\n"
        f"{lines}\n\n"
        "Rules:\n"
        "- 'pressure 100 over 70' or '100/70' means blood_pressure_systolic=100 and "
        "blood_pressure_diastolic=70; a single 'pressure 100' is blood_pressure_systolic.\n"
        "- Use the catalog unit; convert if the patient used another unit.\n"
        "- If a measurement fits no catalog metric, invent a clear snake_case code.\n"
        "- Only extract actual measurements/symptom severities the patient states. "
        "Do not invent values. If the message has none, return an empty list."
    )


def extract_with_claude(text: str, catalog: list[tuple[str, str, str | None]]) -> list[ExtractedObservation]:
    import anthropic

    client = anthropic.Anthropic()
    response = client.messages.parse(
        model=CLAUDE_MODEL,
        max_tokens=2048,
        system=_catalog_prompt(catalog),
        messages=[{"role": "user", "content": text}],
        output_format=ExtractionResult,
    )
    return response.parsed_output.observations


# ---------- rule-based fallback ----------

_NUM = r"(\d+(?:[.,]\d+)?)"

_PATTERNS: list[tuple[str, str, str | None]] = [
    # (regex, metric_code, unit) — first group is the value
    # both word orders: "pulse 50" and "50 pulse"
    (rf"(?:pulse|heart\s*rate|hr)\D{{0,10}}{_NUM}", "pulse", "bpm"),
    (rf"{_NUM}\s*(?:bpm|pulse)", "pulse", "bpm"),
    (rf"(?:temperature|temp|fever)\D{{0,10}}{_NUM}", "temperature", "°C"),
    (rf"(?:weight|weigh)\D{{0,10}}{_NUM}\s*(?:kg)?", "weight", "kg"),
    (rf"(?:glucose|sugar)\D{{0,10}}{_NUM}", "blood_glucose", "mmol/L"),
    (rf"(?:spo2|oxygen|saturation)\D{{0,10}}{_NUM}", "spo2", "%"),
    (rf"(?:slept|sleep)\D{{0,10}}{_NUM}\s*(?:hours|hrs|h)", "sleep_hours", "h"),
    (rf"{_NUM}\s*steps", "steps", "steps"),
]


def extract_with_rules(text: str) -> list[ExtractedObservation]:
    out: list[ExtractedObservation] = []
    lowered = text.lower()

    def num(s: str) -> float:
        return float(s.replace(",", "."))

    # blood pressure: "120/80", "pressure 100 over 70", "pressure 100"
    bp = re.search(rf"{_NUM}\s*(?:/|over)\s*{_NUM}", lowered)
    if bp and 40 <= num(bp.group(1)) <= 300:
        out.append(ExtractedObservation(metric="blood_pressure_systolic", value_num=num(bp.group(1)), unit="mmHg"))
        out.append(ExtractedObservation(metric="blood_pressure_diastolic", value_num=num(bp.group(2)), unit="mmHg"))
    else:
        single = re.search(rf"(?:pressure|bp)\D{{0,10}}{_NUM}", lowered)
        if single:
            out.append(ExtractedObservation(metric="blood_pressure_systolic", value_num=num(single.group(1)), unit="mmHg"))

    consumed = {(bp.start(), bp.end())} if bp else set()
    for pattern, code, unit in _PATTERNS:
        m = re.search(pattern, lowered)
        if m and not any(s <= m.start(1) < e for s, e in consumed):
            out.append(ExtractedObservation(metric=code, value_num=num(m.group(1)), unit=unit))

    # dedupe by metric, keep first
    seen: set[str] = set()
    return [o for o in out if not (o.metric in seen or seen.add(o.metric))]


def extract_observations(
    text: str, catalog: list[tuple[str, str, str | None]]
) -> tuple[list[ExtractedObservation], str]:
    """Returns (observations, parser) where parser is 'claude' or 'rules'."""
    try:
        return extract_with_claude(text, catalog), "claude"
    except Exception:
        # no API key / no network / SDK missing — degrade to the rule parser
        return extract_with_rules(text), "rules"

"""Normalize free-text lab results from clinic EHR uploads into structured JSON.

Google Gemini (google-genai) with a JSON response schema — handles Georgian
analyte names and maps them onto our metric catalog so the values become
chartable observations. Gemini is required: clinic documents vary too much
for a rule-based parser, so failures surface to the caller instead of
degrading silently.
"""
import json
import os
from typing import Literal

from pydantic import BaseModel, Field

from .config import settings


_gemini_client = None


def _adc_file() -> str | None:
    """Locate the gcloud Application Default Credentials JSON: explicit
    GOOGLE_APPLICATION_CREDENTIALS first, then gcloud's well-known paths."""
    candidates = [
        settings.google_application_credentials,
        os.path.join(os.path.expanduser("~"), ".config", "gcloud",
                     "application_default_credentials.json"),
    ]
    if os.environ.get("APPDATA"):  # gcloud's location on Windows
        candidates.append(os.path.join(os.environ["APPDATA"], "gcloud",
                                       "application_default_credentials.json"))
    return next((p for p in candidates if p and os.path.isfile(p)), None)


def _vertex_project(adc_path: str) -> str | None:
    """Vertex AI needs an explicit project; when GOOGLE_CLOUD_PROJECT is not
    set, take it from the ADC file (quota project from `gcloud auth
    application-default login`, or the service-account key's own project)."""
    if settings.google_cloud_project:
        return settings.google_cloud_project
    try:
        with open(adc_path, encoding="utf-8") as f:
            data = json.load(f)
        return data.get("quota_project_id") or data.get("project_id")
    except (OSError, ValueError):
        return None


def _client():
    """Cached GenAI client. Must stay referenced at module level: the SDK
    closes its HTTP session when a Client is garbage-collected.
    Prefers Vertex AI with gcloud Application Default Credentials
    (`gcloud auth application-default login`); falls back to a Developer API
    key. Billing follows the Google Cloud project either way."""
    global _gemini_client
    if _gemini_client is None:
        from google import genai

        adc = _adc_file()
        project = _vertex_project(adc) if adc else None
        if adc and project:
            # google-auth also honors this env var; point it at the file we
            # found so non-well-known paths from settings work too.
            os.environ.setdefault("GOOGLE_APPLICATION_CREDENTIALS", adc)
            _gemini_client = genai.Client(
                vertexai=True,
                project=project,
                location=settings.google_cloud_location,
            )
        elif settings.gemini_api_key:
            _gemini_client = genai.Client(api_key=settings.gemini_api_key)
        else:
            raise RuntimeError(
                "No Gemini credentials: provide gcloud ADC (`gcloud auth "
                "application-default login`, plus GOOGLE_CLOUD_PROJECT if the "
                "ADC file has no quota project) or set GEMINI_API_KEY"
            )
    return _gemini_client


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
    from google.genai import types

    response = _client().models.generate_content(
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
    from google.genai import types

    instruction = (
        "Transcribe this audio recording verbatim, in the language spoken"
        + (f" (likely {language})" if language else "")
        + ". Return only the transcribed text with normal punctuation — no "
        "commentary, no labels. If there is no intelligible speech, return "
        "an empty string."
    )
    response = _client().models.generate_content(
        model=settings.gemini_model,
        contents=[
            types.Part.from_bytes(data=audio, mime_type=mime_type.split(";")[0]),
            instruction,
        ],
        config=types.GenerateContentConfig(temperature=0),
    )
    return (response.text or "").strip()


class VoiceObservation(BaseModel):
    metric: str = Field(description="Metric code from the catalog, or a new snake_case code (e.g. 'diarrhea') if none fits")
    value_num: float | None = Field(default=None, description="Numeric value if one was stated")
    value_text: str | None = Field(default=None, description="For symptoms without a number: 'present', or the stated severity/description")
    unit: str | None = Field(default=None, description="Unit of value_num (catalog unit when mapped)")

class VoiceProfileItem(BaseModel):
    item_type: Literal["allergy", "chronic_condition", "medication", "past_disease"]
    name: str = Field(description="The allergen / condition / drug name")
    detail: str | None = Field(default=None, description="Dose, reaction, or other stated detail")

class VoiceHealthExtraction(BaseModel):
    observations: list[VoiceObservation]
    profile_items: list[VoiceProfileItem]


def _voice_prompt(catalog: list[tuple[str, str, str | None]]) -> str:
    lines = "\n".join(f"- {code}: {name}" + (f" ({unit})" if unit else "")
                      for code, name, unit in catalog)
    return (
        "You extract structured health data from a transcribed voice note in which "
        "a patient talks about their own health (any language).\n\n"
        "Into `observations` put measurements and symptoms:\n"
        "- Map each measurement to a metric code from this catalog when it is the "
        "same quantity, converting to the catalog unit:\n"
        f"{lines}\n"
        "- A symptom with no number (e.g. 'today I had diarrhea', 'my head hurts') "
        "becomes a clear snake_case metric (diarrhea, headache, ...) with "
        "value_text 'present' or the stated severity.\n\n"
        "Into `profile_items` put durable facts: allergies, chronic conditions, "
        "medications the patient takes, past diseases.\n\n"
        "Only extract what the patient explicitly states about themselves — never "
        "infer, never diagnose. If the note contains no health information, return "
        "empty lists."
    )


def extract_health_data(
    transcript: str, catalog: list[tuple[str, str, str | None]]
) -> VoiceHealthExtraction:
    from google.genai import types

    response = _client().models.generate_content(
        model=settings.gemini_model,
        contents=f"Voice note transcript:\n{transcript}",
        config=types.GenerateContentConfig(
            system_instruction=_voice_prompt(catalog),
            response_mime_type="application/json",
            response_schema=VoiceHealthExtraction,
            temperature=0,
        ),
    )
    parsed = response.parsed
    if isinstance(parsed, VoiceHealthExtraction):
        return parsed
    return VoiceHealthExtraction.model_validate_json(response.text)


# ---------- clinic EHR: catch-all for sections the XML parser skips ----------

class EhrExtraActivity(BaseModel):
    # lab_test / consultation / *_other_recommendation are absent on purpose:
    # the deterministic importer owns those sections, so the schema itself
    # prevents duplicates.
    activity_type: Literal[
        "examination_note", "observation", "diagnostic_exam",
        "accompanying_activity", "prescription", "blood_transfusion",
        "intensive_care", "anesthesia", "operation_protocol",
        "surgical_intervention", "histomorphology", "discharge_surgery",
        "discharge_instrumental_exam", "discharge_lab_test",
        "discharge_consultation", "discharge_eprescription",
        "discharge_prescription",
    ] = Field(description="MoH EHR section this record belongs to (closest match)")
    name: str | None = Field(default=None, description="Procedure / drug / examination / activity name")
    ncsp: str | None = Field(default=None, description="NCSP intervention code if stated")
    icd10: str | None = Field(default=None, description="ICD-10 code if stated")
    started_at: str | None = Field(default=None, description="Start date/time, ISO 8601")
    ended_at: str | None = Field(default=None, description="End date/time, ISO 8601")
    result: str | None = Field(default=None, description="Result / protocol / dosage / comment, verbatim from the document")


class EhrExtraDiagnosis(BaseModel):
    kind: Literal["preliminary", "clinical", "final_comorbidity", "final_complication"]
    icd10: str = Field(description="ICD-10 code")
    description: str | None = Field(default=None, description="Diagnosis text as written")
    established_at: str | None = Field(default=None, description="Date established, ISO 8601")


class EhrHeaderExtras(BaseModel):
    """Episode-level fields the fixed-path parser does not read; the importer
    applies them only where the assessment column is still empty."""
    transportation_type: str | None = Field(default=None, description="How the patient arrived / was transported")
    preliminary_diagnosis_icd10: str | None = None
    clinical_diagnosis_icd10: str | None = None
    treatment_notes: str | None = Field(default=None, description="Treatment / pharmacotherapy summary")
    disease_outcome: str | None = Field(default=None, description="Disease outcome (e.g. improvement, recovery)")
    outcome: str | None = Field(default=None, description="Overall episode outcome text")


class EhrExtrasExtraction(BaseModel):
    activities: list[EhrExtraActivity]
    diagnoses: list[EhrExtraDiagnosis]
    header: EhrHeaderExtras


_EHR_EXTRAS_PROMPT = (
    "You extract structured data from a Georgian MoH-style clinic EHR XML "
    "document. A deterministic importer has ALREADY stored these parts — never "
    "repeat them:\n"
    "- EHRInfo header, PatientInfo, TypeOfHospitalization, Simptoms\n"
    "- Discharge/HospitalizationOutcome and FinalDiagnosis/PrimaryDisease\n"
    "- Hospitalization/Visits\n"
    "- TreatmentProcess/LabTest and TreatmentProcess/Consultations records\n"
    "- RecommendationsAfterDischarge/RecommendationOther records\n\n"
    "Extract EVERYTHING ELSE the document contains:\n"
    "- Into `activities`: every other treatment-process or post-discharge "
    "record — prescriptions/medications, examinations, operations, blood "
    "transfusions, anesthesia, histomorphology, discharge recommendations for "
    "surgery / instrumental exams / lab tests / consultations / prescriptions, "
    "and anything similar — choosing the closest activity_type. Keep "
    "original-language text verbatim in `result`; dates as ISO 8601.\n"
    "- Into `diagnoses`: preliminary and clinical diagnoses, and final "
    "comorbidities or complications (NOT the primary final diagnosis).\n"
    "- Into `header`: the listed episode-level fields when the document states "
    "them.\n"
    "Placeholder values like 'არა აქვს' or empty elements mean missing. Never "
    "invent data; omit whatever the document does not contain."
)


def extract_ehr_extras(xml_text: str) -> EhrExtrasExtraction:
    from google.genai import types

    response = _client().models.generate_content(
        model=settings.gemini_model,
        contents=f"EHR XML document:\n{xml_text}",
        config=types.GenerateContentConfig(
            system_instruction=_EHR_EXTRAS_PROMPT,
            response_mime_type="application/json",
            response_schema=EhrExtrasExtraction,
            temperature=0,
        ),
    )
    parsed = response.parsed
    if isinstance(parsed, EhrExtrasExtraction):
        return parsed
    return EhrExtrasExtraction.model_validate_json(response.text)

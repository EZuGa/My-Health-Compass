from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

EpisodeType = Literal["inpatient", "day_hospital", "emergency_outpatient", "outpatient"]


# ---------- auth ----------

class RegisterIn(BaseModel):
    role: Literal["patient", "doctor"]
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    personal_number: str | None = None
    date_of_birth: date | None = None
    phone: str | None = None
    blood_group: str | None = None
    specialty: str | None = None  # required for doctors (validated in the route)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    email: str
    full_name: str
    personal_number: str | None
    date_of_birth: date | None
    phone: str | None
    blood_group: str | None
    specialty: str | None


# ---------- categories ----------

class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str


# ---------- assessments ----------

DiagnosisKind = Literal["preliminary", "clinical", "final_main", "final_comorbidity", "final_complication"]

ActivityType = Literal[
    "examination_note", "observation", "diagnostic_exam", "lab_test", "consultation",
    "accompanying_activity", "other_recommendation", "prescription", "blood_transfusion",
    "intensive_care", "anesthesia", "operation_protocol", "surgical_intervention", "histomorphology",
    "discharge_surgery", "discharge_instrumental_exam", "discharge_lab_test", "discharge_consultation",
    "discharge_other_recommendation", "discharge_eprescription", "discharge_prescription",
]


class DiagnosisIn(BaseModel):
    kind: DiagnosisKind
    icd10_code: str
    description: str | None = None
    established_at: datetime | None = None
    disease_course: str | None = None        # mandatory for final_* kinds
    refined_icd10: str | None = None


class DiagnosisOut(DiagnosisIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class VisitIn(BaseModel):
    started_at: datetime
    ended_at: datetime | None = None         # mandatory; ≤ 24h after start
    comment: str | None = None


class VisitOut(VisitIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ActivityIn(BaseModel):
    activity_type: ActivityType
    name: str | None = None                  # NCSP / lab / drug / activity name
    ncsp_code: str | None = None
    icd10_code: str | None = None
    care: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    result_date: datetime | None = None
    result_note: str | None = None
    details: dict | None = None              # e.g. {"specialty": ..., "consultant_name": ...}


class ActivityOut(ActivityIn):
    model_config = ConfigDict(from_attributes=True)

    id: int


class AssessmentIn(BaseModel):
    patient_id: int
    category_code: str                       # e.g. "cardiology"
    episode_type: EpisodeType = "outpatient"
    # medical record header
    medical_record_number: str | None = None
    visit_date: datetime | None = None       # admission date/time
    first_visit_end_at: datetime | None = None
    discharge_at: datetime | None = None
    case_number: str | None = None
    # disease anamnesis
    transportation_type: str | None = None
    hospitalization_type: str | None = None
    complaints: str | None = None
    hospitalized_for_this_disease: bool | None = None
    referring_institution: str | None = None
    referral_date: date | None = None
    # legacy single-value diagnosis fields
    preliminary_diagnosis_icd10: str | None = None
    clinical_diagnosis_icd10: str | None = None
    final_diagnosis_icd10: str | None = None
    diagnosis_description: str | None = None
    treatment_notes: str | None = None
    recommendations: str | None = None
    outcome: str | None = None
    # episode outcome
    episode_result: str | None = None
    disease_outcome: str | None = None
    outcome_comment: str | None = None
    # nested records may be sent inline at creation
    diagnoses: list[DiagnosisIn] = []
    visits: list[VisitIn] = []
    activities: list[ActivityIn] = []


class AssessmentUpdate(BaseModel):
    """Partial update of episode header/anamnesis/outcome fields while the episode is open."""
    medical_record_number: str | None = None
    visit_date: datetime | None = None
    first_visit_end_at: datetime | None = None
    discharge_at: datetime | None = None
    case_number: str | None = None
    transportation_type: str | None = None
    hospitalization_type: str | None = None
    complaints: str | None = None
    hospitalized_for_this_disease: bool | None = None
    referring_institution: str | None = None
    referral_date: date | None = None
    diagnosis_description: str | None = None
    treatment_notes: str | None = None
    recommendations: str | None = None
    outcome: str | None = None
    episode_result: str | None = None
    disease_outcome: str | None = None
    outcome_comment: str | None = None


class CompletionResult(BaseModel):
    completed: bool
    errors: list[str] = []
    bed_days: int | None = None


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    file_path: str
    original_name: str | None
    description: str | None
    uploaded_at: datetime


class AssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    doctor_name: str | None = None
    category: CategoryOut
    episode_type: str
    status: str = "open"
    medical_record_number: str | None = None
    visit_date: datetime
    first_visit_end_at: datetime | None = None
    discharge_at: datetime | None = None
    case_number: str | None = None
    transportation_type: str | None = None
    hospitalization_type: str | None = None
    complaints: str | None
    hospitalized_for_this_disease: bool | None = None
    referring_institution: str | None = None
    referral_date: date | None = None
    preliminary_diagnosis_icd10: str | None
    clinical_diagnosis_icd10: str | None
    final_diagnosis_icd10: str | None
    diagnosis_description: str | None
    treatment_notes: str | None
    recommendations: str | None
    outcome: str | None
    episode_result: str | None = None
    disease_outcome: str | None = None
    outcome_comment: str | None = None
    bed_days: int | None = None
    completed_at: datetime | None = None
    images: list[ImageOut] = []
    diagnoses: list[DiagnosisOut] = []
    visits: list[VisitOut] = []
    activities: list[ActivityOut] = []


class CategoryHistoryOut(BaseModel):
    category: CategoryOut
    assessments: list[AssessmentOut]


# ---------- profile items (anamnesis vitae) ----------

ProfileItemType = Literal[
    "allergy", "chronic_condition", "medication", "immunization",
    "surgery", "screening", "family_history", "social_history",
]


class ProfileItemIn(BaseModel):
    item_type: ProfileItemType
    name: str = Field(min_length=1, max_length=255)
    detail: str | None = None
    icd10: str | None = None
    occurred_on: date | None = None


class ProfileItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    item_type: str
    name: str
    detail: str | None
    icd10: str | None
    occurred_on: date | None
    created_at: datetime


# ---------- observations (health metrics) ----------

class ObservationIn(BaseModel):
    box: str = Field(min_length=1, max_length=50)       # heart, metabolic, fitness, sleep, mind, exposures
    metric: str = Field(min_length=1, max_length=100)   # e.g. systolic_bp, hba1c, weight
    value_num: float | None = None
    value_text: str | None = None
    unit: str | None = None
    observed_at: datetime | None = None
    source_kind: str | None = None                      # manual | wearable | document | emr | voice
    source_label: str | None = None
    note: str | None = None


class CategoryMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    unit: str | None
    box: str | None
    reference: str | None = None
    range_low: float | None = None
    range_high: float | None = None
    modality: str | None = None
    diagnostic_group: str | None = None


# ---------- catalog (boxes / sections) ----------

class BoxOut(BaseModel):
    id: str
    title: str
    subtitle: str
    metrics: list[CategoryMetricOut] = []


class SectionOut(BaseModel):
    id: str
    title: str


# ---------- calendar ----------

class CalendarEventIn(BaseModel):
    kind: Literal["appointment", "reminder", "medication"] = "appointment"
    title: str = Field(min_length=1, max_length=255)
    event_date: date
    event_time: str | None = None
    detail: str | None = None


class CalendarEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    title: str
    event_date: date
    event_time: str | None
    detail: str | None
    created_at: datetime


class ObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    recorded_by: int | None
    category_id: int | None
    box: str
    metric: str
    value_num: float | None
    value_text: str | None
    unit: str | None
    observed_at: datetime
    source_kind: str | None
    source_label: str | None
    note: str | None


# ---------- patient documents ----------

class PatientDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    original_name: str | None
    mime: str | None
    summary: str | None
    source_kind: str | None
    occurred_at: datetime
    created_at: datetime


# ---------- timeline ----------

class TimelineEvent(BaseModel):
    date: datetime
    event_type: Literal["assessment", "observation", "document", "profile_item"]
    id: int                       # id within its own table
    title: str
    detail: str | None = None
    category_code: str | None = None   # assessments only


# ---------- access requests ----------

class AccessRequestIn(BaseModel):
    patient_personal_number: str | None = None  # doctor identifies the patient
    patient_id: int | None = None               # ...or directly by id
    category_code: str
    reason: str | None = None


class AccessRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    doctor_name: str | None = None
    patient_id: int
    patient_name: str | None = None
    category: CategoryOut
    reason: str | None
    status: str
    requested_at: datetime
    decided_at: datetime | None
    expires_at: datetime | None

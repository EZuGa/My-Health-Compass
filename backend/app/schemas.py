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

class AssessmentIn(BaseModel):
    patient_id: int
    category_code: str                       # e.g. "cardiology"
    episode_type: EpisodeType = "outpatient"
    visit_date: datetime | None = None
    complaints: str | None = None
    preliminary_diagnosis_icd10: str | None = None
    clinical_diagnosis_icd10: str | None = None
    final_diagnosis_icd10: str | None = None
    diagnosis_description: str | None = None
    treatment_notes: str | None = None
    recommendations: str | None = None
    outcome: str | None = None


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
    visit_date: datetime
    complaints: str | None
    preliminary_diagnosis_icd10: str | None
    clinical_diagnosis_icd10: str | None
    final_diagnosis_icd10: str | None
    diagnosis_description: str | None
    treatment_notes: str | None
    recommendations: str | None
    outcome: str | None
    images: list[ImageOut] = []


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

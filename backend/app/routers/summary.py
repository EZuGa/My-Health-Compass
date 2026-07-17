"""One-call patient summary — everything a doctor needs at the start of a visit:
demographics, allergies, chronic conditions, medications, latest vitals,
recent assessments (an active grant from the patient opens the full record).

Also the full EHR summary (`/doctors/patients/{id}/ehr-summary`) laid out after
the MoH "Summary List for History" spec — the read view a doctor gets of a
patient's record: history header, patient info, anamnesis vitae, and the
hospitalization episodes with their treatment process and discharge blocks."""
from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_doctor
from ..database import get_db
from ..models import Assessment, Observation, ProfileItem, User
from ..schemas import AssessmentOut, ObservationOut, ProfileItemOut
from .helpers import require_patient_readable, to_assessment_out
from .wearables import latest_vitals

router = APIRouter(tags=["patient summary"])


class PatientSummary(BaseModel):
    # demographics / identifiers
    patient_id: int
    full_name: str
    personal_number: str | None
    date_of_birth: date | None
    age: int | None
    blood_group: str | None
    phone: str | None
    # anamnesis vitae highlights
    allergies: list[ProfileItemOut]
    chronic_conditions: list[ProfileItemOut]
    medications: list[ProfileItemOut]
    # data
    latest_vitals: list[ObservationOut]
    recent_assessments: list[AssessmentOut]
    generated_at: datetime


@router.get("/patients/{patient_id}/summary", response_model=PatientSummary)
def patient_summary(
    patient_id: int,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = require_patient_readable(db, viewer, patient_id)

    items = db.scalars(
        select(ProfileItem).where(
            ProfileItem.patient_id == patient_id,
            ProfileItem.item_type.in_(["allergy", "chronic_condition", "medication"]),
        )
    ).all()
    grouped: dict[str, list[ProfileItemOut]] = {"allergy": [], "chronic_condition": [], "medication": []}
    for it in items:
        grouped[it.item_type].append(ProfileItemOut.model_validate(it))

    # require_patient_readable already gated access: patients see their own
    # record, doctors hold an active grant — which opens all categories.
    visible = db.scalars(
        select(Assessment)
        .where(Assessment.patient_id == patient_id)
        .order_by(Assessment.visit_date.desc())
        .limit(5)
    ).all()

    today = date.today()
    age = None
    if patient.date_of_birth:
        dob = patient.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return PatientSummary(
        patient_id=patient.id,
        full_name=patient.full_name,
        personal_number=patient.personal_number,
        date_of_birth=patient.date_of_birth,
        age=age,
        blood_group=patient.blood_group,
        phone=patient.phone,
        allergies=grouped["allergy"],
        chronic_conditions=grouped["chronic_condition"],
        medications=grouped["medication"],
        latest_vitals=[ObservationOut.model_validate(o)
                       for o in latest_vitals(patient_id, viewer, db)],
        recent_assessments=[to_assessment_out(a) for a in visible],
        generated_at=datetime.now(),
    )


# ---------- full EHR summary (Summary List for History layout) ----------

class PatientInfoBlock(BaseModel):
    """ინფორმაცია პაციენტზე"""
    patient_id: int
    full_name: str
    personal_number: str | None
    date_of_birth: date | None
    age: int | None
    blood_group: str | None
    address_region: str | None
    address_actual: str | None
    phone: str | None
    email: str


class AnamnesisVitaeBlock(BaseModel):
    """ცხოვრების ანამნეზი — mirrors the Summary List blocks: immunizations,
    screenings, pregnancy statistics, past diseases, chronic conditions,
    blood transfusions, surgeries, allergies, family/social history."""
    immunizations: list[ProfileItemOut]
    screenings: list[ProfileItemOut]
    pregnancy_statistics: list[ProfileItemOut]
    past_diseases: list[ProfileItemOut]
    chronic_conditions: list[ProfileItemOut]
    blood_transfusions: list[ProfileItemOut]
    surgeries: list[ProfileItemOut]
    allergies: list[ProfileItemOut]
    medications: list[ProfileItemOut]
    family_history: list[ProfileItemOut]
    social_history: list[ProfileItemOut]


class EhrSummary(BaseModel):
    """Doctor read view of the patient record, after the MoH Summary List spec.

    Episodes carry the full write-side detail (anamnesis morbi, diagnoses,
    treatment-process activities, discharge and post-discharge blocks); the
    patient's grant opens every category."""
    patient: PatientInfoBlock
    anamnesis_vitae: AnamnesisVitaeBlock
    episodes: list[AssessmentOut]
    accessible_categories: list[str]
    generated_at: datetime


@router.get("/doctors/patients/{patient_id}/ehr-summary", response_model=EhrSummary)
def ehr_summary(
    patient_id: int,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    patient = require_patient_readable(db, doctor, patient_id)

    items = db.scalars(
        select(ProfileItem)
        .where(ProfileItem.patient_id == patient_id)
        .order_by(ProfileItem.occurred_on.desc().nullslast())
    ).all()
    grouped: dict[str, list[ProfileItemOut]] = {}
    for it in items:
        grouped.setdefault(it.item_type, []).append(ProfileItemOut.model_validate(it))

    assessments = db.scalars(
        select(Assessment)
        .where(Assessment.patient_id == patient_id)
        .order_by(Assessment.visit_date.desc())
    ).all()
    # The grant checked by require_patient_readable covers the whole record.
    episodes, categories = [], set()
    for a in assessments:
        episodes.append(to_assessment_out(a))
        categories.add(a.category.code)

    today = date.today()
    age = None
    if patient.date_of_birth:
        dob = patient.date_of_birth
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    return EhrSummary(
        patient=PatientInfoBlock(
            patient_id=patient.id,
            full_name=patient.full_name,
            personal_number=patient.personal_number,
            date_of_birth=patient.date_of_birth,
            age=age,
            blood_group=patient.blood_group,
            address_region=patient.address_region,
            address_actual=patient.address_actual,
            phone=patient.phone,
            email=patient.email,
        ),
        anamnesis_vitae=AnamnesisVitaeBlock(
            immunizations=grouped.get("immunization", []),
            screenings=grouped.get("screening", []),
            pregnancy_statistics=grouped.get("pregnancy", []),
            past_diseases=grouped.get("past_disease", []),
            chronic_conditions=grouped.get("chronic_condition", []),
            blood_transfusions=grouped.get("blood_transfusion", []),
            surgeries=grouped.get("surgery", []),
            allergies=grouped.get("allergy", []),
            medications=grouped.get("medication", []),
            family_history=grouped.get("family_history", []),
            social_history=grouped.get("social_history", []),
        ),
        episodes=episodes,
        accessible_categories=sorted(categories),
        generated_at=datetime.now(),
    )

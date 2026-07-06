"""One-call patient summary — everything a doctor needs at the start of a visit:
demographics, allergies, chronic conditions, medications, latest vitals,
recent assessments (scoped to the doctor's grants)."""
from datetime import date, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Assessment, Observation, ProfileItem, User
from ..schemas import AssessmentOut, ObservationOut, ProfileItemOut
from .helpers import has_active_grant, require_patient_readable, to_assessment_out
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

    assessments = db.scalars(
        select(Assessment)
        .where(Assessment.patient_id == patient_id)
        .order_by(Assessment.visit_date.desc())
        .limit(20)
    ).all()
    visible = [
        a for a in assessments
        if viewer.role == "patient"
        or a.doctor_id == viewer.id
        or has_active_grant(db, viewer.id, patient_id, a.category_id)
    ][:5]

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

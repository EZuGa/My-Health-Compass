"""Role-specific dashboard endpoints.

The app has two separate dashboards: the patient UI and the doctor UI.
After login the frontend reads `role` from /auth/me and routes accordingly;
each dashboard then loads its data with a single call here.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import require_doctor, require_patient
from ..database import get_db
from ..models import (
    AccessRequest, Assessment, Category, Observation, PatientDocument, User,
)
from ..schemas import (
    AccessRequestOut, AssessmentOut, CategoryOut, ObservationOut, UserOut,
)
from .access import _to_out as access_request_out
from .helpers import to_assessment_out
from .wearables import latest_vitals

router = APIRouter(prefix="/dashboard", tags=["dashboards"])


# ---------- patient dashboard ----------

class CategorySummary(BaseModel):
    category: CategoryOut
    assessment_count: int
    last_visit: datetime | None


class PatientDashboard(BaseModel):
    user: UserOut
    pending_access_requests: list[AccessRequestOut]   # waiting for my approval
    categories: list[CategorySummary]                 # my history per category
    latest_vitals: list[ObservationOut]
    observation_count: int
    document_count: int


@router.get("/patient", response_model=PatientDashboard)
def patient_dashboard(patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    pending = db.scalars(
        select(AccessRequest)
        .where(AccessRequest.patient_id == patient.id, AccessRequest.status == "pending")
        .order_by(AccessRequest.requested_at.desc())
    ).all()

    cat_rows = db.execute(
        select(Category, func.count(Assessment.id), func.max(Assessment.visit_date))
        .join(Assessment, Assessment.category_id == Category.id)
        .where(Assessment.patient_id == patient.id)
        .group_by(Category.id)
    ).all()

    return PatientDashboard(
        user=UserOut.model_validate(patient),
        pending_access_requests=[access_request_out(r) for r in pending],
        categories=[
            CategorySummary(category=CategoryOut.model_validate(c), assessment_count=n, last_visit=last)
            for c, n, last in cat_rows
        ],
        latest_vitals=[ObservationOut.model_validate(o)
                       for o in latest_vitals(patient.id, patient, db)][:12],
        observation_count=db.scalar(
            select(func.count(Observation.id)).where(Observation.patient_id == patient.id)) or 0,
        document_count=db.scalar(
            select(func.count(PatientDocument.id)).where(PatientDocument.patient_id == patient.id)) or 0,
    )


# ---------- doctor dashboard ----------

class ActiveGrant(BaseModel):
    request_id: int
    patient_id: int
    patient_name: str
    category: CategoryOut
    expires_at: datetime | None


class DoctorDashboard(BaseModel):
    user: UserOut
    active_grants: list[ActiveGrant]        # patients whose data I can open now
    pending_requests: list[AccessRequestOut]  # waiting for patient approval
    recent_assessments: list[AssessmentOut]
    assessment_count: int
    patient_count: int                       # distinct patients I have assessed


@router.get("/doctor", response_model=DoctorDashboard)
def doctor_dashboard(doctor: User = Depends(require_doctor), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    approved = db.scalars(
        select(AccessRequest).where(
            AccessRequest.doctor_id == doctor.id,
            AccessRequest.status == "approved",
        )
    ).all()
    active = [
        r for r in approved
        if r.expires_at is None
        or (r.expires_at.replace(tzinfo=timezone.utc) if r.expires_at.tzinfo is None else r.expires_at) > now
    ]

    pending = db.scalars(
        select(AccessRequest)
        .where(AccessRequest.doctor_id == doctor.id, AccessRequest.status == "pending")
        .order_by(AccessRequest.requested_at.desc())
    ).all()

    recent = db.scalars(
        select(Assessment)
        .where(Assessment.doctor_id == doctor.id)
        .order_by(Assessment.visit_date.desc())
        .limit(5)
    ).all()

    return DoctorDashboard(
        user=UserOut.model_validate(doctor),
        active_grants=[
            ActiveGrant(
                request_id=r.id, patient_id=r.patient_id,
                patient_name=r.patient.full_name if r.patient else "",
                category=CategoryOut.model_validate(r.category),
                expires_at=r.expires_at,
            ) for r in active
        ],
        pending_requests=[access_request_out(r) for r in pending],
        recent_assessments=[to_assessment_out(a) for a in recent],
        assessment_count=db.scalar(
            select(func.count(Assessment.id)).where(Assessment.doctor_id == doctor.id)) or 0,
        patient_count=db.scalar(
            select(func.count(func.distinct(Assessment.patient_id)))
            .where(Assessment.doctor_id == doctor.id)) or 0,
    )

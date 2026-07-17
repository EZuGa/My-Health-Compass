from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import AccessRequest, Assessment, Category
from ..schemas import AssessmentOut


def get_category_or_404(db: Session, code: str) -> Category:
    category = db.scalar(select(Category).where(Category.code == code))
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown category '{code}'")
    return category


def has_any_active_grant(db: Session, doctor_id: int, patient_id: int) -> bool:
    """True if the patient approved this doctor and the grant hasn't expired.

    An approved grant opens the patient's whole record — the category on the
    request only records what prompted the ask, it does not scope access.
    """
    now = datetime.now(timezone.utc)
    grant = db.scalar(
        select(AccessRequest).where(
            AccessRequest.doctor_id == doctor_id,
            AccessRequest.patient_id == patient_id,
            AccessRequest.status == "approved",
            (AccessRequest.expires_at.is_(None)) | (AccessRequest.expires_at > now),
        )
    )
    return grant is not None


def require_patient_readable(db: Session, viewer, patient_id: int):
    """Return the patient if `viewer` may read their data.

    Patients read themselves; doctors need an active grant.
    """
    from ..models import User  # local import to avoid cycle at module load

    patient = db.get(User, patient_id)
    if patient is None or patient.role != "patient":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    if viewer.role == "patient":
        if viewer.id != patient_id:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own data")
    elif not has_any_active_grant(db, viewer.id, patient_id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "No active access grant from this patient. Request access first.",
        )
    return patient


def to_assessment_out(a: Assessment) -> AssessmentOut:
    out = AssessmentOut.model_validate(a)
    if a.doctor:
        out.doctor_name = a.doctor.full_name
        out.doctor_personal_number = a.doctor.personal_number
    return out

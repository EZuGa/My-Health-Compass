from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_doctor, require_patient
from ..config import settings
from ..database import get_db
from ..models import AccessRequest, User
from ..schemas import AccessRequestIn, AccessRequestOut
from .helpers import get_category_or_404

router = APIRouter(prefix="/access-requests", tags=["access requests"])


def _to_out(r: AccessRequest) -> AccessRequestOut:
    out = AccessRequestOut.model_validate(r)
    out.doctor_name = r.doctor.full_name if r.doctor else None
    out.patient_name = r.patient.full_name if r.patient else None
    return out


@router.post("", response_model=AccessRequestOut, status_code=status.HTTP_201_CREATED)
def request_access(
    data: AccessRequestIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Doctor asks for access to a patient's record. The category records what
    prompted the request; an approved grant opens the full record."""
    if data.patient_id is not None:
        patient = db.get(User, data.patient_id)
    elif data.patient_personal_number:
        patient = db.scalar(
            select(User).where(
                User.personal_number == data.patient_personal_number,
                User.role == "patient",
            )
        )
    else:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Provide patient_id or patient_personal_number",
        )
    if patient is None or patient.role != "patient":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")

    category = get_category_or_404(db, data.category_code)

    # Grants are record-wide, so dedupe across categories: any pending request
    # or unexpired grant for this patient makes a new request pointless.
    now = datetime.now(timezone.utc)
    existing = db.scalars(
        select(AccessRequest).where(
            AccessRequest.doctor_id == doctor.id,
            AccessRequest.patient_id == patient.id,
            AccessRequest.status.in_(["pending", "approved"]),
        )
    ).all()
    for r in existing:
        if r.status == "pending":
            raise HTTPException(status.HTTP_409_CONFLICT, "A pending request already exists")
        if r.status == "approved" and (r.expires_at is None or r.expires_at > now):
            raise HTTPException(status.HTTP_409_CONFLICT, "You already have an active grant")

    req = AccessRequest(
        doctor_id=doctor.id,
        patient_id=patient.id,
        category_id=category.id,
        reason=data.reason,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _to_out(req)


@router.get("/incoming", response_model=list[AccessRequestOut])
def incoming_requests(
    status_filter: str | None = None,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    """Patient: requests doctors have made for my data (default: pending only)."""
    q = select(AccessRequest).where(AccessRequest.patient_id == patient.id)
    q = q.where(AccessRequest.status == (status_filter or "pending"))
    rows = db.scalars(q.order_by(AccessRequest.requested_at.desc())).all()
    return [_to_out(r) for r in rows]


@router.get("/outgoing", response_model=list[AccessRequestOut])
def outgoing_requests(
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Doctor: all my requests and their statuses."""
    rows = db.scalars(
        select(AccessRequest)
        .where(AccessRequest.doctor_id == doctor.id)
        .order_by(AccessRequest.requested_at.desc())
    ).all()
    return [_to_out(r) for r in rows]


def _decide(db: Session, patient: User, request_id: int, new_status: str) -> AccessRequest:
    req = db.get(AccessRequest, request_id)
    if req is None or req.patient_id != patient.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if new_status in ("approved", "denied") and req.status != "pending":
        raise HTTPException(status.HTTP_409_CONFLICT, f"Request is already {req.status}")
    if new_status == "revoked" and req.status != "approved":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only approved grants can be revoked")

    req.status = new_status
    req.decided_at = datetime.now(timezone.utc)
    if new_status == "approved":
        req.expires_at = req.decided_at + timedelta(days=settings.access_grant_days)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{request_id}/approve", response_model=AccessRequestOut)
def approve(request_id: int, patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    """Patient approves — the doctor can then read the full record for ACCESS_GRANT_DAYS."""
    return _to_out(_decide(db, patient, request_id, "approved"))


@router.post("/{request_id}/deny", response_model=AccessRequestOut)
def deny(request_id: int, patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    return _to_out(_decide(db, patient, request_id, "denied"))


@router.post("/{request_id}/revoke", response_model=AccessRequestOut)
def revoke(request_id: int, patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    """Patient withdraws a previously approved grant."""
    return _to_out(_decide(db, patient, request_id, "revoked"))

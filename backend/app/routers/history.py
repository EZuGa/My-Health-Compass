from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_doctor, require_patient
from ..database import get_db
from ..models import Assessment, AssessmentImage, Category, CategoryMetric, User
from ..schemas import AssessmentOut, CategoryHistoryOut, CategoryMetricOut, CategoryOut
from .helpers import get_category_or_404, has_active_grant, to_assessment_out

router = APIRouter(tags=["history"])


def _history_for_category(db: Session, patient_id: int, category_id: int) -> list[Assessment]:
    return db.scalars(
        select(Assessment)
        .where(Assessment.patient_id == patient_id, Assessment.category_id == category_id)
        .order_by(Assessment.visit_date.desc())
    ).all()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.get("/categories/{category_code}/metrics", response_model=list[CategoryMetricOut])
def list_category_metrics(
    category_code: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """The metric fields that belong to one category (pulse & BP → cardiology, ...)."""
    category = get_category_or_404(db, category_code)
    return db.scalars(
        select(CategoryMetric).where(CategoryMetric.category_id == category.id)
    ).all()


# ---------- patient: own history ----------

@router.get("/patients/me/history", response_model=list[CategoryHistoryOut])
def my_history(patient: User = Depends(require_patient), db: Session = Depends(get_db)):
    """The patient's full history, grouped by category (only categories with records)."""
    rows = db.scalars(
        select(Assessment)
        .where(Assessment.patient_id == patient.id)
        .order_by(Assessment.visit_date.desc())
    ).all()
    by_category: dict[int, CategoryHistoryOut] = {}
    for a in rows:
        entry = by_category.setdefault(
            a.category_id,
            CategoryHistoryOut(category=CategoryOut.model_validate(a.category), assessments=[]),
        )
        entry.assessments.append(to_assessment_out(a))
    return list(by_category.values())


@router.get("/patients/me/history/{category_code}", response_model=list[AssessmentOut])
def my_history_for_category(
    category_code: str,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    """e.g. GET /patients/me/history/cardiology — all cardiology assessments + images."""
    category = get_category_or_404(db, category_code)
    return [to_assessment_out(a) for a in _history_for_category(db, patient.id, category.id)]


# ---------- doctor: patient history (requires approved access) ----------

@router.get("/doctors/patients/{patient_id}/history/{category_code}", response_model=list[AssessmentOut])
def patient_history_for_doctor(
    patient_id: int,
    category_code: str,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Doctor reads a patient's history for one category — only with an approved, unexpired grant."""
    patient = db.get(User, patient_id)
    if patient is None or patient.role != "patient":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    category = get_category_or_404(db, category_code)

    if not has_active_grant(db, doctor.id, patient.id, category.id):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "No approved access grant for this patient/category. "
            "Create an access request and wait for the patient to approve it.",
        )
    return [to_assessment_out(a) for a in _history_for_category(db, patient.id, category.id)]


# ---------- image download (both roles, permission-checked) ----------

@router.get("/images/{image_id}")
def download_image(
    image_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    image = db.get(AssessmentImage, image_id)
    if image is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    a = image.assessment

    allowed = (
        (user.role == "patient" and a.patient_id == user.id)
        or (user.role == "doctor" and a.doctor_id == user.id)
        or (user.role == "doctor" and has_active_grant(db, user.id, a.patient_id, a.category_id))
    )
    if not allowed:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "No access to this file")

    path = Path(image.file_path)
    if not path.exists():
        raise HTTPException(status.HTTP_410_GONE, "File missing on disk")
    return FileResponse(path, filename=image.original_name or path.name)

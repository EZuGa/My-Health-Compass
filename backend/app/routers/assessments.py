import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_doctor
from ..config import settings
from ..database import get_db
from ..models import Assessment, AssessmentImage, User
from ..schemas import AssessmentIn, AssessmentOut, ImageOut
from .helpers import get_category_or_404, to_assessment_out

router = APIRouter(prefix="/assessments", tags=["assessments (doctor)"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".dcm", ".pdf"}


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
def submit_assessment(
    data: AssessmentIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Doctor submits an assessment for a patient after a visit."""
    patient = db.get(User, data.patient_id)
    if patient is None or patient.role != "patient":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    category = get_category_or_404(db, data.category_code)

    assessment = Assessment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        category_id=category.id,
        episode_type=data.episode_type,
        complaints=data.complaints,
        preliminary_diagnosis_icd10=data.preliminary_diagnosis_icd10,
        clinical_diagnosis_icd10=data.clinical_diagnosis_icd10,
        final_diagnosis_icd10=data.final_diagnosis_icd10,
        diagnosis_description=data.diagnosis_description,
        treatment_notes=data.treatment_notes,
        recommendations=data.recommendations,
        outcome=data.outcome,
    )
    if data.visit_date is not None:
        assessment.visit_date = data.visit_date
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return to_assessment_out(assessment)


@router.post("/{assessment_id}/images", response_model=ImageOut, status_code=status.HTTP_201_CREATED)
def upload_image(
    assessment_id: int,
    file: UploadFile = File(...),
    description: str | None = Form(default=None),
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Attach an image (X-ray, echo, scan, PDF report...) to an assessment you authored."""
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    if assessment.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only attach files to your own assessments")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"File type '{ext}' not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    upload_dir = Path(settings.upload_dir) / str(assessment.patient_id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = upload_dir / stored_name
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    image = AssessmentImage(
        assessment_id=assessment.id,
        file_path=str(dest),
        original_name=file.filename,
        description=description,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.get("/mine", response_model=list[AssessmentOut])
def my_submitted_assessments(
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Assessments this doctor has written."""
    rows = db.scalars(
        select(Assessment)
        .where(Assessment.doctor_id == doctor.id)
        .order_by(Assessment.visit_date.desc())
    ).all()
    return [to_assessment_out(a) for a in rows]

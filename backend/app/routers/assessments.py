import shutil
import uuid
from pathlib import Path

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import require_doctor
from ..config import settings
from ..database import get_db
from ..ehr_validation import (
    compute_bed_days, validate_activity, validate_completion, validate_diagnosis, validate_visit,
)
from ..models import (
    Assessment, AssessmentActivity, AssessmentDiagnosis, AssessmentImage, AssessmentVisit, User,
)
from ..schemas import (
    ActivityIn, ActivityOut, AssessmentIn, AssessmentOut, AssessmentUpdate,
    CompletionResult, DiagnosisIn, DiagnosisOut, ImageOut, VisitIn, VisitOut,
)
from .helpers import get_category_or_404, to_assessment_out

router = APIRouter(prefix="/assessments", tags=["assessments (doctor)"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".dcm", ".pdf"}

HEADER_FIELDS = (
    "medical_record_number", "first_visit_end_at", "discharge_at", "case_number",
    "transportation_type", "hospitalization_type", "complaints",
    "hospitalized_for_this_disease", "referring_institution", "referral_date",
    "diagnosis_description", "treatment_notes", "recommendations", "outcome",
    "episode_result", "disease_outcome", "outcome_comment",
)


def _own_open_assessment(db: Session, assessment_id: int, doctor: User) -> Assessment:
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    if assessment.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only modify your own assessments")
    if assessment.status == "completed":
        raise HTTPException(status.HTTP_409_CONFLICT, "Episode is already completed")
    return assessment


def _raise_if_invalid(errors: list[str]):
    if errors:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, detail=errors)


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
def submit_assessment(
    data: AssessmentIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Doctor opens an assessment (episode) for a patient.

    The episode is created in `open` status; repeatable records (diagnoses,
    visits, treatment activities) can be sent inline here or appended later.
    Red-mandatory fields from the MoH spec are enforced per record on insert
    and per episode at POST /assessments/{id}/complete.
    """
    patient = db.get(User, data.patient_id)
    if patient is None or patient.role != "patient":
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    category = get_category_or_404(db, data.category_code)

    errors = []
    for d in data.diagnoses:
        errors += validate_diagnosis(d.kind, data.episode_type, d.model_dump())
    for v in data.visits:
        errors += validate_visit(data.episode_type, v.started_at, v.ended_at)
    for a in data.activities:
        errors += validate_activity(a.activity_type, data.episode_type, a.model_dump(), a.details)
    _raise_if_invalid(errors)

    assessment = Assessment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        category_id=category.id,
        episode_type=data.episode_type,
        preliminary_diagnosis_icd10=data.preliminary_diagnosis_icd10,
        clinical_diagnosis_icd10=data.clinical_diagnosis_icd10,
        final_diagnosis_icd10=data.final_diagnosis_icd10,
    )
    for field in HEADER_FIELDS:
        setattr(assessment, field, getattr(data, field))
    if data.visit_date is not None:
        assessment.visit_date = data.visit_date
    assessment.diagnoses = [AssessmentDiagnosis(**d.model_dump()) for d in data.diagnoses]
    assessment.visits = [AssessmentVisit(**v.model_dump()) for v in data.visits]
    assessment.activities = [AssessmentActivity(**a.model_dump()) for a in data.activities]
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return to_assessment_out(assessment)


@router.patch("/{assessment_id}", response_model=AssessmentOut)
def update_assessment(
    assessment_id: int,
    data: AssessmentUpdate,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Update episode header / anamnesis / outcome fields while the episode is open."""
    assessment = _own_open_assessment(db, assessment_id, doctor)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(assessment, field, value)
    db.commit()
    db.refresh(assessment)
    return to_assessment_out(assessment)


@router.post("/{assessment_id}/diagnoses", response_model=DiagnosisOut, status_code=status.HTTP_201_CREATED)
def add_diagnosis(
    assessment_id: int,
    data: DiagnosisIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Add a diagnosis record (preliminary / clinical / final main / comorbidity / complication)."""
    assessment = _own_open_assessment(db, assessment_id, doctor)
    _raise_if_invalid(validate_diagnosis(data.kind, assessment.episode_type, data.model_dump()))
    if data.kind == "final_main" and any(d.kind == "final_main" for d in assessment.diagnoses):
        raise HTTPException(status.HTTP_409_CONFLICT, "Episode already has a final main diagnosis (only one allowed)")
    diagnosis = AssessmentDiagnosis(assessment_id=assessment.id, **data.model_dump())
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)
    return diagnosis


@router.post("/{assessment_id}/visits", response_model=VisitOut, status_code=status.HTTP_201_CREATED)
def add_visit(
    assessment_id: int,
    data: VisitIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Add a visit record (non-inpatient episodes; max 24h per visit)."""
    assessment = _own_open_assessment(db, assessment_id, doctor)
    _raise_if_invalid(validate_visit(assessment.episode_type, data.started_at, data.ended_at))
    visit = AssessmentVisit(assessment_id=assessment.id, **data.model_dump())
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.post("/{assessment_id}/activities", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
def add_activity(
    assessment_id: int,
    data: ActivityIn,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Add a treatment-process or post-discharge record (labs, consultations, surgery, prescriptions...)."""
    assessment = _own_open_assessment(db, assessment_id, doctor)
    _raise_if_invalid(
        validate_activity(data.activity_type, assessment.episode_type, data.model_dump(), data.details)
    )
    activity = AssessmentActivity(assessment_id=assessment.id, **data.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


@router.post("/{assessment_id}/complete", response_model=CompletionResult)
def complete_assessment(
    assessment_id: int,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Close the episode: run the MoH red-mandatory checks and compute bed-days.

    Returns 422 with the list of missing mandatory fields if the episode
    does not satisfy the spec for its episode type.
    """
    assessment = _own_open_assessment(db, assessment_id, doctor)
    errors = validate_completion(
        assessment, assessment.diagnoses, assessment.visits, assessment.activities
    )
    _raise_if_invalid(errors)

    assessment.status = "completed"
    assessment.completed_at = datetime.now(timezone.utc)
    assessment.bed_days = compute_bed_days(assessment)
    if assessment.case_number is None:
        assessment.case_number = f"CASE-{assessment.id:06d}"
    db.commit()
    return CompletionResult(completed=True, bed_days=assessment.bed_days)


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


# NOTE: declared after /mine so the literal path wins over the {assessment_id} match.
@router.get("/{assessment_id}", response_model=AssessmentOut)
def get_assessment(
    assessment_id: int,
    doctor: User = Depends(require_doctor),
    db: Session = Depends(get_db),
):
    """Full episode (with diagnoses, visits, activities) — author only."""
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Assessment not found")
    if assessment.doctor_id != doctor.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only view your own assessments here")
    return to_assessment_out(assessment)

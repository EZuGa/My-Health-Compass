"""External clinic integration: a clinic POSTs the patient's MoH-style EHR XML
and we create the episode in the patient's record — header, visits, lab tests
(original text + Gemini-normalized JSON + chartable observations),
consultations, discharge recommendations, and the raw XML as a document.

Authenticated with a shared clinic API key (X-API-Key header), not a user JWT:
the caller is an institution, not an account in our system.
"""
import hashlib
import hmac
import secrets
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import hash_password
from ..config import settings
from ..database import get_db
from ..ehr_xml import ClinicEhr, EhrXmlError, parse_clinic_ehr
from ..gemini import normalize_lab_result
from ..models import (
    Assessment, AssessmentActivity, AssessmentVisit, CategoryMetric, Observation,
    PatientDocument, User,
)
from .helpers import get_category_or_404

router = APIRouter(prefix="/external", tags=["external EHR"])

MAX_XML_BYTES = 2 * 1024 * 1024


def require_clinic_key(x_api_key: str = Header(description="Shared clinic API key")):
    if not settings.clinic_api_key or not hmac.compare_digest(x_api_key, settings.clinic_api_key):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid clinic API key")


def _find_patient(db: Session, ehr: ClinicEhr) -> User:
    candidates = [pn for pn in (ehr.patient_id_number, ehr.responsible_person_id) if pn]
    for pn in candidates:
        patient = db.scalar(
            select(User).where(User.personal_number == pn, User.role == "patient")
        )
        if patient:
            return patient
    raise HTTPException(
        status.HTTP_404_NOT_FOUND,
        f"No registered patient matches personal number(s) {candidates or '—'}. "
        "The patient must have a My Health Compass account with that personal number.",
    )


def _attribute_doctor(db: Session, ehr: ClinicEhr) -> User:
    """The consulting doctor if they are registered here, else an account
    representing the clinic itself (episodes need an author)."""
    for c in ehr.consultations:
        if c.doctor_name:
            doctor = db.scalar(
                select(User).where(User.full_name == c.doctor_name, User.role == "doctor")
            )
            if doctor:
                return doctor

    hospital = ehr.hospital_name or "External clinic"
    email = f"clinic+{hashlib.sha1(hospital.encode()).hexdigest()[:10]}@imports.local"
    clinic = db.scalar(select(User).where(User.email == email))
    if clinic is None:
        clinic = User(
            role="doctor",
            email=email,
            # random password, never shared — the account exists only to author imports
            password_hash=hash_password(secrets.token_urlsafe(32)),
            full_name=hospital,
            specialty="clinic",
        )
        db.add(clinic)
        db.flush()
    return clinic


class LabImportOut(BaseModel):
    activity_id: int
    test_name: str | None
    normalized_by: str  # 'gemini' | 'rules'
    values_extracted: int
    observations_created: int


class EhrImportOut(BaseModel):
    patient_id: int
    assessment_id: int
    document_id: int
    doctor_id: int
    doctor_name: str
    lab_tests: list[LabImportOut]
    consultations_imported: int
    recommendations_imported: int


@router.post("/ehr", response_model=EhrImportOut, status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(require_clinic_key)])
async def import_clinic_ehr(
    file: UploadFile = File(description="MoH-style EHR XML document"),
    db: Session = Depends(get_db),
):
    xml_bytes = await file.read()
    if len(xml_bytes) > MAX_XML_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "XML larger than 2 MB")
    try:
        ehr = parse_clinic_ehr(xml_bytes)
    except EhrXmlError as e:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(e))

    patient = _find_patient(db, ehr)

    if ehr.ehr_no and db.scalar(
        select(Assessment).where(
            Assessment.patient_id == patient.id,
            Assessment.medical_record_number == ehr.ehr_no,
        )
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"EHR #{ehr.ehr_no} was already imported for this patient",
        )

    doctor = _attribute_doctor(db, ehr)
    category = get_category_or_404(db, "general")

    multi_day = (
        ehr.start_date and ehr.end_date and ehr.end_date.date() > ehr.start_date.date()
    )
    assessment = Assessment(
        patient_id=patient.id,
        doctor_id=doctor.id,
        category_id=category.id,
        episode_type="inpatient" if multi_day else "outpatient",
        status="completed",
        medical_record_number=ehr.ehr_no,
        case_number=ehr.case_no,
        discharge_at=ehr.end_date if multi_day else None,
        hospitalization_type=ehr.hospitalization_type,
        complaints=ehr.symptoms,
        referring_institution=ehr.hospital_name,
        final_diagnosis_icd10=ehr.final_icd10,
        diagnosis_description=ehr.final_illness,
        recommendations="\n".join(ehr.recommendations) or None,
        episode_result=ehr.hospitalization_result,
        outcome_comment=ehr.condition_at_discharge or ehr.doctor_comment,
        completed_at=ehr.end_date,
    )
    if ehr.start_date:
        assessment.visit_date = ehr.start_date
    db.add(assessment)
    db.flush()

    for v in ehr.visits:
        db.add(AssessmentVisit(
            assessment_id=assessment.id,
            started_at=v.started_at or assessment.visit_date,
            ended_at=v.ended_at,
            comment=v.comment,
        ))

    metrics = db.scalars(select(CategoryMetric)).all()
    by_code = {m.code: m for m in metrics}
    catalog = [(m.code, m.name, m.unit) for m in metrics]

    lab_results: list[LabImportOut] = []
    for lab in ehr.lab_tests:
        normalized, parser = (
            normalize_lab_result(lab.result_text, lab.name, catalog)
            if lab.result_text else (None, "empty")
        )
        activity = AssessmentActivity(
            assessment_id=assessment.id,
            activity_type="lab_test",
            name=lab.name,
            started_at=lab.started_at,
            ended_at=lab.ended_at,
            result_note=lab.result_text,  # original text, verbatim
            details={
                "laboratory": lab.laboratory,
                "price": lab.price,
                "normalized": normalized.model_dump() if normalized else None,
                "normalized_by": parser,
            },
        )
        db.add(activity)
        db.flush()

        observations = 0
        for value in (normalized.values if normalized else []):
            if value.value_num is None and not value.value_text:
                continue
            known = by_code.get(value.metric)
            db.add(Observation(
                patient_id=patient.id,
                recorded_by=doctor.id,
                category_id=known.category_id if known else None,
                box=(known.box if known and known.box else "general"),
                metric=value.metric,
                value_num=value.value_num,
                value_text=value.value_text,
                unit=value.unit or (known.unit if known else None),
                observed_at=lab.started_at or assessment.visit_date,
                source_kind="clinic_ehr",
                source_label=ehr.hospital_name or lab.laboratory or "Clinic EHR import",
                note=f"{lab.name or 'Lab test'} — {value.name_original}",
            ))
            observations += 1

        lab_results.append(LabImportOut(
            activity_id=activity.id,
            test_name=lab.name,
            normalized_by=parser,
            values_extracted=len(normalized.values) if normalized else 0,
            observations_created=observations,
        ))

    for c in ehr.consultations:
        db.add(AssessmentActivity(
            assessment_id=assessment.id,
            activity_type="consultation",
            name=c.doctor_name,
            ncsp_code=c.ncsp,
            icd10_code=c.icd10,
            started_at=c.date,
            result_note=c.comment,
            details={"specialty_code": c.specialty_code, "price": c.price},
        ))

    for rec in ehr.recommendations:
        db.add(AssessmentActivity(
            assessment_id=assessment.id,
            activity_type="discharge_other_recommendation",
            result_note=rec,
        ))

    # keep the raw XML on file so nothing the clinic sent is ever lost
    dest_dir = Path(settings.upload_dir) / str(patient.id) / "documents"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex}.xml"
    dest.write_bytes(xml_bytes)
    document = PatientDocument(
        patient_id=patient.id,
        file_path=str(dest),
        original_name=file.filename or f"ehr_{ehr.ehr_no or 'import'}.xml",
        mime="application/xml",
        summary=f"Clinic EHR #{ehr.ehr_no or '—'} from {ehr.hospital_name or 'external clinic'}",
        source_kind="clinic_ehr",
    )
    if ehr.start_date:
        document.occurred_at = ehr.start_date
    db.add(document)

    db.commit()
    return EhrImportOut(
        patient_id=patient.id,
        assessment_id=assessment.id,
        document_id=document.id,
        doctor_id=doctor.id,
        doctor_name=doctor.full_name,
        lab_tests=lab_results,
        consultations_imported=len(ehr.consultations),
        recommendations_imported=len(ehr.recommendations),
    )

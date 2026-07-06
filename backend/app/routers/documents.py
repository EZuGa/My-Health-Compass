"""Documents the patient uploads themself (lab PDFs, scans, wearable exports)."""
import shutil
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_patient
from ..config import settings
from ..database import get_db
from ..models import PatientDocument, User
from ..schemas import PatientDocumentOut
from .helpers import require_patient_readable

router = APIRouter(prefix="/documents", tags=["patient documents"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp",
                      ".dcm", ".pdf", ".csv", ".txt", ".json", ".xml"}


@router.post("", response_model=PatientDocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    summary: str | None = Form(default=None),
    source_kind: str | None = Form(default=None),
    occurred_at: datetime | None = Form(default=None),
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"File type '{ext}' not allowed. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    dest_dir = Path(settings.upload_dir) / str(patient.id) / "documents"
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / f"{uuid.uuid4().hex}{ext}"
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    doc = PatientDocument(
        patient_id=patient.id,
        file_path=str(dest),
        original_name=file.filename,
        mime=file.content_type,
        summary=summary,
        source_kind=source_kind,
    )
    if occurred_at is not None:
        doc.occurred_at = occurred_at
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/patient/{patient_id}", response_model=list[PatientDocumentOut])
def list_documents(
    patient_id: int,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Patient: own documents; doctor: needs any active grant."""
    require_patient_readable(db, viewer, patient_id)
    return db.scalars(
        select(PatientDocument)
        .where(PatientDocument.patient_id == patient_id)
        .order_by(PatientDocument.occurred_at.desc())
    ).all()


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.get(PatientDocument, document_id)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    require_patient_readable(db, viewer, doc.patient_id)
    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(status.HTTP_410_GONE, "File missing on disk")
    return FileResponse(path, filename=doc.original_name or path.name, media_type=doc.mime)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    doc = db.get(PatientDocument, document_id)
    if doc is None or doc.patient_id != patient.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    Path(doc.file_path).unlink(missing_ok=True)
    db.delete(doc)
    db.commit()

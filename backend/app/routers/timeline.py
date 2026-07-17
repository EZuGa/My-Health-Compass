"""Clinical timeline: one chronological view merging assessments, observations,
documents and dated profile items — the frontend's inpatient/outpatient timeline."""
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Assessment, Observation, PatientDocument, ProfileItem, User
from ..schemas import TimelineEvent
from .helpers import require_patient_readable

router = APIRouter(tags=["timeline"])


def _as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


@router.get("/patients/{patient_id}/timeline", response_model=list[TimelineEvent])
def timeline(
    patient_id: int,
    setting: str | None = Query(
        default=None,
        description="Filter assessments: inpatient | day_hospital | emergency_outpatient | outpatient",
    ),
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Newest first. Patient sees everything of their own; a doctor holding an
    active grant sees the full record — assessments in every category plus
    general data (observations, documents, profile)."""
    require_patient_readable(db, viewer, patient_id)
    events: list[TimelineEvent] = []

    q = select(Assessment).where(Assessment.patient_id == patient_id)
    if setting:
        q = q.where(Assessment.episode_type == setting)
    for a in db.scalars(q):
        diagnosis = a.final_diagnosis_icd10 or a.clinical_diagnosis_icd10 or a.preliminary_diagnosis_icd10
        events.append(TimelineEvent(
            date=_as_utc(a.visit_date),
            event_type="assessment",
            id=a.id,
            title=f"{a.category.name} visit ({a.episode_type.replace('_', ' ')})",
            detail=" — ".join(x for x in (diagnosis, a.diagnosis_description or a.complaints) if x) or None,
            category_code=a.category.code,
        ))

    if not setting:  # observations/documents/profile have no episode type
        for o in db.scalars(select(Observation).where(Observation.patient_id == patient_id)):
            value = f"{o.value_num:g}" if o.value_num is not None else (o.value_text or "")
            events.append(TimelineEvent(
                date=_as_utc(o.observed_at),
                event_type="observation",
                id=o.id,
                title=f"{o.metric} {value}{' ' + o.unit if o.unit else ''}".strip(),
                detail=o.source_label or o.source_kind,
            ))
        for d in db.scalars(select(PatientDocument).where(PatientDocument.patient_id == patient_id)):
            events.append(TimelineEvent(
                date=_as_utc(d.occurred_at),
                event_type="document",
                id=d.id,
                title=d.original_name or "Document",
                detail=d.summary,
            ))
        for p in db.scalars(select(ProfileItem).where(
                ProfileItem.patient_id == patient_id, ProfileItem.occurred_on.is_not(None))):
            events.append(TimelineEvent(
                date=datetime.combine(p.occurred_on, time.min, tzinfo=timezone.utc),
                event_type="profile_item",
                id=p.id,
                title=f"{p.item_type.replace('_', ' ')}: {p.name}",
                detail=p.detail,
            ))

    events.sort(key=lambda e: e.date, reverse=True)
    return events

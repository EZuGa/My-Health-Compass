"""Patient-owned health data: profile items (anamnesis vitae) and observations.

Mirrors the Health Passport frontend: profile sections (allergies, meds, PMH,
immunizations...) and time-series metrics grouped into boxes
(heart, metabolic, fitness, sleep, mind, exposures) for charts.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_patient
from ..database import get_db
from ..models import Observation, ProfileItem, User
from ..schemas import ObservationIn, ObservationOut, ProfileItemIn, ProfileItemOut
from .helpers import require_patient_readable

router = APIRouter(tags=["patient data"])


# ---------- profile items (allergies, chronic conditions, meds, immunizations...) ----------

@router.post("/profile/items", response_model=ProfileItemOut, status_code=status.HTTP_201_CREATED)
def add_profile_item(
    data: ProfileItemIn,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    item = ProfileItem(patient_id=patient.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/profile/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_item(
    item_id: int,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    item = db.get(ProfileItem, item_id)
    if item is None or item.patient_id != patient.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    db.delete(item)
    db.commit()


@router.get("/patients/{patient_id}/profile", response_model=dict[str, list[ProfileItemOut]])
def get_profile(
    patient_id: int,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Anamnesis vitae grouped by type. Patient: own; doctor: needs any active grant."""
    require_patient_readable(db, viewer, patient_id)
    items = db.scalars(
        select(ProfileItem)
        .where(ProfileItem.patient_id == patient_id)
        .order_by(ProfileItem.item_type, ProfileItem.occurred_on)
    ).all()
    grouped: dict[str, list[ProfileItemOut]] = {}
    for it in items:
        grouped.setdefault(it.item_type, []).append(ProfileItemOut.model_validate(it))
    return grouped


# ---------- observations (time-series metrics) ----------

@router.post("/patients/{patient_id}/observations", response_model=ObservationOut,
             status_code=status.HTTP_201_CREATED)
def add_observation(
    patient_id: int,
    data: ObservationIn,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a metric value. Patient for themself; doctor with an active grant."""
    require_patient_readable(db, viewer, patient_id)
    obs = Observation(patient_id=patient_id, recorded_by=viewer.id, **data.model_dump(exclude={"observed_at"}))
    if data.observed_at is not None:
        obs.observed_at = data.observed_at
    db.add(obs)
    db.commit()
    db.refresh(obs)
    return obs


@router.get("/patients/{patient_id}/observations", response_model=list[ObservationOut])
def list_observations(
    patient_id: int,
    box: str | None = Query(default=None, description="heart | metabolic | fitness | sleep | mind | exposures"),
    metric: str | None = Query(default=None, description="e.g. pulse, blood_pressure_systolic, hba1c"),
    category: str | None = Query(default=None, description="category code, e.g. cardiology"),
    date_from: datetime | None = Query(default=None, description="only samples at/after this time"),
    date_to: datetime | None = Query(default=None, description="only samples at/before this time"),
    source_kind: str | None = Query(default=None, description="manual | wearable | chat | document | emr"),
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Time series for charts, oldest first. Filter by box, metric, category, time range, source."""
    require_patient_readable(db, viewer, patient_id)
    q = select(Observation).where(Observation.patient_id == patient_id)
    if box:
        q = q.where(Observation.box == box)
    if metric:
        q = q.where(Observation.metric == metric)
    if date_from:
        q = q.where(Observation.observed_at >= date_from)
    if date_to:
        q = q.where(Observation.observed_at <= date_to)
    if source_kind:
        q = q.where(Observation.source_kind == source_kind)
    if category:
        from ..models import Category
        q = q.join(Category, Observation.category_id == Category.id).where(Category.code == category)
    return db.scalars(q.order_by(Observation.observed_at)).all()


@router.delete("/observations/{observation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_observation(
    observation_id: int,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    obs = db.get(Observation, observation_id)
    if obs is None or obs.patient_id != patient.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Observation not found")
    db.delete(obs)
    db.commit()

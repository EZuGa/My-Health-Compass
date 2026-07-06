"""Wearable / health-platform data: bulk sync from Apple Health, Samsung Health,
Whoop, Fitbit, Garmin, Oura... plus the read views doctors need on top of it
(latest vitals per metric, stats over a date range)."""
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_patient
from ..database import get_db
from ..metrics_catalog import WEARABLE_SOURCES
from ..models import CategoryMetric, Observation, User
from ..schemas import ObservationOut
from .helpers import require_patient_readable

router = APIRouter(tags=["wearables & vitals"])


class WearableSample(BaseModel):
    metric: str = Field(examples=["resting_heart_rate"])
    value_num: float | None = None
    value_text: str | None = None
    unit: str | None = None
    observed_at: datetime


class WearableSyncIn(BaseModel):
    source: Literal["apple_health", "samsung_health", "whoop", "fitbit", "garmin", "oura", "other"]
    samples: list[WearableSample] = Field(min_length=1, max_length=5000)


class WearableSyncOut(BaseModel):
    stored: int
    skipped_duplicates: int


@router.post("/wearables/sync", response_model=WearableSyncOut)
def sync_wearable_data(
    data: WearableSyncIn,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    """Bulk-ingest timestamped samples from a connected device/platform.

    Idempotent: re-syncing the same (metric, timestamp, source) batch skips duplicates.
    """
    by_code = {m.code: m for m in db.scalars(select(CategoryMetric))}

    existing = set(
        db.execute(
            select(Observation.metric, Observation.observed_at)
            .where(
                Observation.patient_id == patient.id,
                Observation.source_kind == "wearable",
                Observation.source_label == data.source,
            )
        ).all()
    )

    stored = skipped = 0
    seen_in_batch: set[tuple] = set()
    for s in data.samples:
        key = (s.metric, s.observed_at)
        naive_key = (s.metric, s.observed_at.replace(tzinfo=None) if s.observed_at.tzinfo else s.observed_at)
        if key in seen_in_batch or key in existing or naive_key in existing:
            skipped += 1
            continue
        seen_in_batch.add(key)
        known = by_code.get(s.metric)
        db.add(Observation(
            patient_id=patient.id,
            recorded_by=patient.id,
            category_id=known.category_id if known else None,
            box=(known.box if known and known.box else "fitness"),
            metric=s.metric,
            value_num=s.value_num,
            value_text=s.value_text,
            unit=s.unit or (known.unit if known else None),
            observed_at=s.observed_at,
            source_kind="wearable",
            source_label=data.source,
        ))
        stored += 1
    db.commit()
    return WearableSyncOut(stored=stored, skipped_duplicates=skipped)


@router.get("/patients/{patient_id}/vitals/latest", response_model=list[ObservationOut])
def latest_vitals(
    patient_id: int,
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The most recent value of every metric — the first thing a doctor checks."""
    require_patient_readable(db, viewer, patient_id)
    latest = (
        select(Observation.metric, func.max(Observation.observed_at).label("last_at"))
        .where(Observation.patient_id == patient_id)
        .group_by(Observation.metric)
        .subquery()
    )
    rows = db.scalars(
        select(Observation)
        .join(latest, (Observation.metric == latest.c.metric)
              & (Observation.observed_at == latest.c.last_at))
        .where(Observation.patient_id == patient_id)
        .order_by(Observation.metric)
    ).unique().all()
    # one row per metric even if two samples share the max timestamp
    seen: set[str] = set()
    return [o for o in rows if not (o.metric in seen or seen.add(o.metric))]


class MetricStats(BaseModel):
    metric: str
    count: int
    min: float | None
    max: float | None
    avg: float | None
    first_at: datetime | None
    last_at: datetime | None
    latest: ObservationOut | None


@router.get("/patients/{patient_id}/observations/stats", response_model=MetricStats)
def observation_stats(
    patient_id: int,
    metric: str = Query(..., examples=["pulse"]),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trend numbers for one metric over a period (min/max/avg + latest reading)."""
    require_patient_readable(db, viewer, patient_id)
    conds = [Observation.patient_id == patient_id, Observation.metric == metric]
    if date_from:
        conds.append(Observation.observed_at >= date_from)
    if date_to:
        conds.append(Observation.observed_at <= date_to)

    row = db.execute(
        select(
            func.count(Observation.id),
            func.min(Observation.value_num),
            func.max(Observation.value_num),
            func.avg(Observation.value_num),
            func.min(Observation.observed_at),
            func.max(Observation.observed_at),
        ).where(*conds)
    ).one()
    latest = db.scalar(
        select(Observation).where(*conds).order_by(Observation.observed_at.desc()).limit(1)
    )
    return MetricStats(
        metric=metric, count=row[0], min=row[1], max=row[2],
        avg=round(row[3], 2) if row[3] is not None else None,
        first_at=row[4], last_at=row[5],
        latest=ObservationOut.model_validate(latest) if latest else None,
    )

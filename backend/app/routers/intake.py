"""AI chat intake: patient tells the app 'I have 50 pulse and pressure 100' and
we store structured, timestamped observations that doctors later see (with a grant)."""
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..ai import extract_observations
from ..auth import require_patient
from ..database import get_db
from ..models import CategoryMetric, Observation, User
from ..schemas import ObservationOut

router = APIRouter(prefix="/intake", tags=["AI intake"])


class IntakeMessage(BaseModel):
    message: str = Field(min_length=1, examples=["I have 50 pulse and pressure 100 over 70"])
    observed_at: datetime | None = None  # when the measurement was taken; default now


class IntakeResult(BaseModel):
    message: str
    parsed_by: str  # 'claude' | 'rules'
    observations: list[ObservationOut]


@router.post("/message", response_model=IntakeResult)
def intake_message(
    data: IntakeMessage,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    """Qualify a free-text health message into structured JSON observations."""
    metrics = db.scalars(select(CategoryMetric)).all()
    by_code = {m.code: m for m in metrics}
    catalog = [(m.code, m.name, m.unit) for m in metrics]

    extracted, parser = extract_observations(data.message, catalog)

    stored: list[Observation] = []
    for e in extracted:
        known = by_code.get(e.metric)
        obs = Observation(
            patient_id=patient.id,
            recorded_by=patient.id,
            category_id=known.category_id if known else None,
            box=(known.box if known and known.box else "general"),
            metric=e.metric,
            value_num=e.value_num,
            value_text=e.value_text,
            unit=e.unit or (known.unit if known else None),
            source_kind="chat",
            source_label="AI intake",
            note=data.message,
        )
        if data.observed_at is not None:
            obs.observed_at = data.observed_at
        db.add(obs)
        stored.append(obs)
    db.commit()
    for obs in stored:
        db.refresh(obs)

    return IntakeResult(
        message=data.message,
        parsed_by=parser,
        observations=[ObservationOut.model_validate(o) for o in stored],
    )

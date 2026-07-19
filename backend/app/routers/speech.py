"""Voice intake: the frontend records a voice note (MediaRecorder) and posts
the audio here. Gemini first transcribes it, then extracts any health data the
patient stated — symptoms and measurements become observations ("today I had
diarrhea" → metric `diarrhea`), durable facts (allergies, medications, chronic
conditions, past diseases) become profile items — and stores them in the
patient's record. The audio itself is never stored.

Extraction/storage runs only for patients (into their own record); doctors get
the transcript alone. Pass `store=false` to skip storage (used by flows that
run their own extraction on the transcript)."""
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..gemini import extract_health_data, transcribe_audio
from ..models import CategoryMetric, Observation, ProfileItem, User
from ..schemas import ObservationOut, ProfileItemOut

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/speech", tags=["speech"])

MAX_AUDIO_BYTES = 15 * 1024 * 1024  # Gemini inline-data budget is ~20 MB


class VoiceIntakeOut(BaseModel):
    text: str
    observations: list[ObservationOut] = []
    profile_items: list[ProfileItemOut] = []


@router.post("/transcribe", response_model=VoiceIntakeOut)
async def transcribe(
    file: UploadFile = File(description="Audio recording (webm/mp4/wav/ogg/mp3)"),
    language: str | None = Form(default=None, description="Optional language hint, e.g. 'Georgian'"),
    store: bool = Form(default=True, description="Also extract health data and store it in the patient's record"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    audio = await file.read()
    if len(audio) < 512:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Recording is empty or too short")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Audio larger than 15 MB")

    try:
        text = transcribe_audio(audio, file.content_type or "audio/webm", language)
    except Exception as e:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Transcription service unavailable: {e.__class__.__name__}",
        )

    stored_obs: list[Observation] = []
    stored_items: list[ProfileItem] = []
    if store and text and user.role == "patient":
        try:
            metrics = db.scalars(select(CategoryMetric)).all()
            by_code = {m.code: m for m in metrics}
            extraction = extract_health_data(text, [(m.code, m.name, m.unit) for m in metrics])
        except Exception:
            # The transcript is still useful on its own — never fail the call
            # because extraction did.
            logger.exception("Gemini health extraction failed; returning transcript only")
            extraction = None

        if extraction:
            for e in extraction.observations:
                if e.value_num is None and not e.value_text:
                    continue
                known = by_code.get(e.metric)
                obs = Observation(
                    patient_id=user.id,
                    recorded_by=user.id,
                    category_id=known.category_id if known else None,
                    box=(known.box if known and known.box else "general"),
                    metric=e.metric,
                    value_num=e.value_num,
                    value_text=e.value_text,
                    unit=e.unit or (known.unit if known else None),
                    source_kind="voice",
                    source_label="Voice note (Gemini)",
                    note=text,
                )
                db.add(obs)
                stored_obs.append(obs)

            for p in extraction.profile_items:
                exists = db.scalar(
                    select(ProfileItem).where(
                        ProfileItem.patient_id == user.id,
                        ProfileItem.item_type == p.item_type,
                        func.lower(ProfileItem.name) == p.name.lower(),
                    )
                )
                if exists:  # saying "I'm allergic to penicillin" twice isn't two allergies
                    continue
                item = ProfileItem(
                    patient_id=user.id,
                    item_type=p.item_type,
                    name=p.name,
                    detail=p.detail,
                )
                db.add(item)
                stored_items.append(item)

            db.commit()
            for row in (*stored_obs, *stored_items):
                db.refresh(row)

    return VoiceIntakeOut(
        text=text,
        observations=[ObservationOut.model_validate(o) for o in stored_obs],
        profile_items=[ProfileItemOut.model_validate(i) for i in stored_items],
    )

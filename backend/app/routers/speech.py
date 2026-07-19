"""Speech-to-text: the frontend records voice notes (MediaRecorder) and posts
the audio here; Gemini transcribes it. Any signed-in user may transcribe —
the audio is never stored, only turned into text the client then submits
through the normal intake/notes flows."""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from ..auth import get_current_user
from ..gemini import transcribe_audio
from ..models import User

router = APIRouter(prefix="/speech", tags=["speech"])

MAX_AUDIO_BYTES = 15 * 1024 * 1024  # Gemini inline-data budget is ~20 MB


class TranscriptOut(BaseModel):
    text: str


@router.post("/transcribe", response_model=TranscriptOut)
async def transcribe(
    file: UploadFile = File(description="Audio recording (webm/mp4/wav/ogg/mp3)"),
    language: str | None = Form(default=None, description="Optional language hint, e.g. 'Georgian'"),
    _: User = Depends(get_current_user),
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
    return TranscriptOut(text=text)

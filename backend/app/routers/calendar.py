"""Patient calendar: appointments, reminders, and medication schedule.

Replaces the frontend's hardcoded appointments/reminders. Patients own their
events; doctors with an active grant may read them.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user, require_patient
from ..database import get_db
from ..models import CalendarEvent, User
from ..schemas import CalendarEventIn, CalendarEventOut
from .helpers import require_patient_readable

router = APIRouter(tags=["calendar"])


@router.get("/patients/{patient_id}/calendar", response_model=list[CalendarEventOut])
def list_calendar(
    patient_id: int,
    kind: str | None = Query(default=None, description="appointment | reminder | medication"),
    viewer: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_patient_readable(db, viewer, patient_id)
    q = select(CalendarEvent).where(CalendarEvent.patient_id == patient_id)
    if kind:
        q = q.where(CalendarEvent.kind == kind)
    return db.scalars(q.order_by(CalendarEvent.event_date, CalendarEvent.event_time)).all()


@router.post("/calendar", response_model=CalendarEventOut, status_code=status.HTTP_201_CREATED)
def add_calendar_event(
    data: CalendarEventIn,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    event = CalendarEvent(patient_id=patient.id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/calendar/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(
    event_id: int,
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    event = db.get(CalendarEvent, event_id)
    if event is None or event.patient_id != patient.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    db.delete(event)
    db.commit()


# convenience: the signed-in patient's own calendar without needing their id
@router.get("/calendar/mine", response_model=list[CalendarEventOut])
def my_calendar(
    kind: str | None = Query(default=None),
    patient: User = Depends(require_patient),
    db: Session = Depends(get_db),
):
    q = select(CalendarEvent).where(CalendarEvent.patient_id == patient.id)
    if kind:
        q = q.where(CalendarEvent.kind == kind)
    return db.scalars(q.order_by(CalendarEvent.event_date, CalendarEvent.event_time)).all()

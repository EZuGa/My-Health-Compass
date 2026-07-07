"""Catalog endpoints — reference data the frontend used to hardcode.

Serves the dashboard boxes (with their metrics), the clinical-record sections,
and the full metric catalog (names, units, reference ranges, diagnostic groups).
Any authenticated user may read these; they are not patient-specific.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..metrics_catalog import APP_SECTIONS, HEALTH_BOXES
from ..models import CategoryMetric, User
from ..schemas import BoxOut, CategoryMetricOut, SectionOut

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/boxes", response_model=list[BoxOut])
def list_boxes(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """The six health-domain cards, each with its metric definitions."""
    metrics = db.scalars(select(CategoryMetric)).all()
    by_box: dict[str, list[CategoryMetricOut]] = {}
    for m in metrics:
        by_box.setdefault(m.box or "other", []).append(CategoryMetricOut.model_validate(m))
    return [
        BoxOut(id=bid, title=title, subtitle=subtitle, metrics=by_box.get(bid, []))
        for bid, title, subtitle in HEALTH_BOXES
    ]


@router.get("/sections", response_model=list[SectionOut])
def list_sections(_: User = Depends(get_current_user)):
    """NEJM-style clinical-record sections shown in the sidebar."""
    return [SectionOut(id=sid, title=title) for sid, title in APP_SECTIONS]


@router.get("/metrics", response_model=list[CategoryMetricOut])
def list_all_metrics(_: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Every metric in the catalog (used by the Diagnostic Data page, grouped by
    diagnostic_group on the client)."""
    return db.scalars(select(CategoryMetric).order_by(CategoryMetric.name)).all()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from .database import Base, SessionLocal, engine
from .metrics_catalog import METRICS_SEED
from .models import Category, CategoryMetric
from .routers import (
    access, assessments, auth, calendar, catalog, dashboard, documents,
    history, intake, patient_data, summary, timeline, wearables,
)

DEFAULT_CATEGORIES = [
    ("cardiology", "Cardiology"),
    ("ophthalmology", "Ophthalmology"),
    ("neurology", "Neurology"),
    ("dermatology", "Dermatology"),
    ("endocrinology", "Endocrinology"),
    ("gastroenterology", "Gastroenterology"),
    ("orthopedics", "Orthopedics"),
    ("pulmonology", "Pulmonology"),
    ("urology", "Urology"),
    ("gynecology", "Gynecology"),
    ("general", "General / Family Medicine"),
]

app = FastAPI(
    title="Medical Records API",
    description=(
        "Doctors submit per-category assessments (cardiology, neurology, ...). "
        "Patients own their history; doctors must request access and the patient approves."
    ),
    version="0.1.0",
)

# Browser frontend (Vite dev server) calls this API cross-origin with a bearer
# token, so permissive CORS is fine in dev. Tighten allow_origins in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def init_db():
    # schema.sql is the reference schema; this mirrors it so local dev "just works"
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing = {c.code for c in db.scalars(select(Category))}
        for code, name in DEFAULT_CATEGORIES:
            if code not in existing:
                db.add(Category(code=code, name=name))
        db.commit()

        categories = {c.code: c.id for c in db.scalars(select(Category))}
        existing_metrics = {m.code for m in db.scalars(select(CategoryMetric))}
        for m in METRICS_SEED:
            if m["code"] not in existing_metrics and m["category"] in categories:
                db.add(CategoryMetric(
                    category_id=categories[m["category"]],
                    code=m["code"], name=m["name"], unit=m["unit"], box=m["box"],
                    reference=m["reference"], range_low=m["range_low"],
                    range_high=m["range_high"], modality=m["modality"],
                    diagnostic_group=m["diagnostic_group"],
                ))
        db.commit()


@app.get("/", tags=["health"])
def health():
    return {"status": "ok", "docs": "/docs"}


app.include_router(auth.router)
app.include_router(assessments.router)
app.include_router(history.router)
app.include_router(access.router)
app.include_router(patient_data.router)
app.include_router(documents.router)
app.include_router(timeline.router)
app.include_router(intake.router)
app.include_router(wearables.router)
app.include_router(summary.router)
app.include_router(dashboard.router)
app.include_router(catalog.router)
app.include_router(calendar.router)

"""Populate the database with demo data (100+ records).

Run from backend/:  python seed_demo.py
Uses DATABASE_URL from .env / environment (works with PostgreSQL or SQLite).

Creates: 3 patients, 3 doctors, wearable observation time series (30 days),
chat-intake vitals, assessments with the Georgian-EHR fields, profile items
(allergies, meds, chronic conditions, immunizations), and access grants.
All demo accounts use password: demo123
"""
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.main import DEFAULT_CATEGORIES
from app.metrics_catalog import METRICS_SEED
from app.models import (
    AccessRequest, Assessment, Category, CategoryMetric, Observation,
    ProfileItem, User,
)

random.seed(42)
NOW = datetime.now(timezone.utc)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # categories + metric catalog (same as app startup, so the script is standalone)
    existing = {c.code for c in db.scalars(select(Category))}
    for code, name in DEFAULT_CATEGORIES:
        if code not in existing:
            db.add(Category(code=code, name=name))
    db.commit()
    categories = {c.code: c for c in db.scalars(select(Category))}
    existing_metrics = {m.code for m in db.scalars(select(CategoryMetric))}
    for cat_code, code, name, unit, box in METRICS_SEED:
        if code not in existing_metrics:
            db.add(CategoryMetric(category_id=categories[cat_code].id,
                                  code=code, name=name, unit=unit, box=box))
    db.commit()
    metrics = {m.code: m for m in db.scalars(select(CategoryMetric))}

    if db.scalar(select(func.count(User.id)).where(User.email.like("%@demo.ge"))):
        print("Demo data already present — nothing to do.")
        return

    pw = hash_password("demo123")

    patients = [
        User(role="patient", email="nino@demo.ge", password_hash=pw, full_name="Nino Kapanadze",
             personal_number="01001011111", date_of_birth=datetime(1985, 3, 12).date(),
             blood_group="A+", phone="+995 555 111 111"),
        User(role="patient", email="giorgi@demo.ge", password_hash=pw, full_name="Giorgi Melikidze",
             personal_number="01001022222", date_of_birth=datetime(1972, 11, 3).date(),
             blood_group="O-", phone="+995 555 222 222"),
        User(role="patient", email="mariam@demo.ge", password_hash=pw, full_name="Mariam Tsiklauri",
             personal_number="01001033333", date_of_birth=datetime(1996, 7, 25).date(),
             blood_group="B+", phone="+995 555 333 333"),
    ]
    doctors = [
        User(role="doctor", email="cardio@demo.ge", password_hash=pw,
             full_name="Dr. Levan Beridze", specialty="cardiology"),
        User(role="doctor", email="neuro@demo.ge", password_hash=pw,
             full_name="Dr. Tamar Gelashvili", specialty="neurology"),
        User(role="doctor", email="endo@demo.ge", password_hash=pw,
             full_name="Dr. Irakli Japaridze", specialty="endocrinology"),
    ]
    db.add_all(patients + doctors)
    db.commit()
    for u in patients + doctors:
        db.refresh(u)

    counts = {"users": len(patients) + len(doctors)}

    # ---- wearable time series: 30 days of resting HR + steps + sleep for patient 1 ----
    obs = 0
    for day in range(30):
        ts = NOW - timedelta(days=29 - day)
        for code, base, spread, src in [
            ("resting_heart_rate", 62, 6, "apple_health"),
            ("steps", 8200, 3500, "apple_health"),
            ("sleep_hours", 7.1, 1.2, "whoop"),
        ]:
            m = metrics[code]
            db.add(Observation(
                patient_id=patients[0].id, recorded_by=patients[0].id,
                category_id=m.category_id, box=m.box, metric=code,
                value_num=round(base + random.uniform(-spread, spread), 1),
                unit=m.unit, observed_at=ts.replace(hour=7, minute=0),
                source_kind="wearable", source_label=src,
            ))
            obs += 1

    # ---- chat-intake style vitals for patients 2 and 3 ----
    for p, series in [
        (patients[1], [("blood_pressure_systolic", 145, 12), ("blood_pressure_diastolic", 92, 8),
                       ("pulse", 78, 8), ("blood_glucose", 7.4, 1.2)]),
        (patients[2], [("pulse", 66, 6), ("temperature", 36.7, 0.4), ("weight", 58.5, 0.8)]),
    ]:
        for week in range(4):
            ts = NOW - timedelta(days=27 - week * 7, hours=random.randint(0, 8))
            for code, base, spread in series:
                m = metrics[code]
                db.add(Observation(
                    patient_id=p.id, recorded_by=p.id,
                    category_id=m.category_id, box=m.box, metric=code,
                    value_num=round(base + random.uniform(-spread, spread), 1),
                    unit=m.unit, observed_at=ts,
                    source_kind="chat", source_label="AI intake",
                    note="demo: reported via chat",
                ))
                obs += 1
    counts["observations"] = obs

    # ---- assessments (Georgian EHR fields) ----
    assessments_data = [
        (patients[0], doctors[0], "cardiology", "outpatient", "Palpitations during exercise",
         "I49.9", "Cardiac arrhythmia, unspecified", "ECG and 24h Holter performed",
         "Beta-blocker 2.5mg daily; repeat Holter in 3 months"),
        (patients[0], doctors[1], "neurology", "outpatient", "Recurrent tension headaches",
         "G44.2", "Tension-type headache", "Neurological exam normal",
         "Sleep hygiene; magnesium supplement"),
        (patients[1], doctors[0], "cardiology", "inpatient", "Chest pain at rest, hypertension",
         "I20.0", "Unstable angina", "Coronary angiography: 60% LAD stenosis; medical therapy chosen",
         "Dual antiplatelet therapy; statin; cardiology follow-up in 1 month"),
        (patients[1], doctors[2], "endocrinology", "outpatient", "Polyuria, fatigue, elevated glucose",
         "E11.9", "Type 2 diabetes mellitus", "HbA1c 7.8%; metformin started",
         "Diet consultation; HbA1c control in 3 months"),
        (patients[1], doctors[0], "cardiology", "outpatient", "Follow-up after hospitalization",
         "I20.0", "Unstable angina — stable on therapy", "BP improved on treatment",
         "Continue current therapy"),
        (patients[2], doctors[1], "neurology", "emergency_outpatient", "Acute migraine with aura",
         "G43.1", "Migraine with aura", "Triptan administered, symptoms resolved",
         "Migraine diary; avoid triggers; neurologist follow-up if >2 attacks/month"),
    ]
    for i, (p, d, cat, ep, complaints, icd, desc, notes, rec) in enumerate(assessments_data):
        db.add(Assessment(
            patient_id=p.id, doctor_id=d.id, category_id=categories[cat].id,
            episode_type=ep, visit_date=NOW - timedelta(days=60 - i * 9),
            complaints=complaints, clinical_diagnosis_icd10=icd,
            final_diagnosis_icd10=icd, diagnosis_description=desc,
            treatment_notes=notes, recommendations=rec,
            outcome="გაუმჯობესება (improvement)",
        ))
    counts["assessments"] = len(assessments_data)

    # ---- profile items (anamnesis vitae) ----
    profile_data = [
        (patients[0], "allergy", "Penicillin", "Skin rash", None),
        (patients[0], "immunization", "COVID-19 (Pfizer)", "2 doses + booster", "2023-11-10"),
        (patients[0], "medication", "Bisoprolol 2.5mg", "1x daily, morning", None),
        (patients[1], "chronic_condition", "Hypertension", None, "2015-06-01"),
        (patients[1], "chronic_condition", "Type 2 diabetes", None, "2024-02-15"),
        (patients[1], "medication", "Metformin 850mg", "2x daily", None),
        (patients[1], "medication", "Atorvastatin 20mg", "1x daily, evening", None),
        (patients[1], "surgery", "Appendectomy", None, "1999-08-20"),
        (patients[2], "allergy", "Pollen (seasonal)", "Rhinitis", None),
        (patients[2], "family_history", "Migraine (mother)", None, None),
    ]
    for p, t, name, detail, when in profile_data:
        db.add(ProfileItem(
            patient_id=p.id, item_type=t, name=name, detail=detail,
            occurred_on=datetime.strptime(when, "%Y-%m-%d").date() if when else None,
        ))
    counts["profile_items"] = len(profile_data)

    # ---- access requests: approved grants + one pending ----
    ar = [
        AccessRequest(doctor_id=doctors[0].id, patient_id=patients[0].id,
                      category_id=categories["cardiology"].id, status="approved",
                      reason="Cardiology consultation",
                      decided_at=NOW - timedelta(days=5), expires_at=NOW + timedelta(days=25)),
        AccessRequest(doctor_id=doctors[0].id, patient_id=patients[1].id,
                      category_id=categories["cardiology"].id, status="approved",
                      reason="Post-hospitalization follow-up",
                      decided_at=NOW - timedelta(days=10), expires_at=NOW + timedelta(days=20)),
        AccessRequest(doctor_id=doctors[2].id, patient_id=patients[1].id,
                      category_id=categories["endocrinology"].id, status="approved",
                      reason="Diabetes management",
                      decided_at=NOW - timedelta(days=3), expires_at=NOW + timedelta(days=27)),
        AccessRequest(doctor_id=doctors[1].id, patient_id=patients[2].id,
                      category_id=categories["neurology"].id, status="pending",
                      reason="Migraine follow-up"),
    ]
    db.add_all(ar)
    counts["access_requests"] = len(ar)

    db.commit()
    total = sum(counts.values())
    print("Seeded demo data:")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print(f"  TOTAL records: {total}")
    print("\nDemo logins (password 'demo123'): nino@demo.ge, giorgi@demo.ge, mariam@demo.ge (patients);")
    print("cardio@demo.ge, neuro@demo.ge, endo@demo.ge (doctors)")


if __name__ == "__main__":
    seed()

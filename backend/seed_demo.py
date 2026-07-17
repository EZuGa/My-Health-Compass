"""Populate the database with demo data (everything the frontend renders).

Run from backend/:  python seed_demo.py
Uses DATABASE_URL from .env / environment (works with PostgreSQL or SQLite).

Creates: 3 patients, 3 doctors, the full metric catalog, a weekly observation
series for every catalog metric (so every dashboard chart has data), wearable +
chat vitals, assessments (Georgian-EHR fields), a rich medical history (profile
items), calendar events (appointments / reminders / medication schedule), and
access grants. All demo accounts use password: demo123
"""
import math
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.auth import hash_password
from app.database import Base, SessionLocal, engine
from app.main import DEFAULT_CATEGORIES
from app.metrics_catalog import METRICS_SEED
from app.models import (
    AccessRequest, Assessment, AssessmentActivity, AssessmentDiagnosis, AssessmentVisit,
    CalendarEvent, Category, CategoryMetric, Observation, ProfileItem, User,
)

random.seed(42)
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()


def metric_series(m, n=14):
    """Deterministic weekly series around a metric's normal range."""
    lo, hi = m["range_low"], m["range_high"]
    if lo is not None and hi is not None and hi > lo:
        base = (lo + hi) / 2
        jitter = max((hi - lo) * 0.10, 0.01)
    elif lo is not None and hi is not None:  # range like [0,0] (tobacco)
        base, jitter = lo, 0.0
    else:
        base, jitter = {"weight": 71.5}.get(m["code"], 50.0), 1.0
    pts = []
    for i in range(n):
        ts = NOW - timedelta(days=(n - 1 - i) * 7)
        val = base + (math.sin(i * 1.3) + math.cos(i * 2.7) * 0.5) * jitter
        digits = 0 if (hi and hi > 200) else 1 if (hi and hi > 5) else 2
        pts.append((ts, round(val, digits)))
    return pts


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ---- categories + metric catalog (mirrors app startup so this is standalone) ----
    existing = {c.code for c in db.scalars(select(Category))}
    for code, name in DEFAULT_CATEGORIES:
        if code not in existing:
            db.add(Category(code=code, name=name))
    db.commit()
    categories = {c.code: c for c in db.scalars(select(Category))}
    existing_metrics = {m.code for m in db.scalars(select(CategoryMetric))}
    for m in METRICS_SEED:
        if m["code"] not in existing_metrics and m["category"] in categories:
            db.add(CategoryMetric(
                category_id=categories[m["category"]].id,
                code=m["code"], name=m["name"], unit=m["unit"], box=m["box"],
                reference=m["reference"], range_low=m["range_low"],
                range_high=m["range_high"], modality=m["modality"],
                diagnostic_group=m["diagnostic_group"],
            ))
    db.commit()

    if db.scalar(select(func.count(User.id)).where(User.email.like("%@demo.ge"))):
        print("Demo data already present — nothing to do.")
        return

    pw = hash_password("demo123")

    patients = [
        User(role="patient", email="nino@demo.ge", password_hash=pw, full_name="Nino Kapanadze",
             personal_number="01001011111", date_of_birth=datetime(1985, 3, 12).date(),
             blood_group="A+", phone="+995 555 111 111",
             address_region="Tbilisi", address_actual="Vazha-Pshavela Ave 27, apt 14, Tbilisi"),
        User(role="patient", email="giorgi@demo.ge", password_hash=pw, full_name="Giorgi Melikidze",
             personal_number="01001022222", date_of_birth=datetime(1972, 11, 3).date(),
             blood_group="O-", phone="+995 555 222 222",
             address_region="Imereti", address_actual="Rustaveli St 8, Kutaisi"),
        User(role="patient", email="mariam@demo.ge", password_hash=pw, full_name="Mariam Tsiklauri",
             personal_number="01001033333", date_of_birth=datetime(1996, 7, 25).date(),
             blood_group="B+", phone="+995 555 333 333",
             address_region="Tbilisi", address_actual="Chavchavadze Ave 45, Tbilisi"),
    ]
    doctors = [
        User(role="doctor", email="cardio@demo.ge", password_hash=pw, personal_number="01005044444",
             full_name="Levan Beridze", specialty="cardiology"),
        User(role="doctor", email="neuro@demo.ge", password_hash=pw, personal_number="01005055555",
             full_name="Tamar Gelashvili", specialty="neurology"),
        User(role="doctor", email="endo@demo.ge", password_hash=pw, personal_number="01005066666",
             full_name="Irakli Japaridze", specialty="endocrinology"),
    ]
    db.add_all(patients + doctors)
    db.commit()
    for u in patients + doctors:
        db.refresh(u)

    counts = {"users": len(patients) + len(doctors)}
    metrics = {m.code: m for m in db.scalars(select(CategoryMetric))}

    # ---- full observation series: every catalog metric for patient 1 (so every
    #      dashboard box + Diagnostic Data chart has real data) ----
    obs = 0
    for mseed in METRICS_SEED:
        cm = metrics.get(mseed["code"])
        if cm is None:
            continue
        source = "wearable" if mseed["modality"] == "wearable" else (
            "lab" if mseed["modality"] == "lab" else "manual")
        for ts, val in metric_series(mseed):
            db.add(Observation(
                patient_id=patients[0].id, recorded_by=patients[0].id,
                category_id=cm.category_id, box=cm.box or "general", metric=cm.code,
                value_num=val, unit=cm.unit, observed_at=ts,
                source_kind=source, source_label=source,
            ))
            obs += 1

    # a lighter set for patients 2 and 3 so their dashboards aren't empty
    for p, codes in [
        (patients[1], ["blood_pressure_systolic", "blood_pressure_diastolic", "hba1c", "ldl_cholesterol"]),
        (patients[2], ["pulse", "weight", "steps", "sleep_hours"]),
    ]:
        for code in codes:
            cm = metrics.get(code)
            if not cm:
                continue
            for ts, val in metric_series({**next(m for m in METRICS_SEED if m["code"] == code)}, n=8):
                db.add(Observation(
                    patient_id=p.id, recorded_by=p.id, category_id=cm.category_id,
                    box=cm.box or "general", metric=cm.code, value_num=val, unit=cm.unit,
                    observed_at=ts, source_kind="chat", source_label="AI intake",
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
        admitted = NOW - timedelta(days=60 - i * 9)
        a = Assessment(
            patient_id=p.id, doctor_id=d.id, category_id=categories[cat].id,
            episode_type=ep, visit_date=admitted,
            status="completed", completed_at=admitted + timedelta(days=1),
            medical_record_number=f"MRN-2026-{1000 + i}",
            case_number=f"CASE-2026-{1000 + i}",
            first_visit_end_at=admitted + timedelta(hours=1),
            discharge_at=admitted + timedelta(days=3 if ep == "inpatient" else 0, hours=2),
            hospitalization_type="გეგმიური (planned)" if ep != "emergency_outpatient" else "გადაუდებელი (emergency)",
            complaints=complaints, clinical_diagnosis_icd10=icd,
            final_diagnosis_icd10=icd, diagnosis_description=desc,
            treatment_notes=notes, recommendations=rec,
            outcome="გაუმჯობესება (improvement)",
            episode_result="გაწერილი (discharged)",
            disease_outcome="გაუმჯობესება (improvement)",
        )
        if ep == "inpatient":
            a.transportation_type = "სასწრაფო დახმარების მანქანით (ambulance)"
            a.hospitalized_for_this_disease = True
            a.bed_days = 3
        db.add(a)
        db.flush()
        # every completed episode gets its mandatory final main diagnosis record
        db.add(AssessmentDiagnosis(
            assessment_id=a.id, kind="final_main", icd10_code=icd, description=desc,
            disease_course="მწვავე (acute)" if ep == "emergency_outpatient" else "ქრონიკული (chronic)",
        ))
        if ep == "inpatient":
            # full spec-compliant inpatient episode: diagnoses + treatment process
            db.add_all([
                AssessmentDiagnosis(
                    assessment_id=a.id, kind="preliminary", icd10_code="I20.9",
                    description="Angina pectoris, unspecified", established_at=admitted,
                ),
                AssessmentDiagnosis(
                    assessment_id=a.id, kind="clinical", icd10_code=icd,
                    description=desc, established_at=admitted + timedelta(hours=6),
                ),
                AssessmentDiagnosis(
                    assessment_id=a.id, kind="final_comorbidity", icd10_code="I10",
                    description="Essential hypertension", disease_course="ქრონიკული (chronic)",
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="examination_note",
                    care="სტანდარტული მოვლა", started_at=admitted + timedelta(hours=2),
                    result_note="Patient stable, chest pain subsided on nitrates. BP 150/95.",
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="diagnostic_exam",
                    name="Coronary angiography", ncsp_code="FN1AE", care="სტანდარტული მოვლა",
                    result_date=admitted + timedelta(days=1),
                    result_note="60% LAD stenosis; medical therapy chosen", icd10_code=icd,
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="lab_test",
                    name="Troponin I (high sensitivity)", care="სტანდარტული მოვლა",
                    result_date=admitted + timedelta(hours=3),
                    result_note="0.02 ng/mL — within normal limits",
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="consultation",
                    name="Endocrinology consultation", ncsp_code="XS2ME", care="სტანდარტული მოვლა",
                    started_at=admitted + timedelta(days=1, hours=4),
                    result_note="Glycemic control acceptable; continue metformin",
                    details={"specialty": "endocrinology", "consultant_name": "Dr. Irakli Japaridze"},
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="prescription",
                    name="Aspirin 100mg + Clopidogrel 75mg",
                    result_note="Dual antiplatelet therapy",
                    details={"quantity": 30, "intake_instructions": "1x daily each, morning"},
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="discharge_consultation",
                    name="Cardiology follow-up", ncsp_code="XS2PA",
                    result_date=admitted + timedelta(days=33),
                    result_note="Re-evaluate therapy in 1 month",
                    details={"specialty": "cardiology"},
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="discharge_lab_test",
                    name="Lipid panel + hs-CRP",
                    result_date=admitted + timedelta(days=30),
                    result_note="Fasting sample",
                ),
                AssessmentActivity(
                    assessment_id=a.id, activity_type="discharge_prescription",
                    name="Atorvastatin 40mg",
                    result_note="High-intensity statin",
                    details={"form": "tablet", "substitution_allowed": 1, "quantity": 30,
                             "intake_instructions": "1x daily, evening"},
                ),
            ])
        elif ep == "emergency_outpatient":
            db.add(AssessmentVisit(
                assessment_id=a.id, started_at=admitted,
                ended_at=admitted + timedelta(hours=3),
                comment="Emergency visit: triptan administered, observed 3h, discharged symptom-free",
            ))
    counts["assessments"] = len(assessments_data)

    # ---- profile items (anamnesis vitae) — rich for patient 1 ----
    profile_data = [
        (patients[0], "allergy", "Penicillin", "Skin rash", None),
        (patients[0], "allergy", "Pollen (seasonal)", "Allergic rhinitis in spring", None),
        (patients[0], "chronic_condition", "Mixed dyslipidemia", "LDL elevated, on statin", "2022-05-01"),
        (patients[0], "chronic_condition", "Stage 1 hypertension", "Controlled on ACE inhibitor", "2026-01-10"),
        (patients[0], "medication", "Bisoprolol 2.5mg", "1x daily, morning", None),
        (patients[0], "medication", "Atorvastatin 20mg", "1x daily, evening", None),
        (patients[0], "medication", "Lisinopril 20mg", "1x daily, morning", None),
        (patients[0], "immunization", "COVID-19 (Pfizer)", "2 doses + booster", "2023-11-10"),
        (patients[0], "immunization", "Influenza", "Annual", "2025-10-05"),
        (patients[0], "surgery", "Appendectomy", "Laparoscopic, uncomplicated", "2009-06-20"),
        (patients[0], "family_history", "Father — myocardial infarction at 62", None, None),
        (patients[0], "family_history", "Mother — type 2 diabetes", None, None),
        (patients[0], "social_history", "Never smoker; ~3 glasses wine/week", None, None),
        (patients[0], "screening", "Mammography — BI-RADS 1", "Normal", "2025-04-12"),
        (patients[0], "past_disease", "Pneumonia", "Community-acquired, fully recovered", "2018-02-10"),
        (patients[1], "chronic_condition", "Hypertension", None, "2015-06-01"),
        (patients[1], "chronic_condition", "Type 2 diabetes", None, "2024-02-15"),
        (patients[1], "medication", "Metformin 850mg", "2x daily", None),
        (patients[1], "medication", "Atorvastatin 20mg", "1x daily, evening", None),
        (patients[1], "surgery", "Appendectomy", None, "1999-08-20"),
        (patients[1], "past_disease", "Viral hepatitis A", "Full recovery", "1990-05-01"),
        (patients[1], "blood_transfusion", "Packed red blood cells", "2 units after appendectomy bleeding", "1999-08-21"),
        (patients[2], "allergy", "Pollen (seasonal)", "Rhinitis", None),
        (patients[2], "family_history", "Migraine (mother)", None, None),
        (patients[2], "pregnancy", "Pregnancy statistics", "Pregnancies: 1, Births: 1 (2023, uncomplicated)", "2023-09-14"),
    ]
    for p, t, name, detail, when in profile_data:
        db.add(ProfileItem(
            patient_id=p.id, item_type=t, name=name, detail=detail,
            occurred_on=datetime.strptime(when, "%Y-%m-%d").date() if when else None,
        ))
    counts["profile_items"] = len(profile_data)

    # ---- calendar: appointments, reminders, medication schedule for patient 1 ----
    calendar_data = [
        ("appointment", "Cardiology follow-up — Dr. Beridze", 5, "10:30", "Clinic room 204"),
        ("appointment", "Lab draw: lipid panel + hs-CRP", 9, "08:00", "Fasting required"),
        ("appointment", "Primary care annual visit", 17, "09:00", None),
        ("reminder", "Refill atorvastatin", 2, None, None),
        ("reminder", "Submit home BP log", 4, None, None),
        ("reminder", "Log overnight sleep", 1, None, None),
        ("medication", "Bisoprolol 2.5mg", 0, "08:00", "Once daily, morning"),
        ("medication", "Atorvastatin 20mg", 0, "21:00", "Once daily, evening"),
        ("medication", "Lisinopril 20mg", 0, "08:00", "Once daily, morning"),
    ]
    for kind, title, day_offset, t, detail in calendar_data:
        db.add(CalendarEvent(
            patient_id=patients[0].id, kind=kind, title=title,
            event_date=TODAY + timedelta(days=day_offset), event_time=t, detail=detail,
        ))
    counts["calendar_events"] = len(calendar_data)

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

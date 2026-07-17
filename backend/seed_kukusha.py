"""Seed one data-rich demo patient: kukusha@demo.ge (password: demo123).

Run from backend/:  python seed_kukusha.py
Uses DATABASE_URL from .env / environment (works with PostgreSQL or SQLite).

Unlike seed_demo.py (which builds the whole demo world), this script builds a
single patient with a *deep* record so every screen has plenty of data:

- ~3 years of episodes (assessments) authored by 6 external doctors from other
  clinics — none of them are the seed_demo doctors — incl. one full inpatient
  surgery episode (Georgian-EHR treatment process) and one ER visit
- self-typed data: anamnesis-vitae profile items, home BP / weight / glucose
  observations (source: manual), and a few AI-intake (chat) entries
- 90 days of daily mobile-app / wearable data from two sources
  ("Health Compass App", "Mi Band 8")
- lab panels tied to the episodes
- uploaded documents (small generated PDFs on disk, so download works)
- calendar events and access grants

Idempotent: exits if kukusha's data is already seeded. If the account itself
already exists (e.g. registered through the app), it is reused — the password
is left untouched and only empty demographic fields are filled in.
"""
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.database import Base, SessionLocal, engine
from app.main import DEFAULT_CATEGORIES
from app.metrics_catalog import METRICS_SEED
from app.models import (
    AccessRequest, Assessment, AssessmentActivity, AssessmentDiagnosis, AssessmentVisit,
    CalendarEvent, Category, CategoryMetric, Observation, PatientDocument, ProfileItem, User,
)

random.seed(7)
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()


# ---------------------------------------------------------------- PDF helper
def write_pdf(path: Path, title: str, lines: list[str]) -> None:
    """Write a minimal but valid single-page PDF so document download works."""
    def esc(s: str) -> str:
        return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

    content = [f"BT /F1 14 Tf 50 800 Td ({esc(title)}) Tj /F1 10 Tf"]
    for line in lines:
        content.append(f"0 -18 Td ({esc(line)}) Tj")
    content.append("ET")
    stream = "\n".join(content).encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += b"%d 0 obj\n%s\nendobj\n" % (i, obj)
    xref_at = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objects) + 1)
    for off in offsets:
        out += b"%010d 00000 n \n" % off
    out += (
        b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"
        % (len(objects) + 1, xref_at)
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes(out))


def daily_series(days, base, jitter, trend=0.0, digits=0, weekend_boost=0.0, skip=0.0):
    """Daily values for the last `days` days, oldest first, with optional
    linear trend, weekend bump, and randomly missing days (device not worn)."""
    pts = []
    for i in range(days):
        if random.random() < skip:
            continue
        ts = NOW - timedelta(days=days - 1 - i, hours=random.randint(0, 5))
        val = base + trend * i + random.uniform(-jitter, jitter)
        if weekend_boost and ts.weekday() >= 5:
            val += weekend_boost
        pts.append((ts, round(val, digits) if digits else round(val)))
    return pts


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # ---- ensure categories + metric catalog (standalone safety) ----
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
    metrics = {m.code: m for m in db.scalars(select(CategoryMetric))}

    pw = hash_password("demo123")

    kukusha = db.scalar(select(User).where(User.email == "kukusha@demo.ge"))
    if kukusha is None:
        kukusha = User(role="patient", email="kukusha@demo.ge", password_hash=pw,
                       full_name="Kukusha Lomidze")
        db.add(kukusha)
    elif kukusha.role != "patient":
        print(f"kukusha@demo.ge exists with role '{kukusha.role}' — cannot seed patient data.")
        return
    if db.scalar(select(Assessment).where(Assessment.patient_id == kukusha.id).limit(1)):
        print("kukusha@demo.ge already has seeded data — nothing to do.")
        return
    # fill in demographics the registration form left empty (password untouched)
    kukusha.personal_number = kukusha.personal_number or "01001077777"
    kukusha.date_of_birth = kukusha.date_of_birth or datetime(1988, 9, 2).date()
    kukusha.blood_group = kukusha.blood_group or "AB+"
    kukusha.phone = kukusha.phone or "+995 555 777 777"
    kukusha.address_region = kukusha.address_region or "Tbilisi"
    kukusha.address_actual = kukusha.address_actual or "Pekini Ave 12, apt 31, Tbilisi"

    # External doctors from other clinics — intentionally NOT the seed_demo
    # doctors (cardio/neuro/endo@demo.ge). Same demo password.
    ext_doctors = [
        User(role="doctor", email="n.chkheidze@evex.ge", password_hash=pw,
             personal_number="01005088888", full_name="Nodar Chkheidze",
             specialty="gastroenterology"),
        User(role="doctor", email="s.abuladze@vivamedi.ge", password_hash=pw,
             personal_number="01005099999", full_name="Salome Abuladze",
             specialty="dermatology"),
        User(role="doctor", email="z.kiknadze@ingorokva.ge", password_hash=pw,
             personal_number="01005101010", full_name="Zurab Kiknadze",
             specialty="orthopedics"),
        User(role="doctor", email="e.tsereteli@respimed.ge", password_hash=pw,
             personal_number="01005111111", full_name="Eka Tsereteli",
             specialty="pulmonology"),
        User(role="doctor", email="d.okropiridze@curatio.ge", password_hash=pw,
             personal_number="01005121212", full_name="David Okropiridze",
             specialty="general"),
        User(role="doctor", email="a.khurtsidze@heartcenter.ge", password_hash=pw,
             personal_number="01005131313", full_name="Ana Khurtsidze",
             specialty="cardiology"),
    ]
    # get-or-create so a previous partial run doesn't trip the unique email
    ext_doctors = [
        db.scalar(select(User).where(User.email == d.email)) or d for d in ext_doctors
    ]
    db.add_all(ext_doctors)
    db.commit()
    db.refresh(kukusha)
    for d in ext_doctors:
        db.refresh(d)
    gastro, derm, ortho, pulmo, gp, cardio = ext_doctors
    counts = {"users": 1 + len(ext_doctors)}

    # ------------------------------------------------ assessments (~3 years)
    # (doctor, category, episode_type, days_ago, status, complaints, icd, desc,
    #  treatment notes, recommendations)
    episodes = [
        (gastro, "gastroenterology", "inpatient", 1050, "completed",
         "Recurrent right-upper-quadrant pain after fatty meals, nausea",
         "K80.2", "Calculus of gallbladder without cholecystitis",
         "Laparoscopic cholecystectomy performed on day 2, uncomplicated",
         "Light diet 2 weeks; suture removal day 10; GP follow-up"),
        (gp, "general", "outpatient", 900, "completed",
         "Routine annual check-up, no complaints",
         "Z00.0", "General adult medical examination",
         "Full lab panel taken; vitamin D deficiency found (22 ng/mL)",
         "Vitamin D3 2000 IU daily; repeat 25-OH-D in 6 months"),
        (pulmo, "pulmonology", "outpatient", 700, "completed",
         "Persistent night cough and wheezing for 2 months, worse with exercise",
         "J45.9", "Asthma, unspecified (mild persistent)",
         "Spirometry: FEV1 82% predicted, +14% after bronchodilator",
         "Budesonide/formoterol 160/4.5 2x daily; salbutamol PRN; review in 3 months"),
        (derm, "dermatology", "outpatient", 540, "completed",
         "Itchy dry patches on elbows and neck, flares in winter",
         "L20.9", "Atopic dermatitis, unspecified",
         "Topical corticosteroid course; emollients",
         "Fragrance-free emollients 2x daily; avoid hot showers"),
        (ortho, "orthopedics", "emergency_outpatient", 400, "completed",
         "Twisted right ankle playing football, painful swelling",
         "S93.4", "Sprain of ankle (lateral ligament)",
         "X-ray: no fracture. RICE protocol, elastic bandage",
         "Rest 2 weeks, ankle brace, physiotherapy exercises from week 2"),
        (gastro, "gastroenterology", "outpatient", 270, "completed",
         "Heartburn and regurgitation 3-4 nights a week",
         "K21.0", "Gastro-esophageal reflux disease with esophagitis",
         "H. pylori stool antigen negative; PPI trial started",
         "Omeprazole 20mg before breakfast 8 weeks; avoid late meals; sleep with raised headboard"),
        (gp, "general", "outpatient", 180, "completed",
         "Annual check-up; feels well, asks about cholesterol",
         "Z00.0", "General adult medical examination",
         "Labs improved vs last year; LDL still borderline (3.3 mmol/L)",
         "Mediterranean-style diet, keep running 2x/week; repeat lipids in 12 months"),
        (cardio, "cardiology", "outpatient", 90, "completed",
         "Occasional palpitations; home BP readings up to 140/90",
         "I10", "Essential (primary) hypertension, stage 1",
         "ECG normal sinus rhythm; 24h ABPM confirms stage 1 hypertension",
         "Lisinopril 10mg daily; home BP diary morning and evening; recheck in 3 months"),
        (cardio, "cardiology", "outpatient", 21, "completed",
         "Hypertension follow-up after starting lisinopril",
         "I10", "Essential (primary) hypertension — improving on therapy",
         "Home BP diary reviewed: mean 128/82 mmHg (was 138/88). "
         "Transthoracic echo: EF 62%, no LVH, normal valve function",
         "Continue lisinopril 10mg daily; keep BP diary; re-check in 6 months"),
        (pulmo, "pulmonology", "outpatient", 14, "open",
         "Scheduled asthma control review; occasional night symptoms",
         "J45.9", "Asthma, unspecified — control review",
         "ACT score 21/25; technique check done",
         None),
    ]
    n_dx = n_act = n_visits = 0
    for doc, cat, ep, days_ago, st, complaints, icd, desc, notes, rec in episodes:
        admitted = NOW - timedelta(days=days_ago)
        a = Assessment(
            patient_id=kukusha.id, doctor_id=doc.id, category_id=categories[cat].id,
            episode_type=ep, visit_date=admitted, status=st,
            medical_record_number=f"MRN-{admitted.year}-{7000 + days_ago}",
            case_number=f"CASE-{admitted.year}-{7000 + days_ago}",
            first_visit_end_at=admitted + timedelta(hours=1),
            hospitalization_type=("გადაუდებელი (emergency)" if ep == "emergency_outpatient"
                                  else "გეგმიური (planned)"),
            complaints=complaints, clinical_diagnosis_icd10=icd,
            diagnosis_description=desc, treatment_notes=notes, recommendations=rec,
        )
        if st == "completed":
            a.completed_at = admitted + timedelta(days=4 if ep == "inpatient" else 0, hours=3)
            a.discharge_at = a.completed_at
            a.final_diagnosis_icd10 = icd
            a.outcome = "გაუმჯობესება (improvement)"
            a.episode_result = "გაწერილი (discharged)"
            a.disease_outcome = "გაუმჯობესება (improvement)"
        if ep == "inpatient":
            a.transportation_type = "საკუთარი ტრანსპორტით (own transport)"
            a.hospitalized_for_this_disease = True
            a.bed_days = 4
        db.add(a)
        db.flush()

        db.add(AssessmentDiagnosis(
            assessment_id=a.id, kind="final_main" if st == "completed" else "clinical",
            icd10_code=icd, description=desc, established_at=admitted + timedelta(hours=2),
            disease_course="მწვავე (acute)" if ep == "emergency_outpatient" else "ქრონიკული (chronic)",
        ))
        n_dx += 1

        if ep == "inpatient":  # full Georgian-EHR surgical episode
            db.add_all([
                AssessmentDiagnosis(assessment_id=a.id, kind="preliminary",
                                    icd10_code="K80.9", description="Cholelithiasis, unspecified",
                                    established_at=admitted),
                AssessmentDiagnosis(assessment_id=a.id, kind="clinical", icd10_code=icd,
                                    description=desc, established_at=admitted + timedelta(hours=5)),
            ])
            n_dx += 2
            db.add_all([
                AssessmentActivity(assessment_id=a.id, activity_type="examination_note",
                                   care="სტანდარტული მოვლა", started_at=admitted + timedelta(hours=1),
                                   result_note="Afebrile, RUQ tenderness, Murphy positive. BP 124/80."),
                AssessmentActivity(assessment_id=a.id, activity_type="diagnostic_exam",
                                   name="Abdominal ultrasound", ncsp_code="JXDE00",
                                   result_date=admitted + timedelta(hours=4),
                                   result_note="Multiple gallbladder calculi up to 14mm, wall 3mm, CBD not dilated"),
                AssessmentActivity(assessment_id=a.id, activity_type="lab_test",
                                   name="CBC + CRP + liver panel",
                                   result_date=admitted + timedelta(hours=3),
                                   result_note="WBC 8.9, CRP 4 mg/L, bilirubin/ALT/AST normal"),
                AssessmentActivity(assessment_id=a.id, activity_type="anesthesia",
                                   name="General anesthesia (TIVA)",
                                   started_at=admitted + timedelta(days=1, hours=9),
                                   ended_at=admitted + timedelta(days=1, hours=11),
                                   result_note="ASA II, uneventful",
                                   details={"anesthesiologist": "Dr. Maia Kobakhidze"}),
                AssessmentActivity(assessment_id=a.id, activity_type="operation_protocol",
                                   name="Laparoscopic cholecystectomy", ncsp_code="JKA21",
                                   started_at=admitted + timedelta(days=1, hours=9, minutes=20),
                                   ended_at=admitted + timedelta(days=1, hours=10, minutes=35),
                                   result_note="4-port technique, calot triangle dissected, clips applied, "
                                               "gallbladder removed in retrieval bag. Blood loss ~20 mL.",
                                   details={"surgeon": "Dr. Nodar Chkheidze",
                                            "assistant": "Dr. Luka Managadze"}),
                AssessmentActivity(assessment_id=a.id, activity_type="histomorphology",
                                   name="Gallbladder specimen",
                                   result_date=admitted + timedelta(days=8),
                                   result_note="Chronic calculous cholecystitis, no dysplasia"),
                AssessmentActivity(assessment_id=a.id, activity_type="prescription",
                                   name="Paracetamol 1g IV -> PO",
                                   result_note="Post-op analgesia, 3 days",
                                   details={"intake_instructions": "3x daily"}),
                AssessmentActivity(assessment_id=a.id, activity_type="discharge_consultation",
                                   name="GP wound check", result_date=admitted + timedelta(days=10),
                                   result_note="Suture removal", details={"specialty": "general"}),
                AssessmentActivity(assessment_id=a.id, activity_type="discharge_other_recommendation",
                                   name="Diet", result_note="Low-fat diet for 2 weeks, then as tolerated"),
            ])
            n_act += 9
        elif ep == "emergency_outpatient":
            db.add(AssessmentVisit(
                assessment_id=a.id, started_at=admitted, ended_at=admitted + timedelta(hours=2),
                comment="ER visit: X-ray, elastic bandage, crutches issued, discharged same day",
            ))
            n_visits += 1
            db.add_all([
                AssessmentActivity(assessment_id=a.id, activity_type="diagnostic_exam",
                                   name="Ankle X-ray (2 views)", ncsp_code="NXDE12",
                                   result_date=admitted + timedelta(hours=1),
                                   result_note="No fracture; soft-tissue swelling laterally"),
                AssessmentActivity(assessment_id=a.id, activity_type="prescription",
                                   name="Ibuprofen gel 5%",
                                   result_note="Topical only — patient reports oral ibuprofen urticaria",
                                   details={"intake_instructions": "2-3x daily on ankle"}),
            ])
            n_act += 2
        else:
            extras = {
                "pulmonology": AssessmentActivity(
                    assessment_id=a.id, activity_type="diagnostic_exam", name="Spirometry",
                    ncsp_code="GXFX00", result_date=admitted + timedelta(hours=1),
                    result_note="FEV1 82% predicted, reversible obstruction (+14% post-BD)"),
                "gastroenterology": AssessmentActivity(
                    assessment_id=a.id, activity_type="lab_test", name="H. pylori stool antigen",
                    result_date=admitted + timedelta(days=2), result_note="Negative"),
                "cardiology": AssessmentActivity(
                    assessment_id=a.id, activity_type="diagnostic_exam", name="24h ABPM",
                    result_date=admitted + timedelta(days=2),
                    result_note="Daytime mean 138/88 mmHg, nocturnal dipping preserved")
                if days_ago > 60 else AssessmentActivity(
                    assessment_id=a.id, activity_type="diagnostic_exam",
                    name="Transthoracic echocardiography", ncsp_code="FXDE10",
                    result_date=admitted + timedelta(hours=1),
                    result_note="EF 62%, normal chamber sizes, no LVH, normal valve function"),
                "general": AssessmentActivity(
                    assessment_id=a.id, activity_type="lab_test", name="Annual lab panel",
                    result_date=admitted + timedelta(days=1),
                    result_note="See attached lab report"),
                "dermatology": AssessmentActivity(
                    assessment_id=a.id, activity_type="prescription",
                    name="Methylprednisolone aceponate 0.1% cream",
                    result_note="Thin layer 1x daily, max 2 weeks",
                    details={"intake_instructions": "1x daily on affected areas"}),
            }
            if cat in extras:
                db.add(extras[cat])
                n_act += 1
    counts["assessments"] = len(episodes)
    counts["diagnoses"] = n_dx
    counts["activities"] = n_act
    counts["visits"] = n_visits

    # ------------------------------------- profile items (typed by the patient)
    profile_data = [
        ("allergy", "Ibuprofen (oral)", "Urticaria within an hour of intake", None),
        ("allergy", "Dust mites", "Perennial rhinitis, worse in the morning", None),
        ("allergy", "Cat dander", "Sneezing, itchy eyes", None),
        ("chronic_condition", "Asthma (mild persistent)", "On ICS/LABA since 2024", "2024-08-20"),
        ("chronic_condition", "GERD", "Night heartburn, controlled on PPI courses", "2025-10-25"),
        ("chronic_condition", "Hypertension, stage 1", "Started lisinopril 04/2026", "2026-04-18"),
        ("medication", "Budesonide/formoterol 160/4.5", "1 inhalation 2x daily", None),
        ("medication", "Salbutamol 100mcg inhaler", "PRN before exercise", None),
        ("medication", "Omeprazole 20mg", "Before breakfast, 8-week courses when reflux returns", None),
        ("medication", "Lisinopril 10mg", "1x daily, morning", None),
        ("medication", "Vitamin D3 2000 IU", "1x daily with food", None),
        ("immunization", "COVID-19 (Moderna)", "2 doses + booster", "2023-12-02"),
        ("immunization", "Influenza", "Annual", "2025-11-12"),
        ("immunization", "Tdap booster", None, "2019-05-30"),
        ("immunization", "Hepatitis B (full series)", "Childhood schedule", "1996-01-01"),
        ("surgery", "Laparoscopic cholecystectomy", "Evex Hospital, uncomplicated", "2023-09-01"),
        ("surgery", "Wisdom tooth extraction (x2)", "Lower left and right", "2016-03-11"),
        ("screening", "Eye exam", "Myopia -1.5 D both eyes, glasses prescribed", "2025-06-14"),
        ("screening", "Dental check-up", "One filling replaced", "2026-02-07"),
        ("screening", "Full-body skin check", "No suspicious lesions", "2025-09-03"),
        ("family_history", "Father — hypertension from age 50", None, None),
        ("family_history", "Mother — asthma", None, None),
        ("family_history", "Grandfather (paternal) — stroke at 70", None, None),
        ("social_history", "Ex-smoker: ~5 pack-years, quit 2019", None, None),
        ("social_history", "Software engineer, sedentary job; runs 2x/week, football on Sundays", None, None),
        ("social_history", "Alcohol: 2-3 beers/week", None, None),
        ("past_disease", "Chickenpox", "Childhood, no complications", "1994-06-01"),
        ("past_disease", "COVID-19 (mild)", "Home treatment, full recovery", "2022-01-15"),
        ("past_disease", "Right ankle sprain", "Football injury, healed with physio", "2025-06-13"),
    ]
    for t, name, detail, when in profile_data:
        db.add(ProfileItem(
            patient_id=kukusha.id, item_type=t, name=name, detail=detail,
            occurred_on=datetime.strptime(when, "%Y-%m-%d").date() if when else None,
        ))
    counts["profile_items"] = len(profile_data)

    # ------------------------------------------------------------ observations
    def add_obs(code, ts, val, source_kind, source_label, recorded_by=None, note=None):
        cm = metrics[code]
        db.add(Observation(
            patient_id=kukusha.id, recorded_by=recorded_by or kukusha.id,
            category_id=cm.category_id, box=cm.box or "general", metric=cm.code,
            value_num=val, unit=cm.unit, observed_at=ts,
            source_kind=source_kind, source_label=source_label, note=note,
        ))

    obs = 0
    # 90 days of mobile-app / wearable data from two sources
    wearable_plan = [
        # code, base, jitter, trend/day, digits, weekend boost, source
        ("steps", 9200, 2600, 0, 0, 3500, "Health Compass App"),
        ("active_minutes", 52, 22, 0.05, 0, 35, "Health Compass App"),
        ("sleep_hours", 7.1, 0.8, 0.002, 1, 0.6, "Mi Band 8"),
        ("sleep_efficiency", 90, 4, 0, 0, 0, "Mi Band 8"),
        ("deep_sleep_min", 92, 18, 0, 0, 0, "Mi Band 8"),
        ("overnight_spo2", 96.5, 1.0, 0, 1, 0, "Mi Band 8"),
        ("nocturnal_rr", 14.5, 1.4, 0, 0, 0, "Mi Band 8"),
        ("resting_heart_rate", 66, 3, -0.03, 0, 0, "Mi Band 8"),
        ("hrv", 62, 10, 0.06, 0, 0, "Mi Band 8"),
    ]
    for code, base, jitter, trend, digits, wknd, source in wearable_plan:
        for ts, val in daily_series(90, base, jitter, trend, digits, wknd, skip=0.05):
            add_obs(code, ts, val, "wearable", source)
            obs += 1

    # Self-typed home measurements (manual): BP diary since the cardiology
    # visit, weekly weight, monthly waist, sporadic glucose
    for week in range(12):
        for dow in (0, 2, 5):
            ts = NOW - timedelta(days=(11 - week) * 7 + (6 - dow), hours=random.randint(12, 16))
            sys_v = round(random.uniform(124, 141) - week * 0.5)
            dia_v = round(random.uniform(78, 91) - week * 0.3)
            add_obs("blood_pressure_systolic", ts, sys_v, "manual", "Self-reported",
                    note="Home BP diary")
            add_obs("blood_pressure_diastolic", ts, dia_v, "manual", "Self-reported")
            obs += 2
    for week in range(26):
        ts = NOW - timedelta(days=(25 - week) * 7, hours=8)
        add_obs("weight", ts, round(83.5 - week * 0.07 + random.uniform(-0.5, 0.5), 1),
                "manual", "Self-reported")
        obs += 1
    for month in range(6):
        ts = NOW - timedelta(days=(5 - month) * 30, hours=9)
        add_obs("waist_circumference", ts, round(95 - month * 0.5 + random.uniform(-1, 1)),
                "manual", "Self-reported")
        obs += 1
    for _ in range(12):
        ts = NOW - timedelta(days=random.randint(1, 170), hours=random.randint(6, 20))
        add_obs("blood_glucose", ts, round(random.uniform(4.4, 6.0), 1),
                "manual", "Self-reported", note="Fingerstick, fasting")
        obs += 1

    # A few AI-intake (chat) entries
    for code, val, days_ago in [("pulse", 72, 3), ("pulse", 68, 21), ("weight", 81.9, 10),
                                ("sleep_hours", 6.5, 5), ("blood_pressure_systolic", 131, 8),
                                ("blood_pressure_diastolic", 84, 8)]:
        add_obs(code, NOW - timedelta(days=days_ago, hours=2), val, "chat", "AI intake")
        obs += 1

    # Lab panels tied to episodes (recorded by the ordering doctor)
    lab_panels = [
        (1050, "Evex Hospital Lab", gastro.id,
         {"hemoglobin": 145, "wbc": 8.9, "blood_glucose": 5.2}),
        (900, "Curatio Lab", gp.id,
         {"total_cholesterol": 5.4, "ldl_cholesterol": 3.6, "hdl_cholesterol": 1.2,
          "triglycerides": 1.9, "blood_glucose": 5.3, "hba1c": 5.6, "hemoglobin": 148,
          "vitamin_d": 22, "egfr": 102, "sodium": 141, "potassium": 4.3}),
        (180, "Curatio Lab", gp.id,
         {"total_cholesterol": 5.1, "ldl_cholesterol": 3.3, "hdl_cholesterol": 1.3,
          "triglycerides": 1.6, "blood_glucose": 5.0, "hba1c": 5.4, "hemoglobin": 151,
          "vitamin_d": 31, "egfr": 105}),
        (90, "Heart Center Lab", cardio.id,
         {"total_cholesterol": 4.8, "ldl_cholesterol": 3.0, "hdl_cholesterol": 1.35,
          "triglycerides": 1.4, "sodium": 140, "potassium": 4.4, "egfr": 104}),
    ]
    for days_ago, lab, doc_id, values in lab_panels:
        ts = NOW - timedelta(days=days_ago, hours=-9)
        for code, val in values.items():
            if code in metrics:
                add_obs(code, ts, val, "lab", lab, recorded_by=doc_id)
                obs += 1
    counts["observations"] = obs

    # ------------------------------------------------------------- documents
    upload_dir = Path(settings.upload_dir) / str(kukusha.id) / "documents"
    docs_data = [
        ("discharge_cholecystectomy.pdf", "Discharge Summary - Evex Hospital", 1046,
         "Discharge summary: laparoscopic cholecystectomy (K80.2), uncomplicated",
         ["Patient: Kukusha Lomidze   DOB: 02.09.1988",
          "Episode: inpatient, 4 bed-days", "Diagnosis: K80.2 - Calculus of gallbladder",
          "Procedure: Laparoscopic cholecystectomy (JKA21)",
          "Course: uncomplicated, discharged on post-op day 3",
          "Recommendations: low-fat diet 2 weeks, suture removal day 10"]),
        ("annual_labs_2026.pdf", "Laboratory Report - Curatio", 180,
         "Annual check-up lab panel: lipids improved, vitamin D normalised",
         ["Total cholesterol 5.1 mmol/L (ref < 5.2)", "LDL 3.3 mmol/L (ref < 3.34)",
          "HDL 1.3 mmol/L", "Triglycerides 1.6 mmol/L", "HbA1c 5.4 %",
          "Vitamin D 31 ng/mL (was 22)", "eGFR 105 mL/min/1.73m2"]),
        ("spirometry_2024.pdf", "Spirometry Report - RespiMed", 700,
         "Spirometry: FEV1 82% predicted, reversible obstruction — supports asthma dx",
         ["FVC 4.61 L (98% pred)", "FEV1 3.32 L (82% pred)", "FEV1/FVC 0.72",
          "Post-bronchodilator FEV1 +14%", "Interpretation: mild reversible obstruction"]),
        ("ankle_xray_2025.pdf", "Radiology Report - Ingorokva Clinic", 400,
         "Right ankle X-ray after football injury: no fracture",
         ["Right ankle, AP + lateral views",
          "No acute fracture or dislocation", "Lateral soft-tissue swelling",
          "Conclusion: lateral ligament sprain, conservative treatment"]),
    ]
    for fname, title, days_ago, summary, lines in docs_data:
        dest = upload_dir / fname
        write_pdf(dest, title, lines)
        db.add(PatientDocument(
            patient_id=kukusha.id, file_path=str(dest), original_name=fname,
            mime="application/pdf", summary=summary, source_kind="document",
            occurred_at=NOW - timedelta(days=days_ago),
        ))
    counts["documents"] = len(docs_data)

    # -------------------------------------------------------------- calendar
    calendar_data = [
        ("appointment", "Pulmonology review — Dr. Tsereteli", 7, "11:00", "RespiMed, room 12; bring inhaler"),
        ("appointment", "Fasting lab draw: lipids + 25-OH-D", 12, "08:15", "Curatio Lab; fasting 10h"),
        ("appointment", "Cardiology BP re-check — Dr. Khurtsidze", 24, "16:30", "Heart Center, bring BP diary"),
        ("appointment", "Dental cleaning", 33, "13:00", None),
        ("reminder", "Refill omeprazole", 3, None, None),
        ("reminder", "Replace inhaler (counter < 20 doses)", 18, None, None),
        ("reminder", "Log home BP (morning + evening)", 1, None, None),
        ("medication", "Budesonide/formoterol 160/4.5", 0, "08:00", "1 inhalation, 2x daily (08:00 / 20:00)"),
        ("medication", "Lisinopril 10mg", 0, "08:00", "Once daily, morning"),
        ("medication", "Omeprazole 20mg", 0, "07:30", "30 min before breakfast"),
        ("medication", "Vitamin D3 2000 IU", 0, "09:00", "With breakfast"),
    ]
    for kind, title, day_offset, t, detail in calendar_data:
        db.add(CalendarEvent(
            patient_id=kukusha.id, kind=kind, title=title,
            event_date=TODAY + timedelta(days=day_offset), event_time=t, detail=detail,
        ))
    counts["calendar_events"] = len(calendar_data)

    # -------------------------------------------------------- access requests
    ar = [
        AccessRequest(doctor_id=pulmo.id, patient_id=kukusha.id,
                      category_id=categories["pulmonology"].id, status="approved",
                      reason="Ongoing asthma management",
                      decided_at=NOW - timedelta(days=14), expires_at=NOW + timedelta(days=16)),
        AccessRequest(doctor_id=cardio.id, patient_id=kukusha.id,
                      category_id=categories["cardiology"].id, status="approved",
                      reason="Hypertension follow-up",
                      decided_at=NOW - timedelta(days=7), expires_at=NOW + timedelta(days=23)),
    ]
    demo_cardio = db.scalar(select(User).where(User.email == "cardio@demo.ge"))
    if demo_cardio:
        ar.append(AccessRequest(
            doctor_id=demo_cardio.id, patient_id=kukusha.id,
            category_id=categories["cardiology"].id, status="pending",
            reason="Second opinion on hypertension management"))
    db.add_all(ar)
    counts["access_requests"] = len(ar)

    db.commit()
    print("Seeded kukusha@demo.ge:")
    for k, v in counts.items():
        print(f"  {k}: {v}")
    print(f"  TOTAL records: {sum(counts.values())}")
    print("\nLogin: kukusha@demo.ge / demo123 (patient)")
    print("External doctors (same password):",
          ", ".join(d.email for d in ext_doctors))


if __name__ == "__main__":
    seed()

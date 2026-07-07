"""Catalog data served to the frontend so nothing is hardcoded client-side.

Three catalogs live here:
  * HEALTH_BOXES  — the six dashboard domains (id, title, subtitle)
  * APP_SECTIONS  — the NEJM-style clinical-record sections (sidebar nav)
  * METRICS_SEED  — every trackable metric with display name, unit, reference
                    range, dashboard box, modality and diagnostic grouping.

`box` matches HEALTH_BOXES ids. Metric `code` doubles as the observation
metric code, so a metric's catalog entry describes any observation with that
code (name, unit, normal range for chart shading, etc.).
"""

# ---- dashboard domains (id, title, subtitle) ----
HEALTH_BOXES = [
    ("heart", "Heart & Circulation", "Cardiovascular system, the largest driver of mortality"),
    ("metabolic", "Metabolic & Kidney Health", "CKM syndrome: metabolism, kidneys, and the heart"),
    ("fitness", "Fitness & Physical Function", "Cardiorespiratory fitness, the strongest modifiable predictor"),
    ("sleep", "Sleep & Recovery", "Restorative physiology — the 8th of Life's Essential 8"),
    ("mind", "Mind & Well-being", "Psychological health as cardiovascular context"),
    ("exposures", "Exposures & Prevention", "The story behind the numbers"),
]

# ---- clinical-record sections (sidebar), (id, title) ----
APP_SECTIONS = [
    ("patient-id", "1. Patient Identification"),
    ("chief-complaint", "2. Chief Complaint"),
    ("hpi", "3. History of Present Illness"),
    ("pmh", "4. Past Medical History"),
    ("psh", "5. Past Surgical History"),
    ("meds", "6. Medications"),
    ("allergies", "7. Allergies & Adverse Reactions"),
    ("fhx", "8. Family History"),
    ("shx", "9. Social History"),
    ("imm", "10. Immunizations & Screening"),
    ("ros", "11. Review of Systems"),
    ("pe", "12. Physical Examination"),
    ("dx", "13. Diagnostic Data"),
    ("nutrition", "14. Nutrition"),
    ("timeline", "15. Clinical Timeline"),
]


def _m(category, code, name, unit, box, reference=None, lo=None, hi=None,
       modality="vital", group=None):
    return {
        "category": category, "code": code, "name": name, "unit": unit,
        "box": box, "reference": reference, "range_low": lo, "range_high": hi,
        "modality": modality, "diagnostic_group": group,
    }


# ---- full metric catalog ----
METRICS_SEED = [
    # -------- heart --------
    _m("cardiology", "blood_pressure_systolic", "Systolic BP", "mmHg", "heart", "<120", 90, 120),
    _m("cardiology", "blood_pressure_diastolic", "Diastolic BP", "mmHg", "heart", "<80", 60, 80),
    _m("cardiology", "pulse", "Pulse / heart rate", "bpm", "heart", "60–100", 60, 100),
    _m("cardiology", "resting_heart_rate", "Resting heart rate", "bpm", "heart", "60–80", 60, 80),
    _m("cardiology", "hrv", "Heart rate variability", "ms", "heart", ">50", 50, 100),
    _m("cardiology", "ldl_cholesterol", "LDL cholesterol", "mmol/L", "heart", "≤3.34", 0, 3.34, "lab", "Lipid panel"),
    _m("cardiology", "hdl_cholesterol", "HDL cholesterol", "mmol/L", "heart", ">1.15", 1.15, 2.5, "lab", "Lipid panel"),
    _m("cardiology", "triglycerides", "Triglycerides", "mmol/L", "heart", "<2.30", 0, 2.3, "lab", "Lipid panel"),
    _m("cardiology", "total_cholesterol", "Total cholesterol", "mmol/L", "heart", "<5.20", 0, 5.2, "lab", "Lipid panel"),
    # -------- metabolic --------
    _m("endocrinology", "hba1c", "HbA1c", "%", "metabolic", "4.8–5.9", 4.8, 5.9, "lab", "Glycemic"),
    _m("endocrinology", "blood_glucose", "Fasting glucose", "mmol/L", "metabolic", "3.9–5.5", 3.9, 5.5, "lab", "Glycemic"),
    _m("general", "bmi", "BMI", "kg/m²", "metabolic", "18.5–24.9", 18.5, 24.9),
    _m("general", "waist_circumference", "Waist circumference", "cm", "metabolic", "<88", 60, 88),
    _m("endocrinology", "sodium", "Sodium", "mmol/L", "metabolic", "135–145", 135, 145, "lab", "Electrolytes & renal"),
    _m("endocrinology", "potassium", "Potassium", "mmol/L", "metabolic", "3.5–5.1", 3.5, 5.1, "lab", "Electrolytes & renal"),
    _m("endocrinology", "magnesium", "Magnesium", "mmol/L", "metabolic", "0.66–1.07", 0.66, 1.07, "lab", "Electrolytes & renal"),
    _m("endocrinology", "egfr", "eGFR", "mL/min/1.73m²", "metabolic", ">60", 60, 120, "lab", "Electrolytes & renal"),
    _m("general", "weight", "Body weight", "kg", "metabolic", None, None, None),
    # -------- fitness --------
    _m("general", "vo2max", "VO₂max (estimated)", "mL/kg/min", "fitness", ">30", 30, 50),
    _m("general", "steps", "Daily steps", "steps", "fitness", ">8,000", 8000, 15000, "wearable"),
    _m("general", "grip_strength", "Grip strength", "kg", "fitness", ">22", 22, 40),
    _m("general", "active_minutes", "Active minutes", "min", "fitness", "≥30", 30, 120, "wearable"),
    # -------- sleep --------
    _m("neurology", "sleep_hours", "Sleep duration", "hours", "sleep", "7–9", 7, 9, "wearable"),
    _m("neurology", "sleep_efficiency", "Sleep efficiency", "%", "sleep", ">85", 85, 100, "wearable"),
    _m("neurology", "deep_sleep_min", "Deep sleep", "min", "sleep", ">60", 60, 120, "wearable"),
    _m("pulmonology", "overnight_spo2", "Overnight SpO₂", "%", "sleep", ">94", 94, 100, "wearable"),
    _m("pulmonology", "nocturnal_rr", "Nocturnal resp. rate", "/min", "sleep", "12–18", 12, 18, "wearable"),
    # -------- mind --------
    _m("neurology", "phq9", "PHQ-9 score", "pts", "mind", "<5", 0, 5, "score"),
    _m("neurology", "k6_distress", "K-6 distress", "pts", "mind", "<5", 0, 5, "score"),
    _m("neurology", "life_satisfaction", "Life satisfaction", "0–10", "mind", "≥7", 7, 10, "score"),
    _m("neurology", "moca", "MoCA", "/30", "mind", "≥26", 26, 30, "score"),
    # -------- exposures --------
    _m("general", "mediterranean_diet_score", "Mediterranean diet score", "0–14", "exposures", "≥9", 9, 14, "score"),
    _m("general", "alcohol_intake", "Alcohol intake", "drinks/wk", "exposures", "≤7", 0, 7, "score"),
    _m("general", "tobacco_per_day", "Tobacco", "/day", "exposures", "0", 0, 0, "score"),
    _m("general", "medication_adherence", "Medication adherence", "%", "exposures", ">90", 90, 100, "score"),
    _m("general", "vitamin_d", "Vitamin D 25-OH", "ng/mL", "exposures", "30–60", 30, 60, "lab", "Vitamins"),
    # -------- diagnostics-only labs (grouped on the Diagnostic Data page) --------
    _m("general", "hemoglobin", "Hemoglobin", "g/L", "metabolic", "120–160", 120, 160, "lab", "Hematology"),
    _m("general", "hematocrit", "Hematocrit", "L/L", "metabolic", "0.36–0.46", 0.36, 0.46, "lab", "Hematology"),
    _m("general", "wbc", "White cell count", "10⁹/L", "metabolic", "4.0–10.0", 4.0, 10.0, "lab", "Hematology"),
    _m("general", "platelets", "Platelets", "10⁹/L", "metabolic", "150–400", 150, 400, "lab", "Hematology"),
    _m("general", "alt", "ALT", "U/L", "metabolic", "7–40", 7, 40, "lab", "Liver & metabolic"),
    _m("general", "ast", "AST", "U/L", "metabolic", "8–33", 8, 33, "lab", "Liver & metabolic"),
    _m("general", "creatinine", "Creatinine", "µmol/L", "metabolic", "45–84", 45, 84, "lab", "Electrolytes & renal"),
    _m("endocrinology", "tsh", "TSH", "µIU/mL", "metabolic", "0.4–4.0", 0.4, 4.0, "lab", "Endocrine"),
    _m("general", "hs_crp", "hs-CRP", "mg/L", "heart", "<3.0", 0, 3.0, "lab", "Inflammation"),
]

# recognized wearable sources for /wearables/sync
WEARABLE_SOURCES = ("apple_health", "samsung_health", "whoop", "fitbit", "garmin", "oura", "other")

"""Metric catalog seeded into category_metrics: (category_code, metric_code, name, unit, box).

`box` matches the frontend dashboard boxes: heart, metabolic, fitness, sleep, mind, exposures.
"""

METRICS_SEED = [
    # cardiology
    ("cardiology", "pulse", "Pulse / heart rate", "bpm", "heart"),
    ("cardiology", "blood_pressure_systolic", "Blood pressure (systolic)", "mmHg", "heart"),
    ("cardiology", "blood_pressure_diastolic", "Blood pressure (diastolic)", "mmHg", "heart"),
    # cardiology — wearable-sourced (Apple/Samsung Health, Whoop, Garmin...)
    ("cardiology", "resting_heart_rate", "Resting heart rate", "bpm", "heart"),
    ("cardiology", "hrv", "Heart rate variability", "ms", "heart"),
    ("cardiology", "vo2max", "VO2 max", "mL/kg/min", "fitness"),
    # ophthalmology
    ("ophthalmology", "visual_acuity", "Visual acuity", None, "mind"),
    ("ophthalmology", "intraocular_pressure", "Intraocular pressure", "mmHg", "mind"),
    # neurology
    ("neurology", "headache_severity", "Headache severity (0-10)", "score", "mind"),
    ("neurology", "sleep_hours", "Sleep duration", "h", "sleep"),
    # dermatology
    ("dermatology", "skin_condition", "Skin condition note", None, "exposures"),
    # endocrinology
    ("endocrinology", "blood_glucose", "Blood glucose", "mmol/L", "metabolic"),
    ("endocrinology", "hba1c", "HbA1c", "%", "metabolic"),
    # gastroenterology
    ("gastroenterology", "abdominal_pain_severity", "Abdominal pain severity (0-10)", "score", "metabolic"),
    # orthopedics
    ("orthopedics", "joint_pain_severity", "Joint pain severity (0-10)", "score", "fitness"),
    # pulmonology
    ("pulmonology", "spo2", "Oxygen saturation (SpO2)", "%", "heart"),
    ("pulmonology", "respiratory_rate", "Respiratory rate", "breaths/min", "heart"),
    ("pulmonology", "peak_flow", "Peak expiratory flow", "L/min", "fitness"),
    # urology
    ("urology", "urination_frequency", "Urination frequency", "per day", "metabolic"),
    # gynecology
    ("gynecology", "menstrual_cycle_length", "Menstrual cycle length", "days", "metabolic"),
    # general
    ("general", "weight", "Body weight", "kg", "metabolic"),
    ("general", "height", "Height", "cm", "metabolic"),
    ("general", "temperature", "Body temperature", "°C", "metabolic"),
    ("general", "steps", "Daily steps", "steps", "fitness"),
    # general — wearable-sourced
    ("general", "calories_burned", "Active calories burned", "kcal", "fitness"),
    ("general", "active_minutes", "Active minutes", "min", "fitness"),
    ("general", "body_fat_pct", "Body fat", "%", "metabolic"),
    ("neurology", "sleep_deep_hours", "Deep sleep duration", "h", "sleep"),
    ("neurology", "sleep_rem_hours", "REM sleep duration", "h", "sleep"),
]

# recognized wearable sources for /wearables/sync
WEARABLE_SOURCES = ("apple_health", "samsung_health", "whoop", "fitbit", "garmin", "oura", "other")

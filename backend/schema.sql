-- Medical App schema (PostgreSQL)
-- Run:  psql -U postgres -c "CREATE DATABASE medical_app;"
--       psql -U postgres -d medical_app -f schema.sql

BEGIN;

-- Patients and doctors in one table, discriminated by role
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    role            VARCHAR(10)  NOT NULL CHECK (role IN ('patient', 'doctor')),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    personal_number VARCHAR(20),                 -- პირადი ნომერი (Georgian personal ID)
    date_of_birth   DATE,
    phone           VARCHAR(30),
    blood_group     VARCHAR(10),                 -- სისხლის ჯგუფი და Rh-ფაქტორი
    specialty       VARCHAR(50),                 -- doctors only, e.g. 'cardiology'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Medical categories / specialties
CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    code VARCHAR(50)  NOT NULL UNIQUE,   -- machine name, e.g. 'cardiology'
    name VARCHAR(100) NOT NULL           -- display name
);

INSERT INTO categories (code, name) VALUES
    ('cardiology',       'Cardiology'),
    ('ophthalmology',    'Ophthalmology'),
    ('neurology',        'Neurology'),
    ('dermatology',      'Dermatology'),
    ('endocrinology',    'Endocrinology'),
    ('gastroenterology', 'Gastroenterology'),
    ('orthopedics',      'Orthopedics'),
    ('pulmonology',      'Pulmonology'),
    ('urology',          'Urology'),
    ('gynecology',       'Gynecology'),
    ('general',          'General / Family Medicine')
ON CONFLICT (code) DO NOTHING;

-- Doctor's assessment of a patient for one visit/episode.
-- Field names follow the EHR_SectionsFields spec (Georgian MoH EHR).
CREATE TABLE IF NOT EXISTS assessments (
    id                      SERIAL PRIMARY KEY,
    patient_id              INT NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    doctor_id               INT NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    category_id             INT NOT NULL REFERENCES categories(id),
    -- ეპიზოდის ტიპი: inpatient / day hospital / emergency outpatient / outpatient
    episode_type            VARCHAR(30) NOT NULL DEFAULT 'outpatient'
                            CHECK (episode_type IN
                              ('inpatient','day_hospital','emergency_outpatient','outpatient')),
    status                  VARCHAR(10) NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open','completed')),
    -- სამედიცინო ჩანაწერების მონაცემები (medical record header)
    medical_record_number   VARCHAR(50),   -- სამედიცინო ბარათის ისტორიის ნომერი [red]
    visit_date              TIMESTAMPTZ NOT NULL DEFAULT now(),  -- პაციენტის შემოსვლის თარიღი და დრო [red]
    first_visit_end_at      TIMESTAMPTZ,   -- პირველი ვიზიტის დასრულების თარიღი და დრო [red @completion]
    discharge_at            TIMESTAMPTZ,   -- პაციენტის გაწერის თარიღი და დრო [red @completion]
    case_number             VARCHAR(50),   -- ქეისის ნომერი (auto-filled at completion)
    -- დაავადების ანამნეზი (disease anamnesis)
    transportation_type     VARCHAR(50),   -- ტრანსპორტირების სახეობა [red: inpatient/day hospital]
    hospitalization_type    VARCHAR(100),  -- შემთხვევის/ჰოსპიტალიზაციის ტიპი [red]
    complaints              TEXT,          -- ჩივილები/სიმპტომები/მოკლე ანამნეზი [red]
    hospitalized_for_this_disease BOOLEAN, -- ჰოსპიტალიზებული ამ დაავადების გამო [red: inpatient]
    referring_institution   VARCHAR(255),  -- გამომგზავნი დაწესებულება (რეჰოსპიტალიზაცია)
    referral_date           DATE,          -- ექიმთან/დაწესებულებაში მიმართვის თარიღი
    -- legacy single-value diagnosis fields (repeatable records: assessment_diagnoses)
    preliminary_diagnosis_icd10 VARCHAR(20),   -- წინასწარი დიაგნოზი (ICD-10)
    clinical_diagnosis_icd10    VARCHAR(20),   -- კლინიკური დიაგნოზი (ICD-10)
    final_diagnosis_icd10       VARCHAR(20),   -- დასკვნითი (ძირითადი) დიაგნოზი (ICD-10)
    diagnosis_description   TEXT,          -- დიაგნოზის აღწერა
    treatment_notes         TEXT,          -- მკურნალობის პროცესი / ექიმის ჩანაწერი
    recommendations         TEXT,          -- გაწერის შემდგომი რეკომენდაციები
    outcome                 TEXT,          -- free-text outcome (legacy)
    -- ეპიზოდის გამოსავალი (episode outcome)
    episode_result          VARCHAR(100),  -- ეპიზოდის შედეგი [red]
    disease_outcome         VARCHAR(100),  -- დაავადების გამოსავალი [red unless death]
    outcome_comment         TEXT,          -- ექიმის დაზუსტება/კომენტარი
    bed_days                INT,           -- გატარებული საწოლდღეები (auto, inpatient)
    completed_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_assessments_patient_category
    ON assessments (patient_id, category_id);

-- Repeatable diagnosis records (წინასწარი / კლინიკური / დასკვნითი დიაგნოზები).
-- The spec requires exactly one 'final_main' per episode (enforced in the API).
CREATE TABLE IF NOT EXISTS assessment_diagnoses (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    kind            VARCHAR(20) NOT NULL CHECK (kind IN
                      ('preliminary','clinical','final_main','final_comorbidity','final_complication')),
    icd10_code      VARCHAR(20) NOT NULL,  -- დაავადება (ICD-10) [red]
    description     TEXT,
    established_at  TIMESTAMPTZ,           -- დადგენის თარიღი [red: clinical]
    disease_course  VARCHAR(100),          -- ავადმყოფობის მიმდინარეობა [red: final_*]
    refined_icd10   VARCHAR(20)            -- დაავადება (ICD-10) დაზუსტებული
);

CREATE INDEX IF NOT EXISTS ix_assessment_diagnoses_assessment
    ON assessment_diagnoses (assessment_id);

-- განხორციელებული ვიზიტები — repeatable visits (non-inpatient episodes, ≤24h each)
CREATE TABLE IF NOT EXISTS assessment_visits (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ NOT NULL,  -- ვიზიტის დაწყების თარიღი და დრო [red]
    ended_at        TIMESTAMPTZ,           -- ვიზიტის დასრულების თარიღი და დრო [red]
    comment         TEXT
);

CREATE INDEX IF NOT EXISTS ix_assessment_visits_assessment
    ON assessment_visits (assessment_id);

-- Treatment-process and post-discharge records, one generic table:
-- examination_note | observation | diagnostic_exam | lab_test | consultation |
-- accompanying_activity | other_recommendation | prescription | blood_transfusion |
-- intensive_care | anesthesia | operation_protocol | surgical_intervention |
-- histomorphology | discharge_* . Per-type mandatory rules: app/ehr_validation.py.
CREATE TABLE IF NOT EXISTS assessment_activities (
    id              SERIAL PRIMARY KEY,
    assessment_id   INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    activity_type   VARCHAR(40) NOT NULL,
    name            VARCHAR(255),          -- NCSP / lab / drug / activity name
    ncsp_code       VARCHAR(30),
    icd10_code      VARCHAR(20),
    care            VARCHAR(100),          -- მოვლა / მოვლის დონე
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    result_date     TIMESTAMPTZ,           -- შედეგის მიღების თარიღი
    result_note     TEXT,                  -- აქტივობის შედეგი / ექიმის კომენტარი / ოქმი
    details         JSONB,                 -- extras: specialty, consultant_name, blood_component,
                                           -- quantity_ml, quantity, operation_number, form,
                                           -- substitution_allowed, prescription_number ...
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_assessment_activities_assessment
    ON assessment_activities (assessment_id, activity_type);

-- Images / files attached to an assessment (X-rays, echo images, lab scans...)
CREATE TABLE IF NOT EXISTS assessment_images (
    id            SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    file_path     VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    description   VARCHAR(500),
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Doctor asks to see a patient's history for one category;
-- the patient approves or denies. An approved row is the access grant.
CREATE TABLE IF NOT EXISTS access_requests (
    id           SERIAL PRIMARY KEY,
    doctor_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id  INT NOT NULL REFERENCES categories(id),
    reason       TEXT,
    status       VARCHAR(10) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','denied','revoked')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    decided_at   TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ          -- set on approval (e.g. +30 days)
);

CREATE INDEX IF NOT EXISTS ix_access_requests_lookup
    ON access_requests (doctor_id, patient_id, category_id, status);

-- Anamnesis vitae: allergies, chronic conditions, meds, immunizations, surgeries...
-- (frontend sections pmh/psh/meds/allergies/imm; .xls "ცხოვრების ანამნეზი" block)
CREATE TABLE IF NOT EXISTS profile_items (
    id          SERIAL PRIMARY KEY,
    patient_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type   VARCHAR(20) NOT NULL CHECK (item_type IN
                ('allergy','chronic_condition','medication','immunization',
                 'surgery','screening','family_history','social_history')),
    name        VARCHAR(255) NOT NULL,        -- e.g. "Penicillin", "Hypertension"
    detail      TEXT,                         -- reaction, dose, clarification...
    icd10       VARCHAR(20),
    occurred_on DATE,                         -- diagnosis/vaccination/surgery date
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_profile_items_patient ON profile_items (patient_id, item_type);

-- Catalog of known metric fields, one or more per category.
-- Used by the AI intake to map free text to structured metrics.
CREATE TABLE IF NOT EXISTS category_metrics (
    id               SERIAL PRIMARY KEY,
    category_id      INT NOT NULL REFERENCES categories(id),
    code             VARCHAR(100) NOT NULL UNIQUE,  -- e.g. 'pulse', 'blood_pressure_systolic'
    name             VARCHAR(150) NOT NULL,
    unit             VARCHAR(30),
    box              VARCHAR(50),                   -- dashboard box (heart, metabolic, ...)
    reference        VARCHAR(50),                   -- e.g. '<120', '60–80'
    range_low        DOUBLE PRECISION,              -- normal-range shading
    range_high       DOUBLE PRECISION,
    modality         VARCHAR(20),                   -- vital | lab | wearable | score | imaging | ecg
    diagnostic_group VARCHAR(50)                    -- Diagnostic Data grouping
);

INSERT INTO category_metrics (category_id, code, name, unit, box)
SELECT c.id, m.code, m.name, m.unit, m.box
FROM (VALUES
    ('cardiology',       'pulse',                    'Pulse / heart rate',              'bpm',         'heart'),
    ('cardiology',       'blood_pressure_systolic',  'Blood pressure (systolic)',       'mmHg',        'heart'),
    ('cardiology',       'blood_pressure_diastolic', 'Blood pressure (diastolic)',      'mmHg',        'heart'),
    ('cardiology',       'resting_heart_rate',       'Resting heart rate',              'bpm',         'heart'),
    ('cardiology',       'hrv',                      'Heart rate variability',          'ms',          'heart'),
    ('cardiology',       'vo2max',                   'VO2 max',                         'mL/kg/min',   'fitness'),
    ('ophthalmology',    'visual_acuity',            'Visual acuity',                   NULL,          'mind'),
    ('ophthalmology',    'intraocular_pressure',     'Intraocular pressure',            'mmHg',        'mind'),
    ('neurology',        'headache_severity',        'Headache severity (0-10)',        'score',       'mind'),
    ('neurology',        'sleep_hours',              'Sleep duration',                  'h',           'sleep'),
    ('dermatology',      'skin_condition',           'Skin condition note',             NULL,          'exposures'),
    ('endocrinology',    'blood_glucose',            'Blood glucose',                   'mmol/L',      'metabolic'),
    ('endocrinology',    'hba1c',                    'HbA1c',                           '%',           'metabolic'),
    ('gastroenterology', 'abdominal_pain_severity',  'Abdominal pain severity (0-10)',  'score',       'metabolic'),
    ('orthopedics',      'joint_pain_severity',      'Joint pain severity (0-10)',      'score',       'fitness'),
    ('pulmonology',      'spo2',                     'Oxygen saturation (SpO2)',        '%',           'heart'),
    ('pulmonology',      'respiratory_rate',         'Respiratory rate',                'breaths/min', 'heart'),
    ('pulmonology',      'peak_flow',                'Peak expiratory flow',            'L/min',       'fitness'),
    ('urology',          'urination_frequency',      'Urination frequency',             'per day',     'metabolic'),
    ('gynecology',       'menstrual_cycle_length',   'Menstrual cycle length',          'days',        'metabolic'),
    ('general',          'weight',                   'Body weight',                     'kg',          'metabolic'),
    ('general',          'height',                   'Height',                          'cm',          'metabolic'),
    ('general',          'temperature',              'Body temperature',                '°C',          'metabolic'),
    ('general',          'steps',                    'Daily steps',                     'steps',       'fitness'),
    ('general',          'calories_burned',          'Active calories burned',          'kcal',        'fitness'),
    ('general',          'active_minutes',           'Active minutes',                  'min',         'fitness'),
    ('general',          'body_fat_pct',             'Body fat',                        '%',           'metabolic'),
    ('neurology',        'sleep_deep_hours',         'Deep sleep duration',             'h',           'sleep'),
    ('neurology',        'sleep_rem_hours',          'REM sleep duration',              'h',           'sleep')
) AS m(cat_code, code, name, unit, box)
JOIN categories c ON c.code = m.cat_code
ON CONFLICT (code) DO NOTHING;

-- Time-series health metrics powering the dashboard charts
-- (frontend boxes: heart, metabolic, fitness, sleep, mind, exposures)
CREATE TABLE IF NOT EXISTS observations (
    id           SERIAL PRIMARY KEY,
    patient_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_by  INT REFERENCES users(id) ON DELETE SET NULL,  -- patient or doctor
    category_id  INT REFERENCES categories(id),   -- set when the metric maps to a category
    box          VARCHAR(50)  NOT NULL,    -- heart | metabolic | fitness | sleep | mind | exposures
    metric       VARCHAR(100) NOT NULL,    -- e.g. 'systolic_bp', 'hba1c', 'weight'
    value_num    DOUBLE PRECISION,
    value_text   TEXT,
    unit         VARCHAR(30),
    observed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_kind  VARCHAR(30),              -- manual | wearable | document | emr | voice
    source_label VARCHAR(255),             -- e.g. 'Apple Health', 'Lab report 2026-02-28'
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_observations_series
    ON observations (patient_id, box, metric, observed_at);

-- Files the patient uploads themself (lab PDFs, scans, wearable exports)
CREATE TABLE IF NOT EXISTS patient_documents (
    id            SERIAL PRIMARY KEY,
    patient_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_path     VARCHAR(500) NOT NULL,
    original_name VARCHAR(255),
    mime          VARCHAR(100),
    summary       TEXT,
    source_kind   VARCHAR(30),
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now(),   -- when the lab/scan happened
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_patient_documents_patient ON patient_documents (patient_id);

-- Patient-owned calendar: appointments, reminders, medication schedule
CREATE TABLE IF NOT EXISTS calendar_events (
    id          SERIAL PRIMARY KEY,
    patient_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        VARCHAR(20) NOT NULL CHECK (kind IN ('appointment','reminder','medication')),
    title       VARCHAR(255) NOT NULL,
    event_date  DATE NOT NULL,
    event_time  VARCHAR(10),            -- 'HH:MM'
    detail      TEXT,                   -- location / notes / dose schedule
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_calendar_patient_date ON calendar_events (patient_id, event_date);

COMMIT;

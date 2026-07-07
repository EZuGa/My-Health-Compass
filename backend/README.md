# Medical Records API (backend)

FastAPI + PostgreSQL backend where **doctors submit per-category assessments**
(cardiology, neurology, ophthalmology, ...) and **patients own their history**:
a doctor must request access to a category and the patient approves or denies it.

Data model follows the Georgian EHR spec (`EHR_SectionsFields (2).xlsx`) and the
inpatient history layout (`Summary List for History 10 EHRInPatient.xls`):
episode types (inpatient / day hospital / emergency outpatient / outpatient),
ICD-10 preliminary/clinical/final diagnoses, complaints, treatment notes,
post-discharge recommendations, outcome, attached images.

## Setup

1. **Install PostgreSQL** (https://www.postgresql.org/download/windows/), then:

   ```
   psql -U postgres -c "CREATE DATABASE medical_app;"
   psql -U postgres -d medical_app -f schema.sql
   ```

2. **Configure**: copy `.env.example` to `.env`, set your Postgres password in
   `DATABASE_URL`. Optionally set `ANTHROPIC_API_KEY` to enable Claude-powered
   chat intake (without it a built-in rule parser handles common vitals).

3. **Install & run** (from `backend/`):

   ```
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. Open **http://127.0.0.1:8000/docs** — interactive Swagger UI.
   (Tables and seed categories/metrics are auto-created on startup; `schema.sql`
   is the reference schema.)

5. **Demo data** (optional, 144 records): `python seed_demo.py`
   Demo logins (password `demo123`): patients `nino@demo.ge`, `giorgi@demo.ge`,
   `mariam@demo.ge`; doctors `cardio@demo.ge`, `neuro@demo.ge`, `endo@demo.ge`.

6. **Tests**: `python tests/smoke_test.py` (77 end-to-end checks, uses SQLite).

## MoH EHR spec (the two Excel files, in `docs/`)

- **`EHR_SectionsFields (2).xlsx`** — the *write* form: every section/field a
  doctor must fill per episode type (inpatient / day hospital / emergency
  outpatient / outpatient); red-font fields are mandatory. Implemented as the
  episode lifecycle: `POST /assessments` opens a draft, repeatable records go
  to `/diagnoses` `/visits` `/activities` (validated per record against
  `app/ehr_validation.py`), and `POST /assessments/{id}/complete` enforces the
  episode-level red-mandatory matrix (e.g. transportation type for stationary
  episodes, ≥1 clinical diagnosis + examination sheet for inpatient, exactly
  one final main diagnosis with disease course, episode result, discharge
  date) and auto-computes bed-days / case number.
- **`Summary List for History 10 EHRInPatient.xls`** — the *read* view a
  doctor gets of a patient's record. Implemented as
  `GET /doctors/patients/{id}/ehr-summary`: history header + patient info +
  anamnesis vitae (immunizations, screenings, chronic conditions, surgeries,
  allergies...) + full episodes, scoped to the doctor's active grants.

## Two dashboards

The app has separate UIs for patients and doctors. `POST /auth/login` returns a
JWT; the frontend reads `role` from `GET /auth/me` and routes to the right UI.
Each dashboard loads with one call:

- `GET /dashboard/patient` — profile, pending access requests, history per
  category, latest vitals, counts.
- `GET /dashboard/doctor` — active grants (patients I can open), pending
  requests, my recent assessments, stats.

> 📖 **[API_GUIDE.md](API_GUIDE.md)** — step-by-step walkthrough of all 51 endpoints with example payloads.
> 📊 **[DIAGRAMS.md](DIAGRAMS.md)** — system overview, ER schema, consent flow, episode lifecycle (Mermaid, renders on GitHub).

## Endpoints

| Method & path | Who | What |
|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `GET /auth/me` | anyone | JWT auth; role `patient` or `doctor` |
| `GET /categories`, `GET /categories/{code}/metrics` | both | Categories and their metric fields (pulse & BP → cardiology, ...) |
| `POST /assessments` | doctor | Open an episode (MoH EHR header + anamnesis; nested diagnoses/visits/activities accepted inline) |
| `PATCH /assessments/{id}` | doctor | Update header / anamnesis / outcome fields while the episode is open |
| `POST /assessments/{id}/diagnoses` | doctor | Add diagnosis record: preliminary / clinical / final_main / final_comorbidity / final_complication |
| `POST /assessments/{id}/visits` | doctor | Add a visit (non-inpatient episodes, ≤ 24h each) |
| `POST /assessments/{id}/activities` | doctor | Add treatment-process / post-discharge record (labs, consultations, surgery, transfusion, prescriptions...) |
| `POST /assessments/{id}/complete` | doctor | Close the episode — runs the **red-mandatory checks** per episode type, computes bed-days, assigns case number |
| `GET /assessments/{id}`, `GET /assessments/mine` | doctor | Own episodes with full nested records |
| `POST /assessments/{id}/images` | doctor | Attach image/PDF/DICOM to own assessment |
| `GET /doctors/patients/{id}/ehr-summary` | doctor* | Full patient read view laid out after the MoH "Summary List for History" spec (patient info, anamnesis vitae, episodes) |
| `GET /patients/me/history[/{category}]` | patient | Own history grouped / per category with images |
| `POST /access-requests` → `/approve` `/deny` `/revoke` | doctor → patient | Consent flow; approved grant lasts `ACCESS_GRANT_DAYS` (30) |
| `GET /doctors/patients/{id}/history/{category}` | doctor | Patient history — 403 without an approved, unexpired grant |
| `POST /intake/message` | patient | **AI chat intake**: "I have 50 pulse and pressure 100" → structured, timestamped observations (Claude, or rule parser fallback) |
| `POST /wearables/sync` | patient | Bulk sync from Apple Health / Samsung Health / Whoop / Fitbit / Garmin / Oura (idempotent, timestamped) |
| `GET /patients/{id}/observations` | both* | Time series; filters: metric, box, category, date_from/to, source_kind |
| `GET /patients/{id}/vitals/latest` | both* | Most recent value per metric |
| `GET /patients/{id}/observations/stats?metric=` | both* | min/max/avg/count over a date range |
| `GET /patients/{id}/summary` | both* | One-call visit prep: demographics, allergies, meds, chronic conditions, latest vitals, recent assessments |
| `POST /profile/items`, `GET /patients/{id}/profile` | patient / both* | Anamnesis vitae: allergies, chronic conditions, meds, immunizations, surgeries... |
| `POST /documents`, `GET /documents/patient/{id}`, `.../download` | patient / both* | Patient-uploaded labs/scans |
| `GET /patients/{id}/timeline` | both* | Chronological merge of assessments + observations + documents + profile events |

\* doctor access to these requires **any active grant** from the patient
(general health data isn't specialty-scoped — allergies matter to every doctor);
assessments stay **category-scoped** to the grant.

## Consent model

One approved `access_request` = one grant, scoped to *(doctor, patient,
category)*, expires after 30 days, revocable anytime. Doctors write assessments
without a grant (documenting their own visit) but read only with one.

## AI intake

`app/ai.py` uses the Anthropic SDK (`claude-opus-4-8`, structured outputs via
`messages.parse`) to map free text in any language to catalog metric codes.
With no API key it falls back to a regex parser (pulse, BP `120/80`,
temperature, weight, glucose, SpO2, sleep, steps). Every stored observation
keeps `observed_at`, `source_kind` (`chat`/`wearable`/`manual`) and
`source_label`, so a doctor sees exactly when each value was measured.

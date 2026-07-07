# Medical App API — Step-by-Step Guide

Base URL (dev): `http://127.0.0.1:8000` · Interactive docs: `/docs` (Swagger) · All 51 endpoints below.

Every request except `/auth/register`, `/auth/login` and `GET /` needs a JWT:

```
Authorization: Bearer <access_token>
```

Two roles exist — **patient** and **doctor** — and every endpoint is locked to one
of them (or both). Demo accounts (password `demo123`): patients
`nino@demo.ge`, `giorgi@demo.ge`, `mariam@demo.ge`; doctors `cardio@demo.ge`,
`neuro@demo.ge`, `endo@demo.ge`.

---

## 1. Authentication

### Step 1 — register

`POST /auth/register`

```json
{
  "role": "patient",                  // or "doctor"
  "email": "nino@demo.ge",
  "password": "demo123",
  "full_name": "Nino Kapanadze",
  "personal_number": "01001011111",   // Georgian personal ID — doctors use it to request access
  "date_of_birth": "1985-03-12",
  "phone": "+995 555 111 111",
  "blood_group": "A+",
  "address_region": "Tbilisi",        // Summary List: მისამართი (რეგიონი)
  "address_actual": "Vazha-Pshavela Ave 27",
  "specialty": null                   // REQUIRED when role = "doctor" (e.g. "cardiology")
}
```

Returns the created user. `422` if a doctor omits `specialty`; `409` if the email exists.

### Step 2 — log in

`POST /auth/login` with `{"email": ..., "password": ...}` → `{"access_token": "...", "token_type": "bearer"}`.

### Step 3 — identify the user (dashboard routing)

`GET /auth/me` → the user object incl. `role`. The frontend reads `role` and
routes to the patient UI or the doctor UI. That's the whole two-dashboard switch.

---

## 2. Patient journey

### Step 1 — land on the dashboard

`GET /dashboard/patient` (patient only, `403` for doctors) — one call returns:
profile, **pending access requests waiting for my approval**, my categories with
assessment counts and last visit, latest vitals, observation/document counts.

### Step 2 — fill in the medical profile (anamnesis vitae)

`POST /profile/items` — one item per record:

```json
{ "item_type": "allergy", "name": "Penicillin", "detail": "skin rash" }
```

`item_type` ∈ `allergy · chronic_condition · medication · immunization · surgery ·
screening · family_history · social_history · past_disease · blood_transfusion · pregnancy`
(the last three mirror the MoH Summary List anamnesis-vitae blocks).
Optional: `icd10`, `occurred_on` (date).

- `GET /patients/{id}/profile` — items grouped by type
- `DELETE /profile/items/{item_id}` — remove own item

### Step 3 — talk to the AI intake (free-text vitals)

`POST /intake/message` (patient only):

```json
{ "message": "i have 50 pulse and pressure 100", "observed_at": "2026-07-07T08:00:00Z" }
```

The text is parsed (Claude structured outputs; regex fallback without an API key)
into observations mapped to catalog metrics and categories:

```json
{
  "parsed_by": "claude",
  "observations": [
    { "metric": "pulse", "value_num": 50, "unit": "bpm", "category_id": 1,
      "observed_at": "2026-07-07T08:00:00Z", "source_kind": "chat" }
  ]
}
```

`observed_at` defaults to now — so when a doctor later opens the record, they see
exactly *when* the patient had that pulse.

### Step 4 — sync the wearable

`POST /wearables/sync` (patient only):

```json
{
  "source": "apple_health",   // apple_health | samsung_health | whoop | fitbit | garmin | oura | other
  "samples": [
    { "metric": "resting_heart_rate", "value_num": 61, "observed_at": "2026-07-06T07:00:00Z" },
    { "metric": "steps", "value_num": 9200, "observed_at": "2026-07-06T22:00:00Z" }
  ]
}
```

Idempotent per `(metric, observed_at, source)` — re-sending the same export is
safe: `{"stored": 2, "skipped_duplicates": 0}`. Up to 5000 samples per call.

### Step 5 — manual data, documents, calendar

- `POST /patients/{id}/observations` — add a single observation by hand; `DELETE /observations/{id}` to remove.
- `POST /documents` (multipart file + optional `summary`) — upload lab PDFs/scans;
  `GET /documents/patient/{id}`, `GET /documents/{id}/download`, `DELETE /documents/{id}`.
- `POST /calendar` `{kind: appointment|reminder|medication, title, event_date, event_time?, detail?}`;
  `GET /calendar/mine`, `GET /patients/{id}/calendar`, `DELETE /calendar/{id}`.

### Step 6 — browse own history

- `GET /patients/me/history` — all categories with my assessments
- `GET /patients/me/history/cardiology` — one category, full nested episodes
  (diagnoses, visits, activities, images)
- `GET /patients/{id}/timeline` — chronological merge of assessments +
  observations + documents + profile events

### Step 7 — answer access requests (consent)

When a doctor requests access, it appears in `GET /access-requests/incoming`.

- `POST /access-requests/{id}/approve` — grant; expires in 30 days (`ACCESS_GRANT_DAYS`)
- `POST /access-requests/{id}/deny` — refuse
- `POST /access-requests/{id}/revoke` — kill an already-approved grant at any time

---

## 3. Doctor journey

### Step 1 — dashboard

`GET /dashboard/doctor` (doctor only) — active grants (= patients I can open),
pending requests, my recent assessments, patient/assessment counts.

### Step 2 — request access to a patient

`POST /access-requests`:

```json
{ "patient_personal_number": "01001022222",  // or "patient_id"
  "category_code": "cardiology",
  "reason": "Referred for consultation" }
```

`GET /access-requests/outgoing` shows the status. Until the patient approves,
**every read of that patient returns `403`**.

Scoping rules:
- **Assessments/history/timeline-assessments** are *category-scoped*: a grant for
  cardiology opens cardiology episodes only.
- **General data** (profile, observations, vitals, documents, summary) needs *any*
  active grant — allergies matter to every treating doctor.

### Step 3 — read the patient (after approval)

- `GET /doctors/patients/{id}/ehr-summary` — **the MoH "Summary List" read view**:
  patient info (incl. address, blood group), anamnesis vitae in the spec's blocks
  (immunizations, screenings, pregnancy statistics, past diseases, chronic
  conditions, blood transfusions, surgeries, allergies, medications,
  family/social history), and full episodes limited to granted categories.
- `GET /doctors/patients/{id}/history/{category}` — episodes of one category
- `GET /patients/{id}/summary` — quick visit prep (demographics, allergies, meds,
  latest vitals, recent assessments)
- `GET /patients/{id}/observations?metric=&box=&category=&date_from=&date_to=&source_kind=` — time series
- `GET /patients/{id}/vitals/latest` — most recent value of every metric
- `GET /patients/{id}/observations/stats?metric=pulse&date_from=...` — min/max/avg/count
- `GET /patients/{id}/timeline` — merged history
- `GET /images/{image_id}` — download an assessment attachment

### Step 4 — open an episode (assessment)

`POST /assessments` (doctor only — writing needs **no** grant, you're documenting
your own visit):

```json
{
  "patient_id": 2,
  "category_code": "cardiology",
  "episode_type": "inpatient",     // inpatient | day_hospital | emergency_outpatient | outpatient
  "medical_record_number": "MRN-2026-777",
  "visit_date": "2026-07-01T10:00:00Z",          // admission date/time
  "complaints": "Chest pain at rest",
  "transportation_type": "ambulance",             // inpatient / day hospital only
  "hospitalization_type": "emergency",
  "hospitalized_for_this_disease": true           // inpatient only
}
```

The episode is created with `status: "open"`. Nested `diagnoses` / `visits` /
`activities` arrays may also be sent inline in this same call.

### Step 5 — build up the episode (repeatable records)

Everything here follows the MoH **EHR_SectionsFields** write spec; red-mandatory
fields are validated *per record on insert* — a bad record is rejected with `422`
and a list of what's missing.

**Diagnoses** — `POST /assessments/{id}/diagnoses`

```json
{ "kind": "clinical", "icd10_code": "I20.0", "established_at": "2026-07-01T16:00:00Z" }
{ "kind": "final_main", "icd10_code": "I20.0", "disease_course": "acute" }
```

`kind` ∈ `preliminary` (inpatient/day only) · `clinical` (inpatient only, needs
`established_at`) · `final_main` (exactly one, needs `disease_course`) ·
`final_comorbidity` · `final_complication`. A second `final_main` → `409`.

**Visits** — `POST /assessments/{id}/visits` (non-inpatient episodes only)

```json
{ "started_at": "2026-07-01T10:00:00Z", "ended_at": "2026-07-01T11:00:00Z", "comment": "check-up" }
```

`ended_at` is mandatory and must be within 24h of `started_at`.

**Activities** — `POST /assessments/{id}/activities` — one endpoint for every
treatment-process and post-discharge section:

| `activity_type` | Section | Red fields checked |
|---|---|---|
| `examination_note` | გასინჯვის ფურცელი (inpatient) | care, started_at, result_note |
| `observation` | დაკვირვება/ზედამხედველობა | name, started_at, ended_at (+care if inpatient) |
| `diagnostic_exam` | კლინიკურ/დიაგნოსტიკური | name (NCSP), result_date (+care if inpatient) |
| `lab_test` | ლაბ. გამოკვლევა | name, result_date (+care if inpatient) |
| `consultation` | კონსულტაცია | name, started_at, details.specialty, details.consultant_name |
| `accompanying_activity` | თანმხლები აქტივობა | name, result_date |
| `other_recommendation` | სხვა რეკომენდაცია | result_note |
| `prescription` | დანიშნულება | name, details.quantity |
| `blood_transfusion` | სისხლის გადასხმა | details.blood_component, .transfusion_indication, .quantity_ml |
| `intensive_care` | ინტენსიური მოვლა | care (level), name, started_at, ended_at |
| `anesthesia` | ანესთეზია | name, started_at, ended_at |
| `operation_protocol` | ოპერაციის ოქმი | details.operation_number, result_note |
| `surgical_intervention` | ქირურგიული ჩარევა | name, started_at, ended_at |
| `histomorphology` | ჰისტომორფოლოგია | name (+care if inpatient) |
| `discharge_surgery` | გაწერის შემდგომ: ქირურგია | icd10_code, name |
| `discharge_instrumental_exam` | ინსტრუმენტული | name |
| `discharge_lab_test` | ლაბორატორიული | name |
| `discharge_consultation` | კონსულტაცია ამბულატორიაში | name, details.specialty |
| `discharge_other_recommendation` | სხვა რეკომენდაცია | result_note |
| `discharge_eprescription` | ელ. რეცეპტი | name |
| `discharge_prescription` | სხვა დანიშნულება | name, details.form, .substitution_allowed, .quantity |

Common columns: `name`, `ncsp_code`, `icd10_code`, `care`, `started_at`,
`ended_at`, `result_date`, `result_note`; section-specific extras go in the
`details` JSON (cost, prescription_number, intake_instructions, ...).

Example:

```json
{
  "activity_type": "consultation",
  "name": "Endocrinology consultation", "ncsp_code": "XS2ME", "care": "standard",
  "started_at": "2026-07-02T09:00:00Z",
  "result_note": "Continue metformin",
  "details": { "specialty": "endocrinology", "consultant_name": "Dr. Irakli Japaridze" }
}
```

**Images** — `POST /assessments/{id}/images` (multipart) — X-ray/echo/scan/PDF/DICOM
(`.jpg .png .gif .webp .bmp .dcm .pdf`) attached to your own assessment.

**Corrections** — `PATCH /assessments/{id}` updates header/anamnesis/outcome fields
while the episode is open. Other doctors get `403`; a completed episode gets `409`.

### Step 6 — close the episode

Set the outcome first (inline at creation, or via PATCH):

```json
{ "first_visit_end_at": "...", "discharge_at": "...",
  "episode_result": "discharged", "disease_outcome": "improvement" }
```

Then `POST /assessments/{id}/complete`. This runs the **episode-level
red-mandatory matrix** for the episode type and either:

- `422` + the full list of what's missing, e.g.
  `["transportation_type is mandatory for inpatient / day hospital episodes",
    "At least one clinical diagnosis is mandatory for inpatient episodes",
    "Exactly one final main diagnosis is required (found 0) ..."]`
- `200` → `{"completed": true, "bed_days": 3}` — status flips to `completed`,
  the episode locks (all mutations `409`), `bed_days` is auto-computed for
  inpatient and a `case_number` is assigned if absent.

What completion checks per episode type:

| Check | inpatient | day_hospital | emergency_outpatient | outpatient |
|---|---|---|---|---|
| medical_record_number, visit_date, first_visit_end_at, discharge_at | ✔ | ✔ | ✔ | ✔ |
| hospitalization_type, complaints | ✔ | ✔ | ✔ | ✔ |
| transportation_type | ✔ | ✔ | — | — |
| hospitalized_for_this_disease | ✔ | — | — | — |
| ≥1 clinical diagnosis | ✔ | — | — | — |
| ≥1 examination sheet record | ✔ | — | — | — |
| exactly one final_main diagnosis (+ disease_course) | ✔ | ✔ | ✔ | ✔ |
| episode_result (+ disease_outcome unless death) | ✔ | ✔ | ✔ | ✔ |
| visits forbidden | ✔ | allowed ≤24h | allowed ≤24h | allowed ≤24h |

### Step 7 — review own work

`GET /assessments/mine` — everything I wrote; `GET /assessments/{id}` — one
episode with all nested records.

---

## 4. Catalog & reference endpoints (both roles)

- `GET /categories` — the 11 medical categories (cardiology, neurology, ...)
- `GET /categories/{code}/metrics` — metric fields of one category (pulse, BP,
  cholesterol → cardiology, ...) with units, normal ranges, dashboard box
- `GET /catalog/metrics` — the whole metric catalog
- `GET /catalog/boxes` — dashboard boxes (heart, metabolic, fitness, sleep, mind, exposures)
- `GET /catalog/sections` — Diagnostic Data groupings
- `GET /` — health check `{"status": "ok", "docs": "/docs"}`

---

## 5. Typical end-to-end scenario

```text
 1. POST /auth/register            patient Nino registers
 2. POST /auth/register            Dr. Beridze registers (specialty: cardiology)
 3. POST /intake/message           Nino: "pulse 50, pressure 100" → timestamped observations
 4. POST /wearables/sync           Nino's Apple Watch uploads 30 days of heart-rate/steps
 5. POST /access-requests          doctor asks for Nino's cardiology data
 6. GET  /access-requests/incoming Nino sees the request on her dashboard
 7. POST /access-requests/1/approve → 30-day grant
 8. GET  /doctors/patients/1/ehr-summary  doctor reads the full record — incl. the
                                    exact chat vitals with their timestamps
 9. POST /assessments              doctor opens an inpatient episode
10. POST /assessments/9/diagnoses  clinical + final_main diagnoses
11. POST /assessments/9/activities examination note, labs, consultation, prescriptions
12. PATCH /assessments/9           discharge date + episode outcome
13. POST /assessments/9/complete   MoH red-mandatory checks pass → bed_days, case number
14. GET  /patients/me/history/cardiology   Nino sees the completed episode
15. POST /access-requests/1/revoke Nino cuts access whenever she wants → doctor gets 403
```

---

## 6. Error conventions

| Code | Meaning here |
|---|---|
| `401` | Missing/invalid/expired JWT, wrong password |
| `403` | Wrong role for the endpoint, or no active grant for this patient/category |
| `404` | Unknown id / category code / patient |
| `409` | Duplicate (email, pending request, second final_main dx), or episode already completed |
| `422` | Validation: bad payload, disallowed file type, or **missing red-mandatory EHR fields** (detail = list of messages) |

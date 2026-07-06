"""End-to-end smoke test for every API flow. Run: python tests/smoke_test.py"""
import io
import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./smoke_test.db"
os.environ.pop("ANTHROPIC_API_KEY", None)  # force the rule-based intake parser
if os.path.exists("smoke_test.db"):
    os.remove("smoke_test.db")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

fails: list[str] = []


def ok(r, code, label=""):
    good = r.status_code == code
    print(("PASS" if good else f"FAIL {r.status_code} {r.text[:200]}"),
          r.request.method, r.url.path, label)
    if not good:
        fails.append(label or str(r.url.path))


with TestClient(app) as c:
    # ===== auth =====
    pid = c.post("/auth/register", json={
        "role": "patient", "email": "p@x.ge", "password": "secret1",
        "full_name": "Nika", "personal_number": "01008012345"}).json()["id"]
    c.post("/auth/register", json={"role": "doctor", "email": "d1@x.ge", "password": "secret1",
                                   "full_name": "Dr Cardio", "specialty": "cardiology"})
    c.post("/auth/register", json={"role": "doctor", "email": "d2@x.ge", "password": "secret1",
                                   "full_name": "Dr Neuro", "specialty": "neurology"})
    r = c.post("/auth/register", json={"role": "doctor", "email": "x@x.ge",
                                       "password": "secret1", "full_name": "X"})
    ok(r, 422, "doctor without specialty rejected")
    r = c.post("/auth/login", json={"email": "p@x.ge", "password": "wrong"})
    ok(r, 401, "bad password rejected")

    def tok(email):
        resp = c.post("/auth/login", json={"email": email, "password": "secret1"})
        return {"Authorization": "Bearer " + resp.json()["access_token"]}

    P, D1, D2 = tok("p@x.ge"), tok("d1@x.ge"), tok("d2@x.ge")
    r = c.get("/auth/me", headers=P)
    ok(r, 200)
    assert r.json()["role"] == "patient"

    # ===== categories & metric catalog =====
    r = c.get("/categories", headers=P)
    ok(r, 200)
    assert len(r.json()) == 11
    r = c.get("/categories/cardiology/metrics", headers=P)
    ok(r, 200)
    codes = {m["code"] for m in r.json()}
    assert codes == {"pulse", "blood_pressure_systolic", "blood_pressure_diastolic",
                     "resting_heart_rate", "hrv", "vo2max"}, codes
    r = c.get("/categories/nope/metrics", headers=P)
    ok(r, 404, "unknown category")

    # ===== AI intake (rules fallback without API key) =====
    r = c.post("/intake/message", headers=P, json={"message": "i have 50 pulse and pressure 100"})
    ok(r, 200, "intake pulse+bp")
    j = r.json()
    assert j["parsed_by"] == "rules", j["parsed_by"]
    got = {o["metric"]: o for o in j["observations"]}
    assert got["pulse"]["value_num"] == 50 and got["pulse"]["unit"] == "bpm", got
    assert got["blood_pressure_systolic"]["value_num"] == 100, got
    assert got["pulse"]["category_id"] is not None, "pulse should be tagged with cardiology"

    r = c.post("/intake/message", headers=P, json={
        "message": "bp was 120/80, temperature 37.5, slept 6 hours, sugar 5.4",
        "observed_at": "2026-07-01T08:00:00Z"})
    ok(r, 200, "intake multi-metric")
    got2 = {o["metric"] for o in r.json()["observations"]}
    assert {"blood_pressure_systolic", "blood_pressure_diastolic", "temperature",
            "sleep_hours", "blood_glucose"} <= got2, got2
    assert all(o["observed_at"].startswith("2026-07-01") for o in r.json()["observations"])

    r = c.post("/intake/message", headers=P, json={"message": "hello how are you"})
    ok(r, 200, "intake without vitals")
    assert r.json()["observations"] == []
    r = c.post("/intake/message", headers=D1, json={"message": "pulse 60"})
    ok(r, 403, "doctor cannot use patient intake")

    r = c.get(f"/patients/{pid}/observations?category=cardiology", headers=P)
    ok(r, 200, "filter by category")
    assert {o["metric"] for o in r.json()} == {"pulse", "blood_pressure_systolic",
                                               "blood_pressure_diastolic"}
    r = c.get(f"/patients/{pid}/observations?metric=pulse", headers=P)
    ok(r, 200)
    assert len(r.json()) == 1

    # ===== profile items =====
    r = c.post("/profile/items", headers=P, json={"item_type": "allergy", "name": "Penicillin",
                                                  "detail": "rash"})
    ok(r, 201)
    r = c.post("/profile/items", headers=P, json={"item_type": "chronic_condition",
                                                  "name": "Hypertension", "icd10": "I10",
                                                  "occurred_on": "2020-03-01"})
    ok(r, 201)
    item_id = r.json()["id"]
    r = c.get(f"/patients/{pid}/profile", headers=P)
    ok(r, 200)
    assert set(r.json().keys()) == {"allergy", "chronic_condition"}

    # ===== documents =====
    r = c.post("/documents", headers=P,
               files={"file": ("lab.pdf", io.BytesIO(b"%PDF"), "application/pdf")},
               data={"summary": "Lipids"})
    ok(r, 201)
    doc_id = r.json()["id"]
    r = c.post("/documents", headers=P, files={"file": ("h.exe", io.BytesIO(b"x"), "application/foo")})
    ok(r, 422, "bad doc type rejected")
    r = c.get(f"/documents/{doc_id}/download", headers=P)
    ok(r, 200)

    # ===== assessments + images =====
    r = c.post("/assessments", headers=D1, json={
        "patient_id": pid, "category_code": "cardiology", "episode_type": "outpatient",
        "complaints": "Chest pain", "clinical_diagnosis_icd10": "I20.8",
        "final_diagnosis_icd10": "I20.8"})
    ok(r, 201)
    aid = r.json()["id"]
    c.post("/assessments", headers=D2, json={"patient_id": pid, "category_code": "neurology",
                                             "complaints": "headache", "episode_type": "inpatient"})
    r = c.post(f"/assessments/{aid}/images", headers=D1,
               files={"file": ("echo.png", io.BytesIO(b"PNG"), "image/png")},
               data={"description": "Echo"})
    ok(r, 201)
    img_id = r.json()["id"]
    r = c.get("/assessments/mine", headers=D1)
    ok(r, 200)
    assert len(r.json()) == 1
    r = c.post("/assessments", headers=P, json={"patient_id": pid, "category_code": "cardiology"})
    ok(r, 403, "patient cannot submit assessment")

    # ===== patient history =====
    r = c.get("/patients/me/history", headers=P)
    ok(r, 200)
    assert len(r.json()) == 2
    r = c.get("/patients/me/history/cardiology", headers=P)
    ok(r, 200)
    assert r.json()[0]["images"][0]["description"] == "Echo"

    # ===== consent flow =====
    for path in [f"/doctors/patients/{pid}/history/cardiology", f"/patients/{pid}/profile",
                 f"/patients/{pid}/observations", f"/patients/{pid}/timeline", f"/images/{img_id}"]:
        r = c.get(path, headers=D2)
        ok(r, 403, "blocked without grant")

    req = c.post("/access-requests", headers=D1, json={
        "patient_personal_number": "01008012345", "category_code": "cardiology",
        "reason": "consult"}).json()["id"]
    r = c.post("/access-requests", headers=D1, json={"patient_id": pid, "category_code": "cardiology"})
    ok(r, 409, "duplicate pending rejected")
    r = c.get("/access-requests/incoming", headers=P)
    ok(r, 200)
    assert len(r.json()) == 1
    r = c.get("/access-requests/outgoing", headers=D1)
    ok(r, 200)
    assert len(r.json()) == 1
    r = c.post(f"/access-requests/{req}/approve", headers=P)
    ok(r, 200, "approve grant")
    assert r.json()["expires_at"] is not None

    r = c.get(f"/doctors/patients/{pid}/history/cardiology", headers=D1)
    ok(r, 200, "granted category history")
    assert r.json()[0]["clinical_diagnosis_icd10"] == "I20.8"
    r = c.get(f"/doctors/patients/{pid}/history/neurology", headers=D1)
    ok(r, 403, "other category still blocked")
    r = c.get(f"/patients/{pid}/observations?category=cardiology", headers=D1)
    ok(r, 200, "doctor sees timestamped chat vitals")
    assert any(o["metric"] == "pulse" and o["value_num"] == 50 for o in r.json())
    r = c.get(f"/patients/{pid}/profile", headers=D1)
    ok(r, 200)
    r = c.get(f"/images/{img_id}", headers=D1)
    ok(r, 200)
    r = c.get(f"/documents/{doc_id}/download", headers=D1)
    ok(r, 200)

    r = c.get(f"/patients/{pid}/timeline", headers=D1)
    ok(r, 200, "doctor timeline scoped")
    cats = [e["category_code"] for e in r.json() if e["event_type"] == "assessment"]
    assert cats == ["cardiology"], cats
    types = {e["event_type"] for e in c.get(f"/patients/{pid}/timeline", headers=P).json()}
    assert types == {"assessment", "observation", "document", "profile_item"}, types

    # ===== wearable sync (Apple Health / Whoop style) =====
    samples = [
        {"metric": "resting_heart_rate", "value_num": 61, "observed_at": "2026-07-04T07:00:00Z"},
        {"metric": "resting_heart_rate", "value_num": 63, "observed_at": "2026-07-05T07:00:00Z"},
        {"metric": "steps", "value_num": 9200, "observed_at": "2026-07-05T22:00:00Z"},
        {"metric": "hrv", "value_num": 48, "observed_at": "2026-07-05T07:00:00Z"},
    ]
    r = c.post("/wearables/sync", headers=P, json={"source": "apple_health", "samples": samples})
    ok(r, 200, "wearable sync")
    assert r.json() == {"stored": 4, "skipped_duplicates": 0}, r.json()
    r = c.post("/wearables/sync", headers=P, json={"source": "apple_health", "samples": samples})
    ok(r, 200, "wearable re-sync dedupes")
    assert r.json()["stored"] == 0 and r.json()["skipped_duplicates"] == 4, r.json()
    r = c.post("/wearables/sync", headers=D1, json={"source": "whoop", "samples": samples})
    ok(r, 403, "doctor cannot sync wearables")

    r = c.get(f"/patients/{pid}/observations?source_kind=wearable", headers=P)
    ok(r, 200, "filter by source")
    assert len(r.json()) == 4
    r = c.get(f"/patients/{pid}/observations?metric=resting_heart_rate"
              "&date_from=2026-07-05T00:00:00Z", headers=P)
    ok(r, 200, "date range filter")
    assert len(r.json()) == 1 and r.json()[0]["value_num"] == 63

    # ===== latest vitals & stats (doctor view, grant active) =====
    r = c.get(f"/patients/{pid}/vitals/latest", headers=D1)
    ok(r, 200, "latest vitals")
    latest = {o["metric"]: o["value_num"] for o in r.json()}
    assert latest["resting_heart_rate"] == 63 and latest["pulse"] == 50, latest
    r = c.get(f"/patients/{pid}/observations/stats?metric=resting_heart_rate", headers=D1)
    ok(r, 200, "metric stats")
    s = r.json()
    assert s["count"] == 2 and s["min"] == 61 and s["max"] == 63 and s["avg"] == 62.0, s
    assert s["latest"]["value_num"] == 63

    # ===== patient summary (doctor's one-call view) =====
    r = c.get(f"/patients/{pid}/summary", headers=D1)
    ok(r, 200, "patient summary")
    s = r.json()
    assert s["full_name"] == "Nika"
    assert [a["name"] for a in s["allergies"]] == ["Penicillin"]
    assert [a["name"] for a in s["chronic_conditions"]] == ["Hypertension"]
    assert len(s["latest_vitals"]) >= 5
    cats = {a["category"]["code"] for a in s["recent_assessments"]}
    assert cats == {"cardiology"}, f"doctor summary must be grant-scoped: {cats}"

    # ===== dashboards =====
    r = c.get("/dashboard/patient", headers=P)
    ok(r, 200, "patient dashboard")
    d = r.json()
    assert d["user"]["role"] == "patient"
    assert {x["category"]["code"] for x in d["categories"]} == {"cardiology", "neurology"}
    assert d["observation_count"] >= 11 and d["document_count"] == 1
    r = c.get("/dashboard/doctor", headers=P)
    ok(r, 403, "patient blocked from doctor dashboard")

    r = c.get("/dashboard/doctor", headers=D1)
    ok(r, 200, "doctor dashboard")
    d = r.json()
    assert d["user"]["specialty"] == "cardiology"
    assert len(d["active_grants"]) == 1 and d["active_grants"][0]["patient_name"] == "Nika"
    assert d["assessment_count"] == 1 and d["patient_count"] == 1
    r = c.get("/dashboard/patient", headers=D1)
    ok(r, 403, "doctor blocked from patient dashboard")

    c.post(f"/access-requests/{req}/revoke", headers=P)
    r = c.get(f"/doctors/patients/{pid}/history/cardiology", headers=D1)
    ok(r, 403, "revoked: history blocked")
    r = c.get(f"/patients/{pid}/observations", headers=D1)
    ok(r, 403, "revoked: observations blocked")

    r = c.delete(f"/profile/items/{item_id}", headers=P)
    ok(r, 204)
    r = c.delete(f"/documents/{doc_id}", headers=P)
    ok(r, 204)

print()
print("FAILURES:", fails if fails else "none - ALL TESTS PASSED")
sys.exit(1 if fails else 0)

"""Mandatory-field validation from the MoH EHR spec (EHR_SectionsFields xlsx).

The xlsx marks mandatory fields in red per episode type; several of them are
"checked at episode completion" (მოწმდება ეპიზოდის დასრულებისას). We therefore
validate in two places:

* per-record rules (required fields of a diagnosis/visit/activity record) when
  the record is added — see `validate_activity`, `validate_visit`, `validate_diagnosis`;
* episode-level rules (mandatory sections, discharge date, exactly one final
  main diagnosis, episode outcome, bed-days) when the doctor calls
  POST /assessments/{id}/complete — see `validate_completion`.

Episode types: inpatient | day_hospital | emergency_outpatient | outpatient.
"""

from datetime import datetime, timedelta

ALL = ("inpatient", "day_hospital", "emergency_outpatient", "outpatient")
INPATIENT_ONLY = ("inpatient",)
STATIONARY = ("inpatient", "day_hospital")            # სტაციონარი + დღის სტაციონარი
NON_INPATIENT = ("day_hospital", "emergency_outpatient", "outpatient")

# activity_type -> (episode types where the section exists, required record fields)
# "name_or_free" means: spec allows classifier item OR free-text name — we store both in `name`.
ACTIVITY_RULES: dict[str, dict] = {
    "examination_note":       {"episodes": INPATIENT_ONLY, "required": ["care", "started_at", "result_note"]},
    "observation":            {"episodes": STATIONARY,     "required": ["name", "started_at", "ended_at"], "care_red_for": INPATIENT_ONLY},
    "diagnostic_exam":        {"episodes": ALL,            "required": ["name", "result_date"], "care_red_for": INPATIENT_ONLY},
    "lab_test":               {"episodes": ALL,            "required": ["name", "result_date"], "care_red_for": INPATIENT_ONLY},
    "consultation":           {"episodes": ALL,            "required": ["name", "started_at"], "care_red_for": INPATIENT_ONLY,
                               "required_details": ["specialty", "consultant_name"]},
    "accompanying_activity":  {"episodes": ALL,            "required": ["name", "result_date"], "care_red_for": INPATIENT_ONLY},
    "other_recommendation":   {"episodes": STATIONARY,     "required": ["result_note"]},
    "prescription":           {"episodes": ALL,            "required": ["name"], "required_details": ["quantity"]},
    "blood_transfusion":      {"episodes": ALL,            "care_red_for": INPATIENT_ONLY,
                               "required_details": ["blood_component", "transfusion_indication", "quantity_ml"]},
    "intensive_care":         {"episodes": STATIONARY,     "required": ["care", "name", "started_at", "ended_at"]},
    "anesthesia":             {"episodes": ALL,            "required": ["name", "started_at", "ended_at"]},
    "operation_protocol":     {"episodes": ALL,            "required": ["result_note"], "required_details": ["operation_number"]},
    "surgical_intervention":  {"episodes": ALL,            "required": ["name", "started_at", "ended_at"]},
    "histomorphology":        {"episodes": ALL,            "required": ["name"], "care_red_for": INPATIENT_ONLY},
    # post-discharge recommendations
    "discharge_surgery":              {"episodes": ALL, "required": ["icd10_code", "name"]},
    "discharge_instrumental_exam":    {"episodes": ALL, "required": ["name"]},
    "discharge_lab_test":             {"episodes": ALL, "required": ["name"]},
    "discharge_consultation":         {"episodes": ALL, "required": ["name"], "required_details": ["specialty"]},
    "discharge_other_recommendation": {"episodes": ALL, "required": ["result_note"]},
    "discharge_eprescription":        {"episodes": ALL, "required": ["name"]},
    "discharge_prescription":         {"episodes": ALL, "required": ["name"],
                                       "required_details": ["form", "substitution_allowed", "quantity"]},
}

DEATH_RESULTS = {"deceased", "died", "death", "გარდაცვალება", "გარდაიცვალა"}


def validate_activity(activity_type: str, episode_type: str, data: dict, details: dict | None) -> list[str]:
    """Red-field checks for one treatment/discharge record. Returns error strings."""
    rules = ACTIVITY_RULES.get(activity_type)
    if rules is None:
        return [f"Unknown activity_type '{activity_type}'"]
    errors = []
    if episode_type not in rules["episodes"]:
        errors.append(
            f"Section '{activity_type}' does not exist for episode type '{episode_type}' "
            f"(allowed: {', '.join(rules['episodes'])})"
        )
    for field in rules.get("required", []):
        if not data.get(field):
            errors.append(f"'{field}' is mandatory for {activity_type}")
    if episode_type in rules.get("care_red_for", ()) and not data.get("care"):
        errors.append(f"'care' (მოვლა) is mandatory for {activity_type} in inpatient episodes")
    details = details or {}
    for field in rules.get("required_details", []):
        if details.get(field) in (None, ""):
            errors.append(f"details.{field} is mandatory for {activity_type}")
    return errors


def validate_visit(episode_type: str, started_at: datetime, ended_at: datetime | None) -> list[str]:
    errors = []
    if episode_type == "inpatient":
        errors.append("Visits section does not exist for inpatient episodes")
    if started_at and ended_at:
        if ended_at < started_at:
            errors.append("Visit end must be after visit start")
        elif ended_at - started_at > timedelta(hours=24):
            errors.append("Visit duration must not exceed 24 hours")
    return errors


def validate_diagnosis(kind: str, episode_type: str, data: dict) -> list[str]:
    errors = []
    if kind == "preliminary" and episode_type not in STATIONARY:
        errors.append("Preliminary diagnosis section exists only for inpatient / day hospital")
    if kind == "clinical" and episode_type != "inpatient":
        errors.append("Clinical diagnosis section exists only for inpatient episodes")
    if kind == "clinical" and not data.get("established_at"):
        errors.append("'established_at' is mandatory for a clinical diagnosis")
    if kind in ("final_main", "final_comorbidity", "final_complication") and not data.get("disease_course"):
        errors.append("'disease_course' (ავადმყოფობის მიმდინარეობა) is mandatory for final diagnoses")
    return errors


def validate_completion(assessment, diagnoses, visits, activities) -> list[str]:
    """Episode-level mandatory checks run at POST /assessments/{id}/complete."""
    et = assessment.episode_type
    errors = []

    # medical record header (mandatory section, all episode types)
    if not assessment.medical_record_number:
        errors.append("medical_record_number (სამედიცინო ბარათის ისტორიის ნომერი) is mandatory")
    if not assessment.visit_date:
        errors.append("visit_date (პაციენტის შემოსვლის თარიღი და დრო) is mandatory")
    if not assessment.first_visit_end_at:
        errors.append("first_visit_end_at (პირველი ვიზიტის დასრულების თარიღი) is mandatory at completion")
    if not assessment.discharge_at:
        errors.append("discharge_at (პაციენტის გაწერის თარიღი და დრო) is mandatory at completion")

    # disease anamnesis (mandatory section)
    if et in STATIONARY and not assessment.transportation_type:
        errors.append("transportation_type is mandatory for inpatient / day hospital episodes")
    if not assessment.hospitalization_type:
        errors.append("hospitalization_type (შემთხვევის/ჰოსპიტალიზაციის ტიპი) is mandatory")
    if not assessment.complaints:
        errors.append("complaints (ჩივილები/სიმპტომები/მოკლე ანამნეზი) is mandatory")
    if et == "inpatient" and assessment.hospitalized_for_this_disease is None:
        errors.append("hospitalized_for_this_disease is mandatory for inpatient episodes")

    # clinical diagnosis: mandatory section for inpatient (>= 1 record)
    if et == "inpatient" and not any(d.kind == "clinical" for d in diagnoses):
        errors.append("At least one clinical diagnosis is mandatory for inpatient episodes")

    # examination sheet: mandatory section for inpatient (>= 1 record)
    if et == "inpatient" and not any(a.activity_type == "examination_note" for a in activities):
        errors.append("At least one examination sheet record (გასინჯვის ფურცელი) is mandatory for inpatient episodes")

    # final main diagnosis: mandatory, exactly one
    finals = [d for d in diagnoses if d.kind == "final_main"]
    if len(finals) != 1:
        errors.append(
            f"Exactly one final main diagnosis is required (found {len(finals)}); "
            "add it via POST /assessments/{id}/diagnoses with kind='final_main'"
        )

    # episode outcome (mandatory section)
    if not assessment.episode_result:
        errors.append("episode_result (ეპიზოდის შედეგი) is mandatory")
    elif (assessment.episode_result or "").strip().lower() not in DEATH_RESULTS and not assessment.disease_outcome:
        errors.append("disease_outcome (დაავადების გამოსავალი) is mandatory unless the episode result is death")

    # visit records exist only for non-inpatient episodes
    if et == "inpatient" and visits:
        errors.append("Visits section does not exist for inpatient episodes")

    return errors


def compute_bed_days(assessment) -> int | None:
    """გატარებული საწოლდღეები — auto-filled for inpatient episodes."""
    if assessment.episode_type != "inpatient" or not (assessment.visit_date and assessment.discharge_at):
        return None
    start, end = assessment.visit_date, assessment.discharge_at
    if start.tzinfo is None and end.tzinfo is not None:
        end = end.replace(tzinfo=None)
    elif start.tzinfo is not None and end.tzinfo is None:
        start = start.replace(tzinfo=None)
    return max((end - start).days, 1)

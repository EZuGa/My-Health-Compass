"""Parse the MoH-style EHR XML that clinics upload to /external/ehr.

The document is namespace-free; empty elements and placeholder values
("არა აქვს", blank strings) are treated as missing. Parsing uses defusedxml
because the input crosses a trust boundary.
"""
from dataclasses import dataclass, field
from datetime import datetime

from defusedxml import ElementTree as SafeET


class EhrXmlError(ValueError):
    """Raised when the uploaded document is not a parseable EHR XML."""


def _text(root, path: str) -> str | None:
    el = root.find(path)
    if el is None or el.text is None:
        return None
    value = el.text.strip()
    return value or None


def _dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


@dataclass
class LabTestRecord:
    laboratory: str | None
    name: str | None
    started_at: datetime | None
    ended_at: datetime | None
    result_text: str | None
    price: float | None


@dataclass
class ConsultationRecord:
    icd10: str | None
    ncsp: str | None
    specialty_code: str | None
    doctor_name: str | None
    date: datetime | None
    comment: str | None
    price: float | None


@dataclass
class VisitRecord:
    started_at: datetime | None
    ended_at: datetime | None
    comment: str | None


@dataclass
class ClinicEhr:
    ehr_no: str | None
    case_no: str | None
    responsible_person_id: str | None
    start_date: datetime | None
    end_date: datetime | None
    patient_id_number: str | None
    hospitalization_type: str | None
    symptoms: str | None
    hospital_name: str | None
    hospitalization_result: str | None
    condition_at_discharge: str | None
    doctor_comment: str | None
    final_icd10: str | None
    final_illness: str | None
    visits: list[VisitRecord] = field(default_factory=list)
    lab_tests: list[LabTestRecord] = field(default_factory=list)
    consultations: list[ConsultationRecord] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


def _price(root, path: str) -> float | None:
    raw = _text(root, path)
    if raw is None:
        return None
    try:
        return float(raw)
    except ValueError:
        return None


def parse_clinic_ehr(xml_bytes: bytes) -> ClinicEhr:
    try:
        root = SafeET.fromstring(xml_bytes)
    except Exception as e:
        raise EhrXmlError(f"Malformed XML: {e}") from e
    if root.tag != "EHR":
        raise EhrXmlError(f"Expected root element <EHR>, got <{root.tag}>")

    ehr = ClinicEhr(
        ehr_no=_text(root, "EHRInfo/EHRNo"),
        case_no=_text(root, "EHRInfo/CaseNo"),
        responsible_person_id=_text(root, "EHRInfo/ResponsiblePersonID"),
        start_date=_dt(_text(root, "EHRInfo/EHRStartDate")),
        end_date=_dt(_text(root, "EHRInfo/EHREndDate")),
        patient_id_number=_text(root, "PatientInfo/PatientIDnumber"),
        hospitalization_type=_text(root, "Hospitalization/AnamnesisMorbi/TypeOfHospitalization"),
        symptoms=_text(root, "Hospitalization/AnamnesisMorbi/Simptoms"),
        hospital_name=_text(root, "Discharge/HospitalizationOutcome/HospitalName"),
        hospitalization_result=_text(root, "Discharge/HospitalizationOutcome/HospitalizationResult"),
        condition_at_discharge=_text(root, "Discharge/HospitalizationOutcome/ConditionAtTheMoment"),
        doctor_comment=_text(root, "Discharge/HospitalizationOutcome/DoctorComment"),
        final_icd10=_text(root, "Discharge/FinalDiagnosis/PrimaryDisease/ICD10"),
        final_illness=_text(root, "Discharge/FinalDiagnosis/PrimaryDisease/Illness"),
    )

    for v in root.findall("Hospitalization/Visits"):
        visit = VisitRecord(
            started_at=_dt(_text(v, "VisitStartDate")),
            ended_at=_dt(_text(v, "VisitEndDate")),
            comment=_text(v, "VisitComment"),
        )
        if visit.started_at or visit.ended_at or visit.comment:
            ehr.visits.append(visit)

    for r in root.findall("Hospitalization/TreatmentProcess/LabTest/Record"):
        record = LabTestRecord(
            laboratory=_text(r, "Laboratory"),
            name=_text(r, "LaboratoryExaminationText"),
            started_at=_dt(_text(r, "ProcedureStartDate")),
            ended_at=_dt(_text(r, "ProcedureEndDate")),
            result_text=_text(r, "ProcedureResult"),
            price=_price(r, "Price"),
        )
        if record.name or record.result_text:
            ehr.lab_tests.append(record)

    for r in root.findall("Hospitalization/TreatmentProcess/Consultations/Record"):
        record = ConsultationRecord(
            icd10=_text(r, "ICD10"),
            ncsp=_text(r, "NCSP"),
            specialty_code=_text(r, "CodeOfTheMedicalSpecialty"),
            doctor_name=_text(r, "ConsultantDoctorName"),
            date=_dt(_text(r, "ConsultationDate")),
            comment=_text(r, "ConsultationResultsComment"),
            price=_price(r, "Price"),
        )
        if record.doctor_name or record.ncsp or record.icd10 or record.comment:
            ehr.consultations.append(record)

    for r in root.findall("Discharge/RecommendationsAfterDischarge/RecommendationOther/Record"):
        rec = _text(r, "Recommendation")
        if rec:
            ehr.recommendations.append(rec)

    return ehr

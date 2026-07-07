from datetime import datetime, date

from sqlalchemy import (
    JSON, Boolean, CheckConstraint, Date, DateTime, Float, ForeignKey, Index, Integer,
    String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

EPISODE_TYPES = ("inpatient", "day_hospital", "emergency_outpatient", "outpatient")
REQUEST_STATUSES = ("pending", "approved", "denied", "revoked")
DIAGNOSIS_KINDS = ("preliminary", "clinical", "final_main", "final_comorbidity", "final_complication")
# Treatment-process + post-discharge sections from the MoH EHR spec
# (EHR_SectionsFields xlsx); one generic table covers the repeatable records.
ACTIVITY_TYPES = (
    # treatment process
    "examination_note",        # გასინჯვის ფურცელი (mandatory section for inpatient)
    "observation",             # დაკვირვება/ზედამხედველობა
    "diagnostic_exam",         # კლინიკურ/დიაგნოსტიკური გამოკვლევა (NCSP)
    "lab_test",                # ლაბ. გამოკვლევა
    "consultation",            # კონსულტაცია
    "accompanying_activity",   # თანმხლები აქტივობა
    "other_recommendation",    # სხვა რეკომენდაცია
    "prescription",            # დანიშნულება (მკურნალობა)
    "blood_transfusion",       # სისხლის გადასხმა
    "intensive_care",          # ინტენსიური მოვლა
    "anesthesia",              # ანესთეზიის ეპიზოდი
    "operation_protocol",      # ოპერაციის ოქმი
    "surgical_intervention",   # ქირურგიული ჩარევა
    "histomorphology",         # ჰისტომორფოლოგია
    # post-discharge recommendations
    "discharge_surgery",
    "discharge_instrumental_exam",
    "discharge_lab_test",
    "discharge_consultation",
    "discharge_other_recommendation",
    "discharge_eprescription",
    "discharge_prescription",
)
PROFILE_ITEM_TYPES = (
    "allergy", "chronic_condition", "medication", "immunization",
    "surgery", "screening", "family_history", "social_history",
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role: Mapped[str] = mapped_column(String(10))  # 'patient' | 'doctor'
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    personal_number: Mapped[str | None] = mapped_column(String(20))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    phone: Mapped[str | None] = mapped_column(String(30))
    blood_group: Mapped[str | None] = mapped_column(String(10))
    specialty: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (CheckConstraint("role IN ('patient','doctor')"),)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))


class Assessment(Base):
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    episode_type: Mapped[str] = mapped_column(String(30), default="outpatient")
    status: Mapped[str] = mapped_column(String(10), default="open")  # 'open' | 'completed'

    # --- სამედიცინო ჩანაწერების მონაცემები (medical record header) ---
    medical_record_number: Mapped[str | None] = mapped_column(String(50))
    visit_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())  # admission date/time
    first_visit_end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    discharge_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    case_number: Mapped[str | None] = mapped_column(String(50))

    # --- დაავადების ანამნეზი (disease anamnesis) ---
    transportation_type: Mapped[str | None] = mapped_column(String(50))       # inpatient / day hospital
    hospitalization_type: Mapped[str | None] = mapped_column(String(100))     # case / hospitalization type
    complaints: Mapped[str | None] = mapped_column(Text)                      # complaints/symptoms/short anamnesis
    hospitalized_for_this_disease: Mapped[bool | None] = mapped_column(Boolean)  # inpatient only
    referring_institution: Mapped[str | None] = mapped_column(String(255))
    referral_date: Mapped[date | None] = mapped_column(Date)

    # legacy single-value diagnosis fields (kept; repeatable records live in assessment_diagnoses)
    preliminary_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    clinical_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    final_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    diagnosis_description: Mapped[str | None] = mapped_column(Text)
    treatment_notes: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str | None] = mapped_column(Text)

    # --- ეპიზოდის გამოსავალი (episode outcome) ---
    episode_result: Mapped[str | None] = mapped_column(String(100))   # e.g. recovered / transferred / deceased
    disease_outcome: Mapped[str | None] = mapped_column(String(100))  # not required when episode_result is death
    outcome_comment: Mapped[str | None] = mapped_column(Text)
    bed_days: Mapped[int | None] = mapped_column(Integer)             # auto-computed, inpatient only

    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped[Category] = relationship()
    doctor: Mapped[User] = relationship(foreign_keys=[doctor_id])
    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    images: Mapped[list["AssessmentImage"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    diagnoses: Mapped[list["AssessmentDiagnosis"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    visits: Mapped[list["AssessmentVisit"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )
    activities: Mapped[list["AssessmentActivity"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_assessments_patient_category", "patient_id", "category_id"),
        CheckConstraint("status IN ('open','completed')"),
    )


class AssessmentDiagnosis(Base):
    """Repeatable diagnosis records: preliminary / clinical / final (main, comorbidity, complication)."""
    __tablename__ = "assessment_diagnoses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))
    icd10_code: Mapped[str] = mapped_column(String(20))
    description: Mapped[str | None] = mapped_column(Text)
    established_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    disease_course: Mapped[str | None] = mapped_column(String(100))   # ავადმყოფობის მიმდინარეობა (red for final dx)
    refined_icd10: Mapped[str | None] = mapped_column(String(20))     # დაზუსტებული ICD-10

    assessment: Mapped[Assessment] = relationship(back_populates="diagnoses")

    __table_args__ = (
        CheckConstraint(f"kind IN {DIAGNOSIS_KINDS}"),
        Index("ix_assessment_diagnoses_assessment", "assessment_id"),
    )


class AssessmentVisit(Base):
    """განხორციელებული ვიზიტები — repeatable visits (non-inpatient episodes), max 24h each."""
    __tablename__ = "assessment_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id", ondelete="CASCADE"))
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    comment: Mapped[str | None] = mapped_column(Text)

    assessment: Mapped[Assessment] = relationship(back_populates="visits")

    __table_args__ = (Index("ix_assessment_visits_assessment", "assessment_id"),)


class AssessmentActivity(Base):
    """One row per treatment-process / post-discharge record (see ACTIVITY_TYPES).

    Common columns cover the shared spec fields; section-specific extras
    (consultant name, blood component, prescribed quantity, ...) go in `details`.
    """
    __tablename__ = "assessment_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id", ondelete="CASCADE"))
    activity_type: Mapped[str] = mapped_column(String(40))
    name: Mapped[str | None] = mapped_column(String(255))         # NCSP / lab / drug / activity name
    ncsp_code: Mapped[str | None] = mapped_column(String(30))
    icd10_code: Mapped[str | None] = mapped_column(String(20))
    care: Mapped[str | None] = mapped_column(String(100))         # მოვლა / care level
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    result_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    result_note: Mapped[str | None] = mapped_column(Text)         # activity result / doctor's comment / protocol
    details: Mapped[dict | None] = mapped_column(JSON)            # section-specific extras
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped[Assessment] = relationship(back_populates="activities")

    __table_args__ = (Index("ix_assessment_activities_assessment", "assessment_id", "activity_type"),)


class AssessmentImage(Base):
    __tablename__ = "assessment_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assessment_id: Mapped[int] = mapped_column(ForeignKey("assessments.id", ondelete="CASCADE"))
    file_path: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str | None] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    assessment: Mapped[Assessment] = relationship(back_populates="images")


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(10), default="pending")
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    doctor: Mapped[User] = relationship(foreign_keys=[doctor_id])
    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    category: Mapped[Category] = relationship()

    __table_args__ = (
        Index("ix_access_requests_lookup", "doctor_id", "patient_id", "category_id", "status"),
    )


class ProfileItem(Base):
    __tablename__ = "profile_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    item_type: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(255))
    detail: Mapped[str | None] = mapped_column(Text)
    icd10: Mapped[str | None] = mapped_column(String(20))
    occurred_on: Mapped[date | None] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(f"item_type IN {PROFILE_ITEM_TYPES}"),
        Index("ix_profile_items_patient", "patient_id", "item_type"),
    )


class CategoryMetric(Base):
    """Catalog of known metrics, one or more per medical category.

    Used by the AI intake to map free text ("my pulse is 50") to a structured
    metric code and to tag the stored observation with the right category.
    """
    __tablename__ = "category_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    code: Mapped[str] = mapped_column(String(100), unique=True)   # e.g. 'pulse'
    name: Mapped[str] = mapped_column(String(150))                # display name
    unit: Mapped[str | None] = mapped_column(String(30))          # default unit
    box: Mapped[str | None] = mapped_column(String(50))           # dashboard box
    reference: Mapped[str | None] = mapped_column(String(50))     # e.g. '<120', '60–80'
    range_low: Mapped[float | None] = mapped_column(Float)        # normal-range shading
    range_high: Mapped[float | None] = mapped_column(Float)
    modality: Mapped[str | None] = mapped_column(String(20))      # vital|lab|wearable|score|imaging|ecg
    diagnostic_group: Mapped[str | None] = mapped_column(String(50))  # Diagnostic Data grouping

    category: Mapped[Category] = relationship()


class CalendarEvent(Base):
    """Patient-owned calendar: appointments, reminders, and medication schedule."""
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(20))  # appointment | reminder | medication
    title: Mapped[str] = mapped_column(String(255))
    event_date: Mapped[date] = mapped_column(Date)
    event_time: Mapped[str | None] = mapped_column(String(10))   # 'HH:MM'
    detail: Mapped[str | None] = mapped_column(Text)             # location / notes / dose schedule
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint("kind IN ('appointment','reminder','medication')"),
        Index("ix_calendar_patient_date", "patient_id", "event_date"),
    )


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    recorded_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    box: Mapped[str] = mapped_column(String(50))
    metric: Mapped[str] = mapped_column(String(100))
    value_num: Mapped[float | None] = mapped_column(Float)
    value_text: Mapped[str | None] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(String(30))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source_kind: Mapped[str | None] = mapped_column(String(30))
    source_label: Mapped[str | None] = mapped_column(String(255))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_observations_series", "patient_id", "box", "metric", "observed_at"),
    )


class PatientDocument(Base):
    __tablename__ = "patient_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    file_path: Mapped[str] = mapped_column(String(500))
    original_name: Mapped[str | None] = mapped_column(String(255))
    mime: Mapped[str | None] = mapped_column(String(100))
    summary: Mapped[str | None] = mapped_column(Text)
    source_kind: Mapped[str | None] = mapped_column(String(30))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (Index("ix_patient_documents_patient", "patient_id"),)

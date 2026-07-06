from datetime import datetime, date

from sqlalchemy import (
    CheckConstraint, Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

EPISODE_TYPES = ("inpatient", "day_hospital", "emergency_outpatient", "outpatient")
REQUEST_STATUSES = ("pending", "approved", "denied", "revoked")
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
    visit_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    complaints: Mapped[str | None] = mapped_column(Text)
    preliminary_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    clinical_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    final_diagnosis_icd10: Mapped[str | None] = mapped_column(String(20))
    diagnosis_description: Mapped[str | None] = mapped_column(Text)
    treatment_notes: Mapped[str | None] = mapped_column(Text)
    recommendations: Mapped[str | None] = mapped_column(Text)
    outcome: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped[Category] = relationship()
    doctor: Mapped[User] = relationship(foreign_keys=[doctor_id])
    patient: Mapped[User] = relationship(foreign_keys=[patient_id])
    images: Mapped[list["AssessmentImage"]] = relationship(
        back_populates="assessment", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_assessments_patient_category", "patient_id", "category_id"),
    )


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

    category: Mapped[Category] = relationship()


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

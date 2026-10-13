from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), default="xlsx") # xlsx, xls, csv
    sheet_name = Column(String(100), nullable=True)
    imported_by = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_rows = Column(Integer, default=0)
    created_count = Column(Integer, default=0)
    updated_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    rejected_count = Column(Integer, default=0)
    status = Column(String(30), default="completed") # success, partial, failed
    errors_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[imported_by])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False) # LOGIN, IMPORT_EXECUTED, GRADE_UPDATED, etc.
    resource_type = Column(String(50), nullable=True) # student, attendance, assignment, settings
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])


class InstitutionSetting(Base):
    __tablename__ = "institution_settings"

    id = Column(String(50), primary_key=True, default="default")
    institution_name = Column(String(200), default="Apex Institute of Technology & Management")
    academic_year = Column(String(30), default="2025-2026")
    current_semester = Column(Integer, default=4)
    min_attendance_threshold = Column(Float, default=75.0)
    at_risk_grade_threshold = Column(Float, default=55.0)
    weight_academic = Column(Float, default=0.30)
    weight_attendance = Column(Float, default=0.20)
    weight_lms = Column(Float, default=0.10)
    weight_extracurricular = Column(Float, default=0.10)
    weight_placement = Column(Float, default=0.20)
    weight_skills = Column(Float, default=0.10)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

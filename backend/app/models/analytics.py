from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class StudentSuccessScore(Base):
    __tablename__ = "student_success_scores"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score = Column(Float, nullable=False) # 0 to 100
    academic_component = Column(Float, nullable=True) # 0 to 100
    attendance_component = Column(Float, nullable=True) # 0 to 100
    lms_activity_component = Column(Float, nullable=True) # 0 to 100
    extracurricular_component = Column(Float, nullable=True) # 0 to 100
    placement_readiness_component = Column(Float, nullable=True) # 0 to 100
    skills_feedback_component = Column(Float, nullable=True) # 0 to 100
    data_completeness = Column(Float, default=100.0) # percentage 0 to 100
    is_provisional = Column(Boolean, default=False)
    missing_components_json = Column(Text, default="[]")
    positive_factors_json = Column(Text, default="[]")
    negative_factors_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    methodology_version = Column(String(20), default="v1.0")
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(String(20), nullable=False) # low, medium, high, critical
    risk_category = Column(String(50), nullable=False) # attendance_drop, academic_decline, missing_assignments, etc.
    evidence_json = Column(Text, nullable=False, default="[]")
    status = Column(String(30), default="open") # open, reviewed, in_intervention, resolved, dismissed
    priority = Column(String(20), default="medium") # high, medium, low
    recommended_action = Column(String(255), nullable=True)
    assigned_reviewer_id = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    follow_up_deadline = Column(String(30), nullable=True)
    review_notes = Column(Text, nullable=True)
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[assigned_reviewer_id])
    interventions = relationship("Intervention", back_populates="risk_alert")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_alert_id = Column(String(50), ForeignKey("risk_alerts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False) # Attendance Support, Subject Tutoring, Assignment Recovery, Mentoring, etc.
    goal = Column(Text, nullable=False)
    status = Column(String(30), default="pending") # pending, active, follow_up_required, completed, cancelled
    responsible_staff_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    due_date = Column(String(30), nullable=True)
    follow_up_date = Column(String(30), nullable=True)
    actions_taken = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    outcome = Column(String(50), default="pending") # improved, moderate_progress, unresponsive, pending
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    responsible_staff = relationship("User", foreign_keys=[responsible_staff_id])
    risk_alert = relationship("RiskAlert", back_populates="interventions")


class StudentJourneyEvent(Base):
    __tablename__ = "student_journey_events"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False) # enrollment, attendance, grade, milestone, intervention, activity
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    severity = Column(String(20), default="info") # info, success, warning, danger

    student = relationship("User", foreign_keys=[student_id])


class SkillPlacementProfile(Base):
    __tablename__ = "skill_placement_profiles"

    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    technical_skills_json = Column(Text, default="[]")
    soft_skills_json = Column(Text, default="[]")
    coding_score = Column(Float, default=70.0)
    aptitude_score = Column(Float, default=70.0)
    mock_interview_score = Column(Float, default=65.0)
    certifications_count = Column(Integer, default=1)
    resume_score = Column(Float, default=75.0)
    readiness_percentage = Column(Float, default=68.0)
    missing_evidence_json = Column(Text, default="[]")
    recommendations_json = Column(Text, default="[]")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])

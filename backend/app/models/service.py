from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, default=1)
    academic_year = Column(String(30), default="2025-2026")
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(String(20), nullable=False)
    status = Column(String(20), default="unpaid") # paid, partial, overdue, unpaid
    category = Column(String(50), default="Tuition & Institutional Fee")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type = Column(String(50), nullable=False) # Medical / Sick, Casual / Personal, Academic Event
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default="pending") # pending, approved, rejected
    reviewed_by = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    review_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    appointment_date = Column(String(20), nullable=False)
    time_slot = Column(String(50), nullable=False)
    status = Column(String(20), default="scheduled") # scheduled, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    faculty = relationship("User", foreign_keys=[faculty_id])


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String(30), default="all") # all, student, faculty, hod
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="CASCADE"), nullable=True)
    priority = Column(String(20), default="normal") # normal, important, urgent
    created_by = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    author = relationship("User", foreign_keys=[created_by])
    department = relationship("Department")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="academic") # academic, attendance, system, risk, service
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    email_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    attendance_alerts = Column(Boolean, default=True)
    grade_alerts = Column(Boolean, default=True)
    announcements_alerts = Column(Boolean, default=True)

    user = relationship("User", foreign_keys=[user_id])


class ExtracurricularActivity(Base):
    __tablename__ = "extracurricular_activities"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), default="Technical Club") # Technical Club, Hackathon, Sports, Cultural, Leadership
    role = Column(String(100), default="Member")
    hours_logged = Column(Integer, default=10)
    achievements = Column(Text, nullable=True)
    verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])

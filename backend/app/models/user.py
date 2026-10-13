from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    hod_id = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="department", foreign_keys="User.department_id")
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(30), nullable=False, index=True) # student, faculty, hod, super_admin
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("FacultyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    admission_number = Column(String(50), nullable=True)
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    semester = Column(Integer, default=1)
    academic_year = Column(String(30), default="2025-2026")
    section = Column(String(10), default="A")
    cgpa = Column(Float, default=0.0)
    phone = Column(String(30), nullable=True)
    guardian_name = Column(String(150), nullable=True)
    guardian_phone = Column(String(30), nullable=True)
    placement_status = Column(String(50), default="Preparing") # Not Ready, Preparing, Ready, Placed
    is_provisional = Column(Boolean, default=False)

    user = relationship("User", back_populates="student_profile")
    department = relationship("Department")


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    employee_id = Column(String(50), unique=True, nullable=False, index=True)
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), default="Assistant Professor")
    specialization = Column(String(200), nullable=True)
    office_room = Column(String(50), nullable=True)

    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department")

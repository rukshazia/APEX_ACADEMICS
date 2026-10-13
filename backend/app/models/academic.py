from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Course(Base):
    __tablename__ = "courses"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    code = Column(String(30), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    credits = Column(Integer, default=3)
    semester = Column(Integer, default=1)
    description = Column(Text, nullable=True)

    department = relationship("Department", back_populates="courses")
    enrollments = relationship("CourseEnrollment", back_populates="course", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="course", cascade="all, delete-orphan")
    grades = relationship("AssessmentGrade", back_populates="course", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="course", cascade="all, delete-orphan")


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    semester = Column(Integer, default=1)
    academic_year = Column(String(30), default="2025-2026")
    status = Column(String(30), default="active") # active, completed, dropped

    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", back_populates="enrollments")


class FacultyAssignment(Base):
    __tablename__ = "faculty_assignments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    faculty_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    section = Column(String(10), default="A")
    semester = Column(Integer, default=1)
    academic_year = Column(String(30), default="2025-2026")

    faculty = relationship("User", foreign_keys=[faculty_id])
    course = relationship("Course")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    status = Column(String(20), nullable=False) # present, absent, late, excused
    recorded_by = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", back_populates="attendance_records")
    recorder = relationship("User", foreign_keys=[recorded_by])


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    faculty_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), default="Homework") # Homework, Project, Lab Report, Quiz
    max_marks = Column(Float, default=100.0)
    due_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    course = relationship("Course", back_populates="assignments")
    faculty = relationship("User", foreign_keys=[faculty_id])
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    assignment_id = Column(String(50), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    content = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    status = Column(String(30), default="submitted") # submitted, graded, late
    marks_obtained = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    grader = relationship("User", foreign_keys=[graded_by])


class AssessmentGrade(Base):
    __tablename__ = "assessment_grades"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_name = Column(String(100), nullable=False) # Midterm, End Semester, Quiz 1, etc.
    max_marks = Column(Float, default=100.0)
    marks_obtained = Column(Float, nullable=False)
    letter_grade = Column(String(10), default="B")
    exam_date = Column(String(20), nullable=True)
    semester = Column(Integer, default=1)
    faculty_id = Column(String(50), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    student = relationship("User", foreign_keys=[student_id])
    course = relationship("Course", back_populates="grades")


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    department_id = Column(String(50), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(String(50), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(50), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    semester = Column(Integer, default=1)
    section = Column(String(10), default="A")
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, etc.
    start_time = Column(String(10), nullable=False) # HH:MM (e.g. 09:00)
    end_time = Column(String(10), nullable=False) # HH:MM (e.g. 10:00)
    room_number = Column(String(50), default="Hall-101")

    department = relationship("Department")
    course = relationship("Course")
    faculty = relationship("User")


class AcademicCalendarEvent(Base):
    __tablename__ = "academic_calendar_events"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    event_type = Column(String(50), default="academic") # holiday, exam, fest, deadline
    start_date = Column(String(20), nullable=False) # YYYY-MM-DD
    end_date = Column(String(20), nullable=False) # YYYY-MM-DD
    description = Column(Text, nullable=True)

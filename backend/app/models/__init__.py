from app.database import Base
from app.models.user import Department, User, StudentProfile, FacultyProfile
from app.models.academic import (
    Course,
    CourseEnrollment,
    FacultyAssignment,
    AttendanceRecord,
    Assignment,
    AssignmentSubmission,
    AssessmentGrade,
    TimetableEntry,
    AcademicCalendarEvent
)
from app.models.analytics import (
    StudentSuccessScore,
    RiskAlert,
    Intervention,
    StudentJourneyEvent,
    SkillPlacementProfile
)
from app.models.service import (
    FeeRecord,
    LeaveRequest,
    Appointment,
    Announcement,
    Notification,
    NotificationPreference,
    ExtracurricularActivity
)
from app.models.importer import ImportJob, AuditLog, InstitutionSetting

__all__ = [
    "Base",
    "Department",
    "User",
    "StudentProfile",
    "FacultyProfile",
    "Course",
    "CourseEnrollment",
    "FacultyAssignment",
    "AttendanceRecord",
    "Assignment",
    "AssignmentSubmission",
    "AssessmentGrade",
    "TimetableEntry",
    "AcademicCalendarEvent",
    "StudentSuccessScore",
    "RiskAlert",
    "Intervention",
    "StudentJourneyEvent",
    "SkillPlacementProfile",
    "FeeRecord",
    "LeaveRequest",
    "Appointment",
    "Announcement",
    "Notification",
    "NotificationPreference",
    "ExtracurricularActivity",
    "ImportJob",
    "AuditLog",
    "InstitutionSetting"
]

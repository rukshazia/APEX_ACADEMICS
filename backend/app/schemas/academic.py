from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AttendanceBatchCreate(BaseModel):
    course_id: str
    date: str
    records: List[Dict[str, str]] # [{"student_id": "...", "status": "present", "remarks": ""}]

class AttendanceRecordOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    course_id: str
    course_name: Optional[str] = None
    date: str
    status: str
    remarks: Optional[str] = None

class AssignmentCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    category: str = "Homework"
    max_marks: float = 100.0
    due_date: str

class AssignmentSubmissionCreate(BaseModel):
    assignment_id: str
    content: str
    file_url: Optional[str] = None

class AssignmentGradeUpdate(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None

class GradeCreate(BaseModel):
    student_id: str
    course_id: str
    assessment_name: str
    max_marks: float = 100.0
    marks_obtained: float
    letter_grade: str = "B"
    exam_date: Optional[str] = None
    semester: int = 1

class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    department_id: str
    credits: int
    semester: int
    description: Optional[str] = None

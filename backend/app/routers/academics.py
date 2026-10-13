from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User, StudentProfile
from app.models.academic import (
    Course, CourseEnrollment, FacultyAssignment, AttendanceRecord,
    Assignment, AssignmentSubmission, AssessmentGrade, TimetableEntry, AcademicCalendarEvent
)
from app.models.analytics import StudentJourneyEvent
from app.auth import get_current_user, require_staff, require_student
from app.schemas.academic import (
    AttendanceBatchCreate, AssignmentCreate, AssignmentSubmissionCreate,
    AssignmentGradeUpdate, GradeCreate
)
from app.models.importer import AuditLog

router = APIRouter(prefix="/academics", tags=["Academics"])

# ----------------- COURSES -----------------
@router.get("/courses")
def get_courses(
    department_id: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    elif current_user.role in ["student", "hod", "faculty"] and current_user.department_id:
        query = query.filter(Course.department_id == current_user.department_id)
    if semester:
        query = query.filter(Course.semester == semester)
    
    courses = query.all()
    return [
        {
            "id": c.id,
            "code": c.code,
            "name": c.name,
            "department_id": c.department_id,
            "credits": c.credits,
            "semester": c.semester,
            "description": c.description
        }
        for c in courses
    ]

# ----------------- ATTENDANCE -----------------
@router.get("/attendance")
def get_attendance(
    student_id: Optional[str] = None,
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_student_id = student_id
    if current_user.role == "student":
        target_student_id = current_user.id # Student can only see own attendance
    
    query = db.query(AttendanceRecord)
    if target_student_id:
        query = query.filter(AttendanceRecord.student_id == target_student_id)
    if course_id:
        query = query.filter(AttendanceRecord.course_id == course_id)

    records = query.order_by(AttendanceRecord.date.desc()).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "student_id": r.student_id,
            "course_id": r.course_id,
            "course_name": r.course.name if r.course else None,
            "course_code": r.course.code if r.course else None,
            "date": r.date,
            "status": r.status,
            "remarks": r.remarks
        })
    return results

@router.get("/attendance/summary/{student_id}")
def get_attendance_summary(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Cannot access other student attendance summary.")

    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()
    total = len(records)
    present = sum(1 for r in records if r.status in ["present", "late"])
    absent = sum(1 for r in records if r.status == "absent")
    pct = round((present / total * 100), 1) if total > 0 else 0.0

    # Group by course
    by_course: Dict[str, Dict[str, Any]] = {}
    for r in records:
        cid = r.course_id
        if cid not in by_course:
            by_course[cid] = {
                "course_id": cid,
                "course_name": r.course.name if r.course else cid,
                "course_code": r.course.code if r.course else "",
                "total": 0,
                "present": 0
            }
        by_course[cid]["total"] += 1
        if r.status in ["present", "late"]:
            by_course[cid]["present"] += 1

    course_list = []
    for cid, data in by_course.items():
        c_pct = round((data["present"] / data["total"] * 100), 1) if data["total"] > 0 else 0.0
        course_list.append({
            **data,
            "percentage": c_pct,
            "is_below_threshold": c_pct < 75.0
        })

    return {
        "student_id": student_id,
        "total_classes": total,
        "attended_classes": present,
        "absent_classes": absent,
        "overall_percentage": pct,
        "is_below_threshold": pct < 75.0,
        "courses": course_list
    }

@router.post("/attendance/record")
def record_batch_attendance(
    payload: AttendanceBatchCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    """Authorized faculty records or corrects attendance."""
    created_count = 0
    for item in payload.records:
        sid = item.get("student_id")
        status_val = item.get("status", "present")
        remarks_val = item.get("remarks")

        # Check existing record for that student, course, date
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == sid,
            AttendanceRecord.course_id == payload.course_id,
            AttendanceRecord.date == payload.date
        ).first()

        if existing:
            existing.status = status_val
            existing.remarks = remarks_val
            existing.recorded_by = current_user.id
        else:
            rec = AttendanceRecord(
                student_id=sid,
                course_id=payload.course_id,
                date=payload.date,
                status=status_val,
                remarks=remarks_val,
                recorded_by=current_user.id
            )
            db.add(rec)
            created_count += 1

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="ATTENDANCE_RECORDED",
        resource_type="attendance",
        resource_id=payload.course_id,
        details=f"Recorded attendance for {len(payload.records)} students on {payload.date}"
    ))
    db.commit()
    return {"message": "Attendance successfully recorded.", "updated_records": len(payload.records)}

# ----------------- ASSIGNMENTS -----------------
@router.get("/assignments")
def get_assignments(
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Assignment)
    if course_id:
        query = query.filter(Assignment.course_id == course_id)

    assignments = query.order_by(Assignment.due_date.asc()).all()
    results = []
    for a in assignments:
        # Check student submission status if current user is student
        submission_status = "unsubmitted"
        submission_marks = None
        if current_user.role == "student":
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.student_id == current_user.id
            ).first()
            if sub:
                submission_status = sub.status
                submission_marks = sub.marks_obtained

        results.append({
            "id": a.id,
            "course_id": a.course_id,
            "course_name": a.course.name if a.course else None,
            "course_code": a.course.code if a.course else None,
            "faculty_name": a.faculty.full_name if a.faculty else None,
            "title": a.title,
            "description": a.description,
            "category": a.category,
            "max_marks": a.max_marks,
            "due_date": a.due_date.isoformat() if a.due_date else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "submission_status": submission_status,
            "submission_marks": submission_marks
        })
    return results

@router.post("/assignments")
def create_assignment(
    payload: AssignmentCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    due_dt = datetime.fromisoformat(payload.due_date) if "T" in payload.due_date else datetime.strptime(payload.due_date, "%Y-%m-%d")
    asg = Assignment(
        course_id=payload.course_id,
        faculty_id=current_user.id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        max_marks=payload.max_marks,
        due_date=due_dt
    )
    db.add(asg)
    db.commit()
    db.refresh(asg)
    return {"message": "Assignment created successfully.", "id": asg.id}

@router.get("/assignments/{assignment_id}/submissions")
def get_assignment_submissions(
    assignment_id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()
    results = []
    for s in submissions:
        u = s.student
        results.append({
            "id": s.id,
            "assignment_id": s.assignment_id,
            "student_id": s.student_id,
            "student_name": u.full_name if u else "Student",
            "roll_number": u.student_profile.roll_number if (u and u.student_profile) else "",
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            "content": s.content,
            "file_url": s.file_url,
            "status": s.status,
            "marks_obtained": s.marks_obtained,
            "feedback": s.feedback
        })
    return results

@router.post("/assignments/{assignment_id}/submit")
def submit_assignment(
    assignment_id: str,
    payload: AssignmentSubmissionCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    asg = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).first()

    now = datetime.now(timezone.utc)
    if sub:
        sub.content = payload.content
        sub.file_url = payload.file_url
        sub.submitted_at = now
        sub.status = "submitted"
    else:
        sub = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=current_user.id,
            submitted_at=now,
            content=payload.content,
            file_url=payload.file_url,
            status="submitted"
        )
        db.add(sub)

    db.add(StudentJourneyEvent(
        student_id=current_user.id,
        event_type="academic",
        title=f"Submitted Assignment: {asg.title}",
        description=f"Submission recorded for course {asg.course.code if asg.course else ''}.",
        severity="info"
    ))
    db.commit()
    return {"message": "Assignment submitted successfully."}

@router.put("/assignments/submissions/{submission_id}/grade")
def grade_assignment_submission(
    submission_id: str,
    payload: AssignmentGradeUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    sub = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")

    sub.marks_obtained = payload.marks_obtained
    sub.feedback = payload.feedback
    sub.status = "graded"
    sub.graded_by = current_user.id

    db.commit()
    return {"message": "Submission graded successfully."}

# ----------------- GRADES -----------------
@router.get("/grades")
def get_grades(
    student_id: Optional[str] = None,
    course_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_student_id = student_id
    if current_user.role == "student":
        target_student_id = current_user.id

    query = db.query(AssessmentGrade)
    if target_student_id:
        query = query.filter(AssessmentGrade.student_id == target_student_id)
    if course_id:
        query = query.filter(AssessmentGrade.course_id == course_id)

    grades = query.all()
    results = []
    for g in grades:
        results.append({
            "id": g.id,
            "student_id": g.student_id,
            "student_name": g.student.full_name if g.student else None,
            "course_id": g.course_id,
            "course_name": g.course.name if g.course else None,
            "course_code": g.course.code if g.course else None,
            "assessment_name": g.assessment_name,
            "max_marks": g.max_marks,
            "marks_obtained": g.marks_obtained,
            "letter_grade": g.letter_grade,
            "percentage": round((g.marks_obtained / g.max_marks * 100), 1) if g.max_marks > 0 else 0.0,
            "exam_date": g.exam_date,
            "semester": g.semester
        })
    return results

@router.post("/grades")
def record_grade(
    payload: GradeCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    grade = AssessmentGrade(
        student_id=payload.student_id,
        course_id=payload.course_id,
        assessment_name=payload.assessment_name,
        max_marks=payload.max_marks,
        marks_obtained=payload.marks_obtained,
        letter_grade=payload.letter_grade,
        exam_date=payload.exam_date,
        semester=payload.semester,
        faculty_id=current_user.id
    )
    db.add(grade)

    # Add journey event
    pct = round(payload.marks_obtained / payload.max_marks * 100, 1)
    sev = "success" if pct >= 75 else ("warning" if pct < 50 else "info")
    db.add(StudentJourneyEvent(
        student_id=payload.student_id,
        event_type="grade",
        title=f"Assessment Recorded: {payload.assessment_name}",
        description=f"Received score of {payload.marks_obtained}/{payload.max_marks} (Grade {payload.letter_grade}).",
        severity=sev
    ))

    db.commit()
    return {"message": "Grade recorded successfully."}

# ----------------- TIMETABLE & CALENDAR -----------------
@router.get("/timetable")
def get_timetable(
    semester: Optional[int] = None,
    section: Optional[str] = "A",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(TimetableEntry)
    if semester:
        query = query.filter(TimetableEntry.semester == semester)
    if section:
        query = query.filter(TimetableEntry.section == section)

    entries = query.all()
    return [
        {
            "id": t.id,
            "course_id": t.course_id,
            "course_name": t.course.name if t.course else None,
            "course_code": t.course.code if t.course else None,
            "faculty_name": t.faculty.full_name if t.faculty else None,
            "day_of_week": t.day_of_week,
            "start_time": t.start_time,
            "end_time": t.end_time,
            "room_number": t.room_number,
            "semester": t.semester,
            "section": t.section
        }
        for t in entries
    ]

@router.get("/calendar")
def get_calendar(db: Session = Depends(get_db)):
    events = db.query(AcademicCalendarEvent).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "event_type": e.event_type,
            "start_date": e.start_date,
            "end_date": e.end_date,
            "description": e.description
        }
        for e in events
    ]

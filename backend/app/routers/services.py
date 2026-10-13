from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User, StudentProfile
from app.models.service import (
    FeeRecord, LeaveRequest, Appointment, Announcement, Notification, NotificationPreference, ExtracurricularActivity
)
from app.models.analytics import StudentJourneyEvent
from app.auth import get_current_user, require_staff, require_student, require_admin
from app.schemas.service import (
    LeaveRequestCreate, LeaveRequestReview, AppointmentCreate, AppointmentStatusUpdate, AnnouncementCreate
)

router = APIRouter(prefix="/services", tags=["Student Services"])

# ----------------- FEES -----------------
@router.get("/fees")
def get_fees(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Financial information is strictly permission-controlled.
    Students can only view their own fee statements.
    """
    target_id = student_id
    if current_user.role == "student":
        target_id = current_user.id
    elif current_user.role in ["faculty"] and not target_id:
        raise HTTPException(status_code=403, detail="Faculty must specify authorized student ID or access is restricted.")

    query = db.query(FeeRecord)
    if target_id:
        query = query.filter(FeeRecord.student_id == target_id)

    fees = query.order_by(FeeRecord.due_date.desc()).all()
    results = []
    for f in fees:
        stu = f.student
        results.append({
            "id": f.id,
            "student_id": f.student_id,
            "student_name": stu.full_name if stu else None,
            "roll_number": stu.student_profile.roll_number if (stu and stu.student_profile) else None,
            "semester": f.semester,
            "academic_year": f.academic_year,
            "category": f.category,
            "total_amount": f.total_amount,
            "paid_amount": f.paid_amount,
            "due_amount": max(0.0, f.total_amount - f.paid_amount),
            "due_date": f.due_date,
            "status": f.status
        })
    return results

# ----------------- LEAVES -----------------
@router.get("/leaves")
def get_leaves(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest)
    if current_user.role == "student":
        query = query.filter(LeaveRequest.student_id == current_user.id)

    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    results = []
    for l in leaves:
        stu = l.student
        results.append({
            "id": l.id,
            "student_id": l.student_id,
            "student_name": stu.full_name if stu else "Student",
            "roll_number": stu.student_profile.roll_number if (stu and stu.student_profile) else "",
            "leave_type": l.leave_type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "reviewed_by_name": l.reviewer.full_name if l.reviewer else None,
            "review_comment": l.review_comment,
            "created_at": l.created_at.isoformat()
        })
    return results

@router.post("/leaves")
def submit_leave_request(
    payload: LeaveRequestCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    leave = LeaveRequest(
        student_id=current_user.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        status="pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return {"message": "Leave application submitted successfully.", "id": leave.id}

@router.put("/leaves/{leave_id}/review")
def review_leave_request(
    leave_id: str,
    payload: LeaveRequestReview,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")

    leave.status = payload.status
    leave.reviewed_by = current_user.id
    leave.review_comment = payload.review_comment

    # Notify student
    db.add(Notification(
        user_id=leave.student_id,
        title=f"Leave Request {payload.status.capitalize()}",
        message=f"Your {leave.leave_type} leave from {leave.start_date} to {leave.end_date} has been {payload.status}.",
        category="service"
    ))
    db.commit()
    return {"message": f"Leave application {payload.status}."}

# ----------------- APPOINTMENTS -----------------
@router.get("/appointments")
def get_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment)
    if current_user.role == "student":
        query = query.filter(Appointment.student_id == current_user.id)
    elif current_user.role == "faculty":
        query = query.filter(Appointment.faculty_id == current_user.id)

    appts = query.order_by(Appointment.appointment_date.desc()).all()
    results = []
    for a in appts:
        stu = a.student
        fac = a.faculty
        results.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": stu.full_name if stu else "Student",
            "faculty_id": a.faculty_id,
            "faculty_name": fac.full_name if fac else "Faculty",
            "topic": a.topic,
            "appointment_date": a.appointment_date,
            "time_slot": a.time_slot,
            "status": a.status,
            "notes": a.notes,
            "created_at": a.created_at.isoformat()
        })
    return results

@router.post("/appointments")
def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db)
):
    appt = Appointment(
        student_id=current_user.id,
        faculty_id=payload.faculty_id,
        topic=payload.topic,
        appointment_date=payload.appointment_date,
        time_slot=payload.time_slot,
        notes=payload.notes,
        status="scheduled"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    return {"message": "Appointment scheduled successfully.", "id": appt.id}

@router.put("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    appt.status = payload.status
    if payload.notes:
        appt.notes = payload.notes
    db.commit()
    return {"message": "Appointment status updated."}

# ----------------- ANNOUNCEMENTS -----------------
@router.get("/announcements")
def get_announcements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Announcement)
    # Role visibility check
    if current_user.role == "student":
        query = query.filter(Announcement.target_role.in_(["all", "student"]))
    elif current_user.role == "faculty":
        query = query.filter(Announcement.target_role.in_(["all", "faculty"]))

    announcements = query.order_by(Announcement.created_at.desc()).all()
    results = []
    for a in announcements:
        results.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "target_role": a.target_role,
            "priority": a.priority,
            "department_id": a.department_id,
            "created_by_name": a.author.full_name if a.author else "Admin",
            "created_at": a.created_at.isoformat()
        })
    return results

@router.post("/announcements")
def publish_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    ann = Announcement(
        title=payload.title,
        content=payload.content,
        target_role=payload.target_role,
        department_id=payload.department_id,
        priority=payload.priority,
        created_by=current_user.id
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {"message": "Announcement published successfully.", "id": ann.id}

# ----------------- NOTIFICATIONS -----------------
@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notes = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at.isoformat()
        }
        for n in notes
    ]

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    n = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "Notification marked as read."}

@router.put("/notifications/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read."}

# ----------------- EXTRACURRICULAR -----------------
@router.get("/extracurricular")
def get_extracurricular(
    student_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_id = student_id or (current_user.id if current_user.role == "student" else None)
    query = db.query(ExtracurricularActivity)
    if target_id:
        query = query.filter(ExtracurricularActivity.student_id == target_id)

    acts = query.all()
    return [
        {
            "id": a.id,
            "student_id": a.student_id,
            "title": a.title,
            "category": a.category,
            "role": a.role,
            "hours_logged": a.hours_logged,
            "achievements": a.achievements,
            "verified": a.verified,
            "created_at": a.created_at.isoformat()
        }
        for a in acts
    ]

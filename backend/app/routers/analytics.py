import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User, StudentProfile, Department
from app.models.academic import AttendanceRecord, AssessmentGrade, CourseEnrollment, Assignment, AssignmentSubmission, FacultyAssignment
from app.models.analytics import (
    StudentSuccessScore, RiskAlert, Intervention, StudentJourneyEvent, SkillPlacementProfile
)
from app.auth import get_current_user, require_staff, require_student
from app.services.scoring import calculate_student_success_score
from app.services.risk_detection import evaluate_student_risk
from app.services.risk_scoring import evaluate_student_risk_assessment, DEFAULT_RISK_WEIGHTS, DEFAULT_THRESHOLDS
from app.schemas.analytics import (
    RiskAlertStatusUpdate, InterventionCreate, InterventionUpdate
)
from app.models.importer import AuditLog

router = APIRouter(prefix="/analytics", tags=["Analytics & AI"])

# ----------------- SUCCESS SCORE -----------------
@router.get("/success-score/{student_id}")
def get_student_success_score(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Students can only view their own success score.")

    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    score_rec = db.query(StudentSuccessScore).filter(StudentSuccessScore.student_id == student_id).first()

    # If no recorded score or if recalculation needed, compute live from database records
    if not score_rec:
        # Calculate academic average
        grades = db.query(AssessmentGrade).filter(AssessmentGrade.student_id == student_id).all()
        academic_pct = None
        if grades:
            academic_pct = sum((g.marks_obtained / g.max_marks * 100) for g in grades) / len(grades)
        elif student.cgpa and student.cgpa > 0:
            academic_pct = student.cgpa * 10.0 # Standard 10-point conversion

        # Calculate attendance percentage
        att_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()
        att_pct = None
        if att_records:
            present_count = sum(1 for a in att_records if a.status in ["present", "late"])
            att_pct = (present_count / len(att_records)) * 100

        # Placement readiness
        placement_rec = db.query(SkillPlacementProfile).filter(SkillPlacementProfile.student_id == student_id).first()
        placement_pct = placement_rec.readiness_percentage if placement_rec else None

        res = calculate_student_success_score(
            academic_pct=academic_pct,
            attendance_pct=att_pct,
            lms_activity_pct=75.0, # active campus portal login
            extracurricular_pct=70.0,
            placement_readiness_pct=placement_pct,
            skills_feedback_pct=75.0
        )

        score_rec = StudentSuccessScore(
            student_id=student_id,
            overall_score=res["overall_score"],
            academic_component=res["components"]["academic"],
            attendance_component=res["components"]["attendance"],
            lms_activity_component=res["components"]["lms"],
            extracurricular_component=res["components"]["extracurricular"],
            placement_readiness_component=res["components"]["placement"],
            skills_feedback_component=res["components"]["skills"],
            data_completeness=res["data_completeness"],
            is_provisional=res["is_provisional"],
            missing_components_json=json.dumps(res["missing_components"]),
            positive_factors_json=json.dumps(res["positive_factors"]),
            negative_factors_json=json.dumps(res["negative_factors"]),
            recommendations_json=json.dumps(res["recommendations"]),
            methodology_version="v1.0"
        )
        db.add(score_rec)
        db.commit()
        db.refresh(score_rec)

    return {
        "student_id": student_id,
        "overall_score": score_rec.overall_score,
        "data_completeness": score_rec.data_completeness,
        "is_provisional": score_rec.is_provisional,
        "components": {
            "academic": score_rec.academic_component,
            "attendance": score_rec.attendance_component,
            "lms": score_rec.lms_activity_component,
            "extracurricular": score_rec.extracurricular_component,
            "placement": score_rec.placement_readiness_component,
            "skills": score_rec.skills_feedback_component
        },
        "missing_components": json.loads(score_rec.missing_components_json or "[]"),
        "positive_factors": json.loads(score_rec.positive_factors_json or "[]"),
        "negative_factors": json.loads(score_rec.negative_factors_json or "[]"),
        "recommendations": json.loads(score_rec.recommendations_json or "[]"),
        "methodology_version": score_rec.methodology_version,
        "calculated_at": score_rec.calculated_at.isoformat()
    }

# ----------------- COMPREHENSIVE INSTITUTION-WIDE RISK ANALYTICS -----------------
@router.get("/risk-students")
def get_risk_students(
    risk_category: Optional[str] = Query(None, description="Filter by risk category: LOW, MODERATE, HIGH, VERY_HIGH, CRITICAL, INSUFFICIENT_DATA"),
    department_id: Optional[str] = Query(None, description="Filter by department ID"),
    search: Optional[str] = Query(None, description="Search by name, roll number, or email"),
    completeness: Optional[str] = Query(None, description="Filter by completeness: complete, provisional, insufficient"),
    intervention_status: Optional[str] = Query(None, description="Filter by intervention status"),
    sort_by: str = Query("risk_score", description="Sort field: risk_score, name, attendance, academic"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile).join(User, StudentProfile.id == User.id).filter(
        User.role == "student",
        User.is_active == True
    )

    # Scoping by role
    if current_user.role == "faculty":
        fac_courses = db.query(FacultyAssignment.course_id).filter(
            FacultyAssignment.faculty_id == current_user.id
        ).all()
        c_ids = [fc[0] for fc in fac_courses]
        if c_ids:
            enrolled_stu_ids = db.query(CourseEnrollment.student_id).filter(
                CourseEnrollment.course_id.in_(c_ids),
                CourseEnrollment.status == "active"
            ).distinct().all()
            allowed_ids = [s[0] for s in enrolled_stu_ids]
            query = query.filter(StudentProfile.id.in_(allowed_ids))
        elif current_user.department_id:
            query = query.filter(StudentProfile.department_id == current_user.department_id)

    elif current_user.role == "hod":
        if current_user.department_id:
            query = query.filter(StudentProfile.department_id == current_user.department_id)

    # Super Admin can filter by department_id if requested
    if department_id and department_id.strip():
        if current_user.role == "super_admin" or current_user.department_id == department_id:
            query = query.filter(StudentProfile.department_id == department_id.strip())

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter(
            func.lower(User.full_name).like(term) |
            func.lower(StudentProfile.roll_number).like(term) |
            func.lower(User.email).like(term)
        )

    students = query.all()
    all_assessments = [evaluate_student_risk_assessment(s.id, db) for s in students]

    # Calculate summary metrics across the full authorized eligible cohort
    summary = {
        "total_eligible": len(all_assessments),
        "assessed_count": sum(1 for a in all_assessments if a["overall_risk_score"] is not None),
        "critical_count": sum(1 for a in all_assessments if a["risk_category"] == "CRITICAL"),
        "very_high_count": sum(1 for a in all_assessments if a["risk_category"] == "VERY_HIGH"),
        "high_count": sum(1 for a in all_assessments if a["risk_category"] == "HIGH"),
        "moderate_count": sum(1 for a in all_assessments if a["risk_category"] == "MODERATE"),
        "low_count": sum(1 for a in all_assessments if a["risk_category"] == "LOW"),
        "insufficient_data_count": sum(1 for a in all_assessments if a["risk_category"] == "INSUFFICIENT_DATA"),
        "provisional_count": sum(1 for a in all_assessments if a.get("is_provisional")),
        "in_intervention_count": sum(1 for a in all_assessments if a.get("intervention_status") in ["in_intervention", "active"])
    }

    # Apply in-memory category & status filters
    filtered = all_assessments
    if risk_category and risk_category.strip().upper() not in ["ALL", ""]:
        filtered = [a for a in filtered if a["risk_category"].upper() == risk_category.strip().upper()]

    if completeness and completeness.strip():
        c_lower = completeness.lower().strip()
        if c_lower == "complete":
            filtered = [a for a in filtered if not a.get("is_provisional") and a["overall_risk_score"] is not None]
        elif c_lower == "provisional":
            filtered = [a for a in filtered if a.get("is_provisional") and a["overall_risk_score"] is not None]
        elif c_lower == "insufficient":
            filtered = [a for a in filtered if a["risk_category"] == "INSUFFICIENT_DATA"]

    if intervention_status and intervention_status.strip().lower() not in ["all", ""]:
        stat_filter = intervention_status.strip().lower()
        filtered = [a for a in filtered if a.get("intervention_status", "").lower() == stat_filter]

    # Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by == "name":
        filtered.sort(key=lambda a: a.get("student_name", "").lower(), reverse=reverse)
    elif sort_by == "attendance":
        filtered.sort(key=lambda a: (a.get("attendance_pct") is not None, a.get("attendance_pct") or 0.0), reverse=reverse)
    elif sort_by == "academic":
        filtered.sort(key=lambda a: (a.get("academic_avg") is not None, a.get("academic_avg") or 0.0), reverse=reverse)
    else:  # default: risk_score
        # Put None scores at end when descending, or at start when ascending
        filtered.sort(key=lambda a: (a.get("overall_risk_score") is not None, a.get("overall_risk_score") or -1.0), reverse=reverse)

    total_count = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    items = filtered[start:end]
    total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 1

    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "summary": summary
    }


@router.get("/risk-students/{student_id}")
def get_risk_student_detail(
    student_id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    stu = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not stu:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Scoping check
    if current_user.role == "faculty":
        fac_courses = db.query(FacultyAssignment.course_id).filter(
            FacultyAssignment.faculty_id == current_user.id
        ).all()
        c_ids = [fc[0] for fc in fac_courses]
        if c_ids:
            enrolled = db.query(CourseEnrollment).filter(
                CourseEnrollment.course_id.in_(c_ids),
                CourseEnrollment.student_id == student_id,
                CourseEnrollment.status == "active"
            ).first()
            if not enrolled and stu.department_id != current_user.department_id:
                raise HTTPException(status_code=403, detail="Student is outside authorized teaching scope.")
    elif current_user.role == "hod":
        if current_user.department_id and stu.department_id != current_user.department_id:
            raise HTTPException(status_code=403, detail="Student is outside authorized departmental scope.")

    return evaluate_student_risk_assessment(student_id, db)


@router.get("/risk-ai-insights/{student_id}")
def get_student_risk_ai_insights(
    student_id: str,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    from app.services.gemini_service import generate_ai_intervention_strategy, is_gemini_available
    assessment = get_risk_student_detail(student_id, current_user, db)
    
    dept_name = assessment.get("department_name", "General")
    strategy = None
    if is_gemini_available():
        strategy = generate_ai_intervention_strategy(
            student_name=assessment["student_name"],
            roll_number=assessment["roll_number"],
            department=dept_name,
            risk_score=assessment.get("overall_risk_score"),
            risk_category=assessment["risk_category"],
            evidence_points=assessment.get("evidence", [])
        )
    
    if not strategy:
        recs = assessment.get("recommendations", ["Schedule academic counseling session."])
        strategy = {
            "student_name": assessment["student_name"],
            "risk_category": assessment["risk_category"],
            "ai_strategy": f"Recommended Action Plan:\n1. {recs[0] if recs else 'Consult academic advisor.'}\n2. Review attendance and homework submission timeline.\n3. Establish bi-weekly check-in with assigned course faculty.",
            "provider": "Apex Rule-Based Advisory Engine (Fallback)"
        }
    return strategy


@router.get("/risk-summary")
def get_risk_summary(
    department_id: Optional[str] = Query(None),
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    res = get_risk_students(
        department_id=department_id,
        page=1,
        page_size=1,
        current_user=current_user,
        db=db
    )
    return res["summary"]


@router.post("/risk-recalculate")
def recalculate_risk(
    student_id: Optional[str] = None,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    if student_id:
        res = evaluate_student_risk_assessment(student_id, db)
        return {"message": f"Risk assessment recalculated for {res.get('student_name', student_id)}.", "assessment": res}
    else:
        from app.services.sample_data import ensure_complete_risk_dataset
        ensure_complete_risk_dataset(db)
        return {"message": "Institution-wide risk assessments refreshed successfully."}


# ----------------- RISK ALERTS -----------------
@router.get("/risk-alerts")
def get_risk_alerts(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(RiskAlert).join(StudentProfile, RiskAlert.student_id == StudentProfile.id)

    # Scoping by role
    if current_user.role in ["faculty", "hod"] and current_user.department_id:
        query = query.filter(StudentProfile.department_id == current_user.department_id)

    if status:
        query = query.filter(RiskAlert.status == status)
    if risk_level:
        query = query.filter(RiskAlert.risk_level == risk_level)

    alerts = query.order_by(RiskAlert.detected_at.desc()).all()
    results = []
    for a in alerts:
        stu = a.student
        dept = stu.student_profile.department if (stu and stu.student_profile) else None
        results.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": stu.full_name if stu else "Student",
            "roll_number": stu.student_profile.roll_number if (stu and stu.student_profile) else "",
            "department_name": dept.name if dept else None,
            "risk_level": a.risk_level,
            "risk_category": a.risk_category,
            "priority": a.priority,
            "evidence": json.loads(a.evidence_json or "[]"),
            "recommended_action": a.recommended_action,
            "assigned_reviewer_id": a.assigned_reviewer_id,
            "assigned_reviewer_name": a.reviewer.full_name if a.reviewer else None,
            "follow_up_deadline": a.follow_up_deadline,
            "status": a.status,
            "review_notes": a.review_notes,
            "detected_at": a.detected_at.isoformat()
        })
    return results

@router.put("/risk-alerts/{alert_id}/status")
def update_risk_alert_status(
    alert_id: str,
    payload: RiskAlertStatusUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Risk alert not found.")

    alert.status = payload.status
    if payload.review_notes:
        alert.review_notes = payload.review_notes
    if payload.assigned_reviewer_id:
        alert.assigned_reviewer_id = payload.assigned_reviewer_id

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="RISK_ALERT_STATUS_UPDATE",
        resource_type="risk_alert",
        resource_id=alert.id,
        details=f"Alert status set to {payload.status}. Notes: {payload.review_notes}"
    ))
    db.commit()
    return {"message": "Risk alert status updated successfully."}

# ----------------- INTERVENTIONS -----------------
@router.get("/interventions")
def get_interventions(
    status: Optional[str] = None,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(Intervention).join(StudentProfile, Intervention.student_id == StudentProfile.id)
    if current_user.role in ["faculty", "hod"] and current_user.department_id:
        query = query.filter(StudentProfile.department_id == current_user.department_id)

    if status:
        query = query.filter(Intervention.status == status)

    interventions = query.order_by(Intervention.created_at.desc()).all()
    results = []
    for i in interventions:
        stu = i.student
        results.append({
            "id": i.id,
            "student_id": i.student_id,
            "student_name": stu.full_name if stu else "Student",
            "roll_number": stu.student_profile.roll_number if (stu and stu.student_profile) else "",
            "risk_alert_id": i.risk_alert_id,
            "title": i.title,
            "category": i.category,
            "goal": i.goal,
            "status": i.status,
            "responsible_staff_id": i.responsible_staff_id,
            "responsible_staff_name": i.responsible_staff.full_name if i.responsible_staff else None,
            "due_date": i.due_date,
            "follow_up_date": i.follow_up_date,
            "actions_taken": i.actions_taken,
            "observations": i.observations,
            "outcome": i.outcome,
            "created_at": i.created_at.isoformat(),
            "updated_at": i.updated_at.isoformat()
        })
    return results

@router.post("/interventions")
def create_intervention(
    payload: InterventionCreate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    interv = Intervention(
        student_id=payload.student_id,
        risk_alert_id=payload.risk_alert_id,
        title=payload.title,
        category=payload.category,
        goal=payload.goal,
        status="active",
        responsible_staff_id=payload.responsible_staff_id or current_user.id,
        due_date=payload.due_date,
        follow_up_date=payload.follow_up_date
    )
    db.add(interv)

    if payload.risk_alert_id:
        alt = db.query(RiskAlert).filter(RiskAlert.id == payload.risk_alert_id).first()
        if alt:
            alt.status = "in_intervention"

    db.add(StudentJourneyEvent(
        student_id=payload.student_id,
        event_type="intervention",
        title=f"Support Intervention Initiated: {payload.category}",
        description=f"Action plan established: {payload.goal}",
        severity="warning"
    ))

    db.commit()
    db.refresh(interv)
    return {"message": "Intervention successfully launched.", "id": interv.id}

@router.put("/interventions/{intervention_id}")
def update_intervention(
    intervention_id: str,
    payload: InterventionUpdate,
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    interv = db.query(Intervention).filter(Intervention.id == intervention_id).first()
    if not interv:
        raise HTTPException(status_code=404, detail="Intervention not found.")

    if payload.status:
        interv.status = payload.status
    if payload.actions_taken:
        interv.actions_taken = payload.actions_taken
    if payload.observations:
        interv.observations = payload.observations
    if payload.outcome:
        interv.outcome = payload.outcome
    if payload.follow_up_date:
        interv.follow_up_date = payload.follow_up_date

    if payload.status == "completed":
        db.add(StudentJourneyEvent(
            student_id=interv.student_id,
            event_type="intervention",
            title=f"Intervention Completed: {interv.title}",
            description=f"Outcome: {interv.outcome or 'Successfully reviewed'}.",
            severity="success"
        ))

    db.commit()
    return {"message": "Intervention updated successfully."}

# ----------------- STUDENT JOURNEY -----------------
@router.get("/journey/{student_id}")
def get_student_journey(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Students can only view their own journey.")

    events = db.query(StudentJourneyEvent).filter(
        StudentJourneyEvent.student_id == student_id
    ).order_by(StudentJourneyEvent.timestamp.desc()).all()

    return [
        {
            "id": e.id,
            "student_id": e.student_id,
            "event_type": e.event_type,
            "title": e.title,
            "description": e.description,
            "timestamp": e.timestamp.isoformat(),
            "severity": e.severity
        }
        for e in events
    ]

# ----------------- PLACEMENT & SKILLS -----------------
@router.get("/placement/{student_id}")
def get_placement_readiness(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Students can only view their own placement readiness.")

    rec = db.query(SkillPlacementProfile).filter(SkillPlacementProfile.student_id == student_id).first()
    if not rec:
        # Default starter profile
        return {
            "student_id": student_id,
            "technical_skills": [{"skill": "Programming Fundamentals", "level": "Intermediate", "verified": True}],
            "soft_skills": [{"skill": "Communication", "rating": "4/5"}],
            "coding_score": 70.0,
            "aptitude_score": 70.0,
            "mock_interview_score": 65.0,
            "certifications_count": 0,
            "resume_score": 70.0,
            "readiness_percentage": 68.0,
            "missing_evidence": ["Mock interview evaluation pending"],
            "recommendations": ["Upload verified resume and attempt coding assessment."]
        }

    return {
        "student_id": student_id,
        "technical_skills": json.loads(rec.technical_skills_json or "[]"),
        "soft_skills": json.loads(rec.soft_skills_json or "[]"),
        "coding_score": rec.coding_score,
        "aptitude_score": rec.aptitude_score,
        "mock_interview_score": rec.mock_interview_score,
        "certifications_count": rec.certifications_count,
        "resume_score": rec.resume_score,
        "readiness_percentage": rec.readiness_percentage,
        "missing_evidence": json.loads(rec.missing_evidence_json or "[]"),
        "recommendations": json.loads(rec.recommendations_json or "[]")
    }

# ----------------- STUDENT SEGMENTATION -----------------
@router.get("/segmentation")
def get_student_segmentation(
    current_user: User = Depends(require_staff),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile)
    if current_user.role in ["faculty", "hod"] and current_user.department_id:
        query = query.filter(StudentProfile.department_id == current_user.department_id)
    students = query.all()

    high_achievers = []
    attendance_concerns = []
    academic_support_needed = []
    placement_ready = []

    for s in students:
        # Fetch attendance pct
        att_rec = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == s.id).all()
        att_pct = (sum(1 for a in att_rec if a.status in ["present", "late"]) / len(att_rec) * 100) if att_rec else None

        item = {
            "id": s.id,
            "roll_number": s.roll_number,
            "name": s.user.full_name if s.user else "",
            "cgpa": s.cgpa,
            "attendance_pct": round(att_pct, 1) if att_pct is not None else None,
            "placement_status": s.placement_status
        }

        if s.cgpa >= 8.5:
            high_achievers.append(item)
        if att_pct is not None and att_pct < 75.0:
            attendance_concerns.append(item)
        if s.cgpa < 6.5:
            academic_support_needed.append(item)
        if s.placement_status in ["Ready", "Placed"]:
            placement_ready.append(item)

    return {
        "total_cohort_count": len(students),
        "segments": {
            "high_achievers": {"count": len(high_achievers), "students": high_achievers[:10]},
            "attendance_concerns": {"count": len(attendance_concerns), "students": attendance_concerns[:10]},
            "academic_support_needed": {"count": len(academic_support_needed), "students": academic_support_needed[:10]},
            "placement_ready": {"count": len(placement_ready), "students": placement_ready[:10]}
        }
    }

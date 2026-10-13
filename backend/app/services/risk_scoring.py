from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, StudentProfile, Department
from app.models.academic import AttendanceRecord, AssessmentGrade, CourseEnrollment, Assignment, AssignmentSubmission
from app.models.analytics import RiskAlert, Intervention

# Standard default configurable weights (Sum = 1.0 / 100%)
DEFAULT_RISK_WEIGHTS = {
    "attendance": 0.30,
    "academic": 0.35,
    "assignment": 0.20,
    "trend": 0.10,
    "engagement": 0.05
}

# Standard configurable risk thresholds
DEFAULT_THRESHOLDS = {
    "min_attendance": 75.0,
    "academic_warning": 60.0,
    "critical_academic": 50.0
}

def calculate_attendance_risk(attendance_pct: Optional[float], consecutive_absences: int = 0) -> Optional[float]:
    """
    Normalizes attendance percentage to a 0-100 risk score (higher score = greater risk).
    Continuous scoring within ranges:
      Attendance >= 90%: Low risk (0 - 15)
      Attendance 80 - 89.99%: Moderate risk (15 - 35)
      Attendance 75 - 79.99%: Elevated risk (35 - 55)
      Attendance < 75%: High to Critical risk (55 - 100)
    """
    if attendance_pct is None:
        return None

    pct = max(0.0, min(100.0, float(attendance_pct)))

    if pct >= 90.0:
        # 100% -> 0 risk, 90% -> 15 risk
        base_risk = 15.0 * (100.0 - pct) / 10.0
    elif pct >= 80.0:
        # 90% -> 15 risk, 80% -> 35 risk
        base_risk = 15.0 + 20.0 * (90.0 - pct) / 10.0
    elif pct >= 75.0:
        # 80% -> 35 risk, 75% -> 55 risk
        base_risk = 35.0 + 20.0 * (80.0 - pct) / 5.0
    elif pct >= 50.0:
        # 75% -> 55 risk, 50% -> 85 risk
        base_risk = 55.0 + 30.0 * (75.0 - pct) / 25.0
    else:
        # Below 50% -> 85 to 100 risk
        base_risk = 85.0 + 15.0 * (50.0 - pct) / 50.0

    # Add penalty for consecutive absences
    if consecutive_absences >= 3:
        penalty = min(15.0, consecutive_absences * 3.0)
        base_risk += penalty

    return round(max(0.0, min(100.0, base_risk)), 1)


def calculate_academic_risk(academic_avg: Optional[float]) -> Optional[float]:
    """
    Normalizes academic percentage average to a 0-100 risk score.
    Continuous scoring within ranges:
      Average >= 80%: Low academic risk (0 - 15)
      Average 65 - 79.99%: Moderate academic risk (15 - 35)
      Average 50 - 64.99%: High academic risk (35 - 65)
      Average < 50%: Very high / Critical academic risk (65 - 100)
    """
    if academic_avg is None:
        return None

    avg = max(0.0, min(100.0, float(academic_avg)))

    if avg >= 80.0:
        # 100% -> 0 risk, 80% -> 15 risk
        risk = 15.0 * (100.0 - avg) / 20.0
    elif avg >= 65.0:
        # 80% -> 15 risk, 65% -> 35 risk
        risk = 15.0 + 20.0 * (80.0 - avg) / 15.0
    elif avg >= 50.0:
        # 65% -> 35 risk, 50% -> 65 risk
        risk = 35.0 + 30.0 * (65.0 - avg) / 15.0
    elif avg >= 30.0:
        # 50% -> 65 risk, 30% -> 85 risk
        risk = 65.0 + 20.0 * (50.0 - avg) / 20.0
    else:
        # < 30% -> 85 to 100 risk
        risk = 85.0 + 15.0 * (30.0 - avg) / 30.0

    return round(max(0.0, min(100.0, risk)), 1)


def calculate_assignment_risk(total_due: int, submitted_count: int, overdue_count: int) -> Optional[float]:
    """
    Calculates assignment completion risk (0-100) based on due assessments.
    Returns None if no assignments have reached their deadline.
    """
    if total_due == 0:
        return None

    completion_pct = (submitted_count / total_due) * 100.0

    if completion_pct >= 95.0:
        base_risk = 0.0
    elif completion_pct >= 80.0:
        base_risk = 20.0 * (95.0 - completion_pct) / 15.0
    elif completion_pct >= 50.0:
        base_risk = 20.0 + 35.0 * (80.0 - completion_pct) / 30.0
    else:
        base_risk = 55.0 + 45.0 * (50.0 - completion_pct) / 50.0

    # Overdue penalty
    if overdue_count >= 3:
        base_risk = max(base_risk, 75.0)
    elif overdue_count > 0:
        base_risk = max(base_risk, 30.0 + (overdue_count * 10.0))

    return round(max(0.0, min(100.0, base_risk)), 1)


def calculate_trend_risk(grades_chronological: List[float]) -> Optional[float]:
    """
    Calculates performance trend risk based on historical assessment grades.
    Requires at least 2 assessment grades; returns None if insufficient historical data.
    """
    if len(grades_chronological) < 2:
        return None

    # Compare first half vs second half or earlier vs latest
    mid = len(grades_chronological) // 2
    early_avg = sum(grades_chronological[:mid]) / mid
    recent_avg = sum(grades_chronological[mid:]) / (len(grades_chronological) - mid)

    delta = recent_avg - early_avg # Positive means improvement, negative means decline

    if delta >= 10.0:
        # Significant improvement -> very low risk
        return 5.0
    elif delta >= 2.0:
        # Modest improvement -> low risk
        return 15.0
    elif delta >= -3.0:
        # Stable performance -> moderate-low risk
        return 25.0
    elif delta >= -10.0:
        # Moderate decline -> elevated risk
        return 50.0 + abs(delta + 3.0) * 2.0
    else:
        # Severe decline (drop > 10%) -> high risk
        return round(min(100.0, 70.0 + abs(delta + 10.0) * 1.5), 1)


def calculate_engagement_risk(lms_activity_pct: Optional[float]) -> Optional[float]:
    """
    Calculates engagement risk if LMS/activity tracking is available.
    Returns None if no activity data exists.
    """
    if lms_activity_pct is None:
        return None
    val = max(0.0, min(100.0, float(lms_activity_pct)))
    # Invert: high activity -> low risk
    return round(100.0 - val, 1)


def classify_risk_category(score: Optional[float]) -> str:
    """
    Assigns standard risk categories:
      0–19.99: LOW
      20–39.99: MODERATE
      40–59.99: HIGH
      60–79.99: VERY_HIGH
      80–100: CRITICAL
      null: INSUFFICIENT_DATA
    """
    if score is None:
        return "INSUFFICIENT_DATA"
    if score < 20.0:
        return "LOW"
    elif score < 40.0:
        return "MODERATE"
    elif score < 60.0:
        return "HIGH"
    elif score < 80.0:
        return "VERY_HIGH"
    else:
        return "CRITICAL"


def evaluate_student_risk_assessment(
    student_id: str,
    db: Session,
    weights: Optional[Dict[str, float]] = None,
    thresholds: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Authoritative calculation of explainable student risk for a single student.
    Fetches actual academic records, attendance records, assignment submissions,
    and historical assessments from the database.
    """
    if weights is None:
        weights = DEFAULT_RISK_WEIGHTS.copy()
    if thresholds is None:
        thresholds = DEFAULT_THRESHOLDS.copy()

    student_profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    user = db.query(User).filter(User.id == student_id).first()
    if not user or not student_profile:
        return {
            "student_id": student_id,
            "overall_risk_score": None,
            "risk_percentage": None,
            "risk_category": "INSUFFICIENT_DATA",
            "data_completeness": 0.0,
            "is_provisional": True,
            "evidence": ["Student profile record not found."],
            "recommendations": ["Ensure valid student profile is created."]
        }

    evidence: List[str] = []
    recommendations: List[str] = []

    # 1. ATTENDANCE COMPONENT
    att_records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).order_by(AttendanceRecord.date.asc()).all()
    attendance_pct: Optional[float] = None
    consecutive_absences = 0
    att_risk: Optional[float] = None

    if att_records:
        applicable_records = [a for a in att_records if a.status != "excused"]
        if applicable_records:
            present_count = sum(1 for a in applicable_records if a.status in ["present", "late"])
            attendance_pct = (present_count / len(applicable_records)) * 100.0

            # Calculate consecutive absences from most recent records backwards
            cur_consec = 0
            for a in reversed(att_records):
                if a.status == "absent":
                    cur_consec += 1
                else:
                    break
            consecutive_absences = cur_consec

            att_risk = calculate_attendance_risk(attendance_pct, consecutive_absences)

            if attendance_pct < thresholds.get("min_attendance", 75.0):
                evidence.append(f"Attendance below threshold: {attendance_pct:.1f}% across {len(applicable_records)} sessions (minimum required: {thresholds.get('min_attendance', 75.0):.0f}%). Attendance risk contribution: {att_risk}/100.")
                recommendations.append("Initiate attendance recovery counseling and verify transportation/health barriers.")
            elif attendance_pct >= 90.0:
                evidence.append(f"Strong attendance record: {attendance_pct:.1f}% present across {len(applicable_records)} sessions.")
            else:
                evidence.append(f"Moderate attendance rate: {attendance_pct:.1f}%. Attendance risk contribution: {att_risk}/100.")

            if consecutive_absences >= 3:
                evidence.append(f"Alert: {consecutive_absences} consecutive unexcused absences noted in recent sessions.")
                recommendations.append(f"Immediate student contact required for {consecutive_absences} consecutive missed classes.")
    else:
        evidence.append("Attendance records: No attendance sessions logged yet.")

    # 2. ACADEMIC PERFORMANCE COMPONENT
    grades = db.query(AssessmentGrade).filter(AssessmentGrade.student_id == student_id).order_by(AssessmentGrade.exam_date.asc(), AssessmentGrade.id.asc()).all()
    academic_avg: Optional[float] = None
    academic_risk: Optional[float] = None
    grade_percentages: List[float] = []

    if grades:
        for g in grades:
            if g.max_marks and g.max_marks > 0:
                pct = (g.marks_obtained / g.max_marks) * 100.0
                grade_percentages.append(pct)
        if grade_percentages:
            academic_avg = sum(grade_percentages) / len(grade_percentages)
    elif student_profile.cgpa and student_profile.cgpa > 0:
        # Standard 10-point CGPA to percentage conversion fallback
        academic_avg = student_profile.cgpa * 10.0

    if academic_avg is not None:
        academic_risk = calculate_academic_risk(academic_avg)
        if academic_avg < thresholds.get("critical_academic", 50.0):
            evidence.append(f"Critical academic performance: assessment average is {academic_avg:.1f}% (below critical benchmark {thresholds.get('critical_academic', 50.0):.0f}%). Academic risk contribution: {academic_risk}/100.")
            recommendations.append("Assign structured faculty tutoring and syllabus remedial sessions.")
        elif academic_avg < thresholds.get("academic_warning", 60.0):
            evidence.append(f"Academic warning: assessment average is {academic_avg:.1f}% (below standard {thresholds.get('academic_warning', 60.0):.0f}%). Academic risk contribution: {academic_risk}/100.")
            recommendations.append("Recommend peer study group and office hour consultations.")
        elif academic_avg >= 80.0:
            evidence.append(f"Strong academic standing: assessment average is {academic_avg:.1f}%. Low academic risk.")
        else:
            evidence.append(f"Satisfactory academic performance: assessment average is {academic_avg:.1f}%. Academic risk: {academic_risk}/100.")
    else:
        evidence.append("Academic assessments: No recorded marks or CGPA available.")

    # 3. ASSIGNMENT COMPLETION COMPONENT
    now = datetime.now(timezone.utc)
    # Find courses student is enrolled in
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == student_id,
        CourseEnrollment.status == "active"
    ).all()
    enrolled_course_ids = [e.course_id for e in enrollments]

    total_due_assignments = 0
    submitted_assignments_count = 0
    overdue_assignments_count = 0
    asg_completion_pct: Optional[float] = None
    asg_risk: Optional[float] = None

    if enrolled_course_ids:
        due_assignments = db.query(Assignment).filter(
            Assignment.course_id.in_(enrolled_course_ids),
            Assignment.due_date <= now
        ).all()
        total_due_assignments = len(due_assignments)

        if total_due_assignments > 0:
            due_asg_ids = [a.id for a in due_assignments]
            submissions = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id.in_(due_asg_ids),
                AssignmentSubmission.student_id == student_id,
                AssignmentSubmission.status.in_(["submitted", "graded"])
            ).all()
            submitted_assignments_count = len(submissions)
            overdue_assignments_count = max(0, total_due_assignments - submitted_assignments_count)
            asg_completion_pct = (submitted_assignments_count / total_due_assignments) * 100.0
            asg_risk = calculate_assignment_risk(total_due_assignments, submitted_assignments_count, overdue_assignments_count)

            if overdue_assignments_count > 0:
                evidence.append(f"Assignment completion: {submitted_assignments_count}/{total_due_assignments} submitted ({asg_completion_pct:.1f}%). {overdue_assignments_count} overdue assignment(s). Assignment risk contribution: {asg_risk}/100.")
                recommendations.append("Establish assignment catch-up timeline with designated course faculty.")
            else:
                evidence.append(f"All scheduled assignments completed on time ({total_due_assignments}/{total_due_assignments} submitted).")
    else:
        # If no enrollments exist, check direct submissions
        pass

    # 4. PERFORMANCE TREND COMPONENT
    trend_risk: Optional[float] = None
    if len(grade_percentages) >= 2:
        trend_risk = calculate_trend_risk(grade_percentages)
        if trend_risk >= 60.0:
            evidence.append(f"Declining performance trend observed across consecutive assessments. Trend risk contribution: {trend_risk}/100.")
            recommendations.append("Conduct comprehensive progress check-in to reverse declining assessment trajectory.")
        elif trend_risk <= 20.0:
            evidence.append("Performance trend: Stable or improving marks across chronological assessments.")
    else:
        # Insufficient historical assessments for trend
        trend_risk = None

    # 5. ENGAGEMENT COMPONENT
    engagement_risk: Optional[float] = None
    # If LMS tracking is implemented or available, fetch it; otherwise None
    # We do not invent engagement data

    # 6. COMPONENT AGGREGATION & WEIGHT RENORMALIZATION
    components = {
        "attendance": att_risk,
        "academic": academic_risk,
        "assignment": asg_risk,
        "trend": trend_risk,
        "engagement": engagement_risk
    }

    available_components: Dict[str, float] = {}
    missing_components: List[str] = []
    total_configured_weight = sum(weights.values())
    available_weight_sum = 0.0

    for key, value in components.items():
        if value is not None:
            available_components[key] = value
            available_weight_sum += weights.get(key, 0.0)
        else:
            missing_components.append(key)

    data_completeness = round((available_weight_sum / total_configured_weight) * 100.0, 1) if total_configured_weight > 0 else 0.0

    # Minimum data requirement: At least attendance or academic performance must be available,
    # and available weight sum must be at least 0.30
    has_core_data = (att_risk is not None or academic_risk is not None) and available_weight_sum >= 0.30

    if not has_core_data or available_weight_sum == 0.0:
        overall_risk_score = None
        risk_percentage = None
        risk_category = "INSUFFICIENT_DATA"
        is_provisional = True
        evidence.append("Insufficient data: Academic and attendance records are not sufficiently populated to establish a reliable risk assessment.")
        if not recommendations:
            recommendations.append("Record attendance and assessment marks to activate risk analytics.")
    else:
        # Renormalize weights across available components
        weighted_sum = 0.0
        for key, value in available_components.items():
            renormalized_weight = weights[key] / available_weight_sum
            weighted_sum += value * renormalized_weight

        overall_risk_score = round(max(0.0, min(100.0, weighted_sum)), 1)
        risk_percentage = overall_risk_score
        risk_category = classify_risk_category(overall_risk_score)
        is_provisional = len(missing_components) > 0 or data_completeness < 100.0

        if is_provisional:
            evidence.append(f"Score status: Provisional assessment with {data_completeness:.1f}% data completeness ({', '.join(missing_components)} pending).")
        else:
            evidence.append("Score status: Complete evaluation across all institutional assessment indicators.")

    # 7. INTERVENTION STATUS CHECK
    active_intervention = db.query(Intervention).filter(
        Intervention.student_id == student_id,
        Intervention.status.in_(["pending", "active", "follow_up_required"])
    ).first()
    
    existing_alert = db.query(RiskAlert).filter(
        RiskAlert.student_id == student_id,
        RiskAlert.status.in_(["open", "reviewed", "in_intervention"])
    ).first()

    intervention_status = "none"
    if active_intervention:
        intervention_status = "in_intervention"
    elif existing_alert:
        intervention_status = existing_alert.status

    dept = student_profile.department if student_profile else None

    return {
        "student_id": student_id,
        "student_name": user.full_name,
        "roll_number": student_profile.roll_number if student_profile else "",
        "email": user.email,
        "department_id": student_profile.department_id if student_profile else None,
        "department_name": dept.name if dept else "General Department",
        "semester": student_profile.semester if student_profile else 1,
        "overall_risk_score": overall_risk_score,
        "risk_percentage": risk_percentage,
        "risk_category": risk_category,
        "attendance_pct": round(attendance_pct, 1) if attendance_pct is not None else None,
        "academic_avg": round(academic_avg, 1) if academic_avg is not None else None,
        "assignment_completion_pct": round(asg_completion_pct, 1) if asg_completion_pct is not None else None,
        "component_scores": {
            "attendance": att_risk,
            "academic": academic_risk,
            "assignment": asg_risk,
            "trend": trend_risk,
            "engagement": engagement_risk
        },
        "component_weights": weights,
        "data_completeness": data_completeness,
        "is_provisional": is_provisional,
        "missing_components": missing_components,
        "available_components": list(available_components.keys()),
        "evidence": evidence,
        "recommendations": recommendations,
        "intervention_status": intervention_status,
        "active_intervention_id": active_intervention.id if active_intervention else None,
        "risk_alert_id": existing_alert.id if existing_alert else None,
        "last_calculated_at": datetime.now(timezone.utc).isoformat()
    }


def batch_evaluate_students_risk(
    student_ids: List[str],
    db: Session,
    weights: Optional[Dict[str, float]] = None,
    thresholds: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """
    Evaluates risk for a list of students.
    """
    results = []
    for sid in student_ids:
        assessment = evaluate_student_risk_assessment(sid, db, weights=weights, thresholds=thresholds)
        results.append(assessment)
    return results

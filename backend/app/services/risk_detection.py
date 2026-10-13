from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta

def evaluate_student_risk(
    student_id: str,
    attendance_pct: Optional[float],
    recent_grades: List[float],
    missing_assignments_count: int,
    consecutive_absences: int = 0,
    min_attendance_threshold: float = 75.0,
    academic_warning_threshold: float = 60.0
) -> Optional[Dict[str, Any]]:
    """
    Evaluates explainable indicators to determine if a risk alert should be generated.
    Returns None if student is in good standing.
    """
    evidence: List[str] = []
    risk_level = "low"
    risk_category = "academic_performance"
    priority = "medium"

    # Attendance checks
    if attendance_pct is not None:
        if attendance_pct < 65.0:
            evidence.append(f"Severe attendance deficiency: currently at {attendance_pct:.1f}% (required minimum: {min_attendance_threshold:.1f}%).")
            risk_level = "high"
            risk_category = "severe_attendance_drop"
            priority = "high"
        elif attendance_pct < min_attendance_threshold:
            evidence.append(f"Attendance below institutional standard: {attendance_pct:.1f}% (required minimum: {min_attendance_threshold:.1f}%).")
            if risk_level != "high":
                risk_level = "medium"
                risk_category = "attendance_shortage"

    if consecutive_absences >= 3:
        evidence.append(f"Consecutive unexcused absences recorded: {consecutive_absences} consecutive sessions.")
        if risk_level != "critical":
            risk_level = "high"
            priority = "high"

    # Missing assignments check
    if missing_assignments_count >= 3:
        evidence.append(f"Multiple overdue assignment submissions ({missing_assignments_count} pending submissions).")
        if risk_level == "low":
            risk_level = "medium"
            risk_category = "assignment_delinquency"
    elif missing_assignments_count > 0:
        evidence.append(f"{missing_assignments_count} unsubmitted assignment deadline(s) noted.")

    # Academic grades check
    if recent_grades:
        avg_grade = sum(recent_grades) / len(recent_grades)
        if avg_grade < 50.0:
            evidence.append(f"Critical academic performance average: {avg_grade:.1f}% across recent assessments.")
            risk_level = "critical" if risk_level == "high" else "high"
            priority = "high"
            risk_category = "academic_decline"
        elif avg_grade < academic_warning_threshold:
            evidence.append(f"Academic average below passing benchmark: {avg_grade:.1f}% (standard: {academic_warning_threshold:.1f}%).")
            if risk_level == "low":
                risk_level = "medium"
                risk_category = "academic_improvement_needed"

    if not evidence:
        return None

    # Derive recommended action
    if "attendance" in risk_category:
        rec = "Initiate attendance counseling and notify academic advisor."
    elif "academic" in risk_category:
        rec = "Assign peer tutoring sessions and schedule faculty consultation."
    elif "assignment" in risk_category:
        rec = "Provide assignment submission grace plan and academic coordinator review."
    else:
        rec = "Conduct comprehensive academic progress check-in."

    deadline = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")

    return {
        "student_id": student_id,
        "risk_level": risk_level,
        "risk_category": risk_category,
        "priority": priority,
        "evidence": evidence,
        "recommended_action": rec,
        "follow_up_deadline": deadline,
        "status": "open",
        "detected_at": datetime.now(timezone.utc).isoformat()
    }

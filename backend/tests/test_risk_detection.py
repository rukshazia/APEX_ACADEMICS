import pytest
from app.services.risk_detection import evaluate_student_risk

def test_student_in_good_standing():
    alert = evaluate_student_risk(
        student_id="test-stu-good",
        attendance_pct=92.0,
        recent_grades=[85.0, 90.0],
        missing_assignments_count=0,
        consecutive_absences=0
    )
    assert alert is None

def test_attendance_drop_trigger():
    alert = evaluate_student_risk(
        student_id="test-stu-att",
        attendance_pct=68.5,
        recent_grades=[75.0],
        missing_assignments_count=0
    )
    assert alert is not None
    assert alert["risk_level"] in ["medium", "high"]
    assert any("Attendance below" in e or "attendance" in e.lower() for e in alert["evidence"])

def test_critical_risk_multiple_indicators():
    alert = evaluate_student_risk(
        student_id="test-stu-crit",
        attendance_pct=52.0,
        recent_grades=[38.0, 44.0],
        missing_assignments_count=3,
        consecutive_absences=4
    )
    assert alert is not None
    assert alert["risk_level"] in ["high", "critical"]
    assert alert["priority"] == "high"
    assert len(alert["evidence"]) >= 3

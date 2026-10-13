import pytest
from app.services.scoring import calculate_student_success_score

def test_complete_data_score():
    result = calculate_student_success_score(
        academic_pct=85.0,
        attendance_pct=90.0,
        lms_activity_pct=80.0,
        extracurricular_pct=75.0,
        placement_readiness_pct=80.0,
        skills_feedback_pct=85.0
    )
    assert result["overall_score"] > 80.0
    assert result["data_completeness"] == 100.0
    assert result["is_provisional"] is False
    assert len(result["missing_components"]) == 0
    assert len(result["positive_factors"]) > 0

def test_missing_data_renormalization():
    # Only academic and attendance provided; others are None
    result = calculate_student_success_score(
        academic_pct=80.0,
        attendance_pct=90.0,
        lms_activity_pct=None,
        extracurricular_pct=None,
        placement_readiness_pct=None,
        skills_feedback_pct=None
    )
    # Available weights: academic (0.3) + attendance (0.2) = 0.5 (50% completeness)
    assert result["data_completeness"] == 50.0
    assert result["is_provisional"] is True
    assert "lms" in result["missing_components"]
    assert "placement" in result["missing_components"]
    # Check that missing data did NOT drag score down to zero:
    # 80 * (0.3/0.5) + 90 * (0.2/0.5) = 48 + 36 = 84.0
    assert result["overall_score"] == 84.0

def test_empty_data():
    result = calculate_student_success_score(
        academic_pct=None,
        attendance_pct=None
    )
    assert result["overall_score"] == 0.0
    assert result["data_completeness"] == 0.0
    assert result["is_provisional"] is True

def test_boundary_clamping():
    result = calculate_student_success_score(
        academic_pct=150.0, # out of range high
        attendance_pct=-20.0, # out of range low
        lms_activity_pct=50.0,
        extracurricular_pct=50.0,
        placement_readiness_pct=50.0,
        skills_feedback_pct=50.0
    )
    # Clamped: 100 for academic, 0 for attendance
    assert result["components"]["academic"] == 100.0
    assert result["components"]["attendance"] == 0.0
    assert 0.0 <= result["overall_score"] <= 100.0

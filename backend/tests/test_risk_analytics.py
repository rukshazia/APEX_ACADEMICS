import pytest
from app.services.risk_scoring import (
    calculate_attendance_risk,
    calculate_academic_risk,
    calculate_assignment_risk,
    calculate_trend_risk,
    calculate_engagement_risk,
    classify_risk_category,
    evaluate_student_risk_assessment,
    DEFAULT_RISK_WEIGHTS
)
from app.database import SessionLocal
from app.models.user import User

def test_attendance_risk_components():
    # Strong attendance (95%) -> Low risk (< 15)
    r_high = calculate_attendance_risk(95.0)
    assert r_high is not None
    assert r_high < 15.0

    # Minimum attendance standard (75%) -> around 55
    r_75 = calculate_attendance_risk(75.0)
    assert r_75 is not None
    assert 50.0 <= r_75 <= 60.0

    # Low attendance (40%) -> High to Critical risk (> 80)
    r_low = calculate_attendance_risk(40.0)
    assert r_low is not None
    assert r_low > 80.0

    # Consecutive absences adds risk penalty
    r_consec = calculate_attendance_risk(75.0, consecutive_absences=4)
    assert r_consec > r_75

    # Missing attendance -> None
    assert calculate_attendance_risk(None) is None


def test_academic_risk_components():
    # High score (90%) -> Low risk
    r_high = calculate_academic_risk(90.0)
    assert r_high is not None
    assert r_high < 15.0

    # Passing mark (60%) -> Moderate risk
    r_pass = calculate_academic_risk(60.0)
    assert r_pass is not None
    assert 35.0 <= r_pass <= 50.0

    # Failing mark (40%) -> Critical risk
    r_fail = calculate_academic_risk(40.0)
    assert r_fail is not None
    assert r_fail >= 70.0

    # Missing academic marks -> None
    assert calculate_academic_risk(None) is None


def test_assignment_risk():
    # 100% completed
    r_full = calculate_assignment_risk(5, 5, 0)
    assert r_full == 0.0

    # 3 overdue assignments
    r_overdue = calculate_assignment_risk(5, 2, 3)
    assert r_overdue >= 75.0

    # No assignments due yet
    assert calculate_assignment_risk(0, 0, 0) is None


def test_trend_risk():
    # Insufficient historical data (< 2 assessments) -> None
    assert calculate_trend_risk([85.0]) is None

    # Improving marks (60 -> 80) -> Low risk
    assert calculate_trend_risk([60.0, 80.0]) <= 15.0

    # Declining marks (80 -> 50) -> High risk
    assert calculate_trend_risk([80.0, 50.0]) >= 70.0


def test_risk_classification():
    assert classify_risk_category(10.0) == "LOW"
    assert classify_risk_category(28.5) == "MODERATE"
    assert classify_risk_category(52.0) == "HIGH"
    assert classify_risk_category(72.0) == "VERY_HIGH"
    assert classify_risk_category(88.0) == "CRITICAL"
    assert classify_risk_category(None) == "INSUFFICIENT_DATA"


def test_database_students_evaluation():
    db = SessionLocal()
    try:
        # Liam Chen (usr-stu-03) has low attendance and failing grades -> CRITICAL
        res_liam = evaluate_student_risk_assessment("usr-stu-03", db)
        assert res_liam["overall_risk_score"] is not None
        assert res_liam["risk_category"] == "CRITICAL"
        assert len(res_liam["evidence"]) > 0

        # Alex Rivera (usr-stu-01) has strong records -> LOW
        res_alex = evaluate_student_risk_assessment("usr-stu-01", db)
        assert res_alex["overall_risk_score"] is not None
        assert res_alex["risk_category"] == "LOW"

        # Aisha Khan (usr-stu-08) has no attendance or assessment records -> INSUFFICIENT_DATA
        res_aisha = evaluate_student_risk_assessment("usr-stu-08", db)
        assert res_aisha["overall_risk_score"] is None
        assert res_aisha["risk_category"] == "INSUFFICIENT_DATA"
    finally:
        db.close()


from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_role_authorization_and_scoping():
    # 1. Student Token
    res_stu = client.post("/api/v1/auth/login", json={"email": "student@campus.edu", "password": "Student@123"})
    assert res_stu.status_code == 200
    student_token = res_stu.json()["access_token"]

    # Student accessing institution-wide risk endpoint must receive 403 Forbidden
    resp_student = client.get(
        "/api/v1/analytics/risk-students",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert resp_student.status_code == 403

    # 2. Staff (Faculty) Token
    res_fac = client.post("/api/v1/auth/login", json={"email": "faculty@campus.edu", "password": "Faculty@123"})
    assert res_fac.status_code == 200
    faculty_token = res_fac.json()["access_token"]

    # Faculty accessing risk-students gets scoped list
    resp_faculty = client.get(
        "/api/v1/analytics/risk-students",
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert resp_faculty.status_code == 200
    fac_data = resp_faculty.json()
    assert "items" in fac_data
    assert "summary" in fac_data
    assert len(fac_data["items"]) > 0
    # Faculty only sees enrolled students in their CS courses
    assert all(item["department_id"] == "dept-cs" for item in fac_data["items"])

    # 3. Super Admin Token
    res_adm = client.post("/api/v1/auth/login", json={"email": "admin@campus.edu", "password": "Admin@123"})
    assert res_adm.status_code == 200
    admin_token = res_adm.json()["access_token"]

    # Super Admin sees students from all departments
    resp_admin = client.get(
        "/api/v1/analytics/risk-students",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp_admin.status_code == 200
    admin_data = resp_admin.json()
    assert admin_data["total_count"] >= 8
    dept_ids = {item["department_id"] for item in admin_data["items"] if item["department_id"]}
    assert len(dept_ids) > 1 # multiple departments covered


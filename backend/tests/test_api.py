from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_login_and_role_access():
    # 1. Student Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@campus.edu",
        "password": "Student@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Student accessing own profile
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["role"] == "student"

    # 3. Student trying to access admin settings -> should get 403 Forbidden!
    admin_res = client.put("/api/v1/admin/settings", json={"institution_name": "Hacked"}, headers=headers)
    assert admin_res.status_code == 403

def test_login_role_preference_security_enforcement():
    # 1. Matching role should succeed
    match_res = client.post("/api/v1/auth/login", json={
        "email": "student@campus.edu",
        "password": "Student@123",
        "requested_role": "student"
    })
    assert match_res.status_code == 200
    assert match_res.json()["user"]["role"] == "student"

    # 2. Mismatched role preference must be REJECTED (e.g. student claiming super_admin role)
    mismatch_res = client.post("/api/v1/auth/login", json={
        "email": "student@campus.edu",
        "password": "Student@123",
        "requested_role": "super_admin"
    })
    assert mismatch_res.status_code == 403
    assert "Access denied" in mismatch_res.json()["detail"]
    assert "does not match the selected portal role" in mismatch_res.json()["detail"]

    # 3. Faculty claiming HOD role must also be rejected
    mismatch_fac = client.post("/api/v1/auth/login", json={
        "email": "faculty@campus.edu",
        "password": "Faculty@123",
        "requested_role": "hod"
    })
    assert mismatch_fac.status_code == 403
    assert "Access denied" in mismatch_fac.json()["detail"]

def test_demo_accounts_endpoint():
    res = client.get("/api/v1/auth/demo-accounts")
    assert res.status_code == 200
    accounts = res.json()
    assert len(accounts) == 4
    roles = [a["role"] for a in accounts]
    assert "student" in roles and "faculty" in roles and "hod" in roles and "super_admin" in roles

def test_ask_data_query_deterministic():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={
        "email": "student@campus.edu",
        "password": "Student@123"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/ask-data/query", json={
        "question": "How has my attendance changed?"
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "attendance" in data["answer"].lower()
    assert "Local Analytics Engine" in data["provider"] or "AI" in data["provider"] or "Gemini" in data["provider"]

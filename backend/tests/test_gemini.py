import pytest
from app.config import settings
from app.services.gemini_service import is_gemini_available, generate_gemini_response, generate_ask_data_insight
from app.services.ask_data_engine import resolve_ask_data_query
from app.database import SessionLocal
from app.models.user import User
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_gemini_config_loaded():
    # Verify GEMINI_API_KEY is loaded from .env and is non-empty
    assert settings.GEMINI_API_KEY is not None
    assert len(settings.GEMINI_API_KEY.strip()) > 10
    # Model should be configured
    assert settings.GEMINI_MODEL in ["gemini-3.8-flash", "gemma-4-26b-a4b-it"]
    assert is_gemini_available() is True


def test_gemini_generation_live():
    # Test simple live generation
    resp = generate_gemini_response("Reply with exactly: GEMINI_ONLINE")
    assert resp is not None
    assert len(resp.strip()) > 0


def test_ask_data_query_uses_gemini():
    db = SessionLocal()
    try:
        student = db.query(User).filter(User.role == "student").first()
        assert student is not None
        
        res = resolve_ask_data_query("How is my attendance?", student, db)
        assert res is not None
        assert "Google Gemini" in res["provider"]
        assert len(res["answer"]) > 10
        assert res["confidence"] == "high"
        # Ensure secret API key is never in answer or evidence
        assert settings.GEMINI_API_KEY not in res["answer"]
        for ev in res.get("evidence", []):
            assert settings.GEMINI_API_KEY not in ev
    finally:
        db.close()


def test_risk_ai_insights_endpoint():
    # Login as faculty
    login_res = client.post("/api/v1/auth/login", json={
        "email": "faculty@campus.edu",
        "password": "Faculty@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Request AI insights for at-risk student Liam Chen (usr-stu-03)
    resp = client.get(
        "/api/v1/analytics/risk-ai-insights/usr-stu-03",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "ai_strategy" in data
    assert len(data["ai_strategy"]) > 20
    assert "Google Gemini" in data["provider"]
    # Ensure API key is never leaked
    assert settings.GEMINI_API_KEY not in data["ai_strategy"]

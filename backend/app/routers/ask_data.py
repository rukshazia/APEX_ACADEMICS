from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.auth import get_current_user
from app.schemas.importer import AskDataRequest, AskDataResponse
from app.services.ask_data_engine import resolve_ask_data_query

router = APIRouter(prefix="/ask-data", tags=["Ask Your Data & Natural Language Analytics"])

@router.post("/query", response_model=AskDataResponse)
def query_ask_data(
    payload: AskDataRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    res = resolve_ask_data_query(payload.question, current_user, db)
    return res

@router.get("/sample-questions")
def get_sample_questions(current_user: User = Depends(get_current_user)):
    role = current_user.role
    if role == "student":
        return [
            "Which subjects should I focus on this week?",
            "How has my attendance changed?",
            "Which assignments are due soon?",
            "What is my success score breakdown?"
        ]
    elif role == "faculty":
        return [
            "Which students in my assigned classes have missed multiple assignments?",
            "Which classes need attendance follow-up?",
            "Show me at-risk students in my courses",
            "What is the average attendance in my lectures?"
        ]
    elif role == "hod":
        return [
            "Which courses in my department have the highest attendance concerns?",
            "How have academic results changed this semester?",
            "Which interventions need follow-up?",
            "What is the department student risk distribution?"
        ]
    elif role == "super_admin":
        return [
            "How has attendance changed across departments?",
            "How many students have incomplete academic records?",
            "What is the current import status?",
            "Show institution-wide overview metrics"
        ]
    return []

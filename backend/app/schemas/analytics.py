from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class StudentSuccessScoreOut(BaseModel):
    overall_score: float
    data_completeness: float
    is_provisional: bool
    components: Dict[str, Optional[float]]
    missing_components: List[str]
    positive_factors: List[str]
    negative_factors: List[str]
    recommendations: List[str]
    methodology_version: str
    calculated_at: str

class RiskAlertOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    roll_number: Optional[str] = None
    department_name: Optional[str] = None
    risk_level: str
    risk_category: str
    priority: str
    evidence: List[str]
    recommended_action: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    assigned_reviewer_name: Optional[str] = None
    follow_up_deadline: Optional[str] = None
    status: str
    review_notes: Optional[str] = None
    detected_at: datetime

class RiskAlertStatusUpdate(BaseModel):
    status: str
    review_notes: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None

class InterventionCreate(BaseModel):
    student_id: str
    risk_alert_id: Optional[str] = None
    title: str
    category: str
    goal: str
    responsible_staff_id: str
    due_date: Optional[str] = None
    follow_up_date: Optional[str] = None

class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    actions_taken: Optional[str] = None
    observations: Optional[str] = None
    outcome: Optional[str] = None
    follow_up_date: Optional[str] = None

class StudentJourneyEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    student_id: str
    event_type: str
    title: str
    description: Optional[str] = None
    timestamp: datetime
    severity: str

class PlacementProfileOut(BaseModel):
    student_id: str
    technical_skills: List[Dict[str, Any]]
    soft_skills: List[Dict[str, Any]]
    coding_score: float
    aptitude_score: float
    mock_interview_score: float
    certifications_count: int
    resume_score: float
    readiness_percentage: float
    missing_evidence: List[str]
    recommendations: List[str]

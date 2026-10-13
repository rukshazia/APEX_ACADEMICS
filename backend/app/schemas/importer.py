from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ImportExecuteRequest(BaseModel):
    filename: str
    sheet_name: Optional[str] = None
    column_mapping: Dict[str, str]
    records_to_create: List[Dict[str, Any]]
    records_to_update: List[Dict[str, Any]]

class InstitutionSettingUpdate(BaseModel):
    institution_name: Optional[str] = None
    academic_year: Optional[str] = None
    current_semester: Optional[int] = None
    min_attendance_threshold: Optional[float] = None
    at_risk_grade_threshold: Optional[float] = None
    weight_academic: Optional[float] = None
    weight_attendance: Optional[float] = None
    weight_lms: Optional[float] = None
    weight_extracurricular: Optional[float] = None
    weight_placement: Optional[float] = None
    weight_skills: Optional[float] = None

class AskDataRequest(BaseModel):
    question: str

class AskDataResponse(BaseModel):
    question: str
    answer: str
    provider: str
    metrics: Dict[str, Any]
    confidence: str
    evidence: List[str]

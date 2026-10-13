from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class LeaveRequestCreate(BaseModel):
    leave_type: str
    start_date: str
    end_date: str
    reason: str

class LeaveRequestReview(BaseModel):
    status: str # approved, rejected
    review_comment: Optional[str] = None

class AppointmentCreate(BaseModel):
    faculty_id: str
    topic: str
    appointment_date: str
    time_slot: str
    notes: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str # scheduled, completed, cancelled
    notes: Optional[str] = None

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"
    department_id: Optional[str] = None
    priority: str = "normal"

class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    message: str
    category: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

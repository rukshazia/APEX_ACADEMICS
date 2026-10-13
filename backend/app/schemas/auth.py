from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str
    requested_role: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    department_id: Optional[str] = None
    roll_number: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    department_id: Optional[str] = None
    is_active: bool
    avatar_url: Optional[str] = None
    profile_details: Optional[Dict[str, Any]] = None
    created_at: datetime

import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

# Automatically locate and load backend/.env
_backend_dir = Path(__file__).resolve().parent.parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
else:
    load_dotenv()

class Settings(BaseModel):
    PROJECT_NAME: str = "Student Success & Campus Analytics Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server Host & Port
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Environment & Database
    ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./campus_analytics.db"
    )
    
    # Google Gemini AI Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    
    # Security & Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-dev-key-change-in-production-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # External Integrations (Optional)
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY", None)
    SUPABASE_JWT_SECRET: Optional[str] = os.getenv("SUPABASE_JWT_SECRET", None)
    
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME", None)
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD", None)

    # Initial configurable weights (must sum to 1.0)
    WEIGHT_ACADEMIC: float = 0.30
    WEIGHT_ATTENDANCE: float = 0.20
    WEIGHT_LMS: float = 0.10
    WEIGHT_EXTRACURRICULAR: float = 0.10
    WEIGHT_PLACEMENT: float = 0.20
    WEIGHT_SKILLS: float = 0.10

    # Risk thresholds
    MIN_ATTENDANCE_THRESHOLD: float = 75.0
    ACADEMIC_FAIL_THRESHOLD: float = 50.0
    ACADEMIC_WARNING_THRESHOLD: float = 65.0

settings = Settings()

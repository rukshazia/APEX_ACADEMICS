from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, StudentProfile, Department
from app.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user
)
from app.schemas.auth import LoginRequest, TokenResponse, RegisterRequest, UserProfileOut, ChangePasswordRequest
from app.models.importer import AuditLog

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")

    # Validate that the selected role matches the user's authorized role in the backend
    if payload.requested_role and user.role != payload.requested_role:
        role_display_names = {
            "student": "Student",
            "faculty": "Faculty",
            "hod": "Head of Department (HOD)",
            "super_admin": "Super Admin",
        }
        actual_name = role_display_names.get(user.role, user.role)
        requested_name = role_display_names.get(payload.requested_role, payload.requested_role)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Your account credentials are authorized for the '{actual_name}' role, which does not match the selected portal role '{requested_name}'. Please select '{actual_name}' to sign in."
        )

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})

    # Log audit
    db.add(AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="LOGIN_SUCCESS",
        resource_type="auth",
        resource_id=user.id,
        details=f"Successful login for role: {user.role}"
    ))
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department_id": user.department_id
        }
    }

@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """
    Public registration endpoint.
    Per security requirement: Public registration can NEVER grant HOD or Super Admin privileges!
    Always creates a student account.
    """
    email_clean = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered.")

    roll = payload.roll_number or f"STU-{email_clean.split('@')[0]}"
    existing_roll = db.query(StudentProfile).filter(StudentProfile.roll_number == roll).first()
    if existing_roll:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Roll number already registered.")

    new_user = User(
        email=email_clean,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role="student", # Enforce student role
        department_id=payload.department_id,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    new_profile = StudentProfile(
        id=new_user.id,
        roll_number=roll,
        department_id=payload.department_id,
        semester=1,
        academic_year="2025-2026",
        section="A"
    )
    db.add(new_profile)

    db.add(AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="STUDENT_SELF_REGISTRATION",
        resource_type="user",
        resource_id=new_user.id,
        details="New student registered via portal."
    ))
    db.commit()

    token = create_access_token(data={"sub": new_user.id, "role": new_user.role, "email": new_user.email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role,
            "department_id": new_user.department_id
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_data = {}
    if current_user.role == "student" and current_user.student_profile:
        p = current_user.student_profile
        profile_data = {
            "roll_number": p.roll_number,
            "admission_number": p.admission_number,
            "semester": p.semester,
            "academic_year": p.academic_year,
            "section": p.section,
            "cgpa": p.cgpa,
            "phone": p.phone,
            "guardian_name": p.guardian_name,
            "guardian_phone": p.guardian_phone,
            "placement_status": p.placement_status
        }
    elif current_user.role in ["faculty", "hod"] and current_user.faculty_profile:
        fp = current_user.faculty_profile
        profile_data = {
            "employee_id": fp.employee_id,
            "designation": fp.designation,
            "specialization": fp.specialization,
            "office_room": fp.office_room
        }

    dept_name = None
    if current_user.department_id:
        dept = db.query(Department).filter(Department.id == current_user.department_id).first()
        dept_name = dept.name if dept else None

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department_id": current_user.department_id,
        "department_name": dept_name,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "profile": profile_data
    }

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    
    current_user.password_hash = hash_password(payload.new_password)
    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="PASSWORD_CHANGED",
        resource_type="auth",
        resource_id=current_user.id,
        details="User updated their account password."
    ))
    db.commit()
    return {"message": "Password updated successfully."}

@router.get("/demo-accounts")
def get_demo_accounts():
    """Provides documented test accounts for safe local testing of each of the 4 roles."""
    return [
        {"role": "student", "email": "student@campus.edu", "password": "Student@123", "name": "Alex Rivera", "description": "Enrolled 4th Sem Computer Science student"},
        {"role": "faculty", "email": "faculty@campus.edu", "password": "Faculty@123", "name": "Dr. Sarah Jenkins", "description": "Associate Professor in CS, handles Data Structures & AI"},
        {"role": "hod", "email": "hod@campus.edu", "password": "Hod@123", "name": "Prof. Robert Vance", "description": "Head of Computer Science & Engineering Department"},
        {"role": "super_admin", "email": "admin@campus.edu", "password": "Admin@123", "name": "Dean Eleanor Vance", "description": "Institutional Super Administrator"}
    ]

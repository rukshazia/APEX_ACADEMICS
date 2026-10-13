from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models.user import User, StudentProfile, FacultyProfile, Department
from app.auth import get_current_user, require_admin, hash_password
from app.models.importer import AuditLog

router = APIRouter(prefix="/users", tags=["Users & Directory"])

@router.get("/students")
def get_students(
    department_id: Optional[str] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    placement_status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile).join(User, StudentProfile.id == User.id)

    # Enforce Role Authorization Boundaries
    if current_user.role == "student":
        # Student can only access their own record
        query = query.filter(StudentProfile.id == current_user.id)
    elif current_user.role == "hod":
        # HOD can only access their department
        if current_user.department_id:
            query = query.filter(StudentProfile.department_id == current_user.department_id)
        else:
            return []
    elif current_user.role == "faculty":
        # Faculty restricted to their department
        if current_user.department_id:
            query = query.filter(StudentProfile.department_id == current_user.department_id)
    # Super admin has global visibility

    if department_id and current_user.role == "super_admin":
        query = query.filter(StudentProfile.department_id == department_id)
    if semester:
        query = query.filter(StudentProfile.semester == semester)
    if placement_status:
        query = query.filter(StudentProfile.placement_status == placement_status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(s)) |
            (User.email.ilike(s)) |
            (StudentProfile.roll_number.ilike(s))
        )

    profiles = query.all()
    results = []
    for p in profiles:
        u = p.user
        dept = p.department
        results.append({
            "id": p.id,
            "roll_number": p.roll_number,
            "admission_number": p.admission_number,
            "full_name": u.full_name,
            "email": u.email,
            "department_id": p.department_id,
            "department_name": dept.name if dept else None,
            "department_code": dept.code if dept else None,
            "semester": p.semester,
            "academic_year": p.academic_year,
            "section": p.section,
            "cgpa": p.cgpa,
            "phone": p.phone,
            "placement_status": p.placement_status,
            "is_provisional": p.is_provisional
        })
    return results

@router.get("/students/{student_id}")
def get_student_detail(
    student_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    # Authorization Check
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Access denied. Students cannot view other students' private records.")
    if current_user.role == "hod" and current_user.department_id != profile.department_id:
        raise HTTPException(status_code=403, detail="Access denied. HOD can only access department records.")

    u = profile.user
    dept = profile.department
    return {
        "id": profile.id,
        "roll_number": profile.roll_number,
        "admission_number": profile.admission_number,
        "full_name": u.full_name,
        "email": u.email,
        "department_id": profile.department_id,
        "department_name": dept.name if dept else None,
        "department_code": dept.code if dept else None,
        "semester": profile.semester,
        "academic_year": profile.academic_year,
        "section": profile.section,
        "cgpa": profile.cgpa,
        "phone": profile.phone,
        "guardian_name": profile.guardian_name,
        "guardian_phone": profile.guardian_phone,
        "placement_status": profile.placement_status,
        "is_provisional": profile.is_provisional
    }

@router.get("/faculty")
def get_faculty_list(
    department_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FacultyProfile).join(User, FacultyProfile.id == User.id)
    if department_id:
        query = query.filter(FacultyProfile.department_id == department_id)
    elif current_user.role == "hod" and current_user.department_id:
        query = query.filter(FacultyProfile.department_id == current_user.department_id)

    facs = query.all()
    results = []
    for fp in facs:
        u = fp.user
        dept = fp.department
        results.append({
            "id": fp.id,
            "employee_id": fp.employee_id,
            "full_name": u.full_name,
            "email": u.email,
            "department_id": fp.department_id,
            "department_name": dept.name if dept else None,
            "designation": fp.designation,
            "specialization": fp.specialization,
            "office_room": fp.office_room
        })
    return results

@router.post("/create-staff")
def create_staff_user(
    payload: dict,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Super Admin restricted endpoint to create Faculty or HOD accounts.
    """
    email = payload.get("email", "").strip().lower()
    full_name = payload.get("full_name", "").strip()
    role = payload.get("role")
    dept_id = payload.get("department_id")
    password = payload.get("password", "Staff@123")

    if role not in ["faculty", "hod"]:
        raise HTTPException(status_code=400, detail="Role must be either 'faculty' or 'hod'.")

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists.")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=role,
        department_id=dept_id,
        is_active=True
    )
    db.add(user)
    db.flush()

    fac_profile = FacultyProfile(
        id=user.id,
        employee_id=payload.get("employee_id", f"EMP-{role[:3].upper()}-{user.id[:4]}"),
        department_id=dept_id,
        designation=payload.get("designation", "Faculty"),
        specialization=payload.get("specialization", "General"),
        office_room=payload.get("office_room", "Room 101")
    )
    db.add(fac_profile)

    if role == "hod" and dept_id:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            dept.hod_id = user.id

    db.add(AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="STAFF_CREATED",
        resource_type="user",
        resource_id=user.id,
        details=f"Admin created {role} account for {email}"
    ))
    db.commit()

    return {"message": f"Successfully created {role} user.", "id": user.id}

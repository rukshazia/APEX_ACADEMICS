import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.models.user import User, StudentProfile, Department
from app.auth import require_admin, get_current_user, hash_password
from app.services.excel_parser import inspect_workbook, parse_and_validate_records
from app.schemas.importer import ImportExecuteRequest
from app.models.importer import ImportJob, AuditLog
import io
import csv

router = APIRouter(prefix="/importer", tags=["Excel & CSV Data Import Wizard"])

@router.post("/inspect")
async def inspect_uploaded_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin)
):
    """
    Step 1 & 2: Inspect uploaded workbook or CSV, extracts sheet names, headers, and preview rows.
    Suggests column mapping automatically.
    """
    filename = file.filename or "uploaded_file.xlsx"
    valid_exts = (".xlsx", ".xls", ".csv")
    if not any(filename.lower().endswith(ext) for ext in valid_exts):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .xlsx, .xls, or .csv")

    content = await file.read()
    if len(content) > 15 * 1024 * 1024: # 15MB limit
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed 15MB limit.")

    result = inspect_workbook(content, filename)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result

@router.post("/preview")
async def preview_and_validate_import(
    file: UploadFile = File(...),
    sheet_name: Optional[str] = Form(None),
    column_mapping_json: str = Form(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Step 3: Validates all rows with user-confirmed mappings against database constraints,
    categorizing into to_create, to_update, or rejected rows with validation messages.
    """
    try:
        column_mapping = json.loads(column_mapping_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON in column_mapping.")

    content = await file.read()
    filename = file.filename or "workbook.xlsx"

    # Query existing rolls and emails for conflict detection
    existing_rolls = set(r[0] for r in db.query(StudentProfile.roll_number).all())
    existing_emails = set(e[0].lower() for e in db.query(User.email).all())

    preview_result = parse_and_validate_records(
        file_bytes=content,
        filename=filename,
        sheet_name=sheet_name,
        column_mapping=column_mapping,
        existing_rolls=existing_rolls,
        existing_emails=existing_emails
    )

    if "error" in preview_result:
        raise HTTPException(status_code=400, detail=preview_result["error"])

    return preview_result

@router.post("/execute")
def execute_import_transaction(
    payload: ImportExecuteRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Step 4: Executes import safely in database transaction.
    Creates new student records, updates existing conflicts according to user approval,
    records ImportJob and AuditLog.
    """
    created_count = 0
    updated_count = 0
    errors: List[Dict[str, Any]] = []

    # Map departments by code for fast lookup
    departments = {d.code.upper(): d.id for d in db.query(Department).all()}
    default_dept_id = next(iter(departments.values())) if departments else None

    try:
        # 1. Process Records to Create
        for rec in payload.records_to_create:
            email = rec.get("email", "").lower().strip()
            roll = rec.get("roll_number", "").strip()
            name = rec.get("full_name", "").strip()
            dept_code = rec.get("department_code", "").upper().strip()
            dept_id = departments.get(dept_code, default_dept_id)
            sem = rec.get("semester", 1)
            sec = rec.get("section", "A") or "A"
            cgpa = rec.get("cgpa", 0.0)
            phone = rec.get("phone", "")
            guardian_name = rec.get("guardian_name", "")
            guardian_phone = rec.get("guardian_phone", "")
            p_status = rec.get("placement_status", "Preparing") or "Preparing"

            new_user = User(
                email=email,
                password_hash=hash_password("Student@123"), # Default password for newly imported students
                full_name=name,
                role="student",
                department_id=dept_id,
                is_active=True
            )
            db.add(new_user)
            db.flush()

            new_profile = StudentProfile(
                id=new_user.id,
                roll_number=roll,
                admission_number=f"ADM-{roll}",
                department_id=dept_id,
                semester=sem,
                section=sec,
                cgpa=cgpa,
                phone=phone,
                guardian_name=guardian_name,
                guardian_phone=guardian_phone,
                placement_status=p_status,
                is_provisional=False
            )
            db.add(new_profile)
            created_count += 1

        # 2. Process Records to Update
        for rec in payload.records_to_update:
            roll = rec.get("roll_number", "").strip()
            email = rec.get("email", "").lower().strip()
            name = rec.get("full_name", "").strip()
            dept_code = rec.get("department_code", "").upper().strip()
            dept_id = departments.get(dept_code, default_dept_id)
            sem = rec.get("semester", 1)
            sec = rec.get("section", "A") or "A"
            cgpa = rec.get("cgpa", 0.0)
            phone = rec.get("phone", "")
            p_status = rec.get("placement_status", "Preparing") or "Preparing"

            existing_prof = db.query(StudentProfile).filter(StudentProfile.roll_number == roll).first()
            if existing_prof:
                if dept_id:
                    existing_prof.department_id = dept_id
                existing_prof.semester = sem
                existing_prof.section = sec
                existing_prof.cgpa = cgpa
                if phone:
                    existing_prof.phone = phone
                existing_prof.placement_status = p_status
                if name:
                    existing_prof.user.full_name = name
                updated_count += 1
            else:
                existing_user = db.query(User).filter(User.email == email).first()
                if existing_user and existing_user.student_profile:
                    sp = existing_user.student_profile
                    sp.roll_number = roll
                    sp.semester = sem
                    sp.cgpa = cgpa
                    updated_count += 1

        # 3. Log Import Job
        import_job = ImportJob(
            filename=payload.filename,
            file_type=payload.filename.split(".")[-1].lower(),
            sheet_name=payload.sheet_name,
            imported_by=current_user.id,
            total_rows=created_count + updated_count,
            created_count=created_count,
            updated_count=updated_count,
            skipped_count=0,
            rejected_count=0,
            status="completed",
            errors_json=json.dumps(errors)
        )
        db.add(import_job)

        # 4. Audit Log
        db.add(AuditLog(
            user_id=current_user.id,
            user_email=current_user.email,
            action="IMPORT_COMPLETED",
            resource_type="import_job",
            resource_id=import_job.id,
            details=f"File {payload.filename}: {created_count} students created, {updated_count} students updated."
        ))

        db.commit()

        return {
            "message": "Import completed successfully.",
            "import_job_id": import_job.id,
            "created_count": created_count,
            "updated_count": updated_count,
            "total_processed": created_count + updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database import transaction error: {str(e)}")

@router.get("/history")
def get_import_history(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    jobs = db.query(ImportJob).order_by(ImportJob.created_at.desc()).all()
    results = []
    for j in jobs:
        results.append({
            "id": j.id,
            "filename": j.filename,
            "file_type": j.file_type,
            "sheet_name": j.sheet_name,
            "imported_by_name": j.user.full_name if j.user else "Admin",
            "total_rows": j.total_rows,
            "created_count": j.created_count,
            "updated_count": j.updated_count,
            "skipped_count": j.skipped_count,
            "rejected_count": j.rejected_count,
            "status": j.status,
            "errors": json.loads(j.errors_json or "[]"),
            "created_at": j.created_at.isoformat()
        })
    return results

@router.get("/template/csv")
def download_sample_template():
    """Generates a downloadable sample CSV with canonical student headers."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "roll_number", "full_name", "email", "department_code", "semester", "section",
        "cgpa", "phone", "guardian_name", "guardian_phone", "placement_status"
    ])
    writer.writerow([
        "STU2025-101", "Jordan Lee", "jordan.lee@example.edu", "CSE", 4, "A",
        8.60, "+1 555-019-3321", "Robert Lee", "+1 555-019-3322", "Preparing"
    ])
    writer.writerow([
        "STU2025-102", "Maya Patel", "maya.patel@example.edu", "ECE", 4, "B",
        9.20, "+1 555-019-4455", "Anita Patel", "+1 555-019-4456", "Ready"
    ])
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=student_import_template.csv"}
    )

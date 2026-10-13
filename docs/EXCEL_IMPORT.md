# Excel & CSV Ingestion System Specification

## 1. Supported File Formats & Limits

- **Formats**: Microsoft Excel (`.xlsx`, `.xls`), Comma-Separated Values (`.csv`).
- **File Size**: Up to 15MB per file.
- **Encoding**: UTF-8 and standard Western encodings.

## 2. 4-Step Ingestion Workflow

```
[ Step 1: Upload & Inspect ]
   ├── Validate extension & byte size
   ├── Openpyxl sheet reader / CSV parser
   └── Extract headers & sample rows
               │
[ Step 2: Sheet & Column Mapping ]
   ├── Select target worksheet (multi-sheet support)
   ├── Automatic synonym guessing (e.g. "Roll No" -> "roll_number")
   └── Manual user override for each canonical field
               │
[ Step 3: Constraint Validation & Conflict Preview ]
   ├── Validate required identifiers (Roll No, Email, Full Name)
   ├── Validate formats (email regex, semester 1-12, CGPA 0-10)
   ├── Internal duplicate row detection (file level)
   ├── Existing database conflict detection (update vs create)
   └── Display rejected rows with precise row error messages
               │
[ Step 4: Transactional Persistence ]
   ├── Atomic database transaction execution
   ├── Batch insert new student profiles
   ├── Batch update existing student profiles
   ├── Record ImportJob audit record
   └── Commit or Rollback on partial database failure
```

## 3. Canonical Field Mappings

| Canonical Field | Synonyms Recognized | Required | Format Rule |
| :--- | :--- | :---: | :--- |
| `roll_number` | roll_no, roll no, reg_no, register_no, student_id | Yes | Unique string |
| `full_name` | name, student_name, candidate_name | Yes | Non-empty string |
| `email` | mail_id, email_address, student_email | Yes | Valid email format |
| `department_code`| dept, department, branch, program | No | CSE, ECE, MECH, MBA |
| `semester` | sem, term, current_semester | No | Integer (1 - 12) |
| `section` | sec, division, batch | No | String ('A', 'B') |
| `cgpa` | gpa, grade_point, percentage | No | Float (0.00 - 10.00) |
| `phone` | mobile, contact_no, phone_number | No | Phone format |
| `guardian_name` | parent_name, father_name | No | String |
| `guardian_phone`| parent_phone, parent_mobile | No | Phone format |
| `placement_status`| placement, placement_readiness | No | Preparing, Ready, Placed |

## 4. Sample Templates

Pre-configured sample files are included directly in the root workspace:
- `sample_students_cohort_2025.xlsx`: Formatted Excel workbook with sheet `Students_Roster`.
- `sample_students_cohort_2025.csv`: Formatted CSV ready for direct upload.
- One-click template download available directly from the Import Wizard UI at `/api/v1/importer/template/csv`.

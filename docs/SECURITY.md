# Security, Authorization & Privacy Architecture

## 1. Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | Student | Faculty | HOD | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Personal Dashboard & Profile** | Full (Own) | Full (Own) | Full (Own) | Full (Own) |
| **View Student Directory** | Denied (Own only) | Assigned Dept | Authorized Dept | Global All Depts |
| **Record & Correct Attendance** | Read-Only (Own) | Authorized Course | Authorized Dept | Full Admin |
| **Create & Grade Assignments** | Submit (Own) | Manage Assigned | Manage Dept | Full Admin |
| **Assessment Grades Entry** | View (Own) | Record Course | Record Dept | Full Admin |
| **At-Risk Queue & Evidence** | Denied | Assigned Scope | Department Scope | Full Admin |
| **Launch Interventions** | Read-Only (Own) | Manage Assigned | Coordinate Dept | Full Admin |
| **Fee Statements** | View (Own) | Denied | Denied | Manage All |
| **Staff & Faculty Account Creation** | Denied | Denied | Denied | Super Admin Only |
| **Scoring Weights & Thresholds** | Denied | Denied | Denied | Super Admin Only |
| **Excel & CSV Ingestion Wizard** | Denied | Denied | Denied | Super Admin Only |
| **Security Audit Logs** | Denied | Denied | Denied | Super Admin Only |

## 2. Public Registration Security Policy

- **Strict Student Containment**: The public `/api/v1/auth/register` endpoint unconditionally binds all self-registered users to `role="student"`.
- Under no circumstance can a user grant themselves `faculty`, `hod`, or `super_admin` permissions through public registration payloads.
- Staff accounts must be provisioned through the authorized `/api/v1/users/create-staff` endpoint protected by `require_admin`.

## 3. Server-Side Permission Enforcement

Frontend route hiding is treated purely as UI ergonomics. Every backend route verifies:
```python
current_user = Depends(get_current_user)
# and checks role guards:
require_roles(["faculty", "hod", "super_admin"])
```
If an unauthorized token attempts access, FastAPI responds with `HTTP 403 Forbidden` and an explicit security violation message.

## 4. Student Privacy & Data Confidentiality

1. **Fee Record Seclusion**: Financial records are accessible only to the student themselves or institutional administrators. Faculty members cannot view fee records.
2. **Support Notes Non-Inference**: Risk indicators are derived purely from recorded academic metrics (attendance, overdue assignments, assessment averages). The platform strictly forbids inferring medical, psychological, or personal domestic circumstances.
3. **No Arbitrary SQL from AI**: Natural language query resolution uses predefined, parameterized analytical queries. External language models are never permitted to generate or execute raw SQL against the database.

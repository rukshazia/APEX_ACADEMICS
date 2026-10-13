# Local Development Guide

## 1. Prerequisites

- Python 3.10+ (tested and verified on Python 3.14.4)
- Node.js v18+ (tested and verified on Node.js v24.21.0)
- npm v9+ (run with `npm.cmd` on Windows PowerShell if execution policies restrict `.ps1` scripts)

## 2. Fast Startup Steps

### Step 1: Initialize Backend & Database
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
python -m pip install -r requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
On initial boot, FastAPI automatically creates all SQLite tables in `campus_analytics.db` and populates realistic demo records for all four roles.

### Step 2: Start Frontend
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm.cmd install

# Start Vite development server on port 5173
npm.cmd run dev
```

Visit **`http://localhost:5173`** in your browser.

## 3. Test Accounts (All 4 User Roles)

| Role | Email | Password | Persona & Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `Student@123` | Alex Rivera (4th Sem CSE, Section A) |
| **Faculty** | `faculty@campus.edu` | `Faculty@123` | Dr. Sarah Jenkins (Assoc. Prof, CSE) |
| **HOD** | `hod@campus.edu` | `Hod@123` | Prof. Robert Vance (Head of Dept, CSE) |
| **Super Admin**| `admin@campus.edu` | `Admin@123` | Dean Eleanor Vance (Campus Executive) |

*Tip: The login page includes one-click demo login buttons to instantly test any role.*

## 4. Running Backend Automated Tests
```bash
cd backend
python -m pytest tests -v
```
All 16 unit and integration tests run in under 3 seconds and verify authentication, tokens, scoring with missing data, risk detection, import validation, and endpoint security.

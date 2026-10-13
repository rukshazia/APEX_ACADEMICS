# Apex Academics: AI-Powered Student Success & Campus Analytics Platform

A full-stack, enterprise-grade academic analytics and campus intelligence platform engineered with **FastAPI**, **React 19**, **TypeScript**, **Tailwind CSS**, and **SQLite/Supabase**.

---

## 🌟 Key Highlights & Capabilities

- **Four Dedicated User Role Experiences**:
  - **Student Portal**: Success Score (0-100), chronological journey, attendance percentage, assignments, timetable, and placement readiness.
  - **Faculty Portal**: Class management, batch attendance recording, assignment submission review & grading, explainable risk alerts, and student interventions.
  - **HOD Leadership Console**: Department-wide performance KPIs, course attendance comparisons, risk distribution, and cohort segmentation.
  - **Super Admin Console**: Institutional configuration, scoring weights & risk thresholds, user management, audit logs, and integration health monitoring.
- **Explainable Student Success Score (0 – 100)**:
  - Configurable 6-factor weighting (Academic 30%, Attendance 20%, LMS 10%, Extracurricular 10%, Placement 20%, Skills 10%).
  - Mathematical weight renormalization for missing data: **never** penalizes unrecorded components as zero.
  - Detailed positive and negative factors with actionable improvement recommendations.
- **Rules-Based At-Risk Student Detection**:
  - Evaluates attendance drops (< 75%), consecutive absences, missing assignments, and declining grades.
  - Produces explainable alerts backed by itemized evidence.
- **Intervention Lifecycle Management**:
  - Full workflow: `Detection -> Review -> Intervention Action Plan -> Follow-up -> Outcome Tracking`.
- **Excel & CSV Ingestion Wizard**:
  - Supports `.xlsx`, `.xls`, and `.csv` files up to 15MB.
  - Worksheet inspection, automatic column synonym mapping, strict format validation, duplicate detection, and atomic database transaction persistence.
- **Role-Aware Natural Language Analytics ("Ask Your Data")**:
  - Allows natural language querying of permitted academic records.
  - Powered by a deterministic local analytics engine with zero external API key requirements, plus support for OpenAI when configured.
- **Enterprise Design System ("Muted Professional Elegance")**:
  - Palette: Deep muted navy (`#26364A`), slate navy (`#34465A`), muted blue (`#647F9E`), and warm off-white (`#F5F5F2`).
  - Cohesive Lucide React iconography and Recharts analytics visualizations.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.14.4)
- **Node.js**: v18+ (tested on Node.js v24.21.0)
- **npm**: v9+ (on Windows PowerShell, use `npm.cmd` if script execution is restricted)

---

### 2. Start the Backend API (FastAPI)

```bash
# 1. Open a terminal and navigate to backend directory
cd backend

# 2. Install Python dependencies
python -m pip install -r requirements.txt

# 3. Start the FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API will start at: `http://localhost:8000`
- Interactive API Documentation: `http://localhost:8000/docs`
- On initial startup, the database `campus_analytics.db` is automatically created and populated with demo records for all four roles.

---

### 3. Start the Frontend Application (Vite + React)

```bash
# 1. Open a second terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm.cmd install

# 3. Start the Vite development server
npm.cmd run dev
```
- Web Application will be live at: **`http://localhost:5173`**

---

## 👥 Test Accounts (All 4 User Roles)

You can log in manually or use the **One-Click Quick Login** buttons on the login screen (`http://localhost:5173/login`):

| Role | Email | Password | Persona & Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` | `Student@123` | Alex Rivera (4th Sem CSE, Section A) |
| **Faculty** | `faculty@campus.edu` | `Faculty@123` | Dr. Sarah Jenkins (Assoc. Prof, CSE) |
| **HOD** | `hod@campus.edu` | `Hod@123` | Prof. Robert Vance (Head of Dept, CSE) |
| **Super Admin**| `admin@campus.edu` | `Admin@123` | Dean Eleanor Vance (Campus Executive) |

*You can also toggle between roles at any time using the Demo Role Switcher in the sidebar footer.*

---

## 🧪 Running Automated Tests

### Backend Automated Test Suite
```bash
cd backend
python -m pytest tests -v
```
Executes 16 tests verifying password hashing, JWT tokens, success scoring renormalization, risk detection, import validation, and endpoint authorization.

### Frontend Production Build Test
```bash
cd frontend
npm.cmd run build
```
Executes TypeScript type-checking (`tsc -b`) and Vite production bundling.

---

## 📁 Project Structure

```
success-study-platform/
├── backend/
│   ├── app/
│   │   ├── config.py                 # App settings & env configuration
│   │   ├── database.py               # SQLAlchemy database session & engine
│   │   ├── auth.py                   # PBKDF2 hashing, JWT tokens & role dependencies
│   │   ├── models/                   # SQLAlchemy relational data models
│   │   ├── schemas/                  # Pydantic v2 validation models
│   │   ├── routers/                  # API routers (Auth, Users, Academics, Analytics, etc.)
│   │   └── services/                 # Scoring engine, risk detection, importer, AskData
│   ├── tests/                        # 16 Pytest automated tests
│   ├── main.py                       # FastAPI application entrypoint
│   └── requirements.txt              # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/client.ts             # Typed API client wrapper
│   │   ├── context/AuthContext.tsx   # Auth context & demo role switcher
│   │   ├── components/               # Layout, Sidebar, Navbar, StatCard, Modal, Badge
│   │   ├── pages/                    # 4 Role Dashboards & feature pages
│   │   ├── types/index.ts            # Complete TypeScript definitions
│   │   └── App.tsx                   # Route tree
│   ├── tailwind.config.js            # Design tokens & color palette
│   └── vite.config.ts                # Vite proxy & build configuration
├── docs/                             # Comprehensive system documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── EXCEL_IMPORT.md
│   ├── ANALYTICS_METHODOLOGY.md
│   ├── LOCAL_DEVELOPMENT.md
│   ├── DEPLOYMENT.md
│   └── DEMO_GUIDE.md
├── sample_students_cohort_2025.xlsx  # Ready-to-import sample Excel workbook
├── sample_students_cohort_2025.csv   # Ready-to-import sample CSV cohort file
├── PROJECT_STATUS.md                 # Detailed project completion report
├── README.md                         # This file
├── .env.example                      # Safe environment variables template
└── .gitignore                        # Git ignore rules
```

---

## 📄 License & Attribution

Designed and developed for academic analytics evaluation. Intended for institutional student-success intelligence.

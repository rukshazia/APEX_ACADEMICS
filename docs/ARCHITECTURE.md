# System Architecture & Technical Design

## 1. High-Level Architectural Overview

The **AI-Powered Student Success & Campus Analytics Platform** is structured as a decoupled, multi-tier full-stack application designed for institutional reliability, explainability, and multi-tenant department scoping.

```
+-----------------------------------------------------------------------------------+
|                              Client Tier (React 19 + Vite)                        |
|  - Role-Tailored Portals: Student, Faculty, HOD, Super Admin                      |
|  - Design System: Muted Professional Elegance (#26364A, #647F9E, #F5F5F2)         |
|  - State & Routing: React Router v7, TanStack Query, React Hook Form              |
|  - Visualizations: Recharts Responsive Containers                                 |
+-----------------------------------------+-----------------------------------------+
                                          | JSON over HTTPS (JWT Bearer Token)
+-----------------------------------------v-----------------------------------------+
|                              Backend API Tier (FastAPI)                           |
|  - Authentication & RBAC Guard Dependencies (require_student, require_staff, etc.)|
|  - Routers: Auth, Users, Academics, Analytics, Services, Importer, AskData, Admin |
|  - Pydantic v2 Input/Output Validation Schemas with ConfigDict                    |
+-----------------------------------------+-----------------------------------------+
                                          |
        +---------------------------------+---------------------------------+
        |                                                                   |
+-------v-------------------------+                       +-----------------v-------+
|  Services & Analytical Engines   |                       |  Data Persistence Tier  |
|  - 0-100 Success Scoring Engine  |                       |  - SQLAlchemy 2.0 ORM   |
|  - Rules-based At-Risk Detection |                       |  - SQLite (Local Dev)   |
|  - 4-Step Excel/CSV Importer    |                       |  - Supabase/PostgreSQL  |
|  - Deterministic Ask-Data Engine |                       |    (Production Cloud)   |
|  - Server-side AI Abstraction   |                       |  - Relational Integrity |
+---------------------------------+                       +-------------------------+
```

## 2. Frontend Component Architecture

1. **State & Authentication Layer (`AuthContext.tsx`)**:
   - Manages token persistence in `localStorage`.
   - Re-authenticates user identity against `/api/v1/auth/me`.
   - Provides seamless, one-click demo role switching for development verification.
2. **Navigation & Layout (`Sidebar.tsx`, `Navbar.tsx`, `Layout.tsx`)**:
   - Deep muted navy sidebar (`#26364A`) with role-specific menu groups.
   - Status indicators displaying active persistent SQLite database mode.
   - Unread notification counter with immediate interactive dropdown.
3. **Role-Specific Dashboards**:
   - Centrally routed via `Dashboard.tsx` dynamically mapping to authenticated role credentials.

## 3. Backend & Domain Architecture

1. **Database Abstraction (`database.py`)**:
   - Session isolation through `get_db` FastAPI dependency with automatic connection closing.
   - SQLite thread safety enabled for concurrent requests.
2. **Security & Cryptography (`auth.py`)**:
   - Standards-compliant PBKDF2-HMAC-SHA256 password hashing with random 16-byte cryptographic salts.
   - Zero deprecated external crypto dependencies, verified compatible with Python 3.14.
   - Stateless HS256 JWT tokens with 24-hour expiration.
3. **Analytics Engine Abstraction**:
   - `scoring.py`: Mathematical renormalization of configurable component weights when missing fields occur.
   - `risk_detection.py`: Transparent rules-based flag generation with multi-point evidence arrays.
   - `ask_data_engine.py`: Pre-mapped, permission-checked queries preventing arbitrary SQL injection and providing deterministic fallback when OpenAI keys are omitted.

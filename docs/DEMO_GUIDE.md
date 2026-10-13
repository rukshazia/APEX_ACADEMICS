# Platform Demonstration Guide

This guide provides a comprehensive walk-through to demonstrate every user role and critical workflow in the application.

---

## 1. Student Experience Demonstration (Alex Rivera)

1. Open `http://localhost:5173/login`.
2. Click the **"Student"** quick demo button (or enter `student@campus.edu` / `Student@123`).
3. **Student Overview Dashboard**:
   - Observe Key KPI cards: 90% Attendance Rate, 84.8/100 Success Score, 8.45 CGPA.
   - Inspect Course-wise Attendance Distribution chart.
   - Check today's timetable schedule and active course assignment deadlines.
4. **Academics & Attendance**:
   - Click **"Academics & Attendance"** in sidebar.
   - Inspect the **Attendance** tab showing course breakdown and full date-wise attendance records.
   - Click the **Assignments** tab. Locate an active assignment, click **"Submit Assignment"**, enter solution text, and confirm submission.
   - Inspect the **Grades & Assessments** tab displaying continuous evaluation and midterm marks.
5. **Success Score (0 - 100)**:
   - Click **"Success Score"** in sidebar.
   - Examine the 6-component weighted breakdown bar chart.
   - Review explainable factors raising the score vs factors limiting the score.
   - Review actionable, supportive improvement recommendations.
6. **Student Journey**:
   - Click **"Personal Journey"** in sidebar.
   - Walk through the chronological vertical milestone cards (Enrollment, Commendations, Hackathon finalist award, Assessment results).
7. **Placement & Skills**:
   - Click **"Placement & Skills"**.
   - Review the 84% readiness benchmark, verified technical skill badges, aptitude & mock interview metrics.
8. **Student Services**:
   - Click **"Student Services"**.
   - Check verified fee statements.
   - Click **"Leave Applications"** -> Click **"Apply for Leave"** -> submit a medical leave request.
   - Click **"Faculty Appointments"** -> book office hours with Dr. Sarah Jenkins.
9. **Ask Your Data**:
   - Click **"Ask Your Data"**.
   - Click suggested question: *"How has my attendance changed?"* or *"Which subjects should I focus on this week?"*.
   - Review instant explainable analysis powered by the local deterministic analytics engine.

---

## 2. Faculty Experience Demonstration (Dr. Sarah Jenkins)

1. In the sidebar footer, click **"Faculty"** in the Demo Role Switcher (or log out and log in with `faculty@campus.edu` / `Faculty@123`).
2. **Faculty Dashboard**:
   - View assigned courses (CS301, CS304), enrolled students, and open at-risk student queue.
3. **Attendance Recording Workflow**:
   - Click **"Attendance Recording"** in sidebar.
   - Select Course CS301 and today's date.
   - Toggle student attendance statuses (Present, Absent, Late).
   - Click **"Save & Publish Attendance"**. Notice immediate synchronized persistence.
4. **Assignments & Grading Workflow**:
   - Click **"Assignments & Grading"**.
   - Click **"New Assignment"** -> fill title, category, max marks, due date -> Click **"Publish Assignment"**.
   - On an existing assignment, click **"Review Submissions"** -> inspect student submission -> click **"Grade Submission"**, enter score and feedback -> click **"Save Grade"**.
5. **At-Risk Student Queue & Interventions**:
   - Click **"At-Risk Student Alerts"**.
   - Review explainable risk alert for student Liam Chen (`severe_attendance_drop`, attendance at 40%, missed assignments).
   - Click **"Launch Intervention"**.
   - Set category (*Subject Tutoring*), specify goal and follow-up deadline.
   - Navigate to **"Interventions Workflow"** -> click **"Update & Follow-up"** -> record actions taken and observe outcome (`Significantly Improved`).

---

## 3. HOD Leadership Demonstration (Prof. Robert Vance)

1. Switch to **"HOD"** in the Demo Role Switcher (or log in with `hod@campus.edu` / `Hod@123`).
2. **HOD Department Overview**:
   - View Computer Science department KPIs, average cohort CGPA (7.59), active interventions count.
   - Inspect Department Risk Level Breakdown chart (Critical, High, Medium, Low).
   - Review cohort segmentation (High Achievers, Attendance Concerns, Academic Tutoring Needed, Placement Ready).
3. **Department Analytics**:
   - Click **"Department Analytics"** in sidebar.
   - Compare course-level average attendance across CS301, CS302, CS303, CS304.
4. **Faculty & Teaching Workload**:
   - Click **"Faculty & Workload"** to view faculty member specializations and allocated course sections.
5. **Department Ask Your Data**:
   - Ask: *"Which courses in my department have the highest attendance concerns?"*

---

## 4. Super Admin Demonstration (Dean Eleanor Vance)

1. Switch to **"Admin"** in the Demo Role Switcher (or log in with `admin@campus.edu` / `Admin@123`).
2. **Admin Console**:
   - View institution-wide metrics, active departments, system persistence status.
3. **Excel & CSV Ingestion Wizard**:
   - Click **"Excel Import Wizard"** in sidebar.
   - Upload the provided file `sample_students_cohort_2025.xlsx` or `sample_students_cohort_2025.csv`.
   - Click **"Proceed to Sheet & Column Mapping"**.
   - Notice the automatic header synonym matching!
   - Click **"Validate & Preview Records"**.
   - Review validation summary (Processed, New Records, Conflict Updates, Rejected Rows).
   - Click **"Commit Records to Database"**.
   - Observe transactional completion and view the new student records in the Student Directory.
4. **Scoring Weights & Thresholds Configuration**:
   - Click **"Scoring & Risk Weights"** in sidebar.
   - Adjust weights (e.g. increase Academic to 35%, decrease LMS to 5% - maintaining sum of 1.00).
   - Adjust Minimum Attendance Threshold (e.g., 80%).
   - Click **"Apply & Save Configuration"**.
5. **System Integrations Status**:
   - Click **"Integrations & Supabase"** to inspect verified operational statuses of SQLite persistence, Supabase ready adapter, and AI deterministic analytics.
6. **Audit Logs & Reports**:
   - Click **"Audit Logs"** to view timestamped compliance events.
   - On the Admin Dashboard, click **"Export Student Master Roster (CSV)"** to verify instant CSV data extraction.

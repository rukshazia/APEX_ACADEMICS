# Relational Database Schema & Data Models

## 1. Schema Design Principles

The database schema is engineered using SQLAlchemy 2.0 with strict relational integrity, foreign key cascades, unique constraints, and indexed identifiers.

```
                           +---------------+
                           |  departments  |
                           +-------+-------+
                                   |
         +-------------------------+-------------------------+
         | 1:N                                               | 1:N
+--------v--------+                                 +--------v--------+
|      users      |                                 |     courses     |
+--------+--------+                                 +--------+--------+
         |                                                   |
   +-----+-----+---------------------+                       |
   | 1:1       | 1:1                 | 1:N                   |
+--v-----+ +---v----+          +-----v-------------+         |
|student_| |faculty_|          | attendance_records| <-------+
|profiles| |profiles|          +-------------------+         |
+--------+ +--------+                                        |
   |                                                         |
   +---------> student_success_scores                        |
   +---------> risk_alerts ----> interventions               |
   +---------> student_journey_events                        |
   +---------> skill_placement_profiles                      |
   +---------> fee_records                                   |
   +---------> leave_requests                                |
   +---------> appointments                                  |
                                       +-------------------+ |
                                       |    assignments    |-+
                                       +---------+---------+
                                                 | 1:N
                                       +---------v---------+
                                       | assignment_       |
                                       | submissions       |
                                       +-------------------+
```

## 2. Table Specifications

### Identity & Profiles
- **`departments`**: `id` (PK, String), `code` (Unique, String), `name` (String), `hod_id` (Nullable FK to User).
- **`users`**: `id` (PK, UUID String), `email` (Unique, Indexed), `password_hash`, `full_name`, `role` (`student`, `faculty`, `hod`, `super_admin`), `department_id` (FK), `is_active` (Boolean).
- **`student_profiles`**: `id` (PK / FK to User.id, CASCADE), `roll_number` (Unique, Indexed), `department_id` (FK), `semester` (Integer), `academic_year`, `section`, `cgpa` (Float), `phone`, `placement_status` (`Not Ready`, `Preparing`, `Ready`, `Placed`).
- **`faculty_profiles`**: `id` (PK / FK to User.id, CASCADE), `employee_id` (Unique, Indexed), `department_id` (FK), `designation`, `specialization`, `office_room`.

### Academics
- **`courses`**: `id` (PK), `code` (Unique), `name`, `department_id` (FK), `credits`, `semester`.
- **`course_enrollments`**: `id` (PK), `student_id` (FK), `course_id` (FK), `semester`, `status`.
- **`attendance_records`**: `id` (PK), `student_id` (FK), `course_id` (FK), `date` (Indexed String YYYY-MM-DD), `status` (`present`, `absent`, `late`, `excused`), `recorded_by` (FK), `remarks`.
- **`assignments`**: `id` (PK), `course_id` (FK), `faculty_id` (FK), `title`, `description`, `category`, `max_marks`, `due_date`.
- **`assignment_submissions`**: `id` (PK), `assignment_id` (FK), `student_id` (FK), `submitted_at`, `content`, `status`, `marks_obtained`, `feedback`, `graded_by` (FK).
- **`assessment_grades`**: `id` (PK), `student_id` (FK), `course_id` (FK), `assessment_name`, `max_marks`, `marks_obtained`, `letter_grade`, `exam_date`, `semester`.
- **`timetable_entries`**: `id` (PK), `department_id` (FK), `course_id` (FK), `faculty_id` (FK), `day_of_week`, `start_time`, `end_time`, `room_number`.
- **`academic_calendar_events`**: `id` (PK), `title`, `event_type`, `start_date`, `end_date`, `description`.

### Analytics & Interventions
- **`student_success_scores`**: `id` (PK), `student_id` (FK), `overall_score` (0-100), `academic_component`, `attendance_component`, `lms_activity_component`, `extracurricular_component`, `placement_readiness_component`, `skills_feedback_component`, `data_completeness` (%), `is_provisional` (Boolean), `missing_components_json`, `positive_factors_json`, `negative_factors_json`, `recommendations_json`, `methodology_version`.
- **`risk_alerts`**: `id` (PK), `student_id` (FK), `risk_level` (`critical`, `high`, `medium`, `low`), `risk_category`, `evidence_json`, `status` (`open`, `reviewed`, `in_intervention`, `resolved`, `dismissed`), `recommended_action`, `assigned_reviewer_id` (FK), `follow_up_deadline`.
- **`interventions`**: `id` (PK), `student_id` (FK), `risk_alert_id` (FK), `title`, `category`, `goal`, `status` (`pending`, `active`, `follow_up_required`, `completed`), `responsible_staff_id` (FK), `due_date`, `follow_up_date`, `actions_taken`, `observations`, `outcome`.
- **`student_journey_events`**: `id` (PK), `student_id` (FK), `event_type`, `title`, `description`, `timestamp`, `severity`.
- **`skill_placement_profiles`**: `student_id` (PK / FK), `technical_skills_json`, `soft_skills_json`, `coding_score`, `aptitude_score`, `mock_interview_score`, `certifications_count`, `resume_score`, `readiness_percentage`.

### Operations & Audit
- **`import_jobs`**: `id` (PK), `filename`, `file_type`, `sheet_name`, `imported_by` (FK), `total_rows`, `created_count`, `updated_count`, `status`, `errors_json`, `created_at`.
- **`audit_logs`**: `id` (PK), `user_id` (FK), `user_email`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `created_at`.
- **`institution_settings`**: `id` (PK 'default'), `institution_name`, `academic_year`, `current_semester`, `min_attendance_threshold`, `at_risk_grade_threshold`, `weight_academic`, `weight_attendance`, `weight_lms`, `weight_extracurricular`, `weight_placement`, `weight_skills`.

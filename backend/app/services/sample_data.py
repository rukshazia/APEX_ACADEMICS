import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from app.auth import hash_password
from app.models.user import Department, User, StudentProfile, FacultyProfile
from app.models.academic import (
    Course, CourseEnrollment, FacultyAssignment, AttendanceRecord,
    Assignment, AssignmentSubmission, AssessmentGrade, TimetableEntry, AcademicCalendarEvent
)
from app.models.analytics import (
    StudentSuccessScore, RiskAlert, Intervention, StudentJourneyEvent, SkillPlacementProfile
)
from app.models.service import (
    FeeRecord, LeaveRequest, Appointment, Announcement, Notification, NotificationPreference, ExtracurricularActivity
)
from app.models.importer import ImportJob, AuditLog, InstitutionSetting
from app.services.scoring import calculate_student_success_score
from app.services.risk_detection import evaluate_student_risk

def seed_database(db: Session):
    """Populates realistic database records with test accounts for all four user roles."""
    # Check if database already seeded
    if db.query(User).count() > 0:
        ensure_complete_risk_dataset(db)
        return

    print("Seeding initial campus data...")

    # 1. Institution Settings
    setting = InstitutionSetting(
        id="default",
        institution_name="Apex Institute of Technology & Management (AITM)",
        academic_year="2025-2026",
        current_semester=4,
        min_attendance_threshold=75.0,
        at_risk_grade_threshold=60.0,
        weight_academic=0.30,
        weight_attendance=0.20,
        weight_lms=0.10,
        weight_extracurricular=0.10,
        weight_placement=0.20,
        weight_skills=0.10
    )
    db.add(setting)

    # 2. Departments
    dept_cs = Department(id="dept-cs", code="CSE", name="Computer Science & Engineering", description="Department of Computer Science & Artificial Intelligence")
    dept_ece = Department(id="dept-ece", code="ECE", name="Electronics & Communication Engineering", description="Department of Electronics, IoT & Embedded Systems")
    dept_mech = Department(id="dept-mech", code="MECH", name="Mechanical Engineering", description="Department of Mechanical & Robotics Engineering")
    dept_mgmt = Department(id="dept-mgmt", code="MBA", name="Management Studies", description="School of Business & Academic Management")
    db.add_all([dept_cs, dept_ece, dept_mech, dept_mgmt])
    db.flush()

    # 3. Core Role Accounts
    # Super Admin
    admin_user = User(
        id="usr-admin-01",
        email="admin@campus.edu",
        password_hash=hash_password("Admin@123"),
        full_name="Dean Eleanor Vance",
        role="super_admin",
        is_active=True
    )

    # HOD
    hod_user = User(
        id="usr-hod-01",
        email="hod@campus.edu",
        password_hash=hash_password("Hod@123"),
        full_name="Prof. Robert Vance",
        role="hod",
        department_id=dept_cs.id,
        is_active=True
    )
    dept_cs.hod_id = hod_user.id

    # Faculty
    faculty_user = User(
        id="usr-fac-01",
        email="faculty@campus.edu",
        password_hash=hash_password("Faculty@123"),
        full_name="Dr. Sarah Jenkins",
        role="faculty",
        department_id=dept_cs.id,
        is_active=True
    )
    fac_profile = FacultyProfile(
        id=faculty_user.id,
        employee_id="FAC-CS-101",
        department_id=dept_cs.id,
        designation="Associate Professor",
        specialization="Machine Learning & Algorithms",
        office_room="Block B - 402"
    )

    # Primary Student (Alex Rivera)
    student_user = User(
        id="usr-stu-01",
        email="student@campus.edu",
        password_hash=hash_password("Student@123"),
        full_name="Alex Rivera",
        role="student",
        department_id=dept_cs.id,
        is_active=True
    )
    stu_profile = StudentProfile(
        id=student_user.id,
        roll_number="STU2024-001",
        admission_number="ADM-2024-8841",
        department_id=dept_cs.id,
        semester=4,
        academic_year="2025-2026",
        section="A",
        cgpa=8.45,
        phone="+1 555-019-2834",
        guardian_name="Marcus Rivera",
        guardian_phone="+1 555-019-2835",
        placement_status="Preparing"
    )

    db.add_all([admin_user, hod_user, faculty_user, fac_profile, student_user, stu_profile])
    db.flush()

    # 4. Additional Students for realistic analytics & segmentation
    cohort_data = [
        ("usr-stu-02", "Priya Sharma", "priya.sharma@campus.edu", "STU2024-002", dept_cs.id, 4, "A", 9.10, "Ready"),
        ("usr-stu-03", "Liam Chen", "liam.chen@campus.edu", "STU2024-003", dept_cs.id, 4, "A", 6.20, "Preparing"), # At risk student
        ("usr-stu-04", "Emma Watson", "emma.watson@campus.edu", "STU2024-004", dept_cs.id, 4, "B", 7.80, "Preparing"),
        ("usr-stu-05", "David Miller", "david.miller@campus.edu", "STU2024-005", dept_ece.id, 4, "A", 5.40, "Not Ready"), # High risk
        ("usr-stu-06", "Sophia Taylor", "sophia.taylor@campus.edu", "STU2024-006", dept_ece.id, 4, "A", 8.90, "Placed"),
        ("usr-stu-07", "Rohan Gupta", "rohan.gupta@campus.edu", "STU2024-007", dept_mech.id, 4, "A", 7.15, "Preparing"),
        ("usr-stu-08", "Aisha Khan", "aisha.khan@campus.edu", "STU2024-008", dept_mgmt.id, 2, "A", 8.70, "Ready")
    ]

    extra_student_users = []
    for sid, name, email, roll, dept_id, sem, sec, cgpa, p_status in cohort_data:
        u = User(
            id=sid,
            email=email,
            password_hash=hash_password("Student@123"),
            full_name=name,
            role="student",
            department_id=dept_id,
            is_active=True
        )
        p = StudentProfile(
            id=sid,
            roll_number=roll,
            admission_number=f"ADM-2024-{roll[-3:]}",
            department_id=dept_id,
            semester=sem,
            academic_year="2025-2026",
            section=sec,
            cgpa=cgpa,
            phone="+1 555-010-0000",
            guardian_name="Parent of " + name,
            guardian_phone="+1 555-010-1111",
            placement_status=p_status
        )
        db.add_all([u, p])
        extra_student_users.append(u)
    db.flush()

    # 5. Courses
    course_ds = Course(id="crs-cs301", code="CS301", name="Data Structures & Algorithms", department_id=dept_cs.id, credits=4, semester=4, description="Advanced tree structures, graphs, dynamic programming")
    course_db = Course(id="crs-cs302", code="CS302", name="Database Management Systems", department_id=dept_cs.id, credits=3, semester=4, description="Relational algebra, SQL, indexing, transaction processing")
    course_net = Course(id="crs-cs303", code="CS303", name="Computer Networks", department_id=dept_cs.id, credits=3, semester=4, description="OSI model, TCP/IP, routing algorithms, socket programming")
    course_ai = Course(id="crs-cs304", code="CS304", name="Artificial Intelligence & ML", department_id=dept_cs.id, credits=4, semester=4, description="Search strategies, heuristics, neural networks, ethics")
    db.add_all([course_ds, course_db, course_net, course_ai])
    db.flush()

    # Faculty Assignment
    fa1 = FacultyAssignment(faculty_id=faculty_user.id, course_id=course_ds.id, section="A", semester=4)
    fa2 = FacultyAssignment(faculty_id=faculty_user.id, course_id=course_ai.id, section="A", semester=4)
    db.add_all([fa1, fa2])

    # Enrollments for students
    all_students = [student_user] + extra_student_users
    for s in all_students:
        if s.department_id == dept_cs.id:
            for c in [course_ds, course_db, course_net, course_ai]:
                db.add(CourseEnrollment(student_id=s.id, course_id=c.id, semester=4))
    db.flush()

    # 6. Attendance Records (10 class dates)
    dates = [
        "2026-03-01", "2026-03-03", "2026-03-06", "2026-03-08", "2026-03-10",
        "2026-03-13", "2026-03-15", "2026-03-17", "2026-03-20", "2026-03-22"
    ]
    # Alex Rivera: 9 present, 1 absent (90% attendance)
    for i, d in enumerate(dates):
        status = "present" if i != 4 else "absent"
        db.add(AttendanceRecord(student_id=student_user.id, course_id=course_ds.id, date=d, status=status, recorded_by=faculty_user.id))
        db.add(AttendanceRecord(student_id=student_user.id, course_id=course_ai.id, date=d, status="present", recorded_by=faculty_user.id))

    # Liam Chen: 6 absent, 4 present (40% attendance - at risk)
    for i, d in enumerate(dates):
        st = "present" if i in [0, 2, 5, 8] else "absent"
        db.add(AttendanceRecord(student_id="usr-stu-03", course_id=course_ds.id, date=d, status=st, recorded_by=faculty_user.id))

    # Priya Sharma: 10 present (100% attendance)
    for d in dates:
        db.add(AttendanceRecord(student_id="usr-stu-02", course_id=course_ds.id, date=d, status="present", recorded_by=faculty_user.id))
    db.flush()

    # 7. Assignments and Submissions
    now = datetime.now(timezone.utc)
    a1 = Assignment(
        id="asg-01",
        course_id=course_ds.id,
        faculty_id=faculty_user.id,
        title="Implementation of Balanced AVL Trees & Red-Black Trees",
        description="Write a clean C++/Python implementation with deletion rebalancing.",
        category="Homework",
        max_marks=100.0,
        due_date=now - timedelta(days=5)
    )
    a2 = Assignment(
        id="asg-02",
        course_id=course_ai.id,
        faculty_id=faculty_user.id,
        title="Heuristic Search: A* Algorithm with Manhattan Distance",
        description="Implement 8-puzzle solver comparing Greedy Best-First vs A*.",
        category="Project",
        max_marks=100.0,
        due_date=now + timedelta(days=4)
    )
    db.add_all([a1, a2])
    db.flush()

    # Submissions for a1
    sub1 = AssignmentSubmission(
        assignment_id=a1.id,
        student_id=student_user.id,
        submitted_at=now - timedelta(days=6),
        content="Submitted full AVL tree code with benchmark tests.",
        status="graded",
        marks_obtained=92.0,
        feedback="Excellent balance test cases and clear complexity documentation.",
        graded_by=faculty_user.id
    )
    # Liam Chen missed a1 (no submission - at risk evidence)
    sub2 = AssignmentSubmission(
        assignment_id=a1.id,
        student_id="usr-stu-02",
        submitted_at=now - timedelta(days=7),
        status="graded",
        marks_obtained=98.0,
        feedback="Flawless code.",
        graded_by=faculty_user.id
    )
    db.add_all([sub1, sub2])

    # 8. Assessment Grades
    g1 = AssessmentGrade(
        student_id=student_user.id,
        course_id=course_ds.id,
        assessment_name="Continuous Assessment 1",
        max_marks=100.0,
        marks_obtained=88.0,
        letter_grade="A",
        exam_date="2026-02-20",
        semester=4,
        faculty_id=faculty_user.id
    )
    g2 = AssessmentGrade(
        student_id=student_user.id,
        course_id=course_ai.id,
        assessment_name="Midterm Examination",
        max_marks=100.0,
        marks_obtained=84.0,
        letter_grade="A",
        exam_date="2026-03-05",
        semester=4,
        faculty_id=faculty_user.id
    )
    # Liam Chen low grades
    g3 = AssessmentGrade(
        student_id="usr-stu-03",
        course_id=course_ds.id,
        assessment_name="Continuous Assessment 1",
        max_marks=100.0,
        marks_obtained=42.0,
        letter_grade="F",
        exam_date="2026-02-20",
        semester=4,
        faculty_id=faculty_user.id
    )
    db.add_all([g1, g2, g3])

    # 9. Student Success Scores
    # Alex Rivera
    score_alex = calculate_student_success_score(
        academic_pct=86.0,
        attendance_pct=95.0,
        lms_activity_pct=90.0,
        extracurricular_pct=85.0,
        placement_readiness_pct=80.0,
        skills_feedback_pct=85.0
    )
    db.add(StudentSuccessScore(
        student_id=student_user.id,
        overall_score=score_alex["overall_score"],
        academic_component=score_alex["components"]["academic"],
        attendance_component=score_alex["components"]["attendance"],
        lms_activity_component=score_alex["components"]["lms"],
        extracurricular_component=score_alex["components"]["extracurricular"],
        placement_readiness_component=score_alex["components"]["placement"],
        skills_feedback_component=score_alex["components"]["skills"],
        data_completeness=score_alex["data_completeness"],
        is_provisional=score_alex["is_provisional"],
        missing_components_json=json.dumps(score_alex["missing_components"]),
        positive_factors_json=json.dumps(score_alex["positive_factors"]),
        negative_factors_json=json.dumps(score_alex["negative_factors"]),
        recommendations_json=json.dumps(score_alex["recommendations"]),
        methodology_version="v1.0"
    ))

    # Liam Chen (At-Risk student with low score)
    score_liam = calculate_student_success_score(
        academic_pct=42.0,
        attendance_pct=40.0,
        lms_activity_pct=30.0,
        extracurricular_pct=20.0,
        placement_readiness_pct=35.0,
        skills_feedback_pct=40.0
    )
    db.add(StudentSuccessScore(
        student_id="usr-stu-03",
        overall_score=score_liam["overall_score"],
        academic_component=score_liam["components"]["academic"],
        attendance_component=score_liam["components"]["attendance"],
        lms_activity_component=score_liam["components"]["lms"],
        extracurricular_component=score_liam["components"]["extracurricular"],
        placement_readiness_component=score_liam["components"]["placement"],
        skills_feedback_component=score_liam["components"]["skills"],
        data_completeness=score_liam["data_completeness"],
        is_provisional=score_liam["is_provisional"],
        missing_components_json=json.dumps(score_liam["missing_components"]),
        positive_factors_json=json.dumps(score_liam["positive_factors"]),
        negative_factors_json=json.dumps(score_liam["negative_factors"]),
        recommendations_json=json.dumps(score_liam["recommendations"]),
        methodology_version="v1.0"
    ))

    # 10. Risk Alerts
    risk_liam = evaluate_student_risk(
        student_id="usr-stu-03",
        attendance_pct=40.0,
        recent_grades=[42.0],
        missing_assignments_count=2,
        consecutive_absences=4,
        min_attendance_threshold=75.0,
        academic_warning_threshold=60.0
    )
    if risk_liam:
        alert_liam = RiskAlert(
            id="alt-01",
            student_id="usr-stu-03",
            risk_level=risk_liam["risk_level"],
            risk_category=risk_liam["risk_category"],
            evidence_json=json.dumps(risk_liam["evidence"]),
            status="in_intervention",
            priority=risk_liam["priority"],
            recommended_action=risk_liam["recommended_action"],
            assigned_reviewer_id=faculty_user.id,
            follow_up_deadline=risk_liam["follow_up_deadline"],
            review_notes="Discussed with student. Follow-up study plan established."
        )
        db.add(alert_liam)
        db.flush()

        # 11. Intervention Record
        interv = Intervention(
            id="int-01",
            student_id="usr-stu-03",
            risk_alert_id=alert_liam.id,
            title="Attendance Recovery & Data Structures Peer Mentoring",
            category="Subject Tutoring",
            goal="Improve CS301 assessment average to 65% and maintain 85%+ attendance in upcoming month.",
            status="active",
            responsible_staff_id=faculty_user.id,
            due_date=(now + timedelta(days=14)).strftime("%Y-%m-%d"),
            follow_up_date=(now + timedelta(days=7)).strftime("%Y-%m-%d"),
            actions_taken="Paired with senior peer tutor for tree traversal algorithms.",
            observations="Student attended initial counseling session with enthusiasm.",
            outcome="pending"
        )
        db.add(interv)

    # 12. Student Journey Events
    journey_events = [
        (student_user.id, "enrollment", "Orientation & Enrollment Complete", "Successfully enrolled in B.Tech Computer Science & Engineering.", now - timedelta(days=240), "info"),
        (student_user.id, "academic", "Semester 3 Dean's Commendation", "Achieved SGPA 8.62 in Semester 3 examinations.", now - timedelta(days=90), "success"),
        (student_user.id, "activity", "Hackathon Finalist Award", "Secured 2nd Runner Up at Annual Inter-College Smart Campus Hackathon.", now - timedelta(days=45), "accent"),
        (student_user.id, "grade", "Continuous Assessment 1 - Grade A", "Scored 88/100 in Data Structures & Algorithms assessment.", now - timedelta(days=15), "info"),
        (student_user.id, "placement", "Technical Mock Interview Cleared", "Completed Level 2 Algorithms and System Design mock interview with positive rating.", now - timedelta(days=3), "success")
    ]
    for sid, ev_type, title, desc, ts, sev in journey_events:
        db.add(StudentJourneyEvent(student_id=sid, event_type=ev_type, title=title, description=desc, timestamp=ts, severity=sev))

    # 13. Skill Placement Profiles
    tech_skills_alex = [
        {"skill": "Python", "level": "Advanced", "verified": True},
        {"skill": "Data Structures & Algorithms", "level": "Advanced", "verified": True},
        {"skill": "SQL & PostgreSQL", "level": "Intermediate", "verified": True},
        {"skill": "React & TypeScript", "level": "Intermediate", "verified": True}
    ]
    soft_skills_alex = [
        {"skill": "Analytical Problem Solving", "rating": "5/5"},
        {"skill": "Team Collaboration", "rating": "4.5/5"},
        {"skill": "Technical Presentation", "rating": "4/5"}
    ]
    db.add(SkillPlacementProfile(
        student_id=student_user.id,
        technical_skills_json=json.dumps(tech_skills_alex),
        soft_skills_json=json.dumps(soft_skills_alex),
        coding_score=88.0,
        aptitude_score=82.0,
        mock_interview_score=80.0,
        certifications_count=3,
        resume_score=85.0,
        readiness_percentage=84.0,
        missing_evidence_json=json.dumps(["Cloud architecture certification (AWS/GCP) pending"]),
        recommendations_json=json.dumps(["Complete AWS Cloud Practitioner certification", "Practice dynamic programming problems"])
    ))

    # 14. Fee Record
    db.add(FeeRecord(
        student_id=student_user.id,
        semester=4,
        academic_year="2025-2026",
        total_amount=4500.0,
        paid_amount=4500.0,
        due_date="2026-01-15",
        status="paid",
        category="Semester 4 Tuition & Lab Infrastructure"
    ))
    db.add(FeeRecord(
        student_id="usr-stu-03",
        semester=4,
        academic_year="2025-2026",
        total_amount=4500.0,
        paid_amount=2000.0,
        due_date="2026-03-31",
        status="partial",
        category="Semester 4 Tuition Fee"
    ))

    # 15. Leave Requests
    db.add(LeaveRequest(
        student_id=student_user.id,
        leave_type="Academic Event",
        start_date="2026-04-02",
        end_date="2026-04-04",
        reason="Attending National Tech Symposium representing College Robotics Club.",
        status="approved",
        reviewed_by=faculty_user.id,
        review_comment="Approved. Ensure course assignments for CS304 are submitted prior."
    ))

    # 16. Appointments
    db.add(Appointment(
        student_id=student_user.id,
        faculty_id=faculty_user.id,
        topic="Guidance on Final Capstone Project Proposal (AI & Campus Analytics)",
        appointment_date="2026-03-28",
        time_slot="14:00 - 14:30",
        status="scheduled",
        notes="Please bring draft architecture and dataset diagram."
    ))

    # 17. Announcements
    db.add(Announcement(
        title="Mid-Term Assessment Schedule & Guidelines Published",
        content="The official timetable for Mid-Term Assessments for Semester 4 is now available in the portal. Please review hall allocations.",
        target_role="all",
        priority="important",
        created_by=admin_user.id
    ))
    db.add(Announcement(
        title="Campus Placement Drive - Registration Open for Tech Cohort",
        content="Registrations are now open for upcoming campus interviews. Students must have an updated resume and verified skill scores.",
        target_role="student",
        priority="urgent",
        created_by=hod_user.id,
        department_id=dept_cs.id
    ))

    # 18. Notifications
    db.add(Notification(
        user_id=student_user.id,
        title="Assignment Graded",
        message="Your submission for 'Implementation of Balanced AVL Trees' was graded: 92/100.",
        category="academic",
        is_read=False,
        link="/academics/assignments"
    ))
    db.add(Notification(
        user_id=student_user.id,
        title="Appointment Confirmed",
        message="Your meeting with Dr. Sarah Jenkins is scheduled for March 28 at 14:00.",
        category="service",
        is_read=True,
        link="/services/appointments"
    ))
    db.add(NotificationPreference(user_id=student_user.id))

    # 19. Extracurricular Activity
    db.add(ExtracurricularActivity(
        student_id=student_user.id,
        title="Open Source Software & AI Club",
        category="Technical Club",
        role="Vice President & Tech Lead",
        hours_logged=45,
        achievements="Organized 2 weekend workshops on Machine Learning; 120 attendees.",
        verified=True
    ))

    # 20. Timetable Entries
    db.add(TimetableEntry(
        department_id=dept_cs.id,
        course_id=course_ds.id,
        faculty_id=faculty_user.id,
        semester=4,
        section="A",
        day_of_week="Monday",
        start_time="09:00",
        end_time="10:00",
        room_number="Lecture Hall 204"
    ))
    db.add(TimetableEntry(
        department_id=dept_cs.id,
        course_id=course_ai.id,
        faculty_id=faculty_user.id,
        semester=4,
        section="A",
        day_of_week="Monday",
        start_time="10:15",
        end_time="11:15",
        room_number="CS Lab 3"
    ))
    db.add(TimetableEntry(
        department_id=dept_cs.id,
        course_id=course_db.id,
        faculty_id=faculty_user.id,
        semester=4,
        section="A",
        day_of_week="Wednesday",
        start_time="11:30",
        end_time="12:30",
        room_number="Lecture Hall 204"
    ))

    # 21. Academic Calendar
    db.add(AcademicCalendarEvent(
        title="Mid-Term Assessment Week",
        event_type="exam",
        start_date="2026-04-10",
        end_date="2026-04-16",
        description="Continuous assessment written and lab examinations."
    ))
    db.add(AcademicCalendarEvent(
        title="Spring Break / Academic Recess",
        event_type="holiday",
        start_date="2026-04-17",
        end_date="2026-04-21",
        description="Institutional holiday."
    ))

    # 22. Seeded Import Job
    db.add(ImportJob(
        filename="cohort_2025_enrolled_students.xlsx",
        file_type="xlsx",
        sheet_name="Students_Roster",
        imported_by=admin_user.id,
        total_rows=8,
        created_count=8,
        updated_count=0,
        skipped_count=0,
        rejected_count=0,
        status="completed",
        errors_json="[]"
    ))

    # 23. Audit Log
    db.add(AuditLog(
        user_id=admin_user.id,
        user_email=admin_user.email,
        action="SYSTEM_INIT",
        resource_type="system",
        resource_id="aitm-core",
        details="Initial system deployment and seed configuration verified.",
        ip_address="127.0.0.1"
    ))

    db.commit()
    print("Database seeding completed successfully.")
    ensure_complete_risk_dataset(db)


def ensure_complete_risk_dataset(db: Session):
    """
    Guarantees that the student population contains complete, realistic academic,
    attendance, and assignment records covering LOW, MODERATE, HIGH, VERY_HIGH,
    CRITICAL, and INSUFFICIENT_DATA categories across departments.
    """
    now = datetime.now(timezone.utc)
    dept_cs = db.query(Department).filter(Department.code == "CSE").first()
    dept_ece = db.query(Department).filter(Department.code == "ECE").first()
    dept_mech = db.query(Department).filter(Department.code == "MECH").first()
    dept_mgmt = db.query(Department).filter(Department.code == "MBA").first()
    faculty_user = db.query(User).filter(User.role == "faculty").first()

    if not dept_cs or not faculty_user:
        return

    # 1. Add extra students (Marcus Vance in MECH, Chloe Bennett in CSE) if missing
    if not db.query(User).filter(User.id == "usr-stu-09").first():
        u9 = User(
            id="usr-stu-09",
            email="marcus.vance@campus.edu",
            password_hash=hash_password("Student@123"),
            full_name="Marcus Vance",
            role="student",
            department_id=dept_mech.id if dept_mech else dept_cs.id,
            is_active=True
        )
        p9 = StudentProfile(
            id="usr-stu-09",
            roll_number="STU2024-009",
            admission_number="ADM-2024-009",
            department_id=dept_mech.id if dept_mech else dept_cs.id,
            semester=4,
            academic_year="2025-2026",
            section="A",
            cgpa=5.20,
            phone="+1 555-010-0009",
            guardian_name="Parent of Marcus Vance",
            guardian_phone="+1 555-010-1109",
            placement_status="Not Ready"
        )
        db.add_all([u9, p9])

    if not db.query(User).filter(User.id == "usr-stu-10").first():
        u10 = User(
            id="usr-stu-10",
            email="chloe.bennett@campus.edu",
            password_hash=hash_password("Student@123"),
            full_name="Chloe Bennett",
            role="student",
            department_id=dept_cs.id,
            is_active=True
        )
        p10 = StudentProfile(
            id="usr-stu-10",
            roll_number="STU2024-010",
            admission_number="ADM-2024-010",
            department_id=dept_cs.id,
            semester=4,
            academic_year="2025-2026",
            section="A",
            cgpa=7.40,
            phone="+1 555-010-0010",
            guardian_name="Parent of Chloe Bennett",
            guardian_phone="+1 555-010-1110",
            placement_status="Preparing"
        )
        db.add_all([u10, p10])

    db.flush()

    # Ensure Aisha Khan (usr-stu-08) is correctly set to 0.0 CGPA to represent genuine new enrollee with insufficient data
    stu8_prof = db.query(StudentProfile).filter(StudentProfile.id == "usr-stu-08").first()
    if stu8_prof:
        stu8_prof.cgpa = 0.0

    # 2. Add extra department courses if missing
    crs_ece = db.query(Course).filter(Course.code == "EC301").first()
    if not crs_ece and dept_ece:
        crs_ece = Course(
            id="crs-ec301",
            code="EC301",
            name="Digital Signal Processing",
            department_id=dept_ece.id,
            credits=4,
            semester=4,
            description="Fourier analysis, discrete systems, filter designs"
        )
        db.add(crs_ece)

    crs_mech = db.query(Course).filter(Course.code == "ME301").first()
    if not crs_mech and dept_mech:
        crs_mech = Course(
            id="crs-me301",
            code="ME301",
            name="Applied Thermodynamics",
            department_id=dept_mech.id,
            credits=4,
            semester=4,
            description="Thermal systems, steam power cycles, refrigeration"
        )
        db.add(crs_mech)

    crs_cs301 = db.query(Course).filter(Course.code == "CS301").first()
    crs_cs304 = db.query(Course).filter(Course.code == "CS304").first()
    db.flush()

    # 3. Enrollments
    def ensure_enrollment(stu_id: str, crs_id: str):
        enr = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == stu_id,
            CourseEnrollment.course_id == crs_id
        ).first()
        if not enr:
            db.add(CourseEnrollment(student_id=stu_id, course_id=crs_id, semester=4, status="active"))

    if crs_cs301:
        for sid in ["usr-stu-01", "usr-stu-02", "usr-stu-03", "usr-stu-04", "usr-stu-10"]:
            ensure_enrollment(sid, crs_cs301.id)
    if crs_cs304:
        for sid in ["usr-stu-01", "usr-stu-02", "usr-stu-03", "usr-stu-04", "usr-stu-10"]:
            ensure_enrollment(sid, crs_cs304.id)
    if crs_ece:
        for sid in ["usr-stu-05", "usr-stu-06"]:
            ensure_enrollment(sid, crs_ece.id)
    if crs_mech:
        for sid in ["usr-stu-07", "usr-stu-09"]:
            ensure_enrollment(sid, crs_mech.id)

    db.flush()

    # 4. Dates for Attendance Sessions
    dates = [
        "2026-03-01", "2026-03-03", "2026-03-06", "2026-03-08", "2026-03-10",
        "2026-03-13", "2026-03-15", "2026-03-17", "2026-03-20", "2026-03-22"
    ]

    def set_student_attendance(stu_id: str, crs_id: str, absent_indices: List[int]):
        existing_count = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == stu_id,
            AttendanceRecord.course_id == crs_id
        ).count()
        if existing_count < 10:
            # Delete any partial records to create clean set
            db.query(AttendanceRecord).filter(
                AttendanceRecord.student_id == stu_id,
                AttendanceRecord.course_id == crs_id
            ).delete()
            for i, d in enumerate(dates):
                status = "absent" if i in absent_indices else "present"
                db.add(AttendanceRecord(
                    student_id=stu_id,
                    course_id=crs_id,
                    date=d,
                    status=status,
                    recorded_by=faculty_user.id
                ))

    # usr-stu-02 Priya Sharma: 100% attendance (0 absent)
    if crs_cs301:
        set_student_attendance("usr-stu-02", crs_cs301.id, [])
    # usr-stu-04 Emma Watson: 70% attendance (absent at 6, 8, 9)
    if crs_cs301:
        set_student_attendance("usr-stu-04", crs_cs301.id, [6, 8, 9])
    # usr-stu-10 Chloe Bennett: 80% attendance (absent at 4, 7)
    if crs_cs301:
        set_student_attendance("usr-stu-10", crs_cs301.id, [4, 7])
    # usr-stu-05 David Miller: 50% attendance (absent at 1, 3, 7, 8, 9)
    if crs_ece:
        set_student_attendance("usr-stu-05", crs_ece.id, [1, 3, 7, 8, 9])
    # usr-stu-06 Sophia Taylor: 90% attendance (absent at 5)
    if crs_ece:
        set_student_attendance("usr-stu-06", crs_ece.id, [5])
    # usr-stu-07 Rohan Gupta: 80% attendance (absent at 2, 7)
    if crs_mech:
        set_student_attendance("usr-stu-07", crs_mech.id, [2, 7])
    # usr-stu-09 Marcus Vance: 60% attendance (absent at 0, 3, 6, 8)
    if crs_mech:
        set_student_attendance("usr-stu-09", crs_mech.id, [0, 3, 6, 8])

    db.flush()

    # 5. Assessment Grades
    def set_student_grades(stu_id: str, crs_id: str, ca1_score: float, midterm_score: float):
        existing = db.query(AssessmentGrade).filter(
            AssessmentGrade.student_id == stu_id,
            AssessmentGrade.course_id == crs_id
        ).all()
        if not existing:
            g1 = AssessmentGrade(
                student_id=stu_id,
                course_id=crs_id,
                assessment_name="Continuous Assessment 1",
                max_marks=100.0,
                marks_obtained=ca1_score,
                letter_grade="A" if ca1_score >= 80 else "B" if ca1_score >= 65 else "C" if ca1_score >= 50 else "F",
                exam_date="2026-02-20",
                semester=4,
                faculty_id=faculty_user.id
            )
            g2 = AssessmentGrade(
                student_id=stu_id,
                course_id=crs_id,
                assessment_name="Midterm Examination",
                max_marks=100.0,
                marks_obtained=midterm_score,
                letter_grade="A" if midterm_score >= 80 else "B" if midterm_score >= 65 else "C" if midterm_score >= 50 else "F",
                exam_date="2026-03-05",
                semester=4,
                faculty_id=faculty_user.id
            )
            db.add_all([g1, g2])

    if crs_cs301:
        set_student_grades("usr-stu-02", crs_cs301.id, 96.0, 94.0)
        set_student_grades("usr-stu-04", crs_cs301.id, 58.0, 54.0)
        set_student_grades("usr-stu-10", crs_cs301.id, 74.0, 76.0)
    if crs_ece:
        set_student_grades("usr-stu-05", crs_ece.id, 46.0, 42.0)
        set_student_grades("usr-stu-06", crs_ece.id, 88.0, 86.0)
    if crs_mech:
        set_student_grades("usr-stu-07", crs_mech.id, 68.0, 72.0)
        set_student_grades("usr-stu-09", crs_mech.id, 52.0, 48.0)

    db.flush()

    # 6. Assignments and Submissions
    asg1 = db.query(Assignment).filter(Assignment.id == "asg-01").first()
    if asg1:
        def ensure_submission(stu_id: str, marks: Optional[float]):
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == asg1.id,
                AssignmentSubmission.student_id == stu_id
            ).first()
            if not sub and marks is not None:
                db.add(AssignmentSubmission(
                    assignment_id=asg1.id,
                    student_id=stu_id,
                    submitted_at=now - timedelta(days=6),
                    status="graded",
                    marks_obtained=marks,
                    graded_by=faculty_user.id
                ))

        ensure_submission("usr-stu-10", 78.0)

    # 7. Sync RiskAlerts for elevated risk students
    from app.services.risk_scoring import evaluate_student_risk_assessment
    students = db.query(User).filter(User.role == "student", User.is_active == True).all()
    for s in students:
        assessment = evaluate_student_risk_assessment(s.id, db)
        cat = assessment["risk_category"]
        if cat in ["HIGH", "VERY_HIGH", "CRITICAL"]:
            alert = db.query(RiskAlert).filter(RiskAlert.student_id == s.id).first()
            if not alert:
                db.add(RiskAlert(
                    student_id=s.id,
                    risk_level=cat.lower(),
                    risk_category="academic_and_attendance_risk" if cat == "CRITICAL" else "attendance_shortage",
                    evidence_json=json.dumps(assessment["evidence"]),
                    status="in_intervention" if s.id == "usr-stu-03" else "open",
                    priority="high" if cat in ["CRITICAL", "VERY_HIGH"] else "medium",
                    recommended_action=assessment["recommendations"][0] if assessment["recommendations"] else "Conduct academic review.",
                    assigned_reviewer_id=faculty_user.id,
                    follow_up_deadline=(now + timedelta(days=7)).strftime("%Y-%m-%d")
                ))

    db.commit()
    print("Complete institution-wide risk dataset verified and populated.")


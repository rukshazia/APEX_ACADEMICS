export type UserRole = 'student' | 'faculty' | 'hod' | 'super_admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string | null;
  department_name?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  profile?: Record<string, any>;
}

export interface StudentProfile {
  id: string;
  roll_number: string;
  admission_number?: string;
  full_name: string;
  email: string;
  department_id?: string;
  department_name?: string;
  department_code?: string;
  semester: number;
  academic_year: string;
  section: string;
  cgpa: number;
  phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
  placement_status: 'Not Ready' | 'Preparing' | 'Ready' | 'Placed';
  is_provisional: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  hod_id?: string;
  hod_name?: string;
  student_count?: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department_id: string;
  credits: number;
  semester: number;
  description?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  course_id: string;
  course_name?: string;
  course_code?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export interface AttendanceSummary {
  student_id: string;
  total_classes: number;
  attended_classes: number;
  absent_classes: number;
  overall_percentage: number;
  is_below_threshold: boolean;
  courses: {
    course_id: string;
    course_name: string;
    course_code: string;
    total: number;
    present: number;
    percentage: number;
    is_below_threshold: boolean;
  }[];
}

export interface Assignment {
  id: string;
  course_id: string;
  course_name?: string;
  course_code?: string;
  faculty_name?: string;
  title: string;
  description?: string;
  category: string;
  max_marks: number;
  due_date: string;
  created_at?: string;
  submission_status?: string;
  submission_marks?: number | null;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  submitted_at: string;
  content: string;
  file_url?: string;
  status: string;
  marks_obtained?: number | null;
  feedback?: string | null;
}

export interface AssessmentGrade {
  id: string;
  student_id: string;
  student_name?: string;
  course_id: string;
  course_name?: string;
  course_code?: string;
  assessment_name: string;
  max_marks: number;
  marks_obtained: number;
  letter_grade: string;
  percentage: number;
  exam_date?: string;
  semester: number;
}

export interface StudentSuccessScore {
  student_id: string;
  overall_score: number;
  data_completeness: number;
  is_provisional: boolean;
  components: {
    academic?: number | null;
    attendance?: number | null;
    lms?: number | null;
    extracurricular?: number | null;
    placement?: number | null;
    skills?: number | null;
  };
  missing_components: string[];
  positive_factors: string[];
  negative_factors: string[];
  recommendations: string[];
  methodology_version: string;
  calculated_at: string;
}

export interface RiskAlert {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  department_name?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_category: string;
  priority: string;
  evidence: string[];
  recommended_action?: string;
  assigned_reviewer_id?: string;
  assigned_reviewer_name?: string;
  follow_up_deadline?: string;
  status: 'open' | 'reviewed' | 'in_intervention' | 'resolved' | 'dismissed';
  review_notes?: string;
  detected_at: string;
}

export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  risk_alert_id?: string;
  title: string;
  category: string;
  goal: string;
  status: 'pending' | 'active' | 'follow_up_required' | 'completed' | 'cancelled';
  responsible_staff_id: string;
  responsible_staff_name?: string;
  due_date?: string;
  follow_up_date?: string;
  actions_taken?: string;
  observations?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentJourneyEvent {
  id: string;
  student_id: string;
  event_type: string;
  title: string;
  description?: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'danger' | 'accent';
}

export interface PlacementProfile {
  student_id: string;
  technical_skills: { skill: string; level: string; verified?: boolean }[];
  soft_skills: { skill: string; rating: string }[];
  coding_score: number;
  aptitude_score: number;
  mock_interview_score: number;
  certifications_count: number;
  resume_score: number;
  readiness_percentage: number;
  missing_evidence: string[];
  recommendations: string[];
}

export interface FeeRecord {
  id: string;
  student_id: string;
  student_name?: string;
  roll_number?: string;
  semester: number;
  academic_year: string;
  category: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  due_date: string;
  status: 'paid' | 'partial' | 'overdue' | 'unpaid';
}

export interface LeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by_name?: string;
  review_comment?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  student_id: string;
  student_name: string;
  faculty_id: string;
  faculty_name: string;
  topic: string;
  appointment_date: string;
  time_slot: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  target_role: string;
  priority: 'normal' | 'important' | 'urgent';
  department_id?: string;
  created_by_name: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface TimetableEntry {
  id: string;
  course_id: string;
  course_name?: string;
  course_code?: string;
  faculty_name?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number: string;
  semester: number;
  section: string;
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  event_type: string;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  file_type: string;
  sheet_name?: string;
  imported_by_name: string;
  total_rows: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  rejected_count: number;
  status: string;
  errors: any[];
  created_at: string;
}

export interface InstitutionSettings {
  institution_name: string;
  academic_year: string;
  current_semester: number;
  min_attendance_threshold: number;
  at_risk_grade_threshold: number;
  weights: {
    academic: number;
    attendance: number;
    lms: number;
    extracurricular: number;
    placement: number;
    skills: number;
  };
  updated_at: string;
}

export interface AskDataResponse {
  question: string;
  answer: string;
  provider: string;
  metrics: Record<string, any>;
  confidence: string;
  evidence: string[];
}

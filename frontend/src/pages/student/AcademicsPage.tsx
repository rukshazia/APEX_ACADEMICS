import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Upload,
  Send,
} from 'lucide-react';

export const AcademicsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'grades' | 'timetable'>('attendance');
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment submission modal state
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [attRecs, attSum, asgs, grds, tt, cal] = await Promise.all([
        api.academics.getAttendance({ student_id: user.id }),
        api.academics.getAttendanceSummary(user.id),
        api.academics.getAssignments(),
        api.academics.getGrades({ student_id: user.id }),
        api.academics.getTimetable({ semester: 4 }),
        api.academics.getCalendar(),
      ]);
      setAttendanceRecords(attRecs);
      setAttendanceSummary(attSum);
      setAssignments(asgs);
      setGrades(grds);
      setTimetable(tt);
      setCalendarEvents(cal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      await api.academics.submitAssignment(selectedAssignment.id, {
        content: submissionContent,
        file_url: null,
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setSelectedAssignment(null);
        setSubmissionContent('');
        loadData();
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading academic records...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Academics & Performance</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Attendance records, assignments, assessment results, and academic schedules
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brd space-x-6">
        {[
          { key: 'attendance', label: 'Attendance' },
          { key: 'assignments', label: 'Assignments' },
          { key: 'grades', label: 'Grades & Assessments' },
          { key: 'timetable', label: 'Timetable & Calendar' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-txt-muted uppercase font-semibold">Overall Attendance Standing</p>
              <div className="flex items-baseline space-x-3 mt-1">
                <span className="text-3xl font-bold text-txt-primary">
                  {attendanceSummary?.overall_percentage || 0}%
                </span>
                <span className="text-xs text-txt-secondary">
                  ({attendanceSummary?.attended_classes || 0} of {attendanceSummary?.total_classes || 0} sessions attended)
                </span>
              </div>
            </div>
            <Badge variant={attendanceSummary?.is_below_threshold ? 'danger' : 'success'}>
              {attendanceSummary?.is_below_threshold
                ? 'Below Minimum Requirement (75%)'
                : 'Meets Institutional Policy (≥ 75%)'}
            </Badge>
          </div>

          {/* Course Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {attendanceSummary?.courses?.map((c: any) => (
              <div key={c.course_id} className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">{c.course_code}</span>
                  <Badge variant={c.is_below_threshold ? 'danger' : 'success'}>
                    {c.percentage}%
                  </Badge>
                </div>
                <p className="text-xs text-txt-secondary mt-1 truncate">{c.course_name}</p>
                <p className="text-[11px] text-txt-muted mt-2">
                  {c.present} / {c.total} classes attended
                </p>
              </div>
            ))}
          </div>

          {/* Date-wise Log Table */}
          <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-brd">
              <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">Attendance Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Course</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brd-subtle">
                  {attendanceRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-bg-highlight/50 transition-colors">
                      <td className="px-6 py-3 text-txt-primary font-medium">{r.date}</td>
                      <td className="px-6 py-3 text-txt-secondary">
                        {r.course_code} - {r.course_name}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant={
                            r.status === 'present'
                              ? 'success'
                              : r.status === 'absent'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {r.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-txt-muted">{r.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((asg) => (
              <div key={asg.id} className="bg-white p-5 rounded-xl border border-brd shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-medium text-brand-blue">{asg.course_code}</span>
                      <h3 className="text-sm font-semibold text-txt-primary mt-0.5">{asg.title}</h3>
                    </div>
                    <Badge variant={asg.submission_status === 'graded' ? 'success' : asg.submission_status === 'submitted' ? 'info' : 'warning'}>
                      {asg.submission_status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </div>
                  <p className="text-xs text-txt-secondary mt-2 line-clamp-3">{asg.description}</p>
                  <div className="mt-4 pt-3 border-t border-brd flex items-center justify-between text-[11px] text-txt-muted">
                    <span>Due: {new Date(asg.due_date).toLocaleDateString()}</span>
                    <span>Max Marks: {asg.max_marks}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex items-center justify-between">
                  {asg.submission_marks !== null && asg.submission_marks !== undefined ? (
                    <span className="text-xs font-semibold text-status-success">
                      Graded: {asg.submission_marks} / {asg.max_marks}
                    </span>
                  ) : (
                    <span className="text-xs text-txt-muted">No marks recorded yet</span>
                  )}
                  <button
                    onClick={() => setSelectedAssignment(asg)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
                  >
                    {asg.submission_status === 'unsubmitted' ? 'Submit Assignment' : 'Update Submission'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRADES */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-brd">
            <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">Assessment Grades</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                <tr>
                  <th className="px-6 py-3 font-semibold">Course</th>
                  <th className="px-6 py-3 font-semibold">Assessment Title</th>
                  <th className="px-6 py-3 font-semibold">Score Obtained</th>
                  <th className="px-6 py-3 font-semibold">Percentage</th>
                  <th className="px-6 py-3 font-semibold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brd-subtle">
                {grades.map((g) => (
                  <tr key={g.id} className="hover:bg-bg-highlight/50 transition-colors">
                    <td className="px-6 py-3 text-txt-primary font-medium">{g.course_code} - {g.course_name}</td>
                    <td className="px-6 py-3 text-txt-secondary">{g.assessment_name}</td>
                    <td className="px-6 py-3 text-txt-primary font-semibold">
                      {g.marks_obtained} / {g.max_marks}
                    </td>
                    <td className="px-6 py-3 text-txt-secondary">{g.percentage}%</td>
                    <td className="px-6 py-3">
                      <Badge variant={g.letter_grade === 'A' || g.letter_grade === 'A+' ? 'success' : 'accent'}>
                        {g.letter_grade}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TIMETABLE & CALENDAR */}
      {activeTab === 'timetable' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timetable */}
          <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
            <h3 className="text-sm font-semibold text-txt-primary mb-4">Weekly Lecture Timetable</h3>
            <div className="space-y-3">
              {timetable.map((t) => (
                <div key={t.id} className="p-3.5 rounded-lg bg-bg-highlight border border-brd">
                  <div className="flex items-center justify-between text-xs font-semibold text-txt-primary">
                    <span>{t.course_name} ({t.course_code})</span>
                    <Badge variant="neutral">{t.day_of_week}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-txt-muted mt-1.5">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {t.start_time} - {t.end_time}
                    </span>
                    <span>Room: {t.room_number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
            <h3 className="text-sm font-semibold text-txt-primary mb-4">Academic Calendar & Events</h3>
            <div className="space-y-3">
              {calendarEvents.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-lg border border-brd">
                  <div className="flex items-center justify-between text-xs font-semibold text-txt-primary">
                    <span>{ev.title}</span>
                    <Badge variant={ev.event_type === 'exam' ? 'warning' : 'accent'}>
                      {ev.event_type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-txt-muted mt-1">
                    Dates: {ev.start_date} to {ev.end_date}
                  </p>
                  {ev.description && <p className="text-xs text-txt-secondary mt-1">{ev.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        title={selectedAssignment ? `Submit: ${selectedAssignment.title}` : ''}
        subtitle={selectedAssignment ? `Course: ${selectedAssignment.course_code}` : ''}
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4">
          {submitSuccess && (
            <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Assignment submitted successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">
              Submission Text & Solution Notes
            </label>
            <textarea
              required
              rows={5}
              value={submissionContent}
              onChange={(e) => setSubmissionContent(e.target.value)}
              placeholder="Enter your answers, repository link, code snippet, or explanation..."
              className="w-full text-xs p-3 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setSelectedAssignment(null)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Uploading...' : 'Confirm Submission'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

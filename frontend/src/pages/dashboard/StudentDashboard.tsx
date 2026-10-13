import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [successScore, setSuccessScore] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [att, score, asgs, anns, tt] = await Promise.all([
          api.academics.getAttendanceSummary(user.id),
          api.analytics.getSuccessScore(user.id),
          api.academics.getAssignments(),
          api.services.getAnnouncements(),
          api.academics.getTimetable({ semester: 4 }),
        ]);
        setAttendanceSummary(att);
        setSuccessScore(score);
        setAssignments(asgs);
        setAnnouncements(anns);
        setTimetable(tt);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white rounded-2xl border border-brd" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-brd" />
          ))}
        </div>
      </div>
    );
  }

  const attendanceData = attendanceSummary?.courses?.map((c: any) => ({
    name: c.course_code || c.course_name.slice(0, 10),
    percentage: c.percentage,
    fullName: c.course_name,
  })) || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-brd shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              Welcome back, {user?.full_name}
            </h1>
            <Badge variant="accent">Semester 4 • Sec A</Badge>
          </div>
          <p className="text-xs text-txt-secondary mt-1.5 flex items-center flex-wrap gap-x-2">
            <span>Roll ID: <strong className="text-txt-primary">{user?.profile?.roll_number || 'STU2024-001'}</strong></span>
            <span>•</span>
            <span>Department: <strong className="text-txt-primary">Computer Science & Engineering</strong></span>
            <span>•</span>
            <span>Academic Standing: <strong className="text-status-success font-medium">Good Standing</strong></span>
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/ask-data"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-brand-blue" />
            <span>Ask Your Data</span>
          </Link>
          <Link
            to="/success-score"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-brand-sage" />
            <span>Success Insights</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Attendance Rate"
          value={`${attendanceSummary?.overall_percentage || 0}%`}
          subtitle={
            attendanceSummary?.is_below_threshold
              ? 'Warning: Below minimum 75% requirement'
              : 'Satisfies institutional threshold (≥75%)'
          }
          icon={CheckCircle2}
          highlight={attendanceSummary?.is_below_threshold}
        />
        <StatCard
          title="Success Score"
          value={`${successScore?.overall_score || 0}/100`}
          subtitle={successScore?.is_provisional ? 'Provisional calculation' : 'Calculated across 6 factors'}
          icon={Sparkles}
        />
        <StatCard
          title="Cumulative CGPA"
          value={user?.profile?.cgpa ? `${user.profile.cgpa}` : '8.45'}
          subtitle="Out of 10.0 scale"
          icon={GraduationCap}
        />
        <StatCard
          title="Pending Deadlines"
          value={assignments.filter((a) => a.submission_status !== 'graded').length}
          subtitle="Assignments pending review"
          icon={Clock}
        />
      </div>

      {/* Main Grid: Chart & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Attendance Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-txt-primary">Course-wise Attendance Standing</h2>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Red dashed reference marks institutional minimum 75% policy
                </p>
              </div>
              <Link to="/academics" className="text-xs font-medium text-brand-blue hover:underline flex items-center">
                <span>View Full Log</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEBE8" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [`${val}%`, item.payload.fullName || 'Attendance']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #E1E4E2', fontSize: '12px' }}
                  />
                  <ReferenceLine y={75} stroke="#B87575" strokeDasharray="4 4" label={{ value: '75% Min', fill: '#B87575', fontSize: 10, position: 'insideTopRight' }} />
                  <Bar dataKey="percentage" fill="#647F9E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd-subtle flex items-center justify-between text-[11px] text-txt-muted">
            <span>Overall Total: {attendanceSummary?.attended_classes || 0} / {attendanceSummary?.total_classes || 0} classes</span>
            <span className={attendanceSummary?.is_below_threshold ? 'text-status-danger font-medium' : 'text-status-success font-medium'}>
              {attendanceSummary?.is_below_threshold ? '● At Risk of Debarment' : '● Eligible for End-Sem Exam'}
            </span>
          </div>
        </div>

        {/* Timetable & Schedule Today */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-txt-primary">Today's Schedule</h2>
              <Badge variant="neutral">Semester 4</Badge>
            </div>
            <div className="space-y-2.5">
              {timetable.slice(0, 3).map((t, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-bg-highlight border border-brd text-xs">
                  <div className="flex items-center justify-between font-semibold text-txt-primary">
                    <span className="truncate pr-2">{t.course_name}</span>
                    <span className="text-[11px] font-mono text-brand-blue shrink-0">{t.course_code}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-txt-muted text-[11px]">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-txt-muted" />
                      {t.start_time} – {t.end_time}
                    </span>
                    <span className="font-medium text-txt-secondary">{t.room_number}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/academics" className="text-xs font-semibold text-brand-blue hover:underline">
              View Full Academic Timetable →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Assignments & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-txt-primary">Course Assignments & Tasks</h2>
              <Link to="/academics" className="text-xs font-medium text-brand-blue hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-2.5">
              {assignments.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl border border-brd hover:bg-bg-highlight/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-txt-primary">{a.title}</h4>
                      <p className="text-[11px] text-txt-muted mt-0.5">
                        {a.course_code} • {a.category} • Max {a.max_marks} marks
                      </p>
                    </div>
                    <Badge variant={a.submission_status === 'graded' ? 'success' : a.submission_status === 'submitted' ? 'info' : 'warning'}>
                      {a.submission_status === 'graded' ? `Score: ${a.submission_marks}` : a.submission_status === 'submitted' ? 'Submitted' : 'Due Soon'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/academics" className="text-xs font-medium text-brand-blue hover:underline">
              Submit assignments in Academics Portal →
            </Link>
          </div>
        </div>

        {/* Institutional Announcements */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-txt-primary">Campus Notices & Circulars</h2>
              <Link to="/services" className="text-xs font-medium text-brand-blue hover:underline">
                All Notices
              </Link>
            </div>
            <div className="space-y-2.5">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3.5 rounded-xl border border-brd bg-bg-highlight/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-txt-primary">{ann.title}</h4>
                    <Badge variant={ann.priority === 'urgent' ? 'danger' : 'accent'}>{ann.priority}</Badge>
                  </div>
                  <p className="text-[11px] text-txt-secondary mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/services" className="text-xs font-medium text-brand-blue hover:underline">
              Access Campus Services & Hostels →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle,
  Clock,
  ArrowRight,
  PlusCircle,
  FileCheck,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [crs, stus, alerts, asgs] = await Promise.all([
          api.academics.getCourses(),
          api.users.getStudents(),
          api.analytics.getRiskAlerts({ status: 'open' }),
          api.academics.getAssignments(),
        ]);
        setCourses(crs);
        setStudents(stus);
        setRiskAlerts(alerts);
        setAssignments(asgs);
      } catch (err) {
        console.error('Failed to load faculty dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  return (
    <div className="space-y-8">
      {/* Welcome & Fast Shortcuts */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-brd shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              Faculty Console • {user?.full_name}
            </h1>
            <Badge variant="accent">Associate Professor</Badge>
          </div>
          <p className="text-xs text-txt-secondary mt-1.5 flex items-center flex-wrap gap-x-2">
            <span>Department: <strong className="text-txt-primary">Computer Science & Engineering</strong></span>
            <span>•</span>
            <span>Office: <strong className="text-txt-primary">Block B-402</strong></span>
            <span>•</span>
            <span>Teaching Load: <strong className="text-brand-blue font-medium">{courses.length} Active Courses</strong></span>
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/faculty/attendance"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <ClipboardCheck className="w-4 h-4 text-brand-sage" />
            <span>Record Attendance</span>
          </Link>
          <Link
            to="/faculty/assignments"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-brand-blue" />
            <span>Create Assignment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={courses.length}
          subtitle="CS301, CS304 active teaching load"
          icon={GraduationCap}
        />
        <StatCard
          title="Managed Students"
          value={students.length}
          subtitle="Total enrolled cohort count"
          icon={Users}
        />
        <StatCard
          title="Open Risk Alerts"
          value={riskAlerts.length}
          subtitle="Students requiring academic review"
          icon={AlertTriangle}
          highlight={riskAlerts.length > 0}
        />
        <StatCard
          title="Active Assignments"
          value={assignments.length}
          subtitle="Course assessments in progress"
          icon={FileCheck}
        />
      </div>

      {/* Main Grid: At-Risk Queue & Assigned Classes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Students Queue */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-txt-primary">Explainable Student Support Queue</h2>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Rule-detected risk indicators based on attendance logs and assessment submissions
                </p>
              </div>
              <Link to="/faculty/risk-alerts" className="text-xs font-medium text-brand-blue hover:underline flex items-center">
                <span>Alert Center</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-brd-subtle">
              {riskAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-txt-muted">
                  No active student risk alerts in your classes. All cohorts meet criteria.
                </div>
              ) : (
                riskAlerts.map((alert) => (
                  <div key={alert.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-txt-primary">{alert.student_name}</span>
                          <span className="text-[11px] font-mono text-txt-muted">({alert.roll_number})</span>
                          <Badge variant={alert.risk_level === 'critical' ? 'danger' : 'warning'}>
                            {alert.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-txt-secondary mt-1 font-medium">{alert.recommended_action}</p>
                        <div className="mt-2 space-y-1">
                          {alert.evidence.map((ev: string, idx: number) => (
                            <p key={idx} className="text-[11px] text-txt-muted flex items-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-danger/70 mr-2 inline-block shrink-0"></span>
                              <span>{ev}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                      <Link
                        to={`/faculty/interventions?student_id=${alert.student_id}&alert_id=${alert.id}`}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-brand-blue transition-colors shrink-0 shadow-xs flex items-center space-x-1"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-brand-sage" />
                        <span>Intervene</span>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd-subtle text-right">
            <Link to="/faculty/risk-alerts" className="text-xs font-medium text-brand-blue hover:underline">
              Inspect all institutional alerts & criteria →
            </Link>
          </div>
        </div>

        {/* Assigned Courses */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-txt-primary mb-4">Assigned Course Load</h2>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-bg-highlight border border-brd">
                  <div className="flex items-center justify-between font-semibold text-xs text-txt-primary">
                    <span className="font-mono text-brand-blue">{c.code}</span>
                    <Badge variant="neutral">{c.credits} Credits</Badge>
                  </div>
                  <p className="text-xs text-txt-secondary font-medium mt-1">{c.name}</p>
                  <div className="mt-3 pt-2.5 border-t border-brd/60 flex items-center justify-between text-[11px] text-txt-muted">
                    <span>Semester {c.semester} • Section A</span>
                    <Link to={`/faculty/attendance?course_id=${c.id}`} className="text-brand-blue hover:underline font-medium">
                      Attendance Log →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/faculty/assignments" className="text-xs font-semibold text-brand-blue hover:underline">
              Manage Course Assignments & Marks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

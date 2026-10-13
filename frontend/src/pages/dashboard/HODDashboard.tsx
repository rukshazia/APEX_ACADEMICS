import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Building2,
  Users,
  GraduationCap,
  AlertTriangle,
  TrendingUp,
  HeartHandshake,
  ArrowRight,
  Briefcase,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [segmentation, setSegmentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [stus, facs, crs, alerts, intervs, seg] = await Promise.all([
          api.users.getStudents(),
          api.users.getFaculty(),
          api.academics.getCourses(),
          api.analytics.getRiskAlerts(),
          api.analytics.getInterventions(),
          api.analytics.getSegmentation(),
        ]);
        setStudents(stus);
        setFaculty(facs);
        setCourses(crs);
        setRiskAlerts(alerts);
        setInterventions(intervs);
        setSegmentation(seg);
      } catch (err) {
        console.error('Failed to load HOD dashboard:', err);
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

  const avgCgpa = students.length > 0
    ? (students.reduce((acc, s) => acc + (s.cgpa || 0), 0) / students.length).toFixed(2)
    : '0.00';

  const riskDistribution = [
    { level: 'Critical', count: riskAlerts.filter((a) => a.risk_level === 'critical').length, fill: '#B87575' },
    { level: 'High', count: riskAlerts.filter((a) => a.risk_level === 'high').length, fill: '#B69A65' },
    { level: 'Medium', count: riskAlerts.filter((a) => a.risk_level === 'medium').length, fill: '#718CA5' },
    { level: 'Low', count: riskAlerts.filter((a) => a.risk_level === 'low').length, fill: '#8CA398' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-brd shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              Department Leadership • {user?.full_name}
            </h1>
            <Badge variant="accent">Head of Department (CSE)</Badge>
          </div>
          <p className="text-xs text-txt-secondary mt-1.5 flex items-center flex-wrap gap-x-2">
            <span>Academic Performance Oversight</span>
            <span>•</span>
            <span>Student-Success Metrics</span>
            <span>•</span>
            <span>Faculty Workload & Interventions</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/hod/analytics"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-brand-blue" />
            <span>Department Analytics</span>
          </Link>
          <Link
            to="/ask-data"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-brand-sage" />
            <span>Ask Department Data</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Department Students"
          value={students.length}
          subtitle="Enrolled active students"
          icon={GraduationCap}
        />
        <StatCard
          title="Faculty Members"
          value={faculty.length || 1}
          subtitle="Active teaching faculty in CSE"
          icon={Users}
        />
        <StatCard
          title="Average Cohort CGPA"
          value={avgCgpa}
          subtitle="Across all department semesters"
          icon={Building2}
        />
        <StatCard
          title="Active Interventions"
          value={interventions.filter((i) => i.status === 'active').length}
          subtitle="Support plans currently in progress"
          icon={HeartHandshake}
        />
      </div>

      {/* Main Visuals: Risk Distribution & Segment Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Level Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-txt-primary">Department Risk Level Distribution</h2>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Distribution of department students flagged across rule indicators
                </p>
              </div>
              <Link to="/faculty/risk-alerts" className="text-xs font-medium text-brand-blue hover:underline flex items-center">
                <span>View All Alerts</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEBE8" />
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [val, 'Students Flagged']}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #E1E4E2', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd-subtle flex items-center justify-between text-[11px] text-txt-muted">
            <span>Critical alerts require active intervention within 7 days</span>
            <Link to="/hod/analytics" className="text-brand-blue hover:underline font-medium">
              Explore Semester CGPA Correlation →
            </Link>
          </div>
        </div>

        {/* Student Segmentation Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-txt-primary mb-3.5">Cohort Segmentation Snapshot</h2>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-txt-primary">High Achievers</p>
                  <p className="text-[11px] text-txt-muted">CGPA ≥ 8.5</p>
                </div>
                <Badge variant="success">{segmentation?.segments?.high_achievers?.count || 0}</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Attendance Concerns</p>
                  <p className="text-[11px] text-txt-muted">Attendance &lt; 75% threshold</p>
                </div>
                <Badge variant="warning">{segmentation?.segments?.attendance_concerns?.count || 0}</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Academic Support Needed</p>
                  <p className="text-[11px] text-txt-muted">CGPA &lt; 6.5 or grade drop</p>
                </div>
                <Badge variant="danger">{segmentation?.segments?.academic_support_needed?.count || 0}</Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Placement Ready</p>
                  <p className="text-[11px] text-txt-muted">Verified skills & readiness</p>
                </div>
                <Badge variant="accent">{segmentation?.segments?.placement_ready?.count || 0}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/students" className="text-xs font-semibold text-brand-blue hover:underline">
              Inspect Student Cohort Records →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

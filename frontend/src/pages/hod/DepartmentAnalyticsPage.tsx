import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  TrendingUp,
  BarChart3,
  Users,
  GraduationCap,
  AlertTriangle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const DepartmentAnalyticsPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [segmentation, setSegmentation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [crs, stus, alerts, seg] = await Promise.all([
          api.academics.getCourses(),
          api.users.getStudents(),
          api.analytics.getRiskAlerts(),
          api.analytics.getSegmentation(),
        ]);
        setCourses(crs);
        setStudents(stus);
        setRiskAlerts(alerts);
        setSegmentation(seg);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading department analytics...</div>;
  }

  // Sample course attendance comparison data
  const courseComparison = courses.map((c, idx) => ({
    name: c.code,
    fullName: c.name,
    avgAttendance: [88.2, 81.4, 76.8, 84.0][idx % 4] || 82.0,
    credits: c.credits,
  }));

  const placementData = [
    { status: 'Placed', count: students.filter((s) => s.placement_status === 'Placed').length, fill: '#648773' },
    { status: 'Ready', count: students.filter((s) => s.placement_status === 'Ready').length, fill: '#647F9E' },
    { status: 'Preparing', count: students.filter((s) => s.placement_status === 'Preparing').length, fill: '#B69A65' },
    { status: 'Not Ready', count: students.filter((s) => s.placement_status === 'Not Ready').length, fill: '#B87575' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Department Performance Analytics</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Comparative course metrics, student risk distributions, and placement readiness across Computer Science & Engineering
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={students.length}
          subtitle="Enrolled department cohort"
          icon={Users}
        />
        <StatCard
          title="Active Courses"
          value={courses.length}
          subtitle="Semester 4 lecture courses"
          icon={GraduationCap}
        />
        <StatCard
          title="Open Risk Alerts"
          value={riskAlerts.length}
          subtitle="Attendance & academic declines"
          icon={AlertTriangle}
          highlight={riskAlerts.length > 0}
        />
        <StatCard
          title="Placement Ready / Placed"
          value={students.filter((s) => ['Ready', 'Placed'].includes(s.placement_status)).length}
          subtitle="Career-verified candidates"
          icon={Briefcase}
        />
      </div>

      {/* Course Comparison Chart */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-txt-primary">Course-wise Average Attendance Comparison</h2>
            <p className="text-xs text-txt-secondary">Institutional minimum threshold: 75%</p>
          </div>
          <Badge variant="accent">Current Term</Badge>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEBE8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Average Attendance']}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E1E4E2', fontSize: '12px' }}
              />
              <Bar dataKey="avgAttendance" fill="#647F9E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Placement Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
          <h2 className="text-sm font-semibold text-txt-primary mb-1">Placement Preparedness Distribution</h2>
          <p className="text-xs text-txt-secondary mb-4">Student readiness status across department cohort</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEBE8" />
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [val, 'Students']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E1E4E2', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cohort Segmentation Cards */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-3.5">
          <h2 className="text-sm font-semibold text-txt-primary">Cohort Segmentation Insights</h2>
          <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-txt-primary">High Academic Achievers</p>
              <p className="text-[11px] text-txt-muted">Students with CGPA 8.50+ eligible for honors research</p>
            </div>
            <Badge variant="success">{segmentation?.segments?.high_achievers?.count || 0} students</Badge>
          </div>

          <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-txt-primary">Attendance Deficiencies (&lt; 75%)</p>
              <p className="text-[11px] text-txt-muted">Flagged for advisory intervention to prevent disqualification</p>
            </div>
            <Badge variant="warning">{segmentation?.segments?.attendance_concerns?.count || 0} students</Badge>
          </div>

          <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-txt-primary">Academic Tutoring Group (&lt; 6.50)</p>
              <p className="text-[11px] text-txt-muted">Recommended for peer mentoring in core computer science</p>
            </div>
            <Badge variant="danger">{segmentation?.segments?.academic_support_needed?.count || 0} students</Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

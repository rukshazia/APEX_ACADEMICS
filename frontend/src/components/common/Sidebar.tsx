import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Briefcase,
  Layers,
  HelpCircle,
  Users,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
  HeartHandshake,
  Settings,
  ShieldCheck,
  Database,
  Building2,
  LogOut,
  History,
} from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC = () => {
  const { user, role, logout } = useAuth();

  const getNavItems = (): { section: string; items: NavItem[] }[] => {
    if (role === 'student') {
      return [
        {
          section: 'Core Academics',
          items: [
            { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
            { name: 'Academics & Attendance', to: '/academics', icon: GraduationCap },
            { name: 'Campus Services', to: '/services', icon: Layers },
          ],
        },
        {
          section: 'Success Intelligence',
          items: [
            { name: 'Success Score (0-100)', to: '/success-score', icon: Sparkles },
            { name: 'Student Journey', to: '/journey', icon: TrendingUp },
            { name: 'Skills & Placement', to: '/placement', icon: Briefcase },
            { name: 'Ask Your Data', to: '/ask-data', icon: HelpCircle },
          ],
        },
      ];
    } else if (role === 'faculty') {
      return [
        {
          section: 'Instruction & Classes',
          items: [
            { name: 'Faculty Dashboard', to: '/dashboard', icon: LayoutDashboard },
            { name: 'Attendance Recording', to: '/faculty/attendance', icon: ClipboardCheck },
            { name: 'Assignments & Grading', to: '/faculty/assignments', icon: GraduationCap },
            { name: 'Student Directory', to: '/students', icon: Users },
          ],
        },
        {
          section: 'Student Support',
          items: [
            { name: 'At-Risk Alert Center', to: '/faculty/risk-alerts', icon: AlertTriangle },
            { name: 'Interventions Workflow', to: '/faculty/interventions', icon: HeartHandshake },
            { name: 'Ask Your Data', to: '/ask-data', icon: HelpCircle },
          ],
        },
      ];
    } else if (role === 'hod') {
      return [
        {
          section: 'Department Oversight',
          items: [
            { name: 'HOD Dashboard', to: '/dashboard', icon: LayoutDashboard },
            { name: 'Department Analytics', to: '/hod/analytics', icon: TrendingUp },
            { name: 'Faculty & Workload', to: '/hod/faculty', icon: Users },
            { name: 'Student Cohort Records', to: '/students', icon: GraduationCap },
          ],
        },
        {
          section: 'Support & Intelligence',
          items: [
            { name: 'Department Risk Alerts', to: '/faculty/risk-alerts', icon: AlertTriangle },
            { name: 'Intervention Tracking', to: '/faculty/interventions', icon: HeartHandshake },
            { name: 'Ask Your Data', to: '/ask-data', icon: HelpCircle },
          ],
        },
      ];
    } else {
      // Super Admin
      return [
        {
          section: 'Institutional Management',
          items: [
            { name: 'Admin Dashboard', to: '/dashboard', icon: LayoutDashboard },
            { name: 'User Management', to: '/admin/users', icon: Users },
            { name: 'Departments & Courses', to: '/admin/departments', icon: Building2 },
          ],
        },
        {
          section: 'Data Operations',
          items: [
            { name: 'Excel Import Wizard', to: '/admin/import', icon: FileSpreadsheet },
            { name: 'Import History', to: '/admin/import-history', icon: History },
            { name: 'Scoring & Risk Weights', to: '/admin/settings', icon: Settings },
            { name: 'Integrations & Supabase', to: '/admin/integrations', icon: Database },
            { name: 'Security Audit Logs', to: '/admin/audit-logs', icon: ShieldCheck },
            { name: 'Ask Your Data', to: '/ask-data', icon: HelpCircle },
          ],
        },
      ];
    }
  };

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    student: { label: 'Student Scope', badge: 'bg-[#648773]/25 text-[#9EC4AE]' },
    faculty: { label: 'Faculty Scope', badge: 'bg-[#647F9E]/30 text-[#AFC6DE]' },
    hod: { label: 'HOD Scope', badge: 'bg-[#B69A65]/25 text-[#DFC491]' },
    super_admin: { label: 'Admin Scope', badge: 'bg-[#91A6BA]/25 text-[#D1DFEC]' },
  };

  const navSections = getNavItems();

  return (
    <aside className="w-60 bg-navy-900 text-white flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-navy-800 shadow-xl select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-navy-800 flex items-center justify-center border border-navy-700/80 shadow-sm text-brand-blue">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider text-white">APEX ACADEMICS</h1>
            <p className="text-[10px] text-brand-dusty font-medium">Campus Intelligence</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-brand-dusty/60 px-1.5 py-0.5 rounded border border-navy-800 bg-navy-800/40">
          v1.0
        </span>
      </div>

      {/* Scope Pill */}
      <div className="px-4 py-2.5 border-b border-navy-800/80 bg-navy-800/30 flex items-center justify-between">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-dusty/70">
          Portal Scope
        </span>
        {role && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleLabels[role].badge}`}>
            {roleLabels[role].label}
          </span>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navSections.map((sec, idx) => (
          <div key={idx}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-dusty/50 mb-1.5">
              {sec.section}
            </p>
            <div className="space-y-0.5">
              {sec.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-navy-800 text-white border-l-2 border-brand-blue pl-[10px] shadow-sm'
                          : 'text-brand-dusty/80 hover:bg-navy-800/50 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-brand-dusty/90" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer with Clean Sign Out */}
      <div className="p-3 border-t border-navy-800 bg-navy-900 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0 pr-1">
          <div className="w-7 h-7 rounded-full bg-navy-800 border border-navy-700 text-brand-blue font-bold text-[11px] flex items-center justify-center shrink-0">
            {user?.full_name?.slice(0, 1) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user?.full_name || 'Academic User'}
            </p>
            <p className="text-[10px] text-brand-dusty/70 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 rounded-lg text-brand-dusty hover:text-white hover:bg-navy-800 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

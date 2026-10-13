import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  Database,
  ArrowRight,
  Settings,
  Download,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [depts, stus, imps, logs, ints] = await Promise.all([
          api.admin.getDepartments(),
          api.users.getStudents(),
          api.importer.getHistory(),
          api.admin.getAuditLogs(5),
          api.admin.getIntegrationsStatus(),
        ]);
        setDepartments(depts);
        setStudents(stus);
        setImportHistory(imps);
        setAuditLogs(logs);
        setIntegrations(ints);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
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

  const totalImportedRows = importHistory.reduce((acc, h) => acc + (h.total_rows || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-brd shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">Super Admin Console</h1>
            <Badge variant="accent">Institutional Administration</Badge>
          </div>
          <p className="text-xs text-txt-secondary mt-1.5 flex items-center flex-wrap gap-x-2">
            <span>Institutional Settings</span>
            <span>•</span>
            <span>Data Migration Pipelines</span>
            <span>•</span>
            <span>Audit Compliance & External Integrations</span>
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/admin/import"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-brand-sage" />
            <span>Excel Import Wizard</span>
          </Link>
          <Link
            to="/admin/settings"
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <Settings className="w-4 h-4 text-brand-blue" />
            <span>Scoring Weights</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={students.length}
          subtitle="Enrolled institutional records"
          icon={Users}
        />
        <StatCard
          title="Academic Departments"
          value={departments.length}
          subtitle="CSE, ECE, MECH, MBA"
          icon={Building2}
        />
        <StatCard
          title="Imported Records"
          value={totalImportedRows}
          subtitle={`Across ${importHistory.length} import jobs`}
          icon={FileSpreadsheet}
        />
        <StatCard
          title="Primary Database"
          value="Persistent SQLite"
          subtitle="Local schema migrations active"
          icon={Database}
        />
      </div>

      {/* Main Grid: Integrations Status & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integrations Health */}
        <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-txt-primary">Integration Architecture Status</h2>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">Database Persistence</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-[11px] text-txt-muted mt-1 leading-relaxed">
                  SQLite Local Database with versioned schema & foreign key integrity
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">Supabase Auth & Postgres</span>
                  <Badge variant="info">Ready to Connect</Badge>
                </div>
                <p className="text-[11px] text-txt-muted mt-1 leading-relaxed">
                  Local adapter active; supply SUPABASE_URL & ANON_KEY to sync
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-bg-highlight border border-brd">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-txt-primary">AI Analytics Engine</span>
                  <Badge variant="neutral">Deterministic Fallback</Badge>
                </div>
                <p className="text-[11px] text-txt-muted mt-1 leading-relaxed">
                  Deterministic engine active; OpenAI API connection optional
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd text-center">
            <Link to="/admin/integrations" className="text-xs font-semibold text-brand-blue hover:underline">
              Inspect Integration Endpoints & Keys →
            </Link>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-brd shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-txt-primary">Security & Audit Activity</h2>
                <p className="text-xs text-txt-secondary mt-0.5">
                  Institutional event log with timestamped user accountability
                </p>
              </div>
              <Link to="/admin/audit-logs" className="text-xs font-medium text-brand-blue hover:underline flex items-center">
                <span>View Full Audit</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-brd-subtle">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-txt-muted">No audit logs recorded yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-txt-primary">{log.action}</span>
                        <Badge variant="neutral">{log.resource_type}</Badge>
                      </div>
                      <p className="text-xs text-txt-secondary mt-1">{log.details}</p>
                      <p className="text-[10px] text-txt-muted mt-0.5 font-mono">{log.user_email || 'System Operation'}</p>
                    </div>
                    <span className="text-[10px] text-txt-muted shrink-0 font-mono">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-brd-subtle text-right">
            <Link to="/admin/audit-logs" className="text-xs font-medium text-brand-blue hover:underline">
              Search institutional compliance records →
            </Link>
          </div>
        </div>
      </div>

      {/* Institutional Data Exports */}
      <div className="bg-white p-6 rounded-2xl border border-brd shadow-subtle">
        <h2 className="text-sm font-semibold text-txt-primary mb-3.5">Institutional Data Export Feeds</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <a
            href={api.admin.getExportUrl('students')}
            download
            className="p-3.5 rounded-xl bg-bg-highlight border border-brd hover:border-brand-blue flex items-center justify-between transition-colors text-xs font-medium text-txt-primary group"
          >
            <div>
              <span className="font-semibold block">Student Master Roster</span>
              <span className="text-[11px] text-txt-muted">CSV full dataset</span>
            </div>
            <Download className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform" />
          </a>
          <a
            href={api.admin.getExportUrl('risk_alerts')}
            download
            className="p-3.5 rounded-xl bg-bg-highlight border border-brd hover:border-brand-blue flex items-center justify-between transition-colors text-xs font-medium text-txt-primary group"
          >
            <div>
              <span className="font-semibold block">Risk & At-Risk Log</span>
              <span className="text-[11px] text-txt-muted">CSV alerts & evidence</span>
            </div>
            <Download className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform" />
          </a>
          <a
            href={api.admin.getExportUrl('attendance')}
            download
            className="p-3.5 rounded-xl bg-bg-highlight border border-brd hover:border-brand-blue flex items-center justify-between transition-colors text-xs font-medium text-txt-primary group"
          >
            <div>
              <span className="font-semibold block">Attendance Logs</span>
              <span className="text-[11px] text-txt-muted">CSV session records</span>
            </div>
            <Download className="w-4 h-4 text-brand-blue group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

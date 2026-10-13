import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getAuditLogs(100)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading security audit trail...</div>;
  }

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.user_email?.toLowerCase().includes(s) ||
      l.details?.toLowerCase().includes(s) ||
      l.resource_type?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Security Audit Trail & Compliance Log</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Immutable tracking of administrative actions, data imports, credential changes, and permission reviews
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-txt-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, email, details..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>
        <span className="text-xs text-txt-muted font-medium">
          Showing {filteredLogs.length} audit events
        </span>
      </div>

      <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
            <tr>
              <th className="px-6 py-3 font-semibold">Action</th>
              <th className="px-6 py-3 font-semibold">User Initiator</th>
              <th className="px-6 py-3 font-semibold">Resource</th>
              <th className="px-6 py-3 font-semibold">Details</th>
              <th className="px-6 py-3 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brd-subtle">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-bg-highlight/50 transition-colors">
                <td className="px-6 py-3.5 font-semibold text-txt-primary">
                  <Badge variant="neutral">{log.action}</Badge>
                </td>
                <td className="px-6 py-3.5 text-txt-secondary">{log.user_email || 'System'}</td>
                <td className="px-6 py-3.5 text-txt-muted">{log.resource_type || 'system'}</td>
                <td className="px-6 py-3.5 text-txt-primary max-w-sm truncate">{log.details}</td>
                <td className="px-6 py-3.5 text-txt-muted">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

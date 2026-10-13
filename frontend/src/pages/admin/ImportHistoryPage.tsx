import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { History, FileSpreadsheet, Download, CheckCircle, Clock } from 'lucide-react';

export const ImportHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.importer.getHistory()
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading import history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Data Import Audit & History</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Complete history of uploaded student datasets, processed row counts, and audit logs
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
            <tr>
              <th className="px-6 py-3 font-semibold">Filename</th>
              <th className="px-6 py-3 font-semibold">Sheet</th>
              <th className="px-6 py-3 font-semibold">Processed</th>
              <th className="px-6 py-3 font-semibold">Created</th>
              <th className="px-6 py-3 font-semibold">Updated</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brd-subtle">
            {history.map((job) => (
              <tr key={job.id} className="hover:bg-bg-highlight/50 transition-colors">
                <td className="px-6 py-3.5 font-medium text-txt-primary flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-brand-blue shrink-0" />
                  <span>{job.filename}</span>
                </td>
                <td className="px-6 py-3.5 text-txt-muted">{job.sheet_name || 'Sheet1'}</td>
                <td className="px-6 py-3.5 text-txt-primary font-semibold">{job.total_rows}</td>
                <td className="px-6 py-3.5 text-status-success font-semibold">+{job.created_count}</td>
                <td className="px-6 py-3.5 text-brand-blue font-semibold">{job.updated_count}</td>
                <td className="px-6 py-3.5">
                  <Badge variant={job.status === 'completed' ? 'success' : 'danger'}>
                    {job.status.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-3.5 text-txt-muted">
                  {new Date(job.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

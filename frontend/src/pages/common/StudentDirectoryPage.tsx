import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Users, Search, Filter, Eye, GraduationCap, Phone, Mail, Award } from 'lucide-react';

export const StudentDirectoryPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('');
  const [loading, setLoading] = useState(true);

  // Profile Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const loadStudents = async () => {
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (selectedDept) params.department_id = selectedDept;
      if (selectedPlacement) params.placement_status = selectedPlacement;

      const [stus, depts] = await Promise.all([
        api.users.getStudents(params),
        api.admin.getDepartments(),
      ]);
      setStudents(stus);
      setDepartments(depts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [search, selectedDept, selectedPlacement]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading student directory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Authorized Student Cohort Directory</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Search, filter, and inspect verified student profiles within your permitted departmental scope
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto flex-wrap gap-y-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-txt-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll, email..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={selectedPlacement}
            onChange={(e) => setSelectedPlacement(e.target.value)}
            className="text-xs p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
          >
            <option value="">All Placement Statuses</option>
            <option value="Ready">Ready</option>
            <option value="Preparing">Preparing</option>
            <option value="Placed">Placed</option>
            <option value="Not Ready">Not Ready</option>
          </select>
        </div>

        <span className="text-xs text-txt-muted font-medium">
          Showing {students.length} students
        </span>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
            <tr>
              <th className="px-6 py-3 font-semibold">Roll Number</th>
              <th className="px-6 py-3 font-semibold">Student Name</th>
              <th className="px-6 py-3 font-semibold">Department</th>
              <th className="px-6 py-3 font-semibold">Semester</th>
              <th className="px-6 py-3 font-semibold">CGPA</th>
              <th className="px-6 py-3 font-semibold">Placement Status</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brd-subtle">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-bg-highlight/50 transition-colors">
                <td className="px-6 py-3.5 font-medium text-txt-primary">{s.roll_number}</td>
                <td className="px-6 py-3.5 font-medium text-txt-primary">
                  {s.full_name}
                  <span className="text-[11px] text-txt-muted block">{s.email}</span>
                </td>
                <td className="px-6 py-3.5 text-txt-secondary">{s.department_code || 'CSE'}</td>
                <td className="px-6 py-3.5 text-txt-secondary">Sem {s.semester} • Sec {s.section}</td>
                <td className="px-6 py-3.5 font-bold text-txt-primary">{s.cgpa?.toFixed(2) || '0.00'}</td>
                <td className="px-6 py-3.5">
                  <Badge variant={s.placement_status === 'Placed' ? 'success' : s.placement_status === 'Ready' ? 'accent' : 'warning'}>
                    {s.placement_status}
                  </Badge>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => {
                      setSelectedStudent(s);
                      setDetailModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-brd bg-bg-highlight hover:border-brand-blue text-brand-blue transition-colors"
                    title="View Profile Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedStudent ? `${selectedStudent.full_name} (${selectedStudent.roll_number})` : ''}
        subtitle="Verified Academic Institutional Record"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-bg-highlight rounded-xl border border-brd">
              <div>
                <span className="text-txt-muted uppercase font-semibold text-[10px] block">Department</span>
                <span className="font-semibold text-txt-primary">{selectedStudent.department_name || 'Computer Science'}</span>
              </div>
              <div>
                <span className="text-txt-muted uppercase font-semibold text-[10px] block">Academic Period</span>
                <span className="font-semibold text-txt-primary">Semester {selectedStudent.semester} ({selectedStudent.academic_year})</span>
              </div>
              <div>
                <span className="text-txt-muted uppercase font-semibold text-[10px] block">Cumulative CGPA</span>
                <span className="font-semibold text-txt-primary">{selectedStudent.cgpa} / 10.0</span>
              </div>
              <div>
                <span className="text-txt-muted uppercase font-semibold text-[10px] block">Placement Status</span>
                <span className="font-semibold text-txt-primary">{selectedStudent.placement_status}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-brd">
              <h4 className="font-semibold text-txt-primary">Contact & Guardian Information</h4>
              <p className="flex items-center text-txt-secondary">
                <Mail className="w-3.5 h-3.5 mr-2 text-txt-muted" />
                {selectedStudent.email}
              </p>
              {selectedStudent.phone && (
                <p className="flex items-center text-txt-secondary">
                  <Phone className="w-3.5 h-3.5 mr-2 text-txt-muted" />
                  {selectedStudent.phone}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-brd">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Users, UserPlus, Search, Filter, ShieldCheck } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Create Staff Modal
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<'faculty' | 'hod'>('faculty');
  const [newDeptId, setNewDeptId] = useState('');
  const [newDesignation, setNewDesignation] = useState('Assistant Professor');
  const [isCreating, setIsCreating] = useState(false);

  const loadUsers = async () => {
    try {
      const [stus, facs, depts] = await Promise.all([
        api.users.getStudents(),
        api.users.getFaculty(),
        api.admin.getDepartments(),
      ]);
      setStudents(stus);
      setFaculty(facs);
      setDepartments(depts);
      if (depts.length > 0 && !newDeptId) setNewDeptId(depts[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.users.createStaff({
        email: newEmail,
        full_name: newFullName,
        role: newRole,
        department_id: newDeptId,
        designation: newDesignation,
      });
      setCreateStaffOpen(false);
      setNewEmail('');
      setNewFullName('');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Staff creation failed');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading users directory...</div>;
  }

  // Combine for list
  const allUsers = [
    ...faculty.map((f) => ({ ...f, role: 'faculty' })),
    ...students.map((s) => ({ ...s, role: 'student' })),
  ];

  const filteredUsers = allUsers.filter((u) => {
    if (selectedRole !== 'all' && u.role !== selectedRole) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.roll_number?.toLowerCase().includes(s) ||
        u.employee_id?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Institution User & Staff Management</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Manage authenticated students, faculty, and department leadership records
          </p>
        </div>
        <button
          onClick={() => setCreateStaffOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-brand-sage" />
          <span>Add Faculty or HOD</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-txt-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, roll..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-xs p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
          </select>
        </div>

        <span className="text-xs text-txt-muted font-medium">
          Showing {filteredUsers.length} total users
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
            <tr>
              <th className="px-6 py-3 font-semibold">User Details</th>
              <th className="px-6 py-3 font-semibold">Identifier</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Department</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brd-subtle">
            {filteredUsers.map((u, idx) => (
              <tr key={idx} className="hover:bg-bg-highlight/50 transition-colors">
                <td className="px-6 py-3 font-medium text-txt-primary">
                  {u.full_name}
                  <span className="text-[11px] text-txt-muted block">{u.email}</span>
                </td>
                <td className="px-6 py-3 text-txt-secondary font-medium">
                  {u.roll_number || u.employee_id || '—'}
                </td>
                <td className="px-6 py-3">
                  <Badge variant={u.role === 'student' ? 'accent' : 'info'}>
                    {u.role.toUpperCase()}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-txt-secondary">{u.department_name || 'Computer Science'}</td>
                <td className="px-6 py-3">
                  <Badge variant="success">ACTIVE</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE STAFF MODAL */}
      <Modal isOpen={createStaffOpen} onClose={() => setCreateStaffOpen(false)} title="Create Faculty or HOD Account">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Full Name</label>
            <input
              type="text"
              required
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Dr. Arthur Pendelton"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Institutional Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="arthur.pendelton@campus.edu"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Role Assignment</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="faculty">Faculty Member</option>
                <option value="hod">Head of Department (HOD)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Department</label>
              <select
                value={newDeptId}
                onChange={(e) => setNewDeptId(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Designation</label>
            <input
              type="text"
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              placeholder="e.g. Associate Professor"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setCreateStaffOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating Staff Account...' : 'Create Staff User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

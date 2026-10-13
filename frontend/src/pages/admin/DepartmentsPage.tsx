import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Building2, PlusCircle, Users, BookOpen } from 'lucide-react';

export const DepartmentsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDepartments = async () => {
    try {
      const data = await api.admin.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.admin.createDepartment({
        code: newCode,
        name: newName,
        description: newDescription,
      });
      setCreateModalOpen(false);
      setNewCode('');
      setNewName('');
      setNewDescription('');
      loadDepartments();
    } catch (err: any) {
      alert(err.message || 'Department creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Academic Departments & Programs</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Institutional departments, HOD assignments, and student distribution
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-brand-sage" />
          <span>Add Department</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-white p-6 rounded-xl border border-brd shadow-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="accent">{d.code}</Badge>
                  <h3 className="text-base font-bold text-txt-primary mt-1.5">{d.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-txt-primary block">{d.student_count || 0}</span>
                  <span className="text-[10px] text-txt-muted uppercase">Students</span>
                </div>
              </div>

              {d.description && <p className="text-xs text-txt-secondary mt-2.5">{d.description}</p>}
            </div>

            <div className="mt-4 pt-3 border-t border-brd flex items-center justify-between text-xs text-txt-secondary">
              <span>HOD: <strong className="text-txt-primary">{d.hod_name || 'Assigned'}</strong></span>
              <span className="text-[11px] text-status-success font-semibold">Active Program</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Academic Department">
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Department Code</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. AI-DS, CIVIL, BIOTECH"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Department Full Name</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Artificial Intelligence & Data Science"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Description / Focus Area</label>
            <textarea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Academic goals and department specialization..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

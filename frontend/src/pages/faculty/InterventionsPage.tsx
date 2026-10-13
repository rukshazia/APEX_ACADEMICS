import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  HeartHandshake,
  PlusCircle,
  Calendar,
  CheckCircle,
  Clock,
  ArrowRight,
  User,
  Target,
  Edit3,
} from 'lucide-react';

export const InterventionsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const paramStudentId = searchParams.get('student_id');
  const paramAlertId = searchParams.get('alert_id');

  const [interventions, setInterventions] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Intervention Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState(paramStudentId || '');
  const [category, setCategory] = useState('Subject Tutoring');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Follow-up Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<any>(null);
  const [editStatus, setEditStatus] = useState('active');
  const [actionsTaken, setActionsTaken] = useState('');
  const [observations, setObservations] = useState('');
  const [outcome, setOutcome] = useState('pending');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    try {
      const [intervList, stuList] = await Promise.all([
        api.analytics.getInterventions(),
        api.users.getStudents(),
      ]);
      setInterventions(intervList);
      setStudents(stuList);
      if (paramStudentId && !targetStudentId) {
        setTargetStudentId(paramStudentId);
        setCreateModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.analytics.createIntervention({
        student_id: targetStudentId,
        risk_alert_id: paramAlertId || undefined,
        title,
        category,
        goal,
        responsible_staff_id: user?.id || '',
        due_date: dueDate,
        follow_up_date: followUpDate,
      });
      setCreateModalOpen(false);
      setTitle('');
      setGoal('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntervention) return;
    setIsUpdating(true);
    try {
      await api.analytics.updateIntervention(selectedIntervention.id, {
        status: editStatus,
        actions_taken: actionsTaken,
        observations,
        outcome,
        follow_up_date: editFollowUpDate || undefined,
      });
      setEditModalOpen(false);
      setSelectedIntervention(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update intervention');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading interventions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Student Support Interventions</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Structured action plans, goal tracking, faculty mentoring, and verified outcome records
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4 text-brand-sage" />
          <span>Launch New Intervention</span>
        </button>
      </div>

      {/* Interventions Cards */}
      <div className="space-y-4">
        {interventions.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-brd text-center text-xs text-txt-muted">
            No active student interventions. Click "Launch New Intervention" to create one.
          </div>
        ) : (
          interventions.map((inv) => (
            <div key={inv.id} className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brd pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-txt-primary">{inv.title}</h3>
                    <Badge variant={inv.status === 'completed' ? 'success' : inv.status === 'active' ? 'accent' : 'warning'}>
                      {inv.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-txt-secondary mt-1">
                    Student: <strong className="text-txt-primary">{inv.student_name}</strong> ({inv.roll_number}) • Category: <span className="font-semibold">{inv.category}</span>
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedIntervention(inv);
                    setEditStatus(inv.status);
                    setActionsTaken(inv.actions_taken || '');
                    setObservations(inv.observations || '');
                    setOutcome(inv.outcome || 'pending');
                    setEditFollowUpDate(inv.follow_up_date || '');
                    setEditModalOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary transition-colors flex items-center space-x-1"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Update & Follow-up</span>
                </button>
              </div>

              {/* Goal & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd">
                  <p className="font-semibold text-txt-primary flex items-center mb-1">
                    <Target className="w-3.5 h-3.5 mr-1 text-brand-blue" />
                    Intervention Goal
                  </p>
                  <p className="text-txt-secondary">{inv.goal}</p>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd">
                  <p className="font-semibold text-txt-primary mb-1">Actions Taken & Observations</p>
                  <p className="text-txt-secondary">
                    {inv.actions_taken || inv.observations
                      ? `${inv.actions_taken || ''} ${inv.observations || ''}`
                      : 'Initial counseling session scheduled. Observations pending.'}
                  </p>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-txt-muted gap-2 border-t border-brd-subtle">
                <span>
                  Responsible Staff: <strong className="text-txt-primary">{inv.responsible_staff_name || 'Faculty Mentor'}</strong>
                </span>
                <div className="flex items-center space-x-4">
                  {inv.follow_up_date && (
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-status-warning" />
                      Follow-up: {inv.follow_up_date}
                    </span>
                  )}
                  {inv.outcome && inv.outcome !== 'pending' && (
                    <Badge variant={inv.outcome === 'improved' ? 'success' : 'neutral'}>
                      Outcome: {inv.outcome.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE INTERVENTION MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Launch Student Support Intervention">
        <form onSubmit={handleCreateIntervention} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Select Student</label>
            <select
              required
              value={targetStudentId}
              onChange={(e) => setTargetStudentId(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="">Choose Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.roll_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Support Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="Subject Tutoring">Subject Tutoring & Remedial Sessions</option>
              <option value="Attendance Support">Attendance Support & Monitoring</option>
              <option value="Assignment Recovery">Assignment Recovery Plan</option>
              <option value="Mentoring">Faculty Mentoring & Study Skills</option>
              <option value="Skill Development">Skill Development & Labs</option>
              <option value="Placement Preparation">Placement & Interview Preparation</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Intervention Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Structures Tree Algorithms Tutoring"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Specific Goal</label>
            <textarea
              required
              rows={3}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Raise assessment score to 65%+ and complete all missing lab exercises..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Follow-up Date</label>
              <input
                type="date"
                required
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
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
              {isSubmitting ? 'Creating...' : 'Launch Intervention'}
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE INTERVENTION MODAL */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Update Intervention & Record Follow-up">
        <form onSubmit={handleUpdateIntervention} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="active">Active</option>
                <option value="follow_up_required">Follow-up Required</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Observed Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="pending">Pending Evaluation</option>
                <option value="improved">Significantly Improved</option>
                <option value="moderate_progress">Moderate Progress</option>
                <option value="unresponsive">Unresponsive / Further Action Needed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Actions Taken</label>
            <textarea
              rows={2}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              placeholder="e.g. Conducted two 1-on-1 tutoring sessions on binary trees..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Observations & Notes</label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="e.g. Student showed marked confidence on lab exercises..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Next Follow-up Date (Optional)</label>
            <input
              type="date"
              value={editFollowUpDate}
              onChange={(e) => setEditFollowUpDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

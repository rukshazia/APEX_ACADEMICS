import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  CreditCard,
  CalendarDays,
  UserCheck,
  Award,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Building,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'fees' | 'leaves' | 'appointments' | 'extracurricular'>('fees');
  const [fees, setFees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave modal state
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('Medical / Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Appointment modal state
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [apptTopic, setApptTopic] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptTimeSlot, setApptTimeSlot] = useState('14:00 - 14:30');
  const [apptNotes, setApptNotes] = useState('');
  const [apptSubmitting, setApptSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [feeData, leaveData, apptData, actData, facData] = await Promise.all([
        api.services.getFees(user.id),
        api.services.getLeaves(),
        api.services.getAppointments(),
        api.services.getExtracurricular(user.id),
        api.users.getFaculty(),
      ]);
      setFees(feeData);
      setLeaves(leaveData);
      setAppointments(apptData);
      setActivities(actData);
      setFacultyList(facData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    try {
      await api.services.submitLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: leaveReason,
      });
      setLeaveModalOpen(false);
      setLeaveReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Leave submission failed.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setApptSubmitting(true);
    try {
      await api.services.bookAppointment({
        faculty_id: selectedFacultyId,
        topic: apptTopic,
        appointment_date: apptDate,
        time_slot: apptTimeSlot,
        notes: apptNotes,
      });
      setApptModalOpen(false);
      setApptTopic('');
      setApptNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Appointment booking failed.');
    } finally {
      setApptSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading student services...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Student Services & Engagement</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Institutional fee statements, leave applications, faculty appointments, and extracurricular tracking
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brd space-x-6">
        {[
          { key: 'fees', label: 'Institutional Fees' },
          { key: 'leaves', label: 'Leave Applications' },
          { key: 'appointments', label: 'Faculty Appointments' },
          { key: 'extracurricular', label: 'Extracurricular & Clubs' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === tab.key
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-txt-muted hover:text-txt-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: FEES */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-txt-muted uppercase font-semibold">Tuition & Term Fee Records</p>
              <p className="text-xs text-txt-secondary mt-1">
                Authorized financial summary for academic year 2025-2026
              </p>
            </div>
            <Badge variant="info">Institutional Billing Verified</Badge>
          </div>

          <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                <tr>
                  <th className="px-6 py-3 font-semibold">Fee Category</th>
                  <th className="px-6 py-3 font-semibold">Semester</th>
                  <th className="px-6 py-3 font-semibold">Total Amount</th>
                  <th className="px-6 py-3 font-semibold">Amount Paid</th>
                  <th className="px-6 py-3 font-semibold">Due Amount</th>
                  <th className="px-6 py-3 font-semibold">Due Date</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brd-subtle">
                {fees.map((f) => (
                  <tr key={f.id} className="hover:bg-bg-highlight/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-txt-primary">{f.category}</td>
                    <td className="px-6 py-3 text-txt-secondary">Sem {f.semester}</td>
                    <td className="px-6 py-3 text-txt-primary font-semibold">${f.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-3 text-status-success font-semibold">${f.paid_amount.toFixed(2)}</td>
                    <td className="px-6 py-3 text-txt-secondary font-semibold">
                      {f.due_amount > 0 ? (
                        <span className="text-status-danger">${f.due_amount.toFixed(2)}</span>
                      ) : (
                        <span className="text-status-success">$0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-txt-muted">{f.due_date}</td>
                    <td className="px-6 py-3">
                      <Badge variant={f.status === 'paid' ? 'success' : f.status === 'partial' ? 'warning' : 'danger'}>
                        {f.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REQUESTS */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">Leave History & Applications</h2>
              <p className="text-xs text-txt-secondary">Track institutional leave approvals and status</p>
            </div>
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-brand-sage" />
              <span>Apply for Leave</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
                <tr>
                  <th className="px-6 py-3 font-semibold">Leave Type</th>
                  <th className="px-6 py-3 font-semibold">Dates</th>
                  <th className="px-6 py-3 font-semibold">Reason</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Reviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brd-subtle">
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-xs text-txt-muted">
                      No leave requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr key={l.id} className="hover:bg-bg-highlight/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-txt-primary">{l.leave_type}</td>
                      <td className="px-6 py-3 text-txt-secondary">
                        {l.start_date} to {l.end_date}
                      </td>
                      <td className="px-6 py-3 text-txt-primary max-w-xs truncate">{l.reason}</td>
                      <td className="px-6 py-3">
                        <Badge variant={l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warning'}>
                          {l.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-txt-muted">{l.review_comment || 'Pending review'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">Faculty Consultation & Office Hours</h2>
              <p className="text-xs text-txt-secondary">Schedule academic and project mentorship meetings</p>
            </div>
            <button
              onClick={() => setApptModalOpen(true)}
              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-brand-sage" />
              <span>Book Appointment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((a) => (
              <div key={a.id} className="bg-white p-5 rounded-xl border border-brd shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-txt-primary">{a.topic}</h4>
                      <p className="text-[11px] text-brand-blue font-medium mt-0.5">Faculty: {a.faculty_name}</p>
                    </div>
                    <Badge variant={a.status === 'scheduled' ? 'info' : 'neutral'}>
                      {a.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-3 p-2.5 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-[11px] text-txt-secondary">
                    <span>Date: {a.appointment_date}</span>
                    <span>Slot: {a.time_slot}</span>
                  </div>
                  {a.notes && <p className="text-xs text-txt-muted mt-2">{a.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXTRACURRICULAR */}
      {activeTab === 'extracurricular' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">Clubs & Student Engagement</h2>
              <p className="text-xs text-txt-secondary mt-0.5">Verified leadership and extracurricular activities</p>
            </div>
            <Badge variant="accent">Campus Leadership</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act) => (
              <div key={act.id} className="bg-white p-5 rounded-xl border border-brd shadow-subtle">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-txt-primary">{act.title}</h3>
                    <p className="text-[11px] text-txt-muted mt-0.5">{act.category} • {act.role}</p>
                  </div>
                  <Badge variant="success">Verified</Badge>
                </div>
                <p className="text-xs text-txt-secondary mt-2">{act.achievements}</p>
                <div className="mt-3 pt-2 border-t border-brd text-[11px] text-txt-muted">
                  Hours Contributed: <span className="font-semibold text-txt-primary">{act.hours_logged} hrs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      <Modal isOpen={leaveModalOpen} onClose={() => setLeaveModalOpen(false)} title="Apply for Academic / Medical Leave">
        <form onSubmit={handleApplyLeave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="Medical / Sick">Medical / Sick</option>
              <option value="Academic Event">Academic Event / Conference</option>
              <option value="Personal / Casual">Personal / Family</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Reason for Leave</label>
            <textarea
              required
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="State clear academic or medical context..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setLeaveModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={leaveSubmitting}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {leaveSubmitting ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* APPOINTMENT MODAL */}
      <Modal isOpen={apptModalOpen} onClose={() => setApptModalOpen(false)} title="Schedule Faculty Consultation">
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Select Faculty</label>
            <select
              required
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            >
              <option value="">Choose Faculty Member</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Consultation Topic</label>
            <input
              type="text"
              required
              value={apptTopic}
              onChange={(e) => setApptTopic(e.target.value)}
              placeholder="e.g. Capstone project mentoring or exam revision"
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Preferred Date</label>
              <input
                type="date"
                required
                value={apptDate}
                onChange={(e) => setApptDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Time Slot</label>
              <select
                value={apptTimeSlot}
                onChange={(e) => setApptTimeSlot(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                <option value="10:00 - 10:30">10:00 - 10:30</option>
                <option value="11:30 - 12:00">11:30 - 12:00</option>
                <option value="14:00 - 14:30">14:00 - 14:30</option>
                <option value="16:00 - 16:30">16:00 - 16:30</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-txt-primary mb-1">Additional Notes</label>
            <textarea
              rows={2}
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              placeholder="Questions or preparation notes..."
              className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-brd">
            <button
              type="button"
              onClick={() => setApptModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brd text-txt-secondary hover:bg-bg-highlight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={apptSubmitting}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors disabled:opacity-50"
            >
              {apptSubmitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

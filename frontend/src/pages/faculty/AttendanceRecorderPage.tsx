import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  ClipboardCheck,
  Calendar,
  CheckCircle,
  Save,
  Users,
  Check,
  X,
  Clock,
} from 'lucide-react';

export const AttendanceRecorderPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [crs, stus] = await Promise.all([
          api.academics.getCourses(),
          api.users.getStudents(),
        ]);
        setCourses(crs);
        if (crs.length > 0) setSelectedCourseId(crs[0].id);
        setStudents(stus);

        // Initialize all as present by default
        const initMap: Record<string, { status: string; remarks: string }> = {};
        stus.forEach((s) => {
          initMap[s.id] = { status: 'present', remarks: '' };
        });
        setAttendanceMap(initMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: string; remarks: string }> = {};
    students.forEach((s) => {
      updated[s.id] = { ...attendanceMap[s.id], status: 'present' };
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedCourseId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, data]) => ({
        student_id: studentId,
        status: data.status,
        remarks: data.remarks,
      }));

      await api.academics.recordAttendance({
        course_id: selectedCourseId,
        date: attendanceDate,
        records,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to record attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading course roster...</div>;
  }

  const presentCount = Object.values(attendanceMap).filter((v) => v.status === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Attendance Recording & Log Correction</h1>
          <p className="text-xs text-txt-secondary mt-1">
            Authorized session recording directly updating student profiles and risk triggers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-brd bg-bg-highlight hover:border-brand-sage text-txt-primary transition-colors"
          >
            Mark All Present
          </button>
          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-brand-sage" />
            <span>{saving ? 'Saving...' : 'Save & Publish Attendance'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>Attendance batch successfully recorded and synchronized to student profiles!</span>
        </div>
      )}

      {/* Control Filters & Session Stats */}
      <div className="bg-white p-5 rounded-xl border border-brd shadow-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-txt-muted mb-1">
            Course Section
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-txt-muted mb-1">
            Session Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-end space-x-4 pt-4 md:pt-0">
          <div className="text-center px-4 py-1.5 rounded-lg bg-bg-highlight border border-brd">
            <span className="text-xs text-txt-muted">Present:</span>
            <span className="ml-1 text-xs font-bold text-status-success">{presentCount}</span>
          </div>
          <div className="text-center px-4 py-1.5 rounded-lg bg-bg-highlight border border-brd">
            <span className="text-xs text-txt-muted">Absent:</span>
            <span className="ml-1 text-xs font-bold text-status-danger">{absentCount}</span>
          </div>
          <div className="text-center px-4 py-1.5 rounded-lg bg-bg-highlight border border-brd">
            <span className="text-xs text-txt-muted">Late:</span>
            <span className="ml-1 text-xs font-bold text-status-warning">{lateCount}</span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-brd shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-brd flex items-center justify-between">
          <h3 className="text-xs font-semibold text-txt-primary uppercase tracking-wider">
            Student Class Roster ({students.length} students)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg-highlight border-b border-brd text-txt-secondary">
              <tr>
                <th className="px-6 py-3 font-semibold">Roll Number</th>
                <th className="px-6 py-3 font-semibold">Student Name</th>
                <th className="px-6 py-3 font-semibold">Attendance Status</th>
                <th className="px-6 py-3 font-semibold">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brd-subtle">
              {students.map((stu) => {
                const currentStatus = attendanceMap[stu.id]?.status || 'present';
                return (
                  <tr key={stu.id} className="hover:bg-bg-highlight/50 transition-colors">
                    <td className="px-6 py-3 font-medium text-txt-primary">{stu.roll_number}</td>
                    <td className="px-6 py-3 text-txt-primary">
                      {stu.full_name}
                      <span className="text-[11px] text-txt-muted block">{stu.email}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'present')}
                          className={`px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all ${
                            currentStatus === 'present'
                              ? 'bg-status-success text-white shadow-sm'
                              : 'bg-bg-secondary text-txt-secondary hover:bg-bg-highlight'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>Present</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'absent')}
                          className={`px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-status-danger text-white shadow-sm'
                              : 'bg-bg-secondary text-txt-secondary hover:bg-bg-highlight'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>Absent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'late')}
                          className={`px-3 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-all ${
                            currentStatus === 'late'
                              ? 'bg-status-warning text-white shadow-sm'
                              : 'bg-bg-secondary text-txt-secondary hover:bg-bg-highlight'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>Late</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <input
                        type="text"
                        value={attendanceMap[stu.id]?.remarks || ''}
                        onChange={(e) =>
                          setAttendanceMap((prev) => ({
                            ...prev,
                            [stu.id]: { ...prev[stu.id], remarks: e.target.value },
                          }))
                        }
                        placeholder="e.g. Excused, Medical note"
                        className="px-2.5 py-1 text-xs border border-brd rounded bg-bg-main focus:bg-white w-48"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

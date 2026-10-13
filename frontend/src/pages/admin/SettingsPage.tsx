import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Settings, Save, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [institutionName, setInstitutionName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [minAttendance, setMinAttendance] = useState(75.0);
  const [gradeThreshold, setGradeThreshold] = useState(60.0);

  // 6 Weights
  const [wAcademic, setWAcademic] = useState(0.30);
  const [wAttendance, setWAttendance] = useState(0.20);
  const [wLms, setWLms] = useState(0.10);
  const [wExtracurricular, setWExtracurricular] = useState(0.10);
  const [wPlacement, setWPlacement] = useState(0.20);
  const [wSkills, setWSkills] = useState(0.10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.admin.getSettings()
      .then((data) => {
        setInstitutionName(data.institution_name);
        setAcademicYear(data.academic_year);
        setMinAttendance(data.min_attendance_threshold);
        setGradeThreshold(data.at_risk_grade_threshold);
        if (data.weights) {
          setWAcademic(data.weights.academic);
          setWAttendance(data.weights.attendance);
          setWLms(data.weights.lms);
          setWExtracurricular(data.weights.extracurricular);
          setWPlacement(data.weights.placement);
          setWSkills(data.weights.skills);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalWeight = Number((wAcademic + wAttendance + wLms + wExtracurricular + wPlacement + wSkills).toFixed(2));
  const isWeightValid = totalWeight === 1.0;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      setErrorMessage(`Weights must sum to exactly 1.00 (current total: ${totalWeight}).`);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      await api.admin.updateSettings({
        institution_name: institutionName,
        academic_year: academicYear,
        min_attendance_threshold: Number(minAttendance),
        at_risk_grade_threshold: Number(gradeThreshold),
        weight_academic: Number(wAcademic),
        weight_attendance: Number(wAttendance),
        weight_lms: Number(wLms),
        weight_extracurricular: Number(wExtracurricular),
        weight_placement: Number(wPlacement),
        weight_skills: Number(wSkills),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Settings update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Scoring Weights & Risk Thresholds</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Configure institutional parameters powering the explainable Student Success Score and automated at-risk detection
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-lg bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Institutional settings and scoring weights successfully updated and applied!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institutional Settings */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
          <h2 className="text-sm font-semibold text-txt-primary border-b border-brd pb-2">
            Institutional Identity & Calendar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Institution Name</label>
              <input
                type="text"
                required
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Active Academic Year</label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
          <h2 className="text-sm font-semibold text-txt-primary border-b border-brd pb-2">
            Automated At-Risk Indicator Thresholds
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Minimum Attendance Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="50"
                max="95"
                required
                value={minAttendance}
                onChange={(e) => setMinAttendance(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-txt-muted mt-1 block">
                Students falling below this percentage trigger automated attendance risk alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Academic Warning Score Threshold (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="40"
                max="80"
                required
                value={gradeThreshold}
                onChange={(e) => setGradeThreshold(Number(e.target.value))}
                className="w-full text-xs p-2.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue"
              />
              <span className="text-[10px] text-txt-muted mt-1 block">
                Assessment averages falling below this trigger subject tutoring recommendations.
              </span>
            </div>
          </div>
        </div>

        {/* 6 Scoring Weights */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brd pb-2">
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">Student Success Score Weights</h2>
              <p className="text-xs text-txt-secondary">Configurable component contributions (Must sum to 1.00)</p>
            </div>
            <Badge variant={isWeightValid ? 'success' : 'danger'}>
              Total Sum: {totalWeight.toFixed(2)} / 1.00
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Academic Performance</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wAcademic}
                onChange={(e) => setWAcademic(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wAcademic * 100).toFixed(0)}% weight</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Attendance Record</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wAttendance}
                onChange={(e) => setWAttendance(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wAttendance * 100).toFixed(0)}% weight</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">LMS & Portal Activity</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wLms}
                onChange={(e) => setWLms(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wLms * 100).toFixed(0)}% weight</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Extracurricular Engagement</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wExtracurricular}
                onChange={(e) => setWExtracurricular(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wExtracurricular * 100).toFixed(0)}% weight</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Placement Readiness</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wPlacement}
                onChange={(e) => setWPlacement(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wPlacement * 100).toFixed(0)}% weight</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">Skills & Faculty Feedback</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wSkills}
                onChange={(e) => setWSkills(Number(e.target.value))}
                className="w-full text-xs p-2 border border-brd rounded-lg bg-bg-main"
              />
              <span className="text-[10px] text-txt-muted">{(wSkills * 100).toFixed(0)}% weight</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !isWeightValid}
            className="px-5 py-2.5 text-xs font-medium rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-brand-sage" />
            <span>{saving ? 'Saving...' : 'Apply & Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

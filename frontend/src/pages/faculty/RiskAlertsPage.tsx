import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { StatCard } from '../../components/common/StatCard';
import {
  AlertTriangle,
  ShieldAlert,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  ExternalLink,
  BookOpen,
  Calendar,
  UserCheck,
  TrendingDown,
  TrendingUp,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface StudentRiskItem {
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  department_id: string | null;
  department_name: string;
  semester: number;
  overall_risk_score: number | null;
  risk_percentage: number | null;
  risk_category: string;
  attendance_pct: number | null;
  academic_avg: number | null;
  assignment_completion_pct: number | null;
  component_scores: {
    attendance: number | null;
    academic: number | null;
    assignment: number | null;
    trend: number | null;
    engagement: number | null;
  };
  component_weights: Record<string, number>;
  data_completeness: number;
  is_provisional: boolean;
  missing_components: string[];
  available_components: string[];
  evidence: string[];
  recommendations: string[];
  intervention_status: string;
  active_intervention_id: string | null;
  risk_alert_id: string | null;
  last_calculated_at: string;
}

interface RiskSummary {
  total_eligible: number;
  assessed_count: number;
  critical_count: number;
  very_high_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  insufficient_data_count: number;
  provisional_count: number;
  in_intervention_count: number;
}

export const RiskAlertsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentRiskItem[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [completenessFilter, setCompletenessFilter] = useState('');
  const [interventionFilter, setInterventionFilter] = useState('');
  const [sortBy, setSortBy] = useState('risk_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRiskItem | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGetAiInsights = async () => {
    if (!selectedStudent) return;
    setLoadingAi(true);
    try {
      const res = await api.analytics.getRiskAiInsights(selectedStudent.student_id);
      setAiInsight(res.ai_strategy);
      setAiProvider(res.provider);
    } catch (err: any) {
      alert(err.message || 'Failed to generate AI insights');
    } finally {
      setLoadingAi(false);
    }
  };

  // Intervention Creation Modal
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionStudent, setInterventionStudent] = useState<StudentRiskItem | null>(null);
  const [interventionTitle, setInterventionTitle] = useState('');
  const [interventionCategory, setInterventionCategory] = useState('Academic Tutoring');
  const [interventionGoal, setInterventionGoal] = useState('');
  const [interventionDueDate, setInterventionDueDate] = useState('');
  const [interventionFollowUp, setInterventionFollowUp] = useState('');
  const [submittingIntervention, setSubmittingIntervention] = useState(false);

  const loadRiskData = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.risk_category = categoryFilter;
      if (completenessFilter) params.completeness = completenessFilter;
      if (interventionFilter) params.intervention_status = interventionFilter;

      const data = await api.analytics.getRiskStudents(params);
      setStudents(data.items || []);
      setSummary(data.summary || null);
      setTotalCount(data.total_count || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load risk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, [page, pageSize, categoryFilter, completenessFilter, interventionFilter, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadRiskData();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await api.analytics.recalculateRisk();
      await loadRiskData();
    } catch (err: any) {
      alert(err.message || 'Recalculation failed');
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenInterventionModal = (student: StudentRiskItem) => {
    setInterventionStudent(student);
    setInterventionTitle(`Academic Support Plan for ${student.student_name}`);
    setInterventionGoal(
      student.recommendations.length > 0
        ? student.recommendations[0]
        : 'Improve overall attendance and continuous assessment performance.'
    );
    const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setInterventionDueDate(in14Days);
    setInterventionFollowUp(in7Days);
    setInterventionModalOpen(true);
  };

  const handleSubmitIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interventionStudent) return;
    setSubmittingIntervention(true);
    try {
      await api.analytics.createIntervention({
        student_id: interventionStudent.student_id,
        risk_alert_id: interventionStudent.risk_alert_id,
        title: interventionTitle,
        category: interventionCategory,
        goal: interventionGoal,
        due_date: interventionDueDate,
        follow_up_date: interventionFollowUp,
      });
      setInterventionModalOpen(false);
      setInterventionStudent(null);
      await loadRiskData();
      alert('Intervention successfully launched.');
    } catch (err: any) {
      alert(err.message || 'Failed to launch intervention');
    } finally {
      setSubmittingIntervention(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            CRITICAL
          </span>
        );
      case 'VERY_HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            VERY HIGH
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            HIGH
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            MODERATE
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            LOW
          </span>
        );
      case 'INSUFFICIENT_DATA':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
            INSUFFICIENT DATA
          </span>
        );
    }
  };

  const getScoreColorClass = (score: number | null) => {
    if (score === null) return 'text-txt-muted';
    if (score >= 80) return 'text-red-700 font-bold';
    if (score >= 60) return 'text-rose-600 font-bold';
    if (score >= 40) return 'text-amber-700 font-semibold';
    if (score >= 20) return 'text-sky-700 font-medium';
    return 'text-emerald-700 font-medium';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-brd shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-txt-primary">
              Student Risk Analytics & Early Intervention
            </h1>
            <Badge variant="accent">Institution-Wide Coverage</Badge>
          </div>
          <p className="text-xs text-txt-secondary mt-1.5 flex items-center flex-wrap gap-x-2">
            <span>Explainable weighted scoring: Attendance (30%), Academics (35%), Assignments (20%), Trajectory (10%), Engagement (5%)</span>
            <span>•</span>
            <span>Scope-based governance for Faculty, HOD, and Super Admin</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-sage ${recalculating ? 'animate-spin' : ''}`} />
            <span>{recalculating ? 'Recalculating...' : 'Recalculate Scores'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards with Quick Filter Clicks */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <button
            type="button"
            onClick={() => { setCategoryFilter(''); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === '' ? 'bg-navy-50/50 border-navy-300 ring-2 ring-navy-400/20' : 'bg-white border-brd hover:border-navy-200'
            }`}
          >
            <div className="text-[11px] font-medium text-txt-secondary flex items-center justify-between">
              <span>All Students</span>
              <Layers className="w-3.5 h-3.5 text-txt-muted" />
            </div>
            <div className="text-xl font-bold text-txt-primary mt-1">{summary.total_eligible}</div>
            <div className="text-[10px] text-txt-muted mt-0.5">{summary.assessed_count} scored</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('CRITICAL'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'CRITICAL' ? 'bg-red-50 border-red-300 ring-2 ring-red-400/20' : 'bg-white border-brd hover:border-red-200'
            }`}
          >
            <div className="text-[11px] font-medium text-red-800 flex items-center justify-between">
              <span>Critical</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="text-xl font-bold text-red-700 mt-1">{summary.critical_count}</div>
            <div className="text-[10px] text-red-600 mt-0.5">80–100 Risk</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('VERY_HIGH'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'VERY_HIGH' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-brd hover:border-rose-200'
            }`}
          >
            <div className="text-[11px] font-medium text-rose-800 flex items-center justify-between">
              <span>Very High</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-rose-700 mt-1">{summary.very_high_count}</div>
            <div className="text-[10px] text-rose-600 mt-0.5">60–79 Risk</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('HIGH'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'HIGH' ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-brd hover:border-amber-200'
            }`}
          >
            <div className="text-[11px] font-medium text-amber-800 flex items-center justify-between">
              <span>High</span>
              <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-700 mt-1">{summary.high_count}</div>
            <div className="text-[10px] text-amber-600 mt-0.5">40–59 Risk</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('MODERATE'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'MODERATE' ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-400/20' : 'bg-white border-brd hover:border-sky-200'
            }`}
          >
            <div className="text-[11px] font-medium text-sky-800 flex items-center justify-between">
              <span>Moderate</span>
              <Activity className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-xl font-bold text-sky-700 mt-1">{summary.moderate_count}</div>
            <div className="text-[10px] text-sky-600 mt-0.5">20–39 Risk</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('LOW'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'LOW' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-brd hover:border-emerald-200'
            }`}
          >
            <div className="text-[11px] font-medium text-emerald-800 flex items-center justify-between">
              <span>Low</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{summary.low_count}</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">0–19 Risk</div>
          </button>

          <button
            type="button"
            onClick={() => { setCategoryFilter('INSUFFICIENT_DATA'); setPage(1); }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              categoryFilter === 'INSUFFICIENT_DATA' ? 'bg-gray-100 border-gray-300 ring-2 ring-gray-400/20' : 'bg-white border-brd hover:border-gray-200'
            }`}
          >
            <div className="text-[11px] font-medium text-gray-700 flex items-center justify-between">
              <span>Insufficient</span>
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="text-xl font-bold text-gray-700 mt-1">{summary.insufficient_data_count}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Records Pending</div>
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-txt-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, roll number, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="text-xs p-1.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
            >
              <option value="">All Risk Categories</option>
              <option value="CRITICAL">Critical Risk (80-100)</option>
              <option value="VERY_HIGH">Very High Risk (60-79)</option>
              <option value="HIGH">High Risk (40-59)</option>
              <option value="MODERATE">Moderate Risk (20-39)</option>
              <option value="LOW">Low Risk (0-19)</option>
              <option value="INSUFFICIENT_DATA">Insufficient Data</option>
            </select>
          </div>

          <div>
            <select
              value={completenessFilter}
              onChange={(e) => { setCompletenessFilter(e.target.value); setPage(1); }}
              className="text-xs p-1.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
            >
              <option value="">All Completeness</option>
              <option value="complete">Complete (100%)</option>
              <option value="provisional">Provisional Score</option>
              <option value="insufficient">Insufficient Data</option>
            </select>
          </div>

          <div>
            <select
              value={interventionFilter}
              onChange={(e) => { setInterventionFilter(e.target.value); setPage(1); }}
              className="text-xs p-1.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
            >
              <option value="">All Intervention Statuses</option>
              <option value="in_intervention">In Intervention</option>
              <option value="open">Open Alert</option>
              <option value="none">No Active Intervention</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs p-1.5 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
            >
              <option value="risk_score">Sort by Risk Score</option>
              <option value="name">Sort by Student Name</option>
              <option value="attendance">Sort by Attendance Rate</option>
              <option value="academic">Sort by Academic Average</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-xs px-2.5 py-1.5 border border-brd rounded-lg bg-bg-main hover:bg-white font-medium text-txt-secondary"
            title="Toggle sort order"
          >
            {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
          </button>
        </div>
      </div>

      {/* Main Student Risk Monitoring Table */}
      <div className="bg-white rounded-2xl border border-brd shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-txt-muted animate-pulse">
            Loading institution-wide student risk assessments...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-txt-muted">
            No students found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-bg-main/60 border-b border-brd text-txt-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-semibold">Student ID & Name</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Overall Risk Score</th>
                  <th className="py-3 px-4 font-semibold">Risk Category</th>
                  <th className="py-3 px-4 font-semibold">Attendance</th>
                  <th className="py-3 px-4 font-semibold">Academics</th>
                  <th className="py-3 px-4 font-semibold">Assignments</th>
                  <th className="py-3 px-4 font-semibold">Completeness</th>
                  <th className="py-3 px-4 font-semibold">Intervention</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brd-subtle">
                {students.map((student) => {
                  const score = student.overall_risk_score;
                  return (
                    <tr key={student.student_id} className="hover:bg-bg-main/40 transition-colors">
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-txt-primary">{student.student_name}</div>
                        <div className="text-[11px] text-txt-muted font-mono">{student.roll_number}</div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-txt-secondary">
                        <div>{student.department_name}</div>
                        <div className="text-[10px] text-txt-muted">Sem {student.semester}</div>
                      </td>

                      {/* Overall Risk Score */}
                      <td className="py-3.5 px-4">
                        {score !== null ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-sm ${getScoreColorClass(score)}`}>
                                {score} / 100
                              </span>
                              <span className="text-[10px] text-txt-muted">({score}%)</span>
                            </div>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  score >= 80 ? 'bg-red-600' : score >= 60 ? 'bg-rose-500' : score >= 40 ? 'bg-amber-500' : score >= 20 ? 'bg-sky-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-txt-muted font-mono text-[11px]">N/A (Pending)</span>
                        )}
                      </td>

                      {/* Risk Category */}
                      <td className="py-3.5 px-4">
                        {getCategoryBadge(student.risk_category)}
                      </td>

                      {/* Attendance Indicator */}
                      <td className="py-3.5 px-4">
                        {student.attendance_pct !== null ? (
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-medium ${student.attendance_pct < 75 ? 'text-red-700 font-bold' : student.attendance_pct < 85 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {student.attendance_pct}%
                            </span>
                            {student.component_scores.attendance !== null && (
                              <span className="text-[10px] text-txt-muted">({student.component_scores.attendance}r)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-txt-muted">No logs</span>
                        )}
                      </td>

                      {/* Academic Indicator */}
                      <td className="py-3.5 px-4">
                        {student.academic_avg !== null ? (
                          <div className="flex items-center space-x-1.5">
                            <span className={`font-medium ${student.academic_avg < 50 ? 'text-red-700 font-bold' : student.academic_avg < 65 ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {student.academic_avg}%
                            </span>
                            {student.component_scores.academic !== null && (
                              <span className="text-[10px] text-txt-muted">({student.component_scores.academic}r)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-txt-muted">No marks</span>
                        )}
                      </td>

                      {/* Assignment Indicator */}
                      <td className="py-3.5 px-4">
                        {student.assignment_completion_pct !== null ? (
                          <span className={`font-medium ${student.assignment_completion_pct < 60 ? 'text-amber-700' : 'text-txt-secondary'}`}>
                            {student.assignment_completion_pct}%
                          </span>
                        ) : (
                          <span className="text-txt-muted">N/A</span>
                        )}
                      </td>

                      {/* Data Completeness */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          student.is_provisional ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {student.is_provisional ? `Provisional (${student.data_completeness}%)` : 'Complete (100%)'}
                        </span>
                      </td>

                      {/* Intervention Status */}
                      <td className="py-3.5 px-4">
                        {student.intervention_status === 'in_intervention' ? (
                          <Badge variant="accent">IN INTERVENTION</Badge>
                        ) : student.intervention_status === 'open' ? (
                          <Badge variant="warning">ALERT OPEN</Badge>
                        ) : (
                          <span className="text-[11px] text-txt-muted font-normal">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student);
                              setAiInsight(null);
                              setAiProvider(null);
                              setDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-bg-highlight border border-brd hover:border-brand-blue text-txt-primary hover:text-brand-blue transition-colors"
                          >
                            Explain
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenInterventionModal(student)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                          >
                            Intervene
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Scalable Pagination Controls */}
        <div className="p-4 bg-bg-main/30 border-t border-brd flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-txt-secondary">
          <div>
            Showing <strong className="text-txt-primary">{students.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{' '}
            <strong className="text-txt-primary">{Math.min(totalCount, page * pageSize)}</strong> of{' '}
            <strong className="text-txt-primary">{totalCount}</strong> eligible students
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-txt-muted">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="text-xs p-1 border border-brd rounded bg-white focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded border border-brd bg-white hover:bg-bg-main disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium text-txt-primary">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded border border-brd bg-white hover:bg-bg-main disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Student Explainable Risk Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedStudent ? `Risk Assessment & Evidence Breakdown • ${selectedStudent.student_name}` : 'Risk Breakdown'}
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs">
            {/* Top Student Overview */}
            <div className="bg-bg-main p-4 rounded-xl border border-brd flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-txt-primary">{selectedStudent.student_name}</div>
                <div className="text-xs text-txt-muted">
                  Roll: {selectedStudent.roll_number} • Dept: {selectedStudent.department_name} (Sem {selectedStudent.semester})
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-xs text-txt-muted">Overall Risk Score</div>
                  <div className={`text-base font-bold ${getScoreColorClass(selectedStudent.overall_risk_score)}`}>
                    {selectedStudent.overall_risk_score !== null ? `${selectedStudent.overall_risk_score} / 100` : 'INSUFFICIENT DATA'}
                  </div>
                </div>
                {getCategoryBadge(selectedStudent.risk_category)}
              </div>
            </div>

            {/* Configured Factor Weights Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-txt-primary mb-2 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-brand-blue" />
                <span>Explainable Component Contributions (Normalized 0–100 Risk Scale)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Attendance */}
                <div className="p-3 bg-white rounded-lg border border-brd">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt-primary">Attendance Risk (Weight: 30%)</span>
                    <span className="font-bold text-txt-primary">
                      {selectedStudent.component_scores.attendance !== null ? `${selectedStudent.component_scores.attendance} / 100` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-[11px] text-txt-secondary mt-1">
                    Observed Attendance: <strong className="text-txt-primary">{selectedStudent.attendance_pct !== null ? `${selectedStudent.attendance_pct}%` : 'No logs recorded'}</strong>
                  </div>
                </div>

                {/* Academic */}
                <div className="p-3 bg-white rounded-lg border border-brd">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt-primary">Academic Performance Risk (Weight: 35%)</span>
                    <span className="font-bold text-txt-primary">
                      {selectedStudent.component_scores.academic !== null ? `${selectedStudent.component_scores.academic} / 100` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-[11px] text-txt-secondary mt-1">
                    Assessment Average: <strong className="text-txt-primary">{selectedStudent.academic_avg !== null ? `${selectedStudent.academic_avg}%` : 'No grades recorded'}</strong>
                  </div>
                </div>

                {/* Assignment */}
                <div className="p-3 bg-white rounded-lg border border-brd">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt-primary">Assignment Completion Risk (Weight: 20%)</span>
                    <span className="font-bold text-txt-primary">
                      {selectedStudent.component_scores.assignment !== null ? `${selectedStudent.component_scores.assignment} / 100` : 'N/A'}
                    </span>
                  </div>
                  <div className="text-[11px] text-txt-secondary mt-1">
                    Completion Rate: <strong className="text-txt-primary">{selectedStudent.assignment_completion_pct !== null ? `${selectedStudent.assignment_completion_pct}%` : 'No assignments due'}</strong>
                  </div>
                </div>

                {/* Trend */}
                <div className="p-3 bg-white rounded-lg border border-brd">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-txt-primary">Performance Trend Risk (Weight: 10%)</span>
                    <span className="font-bold text-txt-primary">
                      {selectedStudent.component_scores.trend !== null ? `${selectedStudent.component_scores.trend} / 100` : 'N/A (Needs ≥2 assessments)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-txt-secondary mt-1">
                    Historical Trajectory: {selectedStudent.component_scores.trend !== null && selectedStudent.component_scores.trend >= 60 ? 'Declining trend observed' : 'Stable or improving'}
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Concrete Evidence */}
            <div>
              <h4 className="text-xs font-bold text-txt-primary mb-2 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-txt-muted" />
                <span>Supporting Factual Evidence</span>
              </h4>
              <ul className="space-y-1.5 bg-bg-main p-3.5 rounded-lg border border-brd">
                {selectedStudent.evidence.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] text-txt-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actionable Recommendations */}
            <div>
              <h4 className="text-xs font-bold text-txt-primary mb-2 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Actionable Recommendations</span>
              </h4>
              <ul className="space-y-1.5 bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-200">
                {selectedStudent.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-[11px] text-emerald-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Google Gemini AI Strategy Advisor */}
            <div className="bg-bg-highlight p-3.5 rounded-xl border border-brd space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-txt-primary">
                  <Sparkles className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Google Gemini AI Early Intervention Advisor</span>
                </div>
                {aiProvider && <Badge variant="accent">{aiProvider}</Badge>}
              </div>

              {!aiInsight ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <p className="text-[11px] text-txt-secondary">
                    Synthesize an AI-tailored counseling roadmap grounded in this student's recorded attendance, assignments, and test scores.
                  </p>
                  <button
                    type="button"
                    onClick={handleGetAiInsights}
                    disabled={loadingAi}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors flex items-center space-x-1.5 shrink-0 shadow-xs disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-brand-sage ${loadingAi ? 'animate-spin' : ''}`} />
                    <span>{loadingAi ? 'Generating...' : 'Generate Gemini Plan'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-white rounded-lg border border-brd text-[11px] text-txt-primary whitespace-pre-line leading-relaxed font-medium">
                    {aiInsight}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setInterventionGoal(aiInsight.slice(0, 300));
                        setDetailModalOpen(false);
                        handleOpenInterventionModal(selectedStudent);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded bg-brand-blue/10 text-brand-blue hover:bg-brand-blue/20 transition-colors"
                    >
                      Adopt Strategy into Intervention
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-brd flex items-center justify-between">
              <span className="text-[11px] text-txt-muted">
                Last calculated: {new Date(selectedStudent.last_calculated_at).toLocaleString()}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setDetailModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brd bg-white hover:bg-bg-main text-txt-secondary"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleOpenInterventionModal(selectedStudent);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                >
                  Initiate Intervention
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Launch Intervention Modal */}
      <Modal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        title={interventionStudent ? `Launch Academic Intervention • ${interventionStudent.student_name}` : 'New Intervention'}
      >
        <form onSubmit={handleSubmitIntervention} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-txt-primary mb-1">Intervention Title</label>
            <input
              type="text"
              value={interventionTitle}
              onChange={(e) => setInterventionTitle(e.target.value)}
              required
              className="w-full p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-txt-primary mb-1">Category</label>
              <select
                value={interventionCategory}
                onChange={(e) => setInterventionCategory(e.target.value)}
                className="w-full p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
              >
                <option value="Attendance Support">Attendance Support</option>
                <option value="Subject Tutoring">Subject Tutoring</option>
                <option value="Assignment Recovery">Assignment Recovery</option>
                <option value="Faculty Mentoring">Faculty Mentoring</option>
                <option value="Counseling & Advisory">Counseling & Advisory</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-txt-primary mb-1">Follow-Up Date</label>
              <input
                type="date"
                value={interventionFollowUp}
                onChange={(e) => setInterventionFollowUp(e.target.value)}
                required
                className="w-full p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none"
              >
              </input>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-txt-primary mb-1">Target Academic Goal</label>
            <textarea
              rows={3}
              value={interventionGoal}
              onChange={(e) => setInterventionGoal(e.target.value)}
              required
              className="w-full p-2 border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-brd">
            <button
              type="button"
              onClick={() => setInterventionModalOpen(false)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-brd bg-white hover:bg-bg-main text-txt-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingIntervention}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {submittingIntervention ? 'Launching...' : 'Confirm & Launch Intervention'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RiskAlertsPage;

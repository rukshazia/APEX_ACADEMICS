import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  Sparkles,
  Info,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Award,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const SuccessScorePage: React.FC = () => {
  const { user } = useAuth();
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.analytics.getSuccessScore(user.id)
      .then(setScoreData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Calculating explainable success score...</div>;
  }

  const componentBars = [
    { name: 'Academic (30%)', score: scoreData?.components?.academic || 0, fill: '#647F9E' },
    { name: 'Attendance (20%)', score: scoreData?.components?.attendance || 0, fill: '#8CA398' },
    { name: 'LMS Activity (10%)', score: scoreData?.components?.lms || 0, fill: '#91A6BA' },
    { name: 'Extracurricular (10%)', score: scoreData?.components?.extracurricular || 0, fill: '#B7A99A' },
    { name: 'Placement (20%)', score: scoreData?.components?.placement || 0, fill: '#718CA5' },
    { name: 'Skills & Test (10%)', score: scoreData?.components?.skills || 0, fill: '#34465A' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-txt-primary">Explainable Student Success Score</h1>
          <Badge variant={scoreData?.is_provisional ? 'warning' : 'success'}>
            {scoreData?.is_provisional ? 'Provisional Assessment' : 'Verified Methodology'}
          </Badge>
        </div>
        <p className="text-xs text-txt-secondary mt-1">
          Support indicator calculated from real institutional academic, attendance, and skills records (Methodology: {scoreData?.methodology_version || 'v1.0'})
        </p>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-brd pb-4 md:pb-0 md:pr-6">
          <p className="text-xs text-txt-muted uppercase font-semibold">Overall Success Score</p>
          <div className="mt-2 flex items-baseline justify-center md:justify-start space-x-2">
            <span className="text-5xl font-extrabold text-navy-900">{scoreData?.overall_score || 0}</span>
            <span className="text-lg text-txt-muted font-medium">/ 100</span>
          </div>
          <p className="text-xs text-txt-secondary mt-2">
            Data Completeness: <span className="font-semibold text-txt-primary">{scoreData?.data_completeness}%</span>
          </p>
          {scoreData?.is_provisional && (
            <p className="text-[11px] text-status-warning mt-1 flex items-center justify-center md:justify-start">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Provisional due to missing fields
            </p>
          )}
        </div>

        {/* Explainability notice */}
        <div className="md:col-span-2 space-y-3">
          <div className="p-3.5 rounded-lg bg-bg-highlight border border-brd text-xs text-txt-secondary leading-relaxed">
            <div className="flex items-center space-x-1.5 font-semibold text-txt-primary mb-1">
              <Info className="w-4 h-4 text-brand-blue" />
              <span>Transparent & Non-Judgmental Methodology</span>
            </div>
            This score is treated as an institutional support indicator, not a definitive judgment about your future or capabilities. Missing components are renormalized across available data rather than counting as zero.
          </div>
          {scoreData?.missing_components?.length > 0 && (
            <p className="text-xs text-txt-muted">
              Missing records: <span className="text-txt-primary font-medium">{scoreData.missing_components.join(', ')}</span>
            </p>
          )}
        </div>
      </div>

      {/* 6 Component Breakdown Bar Chart */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
        <h2 className="text-sm font-semibold text-txt-primary mb-1">Weighted Factor Breakdown</h2>
        <p className="text-xs text-txt-secondary mb-4">Normalized score contributions (0 – 100 scale per component)</p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={componentBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAEBE8" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#68727D' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(val: any) => [`${val}/100`, 'Component Score']}
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E1E4E2', fontSize: '12px' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Factors & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Factors */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center space-x-2 text-sm font-semibold text-txt-primary mb-3">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <span>Factors Raising Your Score</span>
          </div>
          <ul className="space-y-2 text-xs">
            {scoreData?.positive_factors?.length === 0 ? (
              <li className="text-txt-muted">Sufficient positive logs pending recording.</li>
            ) : (
              scoreData?.positive_factors?.map((f: string, idx: number) => (
                <li key={idx} className="p-2.5 rounded-lg bg-status-success/10 border border-status-success/20 text-[#3C644E]">
                  • {f}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Negative Factors / Improvement Areas */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center space-x-2 text-sm font-semibold text-txt-primary mb-3">
            <AlertTriangle className="w-4 h-4 text-status-warning" />
            <span>Factors Limiting Your Score</span>
          </div>
          <ul className="space-y-2 text-xs">
            {scoreData?.negative_factors?.length === 0 ? (
              <li className="text-txt-muted">No negative risk factors identified. Excellent standing!</li>
            ) : (
              scoreData?.negative_factors?.map((f: string, idx: number) => (
                <li key={idx} className="p-2.5 rounded-lg bg-status-warning/10 border border-status-warning/20 text-[#7E663B]">
                  • {f}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
        <div className="flex items-center space-x-2 text-sm font-semibold text-txt-primary mb-3">
          <Sparkles className="w-4 h-4 text-brand-blue" />
          <span>Practical Next Actions for Score Improvement</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scoreData?.recommendations?.map((rec: string, idx: number) => (
            <div key={idx} className="p-3.5 rounded-lg bg-bg-highlight border border-brd text-xs text-txt-secondary flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-navy-800 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                {idx + 1}
              </span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

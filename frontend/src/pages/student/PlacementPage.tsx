import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Badge } from '../../components/common/Badge';
import {
  Briefcase,
  CheckCircle,
  Code,
  FileCheck,
  Award,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const PlacementPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.analytics.getPlacement(user.id)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-txt-muted animate-pulse">Loading placement readiness profile...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-txt-primary">Placement Readiness & Skill Competency</h1>
        <p className="text-xs text-txt-secondary mt-1">
          Objective evaluation of technical proficiency, assessment benchmarks, and career preparedness
        </p>
      </div>

      {/* Hero Readiness Gauge */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-xs text-txt-muted uppercase font-semibold">Career Readiness Benchmark</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-navy-900">{profile?.readiness_percentage || 0}%</span>
            <span className="text-xs text-txt-muted">Overall Preparedness</span>
          </div>
          <p className="text-xs text-txt-secondary mt-1">
            Status: <span className="font-semibold text-txt-primary">{user?.profile?.placement_status || 'Preparing'}</span>
          </p>
        </div>

        {/* Progress visual */}
        <div className="w-full md:w-1/2">
          <div className="flex justify-between text-xs text-txt-secondary mb-1">
            <span>Progress to Placement Ready</span>
            <span className="font-semibold">{profile?.readiness_percentage || 0}% / 100%</span>
          </div>
          <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden border border-brd">
            <div
              className="h-full bg-brand-blue rounded-full transition-all duration-500"
              style={{ width: `${profile?.readiness_percentage || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Assessment Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-muted uppercase">Coding Evaluation</span>
            <Code className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-bold text-txt-primary mt-2">{profile?.coding_score || 0}%</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">Algorithms & Problem Solving</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-muted uppercase">Aptitude Test</span>
            <FileCheck className="w-4 h-4 text-brand-sage" />
          </div>
          <p className="text-2xl font-bold text-txt-primary mt-2">{profile?.aptitude_score || 0}%</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">Logical, Quantitative & Verbal</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-muted uppercase">Mock Interview</span>
            <Briefcase className="w-4 h-4 text-[#B69A65]" />
          </div>
          <p className="text-2xl font-bold text-txt-primary mt-2">{profile?.mock_interview_score || 0}%</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">Faculty & Industry Panel Review</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-brd shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-txt-muted uppercase">Resume Score</span>
            <Award className="w-4 h-4 text-brand-dusty" />
          </div>
          <p className="text-2xl font-bold text-txt-primary mt-2">{profile?.resume_score || 0}%</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">Formatting & Project Depth</p>
        </div>
      </div>

      {/* Skills Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Skills */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
          <h3 className="text-sm font-semibold text-txt-primary mb-3">Verified Technical Competencies</h3>
          <div className="space-y-2.5">
            {profile?.technical_skills?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-status-success" />
                  <span className="font-semibold text-txt-primary">{item.skill}</span>
                </div>
                <Badge variant="accent">{item.level}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle">
          <h3 className="text-sm font-semibold text-txt-primary mb-3">Soft Skills & Professional Evaluation</h3>
          <div className="space-y-2.5">
            {profile?.soft_skills?.map((item: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-bg-highlight border border-brd flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-txt-primary">{item.skill}</span>
                <span className="text-xs font-medium text-brand-blue">{item.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations & Missing Evidence */}
      <div className="bg-white p-6 rounded-xl border border-brd shadow-subtle space-y-4">
        <h3 className="text-sm font-semibold text-txt-primary">Readiness Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 text-xs">
            <p className="font-semibold text-[#7E663B] mb-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Pending Evidence
            </p>
            <ul className="space-y-1 text-txt-secondary list-disc list-inside">
              {profile?.missing_evidence?.map((m: string, idx: number) => (
                <li key={idx}>{m}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-status-success/10 border border-status-success/30 text-xs">
            <p className="font-semibold text-[#3C644E] mb-1 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Recommended Next Steps
            </p>
            <ul className="space-y-1 text-txt-secondary list-disc list-inside">
              {profile?.recommendations?.map((r: string, idx: number) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

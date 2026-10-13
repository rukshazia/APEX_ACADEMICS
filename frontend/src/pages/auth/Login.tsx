import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Lock,
  Mail,
  UserCheck,
  BookOpen,
  Building2,
  Check,
} from 'lucide-react';
import { UserRole } from '../../types';

interface RoleOption {
  id: UserRole;
  label: string;
  badge: string;
  desc: string;
  icon: React.ElementType;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'student',
    label: 'Student',
    badge: 'B.Tech',
    desc: 'Academics, Attendance, Success Score & Services',
    icon: GraduationCap,
  },
  {
    id: 'faculty',
    label: 'Faculty',
    badge: 'Instructor',
    desc: 'Teaching Load, Attendance & Student Risk Queue',
    icon: BookOpen,
  },
  {
    id: 'hod',
    label: 'HOD',
    badge: 'Dept Head',
    desc: 'Department Analytics, Cohort Oversight & Interventions',
    icon: Building2,
  },
  {
    id: 'super_admin',
    label: 'Super Admin',
    badge: 'Administration',
    desc: 'System Configuration, Data Ingestion & Audit Logs',
    icon: ShieldCheck,
  },
];

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRoleOption = ROLE_OPTIONS.find((r) => r.id === selectedRole)!;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      // Authenticate with backend and enforce the selected role preference
      await login(email, password, selectedRole);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillCredentials = (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
      setError(null);
    }
  };

  const handleQuickDevLogin = async (role: UserRole) => {
    setError(null);
    setIsSubmitting(true);
    const creds = DEMO_CREDENTIALS[role];
    try {
      setEmail(creds.email);
      setPassword(creds.pass);
      await login(creds.email, creds.pass, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Development authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand & Crest Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-5">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 border border-navy-800 shadow-md text-white mb-3.5">
          <GraduationCap className="w-8 h-8 text-brand-blue" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-txt-primary">APEX ACADEMICS</h1>
        <p className="mt-1 text-xs font-medium text-txt-secondary tracking-wide">
          AI-Powered Student Success & Campus Analytics Platform
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-7 px-6 sm:px-9 shadow-card border border-brd rounded-2xl">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-txt-primary">Portal Sign In</h2>
            <p className="text-xs text-txt-muted mt-0.5">
              Select your authorized portal role before authenticating
            </p>
          </div>

          {/* Role Selection Tabs (Requirement 2) */}
          <div className="mb-5 space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-txt-muted">
              Select Intended Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-bg-highlight rounded-xl border border-brd">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleRoleSelect(opt.id)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? 'bg-navy-900 text-white shadow-xs font-semibold'
                        : 'text-txt-secondary hover:text-txt-primary hover:bg-white/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-blue' : 'text-txt-muted'}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Context Feedback */}
            <div className="p-2.5 rounded-lg bg-bg-highlight/70 border border-brd-subtle flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 truncate">
                <span className="w-2 h-2 rounded-full bg-status-success shrink-0" />
                <span className="text-txt-secondary truncate">
                  Role Scope:{' '}
                  <strong className="text-txt-primary font-semibold">
                    {activeRoleOption.label}
                  </strong>{' '}
                  ({activeRoleOption.desc})
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white text-txt-muted border border-brd shrink-0">
                {activeRoleOption.badge}
              </span>
            </div>
          </div>

          {/* Error Message Notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-start space-x-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Authentication Error</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@campus.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main placeholder:text-txt-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-txt-primary">
                  Password
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset instructions have been forwarded to campus IT dispatch.');
                  }}
                  className="text-[11px] font-medium text-brand-blue hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main placeholder:text-txt-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-brd text-navy-900 focus:ring-brand-blue cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-txt-secondary cursor-pointer select-none">
                Remember this device for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In as {activeRoleOption.label}</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Development Login Helper (Requirement 4) */}
          {import.meta.env.DEV && (
            <div className="mt-5 pt-4 border-t border-brd">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-txt-primary flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-blue mr-1.5" />
                  Development Fast Access
                </span>
                <span className="text-[10px] font-mono text-txt-muted bg-bg-highlight px-1.5 py-0.5 rounded border border-brd">
                  DEV ONLY
                </span>
              </div>
              <p className="text-[11px] text-txt-muted mb-2.5 leading-relaxed">
                Test the selected <strong className="text-txt-primary font-medium">{activeRoleOption.label}</strong> role using verified pre-seeded institutional credentials:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillCredentials(selectedRole)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-brd bg-bg-highlight hover:bg-white hover:border-brand-blue text-txt-primary transition-colors text-center truncate"
                >
                  Fill {activeRoleOption.label} Details
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDevLogin(selectedRole)}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors text-center disabled:opacity-50 truncate"
                >
                  One-Click Sign In
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-brd text-center text-xs text-txt-secondary">
            <span>New student admission? </span>
            <Link to="/register" className="font-semibold text-brand-blue hover:underline">
              Register student account
            </Link>
          </div>
        </div>

        {/* Security & Confidentiality Notice */}
        <p className="mt-5 text-center text-[11px] text-txt-muted">
          Protected Institutional System • Encrypted Session Management • v1.0.0
        </p>
      </div>
    </div>
  );
};

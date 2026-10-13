import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, AlertCircle, User, Mail, Hash, Building, Lock } from 'lucide-react';
import { Department } from '../../types';

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.admin.getDepartments()
      .then(setDepartments)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.auth.register({
        full_name: fullName,
        email,
        password,
        roll_number: rollNumber,
        department_id: departmentId || undefined,
      });
      // Automatically log in
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check input requirements.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand & Crest Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy-900 border border-navy-800 shadow-md text-white mb-4">
          <GraduationCap className="w-8 h-8 text-brand-blue" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-txt-primary">APEX ACADEMICS</h1>
        <p className="mt-1 text-xs font-medium text-txt-secondary tracking-wide">
          Student Self-Enrollment & Portal Setup
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-card border border-brd rounded-2xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-txt-primary">Create Student Account</h2>
            <p className="text-xs text-txt-muted mt-0.5">
              Enter your verified institutional details to register
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maya Chen"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main placeholder:text-txt-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

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
                  placeholder="maya.chen@campus.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main placeholder:text-txt-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Student ID / Roll Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Hash className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. STU2025-055"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main placeholder:text-txt-muted focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Academic Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-txt-muted">
                  <Building className="w-4 h-4" />
                </div>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs text-txt-primary border border-brd rounded-lg bg-bg-main focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-colors"
                >
                  <option value="">Select Academic Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-txt-primary mb-1">
                Choose Password
              </label>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Registering Account...</span>
              ) : (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-brd text-center text-xs text-txt-secondary">
            <span>Already have an institutional account? </span>
            <Link to="/login" className="font-semibold text-brand-blue hover:underline">
              Sign In
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-txt-muted">
          Protected Institutional System • Academic Records Integrity • v1.0.0
        </p>
      </div>
    </div>
  );
};

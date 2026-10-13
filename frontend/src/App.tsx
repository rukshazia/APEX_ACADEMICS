import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/common/Layout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Dashboard
import { Dashboard } from './pages/dashboard/Dashboard';

// Student Pages
import { AcademicsPage } from './pages/student/AcademicsPage';
import { SuccessScorePage } from './pages/student/SuccessScorePage';
import { JourneyPage } from './pages/student/JourneyPage';
import { PlacementPage } from './pages/student/PlacementPage';
import { ServicesPage } from './pages/student/ServicesPage';

// Faculty Pages
import { AttendanceRecorderPage } from './pages/faculty/AttendanceRecorderPage';
import { FacultyAssignmentsPage } from './pages/faculty/AssignmentsPage';
import { RiskAlertsPage } from './pages/faculty/RiskAlertsPage';
import { InterventionsPage } from './pages/faculty/InterventionsPage';

// HOD Pages
import { DepartmentAnalyticsPage } from './pages/hod/DepartmentAnalyticsPage';
import { FacultyOverviewPage } from './pages/hod/FacultyOverviewPage';

// Admin Pages
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { DepartmentsPage } from './pages/admin/DepartmentsPage';
import { ImportWizardPage } from './pages/admin/ImportWizardPage';
import { ImportHistoryPage } from './pages/admin/ImportHistoryPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { IntegrationsPage } from './pages/admin/IntegrationsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

// Shared Pages
import { StudentDirectoryPage } from './pages/common/StudentDirectoryPage';
import { AskDataPage } from './pages/common/AskDataPage';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* General Protected Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ask-data" element={<AskDataPage />} />

                {/* Student-Only Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route path="/academics" element={<AcademicsPage />} />
                  <Route path="/success-score" element={<SuccessScorePage />} />
                  <Route path="/journey" element={<JourneyPage />} />
                  <Route path="/placement" element={<PlacementPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                </Route>

                {/* Faculty / HOD / Admin Permitted Routes */}
                <Route element={<ProtectedRoute allowedRoles={['faculty', 'hod', 'super_admin']} />}>
                  <Route path="/students" element={<StudentDirectoryPage />} />
                  <Route path="/faculty/attendance" element={<AttendanceRecorderPage />} />
                  <Route path="/faculty/assignments" element={<FacultyAssignmentsPage />} />
                  <Route path="/faculty/risk-alerts" element={<RiskAlertsPage />} />
                  <Route path="/faculty/interventions" element={<InterventionsPage />} />
                </Route>

                {/* HOD / Admin Leadership Routes */}
                <Route element={<ProtectedRoute allowedRoles={['hod', 'super_admin']} />}>
                  <Route path="/hod/analytics" element={<DepartmentAnalyticsPage />} />
                  <Route path="/hod/faculty" element={<FacultyOverviewPage />} />
                </Route>

                {/* Super Admin Only Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                  <Route path="/admin/users" element={<UserManagementPage />} />
                  <Route path="/admin/departments" element={<DepartmentsPage />} />
                  <Route path="/admin/import" element={<ImportWizardPage />} />
                  <Route path="/admin/import-history" element={<ImportHistoryPage />} />
                  <Route path="/admin/settings" element={<SettingsPage />} />
                  <Route path="/admin/integrations" element={<IntegrationsPage />} />
                  <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                </Route>

                {/* Catch-All Redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

const BASE_URL = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or unauthenticated
    setAuthToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errMsg = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      // not JSON
    }
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<any>('/auth/me'),
    changePassword: (data: any) => request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    getDemoAccounts: () => request<any[]>('/auth/demo-accounts'),
  },

  // Users & Directory
  users: {
    getStudents: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/users/students${q ? `?${q}` : ''}`);
    },
    getStudentDetail: (id: string) => request<any>(`/users/students/${id}`),
    getFaculty: (deptId?: string) => request<any[]>(`/users/faculty${deptId ? `?department_id=${deptId}` : ''}`),
    createStaff: (data: any) => request<any>('/users/create-staff', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Academics
  academics: {
    getCourses: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/academics/courses${q ? `?${q}` : ''}`);
    },
    getAttendance: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/academics/attendance${q ? `?${q}` : ''}`);
    },
    getAttendanceSummary: (studentId: string) => request<any>(`/academics/attendance/summary/${studentId}`),
    recordAttendance: (data: any) => request<any>('/academics/attendance/record', { method: 'POST', body: JSON.stringify(data) }),
    getAssignments: (courseId?: string) => request<any[]>(`/academics/assignments${courseId ? `?course_id=${courseId}` : ''}`),
    createAssignment: (data: any) => request<any>('/academics/assignments', { method: 'POST', body: JSON.stringify(data) }),
    getSubmissions: (asgId: string) => request<any[]>(`/academics/assignments/${asgId}/submissions`),
    submitAssignment: (asgId: string, data: any) => request<any>(`/academics/assignments/${asgId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
    gradeSubmission: (subId: string, data: any) => request<any>(`/academics/assignments/submissions/${subId}/grade`, { method: 'PUT', body: JSON.stringify(data) }),
    getGrades: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/academics/grades${q ? `?${q}` : ''}`);
    },
    recordGrade: (data: any) => request<any>('/academics/grades', { method: 'POST', body: JSON.stringify(data) }),
    getTimetable: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/academics/timetable${q ? `?${q}` : ''}`);
    },
    getCalendar: () => request<any[]>('/academics/calendar'),
  },

  // Analytics & AI
  analytics: {
    getSuccessScore: (studentId: string) => request<any>(`/analytics/success-score/${studentId}`),
    getRiskStudents: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<{
        items: any[];
        total_count: number;
        page: number;
        page_size: number;
        total_pages: number;
        summary: {
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
        };
      }>(`/analytics/risk-students${q ? `?${q}` : ''}`);
    },
    getRiskStudentDetail: (studentId: string) => request<any>(`/analytics/risk-students/${studentId}`),
    getRiskAiInsights: (studentId: string) => request<any>(`/analytics/risk-ai-insights/${studentId}`),
    getRiskSummary: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any>(`/analytics/risk-summary${q ? `?${q}` : ''}`);
    },
    recalculateRisk: (data?: any) => request<any>('/analytics/risk-recalculate', { method: 'POST', body: JSON.stringify(data || {}) }),
    getRiskAlerts: (params?: Record<string, any>) => {
      const q = new URLSearchParams(params || {}).toString();
      return request<any[]>(`/analytics/risk-alerts${q ? `?${q}` : ''}`);
    },
    updateRiskAlertStatus: (id: string, data: any) => request<any>(`/analytics/risk-alerts/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    getInterventions: (status?: string) => request<any[]>(`/analytics/interventions${status ? `?status=${status}` : ''}`),
    createIntervention: (data: any) => request<any>('/analytics/interventions', { method: 'POST', body: JSON.stringify(data) }),
    updateIntervention: (id: string, data: any) => request<any>(`/analytics/interventions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getJourney: (studentId: string) => request<any[]>(`/analytics/journey/${studentId}`),
    getPlacement: (studentId: string) => request<any>(`/analytics/placement/${studentId}`),
    getSegmentation: () => request<any>('/analytics/segmentation'),
  },

  // Services
  services: {
    getFees: (studentId?: string) => request<any[]>(`/services/fees${studentId ? `?student_id=${studentId}` : ''}`),
    getLeaves: () => request<any[]>('/services/leaves'),
    submitLeave: (data: any) => request<any>('/services/leaves', { method: 'POST', body: JSON.stringify(data) }),
    reviewLeave: (id: string, data: any) => request<any>(`/services/leaves/${id}/review`, { method: 'PUT', body: JSON.stringify(data) }),
    getAppointments: () => request<any[]>('/services/appointments'),
    bookAppointment: (data: any) => request<any>('/services/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateAppointmentStatus: (id: string, data: any) => request<any>(`/services/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
    getAnnouncements: () => request<any[]>('/services/announcements'),
    publishAnnouncement: (data: any) => request<any>('/services/announcements', { method: 'POST', body: JSON.stringify(data) }),
    getNotifications: () => request<any[]>('/services/notifications'),
    markNotificationRead: (id: string) => request<any>(`/services/notifications/${id}/read`, { method: 'PUT' }),
    markAllNotificationsRead: () => request<any>('/services/notifications/read-all', { method: 'PUT' }),
    getExtracurricular: (studentId?: string) => request<any[]>(`/services/extracurricular${studentId ? `?student_id=${studentId}` : ''}`),
  },

  // Importer
  importer: {
    inspect: (formData: FormData) => request<any>('/importer/inspect', { method: 'POST', body: formData }),
    preview: (formData: FormData) => request<any>('/importer/preview', { method: 'POST', body: formData }),
    execute: (data: any) => request<any>('/importer/execute', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: () => request<any[]>('/importer/history'),
    downloadTemplateUrl: `${BASE_URL}/importer/template/csv`,
  },

  // Ask Your Data
  askData: {
    query: (question: string) => request<any>('/ask-data/query', { method: 'POST', body: JSON.stringify({ question }) }),
    getSampleQuestions: () => request<string[]>('/ask-data/sample-questions'),
  },

  // Admin
  admin: {
    getDepartments: () => request<any[]>('/admin/departments'),
    createDepartment: (data: any) => request<any>('/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
    getSettings: () => request<any>('/admin/settings'),
    updateSettings: (data: any) => request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
    getAuditLogs: (limit?: number) => request<any[]>(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`),
    getIntegrationsStatus: () => request<any>('/admin/integrations/status'),
    getExportUrl: (type: string) => `${BASE_URL}/admin/export/${type}`,
  }
};

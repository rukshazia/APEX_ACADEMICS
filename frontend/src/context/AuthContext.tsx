import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setAuthToken, getAuthToken } from '../api/client';

export interface DemoCredential {
  email: string;
  pass: string;
  name: string;
  title: string;
  subtitle: string;
}

export const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> = {
  student: {
    email: 'student@campus.edu',
    pass: 'Student@123',
    name: 'Alex Rivera',
    title: 'Student Portal',
    subtitle: 'Academics, Attendance, Success Score & Services',
  },
  faculty: {
    email: 'faculty@campus.edu',
    pass: 'Faculty@123',
    name: 'Dr. Sarah Jenkins',
    title: 'Faculty Portal',
    subtitle: 'Course Teaching, Attendance Recording & Risk Queue',
  },
  hod: {
    email: 'hod@campus.edu',
    pass: 'Hod@123',
    name: 'Prof. Robert Vance',
    title: 'HOD Leadership',
    subtitle: 'Department Analytics, Cohort Oversight & Interventions',
  },
  super_admin: {
    email: 'admin@campus.edu',
    pass: 'Admin@123',
    name: 'Dean Eleanor Vance',
    title: 'Super Admin',
    subtitle: 'Institutional Settings, Excel Ingestion & Compliance',
  },
};

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, requestedRole?: UserRole) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (!getAuthToken()) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const data = await api.auth.me();
      setUser(data);
    } catch {
      setUser(null);
      setAuthToken(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string, requestedRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      // Authenticate with the backend, passing the selected portal role preference
      const res = await api.auth.login({
        email: email.trim().toLowerCase(),
        password: pass,
        requested_role: requestedRole,
      });

      // Save token in client state
      setAuthToken(res.access_token);
      setToken(res.access_token);

      // Verify the full authenticated user record
      const currentUser: User = await api.auth.me();

      // Enforce security rule: The selected role is a preference, not authorization.
      // If the backend-authorized role does not match the requested role, revoke session immediately.
      if (requestedRole && currentUser.role !== requestedRole) {
        setAuthToken(null);
        setToken(null);
        setUser(null);
        const roleDisplayNames: Record<UserRole, string> = {
          student: 'Student',
          faculty: 'Faculty',
          hod: 'Head of Department (HOD)',
          super_admin: 'Super Admin',
        };
        const actualName = roleDisplayNames[currentUser.role] || currentUser.role;
        const requestedName = roleDisplayNames[requestedRole] || requestedRole;
        throw new Error(
          `Access denied: Your account credentials are authorized for the "${actualName}" role, which does not match the selected portal role "${requestedName}". Please select "${actualName}" to sign in.`
        );
      }

      setUser(currentUser);
      return currentUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // End authenticated session: clear persistent token and in-memory auth state
    setAuthToken(null);
    setToken(null);
    setUser(null);
    // Redirect to the portal sign-in page
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

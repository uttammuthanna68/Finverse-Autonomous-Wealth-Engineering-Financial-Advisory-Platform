import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth, API_BASE_URL } from '../api/config';

export interface User {
  id: number;
  email: string;
  full_name?: string;
  salary?: number;
  expenses?: number;
  savings?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  sessionNotice: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: (notice?: string) => void;
  refetchUser: () => Promise<void>;
  clearSessionNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours max session
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins idle logout

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(localStorage.getItem('auth_notice'));

  const safeJson = async (res: Response): Promise<any> => {
    try {
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  };

  const clearSessionNotice = () => {
    localStorage.removeItem('auth_notice');
    setSessionNotice(null);
  };

  const logout = (notice?: string) => {
    localStorage.removeItem('token');
    localStorage.removeItem('session_start_time');
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('onboarding_')) {
        localStorage.removeItem(key);
      }
    });

    if (notice) {
      localStorage.setItem('auth_notice', notice);
      setSessionNotice(notice);
    } else {
      localStorage.removeItem('auth_notice');
      setSessionNotice(null);
    }

    setToken(null);
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  const refetchUser = async () => {
    const storedToken = localStorage.getItem('token');
    const sessionStartTime = localStorage.getItem('session_start_time');

    if (!storedToken) {
      setUser(null);
      setToken(null);
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return;
    }

    // Check if session has exceeded 24 hours
    if (sessionStartTime) {
      const sessionAge = Date.now() - Number(sessionStartTime);
      if (sessionAge > MAX_SESSION_DURATION_MS) {
        console.warn('Session expired (exceeded 24 hours)');
        logout('Your session has expired after 24 hours for financial security. Please log in again.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetchWithAuth('/api/profile/me');
      if (res.ok) {
        const userData = await safeJson(res);
        if (userData && (userData.id || userData.email)) {
          setUser(userData);
          setToken(storedToken);

          const isCompleted = Boolean(userData.has_completed_onboarding || userData.financial_profile?.has_completed_onboarding);
          setHasCompletedOnboarding(isCompleted);
        } else {
          setUser(null);
          setHasCompletedOnboarding(false);
        }
      } else {
        // Backend returned 401 Unauthorized or invalid token
        logout('Session expired or invalid token. Please log in again.');
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      setUser(null);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  // Idle / Inactivity Auto-Logout Effect (30 minutes)
  useEffect(() => {
    if (!token || !user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        console.warn('User inactive for 30 minutes. Logging out.');
        logout('You have been logged out due to 30 minutes of inactivity to protect your financial data.');
      }, INACTIVITY_TIMEOUT_MS);
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [token, user]);

  const parseErrorMessage = (detail: any, fallback: string): string => {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.msg) {
            return item.msg.replace('value is not a valid email address', 'Please enter a valid email address (e.g., user@example.com)');
          }
          return JSON.stringify(item);
        })
        .join('. ');
    }
    if (typeof detail === 'object' && detail.msg) return detail.msg;
    return fallback;
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        const errMsg = parseErrorMessage(data.detail, 'Login failed. Please check your credentials or backend server status.');
        throw new Error(errMsg);
      }

      if (!data.token) {
        throw new Error('Login failed. Authentication server returned an empty or invalid response.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('session_start_time', Date.now().toString());
      localStorage.removeItem('auth_notice');
      setSessionNotice(null);
      setToken(data.token);
      setUser(data.user);
      await refetchUser();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to authentication server. Please check backend connection.');
      }
      throw err;
    }
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await safeJson(res);
      if (!res.ok) {
        const errMsg = parseErrorMessage(data.detail, 'Signup failed. Please check your details or backend server status.');
        throw new Error(errMsg);
      }

      if (!data.token) {
        throw new Error('Signup failed. Registration server returned an empty or invalid response.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('session_start_time', Date.now().toString());
      localStorage.removeItem('auth_notice');
      setSessionNotice(null);
      setToken(data.token);
      setUser(data.user);
      await refetchUser();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to authentication server. Please check backend connection.');
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        hasCompletedOnboarding,
        isLoading,
        sessionNotice,
        login,
        signup,
        logout,
        refetchUser,
        clearSessionNotice,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

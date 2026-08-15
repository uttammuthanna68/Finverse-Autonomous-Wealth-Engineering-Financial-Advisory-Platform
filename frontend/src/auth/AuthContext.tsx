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
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setHasCompletedOnboarding(false);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetchWithAuth('/api/profile/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setToken(storedToken);

        const sal = userData.salary || userData.financial_profile?.salary || 0;
        const isCompleted = userData.has_completed_onboarding || userData.financial_profile?.has_completed_onboarding || sal > 0;
        setHasCompletedOnboarding(!!isCompleted);
      } else {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        setHasCompletedOnboarding(false);
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

  const parseErrorMessage = (detail: any, fallback: string): string => {
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.msg) {
            // Clean up pydantic messages like "value is not a valid email address: The domain name..."
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
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = parseErrorMessage(data.detail, 'Login failed. Please check your credentials.');
      throw new Error(errMsg);
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    await refetchUser();
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });

    const data = await res.json();
    if (!res.ok) {
      const errMsg = parseErrorMessage(data.detail, 'Signup failed. Please check your details.');
      throw new Error(errMsg);
    }

    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    await refetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Clean up local onboarding storage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('onboarding_')) {
        localStorage.removeItem(key);
      }
    });
    setToken(null);
    setUser(null);
    setHasCompletedOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        hasCompletedOnboarding,
        isLoading,
        login,
        signup,
        logout,
        refetchUser,
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

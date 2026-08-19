import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card } from '../components/Card';
import { LogIn, AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearSessionNotice();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address with a domain extension (e.g., user@example.com).');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email.trim(), password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-floating rounded-card-lg border border-primary/20 dark:border-emerald-500/30 bg-card-bg">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-emerald-500/20 text-primary dark:text-emerald-400 mx-auto flex items-center justify-center">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted font-medium">Log in to manage your financial profile and advisors.</p>
        </div>

        {/* Security Session Expiry Banner */}
        {sessionNotice && !error && (
          <div className="flex items-start space-x-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-4 rounded-xl text-xs font-semibold animate-fadeIn">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">{sessionNotice}</div>
          </div>
        )}

        {/* Inline Validation / API Error Banner */}
        {error && (
          <div className="flex items-start space-x-3 bg-warning/10 border border-warning/20 text-warning p-4 rounded-xl text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-main block uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="you@example.com"
                className="w-full bg-surface border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-extrabold text-main block uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-xs font-bold text-primary dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="w-full bg-surface border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-3.5 px-4 rounded-xl text-sm shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-muted font-medium pt-3 border-t border-black/10 dark:border-white/10">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('/signup')}
            className="font-bold text-primary dark:text-emerald-400 hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </div>
      </Card>
    </div>
  );
};

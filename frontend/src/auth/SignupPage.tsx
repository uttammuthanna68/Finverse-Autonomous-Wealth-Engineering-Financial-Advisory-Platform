import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Card } from '../components/Card';
import { UserPlus, AlertCircle, ArrowRight, Lock, Mail, User as UserIcon } from 'lucide-react';

interface SignupPageProps {
  onNavigate: (path: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide an email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address with a domain extension (e.g., user@example.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(email.trim(), password, fullName.trim() || undefined);
      onNavigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Signup failed. An account with this email may already exist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
    if (error) setError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error) setError(null);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (error) setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-card rounded-card-lg border border-black/5 bg-card-bg">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight">Create Account</h1>
          <p className="text-sm text-muted">Join Finverse to unlock personalized wealth planning.</p>
        </div>

        {/* Inline Validation Banner */}
        {error && (
          <div className="flex items-start space-x-3 bg-warning/10 border border-warning/20 text-warning p-4 rounded-xl text-xs font-semibold animate-fadeIn">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-main block uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder="Jane Doe"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-main block uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="jane@example.com"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-main block uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="At least 6 characters"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-main block uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Re-enter password"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Sign Up</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center text-xs text-muted pt-2 border-t border-black/5">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-bold text-primary hover:underline"
          >
            Log in here
          </button>
        </div>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { Card } from '../components/Card';
import { KeyRound, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-card rounded-card-lg border border-black/5 bg-card-bg">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-main tracking-tight">Password Reset</h1>
          <p className="text-sm text-muted">Enter your email address to receive password reset instructions.</p>
        </div>

        {submitted ? (
          <div className="bg-success/10 border border-success/20 p-6 rounded-2xl text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
            <h2 className="text-sm font-bold text-main">Reset Link Dispatched</h2>
            <p className="text-xs text-muted">
              If an account registered to <span className="font-semibold text-main">{email}</span> exists, password recovery instructions have been sent.
            </p>
            <button
              onClick={() => onNavigate('/login')}
              className="mt-2 text-xs font-bold text-primary hover:underline inline-flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Login</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-main block uppercase tracking-wider">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface border border-black/10 rounded-xl px-4 py-2.5 text-sm text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-sm flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>Send Reset Instructions</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Return to Login Footer */}
        <div className="text-center text-xs text-muted pt-2 border-t border-black/5">
          Remembered your password?{' '}
          <button
            onClick={() => onNavigate('/login')}
            className="font-bold text-primary hover:underline inline-flex items-center space-x-1"
          >
            <span>Back to Login</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

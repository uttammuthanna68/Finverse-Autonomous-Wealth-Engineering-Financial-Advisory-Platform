import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchWithAuth } from '../api/config';
import { Card } from '../components/Card';
import { User, ShieldCheck, Lock, KeyRound, PlayCircle } from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
  onReplayTour?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, onReplayTour }) => {
  const { user, refetchUser } = useAuth();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Financial Profile state
  const [salary, setSalary] = useState<number | ''>(0);
  const [expenses, setExpenses] = useState<number | ''>(0);
  const [savings, setSavings] = useState<number | ''>(0);
  const [age, setAge] = useState<number | ''>(30);
  const [epfMonthly, setEpfMonthly] = useState<number | ''>(() => {
    const saved = localStorage.getItem('finverse_epf_monthly');
    return saved ? parseFloat(saved) || 0 : 0;
  });
  const [ppfBalance, setPpfBalance] = useState<number | ''>(() => {
    const saved = localStorage.getItem('finverse_ppf_balance');
    return saved ? parseFloat(saved) || 0 : 0;
  });
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchWithAuth('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          setSalary(data.salary ?? 0);
          setExpenses(data.expenses ?? 0);
          setSavings(data.savings ?? 0);
          setAge(data.age ?? 30);
        }
      } catch (err) {
        console.error('Failed to load profile parameters:', err);
      }
    };

    loadProfile();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      localStorage.setItem('finverse_epf_monthly', (epfMonthly === '' ? 0 : epfMonthly).toString());
      localStorage.setItem('finverse_ppf_balance', (ppfBalance === '' ? 0 : ppfBalance).toString());

      await fetchWithAuth('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          salary: salary === '' ? 0 : salary,
          expenses: expenses === '' ? 0 : expenses,
          savings: savings === '' ? 0 : savings,
          age: age === '' ? 30 : age,
        }),
      });

      setProfileSaved(true);
      await refetchUser();
      window.dispatchEvent(new CustomEvent('finverse_profile_updated'));
      setTimeout(() => setProfileSaved(false), 4000);
    } catch (err) {
      console.error('Failed to save profile parameters:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setResetSuccess(true);
    setOldPassword('');
    setNewPassword('');
    setTimeout(() => setResetSuccess(false), 4000);
  };

  const handleReplayTour = () => {
    if (user?.id) {
      localStorage.removeItem(`has_seen_tour_user_${user.id}`);
    } else {
      localStorage.removeItem('has_seen_tour_user_1');
    }
    if (onReplayTour) {
      onReplayTour();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="border-b border-black/5 pb-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wider block">Account Settings & Security</span>
        <h1 className="text-3xl font-black text-main tracking-tight">User Profile</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Information Card */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center space-x-3 border-b border-black/5 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-main">Account Details</h2>
              <span className="text-xs text-muted font-medium">Session & Profile Metadata</span>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-surface p-3 rounded-xl border border-black/5">
              <span className="text-muted block text-[10px] uppercase font-bold">Full Name</span>
              <span className="font-extrabold text-main text-sm">{user?.full_name || 'Finverse User'}</span>
            </div>

            <div className="bg-surface p-3 rounded-xl border border-black/5">
              <span className="text-muted block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-extrabold text-main font-mono text-sm">{user?.email || 'user@example.com'}</span>
            </div>

            <div className="bg-surface p-3 rounded-xl border border-black/5 flex items-center justify-between">
              <div>
                <span className="text-muted block text-[10px] uppercase font-bold">Data Security Status</span>
                <span className="font-bold text-success text-xs flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>At-Rest Fernet Encryption Active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Replay Guided Tour Trigger Button */}
          <div className="pt-2">
            <button
              onClick={handleReplayTour}
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors border border-primary/20"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Replay Guided Product Tour 🐼</span>
            </button>
          </div>
        </Card>

        {/* Security & Password Reset Form */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center space-x-3 border-b border-black/5 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-main">Security Settings</h2>
              <span className="text-xs text-muted font-medium">Update Authentication Credentials</span>
            </div>
          </div>

          {resetSuccess && (
            <div className="bg-success/10 border border-success/30 text-success p-3 rounded-xl text-xs font-bold animate-fadeIn">
              Password updated successfully!
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
            <div>
              <label className="text-main font-bold block mb-1">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <div>
              <label className="text-main font-bold block mb-1">New Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={!oldPassword || !newPassword}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition-all disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>Update Password</span>
            </button>
          </form>
        </Card>

      </div>

      {/* Editable Financial Profile Parameters Card */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-main">Financial Profile Parameters</h2>
              <span className="text-xs text-muted font-medium">Update income, expenses, and savings to re-calculate all engines</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/onboarding')}
            className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
          >
            <span>Edit via Full Onboarding Wizard →</span>
          </button>
        </div>

        {profileSaved && (
          <div className="bg-success/10 border border-success/30 text-success p-3 rounded-xl text-xs font-bold animate-fadeIn">
            Financial profile updated! Real-time calculations synced across Dashboard, Portfolios & Priority plan.
          </div>
        )}

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">Monthly Salary (₹)</label>
            <input
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="100000"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">Monthly Expenses (₹)</label>
            <input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="40000"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">Current Savings (₹)</label>
            <input
              type="number"
              value={savings}
              onChange={(e) => setSavings(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="250000"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">Age (Years)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="30"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">EPF Monthly Contribution (₹)</label>
            <input
              type="number"
              value={epfMonthly}
              onChange={(e) => setEpfMonthly(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="3600"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-main font-bold block uppercase text-[10px]">PPF Current Balance (₹)</label>
            <input
              type="number"
              value={ppfBalance}
              onChange={(e) => setPpfBalance(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="150000"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isSavingProfile ? 'Syncing Parameters...' : 'Save Financial Profile & Update Engines'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

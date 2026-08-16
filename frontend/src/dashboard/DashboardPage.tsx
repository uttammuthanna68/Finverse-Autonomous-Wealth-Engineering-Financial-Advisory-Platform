import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { ShellyMascot } from '../components/ShellyMascot';
import { LiveMarketCard } from '../components/LiveMarketCard';
import { MonthlyCheckinModal } from '../components/MonthlyCheckinModal';
import { AnnualStepUpModal } from '../components/AnnualStepUpModal';
import { PrintableReportModal } from '../components/PrintableReportModal';
import { showShellyToast } from '../components/ShellyToast';
import { fetchWithAuth } from '../api/config';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Target,
  PiggyBank,
  CheckCircle2,
  Zap,
  FileText,
  Edit3,
  Clock,
  X,
  Check,
  Compass,
  Calendar,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

interface EmergencyAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSavings: number;
  onSave: (newSavings: number, reason?: string) => void;
}

const EmergencyAdjustModal: React.FC<EmergencyAdjustModalProps> = ({
  isOpen,
  onClose,
  currentSavings,
  onSave,
}) => {
  const [mode, setMode] = useState<'withdraw' | 'set'>('withdraw');
  const [amount, setAmount] = useState<number | ''>(10000);
  const [reason, setReason] = useState<string>('Medical Expense');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(amount) || 0;
    let finalSavings = currentSavings;
    if (mode === 'withdraw') {
      finalSavings = Math.max(0, currentSavings - numAmt);
    } else {
      finalSavings = Math.max(0, numAmt);
    }
    onSave(finalSavings, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="max-w-md w-full p-6 bg-card-bg shadow-2xl rounded-card-lg border border-black/10 relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-surface">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3 border-b border-black/10 dark:border-white/10 pb-3">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="text-lg font-black text-main tracking-tight">Record Emergency Fund Activity</h3>
            <p className="text-xs text-muted font-medium">Log emergency withdrawals or adjust active buffer.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setMode('withdraw')}
              className={`flex-1 py-2.5 rounded-xl font-extrabold border transition-all ${
                mode === 'withdraw'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-surface text-main border-black/10 hover:bg-black/5'
              }`}
            >
              Record Expense / Withdrawal
            </button>
            <button
              type="button"
              onClick={() => setMode('set')}
              className={`flex-1 py-2.5 rounded-xl font-extrabold border transition-all ${
                mode === 'set'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-surface text-main border-black/10 hover:bg-black/5'
              }`}
            >
              Set New Balance
            </button>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-main block uppercase tracking-wider text-[10px]">
              {mode === 'withdraw' ? 'Amount Used (₹)' : 'New Total Emergency Buffer (₹)'}
            </label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="e.g. 25000"
              className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2.5 text-sm font-mono font-bold text-main focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {mode === 'withdraw' && (
            <div className="space-y-1">
              <label className="font-bold text-main block uppercase tracking-wider text-[10px]">Reason (Optional)</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Hospital bill, car repair, job transition"
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2.5 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2 border-t border-black/10 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-bold bg-surface text-main border border-black/10">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2 rounded-xl font-extrabold bg-emerald-700 text-white shadow-xs hover:bg-emerald-800 transition-colors">
              Update Emergency Shield
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, hasCompletedOnboarding } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [debtsData, setDebtsData] = useState<any>(null);
  const [isCheckinOpen, setIsCheckinOpen] = useState<boolean>(false);
  const [isEmergencyAdjustOpen, setIsEmergencyAdjustOpen] = useState<boolean>(false);
  const [isStepUpModalOpen, setIsStepUpModalOpen] = useState<boolean>(false);
  const [isPrintableModalOpen, setIsPrintableModalOpen] = useState<boolean>(false);
  const [roadmapTab, setRoadmapTab] = useState<'monthly' | 'phases'>('monthly');
  const [stepUpRate, setStepUpRate] = useState<number>(() => {
    const saved = localStorage.getItem('finverse_annual_stepup_rate');
    return saved ? parseFloat(saved) || 10 : 10;
  });

  const storageKeyCheckin = user ? `last_checkin_timestamp_${user.id}` : 'last_checkin_timestamp';
  const storageKeyPortfolioMem = user ? `portfolio_baseline_savings_${user.id}` : 'portfolio_baseline_savings';
  const storageKeyDebts = 'user_active_debts_v1';

  const loadDashboardData = async () => {
    try {
      let sal = 100000;
      let exp = 40000;
      let sav = 100000;

      const profileRes = await fetchWithAuth('/api/profile/me');
      if (profileRes.ok) {
        const prof = await profileRes.json();
        const savedOverride = localStorage.getItem('finverse_profile_savings');
        if (savedOverride) {
          prof.savings = parseFloat(savedOverride) || 0;
        }

        setProfileData(prof);
        sal = prof.salary || 100000;
        exp = prof.expenses || 40000;
        sav = prof.savings || 100000;
      }

      const debtRes = await fetchWithAuth('/api/engine/analyze-debts', {
        method: 'POST',
        body: JSON.stringify({
          monthly_income: sal,
          monthly_expenses: exp,
          current_savings: sav,
          risk_score: 50.0,
        }),
      });

      if (debtRes.ok) {
        const dData = await debtRes.json();
        setDebtsData(dData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleProfileUpdate = () => {
      loadDashboardData();
    };

    window.addEventListener('finverse_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('finverse_profile_updated', handleProfileUpdate);
  }, []);

  // Check 30-Day Checkin Due
  useEffect(() => {
    const saved = localStorage.getItem(storageKeyCheckin);
    if (saved) {
      const lastTs = parseInt(saved, 10);
      const diffDays = Math.floor((Date.now() - lastTs) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        setIsCheckinOpen(true);
      }
    } else {
      localStorage.setItem(storageKeyCheckin, Date.now().toString());
    }
  }, [user?.id, storageKeyCheckin]);

  // Compute Active Inflow, Expenses & Savings from User Profile
  const salary = profileData?.salary || 0;
  const expenses = profileData?.expenses || 0;
  const savings = profileData?.savings || 0;
  const hasProfile = hasCompletedOnboarding || profileData?.has_completed_onboarding || salary > 0;

  // Local Debts Calculation
  let localDebtsList: any[] = [];
  const savedDebtsStr = localStorage.getItem(storageKeyDebts);
  if (savedDebtsStr) {
    try { localDebtsList = JSON.parse(savedDebtsStr); } catch (e) {}
  }
  const totalLocalDebtBalance = localDebtsList.reduce((acc, d) => acc + (Number(d.balance) || 0), 0);
  const totalLocalDebtEmi = localDebtsList.reduce((acc, d) => acc + (Number(d.minimum_payment) || 0), 0);

  // Combined Debts Array (Local + Engine)
  const activeDebtsList: any[] = localDebtsList.length > 0
    ? localDebtsList
    : (debtsData?.waterfall?.debts || []);

  const totalDebtBalance = totalLocalDebtBalance > 0
    ? totalLocalDebtBalance
    : (debtsData?.waterfall?.debts?.reduce((acc: number, d: any) => acc + (d.balance || 0), 0) || 0);

  const totalDebtMonthlyEmi = totalLocalDebtEmi > 0
    ? totalLocalDebtEmi
    : (debtsData?.waterfall?.debts?.reduce((acc: number, d: any) => acc + (d.minimum_payment || 0), 0) || 0);

  // Emergency Fund Calculations
  const emergencyTargetMonths = debtsData?.waterfall?.emergency_fund_target_months || 6;
  const emergencyTargetAmount = (expenses || 40000) * emergencyTargetMonths;
  const emergencyRemaining = Math.max(0, emergencyTargetAmount - savings);
  const emergencyProgressPct = Math.min(100, Math.round((savings / emergencyTargetAmount) * 100)) || 0;

  // Monthly Surplus & Priority Waterfall Breakdown
  const monthlySurplus = Math.max(0, salary - expenses);

  // Strict Financial Waterfall Priority Allocation
  let monthlyDebtPayment = 0;
  let monthlyEmergencyDeposit = 0;
  let monthlyGoalSip = 0;

  if (totalDebtBalance > 0) {
    monthlyDebtPayment = Math.min(monthlySurplus, totalDebtMonthlyEmi > 0 ? totalDebtMonthlyEmi : Math.max(2500, Math.round(totalDebtBalance * 0.15)));
    const remainingAfterDebt = Math.max(0, monthlySurplus - monthlyDebtPayment);

    if (remainingAfterDebt > 0 && emergencyRemaining > 0) {
      monthlyEmergencyDeposit = Math.min(remainingAfterDebt, Math.round(remainingAfterDebt * 0.8));
      monthlyGoalSip = Math.max(0, remainingAfterDebt - monthlyEmergencyDeposit);
    } else {
      monthlyGoalSip = remainingAfterDebt;
    }
  } else if (emergencyRemaining > 0) {
    monthlyEmergencyDeposit = Math.min(monthlySurplus, Math.round(monthlySurplus * 0.75));
    monthlyGoalSip = Math.max(0, monthlySurplus - monthlyEmergencyDeposit);
  } else {
    monthlyGoalSip = monthlySurplus;
  }

  const monthlyPortfolioSip = monthlyGoalSip;

  // Dynamic Portfolio Growth Baseline Persistence
  const savedBaselineStr = localStorage.getItem(storageKeyPortfolioMem);
  let baselineAccumulated = savedBaselineStr ? parseFloat(savedBaselineStr) : savings;
  if (savings > baselineAccumulated) {
    baselineAccumulated = savings;
    localStorage.setItem(storageKeyPortfolioMem, baselineAccumulated.toString());
  }

  // 12-Month Compounding Projections Layering On Top Of Historical Baseline
  const investmentChartData = [
    { month: 'Baseline', invested: baselineAccumulated, value: baselineAccumulated },
    { month: 'Month 1', invested: baselineAccumulated + monthlyPortfolioSip * 1, value: baselineAccumulated + monthlyPortfolioSip * 1.01 },
    { month: 'Month 3', invested: baselineAccumulated + monthlyPortfolioSip * 3, value: baselineAccumulated + monthlyPortfolioSip * 3.03 },
    { month: 'Month 6', invested: baselineAccumulated + monthlyPortfolioSip * 6, value: baselineAccumulated + monthlyPortfolioSip * 6.08 },
    { month: 'Month 9', invested: baselineAccumulated + monthlyPortfolioSip * 9, value: baselineAccumulated + monthlyPortfolioSip * 9.15 },
    { month: 'Month 12', invested: baselineAccumulated + monthlyPortfolioSip * 12, value: baselineAccumulated + monthlyPortfolioSip * 12.25 },
  ];

  // Handle Emergency Fund Manual Adjust / Expense Record
  const handleSaveEmergencyAdjust = (newSavingsVal: number, reason?: string) => {
    localStorage.setItem('finverse_profile_savings', newSavingsVal.toString());
    setProfileData((prev: any) => ({ ...prev, savings: newSavingsVal }));

    fetchWithAuth('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify({ savings: newSavingsVal }),
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('finverse_profile_updated'));

    showShellyToast({
      title: 'Emergency Buffer Updated 🛡️',
      message: reason
        ? `Recorded emergency use (${reason}). Priority Waterfall updated to rebuild your shield!`
        : 'Emergency reserve buffer updated successfully.',
      pose: 'thinking',
    });
  };

  // Adaptive Monthly Checkin Progress Handler
  const handleSaveCheckin = (summary: any) => {
    if (summary.paidDebt && localDebtsList.length > 0) {
      const updatedDebts = localDebtsList.map((d: any) => {
        const emi = Number(d.minimum_payment) || 2500;
        const currentBal = Number(d.balance) || 0;
        const newBal = Math.max(0, currentBal - emi);
        return { ...d, balance: newBal };
      });
      localStorage.setItem(storageKeyDebts, JSON.stringify(updatedDebts));
    } else if (!summary.paidDebt && localDebtsList.length > 0) {
      // Accrue 1 month interest on missed debt payments
      const updatedDebts = localDebtsList.map((d: any) => {
        const apr = Number(d.apr) || 18.0;
        const currentBal = Number(d.balance) || 0;
        const accruedInterest = (currentBal * (apr / 100)) / 12;
        const newBal = Math.round(currentBal + accruedInterest);
        return { ...d, balance: newBal };
      });
      localStorage.setItem(storageKeyDebts, JSON.stringify(updatedDebts));
    }

    if (summary.depositedEmergency) {
      const currentSavingsVal = profileData?.savings || savings;
      const updatedSavings = currentSavingsVal + monthlyEmergencyDeposit;
      localStorage.setItem('finverse_profile_savings', updatedSavings.toString());
      fetchWithAuth('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify({ savings: updatedSavings }),
      }).catch(() => {});
    }

    localStorage.setItem(storageKeyCheckin, Date.now().toString());
    setIsCheckinOpen(false);
    window.dispatchEvent(new CustomEvent('finverse_profile_updated'));

    showShellyToast({
      title: 'Monthly Progress Saved! 🗓️',
      message: summary.paidDebt
        ? 'Great execution! Your debt balance decreased and progress was updated.'
        : 'Payment missed noted. Accrued monthly interest was added and your priority plan was adjusted.',
      pose: summary.paidDebt ? 'happy' : 'thinking',
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Live Market Intelligence Bar */}
      <LiveMarketCard compact onOpenShellyChat={() => window.dispatchEvent(new CustomEvent('open_shelly_chat'))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Personal Wealth Command Center
          </span>
          <h1 className="text-3xl font-black text-main tracking-tight">Financial Dashboard</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPrintableModalOpen(true)}
            className="bg-surface hover:bg-surface/80 text-main font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-black/10 shadow-xs"
            title="Download PDF Financial Report"
          >
            <FileText className="w-4 h-4 text-primary" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => setIsStepUpModalOpen(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-primary/20"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span>Step-Up SIP ({stepUpRate}%/yr)</span>
          </button>
        </div>
      </div>

      {/* Profile Setup Warning Banner */}
      {!hasProfile && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 text-amber-800 dark:text-amber-300">
            <ShellyMascot pose="thinking" size="sm" animateFloat={false} />
            <div>
              <strong className="font-extrabold block">Onboarding Not Completed Yet</strong>
              <span>Complete onboarding to customize your monthly surplus, active debts, and target goals.</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/onboarding')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 whitespace-nowrap shadow-xs"
          >
            <span>Start Onboarding</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Overview Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-card-bg shadow-card rounded-card border border-black/5 space-y-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Monthly Net Inflow</span>
          <div className="text-2xl font-black text-main font-mono">₹{salary.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted font-medium">Verified Salary / Self-Employed</span>
        </Card>

        <Card className="p-5 bg-card-bg shadow-card rounded-card border border-black/5 space-y-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Monthly Expenses</span>
          <div className="text-2xl font-black text-main font-mono">₹{expenses.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted font-medium">Essential & Fixed Living Outflow</span>
        </Card>

        <Card className="p-5 bg-card-bg shadow-card rounded-card border border-black/5 space-y-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Available Net Surplus</span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">₹{monthlySurplus.toLocaleString('en-IN')}/mo</div>
          <span className="text-[11px] text-muted font-medium">Unallocated Monthly Cash Flow</span>
        </Card>

        <Card className="p-5 bg-card-bg shadow-card rounded-card border border-black/5 space-y-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Total Liquid Buffer</span>
          <div className="text-2xl font-black text-main font-mono">₹{savings.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted font-medium">Emergency Reserves & Liquid FDs</span>
        </Card>
      </div>

      {/* Monthly Surplus Allocation Waterfall Breakdown */}
      <div className="bg-surface p-5 rounded-2xl border border-black/5 space-y-3">
        <span className="text-xs font-bold text-main uppercase tracking-wider block">
          Monthly Inflow Allocation Breakdown (Surplus: ₹{monthlySurplus.toLocaleString('en-IN')}/mo)
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-card-bg p-3.5 rounded-xl border border-black/5 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted">
              <span>Priority 1: Debt Payoff</span>
              {totalDebtBalance > 0 && <span className="text-warning font-extrabold">Active</span>}
            </div>
            <div className="text-base font-black text-main font-mono">
              ₹{monthlyDebtPayment.toLocaleString('en-IN')}/mo
            </div>
            <p className="text-[11px] text-muted">Accelerated credit card / loan payoff</p>
          </div>

          <div className="bg-card-bg p-3.5 rounded-xl border border-black/5 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted">
              <span>Priority 2: Emergency Shield</span>
              {emergencyProgressPct < 100 && <span className="text-primary font-extrabold">Active</span>}
            </div>
            <div className="text-base font-black text-main font-mono">
              ₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}/mo
            </div>
            <p className="text-[11px] text-muted">Liquid emergency reserve fund</p>
          </div>

          <div className="bg-card-bg p-3.5 rounded-xl border border-black/5 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted">
              <span>Priority 3: Goals & Portfolio SIP</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">Wealth SIP</span>
            </div>
            <div className="text-base font-black text-main font-mono">
              ₹{monthlyPortfolioSip.toLocaleString('en-IN')}/mo
            </div>
            <p className="text-[11px] text-muted">Goal SIP & compounding asset mix</p>
          </div>
        </div>
      </div>

      {/* Financial Execution Roadmap & Action Plan */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-main tracking-tight">Financial Execution Roadmap & Action Plan</h2>
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border border-primary/20">
                  Step-by-Step Strategy
                </span>
              </div>
              <p className="text-xs text-muted font-medium mt-0.5">
                Monthly remaining surplus (Salary - Expenses: ₹{monthlySurplus.toLocaleString('en-IN')}) allocation timeline across Emergency Reserve, Investments, and Debt Payoff.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 bg-surface p-1 rounded-xl border border-black/5 self-start sm:self-auto">
            <button
              onClick={() => setRoadmapTab('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                roadmapTab === 'monthly'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-black/5'
              }`}
            >
              Month-by-Month Split
            </button>
            <button
              onClick={() => setRoadmapTab('phases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                roadmapTab === 'phases'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-main hover:bg-black/5'
              }`}
            >
              Phase Milestones
            </button>
          </div>
        </div>

        {roadmapTab === 'monthly' ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2.5 text-emerald-900 dark:text-emerald-200">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="font-extrabold block">Monthly Surplus Breakdown (₹{monthlySurplus.toLocaleString('en-IN')}/mo)</span>
                  <span className="text-muted text-[11px]">
                    Allocating ₹{monthlyPortfolioSip.toLocaleString('en-IN')} to Investments, ₹{monthlyEmergencyDeposit.toLocaleString('en-IN')} to Emergency Shield, and ₹{monthlyDebtPayment.toLocaleString('en-IN')} to Debt Payoff.
                  </span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100 font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 whitespace-nowrap">
                Sep 2026 – Dec 2026 Phase
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Node 1: September 2026 */}
              <div className="bg-surface p-4 rounded-2xl border-2 border-emerald-500/60 dark:border-emerald-500/80 space-y-2.5 relative shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300">
                    Active Execution Month
                  </span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-mono font-black text-sm text-main">September 2026</div>

                <div className="space-y-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Wealth Investments:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Emergency Reserve:</span>
                    <span className="font-mono font-bold text-primary">₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Debt Payoff:</span>
                    <span className="font-mono font-bold text-warning">₹{monthlyDebtPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-tight pt-1">
                  Automate ₹{monthlyPortfolioSip.toLocaleString('en-IN')} SIP on salary day. Deposit ₹{monthlyEmergencyDeposit.toLocaleString('en-IN')} into liquid FD.
                </p>
              </div>

              {/* Node 2: October 2026 */}
              <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2.5 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-muted bg-card-bg px-2 py-0.5 rounded-full border border-black/5">
                    Planned Step
                  </span>
                  <Calendar className="w-4 h-4 text-muted" />
                </div>
                <div className="font-mono font-black text-sm text-main">October 2026</div>

                <div className="space-y-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Wealth Investments:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Emergency Reserve:</span>
                    <span className="font-mono font-bold text-primary">₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Debt Payoff:</span>
                    <span className="font-mono font-bold text-warning">₹{monthlyDebtPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-tight pt-1">
                  Cumulative Reserve hits ₹{(savings + monthlyEmergencyDeposit * 2).toLocaleString('en-IN')}. Credit card debt reduced by ₹{(monthlyDebtPayment * 2).toLocaleString('en-IN')}.
                </p>
              </div>

              {/* Node 3: November 2026 */}
              <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2.5 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-muted bg-card-bg px-2 py-0.5 rounded-full border border-black/5">
                    Planned Step
                  </span>
                  <Calendar className="w-4 h-4 text-muted" />
                </div>
                <div className="font-mono font-black text-sm text-main">November 2026</div>

                <div className="space-y-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Wealth Investments:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Emergency Reserve:</span>
                    <span className="font-mono font-bold text-primary">₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Debt Payoff:</span>
                    <span className="font-mono font-bold text-warning">₹{monthlyDebtPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-tight pt-1">
                  Mid-quarter portfolio checkin. Verify Tax 80C & NPS allocation before year end.
                </p>
              </div>

              {/* Node 4: December 2026 */}
              <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2.5 relative">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-300">
                    Year-End Target
                  </span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-mono font-black text-sm text-main">December 2026</div>

                <div className="space-y-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Wealth Investments:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Emergency Reserve:</span>
                    <span className="font-mono font-bold text-primary">₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted font-medium">Debt Payoff:</span>
                    <span className="font-mono font-bold text-warning">₹{monthlyDebtPayment.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted leading-tight pt-1">
                  Year-end milestone hit! Total liquid buffer reaches ₹{(savings + monthlyEmergencyDeposit * 4).toLocaleString('en-IN')}.
                </p>
              </div>
            </div>

            {/* Next Horizon: January 2027 Onward Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    January 2027 Onward Horizon
                  </span>
                  <span className="text-emerald-400 text-xs font-bold font-mono">Phase 2 Transition</span>
                </div>
                <h4 className="text-base font-black text-white">Full Surplus Redirection & Step-Up Compounding</h4>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  As debt is cleared and your 6-month emergency shield is secured, your full monthly surplus of <strong className="text-emerald-300 font-mono">₹{monthlySurplus.toLocaleString('en-IN')}/mo</strong> shifts 100% into High-Growth Equity SIPs + {stepUpRate}% annual step-up compounding.
                </p>
              </div>

              <button
                onClick={() => setIsStepUpModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 whitespace-nowrap shadow-md transition-colors"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Configure Step-Up Plan</span>
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Phase Strategy View */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* Phase 1 */}
            <div className="bg-surface p-5 rounded-2xl border-2 border-emerald-500/40 space-y-3">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Phase 1 (Sep – Dec 2026)</span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">Active</span>
              </div>
              <h3 className="font-extrabold text-sm text-main">Foundation & Debt / Reserve Allocation</h3>
              <p className="text-muted leading-relaxed">
                Split monthly remaining surplus (₹{monthlySurplus.toLocaleString('en-IN')}) into ₹{monthlyPortfolioSip.toLocaleString('en-IN')} investments, ₹{monthlyEmergencyDeposit.toLocaleString('en-IN')} liquid reserve, and ₹{monthlyDebtPayment.toLocaleString('en-IN')} accelerated debt payoff.
              </p>
              <ul className="space-y-1.5 text-muted font-medium pt-1">
                <li className="flex items-center space-x-1.5 text-main font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Build ₹{(savings + monthlyEmergencyDeposit * 4).toLocaleString('en-IN')} liquid safety net</span>
                </li>
                <li className="flex items-center space-x-1.5 text-main font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Slash credit card balances with ₹{monthlyDebtPayment.toLocaleString('en-IN')}/mo focus</span>
                </li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="bg-surface p-5 rounded-2xl border border-black/5 space-y-3">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-black text-main uppercase tracking-wider">Phase 2 (Jan – Jun 2027)</span>
                <span className="bg-card-bg text-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/5">Next</span>
              </div>
              <h3 className="font-extrabold text-sm text-main">Debt Clearance & Full Reserve Lock</h3>
              <p className="text-muted leading-relaxed">
                Complete total debt payoff and lock full {emergencyTargetMonths}-month living expense emergency target (₹{emergencyTargetAmount.toLocaleString('en-IN')}).
              </p>
              <ul className="space-y-1.5 text-muted font-medium pt-1">
                <li className="flex items-center space-x-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>100% Debt Free status achieved</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>Emergency shield fully funded</span>
                </li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="bg-surface p-5 rounded-2xl border border-black/5 space-y-3">
              <div className="flex justify-between items-center border-b border-black/5 pb-2">
                <span className="text-xs font-black text-main uppercase tracking-wider">Phase 3 (Jul 2027 Onward)</span>
                <span className="bg-card-bg text-muted text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/5">Wealth Era</span>
              </div>
              <h3 className="font-extrabold text-sm text-main">100% Wealth Compounding & Step-Up</h3>
              <p className="text-muted leading-relaxed">
                Direct entire ₹{monthlySurplus.toLocaleString('en-IN')}/mo surplus into high-growth Index Funds, Flexi-Cap, and Gold SIPs with annual {stepUpRate}% step-up.
              </p>
              <ul className="space-y-1.5 text-muted font-medium pt-1">
                <li className="flex items-center space-x-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Exponential wealth compounding</span>
                </li>
                <li className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Annual {stepUpRate}% step-up active</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Main 4-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Savings & Emergency Reserve Status */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <PiggyBank className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Savings & <GlossaryTerm term="emergency fund">Emergency Reserve</GlossaryTerm></h2>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-extrabold text-primary">{emergencyProgressPct}% Met</span>
              <button
                onClick={() => setIsEmergencyAdjustOpen(true)}
                className="bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 border border-primary/20"
                title="Record Emergency Expense / Adjust Buffer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Use / Adjust Buffer</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-mono">
              <span className="text-muted">Current Buffer: ₹{savings.toLocaleString('en-IN')}</span>
              <span className="font-bold text-main">Target ({emergencyTargetMonths}x): ₹{emergencyTargetAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full bg-surface rounded-full overflow-hidden border border-black/5">
              <div
                className="h-full bg-primary transition-all duration-500 rounded-full"
                style={{ width: `${emergencyProgressPct}%` }}
              />
            </div>

            <div className="text-xs font-semibold text-main pt-1">
              {emergencyRemaining > 0 ? (
                <span className="text-warning flex items-center justify-between">
                  <span>Remaining to fulfill: <strong className="font-mono">₹{emergencyRemaining.toLocaleString('en-IN')}</strong></span>
                  <span className="text-[10px] font-bold text-muted">Priority #2</span>
                </span>
              ) : (
                <span className="text-primary flex items-center space-x-1 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-primary inline" />
                  <span>Full 6-month emergency fund buffer secured!</span>
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Card 2: Dynamic Compounding Growth Memory */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Investments & Baseline Growth</h2>
            </div>
            <span className="text-xs font-mono text-muted font-bold">Monthly SIP: ₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={investmentChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" stroke="#8E8E93" fontSize={10} />
                <YAxis stroke="#8E8E93" fontSize={10} tickFormatter={(v: any) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Card 3: Debt & Credit Card Payoff Status with Per-Debt Item Countdown */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Credit Card & Debt Finish Line</h2>
            </div>
            <span className="text-xs font-mono font-extrabold text-main">
              Total: ₹{totalDebtBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {totalDebtBalance === 0 ? (
            <div className="bg-surface p-4 rounded-2xl border border-black/5 text-center text-xs text-muted font-bold space-y-2">
              <div className="text-emerald-700 dark:text-emerald-400 font-black text-sm">🎉 Congratulations! All active loans and credit cards are fully paid off!</div>
              <p className="text-[11px] text-muted font-medium">You are 100% debt-free. Your full monthly surplus is unlocked for wealth compounding.</p>
              <button
                onClick={() => onNavigate('/creditcard/rewards')}
                className="text-xs font-extrabold text-primary hover:underline block mx-auto pt-1"
              >
                Explore Credit Card Rewards & Cards →
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-xs max-h-[220px] overflow-y-auto pr-1">
              {activeDebtsList.map((debt: any, dIdx: number) => {
                const bal = Number(debt.balance) || 0;
                const aprVal = Number(debt.apr) || 14.0;
                const emiVal = Number(debt.minimum_payment) || 2500;
                const dName = debt.debt_name || (debt.debt_type ? debt.debt_type.replace('_', ' ').toUpperCase() : `Loan #${dIdx + 1}`);

                let payoffMonths = 0;
                if (bal > 0) {
                  const r = (aprVal / 100.0) / 12.0;
                  if (r <= 0) payoffMonths = Math.ceil(bal / emiVal);
                  else if (emiVal <= bal * r) payoffMonths = 999;
                  else payoffMonths = Math.ceil(-Math.log(1.0 - (r * bal) / emiVal) / Math.log(1.0 + r));
                }

                return (
                  <div key={dIdx} className="bg-surface p-3.5 rounded-xl border border-black/5 space-y-1.5">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-main font-black text-sm">{dName}</span>
                      <span className="font-mono text-main font-extrabold">₹{bal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-muted font-medium">
                      <span>Interest Rate: {aprVal}% APR</span>
                      <span>EMI: ₹{emiVal.toLocaleString('en-IN')}/mo</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      {bal <= 0 ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>🎉 Congratulations! Loan Fully Paid Off!</span>
                        </span>
                      ) : (
                        <span className="text-amber-800 dark:text-amber-300 font-extrabold flex items-center space-x-1 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-300/40">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Payoff in ~{payoffMonths > 360 ? '30+ yrs' : `${payoffMonths} months`} at ₹{emiVal.toLocaleString('en-IN')}/mo</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Card 4: Financial Goals & Milestones Tracker */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Financial Goals & Milestones Tracker</h2>
            </div>
            <span className="text-xs font-mono font-extrabold text-primary">
              {profileData?.goals?.length || 1} Active Goal{(profileData?.goals?.length || 1) === 1 ? '' : 's'}
            </span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {(!profileData?.goals || profileData.goals.length === 0) ? (
              <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-main font-black text-sm">Emergency Reserve Shield</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-extrabold">
                    Target: ₹{emergencyTargetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface rounded-full overflow-hidden border border-black/5">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${emergencyProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted">
                  <span>Saved: ₹{savings.toLocaleString('en-IN')} ({emergencyProgressPct}%)</span>
                  <span>Priority: Mandatory #1</span>
                </div>
              </div>
            ) : (
              profileData.goals.map((g: any, idx: number) => {
                const target = Number(g.target_amount || g.target || 100000);
                const isEmergency = g.id === 'default_emergency' || g.name?.toLowerCase().includes('emergency');
                const currSaved = isEmergency ? savings : Number(g.current_amount || 0);
                const progressPct = Math.min(100, Math.round((currSaved / Math.max(1, target)) * 100));
                const priority = g.priority || (isEmergency ? 'High' : 'Medium');

                const availableGoalSurplus = isEmergency ? monthlyEmergencyDeposit : monthlyGoalSip;
                const remainingDeficit = Math.max(0, target - currSaved);
                const estimatedMonthsToGoal = availableGoalSurplus > 0
                  ? Math.ceil(remainingDeficit / availableGoalSurplus)
                  : 36;

                return (
                  <div key={idx} className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-main font-black text-sm">{g.name}</span>
                        {isEmergency && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 font-extrabold px-2 py-0.5 rounded-full border border-emerald-400/40">
                            Permanent #1
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-primary font-extrabold">Target: ₹{target.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2.5 w-full bg-card-bg rounded-full overflow-hidden border border-black/5">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-semibold text-muted">
                      <span>Funded: ₹{currSaved.toLocaleString('en-IN')} ({progressPct}%)</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                        priority === 'High'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-300'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                      }`}>
                        {priority} Priority
                      </span>
                    </div>

                    <div className="pt-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-xl border border-emerald-400/30 flex items-center justify-between">
                      <span className="font-bold flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Estimated Timeframe: ~{estimatedMonthsToGoal} months</span>
                      </span>
                      <span className="font-mono font-extrabold text-[10px]">
                        At ₹{availableGoalSurplus.toLocaleString('en-IN')}/mo track
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

      </div>

      {/* Emergency Fund Adjust Modal */}
      <EmergencyAdjustModal
        isOpen={isEmergencyAdjustOpen}
        onClose={() => setIsEmergencyAdjustOpen(false)}
        currentSavings={savings}
        onSave={handleSaveEmergencyAdjust}
      />

      {/* 30-Day Check-in Modal */}
      <MonthlyCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        monthlyDebtPayment={monthlyDebtPayment}
        monthlyEmergencyDeposit={monthlyEmergencyDeposit}
        monthlyPortfolioSip={monthlyPortfolioSip}
        onSaveProgress={handleSaveCheckin}
      />

      {/* Annual Step-Up Review Modal */}
      <AnnualStepUpModal
        isOpen={isStepUpModalOpen}
        onClose={() => setIsStepUpModalOpen(false)}
        currentSalary={salary}
        currentExpenses={expenses}
        currentSavings={savings}
        currentAge={profileData?.age || 30}
        currentSip={monthlyPortfolioSip}
        onSaved={() => {
          const savedRate = localStorage.getItem('finverse_annual_stepup_rate');
          if (savedRate) setStepUpRate(parseFloat(savedRate) || 10);
        }}
      />

      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={isPrintableModalOpen}
        onClose={() => setIsPrintableModalOpen(false)}
        userData={{
          fullName: user?.email ? user.email.split('@')[0] : 'Finverse User',
          email: user?.email || '',
          salary: salary,
          expenses: expenses,
          savings: savings,
          age: profileData?.age || 30,
          debts: debtsData?.waterfall?.debts || [],
          goals: profileData?.goals || [],
        }}
        winnerRegime="New Regime"
        taxSavings={15000}
      />
    </div>
  );
};

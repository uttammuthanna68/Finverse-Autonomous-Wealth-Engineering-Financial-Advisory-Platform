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
  Calendar,
  Sparkles,
  Zap,
  FileText,
} from 'lucide-react';

import { useAuth } from '../auth/AuthContext';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, hasCompletedOnboarding } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [debtsData, setDebtsData] = useState<any>(null);
  const [isCheckinOpen, setIsCheckinOpen] = useState<boolean>(false);
  const [isStepUpModalOpen, setIsStepUpModalOpen] = useState<boolean>(false);
  const [isPrintableModalOpen, setIsPrintableModalOpen] = useState<boolean>(false);
  const [daysSinceCheckin, setDaysSinceCheckin] = useState<number>(0);
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
      let sav = 20000;

      const profRes = await fetchWithAuth('/api/profile/me');
      if (profRes.ok) {
        const prof = await profRes.json();
        setProfileData(prof);
        if (prof.salary) sal = prof.salary;
        if (prof.expenses) exp = prof.expenses;
        if (prof.savings !== undefined) sav = prof.savings;
      }

      // Load local debts array
      let localDebts: any[] = [];
      const savedDebtsStr = localStorage.getItem(storageKeyDebts);
      if (savedDebtsStr) {
        try {
          localDebts = JSON.parse(savedDebtsStr);
        } catch (e) {
          console.error('Error parsing local debts:', e);
        }
      }

      const debtRes = await fetchWithAuth('/api/engine/analyze-debts', {
        method: 'POST',
        body: JSON.stringify({
          monthly_income: sal,
          monthly_expenses: exp,
          current_savings: sav,
          debts: localDebts,
        }),
      });
      if (debtRes.ok) {
        const debtJson = await debtRes.json();
        setDebtsData(debtJson);
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
      setDaysSinceCheckin(diffDays);
      if (diffDays >= 30) {
        setIsCheckinOpen(true);
      }
    } else {
      localStorage.setItem(storageKeyCheckin, Date.now().toString());
      setDaysSinceCheckin(0);
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

  // Engine or Local Fallback Debt Calculations
  const totalDebtBalance = totalLocalDebtBalance > 0
    ? totalLocalDebtBalance
    : (debtsData?.waterfall?.debts?.reduce((acc: number, d: any) => acc + (d.balance || 0), 0) || 0);

  const totalDebtMonthlyEmi = totalLocalDebtEmi > 0
    ? totalLocalDebtEmi
    : (debtsData?.waterfall?.debts?.reduce((acc: number, d: any) => acc + (d.minimum_payment || 0), 0) || 0);

  const hasToxicDebt = totalDebtBalance > 0;

  // Emergency Fund Calculations
  const emergencyTargetMonths = debtsData?.waterfall?.emergency_fund_target_months || 6;
  const emergencyTargetAmount = (expenses || 40000) * emergencyTargetMonths;
  const emergencyRemaining = Math.max(0, emergencyTargetAmount - savings);
  const emergencyProgressPct = Math.min(100, Math.round((savings / emergencyTargetAmount) * 100)) || 0;

  // Monthly Surplus & Priority Waterfall Breakdown
  const monthlySurplus = Math.max(0, salary - expenses);
  
  let monthlyDebtPayment = 0;
  let monthlyEmergencyDeposit = 0;
  let monthlyPortfolioSip = 0;

  if (totalDebtBalance > 0) {
    monthlyDebtPayment = Math.min(monthlySurplus, totalDebtMonthlyEmi > 0 ? totalDebtMonthlyEmi : Math.max(2500, Math.round(totalDebtBalance * 0.15)));
    const remainingAfterDebt = Math.max(0, monthlySurplus - monthlyDebtPayment);

    if (emergencyRemaining > 0) {
      monthlyEmergencyDeposit = Math.min(remainingAfterDebt, Math.round(remainingAfterDebt * 0.6));
      monthlyPortfolioSip = Math.max(0, remainingAfterDebt - monthlyEmergencyDeposit);
    } else {
      monthlyPortfolioSip = remainingAfterDebt;
    }
  } else if (emergencyRemaining > 0) {
    monthlyEmergencyDeposit = Math.min(monthlySurplus, Math.round(monthlySurplus * 0.6));
    monthlyPortfolioSip = Math.max(0, monthlySurplus - monthlyEmergencyDeposit);
  } else {
    monthlyPortfolioSip = monthlySurplus;
  }

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

  // 1-Year Milestone Execution Roadmap Data with Calendar Dates
  const roadmapMilestones = [
    {
      date: '1st Sep 2026',
      period: 'Month 1 Kickoff',
      title: totalDebtBalance > 0 ? 'Toxic Debt Slash Initiated' : emergencyProgressPct < 100 ? 'Reserve Deposit & Portfolio SIP Launch' : 'Full Growth Portfolio Acceleration',
      desc: totalDebtBalance > 0
        ? `Allocate ₹${monthlyDebtPayment.toLocaleString('en-IN')}/mo to clear high-interest credit card debt.`
        : emergencyProgressPct < 100
        ? `Deposit ₹${monthlyEmergencyDeposit.toLocaleString('en-IN')}/mo into your Emergency Shield & ₹${monthlyPortfolioSip.toLocaleString('en-IN')}/mo into your Growth Portfolio SIP.`
        : `Invest full ₹${monthlyPortfolioSip.toLocaleString('en-IN')}/mo surplus into your growth asset mix.`,
      motivation: "🐢 \"The longest journey begins with a single step! Setting auto-pay today guarantees smooth compounding ahead.\"",
      status: 'Active Kickoff',
    },
    {
      date: '1st Dec 2026',
      period: 'Month 3 Checkpoint',
      title: '3-Month Buffer & SIP Growth Milestone',
      desc: `Projected Emergency Shield buffer reaches ₹${(savings + monthlyEmergencyDeposit * 3).toLocaleString('en-IN')}. Portfolio total reaches ₹${(baselineAccumulated + monthlyPortfolioSip * 3.03).toLocaleString('en-IN')}.`,
      motivation: "📈 \"3 months of consistent discipline! Look at your reserve growing steady and secure.\"",
      status: 'Upcoming',
    },
    {
      date: '1st Mar 2027',
      period: 'Month 6 Checkpoint',
      title: '6-Month Mid-Year Wealth Horizon',
      desc: `Projected Emergency Shield reaches ₹${(savings + monthlyEmergencyDeposit * 6).toLocaleString('en-IN')}. Portfolio total reaches ₹${(baselineAccumulated + monthlyPortfolioSip * 6.08).toLocaleString('en-IN')}.`,
      motivation: "🛡️ \"Halfway through Year 1! Your financial shell is getting stronger every single month.\"",
      status: 'Upcoming',
    },
    {
      date: '1st Jun 2027',
      period: 'Month 9 Checkpoint',
      title: '9-Month Asset Shield Milestone',
      desc: `Projected Emergency Shield reaches ₹${(savings + monthlyEmergencyDeposit * 9).toLocaleString('en-IN')}. Portfolio total reaches ₹${(baselineAccumulated + monthlyPortfolioSip * 9.15).toLocaleString('en-IN')}.`,
      motivation: "⭐ \"Almost at the 1-year mark! Keep your eyes on long-term financial freedom.\"",
      status: 'Upcoming',
    },
    {
      date: '1st Sep 2027',
      period: '1-Year Milestone Target',
      title: '1-Year Annual Financial Target',
      desc: `Projected 1-Year Wealth Value reaches ₹${(baselineAccumulated + monthlyPortfolioSip * 12.25).toLocaleString('en-IN')}. Rebalance portfolio asset mix based on annual salary review!`,
      motivation: "🎉 \"Congratulations on completing 1 full year! Rebalance your portfolio and celebrate your growth!\"",
      status: 'Target Horizon',
    },
  ];

  const handleSaveCheckin = (_summary: any) => {
    localStorage.setItem(storageKeyCheckin, Date.now().toString());
    setDaysSinceCheckin(0);
    showShellyToast({
      title: 'Progress Verified! 🗓️',
      message: 'Awesome work! Your monthly execution streak has been updated.',
      pose: 'happy',
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
          >
            <FileText className="w-4 h-4 text-primary" />
            <span>CA Audit Report</span>
          </button>

          <button
            onClick={() => setIsStepUpModalOpen(true)}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-emerald-500/30 shadow-xs"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Annual Step-Up ({stepUpRate}%)</span>
          </button>

          <button
            onClick={() => setIsCheckinOpen(true)}
            className="bg-primary/10 hover:bg-primary/20 text-primary font-extrabold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors border border-primary/20"
          >
            <Calendar className="w-4 h-4" />
            <span>30-Day Check-in ({daysSinceCheckin}d ago)</span>
          </button>

          {!hasProfile && (
            <button
              onClick={() => onNavigate('/onboarding')}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-sm"
            >
              <span>Complete Financial Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Strategic Execution Advisor Card */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <ShellyMascot
            pose={hasToxicDebt ? 'panicked' : emergencyProgressPct >= 100 ? 'happy' : 'explaining'}
            size="md"
            animateFloat={true}
            className="flex-shrink-0"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center space-x-1 justify-center sm:justify-start">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prof. Shelly's Strategic Guidance</span>
            </div>
            <h2 className="text-xl font-black text-main tracking-tight">
              {hasToxicDebt
                ? 'High-Interest Debt Payoff Is Priority #1'
                : emergencyProgressPct < 100
                ? `Allocate ₹${monthlyEmergencyDeposit.toLocaleString('en-IN')} to Emergency Reserve & ₹${monthlyPortfolioSip.toLocaleString('en-IN')} to Portfolio Investing`
                : 'Accelerating Portfolio Wealth Compounding'}
            </h2>
            <p className="text-sm font-semibold text-main leading-relaxed">
              {hasToxicDebt ? (
                <span className="text-warning">
                  "Woah there! High-interest debt detected! Out of your monthly surplus of <strong>₹{monthlySurplus.toLocaleString('en-IN')}</strong>, put <strong>₹{monthlyDebtPayment.toLocaleString('en-IN')}/mo</strong> toward clearing toxic dues first before market investing!"
                </span>
              ) : emergencyProgressPct < 100 ? (
                <span>
                  "Because you have zero high-interest debt, let's divide your <strong>₹{monthlySurplus.toLocaleString('en-IN')}</strong> monthly surplus: put <strong>₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}/mo</strong> into your Emergency Reserve (currently {emergencyProgressPct}% complete) and <strong>₹{monthlyPortfolioSip.toLocaleString('en-IN')}/mo</strong> directly into Portfolio Investing starting <strong>1st September 2026</strong>!"
                </span>
              ) : (
                <span>
                  "Fantastic job! Your 6-month emergency reserve is 100% secured! Your full monthly surplus of <strong>₹{monthlySurplus.toLocaleString('en-IN')}/mo</strong> is actively building your wealth portfolio!"
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* 1-YEAR FINANCIAL EXECUTION ROADMAP */}
      <Card className="p-6 sm:p-8 bg-card-bg shadow-card rounded-card border border-black/5 space-y-6">
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-main tracking-tight">1-Year Financial Execution Roadmap</h2>
              <span className="text-xs text-muted font-medium">Step-by-step milestone plan prioritized by cash flow mathematics</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/portfolios')}
            className="text-xs font-extrabold text-primary hover:underline flex items-center space-x-1"
          >
            <span>View Portfolios →</span>
          </button>
        </div>

        {/* 5-Stage Scrollable Dated Milestone Timeline */}
        <div className="flex overflow-x-auto space-x-4 pb-4 pt-1 scrollbar-thin">
          {roadmapMilestones.map((m, idx) => (
            <div
              key={idx}
              className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-surface p-5 rounded-2xl border border-black/10 space-y-3 flex-shrink-0 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono font-extrabold uppercase tracking-wider text-muted border-b border-black/5 pb-2">
                  <span className="text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    📅 {m.date}
                  </span>
                  <span className="text-muted">{m.period}</span>
                </div>

                <h3 className="text-base font-black text-main leading-tight pt-1">{m.title}</h3>
                <p className="text-xs text-muted leading-relaxed font-medium">{m.desc}</p>
              </div>

              <div className="bg-card-bg p-3 rounded-xl border border-black/5 text-[11px] font-semibold text-main italic">
                {m.motivation}
              </div>
            </div>
          ))}
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
                {totalDebtBalance > 0 && <span className="text-warning">Active</span>}
              </div>
              <div className="text-base font-black text-main font-mono">
                ₹{monthlyDebtPayment.toLocaleString('en-IN')}/mo
              </div>
              <p className="text-[11px] text-muted">Accelerated credit card / loan payoff</p>
            </div>

            <div className="bg-card-bg p-3.5 rounded-xl border border-black/5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted">
                <span>Priority 2: Emergency Shield</span>
                {emergencyProgressPct < 100 && <span className="text-primary">Active</span>}
              </div>
              <div className="text-base font-black text-main font-mono">
                ₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}/mo
              </div>
              <p className="text-[11px] text-muted">Liquid emergency reserve fund</p>
            </div>

            <div className="bg-card-bg p-3.5 rounded-xl border border-black/5 space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted">
                <span>Priority 3: Portfolio SIP</span>
                <span className="text-success">Wealth SIP</span>
              </div>
              <div className="text-base font-black text-main font-mono">
                ₹{monthlyPortfolioSip.toLocaleString('en-IN')}/mo
              </div>
              <p className="text-[11px] text-muted">Compounding investment asset mix</p>
            </div>
          </div>
        </div>
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
            <span className="text-xs font-mono font-extrabold text-primary">{emergencyProgressPct}% Met</span>
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
                <span className="text-warning">
                  Remaining to fulfill: <strong className="font-mono">₹{emergencyRemaining.toLocaleString('en-IN')}</strong>
                </span>
              ) : (
                <span className="text-primary flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-primary inline" />
                  <span>Full emergency fund buffer secured!</span>
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
            <span className="text-xs font-mono text-muted">Monthly SIP: ₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
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

        {/* Card 3: Debt & Credit Card Payoff Status */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Credit Card & Debt Summary</h2>
            </div>
            <span className="text-xs font-mono font-extrabold text-main">
              Total: ₹{totalDebtBalance.toLocaleString('en-IN')}
            </span>
          </div>

          {totalDebtBalance === 0 ? (
            <div className="bg-surface p-4 rounded-2xl border border-black/5 text-center text-xs text-muted font-bold space-y-2">
              <div>🎉 Zero active debts reported! All credit balances cleared.</div>
              <button
                onClick={() => onNavigate('/creditcard/rewards')}
                className="text-xs font-extrabold text-primary hover:underline block mx-auto pt-1"
              >
                Explore Credit Card Rewards & Cards →
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-surface p-3 rounded-xl border border-black/5">
                <span className="font-semibold text-main">Outstanding Payoff Balance</span>
                <span className="font-mono font-extrabold text-main">₹{totalDebtBalance.toLocaleString('en-IN')}</span>
              </div>

              {hasToxicDebt && (
                <div className="bg-warning/10 border border-warning/30 text-warning p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>High-interest <GlossaryTerm term="toxic debt">toxic debt</GlossaryTerm> (&gt;18% APR) detected. Prioritize clearing credit card balance before investing.</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Card 4: Goal Horizon & Asset Matcher Engine */}
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-base font-extrabold text-main">Goal Horizon & Asset Deployment Engine</h2>
            </div>
          </div>

          <div className="space-y-3">
            {(!profileData?.goals || profileData.goals.length === 0) ? (
              <div className="bg-surface p-4 rounded-xl border border-black/5 text-center text-xs text-muted">
                No active financial goals added. Edit onboarding or profile to add target goals!
              </div>
            ) : (
              profileData.goals.map((g: any, idx: number) => {
                const target = g.target_amount || g.target || 100000;
                const targetDateStr = g.target_date || '2028-12-31';

                const targetYear = new Date(targetDateStr).getFullYear() || 2028;
                const currentYear = new Date().getFullYear();
                const yearsRem = Math.max(1, targetYear - currentYear);

                let recAsset = "Nifty 50 Index Fund + Flexi-Cap SIP";
                let recBadgeClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
                let recWarning = "Long horizon (> 5 yrs). High equity exposure maximizes wealth compounding.";

                if (yearsRem < 3) {
                  recAsset = "Arbitrage Funds / Liquid Debt / Flexi-FD";
                  recBadgeClass = "text-amber-800 bg-amber-50 border-amber-200";
                  recWarning = "Short horizon (< 3 yrs). Avoid equity index funds to protect capital from market crashes. 100% Capital Preserved.";
                } else if (yearsRem <= 5) {
                  recAsset = "Balanced Advantage Hybrid Fund (60/40) + Gold";
                  recBadgeClass = "text-indigo-700 bg-indigo-50 border-indigo-200";
                  recWarning = "Medium horizon (3-5 yrs). Balanced hybrid split for steady growth & downside protection.";
                }

                return (
                  <div key={idx} className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-main font-black text-sm">{g.name}</span>
                      <span className="font-mono text-primary font-bold">Target: ₹{Number(target).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-muted">
                      <span>Target Date: {targetDateStr} ({yearsRem} yrs remaining)</span>
                      <span className="font-bold text-main">Req. SIP: ₹{Math.round(target / (yearsRem * 12)).toLocaleString('en-IN')}/mo</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border text-[11px] font-semibold space-y-1 ${recBadgeClass}`}>
                      <div className="flex items-center justify-between font-bold">
                        <span>Recommended Asset: {recAsset}</span>
                        <span className="font-mono uppercase text-[9px] px-1.5 py-0.5 rounded-md bg-white border border-black/10">
                          {yearsRem < 3 ? 'Capital Shield' : yearsRem <= 5 ? 'Balanced Hybrid' : 'Equity Growth'}
                        </span>
                      </div>
                      <p className="text-[10px] leading-tight font-normal">{recWarning}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

      </div>

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

      {/* Printable CA Audit Report Modal */}
      <PrintableReportModal
        isOpen={isPrintableModalOpen}
        onClose={() => setIsPrintableModalOpen(false)}
        userData={{
          fullName: user?.full_name || 'Finverse Client',
          email: user?.email || 'user@example.com',
          salary: salary,
          expenses: expenses,
          savings: savings,
          age: profileData?.age || 30,
          debts: profileData?.debts || [],
          goals: profileData?.goals || [],
        }}
        winnerRegime="New Regime"
        taxSavings={15600}
      />
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Target, Info } from 'lucide-react';

type CalcType = 'sip' | 'hybrid' | 'goal_planner' | 'swp' | 'lumpsum' | 'bonds';

export const CalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CalcType>('sip');

  // Input States
  const [amount, setAmount] = useState<number>(10000);
  const [lumpsumAmount, setLumpsumAmount] = useState<number>(100000);
  const [durationYears, setDurationYears] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(12.0);
  const [inflationRate, setInflationRate] = useState<number>(6.0);

  // Step-Up SIP Questionnaire & Controls
  const [enableStepUp, setEnableStepUp] = useState<boolean>(true);
  const [stepUpPercent, setStepUpPercent] = useState<number>(10.0);

  // Goal Planner target corpus
  const [targetGoal, setTargetGoal] = useState<number>(10000000); // 1 Crore default

  // Auto-adjust default return heuristics based on calculator type & duration
  useEffect(() => {
    if (activeTab === 'bonds') {
      setExpectedReturn(7.5);
      setLumpsumAmount(100000);
    } else if (activeTab === 'sip') {
      setAmount(10000);
      if (durationYears >= 10) setExpectedReturn(12.0);
      else if (durationYears >= 5) setExpectedReturn(10.5);
      else setExpectedReturn(8.5);
    } else if (activeTab === 'hybrid') {
      setAmount(10000);
      setLumpsumAmount(100000);
      setExpectedReturn(12.0);
    } else if (activeTab === 'lumpsum') {
      setLumpsumAmount(200000);
      if (durationYears >= 10) setExpectedReturn(12.0);
      else setExpectedReturn(9.0);
    } else if (activeTab === 'swp') {
      setAmount(20000);
      setLumpsumAmount(2500000);
      setExpectedReturn(8.5);
    } else if (activeTab === 'goal_planner') {
      setTargetGoal(10000000);
      setExpectedReturn(12.0);
    }
  }, [activeTab]);

  const calculateData = () => {
    const data = [];
    const yearlySchedule = [];
    let currentInvested = 0;
    let currentNominal = 0;
    let monthlyAmount = amount;

    if (activeTab === 'lumpsum' || activeTab === 'bonds') {
      currentInvested = lumpsumAmount;
      currentNominal = lumpsumAmount;
    } else if (activeTab === 'hybrid') {
      currentInvested = lumpsumAmount;
      currentNominal = lumpsumAmount;
    } else if (activeTab === 'swp') {
      currentInvested = lumpsumAmount;
      currentNominal = lumpsumAmount;
    } else if (activeTab === 'goal_planner') {
      // Calculate required monthly SIP to achieve targetGoal at expectedReturn over durationYears
      const iMonthly = expectedReturn / 100 / 12;
      const nMonths = durationYears * 12;
      // Formula: Target = PMT * [((1 + i)^n - 1) / i] * (1 + i)
      const factor = ((Math.pow(1 + iMonthly, nMonths) - 1) / iMonthly) * (1 + iMonthly);
      const reqMonthlySip = Math.round(targetGoal / factor);
      monthlyAmount = reqMonthlySip;
    }

    const rMonthly = expectedReturn / 100 / 12;
    let currentRealInvested = 0;

    for (let yr = 1; yr <= durationYears; yr++) {
      const yearStartMonthly = monthlyAmount;
      let yearlyInvestedThisYr = 0;

      if (activeTab === 'sip' || activeTab === 'goal_planner') {
        for (let m = 1; m <= 12; m++) {
          currentInvested += monthlyAmount;
          yearlyInvestedThisYr += monthlyAmount;
          currentNominal = (currentNominal + monthlyAmount) * (1 + rMonthly);
        }
        if (enableStepUp) {
          monthlyAmount = Math.round(monthlyAmount * (1 + stepUpPercent / 100));
        }
      } else if (activeTab === 'hybrid') {
        for (let m = 1; m <= 12; m++) {
          currentInvested += monthlyAmount;
          yearlyInvestedThisYr += monthlyAmount;
          currentNominal = (currentNominal + monthlyAmount) * (1 + rMonthly);
        }
        if (enableStepUp) {
          monthlyAmount = Math.round(monthlyAmount * (1 + stepUpPercent / 100));
        }
      } else if (activeTab === 'lumpsum' || activeTab === 'bonds') {
        currentNominal = currentNominal * (1 + expectedReturn / 100);
      } else if (activeTab === 'swp') {
        for (let m = 1; m <= 12; m++) {
          currentNominal = Math.max(0, (currentNominal - amount) * (1 + rMonthly));
        }
      }

      const inflationFactor = Math.pow(1 + inflationRate / 100, yr);
      const realValue = Math.round(currentNominal / inflationFactor);
      
      // Calculate real cumulative principal in Year 0 terms
      const yearlyRealContrib = yearlyInvestedThisYr / inflationFactor;
      currentRealInvested += yearlyRealContrib;

      data.push({
        year: `Yr ${yr}`,
        invested: Math.round(currentInvested),
        realInvested: Math.round(currentRealInvested),
        nominal: Math.round(currentNominal),
        real: Math.round(realValue),
      });

      yearlySchedule.push({
        year: yr,
        monthlySip: Math.round(yearStartMonthly),
        annualContribution: Math.round(yearlyInvestedThisYr),
        cumulativeInvested: Math.round(currentInvested),
        nominalCorpus: Math.round(currentNominal),
        realCorpus: Math.round(realValue),
      });
    }

    const finalNominal = data.length > 0 ? data[data.length - 1].nominal : 0;
    const finalInvested = data.length > 0 ? data[data.length - 1].invested : 0;
    const finalReal = data.length > 0 ? data[data.length - 1].real : 0;
    const finalRealInvested = data.length > 0 ? data[data.length - 1].realInvested : 0;
    const totalEstReturns = Math.max(0, finalNominal - finalInvested);
    const realGain = Math.max(0, finalReal - finalRealInvested);

    return {
      chartData: data,
      yearlySchedule,
      finalNominal,
      finalInvested,
      finalReal,
      finalRealInvested,
      totalEstReturns,
      realGain,
      reqMonthlySip: activeTab === 'goal_planner' ? yearlySchedule[0]?.monthlySip || 0 : undefined,
    };
  };

  const { chartData, yearlySchedule, finalNominal, finalInvested, finalReal, finalRealInvested, totalEstReturns, realGain, reqMonthlySip } = calculateData();

  const pieData = [
    { name: 'Total Principal Invested', value: finalInvested, color: '#6366F1' },
    { name: 'Estimated Interest Yield', value: totalEstReturns, color: '#10B981' },
  ];

  const calcTabs: { id: CalcType; label: string; desc: string }[] = [
    { id: 'sip', label: 'SIP & Step-Up', desc: 'Monthly SIP with optional annual step-up' },
    { id: 'hybrid', label: 'Lumpsum + SIP', desc: 'Initial deposit + monthly SIP combined' },
    { id: 'goal_planner', label: 'Goal Target Planner', desc: 'Find monthly SIP required for target corpus' },
    { id: 'swp', label: 'SWP Withdrawal', desc: 'Systematic monthly payout from corpus' },
    { id: 'lumpsum', label: 'Lumpsum', desc: 'One-time investment compounding' },
    { id: 'bonds', label: 'Fixed Income Bonds', desc: 'Guaranteed debt/bond yield' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="border-b border-black/5 pb-4 space-y-1">
        <span className="text-xs font-bold text-primary uppercase tracking-wider block">
          Interactive Wealth Engineering & Step-Up Engine
        </span>
        <h1 className="text-3xl font-black text-main tracking-tight">Financial Calculators</h1>
        <p className="text-xs text-muted max-w-3xl">
          Simulate compounding growth with annual step-up triggers, hybrid initial deposits + SIP, goal planners, and SWP monthly payouts.
        </p>
      </div>

      {/* Calculator Mode Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-surface p-1.5 rounded-2xl border border-black/10 shadow-sm">
        {calcTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-2.5 rounded-xl text-xs font-black transition-all text-left space-y-0.5 ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm scale-[1.02]'
                : 'text-muted hover:text-main hover:bg-black/5'
            }`}
          >
            <div className="truncate uppercase">{tab.label}</div>
            <div className={`text-[9px] font-normal truncate opacity-80 ${activeTab === tab.id ? 'text-white' : 'text-muted'}`}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Main Parameters & Graphs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Controls Column */}
        <Card className="lg:col-span-5 p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-6">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <h2 className="text-base font-extrabold text-main uppercase tracking-wider">
              {calcTabs.find((t) => t.id === activeTab)?.label}
            </h2>
            <span className="text-xs font-mono font-bold text-primary">{durationYears} Yrs Duration</span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Goal Planner Target Amount */}
            {activeTab === 'goal_planner' && (
              <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/20">
                <div className="flex justify-between items-center font-bold text-main">
                  <span>Target Goal Amount</span>
                  <div className="flex items-center space-x-1 border border-primary/30 rounded-lg px-2 py-1 bg-card-bg shadow-xs">
                    <span className="font-mono text-primary font-bold">₹</span>
                    <input
                      type="number"
                      value={targetGoal === 0 ? '' : targetGoal}
                      onChange={(e) => setTargetGoal(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                      className="w-28 font-mono text-primary font-black text-xs outline-none bg-transparent"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="100000000"
                  step="500000"
                  value={targetGoal}
                  onChange={(e) => setTargetGoal(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted font-bold font-mono">
                  <span>₹5 Lakhs</span>
                  <span>₹10 Crores</span>
                </div>
              </div>
            )}

            {/* Initial Lumpsum Amount (For Lumpsum, Hybrid, Bonds, SWP) */}
            {(activeTab === 'lumpsum' || activeTab === 'hybrid' || activeTab === 'bonds' || activeTab === 'swp') && (
              <div>
                <div className="flex justify-between items-center font-bold text-main mb-1">
                  <span>{activeTab === 'swp' ? 'Initial Corpus' : 'Initial Lumpsum Deposit'}</span>
                  <div className="flex items-center space-x-1 border border-black/10 rounded-lg px-2 py-1 bg-surface shadow-xs">
                    <span className="font-mono text-primary font-bold">₹</span>
                    <input
                      type="number"
                      value={lumpsumAmount === 0 ? '' : lumpsumAmount}
                      onChange={(e) => setLumpsumAmount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                      className="w-24 font-mono text-primary font-extrabold text-xs outline-none bg-transparent"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="10000"
                  max="10000000"
                  step="10000"
                  value={lumpsumAmount}
                  onChange={(e) => setLumpsumAmount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            )}

            {/* Monthly SIP / Withdrawal Amount */}
            {activeTab !== 'lumpsum' && activeTab !== 'bonds' && activeTab !== 'goal_planner' && (
              <div>
                <div className="flex justify-between items-center font-bold text-main mb-1">
                  <span>{activeTab === 'swp' ? 'Monthly Withdrawal' : 'Monthly SIP Amount'}</span>
                  <div className="flex items-center space-x-1 border border-black/10 rounded-lg px-2 py-1 bg-surface shadow-xs">
                    <span className="font-mono text-primary font-bold">₹</span>
                    <input
                      type="number"
                      value={amount === 0 ? '' : amount}
                      onChange={(e) => setAmount(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
                      className="w-24 font-mono text-primary font-extrabold text-xs outline-none bg-transparent"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="200000"
                  step="1000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            )}

            {/* Investment Duration */}
            <div>
              <div className="flex justify-between items-center font-bold text-main mb-1">
                <span>Investment Horizon</span>
                <div className="flex items-center space-x-1 border border-black/10 rounded-lg px-2 py-1 bg-surface shadow-xs">
                  <input
                    type="number"
                    value={durationYears === 0 ? '' : durationYears}
                    onChange={(e) => setDurationYears(e.target.value === '' ? 0 : Math.max(1, Math.min(50, Number(e.target.value))))}
                    className="w-10 font-mono text-primary font-extrabold text-xs outline-none bg-transparent text-right"
                  />
                  <span className="font-mono text-muted text-[11px]">Years</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                value={durationYears}
                onChange={(e) => setDurationYears(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Expected Return */}
            <div>
              <div className="flex justify-between items-center font-bold text-main mb-1">
                <span>Expected Annual Return (%)</span>
                <div className="flex items-center space-x-1 border border-black/10 rounded-lg px-2 py-1 bg-surface shadow-xs">
                  <input
                    type="number"
                    step="0.5"
                    value={expectedReturn === 0 ? '' : expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value === '' ? 0 : Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="w-12 font-mono text-primary font-extrabold text-xs outline-none bg-transparent text-right"
                  />
                  <span className="font-mono text-muted text-[11px]">% p.a.</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Inflation Rate */}
            <div>
              <div className="flex justify-between items-center font-bold text-main mb-1">
                <span>Expected Inflation Rate (%)</span>
                <div className="flex items-center space-x-1 border border-black/10 rounded-lg px-2 py-1 bg-surface shadow-xs">
                  <input
                    type="number"
                    step="0.5"
                    value={inflationRate === 0 ? '' : inflationRate}
                    onChange={(e) => setInflationRate(e.target.value === '' ? 0 : Math.max(0, Math.min(30, Number(e.target.value))))}
                    className="w-10 font-mono text-primary font-extrabold text-xs outline-none bg-transparent text-right"
                  />
                  <span className="font-mono text-muted text-[11px]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={inflationRate}
                onChange={(e) => setInflationRate(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* ANNUAL STEP-UP QUESTIONNAIRE & TOGGLE PANEL */}
            {(activeTab === 'sip' || activeTab === 'hybrid' || activeTab === 'goal_planner') && (
              <div className="space-y-3 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="font-extrabold text-main">Annual Step-Up Factor</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableStepUp}
                      onChange={(e) => setEnableStepUp(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface border border-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>

                {enableStepUp ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between items-center font-bold text-main">
                      <span>Increase Monthly SIP Every Year By</span>
                      <div className="flex items-center space-x-1 border border-amber-500/30 rounded-lg px-2 py-0.5 bg-white shadow-xs">
                        <input
                          type="number"
                          value={stepUpPercent === 0 ? '' : stepUpPercent}
                          onChange={(e) => setStepUpPercent(e.target.value === '' ? 0 : Math.max(0, Math.min(100, Number(e.target.value))))}
                          className="w-10 font-mono text-amber-600 font-black text-xs outline-none bg-transparent text-right"
                        />
                        <span className="font-mono text-amber-600 text-[11px]">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={stepUpPercent}
                      onChange={(e) => setStepUpPercent(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-muted leading-relaxed font-medium">
                      💡 <strong>How Step-Up Works:</strong> If your monthly SIP is ₹{amount.toLocaleString('en-IN')}, next year it will automatically scale up by {stepUpPercent}% to <strong className="text-amber-700 font-mono">₹{Math.round(amount * (1 + stepUpPercent / 100)).toLocaleString('en-IN')}/mo</strong> as your salary increases!
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted">
                    Enable Annual Step-Up to simulate increasing your monthly investment every year alongside salary increments.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Graphs & Results Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Goal Planner Headline Banner */}
          {activeTab === 'goal_planner' && reqMonthlySip !== undefined && (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-2 border-primary/40 p-5 rounded-2xl shadow-sm space-y-2 animate-fadeIn">
              <div className="flex items-center space-x-2 text-primary font-black text-xs uppercase tracking-wider">
                <Target className="w-4 h-4" />
                <span>Required Monthly Investment Target</span>
              </div>
              <div className="text-2xl font-black font-mono text-main">
                ₹{reqMonthlySip.toLocaleString('en-IN')} <span className="text-xs text-muted font-normal">per month needed</span>
              </div>
              <p className="text-xs text-muted">
                To reach your target goal of <strong className="text-main font-mono">₹{targetGoal.toLocaleString('en-IN')}</strong> in {durationYears} years at {expectedReturn}% p.a. expected return.
              </p>
            </div>
          )}

          {/* Line Chart: Compounding Growth Trajectory */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-main">Compounding Growth Trajectory</h3>
              <div className="flex items-center space-x-3 text-[11px] font-bold">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>Nominal Value</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
                  <span>Invested</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span>Real (Inflation Adj.)</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" stroke="#8E8E93" fontSize={10} />
                  <YAxis stroke="#8E8E93" fontSize={10} tickFormatter={(v: any) => `₹${(v/100000).toFixed(1)}L`} />
                  <Tooltip formatter={(value: any, name: any) => {
                    const labelMap: Record<string, string> = {
                      nominal: 'Nominal Corpus (Future Rupees)',
                      invested: 'Cumulative Principal Deposited (Nominal)',
                      real: 'Real Corpus (Today\'s Purchasing Power)',
                    };
                    return [`₹${Number(value).toLocaleString('en-IN')}`, labelMap[String(name)] || String(name)];
                  }} />
                  <Line type="monotone" dataKey="nominal" stroke="#10B981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="invested" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="real" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Prof. Shelly Inflation & Real Wealth Breakdown */}
            <div className="bg-surface p-4 rounded-xl border border-black/5 text-xs space-y-2 pt-3">
              <div className="flex items-center space-x-1.5 font-bold text-main">
                <Info className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Prof. Shelly's Wealth & Inflation Advisor Guide</span>
              </div>
              <div className="text-muted leading-relaxed space-y-1 text-[11px]">
                <p>
                  • <strong className="text-main">Nominal Corpus (₹{finalNominal.toLocaleString('en-IN')})</strong>: The actual bank balance you will receive in {durationYears} years. You deposited a cumulative total of <strong className="font-mono text-main">₹{finalInvested.toLocaleString('en-IN')}</strong>, generating a nominal wealth gain of <strong className="text-emerald-700 font-mono font-bold">+₹{totalEstReturns.toLocaleString('en-IN')} (+{Math.round((totalEstReturns / (finalInvested || 1)) * 100)}%)</strong>.
                </p>
                <p>
                  • <strong className="text-main">Real Purchasing Power (₹{finalReal.toLocaleString('en-IN')})</strong>: What your {durationYears}-year future corpus will actually buy in <em>today’s rupees</em> (discounted at {inflationRate}% inflation). Your stepped-up contributions expressed in today's terms equaled <strong className="font-mono text-main">₹{finalRealInvested.toLocaleString('en-IN')}</strong>, generating a net real gain of <strong className="text-amber-700 font-mono font-bold">+₹{realGain.toLocaleString('en-IN')} (+{Math.round((realGain / (finalRealInvested || 1)) * 100)}%)</strong> pure purchasing power above inflation!
                </p>
              </div>
            </div>
          </Card>

          {/* Allocation Breakdown Pie Chart */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
            <h3 className="text-base font-extrabold text-main">Principal vs. Estimated Interest Yield</h3>
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted block">Total Principal Invested</span>
          <span className="text-lg font-black text-main font-mono">₹{finalInvested.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted block">Est. Interest Yield</span>
          <span className="text-lg font-black text-primary font-mono">₹{totalEstReturns.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted block">Total Future Nominal Value</span>
          <span className="text-lg font-black text-main font-mono">₹{finalNominal.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-primary/10 p-4 rounded-2xl border border-primary/30 space-y-1">
          <span className="text-[10px] uppercase font-bold text-primary block">Inflation-Adjusted (Real) Value</span>
          <span className="text-lg font-black text-primary font-mono">₹{finalReal.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* YEAR-BY-YEAR STEP-UP SCHEDULE BREAKDOWN TABLE */}
      {(activeTab === 'sip' || activeTab === 'hybrid' || activeTab === 'goal_planner') && (
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-extrabold text-main">
                {enableStepUp ? 'Annual Step-Up Schedule Breakdown' : 'Year-by-Year Growth Schedule'}
              </h3>
            </div>
            {enableStepUp && (
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                +{stepUpPercent}% Annual Increase Active
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-surface border-b border-black/5 text-muted uppercase font-bold text-[10px]">
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Monthly SIP Amount</th>
                  <th className="py-3 px-4">Annual Invested</th>
                  <th className="py-3 px-4">Cumulative Invested</th>
                  <th className="py-3 px-4">Nominal Corpus</th>
                  <th className="py-3 px-4 text-right">Real (Inflation Adj.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 font-mono">
                {yearlySchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-main">Year {row.year}</td>
                    <td className="py-3 px-4 text-primary font-bold">₹{row.monthlySip.toLocaleString('en-IN')}/mo</td>
                    <td className="py-3 px-4">₹{row.annualContribution.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-muted">₹{row.cumulativeInvested.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-main">₹{row.nominalCorpus.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 text-right">₹{row.realCorpus.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

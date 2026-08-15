import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { LiveMarketCard } from '../components/LiveMarketCard';
import { fetchWithAuth } from '../api/config';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  CheckCircle2,
  Info,
  BookOpen,
  Calculator,
  TrendingUp,
  Sliders,
  Save,
  Trash2,
  BookmarkCheck,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface CategoryAlloc {
  category: string;
  percentage: number;
  monthly_amount: number;
  asset_class?: string;
  cagr_rate?: number;
  description?: string;
}

interface PortfolioLens {
  id?: string | number;
  lens_name: string;
  risk_label: string;
  is_user_match: boolean;
  is_custom?: boolean;
  is_saved?: boolean;
  equity_percentage: number;
  debt_percentage: number;
  gold_percentage: number;
  expected_cagr?: number;
  category_allocations: CategoryAlloc[];
  description: string;
}

interface SavedScenarioItem {
  id: number;
  scenario_name: string;
  payload: any;
  created_at?: string;
}

const DEFAULT_CATEGORIES: { category: string; asset_class: string; cagr_rate: number; description: string }[] = [
  { category: 'Nifty 50 Large Cap Index', asset_class: 'Equity', cagr_rate: 12.0, description: "Invests in India's top 50 blue-chip companies for stable equity growth." },
  { category: 'Flexi Cap & Mid Cap Equity', asset_class: 'Equity', cagr_rate: 13.5, description: "Dynamically allocates across market caps to capture growth." },
  { category: 'Small Cap Index Funds', asset_class: 'Equity', cagr_rate: 15.0, description: "High-growth emerging business opportunities." },
  { category: 'Fixed Deposits & Liquid Funds', asset_class: 'Debt/FD', cagr_rate: 6.5, description: "Guaranteed bank FDs & liquid funds providing 100% capital safety." },
  { category: 'Short Duration Debt & Target Maturity', asset_class: 'Debt/FD', cagr_rate: 7.5, description: "High-grade corporate bonds & government securities." },
  { category: 'Sovereign Gold Bonds (SGB) & Gold ETFs', asset_class: 'Gold', cagr_rate: 8.0, description: "Government-backed SGBs yielding 2.5% annual interest + gold price gains." },
];

const DEFAULT_LENSES: PortfolioLens[] = [
  {
    id: 'preset-Safe',
    lens_name: 'Safe',
    risk_label: 'Conservative',
    is_user_match: false,
    equity_percentage: 25.0,
    debt_percentage: 65.0,
    gold_percentage: 10.0,
    expected_cagr: 7.8,
    description: 'Focuses heavily on capital preservation with 65% in FDs & Debt, 25% in Large Cap Equity, and 10% Gold.',
    category_allocations: [
      { category: 'Nifty 50 Large Cap Index', percentage: 17.5, monthly_amount: 875, asset_class: 'Equity', cagr_rate: 12.0, description: DEFAULT_CATEGORIES[0].description },
      { category: 'Flexi Cap & Mid Cap Equity', percentage: 7.5, monthly_amount: 375, asset_class: 'Equity', cagr_rate: 13.5, description: DEFAULT_CATEGORIES[1].description },
      { category: 'Small Cap Index Funds', percentage: 0.0, monthly_amount: 0, asset_class: 'Equity', cagr_rate: 15.0, description: DEFAULT_CATEGORIES[2].description },
      { category: 'Fixed Deposits & Liquid Funds', percentage: 39.0, monthly_amount: 1950, asset_class: 'Debt/FD', cagr_rate: 6.5, description: DEFAULT_CATEGORIES[3].description },
      { category: 'Short Duration Debt & Target Maturity', percentage: 26.0, monthly_amount: 1300, asset_class: 'Debt/FD', cagr_rate: 7.5, description: DEFAULT_CATEGORIES[4].description },
      { category: 'Sovereign Gold Bonds (SGB) & Gold ETFs', percentage: 10.0, monthly_amount: 500, asset_class: 'Gold', cagr_rate: 8.0, description: DEFAULT_CATEGORIES[5].description },
    ],
  },
  {
    id: 'preset-Medium',
    lens_name: 'Medium',
    risk_label: 'Balanced',
    is_user_match: true,
    equity_percentage: 55.0,
    debt_percentage: 35.0,
    gold_percentage: 10.0,
    expected_cagr: 11.2,
    description: 'Optimal balance of 55% Equity, 35% FD & Debt, and 10% Gold for steady compounding with market protection.',
    category_allocations: [
      { category: 'Nifty 50 Large Cap Index', percentage: 27.5, monthly_amount: 1375, asset_class: 'Equity', cagr_rate: 12.0, description: DEFAULT_CATEGORIES[0].description },
      { category: 'Flexi Cap & Mid Cap Equity', percentage: 19.25, monthly_amount: 962.5, asset_class: 'Equity', cagr_rate: 13.5, description: DEFAULT_CATEGORIES[1].description },
      { category: 'Small Cap Index Funds', percentage: 8.25, monthly_amount: 412.5, asset_class: 'Equity', cagr_rate: 15.0, description: DEFAULT_CATEGORIES[2].description },
      { category: 'Fixed Deposits & Liquid Funds', percentage: 14.0, monthly_amount: 700, asset_class: 'Debt/FD', cagr_rate: 6.5, description: DEFAULT_CATEGORIES[3].description },
      { category: 'Short Duration Debt & Target Maturity', percentage: 21.0, monthly_amount: 1050, asset_class: 'Debt/FD', cagr_rate: 7.5, description: DEFAULT_CATEGORIES[4].description },
      { category: 'Sovereign Gold Bonds (SGB) & Gold ETFs', percentage: 10.0, monthly_amount: 500, asset_class: 'Gold', cagr_rate: 8.0, description: DEFAULT_CATEGORIES[5].description },
    ],
  },
  {
    id: 'preset-Risky',
    lens_name: 'Risky',
    risk_label: 'Aggressive',
    is_user_match: false,
    equity_percentage: 80.0,
    debt_percentage: 15.0,
    gold_percentage: 5.0,
    expected_cagr: 13.6,
    description: 'Aggressive growth engine with 80% Equity (including Small Cap), 15% Debt, and 5% Gold for maximum wealth creation.',
    category_allocations: [
      { category: 'Nifty 50 Large Cap Index', percentage: 28.0, monthly_amount: 1400, asset_class: 'Equity', cagr_rate: 12.0, description: DEFAULT_CATEGORIES[0].description },
      { category: 'Flexi Cap & Mid Cap Equity', percentage: 32.0, monthly_amount: 1600, asset_class: 'Equity', cagr_rate: 13.5, description: DEFAULT_CATEGORIES[1].description },
      { category: 'Small Cap Index Funds', percentage: 20.0, monthly_amount: 1000, asset_class: 'Equity', cagr_rate: 15.0, description: DEFAULT_CATEGORIES[2].description },
      { category: 'Fixed Deposits & Liquid Funds', percentage: 4.5, monthly_amount: 225, asset_class: 'Debt/FD', cagr_rate: 6.5, description: DEFAULT_CATEGORIES[3].description },
      { category: 'Short Duration Debt & Target Maturity', percentage: 10.5, monthly_amount: 525, asset_class: 'Debt/FD', cagr_rate: 7.5, description: DEFAULT_CATEGORIES[4].description },
      { category: 'Sovereign Gold Bonds (SGB) & Gold ETFs', percentage: 5.0, monthly_amount: 250, asset_class: 'Gold', cagr_rate: 8.0, description: DEFAULT_CATEGORIES[5].description },
    ],
  },
];

export const PortfoliosPage: React.FC = () => {
  const [lenses, setLenses] = useState<PortfolioLens[]>(DEFAULT_LENSES);
  const [activePortfolio, setActivePortfolio] = useState<PortfolioLens>(DEFAULT_LENSES[1]);
  const [savedPortfolios, setSavedPortfolios] = useState<PortfolioLens[]>([]);
  const [activePortfolioId, setActivePortfolioId] = useState<string | number>('preset-Medium');

  const [userSalary, setUserSalary] = useState<number>(20000);
  const [userExpenses, setUserExpenses] = useState<number>(15000);
  const [userSavings, setUserSavings] = useState<number>(30000);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(5000);
  const [monthlyPortfolioSip, setMonthlyPortfolioSip] = useState<number>(2000);
  const [durationYears, setDurationYears] = useState<number>(10);
  const [userAge, setUserAge] = useState<number>(28);

  // Emergency Fund 6x Rule calculation
  const emergencyTarget = userExpenses * 6;
  const emergencyDeficit = Math.max(0, emergencyTarget - userSavings);
  const isEmergencyComplete = emergencyDeficit === 0;

  // Customization & Saving state
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [customPcts, setCustomPcts] = useState<number[]>([27.5, 19.25, 8.25, 14.0, 21.0, 10.0]);
  const [savePortfolioName, setSavePortfolioName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [trackMonthlyPayment, setTrackMonthlyPayment] = useState<boolean>(true);
  const [showShellyModal, setShowShellyModal] = useState<boolean>(false);
  const [shellyMessage, setShellyMessage] = useState<string>('');

  // High level ratios (Equity SIP vs FD Debt vs Gold)
  const [macroEquity, setMacroEquity] = useState<number>(55);
  const [macroDebt, setMacroDebt] = useState<number>(35);
  const [macroGold, setMacroGold] = useState<number>(10);

  // Fetch Saved Scenarios (Portfolios) from backend
  const fetchSavedPortfolios = async () => {
    try {
      const res = await fetchWithAuth('/api/engine/scenarios');
      if (res.ok) {
        const scenarios: SavedScenarioItem[] = await res.json();
        const portfolioScenarios: PortfolioLens[] = scenarios
          .filter((s) => s.payload && s.payload.type === 'portfolio')
          .map((s) => ({
            id: `saved-${s.id}`,
            lens_name: s.scenario_name,
            risk_label: s.payload.risk_label || 'Custom',
            is_user_match: false,
            is_custom: true,
            is_saved: true,
            equity_percentage: s.payload.equity_percentage || 50,
            debt_percentage: s.payload.debt_percentage || 40,
            gold_percentage: s.payload.gold_percentage || 10,
            expected_cagr: s.payload.expected_cagr || 10.5,
            description: s.payload.description || `Custom portfolio saved on ${s.created_at ? new Date(s.created_at).toLocaleDateString() : 'today'}.`,
            category_allocations: s.payload.category_allocations || [],
          }));

        setSavedPortfolios(portfolioScenarios);

        // If active portfolio was a saved portfolio, update reference
        const found = portfolioScenarios.find((p) => p.id === activePortfolioId);
        if (found) {
          setActivePortfolio(found);
        }
      }
    } catch (err) {
      console.error('Failed to fetch saved portfolios:', err);
    }
  };

  const fetchPortfolios = async () => {
    try {
      let sal = 20000;
      let exp = 15000;
      let sav = 30000;
      let age = 28;

      const profRes = await fetchWithAuth('/api/profile/me');
      if (profRes.ok) {
        const prof = await profRes.json();
        if (prof.salary) sal = prof.salary;
        if (prof.expenses) exp = prof.expenses;
        if (prof.savings !== undefined) sav = prof.savings;
        if (prof.age) age = prof.age;
      }

      const surp = Math.max(0, sal - exp);
      setUserSalary(sal);
      setUserExpenses(exp);
      setUserSavings(sav);
      setMonthlySurplus(surp);
      setUserAge(age);

      const emTarget = exp * 6;
      const emDeficit = Math.max(0, emTarget - userSavings);
      let portfolioSip = surp;
      if (emDeficit > 0) {
        const emergencyAlloc = Math.min(surp, Math.round(surp * 0.6));
        portfolioSip = Math.max(0, surp - emergencyAlloc);
      }
      setMonthlyPortfolioSip(portfolioSip);

      const res = await fetchWithAuth('/api/engine/calculate-allocation', {
        method: 'POST',
        body: JSON.stringify({
          age: age,
          monthly_income: sal,
          monthly_expenses: exp,
          current_savings: 50000,
          total_debt_balance: 0,
          employment_type: 'salaried-private',
          dependents: 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.preset_lenses && Array.isArray(data.preset_lenses) && data.preset_lenses.length > 0) {
          const loadedLenses = data.preset_lenses.map((l: any) => ({
            ...l,
            id: `preset-${l.lens_name}`,
          }));
          setLenses(loadedLenses);
          
          // Auto-select recommended portfolio match by default if none selected yet
          const match = loadedLenses.find((l: PortfolioLens) => l.is_user_match);
          if (match && activePortfolioId === 'preset-Medium') {
            setActivePortfolio(match);
            setActivePortfolioId(match.id!);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio lenses:', err);
    }

    await fetchSavedPortfolios();
  };

  useEffect(() => {
    fetchPortfolios();

    const handleProfileUpdate = () => {
      fetchPortfolios();
    };

    window.addEventListener('finverse_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('finverse_profile_updated', handleProfileUpdate);
  }, []);

  // Update surplus amounts whenever activePortfolio or monthlyPortfolioSip changes
  const activeAllocations: CategoryAlloc[] = activePortfolio.category_allocations.map((cat, idx) => {
    const pct = isCustomizing ? customPcts[idx] : cat.percentage;
    const baseInfo = DEFAULT_CATEGORIES[idx] || DEFAULT_CATEGORIES[0];
    return {
      category: cat.category || baseInfo.category,
      percentage: pct,
      monthly_amount: Math.round((monthlyPortfolioSip * pct) / 100),
      asset_class: cat.asset_class || baseInfo.asset_class,
      cagr_rate: cat.cagr_rate || baseInfo.cagr_rate,
      description: cat.description || baseInfo.description,
    };
  });

  // Calculate Weighted CAGR dynamically, clamped to realistic long-term expected returns (4% - 18%)
  const calculateCagr = (allocs: CategoryAlloc[]): number => {
    let sum = 0;
    allocs.forEach((a) => {
      const rate = Math.max(4.0, Math.min(18.0, a.cagr_rate || 10.0));
      sum += (a.percentage * rate) / 100;
    });
    return Math.round(Math.max(4.0, Math.min(18.0, sum)) * 10) / 10;
  };

  const rawCagr = isCustomizing ? calculateCagr(activeAllocations) : (activePortfolio.expected_cagr || 11.2);
  const currentCagr = Math.round(Math.max(4.0, Math.min(18.0, rawCagr)) * 10) / 10;

  // Total Percentage sum for custom validation
  const customPctTotal = Math.round(customPcts.reduce((a, b) => a + b, 0) * 10) / 10;

  // Handle macro ratio change (FD vs SIP vs Gold)
  const handleMacroRatioChange = (eq: number, debt: number, gold: number) => {
    setMacroEquity(eq);
    setMacroDebt(debt);
    setMacroGold(gold);

    // Distribute among 6 categories
    // Equity (3 categories: 50% large cap, 35% flexi, 15% small cap of eq)
    const largeCap = Math.round((eq * 0.50) * 10) / 10;
    const flexiCap = Math.round((eq * 0.35) * 10) / 10;
    const smallCap = Math.round((eq * 0.15) * 10) / 10;

    // Debt (2 categories: 50% FDs, 50% short debt of debt)
    const fdLiquid = Math.round((debt * 0.50) * 10) / 10;
    const shortDebt = Math.round((debt * 0.50) * 10) / 10;

    // Gold (1 category)
    const goldPct = gold;

    setCustomPcts([largeCap, flexiCap, smallCap, fdLiquid, shortDebt, goldPct]);
  };

  // Helper to edit single category percentage
  const handleCategoryPctChange = (idx: number, newVal: number) => {
    const next = [...customPcts];
    next[idx] = Math.max(0, Math.min(100, Math.round(newVal * 10) / 10));
    setCustomPcts(next);
  };

  // Auto Normalize custom percentages to 100%
  const handleNormalizePercentages = () => {
    const total = customPcts.reduce((a, b) => a + b, 0);
    if (total === 0) return;
    const normalized = customPcts.map((val) => Math.round((val / total) * 1000) / 10);
    setCustomPcts(normalized);
  };

  // Select any portfolio (preset or saved)
  const handleSelectPortfolio = (portfolio: PortfolioLens) => {
    setActivePortfolio(portfolio);
    setActivePortfolioId(portfolio.id || `preset-${portfolio.lens_name}`);
    setIsCustomizing(false);
    
    // Populate custom sliders with selected portfolio values
    const pcts = portfolio.category_allocations.map((c) => c.percentage);
    if (pcts.length === 6) setCustomPcts(pcts);

    const eqSum = portfolio.equity_percentage;
    const debtSum = portfolio.debt_percentage;
    const goldSum = portfolio.gold_percentage;
    setMacroEquity(eqSum);
    setMacroDebt(debtSum);
    setMacroGold(goldSum);
  };

  // Start customizing current portfolio
  const handleStartCustomizing = () => {
    setIsCustomizing(true);
    const pcts = activePortfolio.category_allocations.map((c) => c.percentage);
    if (pcts.length === 6) setCustomPcts(pcts);
  };

  // Save current active or custom portfolio to backend scenarios
  const handleSavePortfolio = async () => {
    if (!savePortfolioName.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    const eqPct = activeAllocations
      .filter((a) => a.asset_class === 'Equity')
      .reduce((sum, a) => sum + a.percentage, 0);
    const debtPct = activeAllocations
      .filter((a) => a.asset_class === 'Debt/FD')
      .reduce((sum, a) => sum + a.percentage, 0);
    const goldPct = activeAllocations
      .filter((a) => a.asset_class === 'Gold')
      .reduce((sum, a) => sum + a.percentage, 0);

    const payload = {
      type: 'portfolio',
      lens_name: savePortfolioName.trim(),
      risk_label: isCustomizing ? 'Custom Ratio' : activePortfolio.risk_label,
      equity_percentage: Math.round(eqPct * 10) / 10,
      debt_percentage: Math.round(debtPct * 10) / 10,
      gold_percentage: Math.round(goldPct * 10) / 10,
      expected_cagr: currentCagr,
      description: isCustomizing
        ? `Customized ratio with ${Math.round(eqPct)}% Equity (SIP), ${Math.round(debtPct)}% FD & Debt, and ${Math.round(goldPct)}% Gold.`
        : activePortfolio.description,
      category_allocations: activeAllocations,
    };

    try {
      const res = await fetchWithAuth('/api/engine/scenarios', {
        method: 'POST',
        body: JSON.stringify({
          scenario_name: savePortfolioName.trim(),
          payload: payload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveMessage('Portfolio saved successfully!');
        setShowSaveModal(false);
        setSavePortfolioName('');
        
        // Refresh saved portfolios list
        await fetchSavedPortfolios();

        // Set saved portfolio as active
        if (data.scenario) {
          const newId = `saved-${data.scenario.id}`;
          const newPortfolio: PortfolioLens = {
            id: newId,
            lens_name: data.scenario.scenario_name,
            risk_label: payload.risk_label,
            is_user_match: false,
            is_custom: true,
            is_saved: true,
            equity_percentage: payload.equity_percentage,
            debt_percentage: payload.debt_percentage,
            gold_percentage: payload.gold_percentage,
            expected_cagr: payload.expected_cagr,
            description: payload.description,
            category_allocations: payload.category_allocations,
          };
          setActivePortfolio(newPortfolio);
          setActivePortfolioId(newId);
          setIsCustomizing(false);
        }

        if (trackMonthlyPayment) {
          window.dispatchEvent(
            new CustomEvent('finverse_notification', {
              detail: {
                id: `save-${Date.now()}`,
                title: 'Monthly Auto-Payment Tracking Active',
                message: `Saved portfolio "${savePortfolioName.trim()}". Monthly surplus of ₹${monthlySurplus.toLocaleString('en-IN')} will auto-update your allocations!`,
                type: 'monthly_payment',
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
              },
            })
          );

          setShellyMessage(
            `Prof. Shelly says: 🎉 Congratulations! Your portfolio strategy "${savePortfolioName.trim()}" has been saved successfully! Your monthly payment of ₹${monthlySurplus.toLocaleString('en-IN')} is now set for auto-tracking!`
          );
          setShowShellyModal(true);
        }
      } else {
        setSaveMessage('Failed to save portfolio. Please try again.');
      }
    } catch (err) {
      console.error('Error saving portfolio scenario:', err);
      setSaveMessage('Error saving portfolio.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved portfolio
  const handleDeletePortfolio = async (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    const numericId = String(id).replace('saved-', '');

    try {
      const res = await fetchWithAuth(`/api/engine/scenarios/${numericId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSavedPortfolios((prev) => prev.filter((p) => p.id !== id));
        if (activePortfolioId === id) {
          const defaultMedium = lenses.find((l) => l.lens_name === 'Medium') || lenses[0] || DEFAULT_LENSES[1];
          setActivePortfolio(defaultMedium);
          setActivePortfolioId(defaultMedium.id!);
        }
      }
    } catch (err) {
      console.error('Error deleting portfolio scenario:', err);
    }
  };

  // Saved or default Step-Up Rate (%)
  const stepUpRate = (() => {
    const saved = localStorage.getItem('finverse_annual_stepup_rate');
    return saved ? parseFloat(saved) || 10 : 10;
  })();

  const emergencyAllocMonthly = Math.min(monthlySurplus, Math.round(monthlySurplus * 0.6));
  const monthsToFillEmergency = emergencyAllocMonthly > 0 ? Math.ceil(emergencyDeficit / emergencyAllocMonthly) : 0;
  const daysToFillEmergency = monthsToFillEmergency * 30;

  // Calculate Compounding Trajectory for Active Portfolio
  const generateGrowthData = () => {
    const data = [];
    let currentInvested = userSavings;
    let currentNominal = userSavings;
    const rMonthly = currentCagr / 100 / 12;

    for (let yr = 1; yr <= durationYears; yr++) {
      const yearSip = monthlyPortfolioSip * Math.pow(1 + stepUpRate / 100, yr - 1);
      for (let m = 1; m <= 12; m++) {
        currentInvested += yearSip;
        currentNominal = (currentNominal + yearSip) * (1 + rMonthly);
      }
      const inflationFactor = Math.pow(1.06, yr);
      const realVal = Math.round(currentNominal / inflationFactor);

      data.push({
        year: `Yr ${yr}`,
        invested: Math.round(currentInvested),
        nominal: Math.round(currentNominal),
        real: Math.round(realVal),
      });
    }
    return data;
  };

  const growthData = generateGrowthData();
  const finalInvested = growthData.length > 0 ? growthData[growthData.length - 1].invested : 0;
  const finalNominal = growthData.length > 0 ? growthData[growthData.length - 1].nominal : 0;
  const finalReal = growthData.length > 0 ? growthData[growthData.length - 1].real : 0;
  const estYield = Math.max(0, finalNominal - finalInvested);

  // Recharts Donut Data
  const donutColors = ['#10B981', '#059669', '#34D399', '#6366F1', '#4F46E5', '#F59E0B'];
  const pieData = activeAllocations.map((cat, idx) => ({
    name: cat.category,
    value: cat.percentage,
    color: donutColors[idx % donutColors.length],
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* LIVE MARKET INTELLIGENCE & VALUATION CARD */}
      <LiveMarketCard onOpenShellyChat={() => window.dispatchEvent(new CustomEvent('open_shelly_chat'))} />

      {/* TOP PRIORITY EMERGENCY RESERVE BANNER */}
      {!isEmergencyComplete && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-2 border-amber-500/40 p-6 rounded-3xl shadow-md space-y-4 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="bg-amber-500 text-white font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Top Strategic Priority #1</span>
                </span>
                <span className="text-xs font-mono font-bold text-amber-700">6× Monthly Expenses Rule</span>
              </div>
              <h2 className="text-xl font-black text-main tracking-tight">
                Before Investing: Complete Your Emergency Reserve First
              </h2>
              <p className="text-xs text-muted max-w-2xl leading-relaxed">
                Before allocating surplus to equity wealth creation, financial planning rules require securing a 6-month liquid cushion (₹{emergencyTarget.toLocaleString('en-IN')}).
              </p>
            </div>

            <div className="bg-card-bg p-4 rounded-2xl border border-black/10 shadow-sm text-right space-y-1 flex-shrink-0">
              <span className="text-[10px] font-bold text-muted uppercase block">Emergency Reserve Progress</span>
              <div className="text-lg font-black font-mono text-amber-600">
                ₹{userSavings.toLocaleString('en-IN')} <span className="text-xs text-muted font-normal">/ ₹{emergencyTarget.toLocaleString('en-IN')}</span>
              </div>
              <span className="text-[11px] font-bold text-main block">
                {Math.round((userSavings / emergencyTarget) * 100)}% Funded (Deficit: ₹{emergencyDeficit.toLocaleString('en-IN')})
              </span>
            </div>
          </div>

          {/* Dual-Bucket Product Recommendation Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-card-bg p-4 rounded-2xl border border-black/10 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-main uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Flexi-FD (Bank Sweep-In)</span>
                </span>
                <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">50% Allocation</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Earn ~6.5%–7.5% p.a. while keeping funds connected to your bank account for <strong>instant 24/7 ATM & UPI withdrawal</strong> without exit penalties.
              </p>
            </div>

            <div className="bg-card-bg p-4 rounded-2xl border border-black/10 space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-main uppercase tracking-wider flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Liquid / Arbitrage Debt Fund</span>
                </span>
                <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">50% Allocation</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                High tax efficiency for 20-30% tax bracket earners with T+1 business day instant redemption and zero equity market volatility.
              </p>
            </div>
          </div>

          {/* Live Dynamic Timeline Box & Rollover Strategy */}
          <div className="space-y-2 pt-2 border-t border-amber-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20">
              <div className="text-xs font-semibold text-amber-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  Based on your cash flow, <strong>₹{emergencyAllocMonthly.toLocaleString('en-IN')}/month</strong> is being deposited into your Emergency Reserve.
                </span>
              </div>
              <div className="text-xs font-black text-amber-800 bg-card-bg px-3.5 py-1.5 rounded-xl border border-amber-500/30 whitespace-nowrap shadow-xs font-mono">
                ⏳ Fully Funded in {monthsToFillEmergency} Months (~{daysToFillEmergency} Days)
              </div>
            </div>

            <p className="text-[11px] text-amber-900 font-medium italic text-center sm:text-left">
              💡 Strategic Rollover: Once your ₹{emergencyTarget.toLocaleString('en-IN')} reserve is secured in {monthsToFillEmergency} months, this entire ₹{emergencyAllocMonthly.toLocaleString('en-IN')}/mo allocation will automatically shift 100% into your Growth Portfolio SIP!
            </p>
          </div>
        </div>
      )}
      {/* Page Header */}
      <div className="flex flex-col items-center text-center space-y-3 border-b border-black/5 pb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Portfolio Engine & Customizer</span>
        </div>
        <h1 className="text-3xl font-black text-main tracking-tight">
          Personalized Portfolio Recommendations
        </h1>
        <p className="text-xs text-muted max-w-2xl leading-relaxed">
          Dynamic Indian diversification based on your profile (Age {userAge}, Salary ₹{userSalary.toLocaleString('en-IN')}, Expenses ₹{userExpenses.toLocaleString('en-IN')}). Choose a preset, tweak FD to SIP ratios, or build and save custom allocation portfolios.
        </p>

        {/* Top Middle Preset Selector */}
        <div className="flex items-center space-x-2 bg-surface p-1.5 rounded-2xl border border-black/10 max-w-lg w-full mt-2 shadow-sm">
          {lenses.map((lens) => {
            const isSelected = activePortfolioId === lens.id && !isCustomizing;
            const isMatch = lens.is_user_match;

            return (
              <button
                key={lens.id || lens.lens_name}
                onClick={() => handleSelectPortfolio(lens)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center space-x-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm scale-[1.02]'
                    : 'text-muted hover:text-main hover:bg-black/5'
                }`}
              >
                <span>{lens.lens_name}</span>
                {isMatch && <span className="text-[10px]" title="Recommended for Profile">⭐</span>}
              </button>
            );
          })}

          <button
            onClick={() => handleStartCustomizing()}
            className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center space-x-1.5 ${
              isCustomizing
                ? 'bg-amber-500 text-white shadow-sm scale-[1.02]'
                : 'text-amber-600 hover:bg-amber-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Active Strategy Banner & Quick Save Action */}
      <div className="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h2 className="text-lg font-black text-main flex items-center space-x-2">
              <span>{isCustomizing ? 'Customized Ratio' : activePortfolio.lens_name} Portfolio</span>
              {activePortfolio.is_saved && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                  Saved Portfolio
                </span>
              )}
            </h2>

            {activePortfolio.is_user_match && !isCustomizing && (
              <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>⭐ Recommended for Profile</span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted font-medium">
            {isCustomizing
              ? 'You are customizing asset allocations. Adjust FD to SIP sliders or fine-tune individual category percentages below.'
              : activePortfolio.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="bg-card-bg border border-black/10 px-4 py-2 rounded-xl text-xs font-mono text-right flex-shrink-0">
            <span className="text-muted block text-[10px] uppercase font-bold">Weighted CAGR</span>
            <span className="font-extrabold text-primary text-sm">~{currentCagr}% p.a.</span>
          </div>

          <button
            onClick={() => setShowSaveModal(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm flex items-center space-x-2 transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Portfolio</span>
          </button>
        </div>
      </div>

      {/* Interactive FD to SIP Ratio & Asset Class Customization Accordion */}
      {isCustomizing && (
        <Card className="p-6 bg-card-bg shadow-card rounded-card border-2 border-amber-500/30 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-black/5 pb-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-extrabold text-main">Customize Asset Allocation & FD to SIP Ratio</h2>
                <p className="text-xs text-muted font-medium">Macro Target: <strong className="text-primary">{macroEquity}% SIP (Equity)</strong> • <strong className="text-indigo-600">{macroDebt}% FD & Debt</strong> • <strong className="text-amber-600">{macroGold}% Gold</strong></p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {customPctTotal !== 100 && (
                <button
                  onClick={handleNormalizePercentages}
                  className="bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-extrabold py-1.5 px-3 rounded-lg flex items-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Auto-Balance to 100%</span>
                </button>
              )}
              <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-lg ${customPctTotal === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                Total: {customPctTotal}% {customPctTotal !== 100 && '⚠️'}
              </span>
            </div>
          </div>

          {/* Quick Ratio Presets & High-Level Sliders */}
          <div className="space-y-4 bg-surface p-4 rounded-2xl border border-black/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-main uppercase tracking-wider">Quick Macro Presets (FD vs SIP Ratio)</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMacroRatioChange(70, 20, 10)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-card-bg border border-black/10 hover:border-primary text-main transition-all"
                >
                  70% SIP / 20% FD / 10% Gold
                </button>
                <button
                  onClick={() => handleMacroRatioChange(50, 40, 10)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-card-bg border border-black/10 hover:border-primary text-main transition-all"
                >
                  50% SIP / 40% FD / 10% Gold
                </button>
                <button
                  onClick={() => handleMacroRatioChange(30, 60, 10)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-card-bg border border-black/10 hover:border-primary text-main transition-all"
                >
                  30% SIP / 60% FD / 10% Gold
                </button>
              </div>
            </div>
          </div>

          {/* Fine-Tuning 6 Asset Class Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAllocations.map((cat, idx) => (
              <div key={cat.category} className="bg-surface p-3.5 rounded-xl border border-black/5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-main truncate pr-2">{cat.category}</span>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-muted text-[10px]">₹{cat.monthly_amount.toLocaleString('en-IN')}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={customPcts[idx]}
                      onChange={(e) => handleCategoryPctChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-16 p-1 text-right font-black text-primary bg-card-bg border border-black/10 rounded-md focus:ring-1 focus:ring-primary"
                    />
                    <span className="font-bold text-main">%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.5"
                  value={customPcts[idx]}
                  onChange={(e) => handleCategoryPctChange(idx, parseFloat(e.target.value) || 0)}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step-by-Step Rupee Surplus Math Banner */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-3">
        <div className="flex items-center space-x-2 border-b border-black/5 pb-3">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="text-base font-extrabold text-main">Your Monthly Surplus Calculation</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="bg-surface p-3.5 rounded-xl border border-black/5 space-y-1">
            <span className="text-muted block text-[10px] uppercase font-bold">Monthly Income / Salary</span>
            <span className="text-base font-black text-main">₹{userSalary.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-surface p-3.5 rounded-xl border border-black/5 space-y-1">
            <span className="text-muted block text-[10px] uppercase font-bold">Monthly Expenditure</span>
            <span className="text-base font-black text-warning">₹{userExpenses.toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-primary/10 p-3.5 rounded-xl border border-primary/30 space-y-1">
            <span className="text-primary block text-[10px] uppercase font-bold">Net Monthly Investment Surplus</span>
            <span className="text-base font-black text-primary">₹{monthlySurplus.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <p className="text-xs text-muted font-medium pt-1">
          Formula: <strong className="text-main font-mono">Salary (₹{userSalary.toLocaleString('en-IN')}) - Expenditure (₹{userExpenses.toLocaleString('en-IN')}) = Surplus (₹{monthlySurplus.toLocaleString('en-IN')})</strong>. This ₹{monthlySurplus.toLocaleString('en-IN')} surplus is divided across 6 asset classes according to your active portfolio strategy.
        </p>
      </Card>

      {/* Main Grid: 6 Asset Breakdown (Left) + Charts & Saved Portfolio Options Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 6 Asset Breakdown Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <h2 className="text-base font-extrabold text-main flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span>6-Asset Diversification Breakdown</span>
            </h2>
            <span className="text-xs font-mono text-muted">Surplus: ₹{monthlySurplus.toLocaleString('en-IN')}/mo</span>
          </div>

          <div className="space-y-3">
            {activeAllocations.map((cat: any, idx: number) => {
              const borderColors = ['border-emerald-500', 'border-emerald-600', 'border-emerald-400', 'border-indigo-500', 'border-indigo-600', 'border-amber-500'];

              return (
                <Card
                  key={cat.category}
                  className={`p-4 bg-card-bg shadow-sm rounded-xl border-l-4 ${borderColors[idx % borderColors.length]} border-y border-r border-black/5 space-y-2 hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-surface text-muted border border-black/5 inline-block">
                          {cat.asset_class || 'Asset'} • ~{cat.cagr_rate || 12}% CAGR
                        </span>
                        {cat.live_source && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-block">
                            📡 {cat.live_source}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-extrabold text-main">
                        <GlossaryTerm term={cat.category}>{cat.category}</GlossaryTerm>
                      </h3>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-black text-primary block">
                        ₹{Number(cat.monthly_amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-muted font-bold">{cat.percentage}% of Surplus</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted font-medium leading-relaxed bg-surface p-2.5 rounded-lg border border-black/5">
                    {cat.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Charts & Saved Custom Portfolios Panel */}
        <div className="lg:col-span-6 space-y-6">
          {/* Live Data Attribution Summary Card */}
          <Card className="p-5 bg-card-bg shadow-sm rounded-2xl border border-border space-y-3">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-bold text-main">Live Data Sources & Yield Benchmark</h3>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                Synced Today
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                <span className="text-[10px] text-muted block font-sans">Large Cap Benchmark</span>
                <strong className="text-main">NSE Nifty 50 Live Feed</strong>
              </div>
              <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                <span className="text-[10px] text-muted block font-sans">Short-Duration Debt</span>
                <strong className="text-main">India 10Y G-Sec Yield (6.85%)</strong>
              </div>
              <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                <span className="text-[10px] text-muted block font-sans">Gold Allocation</span>
                <strong className="text-main">Gold ETF Spot (GOLDBEES.NS)</strong>
              </div>
              <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                <span className="text-[10px] text-muted block font-sans">FD / Liquid Yield</span>
                <strong className="text-main">RBI Scheduled Bank Sweep-In</strong>
              </div>
            </div>
            <p className="text-[11px] text-muted italic">
              All portfolio CAGR figures and surplus allocations are calculated from live market indices and real-time yield curves.
            </p>
          </Card>

          {/* User Saved Custom Portfolios Panel (Only shown if user saved custom portfolios) */}
          {savedPortfolios.length > 0 && (
            <Card className="p-6 bg-card-bg shadow-card rounded-card border-2 border-primary/20 space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-3">
                <div className="flex items-center space-x-2">
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-extrabold text-main">My Saved Custom Portfolios</h3>
                </div>
                <span className="text-xs font-mono font-bold text-muted">{savedPortfolios.length} Saved</span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {savedPortfolios.map((saved) => {
                  const isActive = activePortfolioId === saved.id && !isCustomizing;

                  return (
                    <div
                      key={saved.id}
                      onClick={() => handleSelectPortfolio(saved)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500'
                          : 'bg-surface border-black/5 hover:border-indigo-400'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-main">{saved.lens_name}</span>
                          {isActive && (
                            <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.2 rounded-full font-bold flex items-center space-x-1">
                              <Check className="w-3 h-3 inline" /> Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted line-clamp-1">{saved.description}</p>
                      </div>

                      <div className="flex items-center space-x-3 flex-shrink-0 pl-2">
                        <div className="text-right font-mono">
                          <span className="text-xs font-black text-indigo-600">~{saved.expected_cagr}%</span>
                          <span className="text-[10px] text-muted block">CAGR</span>
                        </div>

                        <button
                          onClick={(e) => handleDeletePortfolio(saved.id!, e)}
                          className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete Saved Portfolio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Chart 1: Recharts Donut Allocation */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
            <h3 className="text-base font-extrabold text-main border-b border-black/5 pb-2">
              6-Way Asset Allocation Split
            </h3>

            <div className="w-full flex items-center justify-center" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => `${val}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold pt-1">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-main">{item.name}: <strong className="font-mono">{item.value}%</strong></span>
                </div>
              ))}
            </div>
          </Card>

          {/* Chart 2: Compounding Line Chart Trajectory */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <h3 className="text-base font-extrabold text-main">Compounding Growth Trajectory</h3>
              <span className="text-xs font-mono font-bold text-primary">~{currentCagr}% CAGR</span>
            </div>

            <div className="w-full" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" stroke="#8E8E93" fontSize={10} />
                  <YAxis stroke="#8E8E93" fontSize={10} tickFormatter={(v: any) => {
                    const num = Number(v);
                    if (!Number.isFinite(num)) return '₹0';
                    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
                    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
                    return `₹${num}`;
                  }} />
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  <Line type="monotone" dataKey="nominal" stroke="#10B981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="invested" stroke="#6366F1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="real" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      </div>

      {/* Multi-Duration Compounding Return Simulator */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-base font-extrabold text-main">Multi-Duration Return Projections</h2>
              <p className="text-xs text-muted font-medium">Select investment tenure to calculate expected wealth compounding.</p>
            </div>
          </div>

          {/* Duration Buttons */}
          <div className="flex items-center space-x-2 bg-surface p-1 rounded-xl border border-black/10 self-start sm:self-auto">
            {[5, 10, 15, 20, 30].map((yr) => (
              <button
                key={yr}
                onClick={() => setDurationYears(yr)}
                className={`py-1.5 px-3 rounded-lg text-xs font-black transition-all ${
                  durationYears === yr
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-main hover:bg-black/5'
                }`}
              >
                {yr} Yrs
              </button>
            ))}
          </div>
        </div>

        {/* 4 Summary Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted block">Total Principal Invested</span>
            <span className="text-lg font-black text-main font-mono">
              ₹{finalInvested >= 10000000 ? `${(finalInvested / 10000000).toFixed(2)} Cr` : finalInvested.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted block">Est. Compound Interest</span>
            <span className="text-lg font-black text-primary font-mono">
              ₹{estYield >= 10000000 ? `${(estYield / 10000000).toFixed(2)} Cr` : estYield.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted block">Nominal Future Corpus</span>
            <span className="text-lg font-black text-main font-mono">
              ₹{finalNominal >= 10000000 ? `${(finalNominal / 10000000).toFixed(2)} Cr` : finalNominal.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-primary/10 p-4 rounded-2xl border border-primary/30 space-y-1">
            <span className="text-[10px] uppercase font-bold text-primary block">Inflation-Adjusted Real Value</span>
            <span className="text-lg font-black text-primary font-mono">
              ₹{finalReal >= 10000000 ? `${(finalReal / 10000000).toFixed(2)} Cr` : finalReal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Card>

      {/* Save Portfolio Modal Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-black/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <h3 className="text-base font-extrabold text-main flex items-center space-x-2">
                <Save className="w-5 h-5 text-primary" />
                <span>Save Portfolio Strategy</span>
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-muted hover:text-main text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted font-medium leading-relaxed">
              Give your portfolio a unique name to save it to your account. You can switch to it anytime from the right-side options panel.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-main uppercase tracking-wider block">Portfolio Name</label>
              <input
                type="text"
                value={savePortfolioName}
                onChange={(e) => setSavePortfolioName(e.target.value)}
                placeholder="e.g. My 70-30 Growth SIP & FD Mix"
                className="w-full p-3 bg-surface border border-black/10 rounded-xl text-xs font-bold text-main focus:ring-2 focus:ring-primary outline-none"
                autoFocus
              />
            </div>

            <div className="bg-surface p-3.5 rounded-xl border border-black/5 text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted">Expected CAGR:</span>
                <span className="font-bold text-primary">~{currentCagr}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Monthly Surplus:</span>
                <span className="font-bold text-main">₹{monthlySurplus.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Auto Monthly Tracking Checkbox */}
            <div className="flex items-start space-x-2.5 bg-primary/5 p-3 rounded-xl border border-primary/20 cursor-pointer" onClick={() => setTrackMonthlyPayment(!trackMonthlyPayment)}>
              <input
                type="checkbox"
                checked={trackMonthlyPayment}
                onChange={(e) => setTrackMonthlyPayment(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary h-4 w-4"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold text-main block">Track Monthly Payments & Auto-Update Balances</span>
                <span className="text-[11px] text-muted block leading-relaxed">
                  Automatically record monthly contributions to build Emergency Reserve & wealth allocations each month.
                </span>
              </div>
            </div>

            {saveMessage && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {saveMessage}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-black/10 hover:bg-black/5 text-muted transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePortfolio}
                disabled={isSaving || !savePortfolioName.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all disabled:opacity-50 flex items-center justify-center space-x-1"
              >
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Strategy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHELLY CELEBRATION MODAL */}
      {showShellyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border-2 border-primary/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scaleUp text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 text-3xl flex items-center justify-center mx-auto shadow-sm">
              🐢
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-main">Shelly Congratulates You! 🎉</h3>
              <p className="text-xs text-muted leading-relaxed font-medium">
                {shellyMessage || `Awesome financial move! Your monthly payment tracking is activated and your investment roadmap is auto-updating.`}
              </p>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-xs font-mono text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">Monthly Surplus Tracked:</span>
                <span className="font-extrabold text-primary">₹{monthlySurplus.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Emergency Target (6×):</span>
                <span className="font-extrabold text-main">₹{emergencyTarget.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Auto-Sync Status:</span>
                <span className="font-extrabold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 inline" />
                  <span>Active</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowShellyModal(false)}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-[1.01]"
            >
              Back to Workspace 🚀
            </button>
          </div>
        </div>
      )}

      {/* SEBI Regulatory Disclaimer Banner */}
      <div className="bg-surface border-2 border-black/10 p-5 rounded-2xl shadow-sm space-y-1.5 text-xs text-main">
        <div className="flex items-center space-x-2 font-extrabold text-main uppercase tracking-wider">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <span>Regulatory Disclaimer & Educational Notice</span>
        </div>
        <p className="font-semibold leading-relaxed text-muted">
          Finverse portfolio recommendations are algorithmically generated rule-based suggestions derived from your reported salary, expenses, and age. They are for educational literacy and self-planning purposes only and do not constitute formal SEBI-registered investment advice. Past performance does not guarantee future returns. Please consult a certified financial advisor before deploying capital.
        </p>
      </div>
    </div>
  );
};

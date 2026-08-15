import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { fetchWithAuth } from '../api/config';
import {
  CreditCard as DebtIcon,
  Plus,
  Trash2,
  Clock,
  Check,
} from 'lucide-react';

interface DebtItem {
  id: string;
  debt_name: string;
  balance: number;
  apr: number;
  minimum_payment: number;
  classification?: 'toxic' | 'manageable';
  allocated_payment?: number;
  reasoning?: string;
}

export const DebtPage: React.FC = () => {
  const storageKeyDebts = 'user_active_debts_v1';

  // Synchronously initialize debts state from localStorage to prevent initial empty-state flash
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem(storageKeyDebts);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to parse saved debts:', err);
      }
    }
    return [];
  });

  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(40000);
  const [currentSavings, setCurrentSavings] = useState<number>(100000);
  const [cibilBand, setCibilBand] = useState<string>('Good (700-749)');

  const [newDebtName, setNewDebtName] = useState<string>('');
  const [newDebtBalance, setNewDebtBalance] = useState<number | ''>(50000);
  const [newDebtApr, setNewDebtApr] = useState<number | ''>(18.0);
  const [newDebtEmi, setNewDebtEmi] = useState<number | ''>(2500);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Request sequence ref to prevent out-of-order async response race conditions
  const analysisSeqRef = React.useRef<number>(0);

  const loadUserProfile = async () => {
    try {
      const res = await fetchWithAuth('/api/profile/me');
      if (res.ok) {
        const prof = await res.json();
        if (prof.salary) setMonthlyIncome(prof.salary);
        if (prof.expenses) setMonthlyExpenses(prof.expenses);
        if (prof.savings) setCurrentSavings(prof.savings);
        if (prof.cibil_band) setCibilBand(prof.cibil_band);
      }
    } catch (err) {
      console.error('Failed to load profile in DebtPage:', err);
    }
  };

  useEffect(() => {
    loadUserProfile();

    const handleProfileUpdate = () => {
      loadUserProfile();
      const saved = localStorage.getItem(storageKeyDebts);
      if (saved) {
        try {
          setDebts(JSON.parse(saved));
        } catch (err) {
          console.error('Failed to re-parse saved debts:', err);
        }
      }
    };

    window.addEventListener('finverse_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('finverse_profile_updated', handleProfileUpdate);
  }, []);

  const saveAndNotifyDebts = (newDebts: DebtItem[]) => {
    setDebts(newDebts);
    localStorage.setItem(storageKeyDebts, JSON.stringify(newDebts));
    window.dispatchEvent(new CustomEvent('finverse_profile_updated'));
  };

  const runDebtAnalysis = async () => {
    const seq = ++analysisSeqRef.current;
    try {
      const payload = {
        monthly_income: monthlyIncome,
        monthly_expenses: monthlyExpenses,
        current_savings: currentSavings,
        cibil_band: cibilBand,
        debts: debts.map((d) => ({
          id: d.id,
          debt_name: d.debt_name,
          balance: Number(d.balance) || 0,
          apr: Number(d.apr) || 0,
          minimum_payment: Number(d.minimum_payment) || 0,
        })),
        risk_score: 50.0,
      };

      const res = await fetchWithAuth('/api/engine/analyze-debts', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Ignore stale, out-of-order response
        if (seq === analysisSeqRef.current) {
          setAnalysisResult(data);
        }
      }
    } catch (err) {
      console.error('Debt analysis failed:', err);
    }
  };

  useEffect(() => {
    runDebtAnalysis();
  }, [monthlyIncome, monthlyExpenses, currentSavings, cibilBand, debts]);

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDebtName.trim()) return;

    const newDebt: DebtItem = {
      id: Date.now().toString(),
      debt_name: newDebtName,
      balance: newDebtBalance === '' ? 0 : newDebtBalance,
      apr: newDebtApr === '' ? 0 : newDebtApr,
      minimum_payment: newDebtEmi === '' ? 0 : newDebtEmi,
    };
    const updated = [...debts, newDebt];
    saveAndNotifyDebts(updated);
    setNewDebtName('');
    setNewDebtBalance(50000);
    setNewDebtApr(18.0);
    setNewDebtEmi(2500);
    setShowAddForm(false);
  };

  const handleRemoveDebt = (id: string) => {
    const updated = debts.filter((d) => d.id !== id);
    saveAndNotifyDebts(updated);
  };

  const waterfall = analysisResult?.waterfall;
  const displayDebts = waterfall?.debts && waterfall.debts.length > 0 ? waterfall.debts : debts;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Integrated Debt & Payoff Waterfall Engine
          </span>
          <h1 className="text-3xl font-black text-main tracking-tight">Debt Portfolio</h1>
          <p className="text-xs text-muted mt-1">
            Classify toxic credit cards (&gt;24% <GlossaryTerm term="APR">APR</GlossaryTerm>) vs. manageable loans and optimize monthly surplus.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Debt / Loan</span>
        </button>
      </div>

      {/* Add Debt Form Card */}
      {showAddForm && (
        <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/10 space-y-4 animate-fadeIn">
          <h2 className="text-base font-extrabold text-main">Add Debt or Credit Card Balance</h2>
          <form onSubmit={handleCreateDebt} className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-main block mb-1">Debt / Loan Name</label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Credit Card, Car Loan"
                value={newDebtName}
                onChange={(e) => setNewDebtName(e.target.value)}
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-bold text-main block mb-1">Outstanding Balance (₹)</label>
              <input
                type="number"
                required
                value={newDebtBalance}
                onChange={(e) => setNewDebtBalance(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50000"
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-bold text-main block mb-1">APR Rate (%)</label>
              <input
                type="number"
                step="0.5"
                required
                value={newDebtApr}
                onChange={(e) => setNewDebtApr(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="18.0"
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-bold text-main block mb-1">Monthly EMI / Minimum Dues (₹)</label>
              <input
                type="number"
                required
                value={newDebtEmi}
                onChange={(e) => setNewDebtEmi(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2500"
                className="w-full bg-surface border border-black/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-main"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-sm"
              >
                Save Debt
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Empty State */}
      {debts.length === 0 && !showAddForm && (
        <div className="bg-surface p-12 rounded-card border-2 border-dashed border-black/10 text-center space-y-3">
          <DebtIcon className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-base font-bold text-main">No Debts or Credit Balances</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Click "Add Debt / Loan" above to add your loans or credit card balances to compute optimal payoff waterfalls.
          </p>
        </div>
      )}

      {/* Classified Debts List */}
      {displayDebts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-main">Classified Payoff List & Estimated Finish Lines</h2>
          <div className="grid grid-cols-1 gap-4">
            {displayDebts.map((debt: any, dIdx: number) => {
              const isToxic = debt.classification === 'toxic' || debt.apr > 24.0;
              const bal = Number(debt.balance) || 0;
              const aprVal = Number(debt.apr) || 14.0;
              const emiVal = Number(debt.minimum_payment) || 2500;

              let payoffMonths = 0;
              if (bal > 0) {
                const r = (aprVal / 100.0) / 12.0;
                if (r <= 0) payoffMonths = Math.ceil(bal / emiVal);
                else if (emiVal <= bal * r) payoffMonths = 999;
                else payoffMonths = Math.ceil(-Math.log(1.0 - (r * bal) / emiVal) / Math.log(1.0 + r));
              }

              return (
                <div
                  key={debt.id || dIdx}
                  className={`p-5 rounded-card border-2 transition-all space-y-3 ${
                    isToxic ? 'border-warning/40 bg-warning/5' : 'border-black/5 bg-card-bg'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <DebtIcon className={`w-4 h-4 ${isToxic ? 'text-warning' : 'text-primary'}`} />
                      <span className="font-extrabold text-main text-sm">{debt.debt_name}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          isToxic
                            ? 'bg-warning/20 text-warning border-warning/40'
                            : 'bg-primary/10 text-primary border-primary/30'
                        }`}
                      >
                        {isToxic ? 'TOXIC DEBT (>24% APR)' : 'MANAGEABLE DEBT'}
                      </span>

                      <button
                        onClick={() => handleRemoveDebt(debt.id)}
                        className="text-muted hover:text-warning p-1 rounded-lg"
                        title="Remove Debt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-surface p-3 rounded-xl border border-black/5">
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Balance</span>
                      <span className="font-bold text-main">₹{bal.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[9px] uppercase">APR</span>
                      <span className="font-bold text-main">{aprVal}%</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Monthly EMI</span>
                      <span className="font-bold text-primary">₹{emiVal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Estimated Finish Line Badge */}
                  {bal <= 0 ? (
                    <div className="bg-emerald-100 dark:bg-emerald-950 p-2.5 rounded-xl border border-emerald-400/40 text-emerald-950 dark:text-emerald-200 text-xs font-black flex items-center space-x-1.5">
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>🎉 Congratulations! Loan Fully Paid Off! Zero balance remaining.</span>
                    </div>
                  ) : (
                    <div className="bg-amber-100/60 dark:bg-amber-950/60 p-2.5 rounded-xl border border-amber-300/40 text-amber-900 dark:text-amber-200 text-xs font-extrabold flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Estimated Payoff Timeframe: ~{payoffMonths > 360 ? '30+ years' : `${payoffMonths} months`}</span>
                      </span>
                      <span className="font-mono text-[11px] font-black">
                        At ₹{emiVal.toLocaleString('en-IN')}/mo EMI
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

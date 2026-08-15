import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { fetchWithAuth } from '../api/config';
import {
  CreditCard as DebtIcon,
  Plus,
  Trash2,
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
  const [monthlyIncome] = useState<number>(120000);
  const [monthlyExpenses] = useState<number>(50000);
  const [currentSavings] = useState<number>(100000);
  const [cibilBand] = useState<string>('Poor (<650)');

  const storageKeyDebts = 'user_active_debts_v1';

  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [newDebtName, setNewDebtName] = useState<string>('');
  const [newDebtBalance, setNewDebtBalance] = useState<number | ''>(50000);
  const [newDebtApr, setNewDebtApr] = useState<number | ''>(18.0);
  const [newDebtEmi, setNewDebtEmi] = useState<number | ''>(2500);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Load persisted debts on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKeyDebts);
    if (saved) {
      try {
        setDebts(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse saved debts:', err);
      }
    }
  }, []);

  const saveAndNotifyDebts = (newDebts: DebtItem[]) => {
    setDebts(newDebts);
    localStorage.setItem(storageKeyDebts, JSON.stringify(newDebts));
    window.dispatchEvent(new CustomEvent('finverse_profile_updated'));
  };

  const runDebtAnalysis = async () => {
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
        setAnalysisResult(data);
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
      {debts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-main">Classified Payoff List</h2>
          <div className="grid grid-cols-1 gap-4">
            {waterfall?.debts?.map((debt: any) => {
              const isToxic = debt.classification === 'toxic';

              return (
                <div
                  key={debt.id}
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
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] bg-surface p-3 rounded-xl border border-black/5">
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Balance</span>
                      <span className="font-bold text-main">₹{Number(debt.balance).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[9px] uppercase">APR</span>
                      <span className="font-bold text-main">{debt.apr}%</span>
                    </div>
                    <div>
                      <span className="text-muted block text-[9px] uppercase">Allocated Payoff</span>
                      <span className="font-bold text-primary">₹{Number(debt.allocated_payment || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

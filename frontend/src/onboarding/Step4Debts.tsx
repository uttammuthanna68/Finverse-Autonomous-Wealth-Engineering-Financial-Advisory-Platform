import React, { useState } from 'react';
import { Card } from '../components/Card';
import { OnboardingData, DebtItem, DebtType, CATEGORY_DEFAULT_APRS } from './types';
import { ArrowRight, ArrowLeft, CreditCard as DebtIcon, Plus, Trash2, HelpCircle } from 'lucide-react';


interface Step4Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step4Debts: React.FC<Step4Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    data.debts.forEach((debt, index) => {
      if (debt.balance === '' || Number(debt.balance) < 0 || isNaN(Number(debt.balance))) {
        newErrors[`balance_${index}`] = 'Balance cannot be negative.';
      }

      if (debt.apr === '' || Number(debt.apr) < 0 || Number(debt.apr) > 42 || isNaN(Number(debt.apr))) {
        newErrors[`apr_${index}`] = 'APR must be between 0% and 42%.';
      }

      if (debt.minimum_payment === '' || Number(debt.minimum_payment) < 0 || isNaN(Number(debt.minimum_payment))) {
        newErrors[`min_${index}`] = 'Minimum payment cannot be negative.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddDebt = () => {
    if (data.debts.length >= 8) return;
    const newDebt: DebtItem = {
      id: Date.now().toString(),
      debt_type: 'credit_card',
      balance: '',
      apr: CATEGORY_DEFAULT_APRS.credit_card.defaultApr,
      minimum_payment: '',
    };
    onUpdate({ debts: [...data.debts, newDebt] });
  };

  const handleRemoveDebt = (index: number) => {
    const updated = data.debts.filter((_, i) => i !== index);
    onUpdate({ debts: updated });
  };

  const handleDebtChange = (index: number, fields: Partial<DebtItem>) => {
    const updated = [...data.debts];
    
    // If debt_type changes and user hasn't modified APR yet, auto-set default APR for category
    if (fields.debt_type && fields.debt_type !== updated[index].debt_type) {
      const categoryInfo = CATEGORY_DEFAULT_APRS[fields.debt_type];
      fields.apr = categoryInfo.defaultApr;
    }

    updated[index] = { ...updated[index], ...fields };
    onUpdate({ debts: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-main tracking-tight">Step 4: Active Debts & Loans</h2>
            <p className="text-xs text-muted">Add up to 8 active loans or credit cards (or leave empty if debt-free).</p>
          </div>

          <button
            type="button"
            disabled={data.debts.length >= 8}
            onClick={handleAddDebt}
            className="bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Debt ({data.debts.length}/8)</span>
          </button>
        </div>

        {data.debts.length === 0 ? (
          <div className="bg-surface p-8 rounded-2xl text-center space-y-2 border border-black/5">
            <DebtIcon className="w-8 h-8 text-primary mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-main">No Debts Added</h3>
            <p className="text-xs text-muted">
              If you have active credit cards, personal, auto, or home loans, click "Add Debt" above. If you are debt-free, click Continue!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.debts.map((debt, index) => (
              <div key={debt.id} className="p-4 bg-surface rounded-xl border border-black/10 space-y-4 relative">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center space-x-1.5">
                    <DebtIcon className="w-3.5 h-3.5 text-primary" />
                    <span>Debt Item #{index + 1}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDebt(index)}
                    className="text-muted hover:text-warning p-1 rounded-lg hover:bg-warning/10 transition-colors"
                    title="Remove Debt"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Debt Type */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Category</label>
                    <select
                      value={debt.debt_type}
                      onChange={(e) => handleDebtChange(index, { debt_type: e.target.value as DebtType })}
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="personal_loan">Personal Loan</option>
                      <option value="education_loan">Education Loan</option>
                      <option value="auto_loan">Auto Loan</option>
                      <option value="home_loan">Home Loan</option>
                      <option value="other">Other Debt</option>
                    </select>
                  </div>

                  {/* Balance */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Balance (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={debt.balance}
                      onChange={(e) => handleDebtChange(index, { balance: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      placeholder="e.g. 50000"
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors[`balance_${index}`] && (
                      <p className="text-[11px] font-semibold text-warning">{errors[`balance_${index}`]}</p>
                    )}
                  </div>

                  {/* Interest Rate APR (with Tooltip helper) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-main uppercase tracking-wider block">APR (%)</label>
                      <span
                        className="text-[11px] text-primary cursor-help flex items-center space-x-1"
                        title={CATEGORY_DEFAULT_APRS[debt.debt_type].label}
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Default</span>
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={42}
                      step={0.1}
                      value={debt.apr}
                      onChange={(e) => handleDebtChange(index, { apr: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      placeholder="e.g. 14.5"
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors[`apr_${index}`] && (
                      <p className="text-[11px] font-semibold text-warning">{errors[`apr_${index}`]}</p>
                    )}
                  </div>

                  {/* Minimum Payment */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Min Payment (₹/mo)</label>
                    <input
                      type="number"
                      min={0}
                      value={debt.minimum_payment}
                      onChange={(e) => handleDebtChange(index, { minimum_payment: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      placeholder="e.g. 2500"
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {errors[`min_${index}`] && (
                      <p className="text-[11px] font-semibold text-warning">{errors[`min_${index}`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="bg-surface hover:bg-black/5 text-main font-bold py-3 px-6 rounded-xl text-sm border border-black/10 flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 3</span>
        </button>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <span>Save & Continue to Step 5</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

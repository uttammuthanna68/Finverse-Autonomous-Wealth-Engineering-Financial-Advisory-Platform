import React, { useState } from 'react';
import { Card } from '../components/Card';
import { OnboardingData } from './types';
import { ArrowRight, User, IndianRupee, Wallet, PiggyBank, AlertCircle } from 'lucide-react';

interface Step1Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onCancelEdit?: () => void;
}

export const Step1BasicInfo: React.FC<Step1Props> = ({ data, onUpdate, onNext, onCancelEdit }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.age === '' || isNaN(Number(data.age))) {
      newErrors.age = 'Please enter your age.';
    } else if (Number(data.age) < 18 || Number(data.age) > 100) {
      newErrors.age = 'Age must be between 18 and 100 years.';
    }

    if (data.monthly_salary === '' || isNaN(Number(data.monthly_salary))) {
      newErrors.monthly_salary = 'Please enter your monthly salary.';
    } else if (Number(data.monthly_salary) < 0) {
      newErrors.monthly_salary = 'Monthly salary cannot be negative.';
    }

    if (data.monthly_expenses === '' || isNaN(Number(data.monthly_expenses))) {
      newErrors.monthly_expenses = 'Please enter your monthly expenses.';
    } else if (Number(data.monthly_expenses) < 0) {
      newErrors.monthly_expenses = 'Monthly expenses cannot be negative.';
    }

    if (data.current_savings === '' || isNaN(Number(data.current_savings))) {
      newErrors.current_savings = 'Please enter your total current savings.';
    } else if (Number(data.current_savings) < 0) {
      newErrors.current_savings = 'Current savings cannot be negative.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        <div className="border-b border-black/5 pb-3">
          <h2 className="text-xl font-extrabold text-main tracking-tight">Step 1: Demographics & Cash Flow</h2>
          <p className="text-xs text-muted">Enter your basic financial figures in Indian Rupees (₹).</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Age */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-main uppercase tracking-wider block">
              Age (Years)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={18}
                max={100}
                value={data.age}
                onChange={(e) => {
                  onUpdate({ age: e.target.value === '' ? '' : parseInt(e.target.value) });
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                placeholder="e.g. 28"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {errors.age && (
              <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.age}
              </p>
            )}
          </div>

          {/* Monthly Salary */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-main uppercase tracking-wider block">
              Monthly Inflow / Salary (₹)
            </label>
            <div className="relative">
              <IndianRupee className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={0}
                step={1000}
                value={data.monthly_salary}
                onChange={(e) => {
                  onUpdate({ monthly_salary: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (errors.monthly_salary) setErrors((prev) => ({ ...prev, monthly_salary: '' }));
                }}
                placeholder="e.g. 100000"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {errors.monthly_salary && (
              <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.monthly_salary}
              </p>
            )}
          </div>

          {/* Monthly Expenses */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-main uppercase tracking-wider block">
              Monthly Outflow / Expenses (₹)
            </label>
            <div className="relative">
              <Wallet className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={0}
                step={1000}
                value={data.monthly_expenses}
                onChange={(e) => {
                  onUpdate({ monthly_expenses: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (errors.monthly_expenses) setErrors((prev) => ({ ...prev, monthly_expenses: '' }));
                }}
                placeholder="e.g. 40000"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {errors.monthly_expenses && (
              <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.monthly_expenses}
              </p>
            )}
          </div>

          {/* Current Savings */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-main uppercase tracking-wider block">
              Total Current Savings (₹)
            </label>
            <div className="relative">
              <PiggyBank className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
              <input
                type="number"
                min={0}
                step={1000}
                value={data.current_savings}
                onChange={(e) => {
                  onUpdate({ current_savings: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (errors.current_savings) setErrors((prev) => ({ ...prev, current_savings: '' }));
                }}
                placeholder="e.g. 250000"
                className="w-full bg-surface border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {errors.current_savings && (
              <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.current_savings}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap justify-between items-center gap-4 pt-2">
        {onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="bg-surface hover:bg-black/5 text-main font-bold py-3 px-6 rounded-xl text-sm border border-black/10 flex items-center space-x-2 transition-all"
          >
            <span>← Cancel & Return to Recommendations</span>
          </button>
        )}

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01] ml-auto"
        >
          <span>Save & Continue to Step 2</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { OnboardingData, GoalItem, GoalPriority } from './types';
import { ArrowRight, ArrowLeft, Target, Plus, Trash2, Calendar, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';

interface Step6Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step6Goals: React.FC<Step6Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calcEmergencyMetrics = (salary: number | '', expenses: number | '', savings: number | '') => {
    const exp = typeof expenses === 'number' ? expenses : parseFloat(expenses) || 40000;
    const sal = typeof salary === 'number' ? salary : parseFloat(salary) || 100000;
    const sav = typeof savings === 'number' ? savings : parseFloat(savings) || 0;

    const targetAmount = Math.max(1000, exp * 6);
    const surplus = Math.max(0, sal - exp);
    const deficit = Math.max(0, targetAmount - sav);

    let monthsNeeded = 1;
    if (deficit > 0) {
      monthsNeeded = surplus > 0 ? Math.ceil(deficit / surplus) : 36;
    }

    const d = new Date();
    d.setMonth(d.getMonth() + monthsNeeded);
    const targetDate = d.toISOString().split('T')[0];

    return { targetAmount, targetDate, monthsNeeded, surplus, deficit, exp };
  };

  // Sync emergency fund parameters only if emergency goal already exists
  useEffect(() => {
    if (data.goals.length > 0) {
      const metrics = calcEmergencyMetrics(data.monthly_salary, data.monthly_expenses, data.current_savings);
      const updatedGoals = data.goals.map((g) => {
        if (g.name.toLowerCase().includes('emergency') || g.id === 'default_emergency') {
          return {
            ...g,
            target_amount: g.target_amount || metrics.targetAmount,
            target_date: g.target_date || metrics.targetDate,
          };
        }
        return g;
      });
      onUpdate({ goals: updatedGoals });
    }
  }, []);

  const handleAutoApplyEmergency = (index: number) => {
    const metrics = calcEmergencyMetrics(data.monthly_salary, data.monthly_expenses, data.current_savings);
    const updated = [...data.goals];
    updated[index] = {
      ...updated[index],
      name: updated[index].name || 'Emergency Fund',
      target_amount: metrics.targetAmount,
      target_date: metrics.targetDate,
    };
    onUpdate({ goals: updated });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.goals.length === 0) {
      newErrors.general = 'Please add at least 1 financial goal (or click "+ Add Emergency Fund").';
    }

    const todayStr = new Date().toISOString().split('T')[0];

    data.goals.forEach((goal, index) => {
      if (!goal.name.trim()) {
        newErrors[`name_${index}`] = 'Goal name is required.';
      }

      if (Number(goal.target_amount) <= 0 || isNaN(Number(goal.target_amount))) {
        newErrors[`amount_${index}`] = 'Target amount must be greater than ₹0.';
      }

      if (!goal.target_date || goal.target_date <= todayStr) {
        newErrors[`date_${index}`] = 'Target date must be a future date.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGoal = (presetName: string = '', presetAmount: number | '' = '') => {
    if (data.goals.length >= 5) return;
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];

    const newGoal: GoalItem = {
      id: Date.now().toString(),
      name: presetName,
      target_amount: presetAmount,
      target_date: dateStr,
      priority: 'Medium',
    };
    onUpdate({ goals: [...data.goals, newGoal] });
  };

  const handleAddEmergencyGoal = () => {
    const metrics = calcEmergencyMetrics(data.monthly_salary, data.monthly_expenses, data.current_savings);
    handleAddGoal('Emergency Fund', metrics.targetAmount);
  };

  const handleRemoveGoal = (index: number) => {
    const updated = data.goals.filter((_, i) => i !== index);
    onUpdate({ goals: updated });
  };

  const handleGoalChange = (index: number, fields: Partial<GoalItem>) => {
    const updated = [...data.goals];
    updated[index] = { ...updated[index], ...fields };
    onUpdate({ goals: updated });
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-main tracking-tight">Step 6: Financial Goals & Target Timeline</h2>
            <p className="text-xs text-muted">Define 1 to 5 priority financial goals for your wealth strategy.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleAddEmergencyGoal}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-2 rounded-xl text-xs font-extrabold border border-primary/20 flex items-center space-x-1 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Add Emergency Fund</span>
            </button>

            <button
              type="button"
              disabled={data.goals.length >= 5}
              onClick={() => handleAddGoal()}
              className="bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal ({data.goals.length}/5)</span>
            </button>
          </div>
        </div>

        {errors.general && (
          <p className="text-xs font-semibold text-warning flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {errors.general}
          </p>
        )}

        {data.goals.length === 0 ? (
          <div className="bg-surface p-8 rounded-2xl text-center space-y-3 border border-black/5">
            <Target className="w-8 h-8 text-primary mx-auto opacity-70" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-main">No Goals Added Yet</h3>
              <p className="text-xs text-muted">
                Add an Emergency Fund (6× monthly expenses) or click "Add Goal" to set custom financial targets.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-1">
              <button
                type="button"
                onClick={handleAddEmergencyGoal}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Add Emergency Fund</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddGoal()}
                className="bg-surface hover:bg-black/5 border border-black/10 text-main font-bold py-2 px-5 rounded-xl text-xs"
              >
                + Add Custom Goal
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.goals.map((goal, index) => {
              const isEmergency = goal.name.toLowerCase().includes('emergency') || goal.id === 'default_emergency';
              const metrics = isEmergency ? calcEmergencyMetrics(data.monthly_salary, data.monthly_expenses, data.current_savings) : null;

              return (
                <div key={goal.id} className="p-4 bg-surface rounded-xl border border-black/10 space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-black/5 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center space-x-1.5">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        <span>Goal Item #{index + 1}</span>
                      </span>

                      {isEmergency && (
                        <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-primary/20 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>6× Expense Rule</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isEmergency && (
                        <button
                          type="button"
                          onClick={() => handleAutoApplyEmergency(index)}
                          className="text-primary hover:bg-primary/10 px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                          title="Re-apply 6x Expenses & Surplus Timeline Formula"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Auto-Recalculate</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(index)}
                        className="text-muted hover:text-warning p-1 rounded-lg hover:bg-warning/10 transition-colors"
                        title="Remove Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Explanatory Banner for Emergency Fund */}
                  {isEmergency && metrics && (
                    <div className="bg-card-bg p-3 rounded-xl border border-primary/20 text-xs space-y-1">
                      <div className="font-extrabold text-main flex items-center justify-between">
                        <span>Formula Breakdown: 6 × Monthly Expenses</span>
                        <span className="font-mono text-primary">Target: ₹{metrics.targetAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[11px] text-muted font-medium">
                        Based on monthly expenses of <strong>₹{(metrics.exp).toLocaleString('en-IN')}</strong> and monthly surplus of <strong>₹{(metrics.surplus).toLocaleString('en-IN')}</strong>, funding the remaining deficit (<strong>₹{metrics.deficit.toLocaleString('en-IN')}</strong>) takes <strong>{metrics.monthsNeeded} month{metrics.monthsNeeded === 1 ? '' : 's'}</strong> (Target Date: <strong>{metrics.targetDate}</strong>).
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {/* Goal Name */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-bold text-main uppercase tracking-wider block">Goal Name</label>
                      <input
                        type="text"
                        value={goal.name}
                        onChange={(e) => handleGoalChange(index, { name: e.target.value })}
                        placeholder="e.g. Emergency Fund"
                        className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      {errors[`name_${index}`] && (
                        <p className="text-[11px] font-semibold text-warning">{errors[`name_${index}`]}</p>
                      )}
                    </div>

                    {/* Target Amount */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-main uppercase tracking-wider block">Target Amount (₹)</label>
                      <input
                        type="number"
                        min={1000}
                        value={goal.target_amount}
                        onChange={(e) => handleGoalChange(index, { target_amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        placeholder="e.g. 240000"
                        className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      {errors[`amount_${index}`] && (
                        <p className="text-[11px] font-semibold text-warning">{errors[`amount_${index}`]}</p>
                      )}
                    </div>

                  {/* Target Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Target Date</label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-muted absolute left-2.5 top-2.5" />
                      <input
                        type="date"
                        value={goal.target_date}
                        onChange={(e) => handleGoalChange(index, { target_date: e.target.value })}
                        className="w-full bg-card-bg border border-black/10 rounded-xl pl-8 pr-2 py-2 text-xs font-mono text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    {errors[`date_${index}`] && (
                      <p className="text-[11px] font-semibold text-warning">{errors[`date_${index}`]}</p>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Priority</label>
                    <select
                      value={goal.priority}
                      onChange={(e) => handleGoalChange(index, { priority: e.target.value as GoalPriority })}
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
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
          <span>Back to Step 5</span>
        </button>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <span>Complete & Generate Recommendations</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { OnboardingData, GoalItem, GoalPriority } from './types';
import { ArrowRight, ArrowLeft, Target, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';

interface Step6Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step6Goals: React.FC<Step6Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const calcEmergencyTarget = (expenses: number | '') => {
    const exp = typeof expenses === 'number' ? expenses : parseFloat(expenses) || 40000;
    return Math.max(10000, exp * 6);
  };

  // Automatically enforce Emergency Reserve Shield as a permanent, non-deletable default goal
  useEffect(() => {
    const emergencyTarget = calcEmergencyTarget(data.monthly_expenses);
    const existingEmergencyIndex = data.goals.findIndex(
      (g) => g.id === 'default_emergency' || g.name.toLowerCase().includes('emergency')
    );

    if (existingEmergencyIndex === -1) {
      // Auto-insert Emergency Reserve Shield as #1 mandatory goal
      const emergencyGoal: GoalItem = {
        id: 'default_emergency',
        name: 'Emergency Reserve Shield (6x Expenses)',
        target_amount: emergencyTarget,
        priority: 'High',
        is_mandatory: true,
        current_amount: typeof data.current_savings === 'number' ? data.current_savings : parseFloat(data.current_savings) || 0,
        category: 'Emergency Reserve',
      };
      onUpdate({ goals: [emergencyGoal, ...data.goals] });
    } else {
      // Sync target amount if monthly expenses changed
      const updatedGoals = [...data.goals];
      updatedGoals[existingEmergencyIndex] = {
        ...updatedGoals[existingEmergencyIndex],
        target_amount: emergencyTarget,
        is_mandatory: true,
      };
      onUpdate({ goals: updatedGoals });
    }
  }, [data.monthly_expenses]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    data.goals.forEach((goal, index) => {
      if (!goal.name.trim()) {
        newErrors[`name_${index}`] = 'Goal name is required.';
      }

      if (goal.target_amount === '' || Number(goal.target_amount) <= 0 || isNaN(Number(goal.target_amount))) {
        newErrors[`amount_${index}`] = 'Target amount must be greater than ₹0.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGoal = (presetName: string = '', presetAmount: number | '' = '') => {
    if (data.goals.length >= 6) return;

    const newGoal: GoalItem = {
      id: Date.now().toString(),
      name: presetName,
      target_amount: presetAmount,
      priority: 'Medium',
      is_mandatory: false,
      current_amount: 0,
    };
    onUpdate({ goals: [...data.goals, newGoal] });
  };

  const handleRemoveGoal = (index: number) => {
    const goalToRemove = data.goals[index];
    if (goalToRemove.is_mandatory || goalToRemove.id === 'default_emergency') {
      return; // Cannot remove mandatory emergency reserve goal
    }
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
            <h2 className="text-xl font-extrabold text-main tracking-tight">Step 6: Financial Goals & Target Amounts</h2>
            <p className="text-xs text-muted">
              Emergency Shield is automatically added. Add custom goals (Car, House, Education, Retirement) with target amounts.
            </p>
          </div>

          <button
            type="button"
            disabled={data.goals.length >= 6}
            onClick={() => handleAddGoal()}
            className="bg-primary hover:bg-primary/90 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Goal ({data.goals.length}/6)</span>
          </button>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {data.goals.map((goal, index) => {
            const isMandatory = goal.is_mandatory || goal.id === 'default_emergency' || goal.name.toLowerCase().includes('emergency');
            const expVal = typeof data.monthly_expenses === 'number' ? data.monthly_expenses : parseFloat(data.monthly_expenses) || 40000;

            return (
              <div
                key={goal.id}
                className={`p-4 rounded-xl border space-y-4 relative ${
                  isMandatory
                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-surface border-black/10'
                }`}
              >
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-main uppercase tracking-wider flex items-center space-x-1.5">
                      {isMandatory ? <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Target className="w-4 h-4 text-primary" />}
                      <span>{isMandatory ? 'Mandatory Goal #1' : `Goal Item #${index + 1}`}</span>
                    </span>

                    {isMandatory && (
                      <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/40 flex items-center space-x-1">
                        <Lock className="w-3 h-3" />
                        <span>Permanent Necessity (6x Expenses)</span>
                      </span>
                    )}
                  </div>

                  {!isMandatory && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(index)}
                      className="text-muted hover:text-warning p-1 rounded-lg hover:bg-warning/10 transition-colors"
                      title="Remove Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Mandatory Emergency Banner */}
                {isMandatory && (
                  <div className="bg-card-bg p-3 rounded-xl border border-emerald-500/30 text-xs space-y-1">
                    <div className="font-extrabold text-main flex items-center justify-between">
                      <span>Emergency Buffer Formula: 6 × ₹{expVal.toLocaleString('en-IN')}/mo</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">
                        Target: ₹{(expVal * 6).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-medium">
                      This goal is automatically included as an absolute financial necessity before funding discretionary lifestyle goals.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Goal Name */}
                  <div className="space-y-1 sm:col-span-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Goal Name</label>
                    <input
                      type="text"
                      disabled={isMandatory}
                      value={goal.name}
                      onChange={(e) => handleGoalChange(index, { name: e.target.value })}
                      placeholder="e.g. Buy a Car, Higher Education"
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-80"
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
                      disabled={isMandatory}
                      value={goal.target_amount}
                      onChange={(e) => handleGoalChange(index, { target_amount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                      placeholder="e.g. 500000"
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-80"
                    />
                    {errors[`amount_${index}`] && (
                      <p className="text-[11px] font-semibold text-warning">{errors[`amount_${index}`]}</p>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-main uppercase tracking-wider block">Priority</label>
                    <select
                      disabled={isMandatory}
                      value={goal.priority}
                      onChange={(e) => handleGoalChange(index, { priority: e.target.value as GoalPriority })}
                      className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-80"
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
          <span>Complete & Generate Strategy</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

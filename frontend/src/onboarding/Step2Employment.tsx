import React, { useState } from 'react';
import { Card } from '../components/Card';
import { OnboardingData, EmploymentType } from './types';
import { ArrowRight, ArrowLeft, Briefcase, Users, AlertCircle } from 'lucide-react';

interface Step2Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step2Employment: React.FC<Step2Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (Number(data.dependents) < 0 || isNaN(Number(data.dependents))) {
      newErrors.dependents = 'Number of dependents cannot be negative.';
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

  const employmentOptions: { value: EmploymentType; label: string; description: string }[] = [
    {
      value: 'salaried-govt',
      label: 'Salaried — Government',
      description: 'High income stability & pension/benefit structure.',
    },
    {
      value: 'salaried-private',
      label: 'Salaried — Private Sector',
      description: 'Standard corporate or startup employment.',
    },
    {
      value: 'self-employed',
      label: 'Self-Employed / Freelancer',
      description: 'Independent professional with variable monthly income.',
    },
    {
      value: 'business-owner',
      label: 'Business Owner / Entrepreneur',
      description: 'Capital-holding founder or business proprietor.',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="border-b border-black/5 pb-3">
          <h2 className="text-xl font-extrabold text-main tracking-tight">Step 2: Income Stability & Dependents</h2>
          <p className="text-xs text-muted">Employment sector determines stability factors for reserve fund recommendations.</p>
        </div>

        {/* Employment Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-main uppercase tracking-wider block flex items-center space-x-1.5">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>Employment Sector</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {employmentOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => onUpdate({ employment_type: opt.value })}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  data.employment_type === opt.value
                    ? 'bg-primary/10 border-primary shadow-sm'
                    : 'bg-surface border-black/10 hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-main">{opt.label}</span>
                  <input
                    type="radio"
                    name="employment_type"
                    checked={data.employment_type === opt.value}
                    onChange={() => onUpdate({ employment_type: opt.value })}
                    className="accent-primary w-4 h-4"
                  />
                </div>
                <p className="text-xs text-muted mt-1">{opt.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dependents Count */}
        <div className="space-y-1 pt-2">
          <label className="text-xs font-bold text-main uppercase tracking-wider block flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-primary" />
            <span>Financial Dependents Count</span>
          </label>
          <input
            type="number"
            min={0}
            max={20}
            value={data.dependents}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0);
              onUpdate({ dependents: val });
              if (errors.dependents) setErrors((prev) => ({ ...prev, dependents: '' }));
            }}
            placeholder="e.g. 0"
            className="w-full max-w-xs bg-surface border border-black/10 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted">Number of family members relying on your income (e.g. children, elderly parents).</p>
          {errors.dependents && (
            <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.dependents}
            </p>
          )}
        </div>
      </Card>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="bg-surface hover:bg-black/5 text-main font-bold py-3 px-6 rounded-xl text-sm border border-black/10 flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 1</span>
        </button>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <span>Save & Continue to Step 3</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

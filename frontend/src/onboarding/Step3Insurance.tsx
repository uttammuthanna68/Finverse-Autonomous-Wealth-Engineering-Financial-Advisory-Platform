import React, { useState } from 'react';
import { Card } from '../components/Card';
import { OnboardingData } from './types';
import { ArrowRight, ArrowLeft, Shield, AlertTriangle, AlertCircle } from 'lucide-react';

interface Step3Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step3Insurance: React.FC<Step3Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (data.health_insurance && (data.health_insurance_cover === '' || Number(data.health_insurance_cover) < 0)) {
      newErrors.health_insurance_cover = 'Please enter a valid health cover amount.';
    }

    if (data.term_life_insurance && (data.term_life_insurance_cover === '' || Number(data.term_life_insurance_cover) < 0)) {
      newErrors.term_life_insurance_cover = 'Please enter a valid term life cover amount.';
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

  const showDependentsTermLifeWarning = Number(data.dependents) > 0 && !data.term_life_insurance;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="border-b border-black/5 pb-3">
          <h2 className="text-xl font-extrabold text-main tracking-tight">Step 3: Insurance Coverages</h2>
          <p className="text-xs text-muted">Protecting your health and dependents against catastrophic risk.</p>
        </div>

        {/* Health Insurance */}
        <div className="space-y-4 bg-surface p-4 rounded-xl border border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-main flex items-center space-x-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Health Insurance Policy</span>
              </div>
              <p className="text-xs text-muted">Do you hold active health / medical insurance?</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-main">
                <input
                  type="radio"
                  name="health_insurance"
                  checked={data.health_insurance}
                  onChange={() => onUpdate({ health_insurance: true })}
                  className="accent-primary w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-main">
                <input
                  type="radio"
                  name="health_insurance"
                  checked={!data.health_insurance}
                  onChange={() => onUpdate({ health_insurance: false, health_insurance_cover: '' })}
                  className="accent-primary w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {data.health_insurance && (
            <div className="pt-2 space-y-1 animate-fadeIn">
              <label className="text-xs font-bold text-main uppercase tracking-wider block">
                Total Health Cover Sum Insured (₹)
              </label>
              <input
                type="number"
                min={0}
                step={50000}
                value={data.health_insurance_cover}
                onChange={(e) => {
                  onUpdate({ health_insurance_cover: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (errors.health_insurance_cover) setErrors((prev) => ({ ...prev, health_insurance_cover: '' }));
                }}
                placeholder="500000 (e.g. ₹5 Lakhs)"
                className="w-full bg-card-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.health_insurance_cover && (
                <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.health_insurance_cover}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Term Life Insurance */}
        <div className="space-y-4 bg-surface p-4 rounded-xl border border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-main flex items-center space-x-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Term Life Insurance Policy</span>
              </div>
              <p className="text-xs text-muted">Do you hold pure term life insurance?</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-main">
                <input
                  type="radio"
                  name="term_life_insurance"
                  checked={data.term_life_insurance}
                  onChange={() => onUpdate({ term_life_insurance: true })}
                  className="accent-primary w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-main">
                <input
                  type="radio"
                  name="term_life_insurance"
                  checked={!data.term_life_insurance}
                  onChange={() => onUpdate({ term_life_insurance: false, term_life_insurance_cover: '' })}
                  className="accent-primary w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {data.term_life_insurance && (
            <div className="pt-2 space-y-1 animate-fadeIn">
              <label className="text-xs font-bold text-main uppercase tracking-wider block">
                Total Term Life Cover Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                step={500000}
                value={data.term_life_insurance_cover}
                onChange={(e) => {
                  onUpdate({ term_life_insurance_cover: e.target.value === '' ? '' : parseFloat(e.target.value) });
                  if (errors.term_life_insurance_cover) setErrors((prev) => ({ ...prev, term_life_insurance_cover: '' }));
                }}
                placeholder="10000000 (e.g. ₹1 Crore)"
                className="w-full bg-card-bg border border-black/10 rounded-xl px-4 py-2.5 text-sm font-mono tabular-nums text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {errors.term_life_insurance_cover && (
                <p className="text-xs font-semibold text-warning flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.term_life_insurance_cover}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Immediate Informative Callout for Dependents > 0 & Term Life = No */}
        {showDependentsTermLifeWarning && (
          <div className="flex items-start space-x-3 bg-warning/10 border border-warning/20 text-warning p-4 rounded-xl text-xs font-semibold animate-fadeIn">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">Important Coverage Notice</div>
              <p className="text-xs leading-relaxed text-main/90">
                You specified <span className="font-bold">{data.dependents} financial dependent(s)</span> in Step 2, but currently do not have term life insurance.
                A term life policy is strongly recommended to safeguard your family's future income. You may continue onboarding — this notice will not block your progress.
              </p>
            </div>
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
          <span>Back to Step 2</span>
        </button>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <span>Save & Continue to Step 4</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

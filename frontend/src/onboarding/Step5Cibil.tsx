import React from 'react';
import { Card } from '../components/Card';
import { OnboardingData, CibilBand } from './types';
import { ArrowRight, ArrowLeft, Award, Info } from 'lucide-react';

interface Step5Props {
  data: OnboardingData;
  onUpdate: (fields: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const Step5Cibil: React.FC<Step5Props> = ({ data, onUpdate, onNext, onPrev }) => {
  const bands: { value: CibilBand; title: string; range: string; description: string; color: string }[] = [
    {
      value: 'No CIBIL (New to Credit)',
      title: 'No Credit Score',
      range: 'N/A / New',
      description: 'First-time earner or no prior credit accounts/loans.',
      color: 'border-blue-400/30 hover:border-blue-400 text-blue-600',
    },
    {
      value: 'Poor (<650)',
      title: 'Poor',
      range: '< 650',
      description: 'Recent credit defaults or high utilization ratio.',
      color: 'border-warning/30 hover:border-warning text-warning',
    },
    {
      value: 'Fair (650-699)',
      title: 'Fair',
      range: '650 – 699',
      description: 'Moderate credit history; occasional late payments.',
      color: 'border-amber-400/30 hover:border-amber-400 text-amber-600',
    },
    {
      value: 'Good (700-749)',
      title: 'Good',
      range: '700 – 749',
      description: 'Consistently responsible credit behavior & low risk.',
      color: 'border-primary/30 hover:border-primary text-primary',
    },
    {
      value: 'Excellent (750+)',
      title: 'Excellent',
      range: '750+',
      description: 'Flawless payment history & low credit utilization.',
      color: 'border-success/30 hover:border-success text-success',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6 space-y-6 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="border-b border-black/5 pb-3">
          <h2 className="text-xl font-extrabold text-main tracking-tight">Step 5: Credit Score Range (CIBIL)</h2>
          <p className="text-xs text-muted">Select your estimated or self-reported CIBIL credit score band.</p>
        </div>

        {/* CIBIL Band Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bands.map((b) => (
            <div
              key={b.value}
              onClick={() => onUpdate({ cibil_band: b.value })}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                data.cibil_band === b.value
                  ? 'bg-card-bg border-primary shadow-md ring-2 ring-primary/20'
                  : 'bg-surface border-black/10 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-base font-extrabold text-main">{b.title}</span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-surface border border-black/5 text-main">
                  {b.range}
                </span>
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>

        {/* Self-Reported Disclosure Notice */}
        <div className="flex items-start space-x-3 bg-primary/5 border border-primary/20 text-main p-4 rounded-xl text-xs">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-xs uppercase tracking-wider text-primary block">Disclosure Notice</span>
            <p className="text-xs text-muted leading-relaxed">
              This self-reported score band is used for preliminary estimation purposes only. Hard credit bureau pulls are never initiated without explicit prior authorization.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="bg-surface hover:bg-black/5 text-main font-bold py-3 px-6 rounded-xl text-sm border border-black/10 flex items-center space-x-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 4</span>
        </button>

        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-xl text-sm shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01]"
        >
          <span>Save & Continue to Step 6</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};

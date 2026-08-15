import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { ShellyMascot } from './ShellyMascot';
import { TrendingUp, IndianRupee, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { fetchWithAuth } from '../api/config';

interface AnnualStepUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSalary: number;
  currentExpenses: number;
  currentSavings: number;
  currentAge: number;
  currentSip: number;
  onSaved?: () => void;
}

export const AnnualStepUpModal: React.FC<AnnualStepUpModalProps> = ({
  isOpen,
  onClose,
  currentSalary,
  currentExpenses,
  currentSavings,
  currentAge,
  currentSip,
  onSaved,
}) => {
  const [salary, setSalary] = useState<number | ''>(currentSalary);
  const [stepUpPercent, setStepUpPercent] = useState<number>(10);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setSalary(currentSalary);
    const savedRate = localStorage.getItem('finverse_annual_stepup_rate');
    if (savedRate) {
      setStepUpPercent(parseFloat(savedRate) || 10);
    }
  }, [currentSalary, isOpen]);

  if (!isOpen) return null;

  const numSalary = salary === '' ? 0 : salary;
  const numExpenses = currentExpenses;
  const newSurplus = Math.max(0, numSalary - numExpenses);
  const estYear1Sip = currentSip > 0 ? currentSip : Math.round(newSurplus * 0.4); // current or approx portfolio SIP after buffer
  const estYear2Sip = Math.round(estYear1Sip * (1 + stepUpPercent / 100));
  const estYear5Sip = Math.round(estYear1Sip * Math.pow(1 + stepUpPercent / 100, 4));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save annual step-up rate to local storage
      localStorage.setItem('finverse_annual_stepup_rate', stepUpPercent.toString());

      // 2. Update profile parameters if salary changed
      if (numSalary !== currentSalary) {
        await fetchWithAuth('/api/profile/me', {
          method: 'PUT',
          body: JSON.stringify({
            salary: numSalary,
            expenses: currentExpenses,
            savings: currentSavings,
            age: currentAge,
          }),
        });
      }

      setSavedSuccess(true);
      window.dispatchEvent(new CustomEvent('finverse_profile_updated'));

      if (onSaved) onSaved();

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update annual step-up:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="max-w-xl w-full p-6 sm:p-8 bg-card-bg shadow-2xl rounded-card-lg border border-black/10 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-main rounded-xl hover:bg-surface transition-colors"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Prof. Shelly */}
        <div className="flex items-center space-x-4 border-b border-black/5 pb-4">
          <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-16 h-16 flex-shrink-0" />
          <div>
            <div className="inline-flex items-center space-x-1 text-primary text-[10px] font-black uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Annual Salary & Compounding Review</span>
            </div>
            <h2 className="text-xl font-extrabold text-main tracking-tight">Step-Up Investment Review</h2>
            <p className="text-xs text-muted">
              Adjust your salary increment and set annual step-up compounding targets.
            </p>
          </div>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-main">Salary & Step-Up Preferences Saved!</h3>
            <p className="text-xs text-muted">All investment graphs and engines updated with your new annual compounding rate.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Salary Review Field */}
            <div className="space-y-1.5 bg-surface p-4 rounded-2xl border border-black/5">
              <label className="font-extrabold text-main uppercase text-[10px] tracking-wider block">
                Current Monthly Salary (₹)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100000"
                  className="w-full bg-card-bg border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-main focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <p className="text-[11px] text-muted">Did you get a raise or promotion this year? Enter your updated monthly salary.</p>
            </div>

            {/* Annual Step-Up Slider */}
            <div className="space-y-2 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20">
              <div className="flex justify-between items-center font-bold text-main">
                <span className="flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Annual Step-Up Increment Rate (%)</span>
                </span>
                <span className="font-mono text-emerald-700 font-black text-sm">{stepUpPercent}% / Year</span>
              </div>
              
              <input
                type="range"
                min={0}
                max={25}
                step={1}
                value={stepUpPercent}
                onChange={(e) => setStepUpPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-muted font-mono font-bold">
                <span>0% (Flat SIP)</span>
                <span>10% (Recommended)</span>
                <span>25% (Aggressive)</span>
              </div>
            </div>

            {/* Dynamic Step-Up Preview Card */}
            <div className="bg-card-bg p-4 rounded-2xl border border-black/10 space-y-2 text-xs">
              <span className="font-extrabold text-main block uppercase text-[10px] tracking-wider text-muted">
                Compounding Step-Up Preview ({stepUpPercent}% Increment)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                  <span className="text-[10px] text-muted block font-sans">Year 1 SIP</span>
                  <span className="font-bold text-main text-xs">₹{estYear1Sip.toLocaleString('en-IN')}/mo</span>
                </div>
                <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                  <span className="text-[10px] text-muted block font-sans">Year 2 SIP (+{stepUpPercent}%)</span>
                  <span className="font-bold text-emerald-700 text-xs">₹{estYear2Sip.toLocaleString('en-IN')}/mo</span>
                </div>
                <div className="bg-surface p-2.5 rounded-xl border border-black/5">
                  <span className="text-[10px] text-muted block font-sans">Year 5 SIP</span>
                  <span className="font-bold text-emerald-700 text-xs">₹{estYear5Sip.toLocaleString('en-IN')}/mo</span>
                </div>
              </div>
              <p className="text-[11px] text-muted text-center pt-1 italic">
                🐢 "Increasing your SIP by {stepUpPercent}% each year boosts 30-year wealth by over 40%!"
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{isSaving ? 'Updating Engines...' : 'Save & Update Compounding Graphs →'}</span>
            </button>
          </form>
        )}
      </Card>
    </div>
  );
};

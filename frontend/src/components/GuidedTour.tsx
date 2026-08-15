import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';

interface Step {
  title: string;
  subtitle: string;
  content: string;
}

const TOUR_STEPS: Step[] = [
  {
    title: 'Welcome to Finverse 🐼',
    subtitle: 'Step 1 of 7: What this app does in one sentence',
    content: 'Finverse turns your personal income, expenses, and debts into one clear, automated monthly action plan so you never have to guess what to pay or invest next.',
  },
  {
    title: 'Your Financial Profile 📊',
    subtitle: 'Step 2 of 7: Profile Basics',
    content: 'We combine your salary, monthly expenses, emergency savings, and dependents into a single real-time profile. Everything is encrypted at rest using application-level Fernet keys.',
  },
  {
    title: 'Debt Classification 💳',
    subtitle: 'Step 3 of 7: Toxic vs. Manageable Debt',
    content: 'Toxic debt refers to high-interest loans with APR above 24% (like credit cards), which must be eliminated immediately before investing. Manageable debt (like home loans) can be paid via normal EMIs.',
  },
  {
    title: 'Priority Action Engine 🎯',
    subtitle: 'Step 4 of 7: Numbered & Ranked Monthly Plan',
    content: 'Our engine computes your exact ₹ surplus and generates ONE ranked list: minimum dues first, toxic debt avalanche second, emergency fund third, and investments fourth.',
  },
  {
    title: 'Continuous Risk Score ⚖️',
    subtitle: 'Step 5 of 7: Objective Risk Capacity',
    content: 'Your 0–100 risk score dynamically adjusts based on age, income stability, emergency buffer, debt ratio, and short-term credit card utilization.',
  },
  {
    title: 'Multi-Lens Portfolios 📈',
    subtitle: 'Step 6 of 7: Safe, Medium & Risky Lenses',
    content: 'Explore three asset allocation lenses showing exact ₹ monthly amounts per category (Large Cap, Debt, Gold). We highlight your calculated match while letting you explore all three for literacy.',
  },
  {
    title: 'Wealth Calculators & Goals 🚀',
    subtitle: 'Step 7 of 7: Compounding & Inflation Target',
    content: 'Use our month-by-month compounding calculators to forecast SIPs or solve for reverse goals. Reverse goals automatically inflate target amounts into future requirements.',
  },
];

interface GuidedTourProps {
  userId?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ userId = 1, isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`has_seen_tour_user_${userId}`, 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-card-bg border-2 border-primary/40 rounded-card shadow-2xl p-6 space-y-6">
        
        {/* Close / Skip button */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 text-muted hover:text-main p-1.5 rounded-xl hover:bg-black/5 transition-colors"
          title="Skip Guided Tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Panda Avatar & Step Header */}
        <div className="flex items-center space-x-3 border-b border-black/5 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
            🐼
          </div>
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider block">
              {step.subtitle}
            </span>
            <h2 className="text-xl font-black text-main">{step.title}</h2>
          </div>
        </div>

        {/* Speech Bubble Container */}
        <div className="relative bg-surface p-5 rounded-2xl border border-black/10 text-xs text-main font-semibold leading-relaxed space-y-2">
          <p>{step.content}</p>
        </div>

        {/* Progress Bar & Step Dots */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1.5">
            {TOUR_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-primary' : 'w-2 bg-black/10'
                }`}
              />
            ))}
          </div>

          <span className="text-xs font-mono font-bold text-muted">
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-black/5 pt-4">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted hover:text-main disabled:opacity-30 flex items-center space-x-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={handleComplete}
            className="text-xs font-bold text-muted hover:text-warning px-3 py-2 transition-colors"
          >
            Skip Tour
          </button>

          <button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all hover:scale-[1.02]"
          >
            <span>{currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next Step'}</span>
            {currentStep === TOUR_STEPS.length - 1 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

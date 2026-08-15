import React, { useState } from 'react';
import { ShellyMascot, ShellyPose } from './ShellyMascot';
import { Card } from './Card';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface ShellyTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

interface TourStep {
  pose: ShellyPose;
  title: string;
  pun: string;
  description: string;
  targetPath?: string;
  badge?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    pose: 'happy',
    title: 'Welcome to Finverse!',
    pun: 'Slow and steady wins the wealth race! 🐢',
    description: "Hey there! I'm Prof. Shelly, your wealthy tortoise advisor. I've been compounding wealth since the Jurassic era, and I'm here to make sure your financial future is rock-solid!",
    badge: 'Step 1 of 5 • Welcome',
    targetPath: '/dashboard',
  },
  {
    pose: 'thinking',
    title: 'Financial Onboarding & Command Center',
    pun: "No junk data here—we don't cut corners!",
    description: 'First stop: Onboarding! Input your actual salary, expenditure, and savings. Everything in your dashboard auto-calculates dynamically based on your real numbers.',
    badge: 'Step 2 of 5 • Profile',
    targetPath: '/onboarding',
  },
  {
    pose: 'panicked',
    title: 'Integrated Debt Waterfall Engine',
    pun: 'High credit card dues are scarier than a T-Rex!',
    description: 'Got credit card dues >24% APR? That is toxic debt! My waterfall engine prioritizes clearing toxic dues first before you risk a single Rupee in the market.',
    badge: 'Step 3 of 5 • Debt Payoff',
    targetPath: '/debt',
  },
  {
    pose: 'confident',
    title: 'Indian Credit Cards & Rewards Database',
    pun: 'Maximizing cashbacks without sticking your neck out!',
    description: 'Search top Indian credit cards (HDFC Infinia, Regalia Gold, ICICI Amazon Pay, Axis Cashback) and optimize every spend for maximum rewards.',
    badge: 'Step 4 of 5 • Rewards',
    targetPath: '/creditcard/rewards',
  },
  {
    pose: 'explaining',
    title: 'Unified Calculators & 6-Asset Portfolios',
    pun: '8th wonder of the world: Compounding magic!',
    description: 'Simulate SIPs, SWPs, and explore personalized 6-asset Indian portfolios (Nifty 50, Flexi Cap, Small Cap, FDs, Debt, Gold) with inflation-adjusted projections!',
    badge: 'Step 5 of 5 • Compounding',
    targetPath: '/portfolios',
  },
];

export const ShellyTourModal: React.FC<ShellyTourModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (onNavigate && TOUR_STEPS[nextIndex].targetPath) {
        onNavigate(TOUR_STEPS[nextIndex].targetPath!);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      if (onNavigate && TOUR_STEPS[prevIndex].targetPath) {
        onNavigate(TOUR_STEPS[prevIndex].targetPath!);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <Card className="max-w-lg w-full p-6 bg-card-bg shadow-2xl rounded-3xl border border-black/10 relative space-y-5 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-main p-1.5 rounded-full hover:bg-black/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Badge */}
        <div className="inline-flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentStep.badge}</span>
        </div>

        {/* Main Content with Shelly Mascot */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
          <ShellyMascot pose={currentStep.pose} size="lg" animateFloat={true} className="flex-shrink-0" />

          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-black text-main leading-snug">{currentStep.title}</h2>
            <div className="text-xs font-mono font-bold text-primary italic bg-primary/5 p-2 rounded-xl border border-primary/20">
              "{currentStep.pun}"
            </div>
            <p className="text-xs text-muted font-medium leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-2 border-t border-black/5">
          <button
            onClick={onClose}
            className="text-xs font-bold text-muted hover:text-main px-3 py-2"
          >
            Skip Tour
          </button>

          <div className="flex items-center space-x-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl border border-black/10 text-xs font-bold text-main hover:bg-black/5 flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-sm"
            >
              <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              {currentStepIndex < TOUR_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

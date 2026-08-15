import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

const SCREEN_TIPS: Record<string, string> = {
  '/dashboard': 'Dashboard Tip: Your financial command center summarizing top priorities, emergency fund progress, debt split, goals, risk score, and insurance alerts.',
  '/priority': 'Priority Tip: This is your single ranked monthly action list. Pay minimum dues first, avalanche toxic debt (>24% APR) second, fill emergency funds third, and invest fourth.',
  '/debt': 'Debt Tip: Toxic debt (>24% APR) shrinks your emergency fund target to 1× monthly expenses until cleared. Prepaying toxic debt yields higher guaranteed savings than investing.',
  '/portfolios': 'Portfolios Tip: Explore Safe, Medium, and Risky asset allocation lenses. All recommendations cap categories at max 4 with zero specific AMC scheme names.',
  '/calculator': 'Calculators Tip: Iterative month-by-month compounding SIP forecasts and reverse-goal planning. Reverse goals automatically inflate target amounts over time.',
  '/glossary': 'Glossary Tip: Search plain-language definitions for 24+ financial terms. Click any dotted-underline term across the app for an instant popover.',
  '/onboarding': 'Onboarding Tip: Complete these steps to configure your age, income, expenses, debts, and insurance for exact personalized engine calculations.',
  '/profile': 'Profile Tip: View account credentials, application-level encrypted fields status, security protocols, and re-trigger the guided tour anytime.',
};

export const HelpTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPath = window.location.pathname;
  const tip = SCREEN_TIPS[currentPath] || 'Panda Tip: Finverse turns your personal income and debt into one automated monthly action plan.';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      
      {/* Contextual Help Popover Card */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-72 sm:w-80 bg-card-bg border-2 border-primary/40 p-4 rounded-2xl shadow-2xl animate-fadeIn text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-black/5 pb-2">
            <div className="flex items-center space-x-2">
              <span className="text-base">🐼</span>
              <span className="font-extrabold text-main uppercase tracking-wider text-[11px]">Panda Contextual Tip</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-main p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-main font-semibold leading-relaxed text-[11px]">
            {tip}
          </p>

          <div className="text-[10px] text-muted text-right italic pt-0.5">
            Tap button again to close
          </div>
        </div>
      )}

      {/* Still Floating Button (Zero Idle Animation) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl flex items-center justify-center font-bold border-2 border-white transition-transform active:scale-95"
        title="Open Panda Contextual Help"
      >
        <span className="text-xl">🐼</span>
      </button>

    </div>
  );
};

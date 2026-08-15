import React, { useState, useRef, useEffect } from 'react';
import { ShellyMascot } from './ShellyMascot';

interface GlossaryTermProps {
  term: string;
  children?: React.ReactNode;
}

const GLOSSARY_DB: Record<string, { title: string; definition: string; pun: string }> = {
  'emergency fund': {
    title: 'Emergency Fund (6x Rule)',
    definition: 'A liquid cash buffer equal to 3–6 months of essential living expenses, kept safe in penalty-free Flexi-FDs and liquid funds.',
    pun: 'My thick shell keeps me safe from predators; an emergency fund keeps your finances safe from surprise expenses!',
  },
  'toxic debt': {
    title: 'Toxic Debt (>24% APR)',
    definition: 'High-interest credit card balance or instant loans exceeding 24% annual interest rate (APR).',
    pun: '36% APR is scarier than a hungry T-Rex! Clear this immediately before your surplus turns to dust.',
  },
  'cibil score': {
    title: 'CIBIL Score (300-900)',
    definition: 'A 3-digit credit score evaluating your credit trustworthiness based on repayment history and credit utilization.',
    pun: 'Slow, on-time payments build a 750+ score. One missed credit card payment can drop your shell 50 points!',
  },
  'sip': {
    title: 'SIP (Systematic Investment Plan)',
    definition: 'Investing a fixed amount every month into mutual funds to benefit from rupee cost averaging and compounding.',
    pun: 'Like a tortoise taking one steady step every month—compounding turns small SIPs into massive fortunes!',
  },
  'step-up sip': {
    title: 'Step-Up SIP',
    definition: 'Increasing your monthly SIP contribution by a set percentage (e.g., +10% yearly) as your income grows.',
    pun: 'Step up your speed as your legs get stronger! A 10% annual step-up doubles your 15-year wealth corpus.',
  },
  'swp': {
    title: 'SWP (Systematic Withdrawal Plan)',
    definition: 'Withdrawing a fixed amount every month from your mutual fund corpus while the remaining capital compounds.',
    pun: 'Harvest income slowly every month without cracking your underlying principal shell!',
  },
  'lumpsum': {
    title: 'Lumpsum Investment',
    definition: 'Investing a bulk one-time amount upfront into mutual funds or asset classes.',
    pun: 'A big splash! Great when markets dip, but make sure your emergency buffer is untouched first.',
  },
  'apr': {
    title: 'APR (Annual Percentage Rate)',
    definition: 'The total annualized cost of borrowing money, including interest charges and processing fees.',
    pun: 'Always check the annual APR! Credit cards charge ~42% p.a., while home loans are ~8.5% p.a.',
  },
  'equity allocation': {
    title: 'Equity Allocation',
    definition: 'The percentage of investments placed in stocks & equity funds to drive long-term compounding (~12-15% CAGR).',
    pun: 'Equity is your growth engine! 100 minus your age gives your ideal equity percentage.',
  },
  'debt allocation': {
    title: 'Debt Allocation',
    definition: 'The percentage of investments in Fixed Deposits & bonds to protect capital safety and yield stability.',
    pun: 'Debt keeps your foundation solid when equity market storms blow past!',
  },
  'asset allocation': {
    title: 'Asset Allocation',
    definition: 'Dividing your money across Equity, Fixed Income / Debt, and Gold to optimize growth and risk.',
    pun: 'Never put all your eggs in one shell! Diversification ensures market dips never crush your portfolio.',
  },
  'risk capacity': {
    title: 'Risk Capacity Score',
    definition: 'Your objective financial ability to absorb investment losses based on age, income stability, expenses, and debt.',
    pun: 'Know your shell strength! Younger investors can take higher equity risk because they have time to recover.',
  },
  'flexi-fd': {
    title: 'Flexi-FD (Bank Sweep-In)',
    definition: 'Bank sweep-in deposit earning ~6.5-7.5% interest while allowing instant 24/7 ATM/UPI withdrawals with no penalty.',
    pun: 'The best of both worlds! Earn FD interest while spending straight from your account whenever needed.',
  },
};

export const GlossaryTerm: React.FC<GlossaryTermProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const cleanTerm = term.toLowerCase().trim();
  const entry = GLOSSARY_DB[cleanTerm] || {
    title: term,
    definition: `Financial concept relating to wealth management and wealth engineering.`,
    pun: `Invest slow, steady, and wisely!`,
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="underline decoration-primary/40 decoration-dashed underline-offset-4 font-semibold text-main cursor-pointer hover:text-primary transition-colors">
        {children || term}
      </span>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-80 p-4 sm:p-5 bg-card-bg/95 rounded-2xl shadow-floating border border-primary/20 dark:border-emerald-500/30 text-left animate-fadeIn backdrop-blur-md">
          <div className="flex items-start space-x-3.5">
            <ShellyMascot pose="explaining" size="sm" animateFloat={true} className="flex-shrink-0" />
            <div className="space-y-1">
              <div className="text-sm font-black text-main">{entry.title}</div>
              <p className="text-xs text-muted font-medium leading-relaxed">{entry.definition}</p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10 text-xs font-mono font-bold text-primary dark:text-emerald-400 italic bg-primary/5 dark:bg-emerald-500/10 p-2.5 rounded-xl border border-primary/20">
            "{entry.pun}"
          </div>
        </div>
      )}
    </span>
  );
};

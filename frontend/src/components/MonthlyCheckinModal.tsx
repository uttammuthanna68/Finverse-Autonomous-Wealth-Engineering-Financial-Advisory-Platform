import React, { useState } from 'react';
import { Card } from './Card';
import { ShellyMascot } from './ShellyMascot';
import { CheckCircle2, Calendar, X } from 'lucide-react';

interface MonthlyCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyDebtPayment: number;
  monthlyEmergencyDeposit: number;
  monthlyPortfolioSip: number;
  onSaveProgress: (summary: {
    paidDebt: boolean;
    depositedEmergency: boolean;
    depositedPortfolio: boolean;
    addedNewCard: boolean;
  }) => void;
}

export const MonthlyCheckinModal: React.FC<MonthlyCheckinModalProps> = ({
  isOpen,
  onClose,
  monthlyDebtPayment,
  monthlyEmergencyDeposit,
  monthlyPortfolioSip,
  onSaveProgress,
}) => {
  const [paidDebt, setPaidDebt] = useState<boolean>(true);
  const [depositedEmergency, setDepositedEmergency] = useState<boolean>(true);
  const [depositedPortfolio, setDepositedPortfolio] = useState<boolean>(true);
  const [addedNewCard, setAddedNewCard] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProgress({
      paidDebt,
      depositedEmergency,
      depositedPortfolio,
      addedNewCard,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="max-w-xl w-full p-6 sm:p-8 bg-card-bg shadow-2xl rounded-card-lg border border-black/10 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted hover:text-main rounded-xl hover:bg-surface transition-colors"
          title="Close Check-in"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Prof. Shelly */}
        <div className="flex items-center space-x-4 border-b border-black/5 pb-4">
          <ShellyMascot pose="happy" size="sm" animateFloat={false} className="w-16 h-16 flex-shrink-0" />
          <div>
            <div className="inline-flex items-center space-x-1 text-primary text-[10px] font-black uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 mb-1">
              <Calendar className="w-3 h-3" />
              <span>30-Day Monthly Progress Check-In</span>
            </div>
            <h2 className="text-xl font-black text-main tracking-tight">Time for your Monthly Check-in! 🗓️</h2>
            <p className="text-xs text-muted font-medium">Let's track your financial milestones and confirm this month's budget execution.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Question 1: Debt Payoff */}
          {monthlyDebtPayment > 0 && (
            <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2">
              <div className="font-extrabold text-main flex justify-between items-center">
                <span>1. Did you pay this month's high-interest debt installment?</span>
                <span className="font-mono text-primary font-black">₹{monthlyDebtPayment.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPaidDebt(true)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    paidDebt
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Yes, Paid Full Installment
                </button>
                <button
                  type="button"
                  onClick={() => setPaidDebt(false)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    !paidDebt
                      ? 'bg-warning text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Skipped / Partial Payment
                </button>
              </div>
            </div>
          )}

          {/* Question 2: Emergency Reserve Deposit */}
          {monthlyEmergencyDeposit > 0 && (
            <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2">
              <div className="font-extrabold text-main flex justify-between items-center">
                <span>2. Did you deposit into your Emergency Shield buffer?</span>
                <span className="font-mono text-primary font-black">₹{monthlyEmergencyDeposit.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDepositedEmergency(true)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    depositedEmergency
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Yes, Saved in Reserve
                </button>
                <button
                  type="button"
                  onClick={() => setDepositedEmergency(false)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    !depositedEmergency
                      ? 'bg-warning text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Not This Month
                </button>
              </div>
            </div>
          )}

          {/* Question 3: Portfolio SIP Investment */}
          {monthlyPortfolioSip > 0 && (
            <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2">
              <div className="font-extrabold text-main flex justify-between items-center">
                <span>3. Did you execute your Portfolio Wealth Growth SIP?</span>
                <span className="font-mono text-primary font-black">₹{monthlyPortfolioSip.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDepositedPortfolio(true)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    depositedPortfolio
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Yes, Invested SIP
                </button>
                <button
                  type="button"
                  onClick={() => setDepositedPortfolio(false)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    !depositedPortfolio
                      ? 'bg-warning text-white shadow-xs'
                      : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                  }`}
                >
                  Skipped
                </button>
              </div>
            </div>
          )}

          {/* Question 4: New Debts / Cards */}
          <div className="bg-surface p-4 rounded-2xl border border-black/5 space-y-2">
            <div className="font-extrabold text-main">
              4. Have you acquired any new credit cards or loan liabilities this month?
            </div>
            <div className="flex items-center space-x-3 pt-1">
              <button
                type="button"
                onClick={() => setAddedNewCard(false)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  !addedNewCard
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                }`}
              >
                No New Obligations
              </button>
              <button
                type="button"
                onClick={() => setAddedNewCard(true)}
                className={`px-4 py-2 rounded-xl font-bold transition-all ${
                  addedNewCard
                    ? 'bg-warning text-white shadow-xs'
                    : 'bg-card-bg text-muted border border-black/10 hover:bg-black/5'
                }`}
              >
                Yes, Added New Card/Loan
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-black/5 flex justify-end space-x-3">
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white font-extrabold py-3 px-8 rounded-2xl text-xs shadow-md flex items-center space-x-2 transition-all hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Save Monthly Progress</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

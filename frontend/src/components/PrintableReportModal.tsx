import React from 'react';
import { Card } from './Card';
import { X, Printer, FileText } from 'lucide-react';

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    fullName: string;
    email: string;
    salary: number;
    expenses: number;
    savings: number;
    age: number;
    debts: any[];
    goals: any[];
  };
  winnerRegime: string;
  taxSavings: number;
}

export const PrintableReportModal: React.FC<PrintableReportModalProps> = ({
  isOpen,
  onClose,
  userData,
  winnerRegime,
  taxSavings,
}) => {
  if (!isOpen) return null;

  const monthlySurplus = Math.max(0, userData.salary - userData.expenses);
  const emergencyTarget = userData.expenses * 6;
  const emergencyDeficit = Math.max(0, emergencyTarget - userData.savings);
  const totalDebtBalance = userData.debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-card-bg shadow-2xl rounded-card-lg border border-black/10 relative space-y-6 print:max-w-full print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-center border-b border-black/10 pb-4 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-main">CA Financial Health Audit Report</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-main rounded-xl hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE REPORT BODY */}
        <div className="space-y-6 text-xs text-main">
          {/* Header & Logo */}
          <div className="flex justify-between items-start border-b-2 border-primary pb-4">
            <div>
              <span className="text-xs font-mono font-black text-primary uppercase tracking-widest block">Finverse Financial Advisory</span>
              <h1 className="text-2xl font-black text-main tracking-tight">Personal Financial Health Audit</h1>
              <p className="text-[11px] text-muted">Generated on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-main text-sm block">{userData.fullName || 'Finverse Client'}</span>
              <span className="font-mono text-muted text-[11px] block">{userData.email}</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Status: Fully Audited</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase tracking-wider text-primary text-[11px]">1. Executive Cash-Flow Summary</h3>
            <div className="grid grid-cols-4 gap-3 bg-surface p-3.5 rounded-xl border border-black/5 text-center font-mono">
              <div>
                <span className="text-[10px] text-muted block font-sans">Monthly Salary</span>
                <span className="font-bold text-main text-xs">₹{userData.salary.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block font-sans">Monthly Expenses</span>
                <span className="font-bold text-main text-xs">₹{userData.expenses.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block font-sans">Monthly Surplus</span>
                <span className="font-bold text-emerald-700 text-xs">₹{monthlySurplus.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block font-sans">Current Savings</span>
                <span className="font-bold text-main text-xs">₹{userData.savings.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Waterfall Priority Alignment */}
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase tracking-wider text-primary text-[11px]">2. Strategic Priority Waterfall Audit</h3>
            <div className="space-y-2">
              <div className="bg-surface p-3 rounded-xl border border-black/5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-main block">Priority 1: Toxic Debt Elimination</span>
                  <span className="text-[11px] text-muted block">Total Outstanding Debt: ₹{totalDebtBalance.toLocaleString('en-IN')}</span>
                </div>
                <span className={`font-bold font-mono text-xs ${totalDebtBalance > 0 ? 'text-warning' : 'text-emerald-700'}`}>
                  {totalDebtBalance > 0 ? 'Active Payoff' : 'Zero Debt Secured ✓'}
                </span>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-black/5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-main block">Priority 2: 6-Month Emergency Shield</span>
                  <span className="text-[11px] text-muted block">Target: ₹{emergencyTarget.toLocaleString('en-IN')} | Deficit: ₹{emergencyDeficit.toLocaleString('en-IN')}</span>
                </div>
                <span className={`font-bold font-mono text-xs ${emergencyDeficit > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {emergencyDeficit > 0 ? `${Math.round((userData.savings / emergencyTarget) * 100)}% Funded` : '100% Secured ✓'}
                </span>
              </div>

              <div className="bg-surface p-3 rounded-xl border border-black/5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-main block">Priority 3: Tax Strategy</span>
                  <span className="text-[11px] text-muted block">Optimal Regime: {winnerRegime}</span>
                </div>
                <span className="font-bold font-mono text-xs text-emerald-700">
                  Saves ₹{taxSavings.toLocaleString('en-IN')}/yr ✓
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Goal Timeline & Horizon Assets */}
          <div className="space-y-2">
            <h3 className="font-extrabold uppercase tracking-wider text-primary text-[11px]">3. Goal Horizon & Asset Deployment Schedule</h3>
            {userData.goals.length === 0 ? (
              <p className="text-muted italic">No specific goals added yet.</p>
            ) : (
              <div className="space-y-2">
                {userData.goals.map((g, idx) => (
                  <div key={idx} className="bg-surface p-3 rounded-xl border border-black/5 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-main block">{g.name || 'Goal'}</span>
                      <span className="text-[10px] text-muted block font-mono">Target: ₹{Number(g.target_amount).toLocaleString('en-IN')} by {g.target_date || '2030'}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-primary block text-xs">₹{Math.round(Number(g.target_amount) / 24).toLocaleString('en-IN')}/mo</span>
                      <span className="text-[10px] text-emerald-700 font-sans font-semibold">Deployed in Liquid/Hybrid Funds</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Signoff */}
          <div className="border-t border-black/10 pt-4 flex justify-between items-center text-[10px] text-muted">
            <span>Verified by Finverse Autonomous CA & Risk Engine</span>
            <span>Document Signature ID: FIN-{Date.now().toString().slice(-8)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

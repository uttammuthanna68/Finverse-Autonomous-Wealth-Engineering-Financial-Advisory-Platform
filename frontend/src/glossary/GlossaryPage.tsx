import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Search } from 'lucide-react';

const SEEDED_GLOSSARY: Record<string, string> = {
  "equity allocation": "Equity Allocation — the percentage of your monthly surplus invested in equity assets (like Large Cap, Mid Cap, and Small Cap stock funds) vs safety debt assets (like FDs and Bonds). Drives long-term wealth compounding (~12-15% CAGR).",
  "debt allocation": "Debt Allocation — the percentage of your capital allocated to fixed income (FDs, corporate bonds, liquid funds) to guarantee capital protection (~6.5-7.5% CAGR).",
  "asset allocation": "Dividing your investments among different asset classes — like stocks (equity), bonds (debt), and gold — to balance risk and expected return based on your age and goals.",
  "100 - age rule": "A financial benchmark rule recommending Equity Allocation % = (100 - Age). For example, a 30-year-old allocates ~70% to Equity and 30% to Debt/Gold.",
  "risk capacity": "An objective measure of how much financial risk your situation allows you to take based on your age, income stability, expenses, toxic debt, and dependents.",
  "toxic debt": "Finverse's term for high-interest debt with APR above 24% per year (like credit cards or instant loan apps). Must be paid off first before equity investing.",
  "manageable debt": "Low-to-moderate interest debt with APR below 18% (like home loans at ~8.5%), which carry tax benefits and manageable monthly EMIs.",
  "payoff waterfall": "Finverse's debt strategy calculating how your monthly surplus is split between toxic debt payoffs, emergency buffers, and portfolio SIPs.",
  "avalanche method": "A debt payoff strategy where you pay minimum dues on all debts, then throw all extra surplus at the single debt with the highest interest rate to minimize total interest paid.",
  "debt snowball": "A debt payoff strategy prioritizing paying off the smallest balance loan first to build quick psychological wins.",
  "APR": "Annual Percentage Rate — the total yearly cost of borrowing money, including interest rates and fees, expressed as a single percentage.",
  "EMI": "Equated Monthly Installment — the fixed monthly amount paid toward loans.",
  "minimum payment": "The smallest amount required by credit cards on bill statements to avoid late payment charges and severe CIBIL score damage.",
  "CIBIL score": "A 3-digit credit score (300–900) evaluating your credit trustworthiness based on repayment history, total debt, and credit utilization.",
  "credit utilization": "The percentage of your total available credit card limits currently being used (keeping it under 30% improves your score).",
  "emergency fund": "A liquid cash buffer (typically 3 to 6 months of expenses) kept safely in penalty-free Flexi-FDs and liquid funds to protect against unexpected emergencies.",
  "flexi-fd": "Bank Sweep-In Fixed Deposit earning ~6.5-7.5% interest while connected to your account for instant 24/7 ATM/UPI access with zero withdrawal penalties.",
  "liquid fund": "A debt mutual fund investing in short-term money market securities with T+1 business day redemption and safety.",
  "arbitrage fund": "A tax-efficient mutual fund exploiting price differences between cash and futures equity markets, offering equity tax treatment with low risk.",
  "monthly surplus": "The net money remaining every month after subtracting essential living expenses from monthly salary (Surplus = Salary - Expenses).",
  "SIP": "Systematic Investment Plan — putting a fixed amount into mutual funds automatically every month, helping you invest consistently without worrying about market timing.",
  "step-up sip": "Increasing your monthly SIP contribution by a fixed percentage (e.g. +10% annually) as your salary grows, exponentially boosting wealth creation.",
  "lumpsum": "Investing a single lump amount of money all at once, rather than spreading it out over monthly installments.",
  "hybrid investment": "Combining an initial bulk lumpsum deposit with ongoing monthly SIP contributions.",
  "SWP": "Systematic Withdrawal Plan — withdrawing a fixed monthly amount from a mutual fund corpus during retirement while the remaining balance continues to compound.",
  "goal planner": "Finverse tool calculating the required monthly SIP investment needed today to reach a target future corpus (e.g. ₹1 Crore).",
  "CAGR": "Compound Annual Growth Rate — the annualized rate at which an investment grows over time.",
  "XIRR": "Extended Internal Rate of Return — the exact annualized return rate for investments made through multiple irregular or monthly cash flows (SIPs).",
  "real vs nominal return": "Real Return is the net growth after subtracting annual inflation (Nominal Return - Inflation Rate).",
  "expense ratio": "The small annual percentage fee charged by a mutual fund company to manage your money.",
  "direct vs regular plan": "Direct plans buy funds straight from the mutual fund company with zero distributor commission fees; regular plans include ongoing agent commissions that lower your returns over time.",
  "NAV": "Net Asset Value — the per-unit market price of a mutual fund scheme, updated at the end of every trading day.",
  "ETF": "Exchange Traded Fund — a basket of stocks or bonds that tracks an index and trades live on the stock exchange just like an individual stock.",
  "index fund": "A low-cost mutual fund that automatically copies a market index (like Nifty 50) to deliver market-average returns without paying expensive fund manager fees.",
  "SGB": "Sovereign Gold Bond — government-backed securities linked to gold prices that pay 2.5% annual interest on top of gold appreciation, exempt from capital gains tax if held to maturity.",
  "ELSS": "Equity Linked Savings Scheme — a tax-saving mutual fund with a 3-year lock-in period that qualifies for tax deduction under Section 80C.",
  "PPF": "Public Provident Fund — a government-backed 15-year risk-free savings scheme offering guaranteed, tax-free interest under Section 80C.",
  "EPF": "Employee Provident Fund — a mandatory retirement savings scheme for salaried employees where both employee and employer contribute 12% of basic salary monthly.",
  "NPS": "National Pension System — a government-sponsored retirement savings scheme offering additional tax benefits under Section 80CCD(1B) and market-linked pension accumulation.",
  "term insurance": "Pure life insurance that pays a large lump sum to your family if you pass away during the policy term, keeping premiums very cheap.",
  "ULIP": "Unit Linked Insurance Plan — blends life insurance and mutual fund investing in one policy (NOTE: High hidden charges mean ULIPs are generally not recommended).",
  "card optimizer": "Finverse tool recommending the highest rewarding credit card from your wallet for specific purchases (Dining, Travel, Groceries) while excluding toxic balances.",
  "rebalancing": "Periodically adjusting your portfolio back to its target asset mix (e.g. 70% equity / 30% debt) when market movements shift the proportions."
};

export const GlossaryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const termsList = Object.entries(SEEDED_GLOSSARY).map(([key, def]) => ({
    term: key,
    definition: def,
  }));

  const filteredTerms = termsList.filter(
    (t) =>
      t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Plain-Language Dictionary
          </div>
          <h1 className="text-3xl font-extrabold text-main tracking-tight">Financial Glossary</h1>
          <p className="text-sm text-muted">
            Simple, non-jargon explanations to help you understand every term across Finverse.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search financial terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-black/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((t) => {
          const isWarningTerm = t.term === 'ULIP' || t.term === 'toxic debt';

          return (
            <Card
              key={t.term}
              className={`p-5 space-y-2.5 rounded-card border shadow-card transition-all ${
                isWarningTerm ? 'border-warning/40 bg-warning/5' : 'border-black/5 bg-card-bg'
              }`}
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  🐼
                </div>
                <h3 className="text-base font-extrabold text-main">{t.term}</h3>
              </div>

              <p className="text-xs text-main font-semibold leading-relaxed bg-surface p-3.5 rounded-xl border border-black/5">
                {t.definition}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

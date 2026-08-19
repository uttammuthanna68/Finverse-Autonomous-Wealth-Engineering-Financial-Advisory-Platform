import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { fetchWithAuth } from '../api/config';
import { ShellyMascot } from '../components/ShellyMascot';
import {
  Receipt,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calculator,
  Lightbulb,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';

interface TaxPageProps {
  onNavigate: (path: string) => void;
}

export const TaxPage: React.FC<TaxPageProps> = ({ onNavigate }) => {
  const [monthlySalary, setMonthlySalary] = useState<number>(75000); // Default ₹9 Lakhs/year
  const [financialYear, setFinancialYear] = useState<string>('FY 2025-26');
  
  // Plain-English Tax Saving Investment Inputs (Old Regime Evaluation)
  const [sec80c, setSec80c] = useState<number | ''>(150000); // ELSS, EPF, PPF
  const [sec80d, setSec80d] = useState<number | ''>(25000);  // Health Cover
  const [sec80ccd1b, setSec80ccd1b] = useState<number | ''>(50000); // NPS Pension Account
  const [sec24b, setSec24b] = useState<number | ''>(0);     // Home Loan Interest

  const [taxData, setTaxData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tips' | 'calculator'>('overview');

  // Load user salary from profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchWithAuth('/api/profile/me');
        if (res.ok) {
          const prof = await res.json();
          if (prof.salary && prof.salary > 0) {
            setMonthlySalary(prof.salary);
          }
        }
      } catch (err) {
        console.error('Failed to load profile for tax page:', err);
      }
    };
    loadProfile();
  }, []);

  const annualSalary = monthlySalary * 12;

  const runTaxAnalysis = async () => {
    try {
      const payload = {
        annual_salary: annualSalary,
        financial_year: financialYear,
        sec_80c: sec80c === '' ? 0 : Number(sec80c),
        sec_80d: sec80d === '' ? 0 : Number(sec80d),
        sec_80ccd_1b: sec80ccd1b === '' ? 0 : Number(sec80ccd1b),
        sec_24b: sec24b === '' ? 0 : Number(sec24b),
      };

      const res = await fetchWithAuth('/api/engine/tax-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setTaxData(data);
      }
    } catch (err) {
      console.error('Tax analysis failed:', err);
    }
  };

  useEffect(() => {
    runTaxAnalysis();
  }, [monthlySalary, financialYear, sec80c, sec80d, sec80ccd1b, sec24b]);

  const winner = taxData?.winner_regime || 'New Regime';
  const oldTax = taxData?.old_regime?.total_tax_payable || 0;
  const newTax = taxData?.new_regime?.total_tax_payable || 0;
  const winnerTax = winner === 'New Regime' ? newTax : oldTax;
  const savingsAmount = taxData?.tax_savings_amount || 0;

  const isZeroTax = winnerTax === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* HEADER WITH YEAR SWITCHER & PROFILE LINK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-black text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
              Indian Tax Advisor • {financialYear}
            </span>
            {isZeroTax && (
              <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                ✨ 100% Tax-Free Salary
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black text-main tracking-tight">How Much Tax Do I Pay?</h1>
          <p className="text-sm text-muted mt-1 font-medium">
            Clear, jargon-free tax calculation, regime comparison, and smart tips to minimize your income tax outgo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Financial Year Selector */}
          <div className="flex items-center bg-surface p-1 rounded-xl border border-black/10 dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => setFinancialYear('FY 2025-26')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                financialYear === 'FY 2025-26'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              FY 2025-26 (Budget 2025)
            </button>
            <button
              onClick={() => setFinancialYear('FY 2024-25')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                financialYear === 'FY 2024-25'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted hover:text-main'
              }`}
            >
              FY 2024-25
            </button>
          </div>

          <button
            onClick={() => onNavigate('/profile')}
            className="bg-surface hover:bg-surface/80 text-main border border-black/10 dark:border-white/10 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all"
          >
            <span>Update Salary</span>
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
          </button>
        </div>
      </div>

      {/* QUICK SALARY ADJUSTER & MAIN SUMMARY CARD */}
      <Card className="p-6 md:p-8 bg-card-bg shadow-card rounded-card border border-black/5 dark:border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Mascot & Headline */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center space-x-3">
              <ShellyMascot pose={isZeroTax ? 'happy' : 'explaining'} size="md" animateFloat={false} />
              <div>
                <span className="text-xs font-extrabold text-muted uppercase tracking-wider block">
                  Your Annual Income
                </span>
                <div className="text-3xl font-black font-mono text-primary flex items-baseline space-x-2">
                  <span>₹{annualSalary.toLocaleString('en-IN')}</span>
                  <span className="text-xs font-normal text-muted font-sans">
                    (₹{monthlySalary.toLocaleString('en-IN')} / month)
                  </span>
                </div>
              </div>
            </div>

            {/* Zero-Tax or Tax Summary Banner */}
            {isZeroTax ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 font-black text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>You owe ₹0 Tax under the New Tax Regime!</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  Under the <strong>{financialYear} New Tax Regime</strong>, salaried individuals earning up to{' '}
                  <strong className="underline">₹12.75 Lakhs per year</strong> (~₹1.06 Lakhs/month) pay <strong>₹0 tax</strong>!
                  This includes the standard ₹75,000 salary discount plus full government tax rebate.
                </p>
              </div>
            ) : (
              <div className="bg-primary/10 border border-primary/20 text-main p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center space-x-2 font-black text-base text-primary">
                  <Sparkles className="w-5 h-5 flex-shrink-0" />
                  <span>{winner} is your best option</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  By using the <strong>{winner}</strong>, you pay <strong>₹{winnerTax.toLocaleString('en-IN')}</strong> in annual tax, saving you{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{savingsAmount.toLocaleString('en-IN')}</strong> compared to the alternative option!
                </p>
              </div>
            )}
          </div>

          {/* Quick Salary Slider Box */}
          <div className="md:col-span-5 bg-surface p-5 rounded-2xl border border-black/10 dark:border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-main">
              <span>Monthly Salary Slider</span>
              <span className="font-mono text-primary">₹{monthlySalary.toLocaleString('en-IN')} / mo</span>
            </div>

            <input
              type="range"
              min={25000}
              max={300000}
              step={5000}
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(Number(e.target.value))}
              className="w-full h-2 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />

            <div className="flex justify-between text-[11px] text-muted font-mono">
              <span>₹25k (₹3L/yr)</span>
              <span>₹75k (₹9L/yr)</span>
              <span>₹1.06L (₹12.75L/yr)</span>
              <span>₹3L (₹36L/yr)</span>
            </div>

            <p className="text-[11px] text-muted text-center pt-1 font-medium">
              💡 Drag to test different salary levels and see instant tax updates!
            </p>
          </div>
        </div>
      </Card>

      {/* NAVIGATION TABS FOR DETAILED BREAKDOWN & TIPS */}
      <div className="flex border-b border-black/10 dark:border-white/10 text-sm font-bold space-x-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-main'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Tax Bill & Step-by-Step Math</span>
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'tips'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-main'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Smart Tax-Saving Tips & Ideas</span>
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`pb-3 border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'calculator'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-main'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Old vs New Regime Comparison</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STEP-BY-STEP MATH */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* STEP-BY-STEP CALCULATION CARD */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-black text-main">How Your Tax Bill is Calculated (Step-by-Step)</h3>
              </div>
              <span className="text-xs font-bold text-muted bg-surface px-3 py-1 rounded-full border border-black/10 dark:border-white/10">
                {financialYear} New Tax Regime
              </span>
            </div>

            {/* Plain English Calculation Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              
              {/* Step 1 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-wider block">Step 1 • Gross Annual Salary</span>
                <div className="text-2xl font-black font-mono text-main">
                  ₹{annualSalary.toLocaleString('en-IN')}
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  Total annual salary received before any discounts or standard deductions.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Step 2 • Standard Salary Discount</span>
                <div className="text-2xl font-black font-mono text-emerald-600">
                  - ₹{(taxData?.new_regime?.standard_deduction || 75000).toLocaleString('en-IN')}
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  Automatic flat discount given by the government to all salaried employees.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <span className="text-[10px] font-black text-main uppercase tracking-wider block">Step 3 • Net Taxable Salary</span>
                <div className="text-2xl font-black font-mono text-main">
                  ₹{(taxData?.new_regime?.taxable_income || 0).toLocaleString('en-IN')}
                </div>
                <p className="text-muted leading-relaxed text-[11px]">
                  The income amount used to calculate tax rate slabs.
                </p>
              </div>
            </div>

            {/* Step 4 & 5 Banner */}
            <div className="bg-surface p-5 rounded-xl border border-black/10 dark:border-white/10 space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-black/5 dark:border-white/10 pb-3">
                <div>
                  <span className="text-xs font-extrabold text-main block uppercase">Step 4 & 5 • Slab Tax & Government Rebate</span>
                  <span className="text-xs text-muted">Section 87A provides 100% tax waiver for taxable income up to ₹12 Lakhs</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-muted block">Calculated Slab Tax: ₹{(taxData?.new_regime?.raw_tax || 0).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-emerald-600 font-bold block">Government Rebate (Sec 87A): - ₹{(taxData?.new_regime?.rebate_87a || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Final Result Row */}
              <div className="flex justify-between items-center pt-1">
                <div>
                  <span className="text-sm font-black text-main block">FINAL TAX YOU PAY</span>
                  <span className="text-xs text-muted block">Includes 4% Health & Education Cess</span>
                </div>
                <div className="text-3xl font-black font-mono text-primary">
                  ₹{newTax.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </Card>

          {/* PROF SHELLY'S ADVICE */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 dark:border-white/10 space-y-3">
            <h3 className="text-base font-extrabold text-main flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Prof. Shelly's Tax Takeaway</span>
            </h3>
            <div className="space-y-2">
              {taxData?.recommendations?.map((rec: string, idx: number) => (
                <div key={idx} className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 flex items-start space-x-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-main leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: SMART TAX-SAVING TIPS & IDEAS */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 dark:border-white/10 space-y-4">
            <div className="flex items-center space-x-2 border-b border-black/5 dark:border-white/10 pb-3">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-lg font-black text-main">Smart Tax-Saving Ideas & Guide</h3>
                <p className="text-xs text-muted">Practical tips to protect your salary from unnecessary tax payments.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              {/* Idea 1 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-primary font-extrabold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>1. Health Insurance for Self & Parents</span>
                </div>
                <p className="text-muted leading-relaxed font-medium">
                  Under the Old Tax Regime, paying health insurance premiums for yourself saves up to ₹25,000, and covering senior citizen parents saves up to an additional ₹50,000 in taxable salary!
                </p>
                <span className="text-[11px] font-bold text-emerald-600 block">Potential Tax Benefit: Up to ₹75,000 deduction</span>
              </div>

              {/* Idea 2 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-primary font-extrabold text-sm">
                  <TrendingDown className="w-4 h-4" />
                  <span>2. National Pension System (NPS Tier-1)</span>
                </div>
                <p className="text-muted leading-relaxed font-medium">
                  Investing in NPS gives you an exclusive extra ₹50,000 tax deduction above normal investments under the Old Regime, while building your retirement wealth.
                </p>
                <span className="text-[11px] font-bold text-emerald-600 block">Potential Tax Benefit: Save up to ₹15,600 in tax cash</span>
              </div>

              {/* Idea 3 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-primary font-extrabold text-sm">
                  <Receipt className="w-4 h-4" />
                  <span>3. House Rent Allowance (HRA) Exemption</span>
                </div>
                <p className="text-muted leading-relaxed font-medium">
                  If you live in rented accommodation and opt for the Old Regime, submit rent receipts to your employer to exempt a major portion of your salary from tax.
                </p>
                <span className="text-[11px] font-bold text-emerald-600 block">Applicable for: Salaried renters under Old Regime</span>
              </div>

              {/* Idea 4 */}
              <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-2">
                <div className="flex items-center space-x-2 text-primary font-extrabold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Zero Lock-in Freedom (New Regime)</span>
                </div>
                <p className="text-muted leading-relaxed font-medium">
                  Under the New Regime (default), you pay lower tax rates directly on gross income without forcing yourself to lock money into 3-year ELSS or 15-year PPF accounts.
                </p>
                <span className="text-[11px] font-bold text-primary block">Advantage: 100% Investment Liquidity</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: OLD VS NEW REGIME COMPARISON & ITEMIZED DEDUCTIONS AUDIT */}
      {(activeTab === 'calculator' || activeTab === 'overview') && (
        <div className="space-y-6">
          {/* REGIME COMPARISON CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Old Regime Card */}
            <Card className={`p-6 bg-card-bg shadow-card rounded-card border-2 transition-all space-y-4 ${winner === 'Old Regime' ? 'border-primary ring-2 ring-primary/20' : 'border-black/5 dark:border-white/10 opacity-90'}`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-muted" />
                  <h3 className="text-lg font-extrabold text-main">Old Tax Regime</h3>
                </div>
                {winner === 'Old Regime' && (
                  <span className="bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Best Option</span>
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10">
                  <span className="text-muted">Gross Annual Salary</span>
                  <span className="font-mono font-bold text-main">₹{annualSalary.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10 text-muted">
                  <span>Standard Discount</span>
                  <span className="font-mono font-bold text-emerald-600">- ₹50,000</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10 text-muted">
                  <span>Claimed Investment Deductions</span>
                  <span className="font-mono font-bold text-emerald-600">- ₹{(taxData?.old_regime?.itemized_deductions?.total_deductions - 50000 || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10">
                  <span className="font-bold text-main">Net Taxable Income</span>
                  <span className="font-mono font-bold text-main">₹{(taxData?.old_regime?.taxable_income || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-muted uppercase block">Total Old Regime Tax Owed</span>
                  <div className="text-2xl font-black font-mono text-main">
                    ₹{oldTax.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-muted block">Effective Tax Rate: {taxData?.old_regime?.effective_tax_rate_pct || 0}%</span>
                </div>
              </div>
            </Card>

            {/* New Regime Card */}
            <Card className={`p-6 bg-card-bg shadow-card rounded-card border-2 transition-all space-y-4 ${winner === 'New Regime' ? 'border-primary ring-2 ring-primary/20' : 'border-black/5 dark:border-white/10 opacity-90'}`}>
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-extrabold text-main">New Tax Regime (Default)</h3>
                </div>
                {winner === 'New Regime' && (
                  <span className="bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Best Option</span>
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10">
                  <span className="text-muted">Gross Annual Salary</span>
                  <span className="font-mono font-bold text-main">₹{annualSalary.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10 text-muted">
                  <span>Standard Discount ({financialYear})</span>
                  <span className="font-mono font-bold text-emerald-600">- ₹75,000</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10 text-muted">
                  <span>Investment Scheme Lock-ins</span>
                  <span className="font-mono font-semibold text-emerald-600">Zero Lock-in Required</span>
                </div>

                <div className="flex justify-between items-baseline py-1 border-b border-black/5 dark:border-white/10">
                  <span className="font-bold text-main">Net Taxable Income</span>
                  <span className="font-mono font-bold text-main">₹{(taxData?.new_regime?.taxable_income || 0).toLocaleString('en-IN')}</span>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-black/5 dark:border-white/10 space-y-1 mt-2">
                  <span className="text-[10px] font-bold text-muted uppercase block">Total New Regime Tax Owed</span>
                  <div className="text-2xl font-black font-mono text-main">
                    ₹{newTax.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-muted block">Effective Tax Rate: {taxData?.new_regime?.effective_tax_rate_pct || 0}%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ITEMIZED DEDUCTIONS SIMULATOR (Plain English Labels) */}
          <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 dark:border-white/10 space-y-4">
            <div className="border-b border-black/5 dark:border-white/10 pb-3">
              <h3 className="text-lg font-black text-main">Old Regime Tax Deduction Simulator</h3>
              <p className="text-xs text-muted">
                Enter planned investments to calculate if the Old Regime beats the New Regime for your salary.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              
              {/* ELSS / EPF / PPF */}
              <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5 dark:border-white/10">
                <label className="font-bold text-main block uppercase text-[10px]">
                  ELSS Funds / EPF / PPF (₹)
                </label>
                <input
                  type="number"
                  max={150000}
                  value={sec80c}
                  onChange={(e) => setSec80c(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="150000"
                  className="w-full bg-card-bg border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-[10px] text-muted block">Max Discount: ₹1.5 Lakhs (Sec 80C)</span>
              </div>

              {/* Health Insurance */}
              <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5 dark:border-white/10">
                <label className="font-bold text-main block uppercase text-[10px]">
                  Health Insurance Plan (₹)
                </label>
                <input
                  type="number"
                  max={75000}
                  value={sec80d}
                  onChange={(e) => setSec80d(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="25000"
                  className="w-full bg-card-bg border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-[10px] text-muted block">Self + Parents Cover (Sec 80D)</span>
              </div>

              {/* NPS Account */}
              <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5 dark:border-white/10">
                <label className="font-bold text-main block uppercase text-[10px]">
                  NPS Pension Contribution (₹)
                </label>
                <input
                  type="number"
                  max={50000}
                  value={sec80ccd1b}
                  onChange={(e) => setSec80ccd1b(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50000"
                  className="w-full bg-card-bg border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-[10px] text-muted block">Extra NPS Cover: ₹50,000 (80CCD 1B)</span>
              </div>

              {/* Home Loan */}
              <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5 dark:border-white/10">
                <label className="font-bold text-main block uppercase text-[10px]">
                  Home Loan Interest (₹)
                </label>
                <input
                  type="number"
                  max={200000}
                  value={sec24b}
                  onChange={(e) => setSec24b(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-card-bg border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="text-[10px] text-muted block">Max Discount: ₹2.0 Lakhs (Sec 24b)</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

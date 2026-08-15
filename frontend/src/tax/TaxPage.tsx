import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { fetchWithAuth } from '../api/config';
import { ShellyMascot } from '../components/ShellyMascot';
import {
  Receipt,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface TaxPageProps {
  onNavigate: (path: string) => void;
}

export const TaxPage: React.FC<TaxPageProps> = ({ onNavigate }) => {
  const [monthlySalary, setMonthlySalary] = useState<number>(100000);
  const [sec80c, setSec80c] = useState<number | ''>(150000);
  const [sec80d, setSec80d] = useState<number | ''>(25000);
  const [sec80ccd1b, setSec80ccd1b] = useState<number | ''>(50000);
  const [sec24b, setSec24b] = useState<number | ''>(0);
  const [taxData, setTaxData] = useState<any>(null);

  // Load user salary from profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchWithAuth('/api/profile/me');
        if (res.ok) {
          const prof = await res.json();
          if (prof.salary) setMonthlySalary(prof.salary);
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
        sec_80c: sec80c === '' ? 0 : Number(sec80c),
        sec_80d: sec80d === '' ? 0 : Number(sec80d),
        sec_80ccd_1b: sec80ccd1b === '' ? 0 : Number(sec80ccd1b),
        sec_24b: sec24b === '' ? 0 : Number(sec24b),
      };

      const res = await fetchWithAuth('/api/engine/tax-analysis', {
        method: 'POST',
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
  }, [monthlySalary, sec80c, sec80d, sec80ccd1b, sec24b]);

  const winner = taxData?.winner_regime || 'New Regime';
  const oldTax = taxData?.old_regime?.total_tax_payable || 0;
  const newTax = taxData?.new_regime?.total_tax_payable || 0;
  const savingsAmount = taxData?.tax_savings_amount || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Indian Income Tax Optimization Engine (FY 2024-25 / FY 2025-26)
          </span>
          <h1 className="text-3xl font-black text-main tracking-tight">Tax Optimization Advisor</h1>
          <p className="text-xs text-muted mt-1">
            Compare Old vs. New Tax Regime liabilities, evaluate Section 80C/80D/NPS deductions, and minimize annual tax outgo.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/profile')}
          className="bg-surface hover:bg-surface/80 text-main border border-black/10 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition-all"
        >
          <span>Update Income in Profile →</span>
        </button>
      </div>

      {/* WINNER REGIME HERO BANNER */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <ShellyMascot pose="happy" size="md" animateFloat={false} className="flex-shrink-0" />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="inline-flex items-center space-x-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-extrabold border border-primary/20 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended Tax Strategy</span>
            </div>
            <h2 className="text-2xl font-black text-main tracking-tight">
              {winner === 'New Regime' ? 'New Tax Regime is Optimal' : 'Old Tax Regime is Optimal'}
            </h2>
            <p className="text-sm font-semibold text-main leading-relaxed">
              Based on your Annual Salary of <strong className="font-mono text-primary">₹{annualSalary.toLocaleString('en-IN')}</strong>, the <strong>{winner}</strong> saves you{' '}
              <strong className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">₹{savingsAmount.toLocaleString('en-IN')}</strong> in taxes per year!
            </p>
          </div>
        </div>
      </Card>

      {/* COMPARISON CARDS (Old vs New Regime) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Old Regime Card */}
        <Card className={`p-6 bg-card-bg shadow-card rounded-card border-2 transition-all space-y-4 ${winner === 'Old Regime' ? 'border-primary ring-2 ring-primary/20' : 'border-black/5 opacity-90'}`}>
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-muted" />
              <h3 className="text-lg font-extrabold text-main">Old Tax Regime</h3>
            </div>
            {winner === 'Old Regime' && (
              <span className="bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Optimal Choice</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline py-1 border-b border-black/5">
              <span className="text-muted">Gross Annual Salary</span>
              <span className="font-mono font-bold text-main">₹{annualSalary.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5 text-muted">
              <span>Standard Deduction</span>
              <span className="font-mono font-bold text-emerald-600">- ₹50,000</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5 text-muted">
              <span>Itemized Deductions (80C, 80D, NPS, 24b)</span>
              <span className="font-mono font-bold text-emerald-600">- ₹{(taxData?.old_regime?.itemized_deductions?.total_deductions - 50000 || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5">
              <span className="font-bold text-main">Net Taxable Income</span>
              <span className="font-mono font-bold text-main">₹{(taxData?.old_regime?.taxable_income || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-black/5 space-y-1 mt-2">
              <span className="text-[10px] font-bold text-muted uppercase block">Total Old Regime Tax Payable (incl. 4% Cess)</span>
              <div className="text-2xl font-black font-mono text-main">
                ₹{oldTax.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-muted block">Effective Tax Rate: {taxData?.old_regime?.effective_tax_rate_pct || 0}%</span>
            </div>
          </div>
        </Card>

        {/* New Regime Card */}
        <Card className={`p-6 bg-card-bg shadow-card rounded-card border-2 transition-all space-y-4 ${winner === 'New Regime' ? 'border-primary ring-2 ring-primary/20' : 'border-black/5 opacity-90'}`}>
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-extrabold text-main">New Tax Regime (Default)</h3>
            </div>
            {winner === 'New Regime' && (
              <span className="bg-primary text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Optimal Choice</span>
              </span>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline py-1 border-b border-black/5">
              <span className="text-muted">Gross Annual Salary</span>
              <span className="font-mono font-bold text-main">₹{annualSalary.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5 text-muted">
              <span>Standard Deduction (FY 24-25/25-26)</span>
              <span className="font-mono font-bold text-emerald-600">- ₹75,000</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5 text-muted">
              <span>Itemized Lock-in Deductions</span>
              <span className="font-mono font-semibold text-muted">Not Required (Zero Lock-in)</span>
            </div>

            <div className="flex justify-between items-baseline py-1 border-b border-black/5">
              <span className="font-bold text-main">Net Taxable Income</span>
              <span className="font-mono font-bold text-main">₹{(taxData?.new_regime?.taxable_income || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-black/5 space-y-1 mt-2">
              <span className="text-[10px] font-bold text-muted uppercase block">Total New Regime Tax Payable (incl. 4% Cess)</span>
              <div className="text-2xl font-black font-mono text-main">
                ₹{newTax.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-muted block">Effective Tax Rate: {taxData?.new_regime?.effective_tax_rate_pct || 0}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ITEMIZED DEDUCTIONS EDITABLE CONTROLS */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4">
        <div className="border-b border-black/5 pb-3">
          <h3 className="text-lg font-extrabold text-main">Itemized Tax Deductions Calculator (Old Regime Audit)</h3>
          <p className="text-xs text-muted">Enter your actual or planned investments under Section 80C, 80D, 80CCD(1B), and 24b to evaluate breakeven points.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {/* 80C */}
          <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5">
            <label className="font-bold text-main block uppercase text-[10px]">Sec 80C (ELSS, EPF, PPF) (₹)</label>
            <input
              type="number"
              max={150000}
              value={sec80c}
              onChange={(e) => setSec80c(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="150000"
              className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="text-[10px] text-muted block">Max Deduction: ₹1.5 Lakhs</span>
          </div>

          {/* 80D */}
          <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5">
            <label className="font-bold text-main block uppercase text-[10px]">Sec 80D Health Cover (₹)</label>
            <input
              type="number"
              max={75000}
              value={sec80d}
              onChange={(e) => setSec80d(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="25000"
              className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="text-[10px] text-muted block">Self + Parents Premium</span>
          </div>

          {/* 80CCD(1B) */}
          <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5">
            <label className="font-bold text-main block uppercase text-[10px]">Sec 80CCD(1B) NPS (₹)</label>
            <input
              type="number"
              max={50000}
              value={sec80ccd1b}
              onChange={(e) => setSec80ccd1b(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="50000"
              className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="text-[10px] text-muted block">Extra NPS Deduction (₹50k)</span>
          </div>

          {/* 24b */}
          <div className="space-y-1.5 bg-surface p-3.5 rounded-xl border border-black/5">
            <label className="font-bold text-main block uppercase text-[10px]">Sec 24b Home Loan Int. (₹)</label>
            <input
              type="number"
              max={200000}
              value={sec24b}
              onChange={(e) => setSec24b(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full bg-card-bg border border-black/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-main focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="text-[10px] text-muted block">Max Deduction: ₹2.0 Lakhs</span>
          </div>
        </div>
      </Card>

      {/* TAILORED RECOMMENDATIONS */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-3">
        <h3 className="text-base font-extrabold text-main">Prof. Shelly's Tax Optimization Action Points</h3>
        <div className="space-y-2">
          {taxData?.recommendations?.map((rec: string, idx: number) => (
            <div key={idx} className="bg-surface p-3.5 rounded-xl border border-black/5 flex items-start space-x-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium text-main leading-relaxed">{rec}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

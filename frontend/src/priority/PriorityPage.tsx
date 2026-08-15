import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { GlossaryTerm } from '../components/GlossaryTerm';
import { fetchWithAuth } from '../api/config';
import {
  ListOrdered,
  AlertOctagon,
} from 'lucide-react';

interface PriorityItem {
  rank: number;
  type: string;
  title: string;
  formatted_amount: string;
  monthly_amount: number;
  reasoning: string;
  payoff_timeline_months?: number;
  emergency_fund_current?: number;
  emergency_fund_target?: number;
  emergency_fund_months_covered?: number;
  apr_vs_return_comparison?: string;
  insurance_type?: string;
}

export const PriorityPage: React.FC = () => {
  const [priorityData, setPriorityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPriorityPlan = async () => {
    setIsLoading(true);
    try {
      let localDebts: any[] = [];
      const savedDebtsStr = localStorage.getItem('user_active_debts_v1');
      if (savedDebtsStr) {
        try {
          localDebts = JSON.parse(savedDebtsStr);
        } catch (e) {}
      }

      let sal = 100000;
      let exp = 40000;
      let sav = 100000;
      let hasHealthIns = false;
      let hasTermLifeIns = false;
      let age = 32;

      const profileRes = await fetchWithAuth('/api/profile/me');
      if (profileRes.ok) {
        const prof = await profileRes.json();
        if (prof.salary) sal = prof.salary;
        if (prof.expenses) exp = prof.expenses;
        if (prof.savings) sav = prof.savings;
        if (prof.health_insurance !== undefined) hasHealthIns = prof.health_insurance;
        if (prof.term_life_insurance !== undefined) hasTermLifeIns = prof.term_life_insurance;
        if (prof.age) age = prof.age;
      }

      const payload: any = {
        monthly_income: sal,
        monthly_expenses: exp,
        current_savings: sav,
        has_dependents: true,
        has_health_insurance: hasHealthIns,
        has_term_life_insurance: hasTermLifeIns,
        user_age: age,
      };

      if (localDebts.length > 0) {
        payload.debts = localDebts.map((d: any) => ({
          id: d.id,
          debt_name: d.debt_name || d.name || 'Loan',
          balance: Number(d.balance) || 0,
          apr: Number(d.apr) || 14.0,
          minimum_payment: Number(d.minimum_payment) || 0,
        }));
      }

      const res = await fetchWithAuth('/api/engine/calculate-priority', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setPriorityData(data);
      }
    } catch (err) {
      console.error('Failed to fetch priority plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPriorityPlan();

    const handleProfileUpdate = () => {
      fetchPriorityPlan();
    };

    window.addEventListener('finverse_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('finverse_profile_updated', handleProfileUpdate);
  }, []);

  const hasCriticalDeficit = priorityData?.has_critical_deficit;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Phase 5 Output Engine
          </div>
          <h1 className="text-3xl font-extrabold text-main tracking-tight">
            Priority Action Engine
          </h1>
          <p className="text-sm text-muted">
            Single ranked monthly action list driven by exact computed surplus, <GlossaryTerm term="toxic debt">toxic debt</GlossaryTerm> avalanche, and <GlossaryTerm term="emergency fund">emergency fund</GlossaryTerm> coverage.
          </p>
        </div>

        <div className="bg-surface border border-black/10 px-4 py-2 rounded-2xl text-xs font-mono text-right self-start sm:self-auto">
          <span className="text-muted block text-[10px]">Monthly Investment Surplus</span>
          <span className="font-bold text-main text-sm">
            ₹{Number(priorityData?.surplus_details?.computed_monthly_surplus || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Prominent Red Deficit Alert (Rank #1 when surplus < min dues) */}
      {hasCriticalDeficit && (
        <div className="bg-warning/10 border-2 border-warning/40 text-main p-6 rounded-card shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center space-x-2 text-warning font-black text-lg">
            <AlertOctagon className="w-6 h-6 flex-shrink-0" />
            <span>CRITICAL DEFICIT ALERT — Surplus Below Minimum Dues</span>
          </div>

          <p className="text-xs text-main font-semibold leading-relaxed">
            Your computed monthly surplus of{' '}
            <span className="font-bold font-mono text-warning">
              ₹{Number(priorityData.surplus_details.computed_monthly_surplus).toLocaleString('en-IN')}
            </span>{' '}
            is insufficient to cover your required minimum debt payments of{' '}
            <span className="font-bold font-mono text-warning">
              ₹{Number(priorityData.surplus_details.total_minimum_dues).toLocaleString('en-IN')}
            </span>{' '}
            (Deficit: <span className="font-extrabold font-mono text-warning">₹{Number(priorityData.surplus_details.deficit_amount).toLocaleString('en-IN')}</span>).
          </p>

          <div className="bg-card-bg/80 p-4 rounded-xl border border-warning/20 text-xs font-semibold text-main space-y-1">
            <span className="font-bold text-warning uppercase tracking-wider block">Immediate Recovery Steps:</span>
            <ul className="list-disc list-inside space-y-1 text-muted">
              <li>Temporarily halt all discretionary spending and investments.</li>
              <li>Contact lenders immediately to request temporary EMI restructuring or moratorium.</li>
              <li>Prioritize non-discretionary essential minimum payments to protect your <GlossaryTerm term="CIBIL score">CIBIL score</GlossaryTerm>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="p-12 text-center text-muted font-semibold text-sm bg-card-bg rounded-card border border-black/5 animate-pulse">
          Generating ranked monthly priority action list...
        </div>
      )}

      {/* Ranked Action List */}
      {!isLoading && priorityData?.actions && (
        <div className="space-y-4">
          <h2 className="text-xl font-extrabold text-main tracking-tight flex items-center space-x-2">
            <ListOrdered className="w-5 h-5 text-primary" />
            <span>Numbered Monthly Action List</span>
          </h2>

          <div className="space-y-4">
            {priorityData.actions.map((action: PriorityItem) => (
              <Card
                key={action.rank}
                className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-4 transition-all hover:border-primary/20"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-primary text-white font-black text-sm flex items-center justify-center">
                      #{action.rank}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-main">{action.title}</h3>
                      <span className="text-xs font-mono text-muted uppercase">
                        Category: {action.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-primary font-mono tabular-nums">
                      {action.formatted_amount}
                    </div>
                    {action.payoff_timeline_months && (
                      <div className="text-[11px] text-muted font-semibold">
                        Estimated Payoff: {action.payoff_timeline_months} Months
                      </div>
                    )}
                  </div>
                </div>

                {/* Reasoning Sentence */}
                <p className="text-xs text-main font-semibold leading-relaxed bg-surface p-4 rounded-xl border border-black/5">
                  <span className="font-extrabold text-primary mr-1">Engine Guidance:</span>
                  {action.reasoning}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

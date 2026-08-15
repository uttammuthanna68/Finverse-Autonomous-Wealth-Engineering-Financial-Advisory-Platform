import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { fetchWithAuth } from '../api/config';
import { OnboardingData } from './types';
import { CheckCircle2, AlertTriangle, RefreshCw, Sparkles, Shield, TrendingUp, IndianRupee, Layers } from 'lucide-react';
import { ShellyMascot } from '../components/ShellyMascot';

interface RecommendationViewProps {
  data: OnboardingData;
  onNavigate: (path: string) => void;
  onReset?: () => void;
}

export const RecommendationView: React.FC<RecommendationViewProps> = ({ data, onNavigate }) => {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetchWithAuth('/api/engine/generate-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          financial_data: {
            age: data.age,
            salary: data.monthly_salary,
            expenses: data.monthly_expenses,
            savings: data.current_savings,
            employment_type: data.employment_type,
            dependents: data.dependents,
            cibil_band: data.cibil_band,
            debts_count: data.debts.length,
            goals_count: data.goals.length,
          },
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        setRecommendations(resData.recommendations);
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Calculation engine response failed.');
      }
    } catch (err: any) {
      setError("We saved your info, but couldn't generate recommendations — retry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center space-y-4 shadow-card rounded-card border border-black/5 bg-card-bg">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-main">Generating Recommendations...</h2>
            <p className="text-xs text-muted">
              Running risk allocation, debt payoff priority, and emergency liquidity engines based on your saved onboarding data.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <Card className="p-8 max-w-lg w-full text-center space-y-6 shadow-card rounded-card border border-warning/20 bg-warning/5">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-main">Onboarding Data Saved</h2>
            <p className="text-xs font-semibold text-warning leading-relaxed">{error}</p>
            <p className="text-xs text-muted">
              Your onboarding responses have been saved securely. Click retry to re-trigger the recommendation engine calculation.
            </p>
          </div>

          <div className="flex justify-center space-x-3 pt-2">
            <button
              onClick={generateRecommendations}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Engine Call</span>
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Shelly Congratulations Callout Banner */}
      <div className="bg-card-bg p-5 rounded-card border border-primary/20 shadow-sm flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
        <ShellyMascot pose="happy" size="md" animateFloat={true} className="flex-shrink-0" />
        <div className="space-y-1 text-center sm:text-left">
          <h2 className="text-base font-extrabold text-main">Onboarding Complete! 🎉 Great Job!</h2>
          <p className="text-xs text-muted font-medium leading-relaxed">
            Here is your custom risk allocation and emergency reserve breakdown. Click below to pick a portfolio strategy aligned with your targets!
          </p>
        </div>
      </div>
      
      {/* Clean Financial Action Strategy Header Card */}
      <Card className="p-6 bg-card-bg shadow-card rounded-card border border-black/5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-extrabold border border-primary/20 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personalized Strategy Ready</span>
            </div>
            <h1 className="text-2xl font-black text-main tracking-tight">Your Financial Action Strategy</h1>
            <p className="text-xs text-muted font-medium">
              Engine calculations completed using your financial parameters & <strong className="text-emerald-600 dark:text-emerald-400">Live Market Data Feeds</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onNavigate('/portfolios')}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold py-3 px-6 rounded-2xl text-xs shadow-md flex items-center space-x-2 transition-all hover:scale-105"
            >
              <Layers className="w-4 h-4" />
              <span>Pick a Portfolio That Suits You →</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Recommendations Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-3 shadow-card rounded-card border border-black/5 bg-card-bg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Emergency Reserve</span>
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-main">
            {recommendations?.emergency_fund_months || 6} Months
          </div>
          <p className="text-xs text-muted">Target liquidity buffer for fixed expenses</p>
        </Card>

        <Card className="p-6 space-y-3 shadow-card rounded-card border border-black/5 bg-card-bg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Equity Allocation</span>
            <TrendingUp className="w-5 h-5 text-data-accent" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-main">
            {recommendations?.equity_allocation_percent || 70}%
          </div>
          <p className="text-xs text-muted">Recommended long-term growth asset mix</p>
        </Card>

        <Card className="p-6 space-y-3 shadow-card rounded-card border border-black/5 bg-card-bg">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Debt Allocation</span>
            <IndianRupee className="w-5 h-5 text-success" />
          </div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-main">
            {recommendations?.debt_allocation_percent || 30}%
          </div>
          <p className="text-xs text-muted">Fixed income & debt instrument split</p>
        </Card>
      </div>

      {/* Primary Priority Action & Navigation Footer */}
      <Card className="p-6 space-y-4 shadow-card rounded-card border border-black/5 bg-card-bg">
        <div className="flex items-center space-x-2 border-b border-black/5 pb-3">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <h2 className="text-lg font-bold text-main">Top Strategic Priority</h2>
        </div>

        <p className="text-sm font-semibold text-main leading-relaxed bg-surface p-4 rounded-xl border border-black/5">
          {recommendations?.priority_action || 'Accelerate emergency reserve accumulation while maintaining active insurance coverages.'}
        </p>

        <div className="flex justify-end items-center gap-4 pt-2 border-t border-black/5">
          <button
            onClick={() => onNavigate('/portfolios')}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-extrabold py-3 px-6 rounded-xl text-xs shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <Layers className="w-4 h-4" />
            <span>Pick a Portfolio That Suits You →</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

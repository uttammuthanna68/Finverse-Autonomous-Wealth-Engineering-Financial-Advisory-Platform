import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { fetchWithAuth } from '../api/config';
import { OnboardingData } from './types';

import { Step1BasicInfo } from './Step1BasicInfo';
import { Step2Employment } from './Step2Employment';
import { Step3Insurance } from './Step3Insurance';
import { Step4Debts } from './Step4Debts';
import { Step5Cibil } from './Step5Cibil';
import { Step6Goals } from './Step6Goals';
import { RecommendationView } from './RecommendationView';


import { Edit3, RotateCcw } from 'lucide-react';
import { showShellyToast } from '../components/ShellyToast';

interface OnboardingPageProps {
  onNavigate: (path: string) => void;
}

const DEFAULT_INITIAL_DATA: OnboardingData = {
  age: 30,
  monthly_salary: 100000,
  monthly_expenses: 40000,
  current_savings: 250000,
  employment_type: 'salaried-private',
  dependents: 0,
  health_insurance: true,
  health_insurance_cover: 500000,
  term_life_insurance: false,
  term_life_insurance_cover: '',
  debts: [],
  cibil_band: 'Good (700-749)',
  goals: [
    {
      id: 'default_emergency',
      name: 'Emergency Fund',
      target_amount: 300000,
      target_date: '2028-12-31',
      priority: 'High',
    },
  ],
};

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, refetchUser } = useAuth();

  const storageKeyStep = user ? `onboarding_current_step_${user.id}` : 'onboarding_current_step';
  const storageKeyData = user ? `onboarding_form_data_${user.id}` : 'onboarding_form_data';

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = localStorage.getItem(storageKeyStep);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [lastStepBeforeEdit, setLastStepBeforeEdit] = useState<number | null>(null);

  const [formData, setFormData] = useState<OnboardingData>(() => {
    const savedData = localStorage.getItem(storageKeyData);
    return savedData ? JSON.parse(savedData) : DEFAULT_INITIAL_DATA;
  });

  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('/login');
      return;
    }

    // Hydrate existing profile data from backend if available
    const loadProfileData = async () => {
      try {
        const res = await fetchWithAuth('/api/profile/me');
        if (res.ok) {
          const prof = await res.json();
          setFormData((prev) => {
            const hasCustomized = localStorage.getItem(storageKeyData);
            if (hasCustomized) return prev; // Preserve active local draft if user edited

            return {
              ...prev,
              age: prof.age || prev.age,
              monthly_salary: prof.salary || prev.monthly_salary,
              monthly_expenses: prof.expenses || prev.monthly_expenses,
              current_savings: prof.savings || prev.current_savings,
              employment_type: prof.employment_type || prev.employment_type,
              dependents: prof.dependents ?? prev.dependents,
              health_insurance: prof.health_insurance ?? prev.health_insurance,
              term_life_insurance: prof.term_life_insurance ?? prev.term_life_insurance,
            };
          });
        }
      } catch (err) {
        console.warn('Could not fetch existing profile for onboarding hydration:', err);
      }
    };

    loadProfileData();
  }, [isAuthenticated, user?.id]);

  // Persist form state locally for instant tab resumability
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(storageKeyStep, currentStep.toString());
      localStorage.setItem(storageKeyData, JSON.stringify(formData));
    }
  }, [currentStep, formData, storageKeyStep, storageKeyData, user?.id]);

  const updateFormData = (fields: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const saveStepData = async (stepNumber: number) => {
    const stepIds: Record<number, string> = {
      1: 'step_1_basic_info',
      2: 'step_2_employment',
      3: 'step_3_insurance',
      4: 'step_4_debts',
      5: 'step_5_cibil',
      6: 'step_6_goals',
    };

    const stepId = stepIds[stepNumber] || `step_${stepNumber}`;
    
    // Extract step specific slice of data for payload
    const stepPayloadMap: Record<number, any> = {
      1: { age: formData.age, monthly_salary: formData.monthly_salary, monthly_expenses: formData.monthly_expenses, current_savings: formData.current_savings },
      2: { employment_type: formData.employment_type, dependents: formData.dependents },
      3: { health_insurance: formData.health_insurance, health_insurance_cover: formData.health_insurance_cover, term_life_insurance: formData.term_life_insurance, term_life_insurance_cover: formData.term_life_insurance_cover },
      4: { debts: formData.debts },
      5: { cibil_band: formData.cibil_band },
      6: { goals: formData.goals },
    };

    try {
      await fetchWithAuth('/api/onboarding/save-step', {
        method: 'POST',
        body: JSON.stringify({
          step_id: stepId,
          step_data: stepPayloadMap[stepNumber] || {},
        }),
      });

      const isFinalStep = stepNumber >= 6;

      // Always sync updated profile parameters to backend FinancialProfile DB
      await fetchWithAuth('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify({
          age: formData.age || 30,
          salary: formData.monthly_salary || 0,
          expenses: formData.monthly_expenses || 0,
          savings: formData.current_savings || 0,
          employment_type: formData.employment_type || 'salaried-private',
          dependents: formData.dependents || 0,
          health_insurance: formData.health_insurance || false,
          term_life_insurance: formData.term_life_insurance || false,
          has_completed_onboarding: isFinalStep ? true : undefined,
        }),
      });

      await refetchUser();
      window.dispatchEvent(new CustomEvent('finverse_profile_updated'));

      if (isFinalStep) {
        showShellyToast({
          title: 'Onboarding Completed! 🎉',
          message: 'Personalized strategy generated! Pick a portfolio that suits your goals.',
          pose: 'happy',
        });
      } else {
        showShellyToast({
          title: 'Step Saved! 💾',
          message: `Step ${stepNumber} responses saved securely. Keep going!`,
          pose: 'confident',
        });
      }
    } catch (err) {
      showShellyToast({
        title: 'Save Warning',
        message: 'Saved locally. We will retry syncing with server.',
        pose: 'thinking',
      });
    }
  };

  const handleNextStep = async () => {
    await saveStepData(currentStep);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleReset = () => {
    // Default lastStepBeforeEdit to 7 (Recommendations strategy view) if currently on steps 1-6
    const targetBeforeEdit = currentStep >= 6 ? currentStep : 7;
    setLastStepBeforeEdit(targetBeforeEdit);
    setCurrentStep(1);
    showShellyToast({
      title: 'Editing Profile Parameters ✏️',
      message: 'Modify your salary, expenses or age below. Click "Back to Recommendations" anytime to return.',
      pose: 'explaining',
    });
  };

  const handleReturnToResults = () => {
    const returnTarget = (lastStepBeforeEdit && lastStepBeforeEdit > 1) ? lastStepBeforeEdit : 7;
    setCurrentStep(returnTarget);
    showShellyToast({
      title: 'Welcome Back! 📈',
      message: 'Here are your updated recommendations and financial priorities.',
      pose: 'happy',
    });
  };

  const stepsList = [
    { num: 1, label: 'Basic Info' },
    { num: 2, label: 'Employment' },
    { num: 3, label: 'Insurance' },
    { num: 4, label: 'Debts' },
    { num: 5, label: 'CIBIL Band' },
    { num: 6, label: 'Goals' },
  ];

  const showReturnButton = currentStep < 7;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top User Profile Summary Bar & Big Edit Profile / Return Button */}
      <div className="bg-card-bg p-5 rounded-card border border-black/5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-main">{user?.full_name || 'Finverse Profile User'}</h2>
                {user?.email && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {user.email}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-medium">Active Financial Profile Parameters</p>
            </div>
          </div>

          {/* Action Buttons: BIG Edit Profile Button & Return/Undo Button */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {showReturnButton && (
              <button
                onClick={handleReturnToResults}
                className="bg-primary/10 hover:bg-primary/20 text-primary font-black px-4 py-2.5 rounded-2xl text-xs border border-primary/30 flex items-center space-x-1.5 transition-all shadow-xs hover:scale-105"
                title="Cancel editing and return directly to recommendations strategy"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>← Back to Final Strategy</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs shadow-md flex items-center space-x-2 transition-all hover:scale-105 border border-white/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile Parameters</span>
            </button>
          </div>
        </div>

        {/* Filled Parameters Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="bg-surface p-2.5 rounded-xl border border-black/5">
            <span className="text-[10px] text-muted font-bold block uppercase">Age</span>
            <span className="font-extrabold text-main font-mono">{formData.age || 30} Yrs</span>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-black/5">
            <span className="text-[10px] text-muted font-bold block uppercase">Monthly Inflow</span>
            <span className="font-extrabold text-main font-mono">₹{Number(formData.monthly_salary || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-black/5">
            <span className="text-[10px] text-muted font-bold block uppercase">Monthly Outflow</span>
            <span className="font-extrabold text-main font-mono">₹{Number(formData.monthly_expenses || 0).toLocaleString('en-IN')}</span>
          </div>

          <div className="bg-surface p-2.5 rounded-xl border border-black/5">
            <span className="text-[10px] text-muted font-bold block uppercase">Current Savings</span>
            <span className="font-extrabold text-main font-mono">₹{Number(formData.current_savings || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      {currentStep <= 6 && (
        <div className="space-y-4 bg-card-bg p-6 rounded-card border border-black/5 shadow-sm">
          <div className="flex justify-between items-center text-xs font-bold text-main uppercase tracking-wider">
            <span>Financial Onboarding Progress</span>
            <span className="text-primary font-mono">Step {currentStep} of 6</span>
          </div>

          <div className="grid grid-cols-6 gap-2">
            {stepsList.map((st) => (
              <div key={st.num} className="space-y-1 text-center">
                <div
                  className={`h-2 rounded-full transition-all ${
                    st.num < currentStep
                      ? 'bg-success'
                      : st.num === currentStep
                      ? 'bg-primary'
                      : 'bg-surface border border-black/10'
                  }`}
                />
                <span
                  className={`text-[10px] hidden sm:block truncate ${
                    st.num === currentStep ? 'font-extrabold text-primary' : 'text-muted'
                  }`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Render Switcher */}
      {currentStep === 1 && (
        <Step1BasicInfo
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onCancelEdit={handleReturnToResults}
        />
      )}

      {currentStep === 2 && (
        <Step2Employment
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
        />
      )}

      {currentStep === 3 && (
        <Step3Insurance
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
        />
      )}

      {currentStep === 4 && (
        <Step4Debts
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
        />
      )}

      {currentStep === 5 && (
        <Step5Cibil
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
        />
      )}

      {currentStep === 6 && (
        <Step6Goals
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNextStep}
          onPrev={handlePrevStep}
        />
      )}

      {currentStep > 6 && (
        <RecommendationView data={formData} onNavigate={onNavigate} onReset={handleReset} />
      )}
    </div>
  );
};

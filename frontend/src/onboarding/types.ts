export type EmploymentType = 'salaried-govt' | 'salaried-private' | 'self-employed' | 'business-owner';

export type CibilBand = 'No CIBIL (New to Credit)' | 'Poor (<650)' | 'Fair (650-699)' | 'Good (700-749)' | 'Excellent (750+)';

export type DebtType = 'credit_card' | 'personal_loan' | 'education_loan' | 'auto_loan' | 'home_loan' | 'other';

export interface DebtItem {
  id: string;
  debt_type: DebtType;
  balance: number | '';
  apr: number | '';
  minimum_payment: number | '';
}

export type GoalPriority = 'High' | 'Medium' | 'Low';

export interface GoalItem {
  id: string;
  name: string;
  target_amount: number | '';
  target_date?: string;
  priority: GoalPriority;
  is_mandatory?: boolean;
  current_amount?: number | '';
  category?: string;
}

export interface OnboardingData {
  // Step 1: Basic Info
  age: number | '';
  monthly_salary: number | '';
  monthly_expenses: number | '';
  current_savings: number | '';

  // Step 2: Employment & Dependents
  employment_type: EmploymentType;
  dependents: number | '';

  // Step 3: Insurance
  health_insurance: boolean;
  health_insurance_cover: number | '';
  term_life_insurance: boolean;
  term_life_insurance_cover: number | '';

  // Step 4: Debts
  debts: DebtItem[];

  // Step 5: CIBIL Score
  cibil_band: CibilBand;

  // Step 6: Goals
  goals: GoalItem[];
}

export const CATEGORY_DEFAULT_APRS: Record<DebtType, { defaultApr: number; label: string }> = {
  credit_card: { defaultApr: 36.0, label: 'Credit Card (Typ. 36% APR)' },
  personal_loan: { defaultApr: 14.0, label: 'Personal Loan (Typ. 14% APR)' },
  education_loan: { defaultApr: 10.0, label: 'Education Loan (Typ. 10% APR)' },
  auto_loan: { defaultApr: 9.0, label: 'Auto Loan (Typ. 9% APR)' },
  home_loan: { defaultApr: 8.5, label: 'Home Loan (Typ. 8.5% APR)' },
  other: { defaultApr: 12.0, label: 'Other Debt (Typ. 12% APR)' },
};

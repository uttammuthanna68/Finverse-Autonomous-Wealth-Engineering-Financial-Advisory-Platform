from typing import Dict, Any, List, Optional
from backend.engine.config import (
    AGE_WEIGHT,
    INCOME_WEIGHT,
    SAVINGS_BUFFER_WEIGHT,
    LONG_TERM_DEBT_WEIGHT,
    EMPLOYMENT_MODIFIERS,
    DEPENDENT_DEDUCTION_PER_PERSON,
    MAX_DEPENDENT_DEDUCTION,
    HIGH_UTILIZATION_PENALTY_MAX,
    INCOME_BANDS,
)
from backend.engine.debt import calculate_credit_card_utilization

def calculate_risk_score(
    age: int,
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    total_debt_balance: float,
    employment_type: str = "salaried-private",
    dependents: int = 0,
    credit_cards: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Computes a continuous risk capacity score (0-100) based on financial factors,
    demographics, employment stability, and a distinct short-term liquidity modifier.
    """
    age = max(18, min(100, int(age)))
    monthly_income = max(0.0, float(monthly_income))
    monthly_expenses = max(0.0, float(monthly_expenses))
    current_savings = max(0.0, float(current_savings))
    total_debt_balance = max(0.0, float(total_debt_balance))
    annual_income = monthly_income * 12.0

    # 1. Age Factor (Younger = higher capacity)
    # Age 20 or under = 1.0 ratio; Age 65 or older = 0.0 ratio
    if age <= 20:
        age_ratio = 1.0
    elif age >= 65:
        age_ratio = 0.0
    else:
        age_ratio = (65.0 - age) / (65.0 - 20.0)
    age_score = age_ratio * AGE_WEIGHT

    # 2. Income Capacity Factor
    if annual_income <= 0:
        income_ratio = 0.0
    elif annual_income >= INCOME_BANDS["tier3_high"]:
        income_ratio = 1.0
    else:
        income_ratio = annual_income / INCOME_BANDS["tier3_high"]
    income_score = income_ratio * INCOME_WEIGHT

    # 3. Savings Buffer Factor (savings / 6x monthly expenses, capped at 1.0)
    required_6x = (6.0 * monthly_expenses) if monthly_expenses > 0 else 1.0
    savings_ratio = min(1.0, current_savings / required_6x)
    savings_score = savings_ratio * SAVINGS_BUFFER_WEIGHT

    # 4. Long-Term Debt Factor (Inverse of Debt-to-Annual-Income ratio)
    if annual_income > 0:
        dti = total_debt_balance / annual_income
        debt_ratio = max(0.0, 1.0 - (dti / 2.0))  # DTI >= 2.0 results in 0 factor
    else:
        debt_ratio = 0.0 if total_debt_balance > 0 else 1.0
    debt_score = debt_ratio * LONG_TERM_DEBT_WEIGHT

    # Base Score (0-100 sum of 4 base factors)
    base_score = age_score + income_score + savings_score + debt_score

    # 5. Employment Stability Modifier
    emp_key = str(employment_type or "").lower().strip()
    employment_modifier = EMPLOYMENT_MODIFIERS.get(emp_key, 0.0)

    # 6. Dependents Modifier (each dependent reduces score)
    dep_deduction = min(MAX_DEPENDENT_DEDUCTION, float(dependents) * DEPENDENT_DEDUCTION_PER_PERSON)
    dependents_modifier = -dep_deduction

    # 7. Short-Term Liquidity Modifier (using Phase 3 Credit Utilization signal)
    card_util_info = calculate_credit_card_utilization(credit_cards or [])
    max_util_ratio = card_util_info["max_utilization_ratio"]

    if max_util_ratio > 0.30:
        # High utilization penalty scales from 0% at 30% util to max penalty at 100% util
        util_penalty_factor = (max_util_ratio - 0.30) / (1.0 - 0.30)
        short_term_liquidity_modifier = -round(util_penalty_factor * HIGH_UTILIZATION_PENALTY_MAX, 2)
    else:
        short_term_liquidity_modifier = 0.0

    # Total Score Calculation (Clamped to 0.0 - 100.0)
    raw_final_score = base_score + employment_modifier + dependents_modifier + short_term_liquidity_modifier
    final_score = round(max(0.0, min(100.0, raw_final_score)), 2)

    # Risk Tolerance Label Assignment
    if final_score < 40.0:
        label = "Conservative"
    elif final_score <= 70.0:
        label = "Moderate"
    else:
        label = "Aggressive"

    return {
        "risk_score": final_score,
        "risk_label": label,
        "base_score": round(base_score, 2),
        "factors": {
            "age_score": round(age_score, 2),
            "income_score": round(income_score, 2),
            "savings_score": round(savings_score, 2),
            "debt_score": round(debt_score, 2),
            "employment_modifier": employment_modifier,
            "dependents_modifier": dependents_modifier,
            "short_term_liquidity_modifier": short_term_liquidity_modifier,
        },
        "card_utilization_summary": card_util_info,
    }

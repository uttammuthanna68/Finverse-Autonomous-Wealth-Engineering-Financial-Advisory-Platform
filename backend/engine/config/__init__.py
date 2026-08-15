# Shared Engine Configuration Parameters

TOXIC_APR_THRESHOLD = 24.0  # APR > 24% classified as toxic debt
EMERGENCY_MONTHS_STANDARD = 6.0  # Standard emergency fund target (6x monthly expenses)
EMERGENCY_MONTHS_TOXIC = 1.0     # Shrunk emergency fund target when toxic debt exists (1x)
HIGH_UTILIZATION_THRESHOLD = 0.30 # Credit card utilization > 30% flags high utilization

# Risk Scoring Weightings (Sum to 100 base points)
AGE_WEIGHT = 25.0
INCOME_WEIGHT = 25.0
SAVINGS_BUFFER_WEIGHT = 25.0
LONG_TERM_DEBT_WEIGHT = 25.0

# Employment Stability Modifiers (Score points)
EMPLOYMENT_MODIFIERS = {
    "salaried-govt": 5.0,
    "salaried-private": 0.0,
    "self-employed": -5.0,
    "business-owner": -3.0,
}

# Per-dependent Deduction (Score points)
DEPENDENT_DEDUCTION_PER_PERSON = 3.0
MAX_DEPENDENT_DEDUCTION = 15.0

# Short-term Liquidity Utilization Penalty (Score points)
HIGH_UTILIZATION_PENALTY_MAX = 10.0

# Income Reference Bands (Annual INR)
INCOME_BANDS = {
    "tier1_low": 300000.0,
    "tier2_mid": 1200000.0,
    "tier3_high": 3600000.0,
}

# Sub-Asset Class Ratios by Risk Score Band
EQUITY_SUB_SPLITS = {
    "Conservative": {"large_cap": 0.70, "mid_cap": 0.20, "small_cap": 0.00, "international": 0.10},
    "Moderate": {"large_cap": 0.50, "mid_cap": 0.25, "small_cap": 0.15, "international": 0.10},
    "Aggressive": {"large_cap": 0.35, "mid_cap": 0.30, "small_cap": 0.20, "international": 0.15},
}

DEBT_SUB_SPLITS = {
    "Liquid": 0.40,
    "Short Duration": 0.40,
    "Corporate Bond": 0.20,
}

GOLD_ALLOCATION_PERCENT = {
    "Conservative": 10.0,
    "Moderate": 7.5,
    "Aggressive": 5.0,
}

def get_expected_investment_return(risk_score: float = 50.0) -> float:
    """
    Shared helper function returning projected annual investment return (%)
    based on user risk score (0-100 scale).
    Shared between debt engine (Phase 3) and asset allocation engine (Phase 4).
    """
    clamped_score = max(0.0, min(100.0, float(risk_score)))
    base_return = 7.5 + (clamped_score / 100.0) * 6.5
    return round(base_return, 2)

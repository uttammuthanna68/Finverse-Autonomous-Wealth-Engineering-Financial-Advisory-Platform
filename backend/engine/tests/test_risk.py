import pytest
from backend.engine.risk import calculate_risk_score

def test_risk_score_known_input_moderate():
    """Test standard moderate user profile (age 30, moderate income, 6x savings)."""
    res = calculate_risk_score(
        age=30,
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=240000.0, # 6x expenses
        total_debt_balance=0.0,
        employment_type="salaried-private",
        dependents=0,
        credit_cards=[],
    )

    assert 0.0 <= res["risk_score"] <= 100.0
    assert res["risk_label"] in ["Moderate", "Aggressive"]
    assert res["factors"]["savings_score"] == 25.0  # Full savings score (6x)
    assert res["factors"]["debt_score"] == 25.0     # Full debt score (0 debt)

def test_risk_score_edge_case_age_65_plus():
    """Test age 65+ edge case (Age factor ratio is 0.0)."""
    res_65 = calculate_risk_score(
        age=65,
        monthly_income=50000.0,
        monthly_expenses=30000.0,
        current_savings=180000.0,
        total_debt_balance=0.0,
    )

    res_70 = calculate_risk_score(
        age=70,
        monthly_income=50000.0,
        monthly_expenses=30000.0,
        current_savings=180000.0,
        total_debt_balance=0.0,
    )

    # Age score for age >= 65 is 0.0
    assert res_65["factors"]["age_score"] == 0.0
    assert res_70["factors"]["age_score"] == 0.0

def test_risk_score_edge_case_debt_exceeding_income():
    """Test debt exceeding annual income (DTI >= 2.0)."""
    res = calculate_risk_score(
        age=30,
        monthly_income=50000.0, # Annual = 600,000
        monthly_expenses=30000.0,
        current_savings=50000.0,
        total_debt_balance=1500000.0, # DTI = 2.5 (>= 2.0)
    )

    assert res["factors"]["debt_score"] == 0.0

def test_risk_score_edge_case_zero_savings():
    """Test zero savings edge case."""
    res = calculate_risk_score(
        age=25,
        monthly_income=80000.0,
        monthly_expenses=40000.0,
        current_savings=0.0,
        total_debt_balance=0.0,
    )

    assert res["factors"]["savings_score"] == 0.0

def test_risk_score_short_term_liquidity_credit_utilization_modifier():
    """
    Test short-term liquidity modifier:
    Credit card utilization > 30% applies penalty separate from long-term debt ratio.
    """
    cards_low_util = [{"card_name": "Card A", "balance": 10000.0, "credit_limit": 100000.0}] # 10%
    cards_high_util = [{"card_name": "Card B", "balance": 90000.0, "credit_limit": 100000.0}] # 90%

    res_low = calculate_risk_score(
        age=30,
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=200000.0,
        total_debt_balance=0.0,
        credit_cards=cards_low_util,
    )

    res_high = calculate_risk_score(
        age=30,
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=200000.0,
        total_debt_balance=0.0,
        credit_cards=cards_high_util,
    )

    assert res_low["factors"]["short_term_liquidity_modifier"] == 0.0
    assert res_high["factors"]["short_term_liquidity_modifier"] < 0.0
    assert res_high["risk_score"] < res_low["risk_score"]

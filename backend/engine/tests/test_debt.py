import pytest
from backend.engine.debt import (
    classify_debt,
    calculate_debt_waterfall,
    calculate_credit_card_utilization,
    generate_cibil_nudges,
)
from backend.engine.config import TOXIC_APR_THRESHOLD, get_expected_investment_return

def test_classify_debt():
    assert classify_debt(36.0) == "toxic"
    assert classify_debt(24.5) == "toxic"
    assert classify_debt(24.0) == "manageable"
    assert classify_debt(8.5) == "manageable"

def test_scenario_1_only_toxic_debt():
    """
    Test user with ONLY toxic debt (e.g. Credit Card at 36% APR).
    - Emergency target shrinks from 6x to 1x monthly expenses.
    - Step A pays minimums.
    - Step B directs ALL remaining surplus to highest APR toxic debt (Avalanche).
    """
    income = 100000.0
    expenses = 40000.0  # Surplus = 60,000
    savings = 20000.0
    debts = [
        {"id": "cc1", "debt_name": "High Card", "balance": 50000.0, "apr": 36.0, "minimum_payment": 2500.0}
    ]

    res = calculate_debt_waterfall(income, expenses, savings, debts)

    assert res["has_toxic_debt"] is True
    assert res["emergency_fund_target_months"] == 1.0
    assert res["emergency_fund_target_amount"] == 40000.0  # 1x 40k
    assert res["active_waterfall_step"] == "Step B"

    # Debt allocations
    target_debt = res["debts"][0]
    assert target_debt["classification"] == "toxic"
    # Surplus 60,000 - 2,500 min = 57,500 extra to toxic debt
    assert target_debt["allocated_payment"] == 60000.0
    assert "Step B" in target_debt["reasoning"]

def test_scenario_2_only_manageable_debt():
    """
    Test user with ONLY manageable debt (e.g. Home Loan at 8.5% APR).
    - Emergency target is standard 6x.
    - If emergency fund is incomplete, surplus fills emergency fund first (Step C).
    """
    income = 120000.0
    expenses = 50000.0  # Surplus = 70,000
    savings = 100000.0  # Deficit to 6x (300,000) = 200,000
    debts = [
        {"id": "hl1", "debt_name": "Home Loan", "balance": 2500000.0, "apr": 8.5, "minimum_payment": 25000.0}
    ]

    res = calculate_debt_waterfall(income, expenses, savings, debts, risk_score=50.0)

    assert res["has_toxic_debt"] is False
    assert res["emergency_fund_target_months"] == 6.0
    assert res["emergency_fund_target_amount"] == 300000.0  # 6x 50k
    assert res["active_waterfall_step"] == "Step C"

    # Step A pays 25k min. Remaining 45k surplus goes to emergency fund.
    home_loan = res["debts"][0]
    assert home_loan["allocated_payment"] == 25000.0
    assert res["surplus_for_investment"] == 0.0

def test_scenario_3_both_toxic_and_manageable_debt():
    """
    Test user with BOTH toxic and manageable debt.
    - Toxic debt present -> Emergency target is 1x.
    - Surplus prioritizes toxic debt avalanche first before touching manageable debt.
    """
    income = 150000.0
    expenses = 60000.0  # Surplus = 90,000
    savings = 60000.0   # 1x emergency fund full
    debts = [
        {"id": "cc1", "debt_name": "Credit Card", "balance": 40000.0, "apr": 36.0, "minimum_payment": 2000.0},
        {"id": "pl1", "debt_name": "Personal Loan", "balance": 100000.0, "apr": 14.0, "minimum_payment": 3000.0},
    ]

    res = calculate_debt_waterfall(income, expenses, savings, debts)

    assert res["has_toxic_debt"] is True
    assert res["active_waterfall_step"] == "Step B"

    card = next(d for d in res["debts"] if d["id"] == "cc1")
    personal = next(d for d in res["debts"] if d["id"] == "pl1")

    # Min payments total 5,000. Surplus left 85,000.
    # Toxic card gets 2,000 min + 85,000 surplus = 87,000 total allocation
    assert card["allocated_payment"] == 87000.0
    assert personal["allocated_payment"] == 3000.0

def test_scenario_4_zero_debt():
    """
    Test user with ZERO debt.
    - Emergency target is 6x.
    - Surplus fills emergency fund if incomplete, else goes to investment.
    """
    income = 100000.0
    expenses = 40000.0  # Surplus = 60,000
    savings = 240000.0  # Exactly 6x 40k = 240,000 (Full)
    debts = []

    res = calculate_debt_waterfall(income, expenses, savings, debts, risk_score=50.0)

    assert res["has_toxic_debt"] is False
    assert res["emergency_fund_target_months"] == 6.0
    assert res["emergency_fund_deficit"] == 0.0
    assert res["active_waterfall_step"] == "Step D"
    assert res["surplus_for_investment"] == 60000.0

def test_scenario_5_toxic_debt_with_already_full_emergency_fund():
    """
    TEST REQUIREMENT:
    Toxic debt combined with an ALREADY-FULL emergency fund:
    - Confirm the target actually shrinks to 1x (doesn't just fail to grow).
    - Confirm NO funds are force-withdrawn from an already-larger balance.
    """
    income = 100000.0
    expenses = 40000.0  # Monthly expenses = 40,000
    savings = 240000.0  # Currently has 6x (240,000) saved
    debts = [
        {"id": "cc1", "debt_name": "Toxic Card", "balance": 30000.0, "apr": 36.0, "minimum_payment": 1500.0}
    ]

    res = calculate_debt_waterfall(income, expenses, savings, debts)

    # 1. Target shrinks to 1x (40,000), not 6x (240,000)
    assert res["emergency_fund_target_months"] == 1.0
    assert res["emergency_fund_target_amount"] == 40000.0

    # 2. Existing savings (240,000) remain 100% intact (zero force withdrawal)
    assert res["current_savings"] == 240000.0
    assert res["emergency_fund_deficit"] == 0.0  # No deficit because savings >= 1x target

    # 3. Monthly surplus (60,000) goes to Step B toxic avalanche
    assert res["active_waterfall_step"] == "Step B"
    toxic_card = res["debts"][0]
    assert toxic_card["allocated_payment"] == 60000.0

def test_scenario_6_zero_or_negative_surplus():
    """
    TEST REQUIREMENT:
    User with zero or negative surplus:
    - Confirm no divide-by-zero error.
    - Confirm no infinite loop in the waterfall.
    """
    income = 40000.0
    expenses = 50000.0  # Negative surplus (-10,000) -> clamped to 0.0
    savings = 5000.0
    debts = [
        {"id": "pl1", "debt_name": "Personal Loan", "balance": 100000.0, "apr": 14.0, "minimum_payment": 3000.0},
        {"id": "cc1", "debt_name": "Card", "balance": 20000.0, "apr": 36.0, "minimum_payment": 1000.0},
    ]

    res = calculate_debt_waterfall(income, expenses, savings, debts)

    assert res["monthly_surplus"] == 0.0
    assert res["has_toxic_debt"] is True
    assert res["surplus_for_investment"] == 0.0

    # Min payments total 4,000, but surplus is 0 -> allocated payments are 0.0
    for d in res["debts"]:
        assert d["allocated_payment"] == 0.0
        assert "Warning" in res["waterfall_summary"] or res["monthly_surplus"] == 0.0

def test_cibil_nudges_and_credit_utilization():
    cards = [
        {"card_name": "HDFC Card", "balance": 40000.0, "credit_limit": 100000.0},  # 40% (high)
        {"card_name": "ICICI Card", "balance": 10000.0, "credit_limit": 100000.0}, # 10%
    ]

    util_res = calculate_credit_card_utilization(cards)
    assert util_res["overall_utilization_percent"] == 25.0
    assert util_res["max_utilization_percent"] == 40.0
    assert util_res["has_high_utilization"] is True

    # Test Poor band nudge
    nudges = generate_cibil_nudges("Poor (<650)", cards)
    assert len(nudges) == 1
    assert nudges[0]["persistent"] is True
    assert "HDFC Card" in nudges[0]["contributing_factors"][0]

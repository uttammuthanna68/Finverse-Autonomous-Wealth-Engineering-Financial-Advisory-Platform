import pytest
from backend.engine.priority import generate_priority_action_plan

def test_priority_scenario_1_toxic_debt_prioritized():
    """
    Scenario 1: User has toxic debt (36% APR).
    Confirm Item #1 is minimum dues, and Item #2 is toxic debt avalanche payoff.
    """
    debts = [
        {"id": "cc1", "debt_name": "Credit Card", "balance": 50000.0, "apr": 36.0, "minimum_payment": 2500.0},
        {"id": "hl1", "debt_name": "Home Loan", "balance": 2000000.0, "apr": 8.5, "minimum_payment": 18000.0},
    ]

    res = generate_priority_action_plan(
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=50000.0,
        debts=debts,
    )

    actions = res["priority_action_plan"]
    assert len(actions) >= 2
    assert actions[0]["category"] == "MINIMUM_DEBTS"
    assert actions[1]["category"] == "TOXIC_DEBT_AVALANCHE"
    assert "Credit Card" in actions[1]["title"]
    assert actions[1]["is_toxic"] is True

def test_priority_scenario_2_emergency_fund_fill_after_toxic_cleared():
    """
    Scenario 2: No toxic debt, emergency fund incomplete (<6x).
    Confirm priority shifts to filling emergency reserve.
    """
    debts = [
        {"id": "hl1", "debt_name": "Home Loan", "balance": 2000000.0, "apr": 8.5, "minimum_payment": 18000.0}
    ]

    res = generate_priority_action_plan(
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=50000.0, # Needs 240k for 6x
        debts=debts,
    )

    actions = res["priority_action_plan"]
    categories = [a["category"] for a in actions]
    assert "EMERGENCY_FUND" in categories
    assert "TOXIC_DEBT_AVALANCHE" not in categories

def test_priority_scenario_3_investing_when_emergency_fund_full():
    """
    Scenario 3: Emergency fund is complete (6x) & zero toxic debt.
    Confirm surplus is directed to investment goals.
    """
    goals = [
        {"name": "Retirement", "target_amount": 5000000.0, "target_date": "2035-12-31"}
    ]

    res = generate_priority_action_plan(
        monthly_income=120000.0,
        monthly_expenses=40000.0,
        current_savings=250000.0, # Full (>6x of 40k)
        debts=[],
        goals=goals,
    )

    actions = res["priority_action_plan"]
    categories = [a["category"] for a in actions]
    assert "INVESTMENT_GOAL" in categories
    assert "EMERGENCY_FUND" not in categories

def test_priority_scenario_4_insufficient_surplus_deficit():
    """
    Scenario 4: Surplus is lower than total minimum dues.
    Confirm prominent CRITICAL_DEFICIT alert is generated as #1 item.
    """
    debts = [
        {"id": "d1", "debt_name": "Personal Loan", "balance": 500000.0, "apr": 18.0, "minimum_payment": 25000.0}
    ]

    res = generate_priority_action_plan(
        monthly_income=50000.0,
        monthly_expenses=35000.0, # Surplus = 15,000 < 25,000 min payment
        current_savings=10000.0,
        debts=debts,
    )

    assert res["is_deficit"] is True
    actions = res["priority_action_plan"]
    assert actions[0]["category"] == "CRITICAL_DEFICIT"
    assert actions[0]["is_critical_alert"] is True
    assert "Deficit of ₹10,000.00" in actions[0]["title"]

def test_priority_scenario_5_insurance_gap_warning():
    """
    Scenario 5: User has dependents > 0 and no term life insurance.
    Confirm insurance protection gap warning item is present.
    """
    res = generate_priority_action_plan(
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=240000.0,
        debts=[],
        has_dependents=True,
        dependents_count=2,
        has_term_life_insurance=False,
    )

    actions = res["priority_action_plan"]
    categories = [a["category"] for a in actions]
    assert "INSURANCE_GAP" in categories
    ins_item = next(a for a in actions if a["category"] == "INSURANCE_GAP")
    assert ins_item["is_critical_alert"] is True
    assert "Term Life Insurance" in ins_item["description"]

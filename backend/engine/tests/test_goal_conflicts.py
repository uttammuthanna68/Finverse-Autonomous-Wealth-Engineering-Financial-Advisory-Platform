import pytest
from backend.engine.goal_conflicts import analyze_goal_conflicts
from backend.engine.priority import generate_priority_action_plan

def test_goal_conflict_detection_with_toxic_debt():
    """
    Test scenario: Toxic debt & emergency reserve absorb surplus,
    leaving insufficient investment surplus for active goals.
    """
    # Priority plan with toxic debt
    p_plan = generate_priority_action_plan(
        monthly_income=100000.0,
        monthly_expenses=40000.0,
        current_savings=50000.0,
        debts=[
            {"id": "c1", "debt_name": "Toxic Card", "balance": 100000.0, "apr": 36.0, "minimum_payment": 5000.0}
        ],
        goals=[
            {"name": "Child Education", "target_amount": 2400000.0, "target_date": "2034-12-31"}, # ~8 yrs (96 mos) => ₹25,000/mo
            {"name": "Car Purchase", "target_amount": 600000.0, "target_date": "2029-12-31"},    # ~3.3 yrs (40 mos) => ₹15,000/mo
        ]
    )

    goals = [
        {"name": "Child Education", "target_amount": 2400000.0, "target_date": "2034-12-31"},
        {"name": "Car Purchase", "target_amount": 600000.0, "target_date": "2029-12-31"},
    ]

    res = analyze_goal_conflicts(goals=goals, priority_output=p_plan)

    # Toxic card balance 100k takes min 5k + extra surplus 55k = 60k total (all surplus)
    # Available investment surplus is 0.0
    assert res["has_conflict"] is True
    assert res["available_investment_surplus_inr"] == 0.0
    assert res["total_monthly_shortfall_inr"] > 0.0

    # Verify goals are marked PAUSED_FOR_DEBT_PAYOFF with conflict reasoning
    g_summary = res["goal_conflicts_summary"]
    for g in g_summary:
        assert g["status"] in ["PAUSED_FOR_DEBT_PAYOFF", "DELAYED"]
        assert "paused" in g["conflict_reasoning"].lower() or "delayed" in g["conflict_reasoning"].lower()

def test_no_goal_conflict_when_surplus_sufficient():
    """
    Test scenario: Emergency reserve full and zero toxic debt.
    Investment surplus (₹80,000/mo) is sufficient for all goals.
    """
    p_plan = generate_priority_action_plan(
        monthly_income=140000.0,
        monthly_expenses=40000.0,
        current_savings=250000.0,
        debts=[],
        goals=[
            {"name": "Vacation Fund", "target_amount": 120000.0, "target_date": "2027-12-31"} # ~1.3 yrs (16 mos) => ₹7,500/mo
        ]
    )

    goals = [
        {"name": "Vacation Fund", "target_amount": 120000.0, "target_date": "2027-12-31"}
    ]

    res = analyze_goal_conflicts(goals=goals, priority_output=p_plan)

    assert res["has_conflict"] is False
    assert res["total_monthly_shortfall_inr"] == 0.0
    assert res["goal_conflicts_summary"][0]["status"] == "ON_TRACK"

def test_direct_phase5_priority_output_consumption():
    """
    Test requirement: Confirms analyze_goal_conflicts reads directly from
    priority_output rather than recomputing surplus independently.
    """
    # Synthetic priority output supplying explicit investment surplus
    synthetic_priority_output = {
        "monthly_surplus": 50000.0,
        "priority_action_plan": [
            {
                "rank": 1,
                "category": "INVESTMENT_GOAL",
                "title": "Direct ₹15,000.00 Toward Retirement",
                "amount_inr": 15000.0, # Available investment surplus = ₹15,000.00
            }
        ]
    }

    goals = [
        {"name": "Home Downpayment", "target_amount": 1200000.0, "target_date": "2028-12-31"} # ~2.3 yrs (28 mos) => ~₹42,857/mo required
    ]

    res = analyze_goal_conflicts(goals=goals, priority_output=synthetic_priority_output)

    # Must consume exact ₹15,000.00 available from priority_output
    assert res["available_investment_surplus_inr"] == 15000.0
    assert res["has_conflict"] is True
    assert res["total_monthly_shortfall_inr"] > 0.0
    assert res["goal_conflicts_summary"][0]["allocated_monthly_contribution"] == 15000.0

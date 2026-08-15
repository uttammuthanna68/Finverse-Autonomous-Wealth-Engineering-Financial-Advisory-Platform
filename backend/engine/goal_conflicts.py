math = None  # placeholder for import
import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.engine.priority import generate_priority_action_plan
from backend.engine.allocation import calculate_years_to_goal

def analyze_goal_conflicts(
    goals: List[Dict[str, Any]],
    priority_output: Optional[Dict[str, Any]] = None,
    # Optional parameters if priority_output is omitted
    monthly_income: Optional[float] = None,
    monthly_expenses: Optional[float] = None,
    current_savings: Optional[float] = None,
    debts: Optional[List[Dict[str, Any]]] = None,
    credit_cards: Optional[List[Dict[str, Any]]] = None,
    user_age: int = 30,
) -> Dict[str, Any]:
    """
    Analyzes whether active financial goals conflict with the net investment surplus
    actually left available by Phase 5 Priority Action Engine.
    Directly consumes priority_output to prevent independent surplus recomputation.
    """
    # 1. Obtain Priority Engine Output directly if not provided
    if priority_output is None:
        if monthly_income is None or monthly_expenses is None or current_savings is None:
            raise ValueError("Must provide either priority_output or user financial parameters.")

        priority_output = generate_priority_action_plan(
            monthly_income=monthly_income,
            monthly_expenses=monthly_expenses,
            current_savings=current_savings,
            debts=debts or [],
            credit_cards=credit_cards or [],
            user_age=user_age,
            goals=goals,
        )

    # Extract available investment surplus directly from Phase 5 priority output
    monthly_surplus = priority_output.get("monthly_surplus", 0.0)
    
    # Extract surplus_for_investment from priority action items or debt waterfall
    # Priority engine Item 4 or waterfall surplus_for_investment
    priority_items = priority_output.get("priority_action_plan", [])
    invest_item = next((item for item in priority_items if item["category"] in ["INVESTMENT_GOAL", "MANAGEABLE_DEBT_OR_INVEST"]), None)

    if invest_item:
        available_investment_surplus = float(invest_item.get("amount_inr", 0.0))
    else:
        # If toxic debt or emergency fund absorbed full surplus, investment surplus is 0.0
        available_investment_surplus = 0.0

    # 2. Calculate Required Monthly Contributions Per Goal
    goal_analysis = []
    total_required_monthly_investment = 0.0

    for goal in goals:
        name = goal.get("name", goal.get("goal_name", "Goal"))
        target_amt = max(0.0, float(goal.get("target_amount", 500000.0)))
        target_dt_str = str(goal.get("target_date", "2030-12-31"))

        years_rem = calculate_years_to_goal(target_dt_str)
        months_rem = max(1.0, years_rem * 12.0)

        # Simple required monthly contribution = target_amount / months_remaining
        required_monthly = target_amt / months_rem
        total_required_monthly_investment += required_monthly

        # Horizon-based Asset Suitability Matching
        if years_rem < 3:
            recommended_asset = "Arbitrage Funds / Liquid Debt / Flexi-FD"
            asset_class = "Debt/FD"
            asset_advice = "Short horizon (< 3 yrs). Avoid equity index funds to protect capital from market crashes. Deploy in 100% capital-guaranteed Liquid/FD instruments."
        elif years_rem <= 5:
            recommended_asset = "Balanced Advantage Hybrid Fund + SGB/Gold"
            asset_class = "Hybrid"
            asset_advice = "Medium horizon (3-5 yrs). 60% Hybrid Equity + 40% Debt/Gold split balances capital growth with market downside protection."
        else:
            recommended_asset = "Nifty 50 Index Fund + Flexi-Cap Equity SIP"
            asset_class = "Equity"
            asset_advice = "Long horizon (> 5 yrs). High equity exposure (Index + Flexi-Cap SIP) maximizes compounding growth while absorbing market cycles."

        goal_analysis.append({
            "goal_name": name,
            "target_amount": target_amt,
            "target_date": target_dt_str,
            "years_remaining": years_rem,
            "months_remaining": round(months_rem, 1),
            "required_monthly_contribution": round(required_monthly, 2),
            "allocated_monthly_contribution": 0.0,
            "shortfall_monthly": 0.0,
            "delay_months": 0,
            "revised_target_date": target_dt_str,
            "recommended_asset": recommended_asset,
            "asset_class": asset_class,
            "asset_advice": asset_advice,
            "status": "ON_TRACK",
        })

    # 3. Conflict Analysis & Delay Calculations
    has_conflict = total_required_monthly_investment > available_investment_surplus
    monthly_shortfall = max(0.0, total_required_monthly_investment - available_investment_surplus)

    if has_conflict:
        # Sort goals by timeline (earliest target date prioritized first)
        goal_analysis.sort(key=lambda x: x["months_remaining"])

        remaining_surplus = available_investment_surplus

        for g in goal_analysis:
            req = g["required_monthly_contribution"]
            if remaining_surplus >= req:
                g["allocated_monthly_contribution"] = round(req, 2)
                g["shortfall_monthly"] = 0.0
                g["delay_months"] = 0
                g["status"] = "ON_TRACK"
                remaining_surplus -= req
            elif remaining_surplus > 0:
                g["allocated_monthly_contribution"] = round(remaining_surplus, 2)
                g["shortfall_monthly"] = round(req - remaining_surplus, 2)
                
                # Calculate extended timeline: months_needed = target_amount / allocated_monthly
                revised_months = math.ceil(g["target_amount"] / remaining_surplus)
                delay_m = max(0, revised_months - int(g["months_remaining"]))
                g["delay_months"] = delay_m
                
                # Revised target date estimate
                g["status"] = "DELAYED"
                g["conflict_reasoning"] = (
                    f"Due to prior debt & emergency fund allocations, only ₹{remaining_surplus:,.2f}/mo is available "
                    f"for {g['goal_name']} (vs ₹{req:,.2f}/mo required). Target date delayed by ~{delay_m} months ({round(delay_m/12.0, 1)} years)."
                )
                remaining_surplus = 0.0
            else:
                g["allocated_monthly_contribution"] = 0.0
                g["shortfall_monthly"] = round(req, 2)
                g["delay_months"] = 999
                g["status"] = "PAUSED_FOR_DEBT_PAYOFF"
                g["conflict_reasoning"] = (
                    f"Contributions for {g['goal_name']} are paused while toxic debt and emergency reserve priorities are satisfied. "
                    f"Full monthly contribution of ₹{req:,.2f}/mo will resume once debt is cleared."
                )

    return {
        "status": "success",
        "has_conflict": has_conflict,
        "available_investment_surplus_inr": round(available_investment_surplus, 2),
        "total_required_monthly_investment_inr": round(total_required_monthly_investment, 2),
        "total_monthly_shortfall_inr": round(monthly_shortfall, 2),
        "goal_conflicts_summary": goal_analysis,
    }

import math
from typing import Dict, Any, List, Optional
from backend.engine.debt import calculate_debt_waterfall
from backend.engine.risk import calculate_risk_score
from backend.engine.allocation import allocate_goal_portfolio

def generate_priority_action_plan(
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    debts: Optional[List[Dict[str, Any]]] = None,
    credit_cards: Optional[List[Dict[str, Any]]] = None,
    has_dependents: bool = False,
    has_health_insurance: bool = True,
    has_term_life_insurance: bool = True,
    user_age: int = 30,
    cibil_band: str = "Good (700-749)",
    employment_type: str = "salaried-private",
    dependents_count: int = 0,
    goals: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Synthesizes financial profile, debt waterfall, risk allocation, and insurance flags into
    ONE ranked, numbered monthly action list using real computed ₹ figures.
    """
    monthly_income = max(0.0, float(monthly_income))
    monthly_expenses = max(0.0, float(monthly_expenses))
    current_savings = max(0.0, float(current_savings))
    debts_list = debts or []
    cards_list = credit_cards or []
    goals_list = goals or []

    # Calculate Risk Score
    total_debt_balance = sum(float(d.get("balance", 0.0)) for d in debts_list)
    risk_info = calculate_risk_score(
        age=user_age,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        current_savings=current_savings,
        total_debt_balance=total_debt_balance,
        employment_type=employment_type,
        dependents=dependents_count,
        credit_cards=cards_list,
    )
    risk_score = risk_info["risk_score"]

    # Calculate Debt Waterfall
    waterfall = calculate_debt_waterfall(
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        current_savings=current_savings,
        debts=debts_list,
        risk_score=risk_score,
    )

    monthly_surplus = waterfall["monthly_surplus"]
    total_min_payments = waterfall["total_minimum_payments"]
    surplus_after_mins = max(0.0, monthly_surplus - total_min_payments)
    active_step = waterfall["active_waterfall_step"]
    emergency_target = waterfall["emergency_fund_target_amount"]

    action_items = []
    item_counter = 1

    # -------------------------------------------------------------
    # CRITICAL CHECK: Insufficient Surplus / Deficit Handling
    # -------------------------------------------------------------
    is_deficit = monthly_surplus < total_min_payments
    if is_deficit:
        deficit_amount = round(total_min_payments - monthly_surplus, 2)
        action_items.append({
            "rank": item_counter,
            "category": "CRITICAL_DEFICIT",
            "title": f"URGENT: Insufficient Surplus Deficit of ₹{deficit_amount:,.2f}",
            "amount_inr": deficit_amount,
            "description": (
                f"Your monthly net surplus (₹{monthly_surplus:,.2f}) is lower than your minimum debt obligations "
                f"(₹{total_min_payments:,.2f}). Immediate expense reduction or debt restructuring is required to prevent missed payments and severe CIBIL score damage."
            ),
            "is_critical_alert": True,
        })
        item_counter += 1

    # -------------------------------------------------------------
    # ITEM 1: Minimum Payments Across All Debts (Always #1 if debts exist)
    # -------------------------------------------------------------
    if len(debts_list) > 0 and total_min_payments > 0:
        action_items.append({
            "rank": item_counter,
            "category": "MINIMUM_DEBTS",
            "title": f"Pay ₹{total_min_payments:,.2f} Minimum Dues Across Your {len(debts_list)} Debts",
            "amount_inr": round(total_min_payments, 2),
            "description": (
                f"Always pay minimum monthly dues first (₹{total_min_payments:,.2f} total across {len(debts_list)} debt accounts) "
                f"to protect your payment history (35% of CIBIL score weight)."
            ),
            "is_critical_alert": False,
        })
        item_counter += 1

    # -------------------------------------------------------------
    # ITEM 2: Toxic Debt Avalanche (If toxic debt exists)
    # -------------------------------------------------------------
    toxic_debts = [d for d in waterfall["debts"] if d["classification"] == "toxic" and d["balance"] > 0]
    if len(toxic_debts) > 0:
        toxic_debts.sort(key=lambda x: x["apr"], reverse=True)
        primary_toxic = toxic_debts[0]
        total_payment = primary_toxic["allocated_payment"]
        extra_payment = max(0.0, total_payment - primary_toxic["minimum_payment"])

        if total_payment > 0:
            est_months = math.ceil(primary_toxic["balance"] / total_payment)
        else:
            est_months = 999

        action_items.append({
            "rank": item_counter,
            "category": "TOXIC_DEBT_AVALANCHE",
            "title": f"Direct ₹{total_payment:,.2f} Toward {primary_toxic['debt_name']} ({primary_toxic['apr']}% APR)",
            "amount_inr": round(total_payment, 2),
            "extra_surplus_inr": round(extra_payment, 2),
            "estimated_payoff_months": est_months,
            "description": (
                f"Direct ₹{total_payment:,.2f} (₹{primary_toxic['minimum_payment']:,.2f} min + ₹{extra_payment:,.2f} extra surplus) "
                f"toward {primary_toxic['debt_name']} at {primary_toxic['apr']}% APR — this interest cost exceeds any realistic market return. "
                f"Estimated payoff: ~{est_months} months."
            ),
            "is_critical_alert": False,
            "is_toxic": True,
        })
        item_counter += 1

    # -------------------------------------------------------------
    # ITEM 3: Emergency Fund Allocation (If deficit exists or buffer growing)
    # -------------------------------------------------------------
    emergency_deficit = waterfall["emergency_fund_deficit"]
    target_months = waterfall["emergency_fund_target_months"]
    current_savings_val = waterfall["current_savings"]

    covered_months = round(current_savings_val / monthly_expenses, 1) if monthly_expenses > 0 else 0.0

    if active_step == "Step C" or (emergency_deficit > 0 and len(toxic_debts) == 0):
        fund_allocation = min(surplus_after_mins, emergency_deficit)
        if fund_allocation > 0:
            flexi_fd_share = round(fund_allocation * 0.5, 2)
            liquid_fund_share = round(fund_allocation * 0.5, 2)
            action_items.append({
                "rank": item_counter,
                "category": "EMERGENCY_FUND",
                "title": f"Direct ₹{fund_allocation:,.2f} Toward Your Emergency Reserve (6× Expenses Target)",
                "amount_inr": round(fund_allocation, 2),
                "flexi_fd_recommendation": flexi_fd_share,
                "liquid_fund_recommendation": liquid_fund_share,
                "description": (
                    f"Build your liquid emergency reserve toward the ₹{emergency_target:,.2f} target ({target_months}× monthly expenses). "
                    f"Currently covered: ₹{current_savings_val:,.2f} of ₹{emergency_target:,.2f} ({covered_months} months covered). "
                    f"Recommended split: Direct ₹{flexi_fd_share:,.2f} (50%) into Flexi FD (Bank Sweep-In for instant 24/7 ATM/UPI access) "
                    f"and ₹{liquid_fund_share:,.2f} (50%) into Liquid / Debt Mutual Funds for tax efficiency."
                ),
                "is_critical_alert": False,
            })
            item_counter += 1

    # -------------------------------------------------------------
    # ITEM 4: Investment Goals / Manageable Debt Allocation
    # -------------------------------------------------------------
    surplus_for_investment = waterfall["surplus_for_investment"]

    if surplus_for_investment > 0:
        if len(goals_list) > 0:
            primary_goal = goals_list[0]
            goal_alloc = allocate_goal_portfolio(
                goal_name=primary_goal.get("name", primary_goal.get("goal_name", "Primary Goal")),
                target_amount=float(primary_goal.get("target_amount", 500000.0)),
                target_date=str(primary_goal.get("target_date", "2030-12-31")),
                user_age=user_age,
                risk_score=risk_score,
                monthly_surplus=surplus_for_investment,
            )

            exp_ret = goal_alloc["expected_investment_return"]
            equity_pct = goal_alloc["overall_asset_allocation"]["equity_percent"]
            debt_pct = goal_alloc["overall_asset_allocation"]["debt_percent"]

            action_items.append({
                "rank": item_counter,
                "category": "INVESTMENT_GOAL",
                "title": f"Direct ₹{surplus_for_investment:,.2f} Toward {primary_goal.get('name', 'Wealth Accumulation')}",
                "amount_inr": round(surplus_for_investment, 2),
                "description": (
                    f"Invest ₹{surplus_for_investment:,.2f} monthly into {equity_pct:.0f}% Equity / {debt_pct:.0f}% Debt portfolio "
                    f"projected to return ~{exp_ret}% annually, outperforming low-cost manageable debt."
                ),
                "is_critical_alert": False,
                "goal_allocation": goal_alloc,
            })
            item_counter += 1
        else:
            manageable_debts = [d for d in waterfall["debts"] if d["classification"] == "manageable" and d["balance"] > 0]
            if len(manageable_debts) > 0:
                manageable_debts.sort(key=lambda x: x["apr"], reverse=True)
                m_debt = manageable_debts[0]
                reasoning = m_debt["reasoning"]

                action_items.append({
                    "rank": item_counter,
                    "category": "MANAGEABLE_DEBT_OR_INVEST",
                    "title": f"Direct ₹{surplus_for_investment:,.2f} Toward Wealth Building / {m_debt['debt_name']}",
                    "amount_inr": round(surplus_for_investment, 2),
                    "description": (
                        f"Reasoning: {reasoning}"
                    ),
                    "is_critical_alert": False,
                })
                item_counter += 1

    # -------------------------------------------------------------
    # ITEM 5: Insurance Protection Gap Nudge (Phase 2 Flag)
    # -------------------------------------------------------------
    needs_term_life_warning = (dependents_count > 0 or has_dependents) and not has_term_life_insurance
    needs_health_warning = not has_health_insurance

    if needs_term_life_warning or needs_health_warning:
        gap_details = []
        if needs_term_life_warning:
            gap_details.append("Term Life Insurance (dependents rely on your income)")
        if needs_health_warning:
            gap_details.append("Health Insurance (protects savings from medical emergencies)")

        action_items.append({
            "rank": item_counter,
            "category": "INSURANCE_GAP",
            "title": "ACTION REQUIRED: Secure Essential Insurance Coverage",
            "amount_inr": 0.0,
            "description": (
                f"Protection Gap Alert: Missing {', '.join(gap_details)}. "
                "Securing coverage prevents catastrophic medical or family financial distress before investing."
            ),
            "is_critical_alert": True,
        })
        item_counter += 1

    return {
        "status": "success",
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_surplus": monthly_surplus,
        "is_deficit": is_deficit,
        "active_waterfall_step": active_step,
        "risk_score": risk_score,
        "risk_label": risk_info["risk_label"],
        "priority_action_plan": action_items,
    }

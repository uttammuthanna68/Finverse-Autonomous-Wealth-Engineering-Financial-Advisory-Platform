from typing import List, Dict, Any, Optional
from backend.engine.config import (
    TOXIC_APR_THRESHOLD,
    EMERGENCY_MONTHS_STANDARD,
    EMERGENCY_MONTHS_TOXIC,
    HIGH_UTILIZATION_THRESHOLD,
    get_expected_investment_return,
)

def classify_debt(apr: float) -> str:
    """Classify debt as 'toxic' if APR > TOXIC_APR_THRESHOLD (24%), else 'manageable'."""
    return "toxic" if float(apr) > TOXIC_APR_THRESHOLD else "manageable"

def calculate_credit_card_utilization(credit_cards: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes per-card and overall credit utilization (balance/limit).
    Exposes metrics for risk engine short-term liquidity stress evaluation.
    """
    card_metrics = []
    total_balance = 0.0
    total_limit = 0.0
    max_utilization = 0.0
    high_utilization_cards = []

    for card in credit_cards:
        name = card.get("card_name", "Credit Card")
        balance = float(card.get("balance", 0.0))
        limit = float(card.get("credit_limit", 1.0))
        limit = limit if limit > 0 else 1.0  # Prevent division by zero

        utilization = balance / limit
        max_utilization = max(max_utilization, utilization)

        total_balance += balance
        total_limit += limit

        is_high = utilization > HIGH_UTILIZATION_THRESHOLD
        if is_high:
            high_utilization_cards.append({
                "card_name": name,
                "utilization_percent": round(utilization * 100, 1),
                "balance": balance,
                "limit": limit,
            })

        card_metrics.append({
            "card_name": name,
            "balance": balance,
            "limit": limit,
            "utilization_ratio": round(utilization, 4),
            "utilization_percent": round(utilization * 100, 1),
            "is_high_utilization": is_high,
        })

    overall_utilization = (total_balance / total_limit) if total_limit > 0 else 0.0

    return {
        "cards": card_metrics,
        "overall_utilization_ratio": round(overall_utilization, 4),
        "overall_utilization_percent": round(overall_utilization * 100, 1),
        "max_utilization_ratio": round(max_utilization, 4),
        "max_utilization_percent": round(max_utilization * 100, 1),
        "high_utilization_cards": high_utilization_cards,
        "has_high_utilization": len(high_utilization_cards) > 0,
    }

def generate_cibil_nudges(cibil_band: str, credit_cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Generates persistent CIBIL nudges and identifies specific contributing factors.
    """
    nudges = []
    band_clean = str(cibil_band or "").strip()
    is_no_cibil = "No CIBIL" in band_clean or "New to Credit" in band_clean
    is_poor = "Poor" in band_clean or "<650" in band_clean

    utilization_info = calculate_credit_card_utilization(credit_cards)

    if is_no_cibil:
        nudges.append({
            "type": "cibil_no_score_info",
            "persistent": True,
            "title": "New to Credit: Build Your Credit Foundation Safely",
            "message": (
                "You currently have no CIBIL credit score history. This is completely normal for first-time earners. "
                "Prioritize building your 6-month liquid Emergency Fund first, and consider an FD-backed secured credit card to safely build credit."
            ),
            "contributing_factors": ["No prior loan or credit card repayment history on bureau record."],
            "action": "Complete your Emergency Reserve in Flexi FDs / Liquid Funds before taking on credit debt.",
        })

    elif is_poor:
        contributing_factors = []
        if utilization_info["has_high_utilization"]:
            for c in utilization_info["high_utilization_cards"]:
                contributing_factors.append(
                    f"High utilization on {c['card_name']} ({c['utilization_percent']}% > 30% threshold)."
                )

        if not contributing_factors:
            contributing_factors.append("Recent payment delays or elevated debt-to-income balance.")

        nudges.append({
            "type": "cibil_poor_band_warning",
            "persistent": True,
            "title": "CIBIL Score Alert: Avoid New Credit Applications",
            "message": (
                "Your self-reported CIBIL score is in the Poor band (<650). "
                "Avoid applying for new credit cards or loan inquiries right now to prevent hard inquiry drops."
            ),
            "contributing_factors": contributing_factors,
            "action": "Maintain 100% on-time minimum payments (Step A) to rebuild score history.",
        })

    return nudges

def calculate_debt_waterfall(
    monthly_income: float,
    monthly_expenses: float,
    current_savings: float,
    debts: List[Dict[str, Any]],
    risk_score: float = 50.0,
) -> Dict[str, Any]:
    """
    Executes the flagship 4-step surplus allocation waterfall.
    """
    monthly_income = max(0.0, float(monthly_income))
    monthly_expenses = max(0.0, float(monthly_expenses))
    current_savings = max(0.0, float(current_savings))

    # Calculate net monthly cash flow surplus
    monthly_surplus = max(0.0, monthly_income - monthly_expenses)

    # Classify all debt items
    classified_debts = []
    has_toxic_debt = False

    for debt in debts:
        debt_id = debt.get("id", debt.get("debt_name", "Debt"))
        debt_name = debt.get("debt_name", debt.get("name", "Debt"))
        balance = max(0.0, float(debt.get("balance", 0.0)))
        apr = max(0.0, float(debt.get("apr", 0.0)))
        min_payment = max(0.0, float(debt.get("minimum_payment", 0.0)))
        classification = classify_debt(apr)

        if classification == "toxic" and balance > 0:
            has_toxic_debt = True

        # Calculate exact compound debt amortization payoff months
        estimated_payoff_months = 0
        if balance > 0:
            eff_payment = min_payment if min_payment > 0 else 1000.0
            r = (apr / 100.0) / 12.0
            if r <= 0:
                estimated_payoff_months = math.ceil(balance / eff_payment)
            elif eff_payment <= balance * r:
                estimated_payoff_months = 999  # Payment covers only interest
            else:
                try:
                    num_m = -math.log(1.0 - (r * balance) / eff_payment) / math.log(1.0 + r)
                    estimated_payoff_months = max(1, math.ceil(num_m))
                except Exception:
                    estimated_payoff_months = 36

        classified_debts.append({
            "id": debt_id,
            "debt_name": debt_name,
            "balance": balance,
            "apr": apr,
            "minimum_payment": min_payment,
            "classification": classification,
            "allocated_payment": 0.0,
            "estimated_payoff_months": estimated_payoff_months,
            "is_fully_paid": balance <= 0,
            "reasoning": "",
        })

    # Emergency Fund Target Logic
    target_months = EMERGENCY_MONTHS_TOXIC if has_toxic_debt else EMERGENCY_MONTHS_STANDARD
    emergency_fund_target = target_months * monthly_expenses

    # Ensure no funds are force-withdrawn from an existing larger balance
    # Effective emergency fund available balance is current_savings
    emergency_deficit = max(0.0, emergency_fund_target - current_savings)

    # Expected investment return rate from shared engine function
    expected_return = get_expected_investment_return(risk_score)

    total_min_payments = sum(d["minimum_payment"] for d in classified_debts if d["balance"] > 0)
    
    allocations = []
    available_surplus = monthly_surplus
    active_waterfall_step = "Step A"
    waterfall_summary = ""

    # STEP A: Minimum Payments Across ALL Debts (Non-negotiable)
    if total_min_payments > 0:
        if available_surplus >= total_min_payments:
            for d in classified_debts:
                if d["balance"] > 0:
                    d["allocated_payment"] = d["minimum_payment"]
            available_surplus -= total_min_payments
            waterfall_summary = f"Step A complete: Full minimum payments of ₹{total_min_payments:,.2f} allocated."
        else:
            # Surplus is less than total minimum payments: allocate proportionally
            ratio = available_surplus / total_min_payments if total_min_payments > 0 else 0.0
            for d in classified_debts:
                if d["balance"] > 0:
                    d["allocated_payment"] = d["minimum_payment"] * ratio
            available_surplus = 0.0
            waterfall_summary = f"Step A Warning: Surplus (₹{monthly_surplus:,.2f}) is less than required minimum payments (₹{total_min_payments:,.2f})."

    # STEP B: Toxic Debt Avalanche (if toxic debt exists and surplus remains)
    active_toxic_debts = [d for d in classified_debts if d["classification"] == "toxic" and d["balance"] > 0]
    
    if active_toxic_debts and available_surplus > 0:
        active_waterfall_step = "Step B"
        # Sort toxic debts by highest APR first (Avalanche)
        active_toxic_debts.sort(key=lambda x: x["apr"], reverse=True)
        target_toxic = active_toxic_debts[0]

        extra_payment = available_surplus
        target_toxic["allocated_payment"] += extra_payment
        available_surplus = 0.0

        target_toxic["reasoning"] = (
            f"Toxic debt avalanche (Step B): Allocated extra ₹{extra_payment:,.2f} surplus to "
            f"{target_toxic['debt_name']} ({target_toxic['apr']}% APR > {TOXIC_APR_THRESHOLD}% threshold) "
            f"while maintaining a 1-month emergency buffer (₹{emergency_fund_target:,.2f})."
        )
        waterfall_summary = f"Step B active: Directing all surplus to clear highest-APR toxic debt ({target_toxic['debt_name']})."

    # STEP C: Fill Emergency Fund (if no toxic debt, or toxic debt cleared, and emergency fund < 6x)
    elif not active_toxic_debts and emergency_deficit > 0 and available_surplus > 0:
        active_waterfall_step = "Step C"
        emergency_topup = min(available_surplus, emergency_deficit)
        available_surplus -= emergency_topup
        emergency_deficit -= emergency_topup

        waterfall_summary = (
            f"Step C active: Directing ₹{emergency_topup:,.2f} surplus to build emergency fund "
            f"towards full 6-month target (₹{emergency_fund_target:,.2f})."
        )

    # STEP D: Manageable Debt Prepay vs Invest (if no toxic debt and emergency fund >= 6x target)
    elif not active_toxic_debts and emergency_deficit <= 0 and available_surplus > 0:
        active_waterfall_step = "Step D"
        active_manageable_debts = [d for d in classified_debts if d["classification"] == "manageable" and d["balance"] > 0]
        
        # Sort manageable debts by highest APR
        active_manageable_debts.sort(key=lambda x: x["apr"], reverse=True)

        for d in active_manageable_debts:
            apr = d["apr"]
            if apr > expected_return and available_surplus > 0:
                prepay_amount = available_surplus
                d["allocated_payment"] += prepay_amount
                available_surplus = 0.0
                d["reasoning"] = (
                    f"Your {d['debt_name']} is at {apr}%. Your risk profile projects roughly "
                    f"{expected_return}% returns — prepaying this loan outperforms investing."
                )
            else:
                d["reasoning"] = (
                    f"Your {d['debt_name']} is at {apr}%. Your risk profile projects roughly "
                    f"{expected_return}% returns — investing this money is likely to outperform prepaying this loan."
                )

        if available_surplus > 0:
            waterfall_summary = (
                f"Step D active: Emergency fund is full (6x). ₹{available_surplus:,.2f} surplus "
                f"directed to wealth-building investments (projected {expected_return}% return)."
            )
        else:
            waterfall_summary = f"Step D active: Prepaying manageable debt with APR > expected return ({expected_return}%)."

    # Default reasoning for debts without explicit extra allocation
    for d in classified_debts:
        if not d["reasoning"]:
            if d["classification"] == "toxic":
                d["reasoning"] = f"Toxic debt ({d['apr']}% APR): Allocated minimum payment ₹{d['allocated_payment']:,.2f}."
            else:
                d["reasoning"] = (
                    f"Your {d['debt_name']} is at {d['apr']}%. Your risk profile projects roughly "
                    f"{expected_return}% returns — investing surplus outperforms prepaying low-APR debt."
                )

    total_debt_payment = sum(d["allocated_payment"] for d in classified_debts)
    surplus_for_investment = available_surplus

    return {
        "monthly_income": monthly_income,
        "monthly_expenses": monthly_expenses,
        "monthly_surplus": monthly_surplus,
        "current_savings": current_savings,
        "has_toxic_debt": has_toxic_debt,
        "emergency_fund_target_months": target_months,
        "emergency_fund_target_amount": emergency_fund_target,
        "emergency_fund_deficit": emergency_deficit,
        "expected_investment_return": expected_return,
        "active_waterfall_step": active_waterfall_step,
        "waterfall_summary": waterfall_summary,
        "total_minimum_payments": total_min_payments,
        "total_debt_payment": total_debt_payment,
        "surplus_for_investment": surplus_for_investment,
        "debts": classified_debts,
    }

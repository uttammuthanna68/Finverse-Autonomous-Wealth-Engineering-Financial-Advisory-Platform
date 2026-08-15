from typing import List, Dict, Any, Optional

def calculate_category_reward(
    card: Dict[str, Any],
    purchase_category: str,
    purchase_amount: float
) -> Dict[str, Any]:
    """
    Calculates computed reward value in ₹ and points for a given purchase.
    """
    category_key = purchase_category.lower().strip()
    reward_rates = card.get("reward_rates", {})
    
    # Default to general rate if specific category rate not defined
    rate_info = reward_rates.get(category_key, reward_rates.get("general", {"type": "cashback", "rate": 1.0}))
    
    reward_type = rate_info.get("type", "cashback") # 'cashback' or 'points'
    rate = float(rate_info.get("rate", 1.0))
    point_value_inr = float(rate_info.get("point_value_inr", 0.25))

    if reward_type == "cashback":
        cashback_inr = round((purchase_amount * rate) / 100.0, 2)
        points_earned = 0
        total_value_inr = cashback_inr
        description = f"{rate}% Cashback (₹{cashback_inr})"
    else:
        # Points rate: e.g. 5 points per ₹100
        points_earned = int((purchase_amount / 100.0) * rate)
        total_value_inr = round(points_earned * point_value_inr, 2)
        description = f"{points_earned} Points ({rate} pts/₹100 @ ₹{point_value_inr}/pt = ₹{total_value_inr})"

    return {
        "card_name": card.get("card_name", "Unknown Card"),
        "reward_type": reward_type,
        "rate": rate,
        "points_earned": points_earned,
        "total_value_inr": total_value_inr,
        "description": description
    }

def optimize_card_rewards(
    cards: List[Dict[str, Any]],
    purchase_category: str,
    purchase_amount: float
) -> Dict[str, Any]:
    """
    Evaluates all user credit cards for a purchase.
    Enforces Phase 3 Toxic Debt Exclusion Rule: Cards with APR > 24% and active balance are excluded.
    Returns computed value for ALL options, not just a single winner.
    """
    results = []
    available_cards = []

    for card in cards:
        apr = float(card.get("apr", 18.0))
        balance = float(card.get("balance", 0.0))
        is_toxic = apr > 24.0 and balance > 0.0

        reward_calc = calculate_category_reward(card, purchase_category, purchase_amount)

        option_item = {
            "card_id": card.get("id", card.get("card_name")),
            "card_name": card.get("card_name"),
            "apr": apr,
            "balance": balance,
            "credit_limit": float(card.get("credit_limit", 100000.0)),
            "due_date": card.get("due_date", "15th of month"),
            "is_toxic": is_toxic,
            "status": "UNAVAILABLE" if is_toxic else "AVAILABLE",
            "exclusion_reason": (
                f"Card is currently in active toxic debt payoff mode ({apr}% APR). "
                "Optimizing new spend on this card is disabled to prevent high-interest debt accumulation."
            ) if is_toxic else None,
            "reward_details": reward_calc,
            "computed_value_inr": reward_calc["total_value_inr"] if not is_toxic else 0.0
        }

        results.append(option_item)
        if not is_toxic:
            available_cards.append(option_item)

    # Sort available cards by computed reward value descending
    available_cards.sort(key=lambda x: x["computed_value_inr"], reverse=True)

    recommended_card = available_cards[0] if available_cards else None

    return {
        "status": "success",
        "purchase_category": purchase_category,
        "purchase_amount": purchase_amount,
        "recommended_card": recommended_card,
        "all_options": sorted(results, key=lambda x: (x["is_toxic"], -x["computed_value_inr"]))
    }

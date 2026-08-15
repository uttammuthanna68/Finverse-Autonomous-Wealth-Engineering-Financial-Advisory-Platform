import pytest
from backend.engine.rewards import calculate_category_reward, optimize_card_rewards

def test_rewards_calculation_cashback_and_points():
    card_cashback = {
        "card_name": "Cashback Card",
        "apr": 18.0,
        "balance": 0.0,
        "reward_rates": {
            "dining": {"type": "cashback", "rate": 5.0},
            "general": {"type": "cashback", "rate": 1.0}
        }
    }

    res = calculate_category_reward(card_cashback, "Dining", 5000.0)
    assert res["reward_type"] == "cashback"
    assert res["total_value_inr"] == 250.0  # 5% of 5,000 = ₹250

    card_points = {
        "card_name": "Travel Rewards",
        "apr": 15.0,
        "balance": 0.0,
        "reward_rates": {
            "dining": {"type": "points", "rate": 10.0, "point_value_inr": 0.25}
        }
    }

    res_pts = calculate_category_reward(card_points, "Dining", 5000.0)
    assert res_pts["reward_type"] == "points"
    assert res_pts["points_earned"] == 500  # (5000/100) * 10 = 500 points
    assert res_pts["total_value_inr"] == 125.0  # 500 * 0.25 = ₹125

def test_toxic_debt_card_exclusion_rule():
    cards = [
        {
            "id": "c1",
            "card_name": "High APR Credit Card (Toxic)",
            "apr": 36.0,
            "balance": 45000.0,
            "reward_rates": {"dining": {"type": "cashback", "rate": 10.0}} # High rate, but toxic!
        },
        {
            "id": "c2",
            "card_name": "Standard Card (Manageable)",
            "apr": 18.0,
            "balance": 0.0,
            "reward_rates": {"dining": {"type": "cashback", "rate": 2.0}}
        }
    ]

    res = optimize_card_rewards(cards, "Dining", 5000.0)

    # 1. Toxic card must NOT be recommended despite higher cashback rate
    assert res["recommended_card"]["card_name"] == "Standard Card (Manageable)"

    # 2. Toxic card must be flagged UNAVAILABLE with exclusion explanation
    toxic_option = next(o for o in res["all_options"] if o["card_name"] == "High APR Credit Card (Toxic)")
    assert toxic_option["is_toxic"] is True
    assert toxic_option["status"] == "UNAVAILABLE"
    assert "toxic debt payoff mode" in toxic_option["exclusion_reason"]

def test_all_options_computed_values_returned():
    cards = [
        {"card_name": "Card A", "apr": 18.0, "balance": 0.0, "reward_rates": {"general": {"type": "cashback", "rate": 1.0}}},
        {"card_name": "Card B", "apr": 16.0, "balance": 0.0, "reward_rates": {"general": {"type": "cashback", "rate": 3.0}}},
    ]

    res = optimize_card_rewards(cards, "General", 10000.0)

    assert len(res["all_options"]) == 2
    assert res["all_options"][0]["computed_value_inr"] == 300.0  # Card B (3% of 10,000)
    assert res["all_options"][1]["computed_value_inr"] == 100.0  # Card A (1% of 10,000)

import pytest
from backend.engine.allocation import calculate_base_equity_percentage, generate_preset_lenses, allocate_goal_portfolio

def test_under_3_year_equity_capping():
    res = allocate_goal_portfolio(
        goal_name="Near-Term House Deposit",
        target_amount=1000000.0,
        target_date="2027-01-01",
        user_age=28,
        risk_score=75.0,
        monthly_surplus=50000.0
    )
    assert res["equity_percentage"] <= 20.0

def test_preset_comparison_lenses_non_biased_matching():
    lenses_young = generate_preset_lenses(user_age=25, monthly_surplus=60000.0, user_risk_score=75.0)
    lenses_mid = generate_preset_lenses(user_age=42, monthly_surplus=40000.0, user_risk_score=50.0)
    lenses_senior = generate_preset_lenses(user_age=62, monthly_surplus=20000.0, user_risk_score=30.0)

    # 1. Young high-risk user matches Risky
    young_match = next(l for l in lenses_young if l["is_user_match"])
    assert young_match["lens_name"] == "Risky"

    # 2. Mid age moderate risk matches Medium
    mid_match = next(l for l in lenses_mid if l["is_user_match"])
    assert mid_match["lens_name"] == "Medium"

    # 3. Senior low-risk user matches Safe
    senior_match = next(l for l in lenses_senior if l["is_user_match"])
    assert senior_match["lens_name"] == "Safe"

    # 4. Check 6 category breakdown & live source tags
    for lens in lenses_young:
        assert len(lens["category_allocations"]) == 6
        assert "expected_cagr" in lens
        for cat in lens["category_allocations"]:
            assert "live_source" in cat
        total_pct = sum(c["percentage"] for c in lens["category_allocations"])
        assert pytest.approx(total_pct, 0.1) == 100.0

import pytest
from backend.engine.calculators import calculate_sip, calculate_lumpsum, calculate_reverse_goal

def test_reverse_goal_target_inflation_explicit_requirement():
    """
    CRITICAL TEST REQUIREMENT:
    Write an explicit test confirming that the reverse-goal calculator INFLATES the target
    amount itself over time (e.g., a goal costing ₹10L today costs ₹13.38L in 5 years at 6% inflation)
    rather than silently using today's uninflated ₹ value as the future requirement.
    """
    target_today = 1000000.0  # ₹10 Lakhs today
    duration = 5              # 5 years
    exp_return = 12.0          # 12% expected annual return
    inflation = 6.0            # 6% annual inflation

    res = calculate_reverse_goal(
        target_amount_today=target_today,
        duration_years=duration,
        expected_annual_return_percent=exp_return,
        inflation_rate_percent=inflation,
    )

    # 1. Assert future target amount is explicitly inflated over 5 years (10L * (1.06)^5 = 13.38L)
    expected_future_target = target_today * ((1.0 + 0.06) ** 5)  # 1,338,225.58
    assert res["future_target_amount"] > target_today
    assert abs(res["future_target_amount"] - expected_future_target) < 100.0

    # 2. Assert solved required SIP actually yields the INFLATED future target, NOT the uninflated 10L
    assert res["final_nominal_value"] >= res["future_target_amount"]

    # 3. Confirm that solving for uninflated 10L target would yield a lower SIP
    res_uninflated_target = calculate_reverse_goal(
        target_amount_today=target_today,
        duration_years=duration,
        expected_annual_return_percent=exp_return,
        inflation_rate_percent=0.0,  # 0% inflation (uninflated)
    )
    assert res["required_initial_monthly_sip"] > res_uninflated_target["required_initial_monthly_sip"]

def test_sip_calculator_month_by_month_step_up_loop():
    """
    Test SIP calculator with 10% annual step-up over 3 years.
    Verifies month-by-month compounding and annual step-up application.
    """
    res = calculate_sip(
        initial_monthly_sip=10000.0,
        annual_step_up_percent=10.0,
        expected_annual_return_percent=12.0,
        duration_years=3,
        inflation_rate_percent=6.0,
    )

    assert res["calculator_type"] == "sip"
    assert res["duration_years"] == 3
    assert len(res["yearly_series"]) == 3

    # Year 1 invested: 12 * 10,000 = 120,000
    # Year 2 invested: 120,000 + (12 * 11,000) = 252,000
    # Year 3 invested: 252,000 + (12 * 12,100) = 397,200
    assert res["total_invested"] == 397200.0
    assert res["final_nominal_value"] > res["total_invested"]
    assert res["final_real_value"] < res["final_nominal_value"]

def test_lumpsum_calculator():
    """Test lumpsum calculator future value and real value calculations."""
    res = calculate_lumpsum(
        lumpsum_amount=500000.0,
        expected_annual_return_percent=10.0,
        duration_years=5,
        inflation_rate_percent=6.0,
    )

    assert res["calculator_type"] == "lumpsum"
    assert res["total_invested"] == 500000.0
    assert len(res["yearly_series"]) == 5

    # 500k * (1.10)^5 = 805,255.00
    assert abs(res["final_nominal_value"] - 805255.0) < 10.0
    assert res["final_real_value"] < res["final_nominal_value"]

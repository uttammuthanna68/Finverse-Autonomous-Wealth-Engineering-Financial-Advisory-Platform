from typing import Dict, Any, List, Optional
import math

def calculate_sip(
    initial_monthly_sip: float,
    annual_step_up_percent: float,
    expected_annual_return_percent: float,
    duration_years: int,
    inflation_rate_percent: float = 6.0,
) -> Dict[str, Any]:
    """
    Computes SIP future value with annual step-up using a month-by-month loop
    (not a closed-form approximation) to ensure exact step-up & compounding accuracy.
    Returns nominal value, inflation-adjusted real value, total invested, and year-by-year series.
    """
    initial_monthly_sip = max(0.0, float(initial_monthly_sip))
    annual_step_up_percent = max(0.0, float(annual_step_up_percent))
    expected_annual_return_percent = max(0.0, float(expected_annual_return_percent))
    duration_years = max(1, min(50, int(duration_years)))
    inflation_rate_percent = max(0.0, float(inflation_rate_percent))

    monthly_return_rate = (expected_annual_return_percent / 100.0) / 12.0
    total_months = duration_years * 12

    current_monthly_sip = initial_monthly_sip
    current_balance = 0.0
    total_invested = 0.0

    yearly_series = []

    for m in range(1, total_months + 1):
        # Step-up monthly SIP at the beginning of each new year (month 13, 25, 37...)
        if m > 1 and (m - 1) % 12 == 0:
            current_monthly_sip = current_monthly_sip * (1.0 + (annual_step_up_percent / 100.0))

        # Add monthly contribution
        current_balance += current_monthly_sip
        total_invested += current_monthly_sip

        # Apply monthly interest compounding
        current_balance += current_balance * monthly_return_rate

        # Snapshot at the end of each year (month 12, 24, 36...)
        if m % 12 == 0:
            year_num = m // 12
            # Inflation adjustment factor for real value at year_num
            inflation_factor = (1.0 + (inflation_rate_percent / 100.0)) ** year_num
            real_val = current_balance / inflation_factor if inflation_factor > 0 else current_balance

            yearly_series.append({
                "year": year_num,
                "invested_amount": round(total_invested, 2),
                "nominal_value": round(current_balance, 2),
                "real_value": round(real_val, 2),
            })

    final_nominal = current_balance
    total_inflation_factor = (1.0 + (inflation_rate_percent / 100.0)) ** duration_years
    final_real = final_nominal / total_inflation_factor if total_inflation_factor > 0 else final_nominal
    total_wealth_gain = max(0.0, final_nominal - total_invested)

    return {
        "calculator_type": "sip",
        "initial_monthly_sip": round(initial_monthly_sip, 2),
        "annual_step_up_percent": annual_step_up_percent,
        "expected_annual_return_percent": expected_annual_return_percent,
        "duration_years": duration_years,
        "inflation_rate_percent": inflation_rate_percent,
        "total_invested": round(total_invested, 2),
        "final_nominal_value": round(final_nominal, 2),
        "final_real_value": round(final_real, 2),
        "total_wealth_gain": round(total_wealth_gain, 2),
        "yearly_series": yearly_series,
    }

def calculate_lumpsum(
    lumpsum_amount: float,
    expected_annual_return_percent: float,
    duration_years: int,
    inflation_rate_percent: float = 6.0,
) -> Dict[str, Any]:
    """
    Computes lumpsum investment future value, real value, and year-by-year series.
    """
    lumpsum_amount = max(0.0, float(lumpsum_amount))
    expected_annual_return_percent = max(0.0, float(expected_annual_return_percent))
    duration_years = max(1, min(50, int(duration_years)))
    inflation_rate_percent = max(0.0, float(inflation_rate_percent))

    annual_return_rate = expected_annual_return_percent / 100.0
    yearly_series = []

    for y in range(1, duration_years + 1):
        nominal_val = lumpsum_amount * ((1.0 + annual_return_rate) ** y)
        inflation_factor = (1.0 + (inflation_rate_percent / 100.0)) ** y
        real_val = nominal_val / inflation_factor if inflation_factor > 0 else nominal_val

        yearly_series.append({
            "year": y,
            "invested_amount": round(lumpsum_amount, 2),
            "nominal_value": round(nominal_val, 2),
            "real_value": round(real_val, 2),
        })

    final_nominal = lumpsum_amount * ((1.0 + annual_return_rate) ** duration_years)
    total_inflation_factor = (1.0 + (inflation_rate_percent / 100.0)) ** duration_years
    final_real = final_nominal / total_inflation_factor if total_inflation_factor > 0 else final_nominal
    total_wealth_gain = max(0.0, final_nominal - lumpsum_amount)

    return {
        "calculator_type": "lumpsum",
        "lumpsum_amount": round(lumpsum_amount, 2),
        "expected_annual_return_percent": expected_annual_return_percent,
        "duration_years": duration_years,
        "inflation_rate_percent": inflation_rate_percent,
        "total_invested": round(lumpsum_amount, 2),
        "final_nominal_value": round(final_nominal, 2),
        "final_real_value": round(final_real, 2),
        "total_wealth_gain": round(total_wealth_gain, 2),
        "yearly_series": yearly_series,
    }

def calculate_reverse_goal(
    target_amount_today: float,
    duration_years: int,
    expected_annual_return_percent: float,
    annual_step_up_percent: float = 0.0,
    inflation_rate_percent: float = 6.0,
) -> Dict[str, Any]:
    """
    Reverse-goal calculator: Given today's target amount, inflates the target amount over time
    first (future_target = target_today * (1 + inflation)^years) before solving for the required monthly SIP.
    """
    target_amount_today = max(0.0, float(target_amount_today))
    duration_years = max(1, min(50, int(duration_years)))
    expected_annual_return_percent = max(0.0, float(expected_annual_return_percent))
    annual_step_up_percent = max(0.0, float(annual_step_up_percent))
    inflation_rate_percent = max(0.0, float(inflation_rate_percent))

    # CRITICAL: Inflate today's target amount into future requirement
    inflation_factor = (1.0 + (inflation_rate_percent / 100.0)) ** duration_years
    future_target_amount = target_amount_today * inflation_factor

    # Binary search solver to find exact initial monthly SIP required to reach future_target_amount
    low_sip = 0.0
    high_sip = future_target_amount  # Upper bound
    required_initial_monthly_sip = 0.0

    for _ in range(50):  # Binary search iterations for sub-rupee precision
        mid_sip = (low_sip + high_sip) / 2.0
        trial_res = calculate_sip(
            initial_monthly_sip=mid_sip,
            annual_step_up_percent=annual_step_up_percent,
            expected_annual_return_percent=expected_annual_return_percent,
            duration_years=duration_years,
            inflation_rate_percent=inflation_rate_percent,
        )
        trial_fv = trial_res["final_nominal_value"]

        if trial_fv >= future_target_amount:
            required_initial_monthly_sip = mid_sip
            high_sip = mid_sip
        else:
            low_sip = mid_sip

    # Generate full forward SIP projection with solved required SIP
    forward_projection = calculate_sip(
        initial_monthly_sip=required_initial_monthly_sip,
        annual_step_up_percent=annual_step_up_percent,
        expected_annual_return_percent=expected_annual_return_percent,
        duration_years=duration_years,
        inflation_rate_percent=inflation_rate_percent,
    )

    return {
        "calculator_type": "reverse_goal",
        "target_amount_today": round(target_amount_today, 2),
        "future_target_amount": round(future_target_amount, 2),
        "inflation_impact_amount": round(future_target_amount - target_amount_today, 2),
        "duration_years": duration_years,
        "expected_annual_return_percent": expected_annual_return_percent,
        "annual_step_up_percent": annual_step_up_percent,
        "inflation_rate_percent": inflation_rate_percent,
        "required_initial_monthly_sip": round(required_initial_monthly_sip, 2),
        "total_invested": forward_projection["total_invested"],
        "final_nominal_value": forward_projection["final_nominal_value"],
        "final_real_value": forward_projection["final_real_value"],
        "yearly_series": forward_projection["yearly_series"],
    }

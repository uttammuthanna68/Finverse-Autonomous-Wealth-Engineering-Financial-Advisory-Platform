from typing import List, Dict, Any, Optional
import datetime

def calculate_years_to_goal(target_date_str: str) -> float:
    """Calculates remaining years from current date to target_date_str (YYYY-MM-DD)."""
    try:
        t_date = datetime.datetime.strptime(target_date_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        years_left = max(0.1, (t_date - today).days / 365.25)
        return round(years_left, 1)
    except Exception:
        return 5.0

def calculate_base_equity_percentage(user_age: int, user_risk_score: float) -> float:
    """
    Computes baseline equity allocation percentage based on user age and risk capacity score.
    Rule: 100 - age rule modified by risk capacity score (0-100 scale).
    """
    age_rule_equity = max(20.0, min(80.0, 110.0 - user_age))
    risk_adjustment = ((user_risk_score - 50.0) / 50.0) * 15.0
    final_equity = max(15.0, min(85.0, age_rule_equity + risk_adjustment))
    return round(final_equity, 1)

def generate_preset_lenses(
    user_age: int,
    monthly_surplus: float,
    user_risk_score: float
) -> List[Dict[str, Any]]:
    """
    Generates 3 distinct, non-stagnant portfolio comparison lenses (Safe, Medium, Risky)
    divided into 6 real-world Indian asset classes with exact surplus-converted Rupee amounts.
    """
    med_total_eq = calculate_base_equity_percentage(user_age, user_risk_score)

    # 1. SAFE (Conservative) - High Debt & FD Focus (~25% Equity, 65% Debt/FD, 10% Gold)
    safe_total_eq = max(15.0, round(med_total_eq * 0.45, 1))
    safe_large_cap = round(safe_total_eq * 0.70, 1)
    safe_flexi_cap = round(safe_total_eq * 0.30, 1)
    safe_small_cap = 0.0

    safe_gold = 10.0
    safe_total_debt = round(100.0 - safe_total_eq - safe_gold, 1)
    safe_fd_liquid = round(safe_total_debt * 0.60, 1)
    safe_short_debt = round(safe_total_debt * 0.40, 1)

    # 2. MEDIUM (Balanced) (~55% Equity, 35% Debt/FD, 10% Gold)
    med_large_cap = round(med_total_eq * 0.50, 1)
    med_flexi_cap = round(med_total_eq * 0.35, 1)
    med_small_cap = round(med_total_eq * 0.15, 1)

    med_gold = 10.0
    med_total_debt = round(100.0 - med_total_eq - med_gold, 1)
    med_fd_liquid = round(med_total_debt * 0.40, 1)
    med_short_debt = round(med_total_debt * 0.60, 1)

    # 3. RISKY (Aggressive Growth) (~80% Equity, 15% Debt/FD, 5% Gold)
    risky_total_eq = min(85.0, round(med_total_eq * 1.35, 1))
    risky_large_cap = round(risky_total_eq * 0.35, 1)
    risky_flexi_cap = round(risky_total_eq * 0.40, 1)
    risky_small_cap = round(risky_total_eq * 0.25, 1)

    risky_gold = 5.0
    risky_total_debt = round(100.0 - risky_total_eq - risky_gold, 1)
    risky_fd_liquid = round(risky_total_debt * 0.30, 1)
    risky_short_debt = round(risky_total_debt * 0.70, 1)

    # Determine recommended profile match
    if user_risk_score < 40 or user_age >= 60:
        matched_lens_name = "Safe"
    elif user_risk_score >= 70 and user_age < 40:
        matched_lens_name = "Risky"
    else:
        matched_lens_name = "Medium"

    def format_6_asset_lens(
        lens_name: str,
        risk_label: str,
        large_cap_pct: float,
        flexi_cap_pct: float,
        small_cap_pct: float,
        fd_liquid_pct: float,
        short_debt_pct: float,
        gold_pct: float,
        desc: str
    ) -> Dict[str, Any]:
        is_match = (lens_name == matched_lens_name)

        tot_eq = round(large_cap_pct + flexi_cap_pct + small_cap_pct, 1)
        tot_debt = round(fd_liquid_pct + short_debt_pct, 1)

        # Expected CAGR weights: Large Cap 12%, Flexi Cap 13.5%, Small Cap 15%, FD 6.5%, Debt 7.5%, Gold 8%
        cagr = round(
            (large_cap_pct * 0.12) +
            (flexi_cap_pct * 0.135) +
            (small_cap_pct * 0.150) +
            (fd_liquid_pct * 0.065) +
            (short_debt_pct * 0.075) +
            (gold_pct * 0.080), 2
        )

        categories = [
          {
            "category": "Nifty 50 Large Cap Index",
            "percentage": large_cap_pct,
            "monthly_amount": round(monthly_surplus * (large_cap_pct / 100.0), 2),
            "asset_class": "Equity",
            "cagr_rate": 12.0,
            "description": "Invests in India's top 50 blue-chip companies for stable long-term equity growth."
          },
          {
            "category": "Flexi Cap & Mid Cap Equity",
            "percentage": flexi_cap_pct,
            "monthly_amount": round(monthly_surplus * (flexi_cap_pct / 100.0), 2),
            "asset_class": "Equity",
            "cagr_rate": 13.5,
            "description": "Dynamically allocates across large, mid, and small cap companies to capture market upside."
          },
          {
            "category": "Small Cap Index Funds",
            "percentage": small_cap_pct,
            "monthly_amount": round(monthly_surplus * (small_cap_pct / 100.0), 2),
            "asset_class": "Equity",
            "cagr_rate": 15.0,
            "description": "High-growth emerging business opportunities with higher short-term price volatility."
          },
          {
            "category": "Fixed Deposits & Liquid Funds",
            "percentage": fd_liquid_pct,
            "monthly_amount": round(monthly_surplus * (fd_liquid_pct / 100.0), 2),
            "asset_class": "Debt/FD",
            "cagr_rate": 6.5,
            "description": "Guaranteed bank FDs & ultra-short liquid mutual funds providing 100% capital safety."
          },
          {
            "category": "Short Duration Debt & Target Maturity",
            "percentage": short_debt_pct,
            "monthly_amount": round(monthly_surplus * (short_debt_pct / 100.0), 2),
            "asset_class": "Debt/FD",
            "cagr_rate": 7.5,
            "description": "High-grade corporate bonds & government securities offering steady income superior to savings accounts."
          },
          {
            "category": "Sovereign Gold Bonds (SGB) & Gold ETFs",
            "percentage": gold_pct,
            "monthly_amount": round(monthly_surplus * (gold_pct / 100.0), 2),
            "asset_class": "Gold",
            "cagr_rate": 8.0,
            "description": "Government-backed Sovereign Gold Bonds yielding 2.5% annual interest plus gold price appreciation."
          }
        ]

        return {
            "lens_name": lens_name,
            "risk_label": risk_label,
            "is_user_match": is_match,
            "equity_percentage": tot_eq,
            "debt_percentage": tot_debt,
            "gold_percentage": gold_pct,
            "expected_cagr": cagr,
            "description": desc,
            "debt_liquid_reasoning": (
                f"For a {user_age}-year-old with ₹{monthly_surplus:,.0f} monthly surplus, "
                f"the {lens_name} portfolio allocates {tot_debt}% to FD & Debt for capital safety, "
                f"{tot_eq}% to Equity for wealth compounding, and {gold_pct}% to Sovereign Gold Bonds."
            ),
            "fund_count_cap": 6,
            "category_allocations": categories,
            "overall_asset_allocation": {
                "equity_percent": tot_eq,
                "debt_percent": tot_debt,
                "gold_percent": gold_pct,
            }
        }

    return [
        format_6_asset_lens(
            "Safe",
            "Conservative",
            safe_large_cap,
            safe_flexi_cap,
            safe_small_cap,
            safe_fd_liquid,
            safe_short_debt,
            safe_gold,
            "Focuses heavily on capital preservation with 65% in FDs & Debt, 25% in Large Cap Equity, and 10% Gold."
        ),
        format_6_asset_lens(
            "Medium",
            "Balanced",
            med_large_cap,
            med_flexi_cap,
            med_small_cap,
            med_fd_liquid,
            med_short_debt,
            med_gold,
            "Optimal balance of 55% Equity, 35% FD & Debt, and 10% Gold for steady compounding with market protection."
        ),
        format_6_asset_lens(
            "Risky",
            "Aggressive",
            risky_large_cap,
            risky_flexi_cap,
            risky_small_cap,
            risky_fd_liquid,
            risky_short_debt,
            risky_gold,
            "Aggressive growth engine with 80% Equity (including Small Cap), 15% Debt, and 5% Gold for maximum wealth creation."
        )
    ]

def allocate_goal_portfolio(
    goal_name: str,
    target_amount: float,
    target_date: str,
    user_age: int,
    risk_score: float,
    monthly_surplus: float
) -> Dict[str, Any]:
    years_left = calculate_years_to_goal(target_date)
    base_eq = calculate_base_equity_percentage(user_age, risk_score)
    
    if years_left < 3.0:
        equity_pct = min(20.0, base_eq)
    else:
        equity_pct = base_eq

    gold_pct = 10.0
    debt_pct = round(100.0 - equity_pct - gold_pct, 1)
    exp_return = round((equity_pct * 0.12) + (debt_pct * 0.07) + (gold_pct * 0.08), 2)

    return {
        "goal_name": goal_name,
        "target_amount": target_amount,
        "target_date": target_date,
        "horizon_years": round(years_left, 1),
        "equity_percentage": equity_pct,
        "debt_percentage": debt_pct,
        "gold_percentage": gold_pct,
        "expected_investment_return": exp_return,
        "overall_asset_allocation": {
            "equity_percent": equity_pct,
            "debt_percent": debt_pct,
            "gold_percent": gold_pct,
        },
        "category_allocations": [
            {"category": "Equity", "percentage": equity_pct, "monthly_amount": round(monthly_surplus * (equity_pct / 100.0), 2)},
            {"category": "Fixed Income / Debt", "percentage": debt_pct, "monthly_amount": round(monthly_surplus * (debt_pct / 100.0), 2)},
            {"category": "Gold", "percentage": gold_pct, "monthly_amount": round(monthly_surplus * (gold_pct / 100.0), 2)},
        ]
    }

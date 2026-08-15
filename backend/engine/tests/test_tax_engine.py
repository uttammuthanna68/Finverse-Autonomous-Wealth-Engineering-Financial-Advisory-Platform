"""
Unit tests for Finverse Tax Optimization Engine.
"""

from backend.engine.tax_engine import (
    calculate_old_regime_tax,
    calculate_new_regime_tax,
    analyze_tax_optimization
)

def test_new_regime_zero_tax_up_to_7L():
    # 7L gross - 75k std deduction = 6.25L taxable <= 7L limit -> 87A rebate gives 0 tax
    res = calculate_new_regime_tax(700000)
    assert res["total_tax_payable"] == 0

def test_old_regime_deductions_impact():
    # 12L salary with full 80C (1.5L), 80D (25k), NPS (50k), Std Deduction (50k)
    res = calculate_old_regime_tax(1200000, sec_80c=150000, sec_80d=25000, sec_80ccd_1b=50000)
    assert res["itemized_deductions"]["total_deductions"] == 275000
    assert res["taxable_income"] == 925000

def test_tax_comparison_winner():
    # High salary with high deductions
    analysis = analyze_tax_optimization(1500000, sec_80c=150000, sec_80d=25000, sec_80ccd_1b=50000, sec_24b=200000)
    assert "winner_regime" in analysis
    assert "recommendations" in analysis
    assert len(analysis["recommendations"]) > 0

"""
Finverse Income Tax Calculation Engine (Indian Tax System FY 2025-26 / Budget 2025 Updates)
Compares Old Tax Regime vs. New Tax Regime, computes tax liabilities, cess, Section 87A rebate,
and identifies the optimal 'Winner' regime with plain-English, actionable tax-saving recommendations.
"""

from typing import Dict, Any, List, Optional

def calculate_old_regime_tax(
    gross_income: float,
    sec_80c: float = 150000.0,
    sec_80d: float = 25000.0,
    sec_80ccd_1b: float = 50000.0,
    sec_24b: float = 0.0,
    standard_deduction: float = 50000.0
) -> Dict[str, Any]:
    """
    Calculate Tax Liability under Old Tax Regime with itemized deductions.
    """
    total_80c = min(150000.0, max(0.0, sec_80c))
    total_80d = min(75000.0, max(0.0, sec_80d))
    total_nps = min(50000.0, max(0.0, sec_80ccd_1b))
    total_home_loan = min(200000.0, max(0.0, sec_24b))
    
    total_deductions = standard_deduction + total_80c + total_80d + total_nps + total_home_loan
    taxable_income = max(0.0, gross_income - total_deductions)
    
    # Old Regime Slabs (0-2.5L: Nil, 2.5L-5L: 5%, 5L-10L: 20%, >10L: 30%)
    raw_tax = 0.0
    if taxable_income > 1000000:
        raw_tax += (taxable_income - 1000000) * 0.30
        raw_tax += 500000 * 0.20  # 5L to 10L = 1L
        raw_tax += 250000 * 0.05  # 2.5L to 5L = 12.5k
    elif taxable_income > 500000:
        raw_tax += (taxable_income - 500000) * 0.20
        raw_tax += 250000 * 0.05
    elif taxable_income > 250000:
        raw_tax += (taxable_income - 250000) * 0.05
        
    # Section 87A Rebate for Old Regime (Taxable income <= 5,00,000)
    rebate_87a = 0.0
    if taxable_income <= 500000:
        rebate_87a = min(raw_tax, 12500.0)
        
    tax_after_rebate = max(0.0, raw_tax - rebate_87a)
    cess = tax_after_rebate * 0.04
    total_tax_payable = tax_after_rebate + cess
    
    return {
        "regime": "Old Regime",
        "gross_income": gross_income,
        "standard_deduction": standard_deduction,
        "itemized_deductions": {
            "sec_80c": total_80c,
            "sec_80d": total_80d,
            "sec_80ccd_1b": total_nps,
            "sec_24b": total_home_loan,
            "total_deductions": total_deductions
        },
        "taxable_income": taxable_income,
        "raw_tax": raw_tax,
        "rebate_87a": rebate_87a,
        "cess_4pct": cess,
        "total_tax_payable": round(total_tax_payable),
        "effective_tax_rate_pct": round((total_tax_payable / gross_income * 100), 2) if gross_income > 0 else 0.0
    }

def calculate_new_regime_tax(
    gross_income: float,
    standard_deduction: float = 75000.0,
    financial_year: str = "FY 2025-26"
) -> Dict[str, Any]:
    """
    Calculate Tax Liability under New Tax Regime.
    Supports FY 2025-26 (Budget 2025 slabs, 87A rebate up to 12L taxable income)
    and FY 2024-25 (legacy slabs, 87A rebate up to 7L taxable income).
    """
    taxable_income = max(0.0, gross_income - standard_deduction)
    raw_tax = 0.0
    rebate_87a = 0.0

    if financial_year == "FY 2024-25":
        # FY 2024-25 Slabs: 0-3L (0%), 3L-7L (5%), 7L-10L (10%), 10L-12L (15%), 12L-15L (20%), >15L (30%)
        if taxable_income > 1500000:
            raw_tax += (taxable_income - 1500000) * 0.30
            raw_tax += 300000 * 0.20
            raw_tax += 200000 * 0.15
            raw_tax += 300000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 1200000:
            raw_tax += (taxable_income - 1200000) * 0.20
            raw_tax += 200000 * 0.15
            raw_tax += 300000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 1000000:
            raw_tax += (taxable_income - 1000000) * 0.15
            raw_tax += 300000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 700000:
            raw_tax += (taxable_income - 700000) * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 300000:
            raw_tax += (taxable_income - 300000) * 0.05

        if taxable_income <= 700000:
            rebate_87a = min(raw_tax, 25000.0)

    else:
        # FY 2025-26 Budget 2025 Slabs:
        # 0 - 4L: 0%
        # 4L - 8L: 5% (max 20k)
        # 8L - 12L: 10% (max 40k) -> Cumulative raw tax at 12L = 60,000
        # 12L - 16L: 15% (max 60k)
        # 16L - 20L: 20% (max 80k)
        # 20L - 24L: 25% (max 100k)
        # Above 24L: 30%
        if taxable_income > 2400000:
            raw_tax += (taxable_income - 2400000) * 0.30
            raw_tax += 400000 * 0.25  # 20L to 24L = 1.0L
            raw_tax += 400000 * 0.20  # 16L to 20L = 80k
            raw_tax += 400000 * 0.15  # 12L to 16L = 60k
            raw_tax += 400000 * 0.10  # 8L to 12L = 40k
            raw_tax += 400000 * 0.05  # 4L to 8L = 20k
        elif taxable_income > 2000000:
            raw_tax += (taxable_income - 2000000) * 0.25
            raw_tax += 400000 * 0.20
            raw_tax += 400000 * 0.15
            raw_tax += 400000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 1600000:
            raw_tax += (taxable_income - 1600000) * 0.20
            raw_tax += 400000 * 0.15
            raw_tax += 400000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 1200000:
            raw_tax += (taxable_income - 1200000) * 0.15
            raw_tax += 400000 * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 800000:
            raw_tax += (taxable_income - 800000) * 0.10
            raw_tax += 400000 * 0.05
        elif taxable_income > 400000:
            raw_tax += (taxable_income - 400000) * 0.05

        # Section 87A Rebate for FY 2025-26 New Regime:
        # Full rebate up to ₹60,000 if taxable income <= ₹12,00,000.
        if taxable_income <= 1200000:
            rebate_87a = min(raw_tax, 60000.0)
        else:
            # Marginal relief check: Tax payable cannot exceed (taxable_income - 12,00,000)
            excess_income = taxable_income - 1200000
            if raw_tax > excess_income:
                rebate_87a = max(0.0, raw_tax - excess_income)

    tax_after_rebate = max(0.0, raw_tax - rebate_87a)
    cess = tax_after_rebate * 0.04
    total_tax_payable = tax_after_rebate + cess

    return {
        "regime": "New Regime",
        "financial_year": financial_year,
        "gross_income": gross_income,
        "standard_deduction": standard_deduction,
        "taxable_income": taxable_income,
        "raw_tax": raw_tax,
        "rebate_87a": rebate_87a,
        "cess_4pct": cess,
        "total_tax_payable": round(total_tax_payable),
        "effective_tax_rate_pct": round((total_tax_payable / gross_income * 100), 2) if gross_income > 0 else 0.0
    }

def analyze_tax_optimization(
    annual_salary: float,
    sec_80c: float = 150000.0,
    sec_80d: float = 25000.0,
    sec_80ccd_1b: float = 50000.0,
    sec_24b: float = 0.0,
    financial_year: str = "FY 2025-26"
) -> Dict[str, Any]:
    """
    Perform comparative tax audit between Old and New Regime and generate plain-English, actionable tax recommendations.
    """
    old_res = calculate_old_regime_tax(
        annual_salary,
        sec_80c=sec_80c,
        sec_80d=sec_80d,
        sec_80ccd_1b=sec_80ccd_1b,
        sec_24b=sec_24b
    )
    
    new_res = calculate_new_regime_tax(annual_salary, financial_year=financial_year)
    
    old_tax = old_res["total_tax_payable"]
    new_tax = new_res["total_tax_payable"]
    
    tax_savings = abs(old_tax - new_tax)
    winner = "New Regime" if new_tax <= old_tax else "Old Regime"
    
    recommendations: List[str] = []
    
    if winner == "New Regime":
        if new_tax == 0:
            recommendations.append(
                f"🎉 **Zero Tax Obligation**: Under the {financial_year} New Tax Regime, your annual salary of ₹{annual_salary:,.0f} incurs **₹0 tax**!"
            )
            recommendations.append(
                f"💡 **100% Liquidity Advantage**: Because salary up to ₹12.75 Lakhs is fully tax-free (with standard deduction + 87A rebate), you do NOT need to lock money away into 3-year ELSS or 15-year PPF schemes. Invest freely based on your financial goals!"
            )
        else:
            recommendations.append(
                f"The New Tax Regime saves you ₹{tax_savings:,.0f} annually compared to the Old Regime thanks to lower slab rates and the ₹75,000 standard discount."
            )
            recommendations.append(
                "Under the New Regime, you don't need to lock money into fixed tax-saving schemes, giving you total freedom over your monthly investments."
            )
    else:
        recommendations.append(
            f"The Old Tax Regime saves you ₹{tax_savings:,.0f} annually because your total claimed tax deductions (₹{old_res['itemized_deductions']['total_deductions']:,.0f}) beat the New Regime's breakeven point!"
        )
        if sec_80c < 150000:
            recommendations.append(
                f"💡 **ELSS / EPF Tip**: You can save an additional ₹{round((150000 - sec_80c) * 0.312):,.0f} by investing ₹{(150000 - sec_80c):,.0f} more into EPF, PPF, or ELSS Mutual Funds."
            )
        if sec_80ccd_1b < 50000:
            recommendations.append(
                f"💡 **NPS Pension Tip**: Allocate ₹{(50000 - sec_80ccd_1b):,.0f} into National Pension System (NPS) to claim an exclusive extra tax deduction."
            )
        if sec_80d < 25000:
            recommendations.append(
                "💡 **Health Insurance Tip**: Claiming health insurance premiums for yourself and senior citizen parents can lower your taxable salary further."
            )

    return {
        "annual_salary": annual_salary,
        "financial_year": financial_year,
        "winner_regime": winner,
        "tax_savings_amount": tax_savings,
        "old_regime": old_res,
        "new_regime": new_res,
        "recommendations": recommendations
    }

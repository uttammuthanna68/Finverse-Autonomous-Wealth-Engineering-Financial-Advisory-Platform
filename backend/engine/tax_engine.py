"""
Finverse Income Tax Calculation Engine (Indian Tax System FY 2024-25 / FY 2025-26)
Compares Old Tax Regime vs. New Tax Regime, computes tax liabilities, cess, Section 87A rebate,
and identifies the optimal 'Winner' regime with tailored tax-saving recommendations.
"""

from typing import Dict, Any, List

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
    
    # Old Regime Slabs
    raw_tax = 0.0
    if taxable_income > 1000000:
        raw_tax += (taxable_income - 1000000) * 0.30
        raw_tax += 500000 * 0.20 # 5L to 10L = 1L
        raw_tax += 250000 * 0.05 # 2.5L to 5L = 12.5k
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
    standard_deduction: float = 75000.0
) -> Dict[str, Any]:
    """
    Calculate Tax Liability under New Tax Regime (FY 2024-25 / FY 2025-26 Budget Slabs).
    Slabs:
    0 - 3L: 0%
    3L - 7L: 5%
    7L - 10L: 10%
    10L - 12L: 15%
    12L - 15L: 20%
    Above 15L: 30%
    87A Rebate: Full tax rebate if taxable income <= 7,00,000.
    """
    taxable_income = max(0.0, gross_income - standard_deduction)
    
    raw_tax = 0.0
    if taxable_income > 1500000:
        raw_tax += (taxable_income - 1500000) * 0.30
        raw_tax += 300000 * 0.20 # 12L to 15L
        raw_tax += 200000 * 0.15 # 10L to 12L
        raw_tax += 300000 * 0.10 # 7L to 10L
        raw_tax += 400000 * 0.05 # 3L to 7L = 20,000
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
        
    # Section 87A Rebate for New Regime (Taxable income <= 7,00,000)
    rebate_87a = 0.0
    if taxable_income <= 700000:
        rebate_87a = min(raw_tax, 25000.0)
        
    tax_after_rebate = max(0.0, raw_tax - rebate_87a)
    cess = tax_after_rebate * 0.04
    total_tax_payable = tax_after_rebate + cess
    
    return {
        "regime": "New Regime",
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
    sec_24b: float = 0.0
) -> Dict[str, Any]:
    """
    Perform comparative tax audit between Old and New Regime and generate actionable tax recommendations.
    """
    old_res = calculate_old_regime_tax(
        annual_salary,
        sec_80c=sec_80c,
        sec_80d=sec_80d,
        sec_80ccd_1b=sec_80ccd_1b,
        sec_24b=sec_24b
    )
    
    new_res = calculate_new_regime_tax(annual_salary)
    
    old_tax = old_res["total_tax_payable"]
    new_tax = new_res["total_tax_payable"]
    
    tax_savings = abs(old_tax - new_tax)
    winner = "New Regime" if new_tax <= old_tax else "Old Regime"
    
    recommendations: List[str] = []
    
    if winner == "New Regime":
        recommendations.append(
            f"The New Tax Regime saves you ₹{tax_savings:,} annually due to lower slab rates and an increased ₹75,000 standard deduction."
        )
        if annual_salary <= 775000:
            recommendations.append(
                "Your gross salary is within the zero-tax limit (₹7.75 Lakhs including ₹75k Standard Deduction) under Section 87A rebate."
            )
        else:
            recommendations.append(
                "Under the New Regime, you don't need to lock money into tax-saving ELSS or PPF funds just for tax deductions, giving you full liquidity!"
            )
    else:
        recommendations.append(
            f"The Old Tax Regime saves you ₹{tax_savings:,} annually because your itemized deductions (₹{old_res['itemized_deductions']['total_deductions']:,}) exceed the breakeven threshold!"
        )
        if sec_80c < 150000:
            recommendations.append(
                f"You can save an additional ₹{round((150000 - sec_80c) * 0.312):,} by maxing out Section 80C (ELSS, EPF, PPF) up to ₹1.5 Lakhs."
            )
        if sec_80ccd_1b < 50000:
            recommendations.append(
                f"Consider allocating ₹{50000 - sec_80ccd_1b:,} into National Pension System (NPS 80CCD 1B) for exclusive extra tax deductions."
            )

    return {
        "annual_salary": annual_salary,
        "winner_regime": winner,
        "tax_savings_amount": tax_savings,
        "old_regime": old_res,
        "new_regime": new_res,
        "recommendations": recommendations
    }

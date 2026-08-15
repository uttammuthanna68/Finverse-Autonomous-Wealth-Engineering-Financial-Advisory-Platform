import json
import os
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.db.models import User, FinancialProfile, Debt, CreditCard, SavedScenario
from backend.db.encryption import decrypt_field
from backend.auth.security import decode_access_token
from backend.engine.debt import (
    calculate_debt_waterfall,
    generate_cibil_nudges,
    calculate_credit_card_utilization,
)
from backend.engine.risk import calculate_risk_score
from backend.engine.allocation import allocate_goal_portfolio, generate_preset_lenses
from backend.engine.priority import generate_priority_action_plan
from backend.engine.goal_conflicts import analyze_goal_conflicts
from backend.engine.calculators import (
    calculate_sip,
    calculate_lumpsum,
    calculate_reverse_goal,
)
from backend.engine.rewards import optimize_card_rewards
from backend.engine.tax_engine import analyze_tax_optimization

router = APIRouter(prefix="/api/engine", tags=["Engine"])

class RecommendationRequest(BaseModel):
    user_id: Optional[int] = 1
    trigger_error: Optional[bool] = False
    financial_data: Optional[Dict[str, Any]] = None

class DebtAnalysisRequest(BaseModel):
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    current_savings: Optional[float] = None
    cibil_band: Optional[str] = "Good (700-749)"
    debts: Optional[List[Dict[str, Any]]] = None
    credit_cards: Optional[List[Dict[str, Any]]] = None
    risk_score: Optional[float] = 50.0

class AllocationRequest(BaseModel):
    age: Optional[int] = 30
    monthly_income: Optional[float] = 100000.0
    monthly_expenses: Optional[float] = 40000.0
    current_savings: Optional[float] = 250000.0
    total_debt_balance: Optional[float] = 0.0
    employment_type: Optional[str] = "salaried-private"
    dependents: Optional[int] = 0
    credit_cards: Optional[List[Dict[str, Any]]] = None
    goals: Optional[List[Dict[str, Any]]] = None

class PriorityRequest(BaseModel):
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    current_savings: Optional[float] = None
    debts: Optional[List[Dict[str, Any]]] = None
    credit_cards: Optional[List[Dict[str, Any]]] = None
    has_dependents: Optional[bool] = False
    has_health_insurance: Optional[bool] = True
    has_term_life_insurance: Optional[bool] = True
    user_age: Optional[int] = 30
    cibil_band: Optional[str] = "Good (700-749)"
    employment_type: Optional[str] = "salaried-private"
    dependents_count: Optional[int] = 0
    goals: Optional[List[Dict[str, Any]]] = None

class GoalConflictRequest(BaseModel):
    goals: List[Dict[str, Any]]
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    current_savings: Optional[float] = None
    debts: Optional[List[Dict[str, Any]]] = None
    credit_cards: Optional[List[Dict[str, Any]]] = None
    user_age: Optional[int] = 30
    priority_output: Optional[Dict[str, Any]] = None

class SipRequest(BaseModel):
    initial_monthly_sip: float = 10000.0
    annual_step_up_percent: float = 10.0
    expected_annual_return_percent: float = 12.0
    duration_years: int = 10
    inflation_rate_percent: float = 6.0

class LumpsumRequest(BaseModel):
    lumpsum_amount: float = 500000.0
    expected_annual_return_percent: float = 12.0
    duration_years: int = 10
    inflation_rate_percent: float = 6.0

class ReverseGoalRequest(BaseModel):
    target_amount_today: float = 1000000.0
    duration_years: int = 5
    expected_annual_return_percent: float = 12.0
    annual_step_up_percent: float = 0.0
    inflation_rate_percent: float = 6.0

class SaveScenarioRequest(BaseModel):
    scenario_name: str
    payload: Dict[str, Any]

class UpdateScenarioRequest(BaseModel):
    scenario_name: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None

class OptimizeRewardsRequest(BaseModel):
    purchase_category: str = "Dining"
    purchase_amount: float = 5000.0
    cards: List[Dict[str, Any]]

def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()

@router.get("/glossary")
def get_glossary():
    """
    Returns the seeded financial glossary definitions dictionary.
    """
    glossary_path = os.path.join(os.path.dirname(__file__), "..", "engine", "config", "glossary.json")
    if os.path.exists(glossary_path):
        with open(glossary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@router.post("/optimize-rewards")
def optimize_rewards_endpoint(req: OptimizeRewardsRequest):
    return optimize_card_rewards(
        cards=req.cards,
        purchase_category=req.purchase_category,
        purchase_amount=req.purchase_amount,
    )

@router.post("/generate-recommendations")
def generate_recommendations(req: RecommendationRequest):
    if req.trigger_error:
        raise HTTPException(
            status_code=500,
            detail="Simulated Engine Calculation Failure (Recommendation Engine Error)"
        )

    return {
        "status": "success",
        "recommendations": {
            "emergency_fund_months": 6,
            "equity_allocation_percent": 70,
            "debt_allocation_percent": 30,
            "priority_action": "Pay down high APR credit card debt before investing."
        }
    }

@router.post("/analyze-debts")
def analyze_debts(
    req: DebtAnalysisRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    income = req.monthly_income
    expenses = req.monthly_expenses
    savings = req.current_savings
    debts_list = req.debts
    cards_list = req.credit_cards

    if user and (income is None or debts_list is None):
        prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        if prof:
            if income is None:
                income = decrypt_field(prof.encrypted_salary) or 100000.0
            if expenses is None:
                expenses = decrypt_field(prof.encrypted_expenses) or 40000.0
            if savings is None:
                savings = decrypt_field(prof.encrypted_savings) or 250000.0

        if debts_list is None:
            user_debts = db.query(Debt).filter(Debt.user_id == user.id).all()
            debts_list = [
                {
                    "id": d.id,
                    "debt_name": d.debt_name,
                    "balance": decrypt_field(d.encrypted_balance) or 0.0,
                    "apr": d.apr,
                    "minimum_payment": decrypt_field(d.encrypted_minimum_payment) or 0.0,
                }
                for d in user_debts
            ]

        if cards_list is None:
            user_cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
            cards_list = [
                {
                    "card_name": c.card_name,
                    "balance": decrypt_field(c.encrypted_balance) or 0.0,
                    "credit_limit": c.credit_limit,
                }
                for c in user_cards
            ]

    income = income if income is not None else 100000.0
    expenses = expenses if expenses is not None else 40000.0
    savings = savings if savings is not None else 250000.0
    debts_list = debts_list if debts_list is not None else []
    cards_list = cards_list if cards_list is not None else []

    waterfall_result = calculate_debt_waterfall(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        debts=debts_list,
        risk_score=req.risk_score or 50.0,
    )

    cibil_nudges = generate_cibil_nudges(req.cibil_band or "Good (700-749)", cards_list)
    card_utilization = calculate_credit_card_utilization(cards_list)

    return {
        "status": "success",
        "waterfall": waterfall_result,
        "cibil_nudges": cibil_nudges,
        "card_utilization": card_utilization,
    }

@router.post("/calculate-allocation")
def calculate_allocation(
    req: AllocationRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    age = req.age or 30
    income = req.monthly_income or 100000.0
    expenses = req.monthly_expenses or 40000.0
    savings = req.current_savings or 250000.0
    debt = req.total_debt_balance or 0.0
    employment = req.employment_type or "salaried-private"
    dependents = req.dependents or 0
    cards = req.credit_cards or []
    goals = req.goals or [
        {"name": "Emergency Reserve", "target_amount": 300000.0, "target_date": "2028-12-31"}
    ]

    risk_info = calculate_risk_score(
        age=age,
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        total_debt_balance=debt,
        employment_type=employment,
        dependents=dependents,
        credit_cards=cards,
    )

    score = risk_info["risk_score"]
    surplus = max(0.0, income - expenses)

    goal_portfolios = []
    for g in goals:
        goal_name = g.get("name", g.get("goal_name", "Financial Goal"))
        target_amt = float(g.get("target_amount", 500000.0))
        target_dt = str(g.get("target_date", "2028-12-31"))

        alloc = allocate_goal_portfolio(
            goal_name=goal_name,
            target_amount=target_amt,
            target_date=target_dt,
            user_age=age,
            risk_score=score,
            monthly_surplus=surplus,
        )
        goal_portfolios.append(alloc)

    presets = generate_preset_lenses(user_age=age, monthly_surplus=surplus, user_risk_score=score)

    return {
        "status": "success",
        "risk_summary": risk_info,
        "goal_portfolios": goal_portfolios,
        "preset_lenses": presets,
    }

@router.post("/calculate-priority")
def calculate_priority(
    req: PriorityRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    income = req.monthly_income
    expenses = req.monthly_expenses
    savings = req.current_savings
    debts_list = req.debts
    cards_list = req.credit_cards

    if user and (income is None or debts_list is None):
        prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        if prof:
            if income is None:
                income = decrypt_field(prof.encrypted_salary) or 100000.0
            if expenses is None:
                expenses = decrypt_field(prof.encrypted_expenses) or 40000.0
            if savings is None:
                savings = decrypt_field(prof.encrypted_savings) or 250000.0

        if debts_list is None:
            user_debts = db.query(Debt).filter(Debt.user_id == user.id).all()
            debts_list = [
                {
                    "id": d.id,
                    "debt_name": d.debt_name,
                    "balance": decrypt_field(d.encrypted_balance) or 0.0,
                    "apr": d.apr,
                    "minimum_payment": decrypt_field(d.encrypted_minimum_payment) or 0.0,
                }
                for d in user_debts
            ]

        if cards_list is None:
            user_cards = db.query(CreditCard).filter(CreditCard.user_id == user.id).all()
            cards_list = [
                {
                    "card_name": c.card_name,
                    "balance": decrypt_field(c.encrypted_balance) or 0.0,
                    "credit_limit": c.credit_limit,
                }
                for c in user_cards
            ]

    income = income if income is not None else 100000.0
    expenses = expenses if expenses is not None else 40000.0
    savings = savings if savings is not None else 250000.0
    debts_list = debts_list if debts_list is not None else []
    cards_list = cards_list if cards_list is not None else []

    plan = generate_priority_action_plan(
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        debts=debts_list,
        credit_cards=cards_list,
        has_dependents=req.has_dependents or False,
        has_health_insurance=req.has_health_insurance if req.has_health_insurance is not None else True,
        has_term_life_insurance=req.has_term_life_insurance if req.has_term_life_insurance is not None else True,
        user_age=req.user_age or 30,
        cibil_band=req.cibil_band or "Good (700-749)",
        employment_type=req.employment_type or "salaried-private",
        dependents_count=req.dependents_count or 0,
        goals=req.goals or [],
    )

    return plan

@router.post("/analyze-goal-conflicts")
def analyze_goal_conflicts_endpoint(
    req: GoalConflictRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    income = req.monthly_income
    expenses = req.monthly_expenses
    savings = req.current_savings
    debts_list = req.debts

    if user and (income is None or debts_list is None):
        prof = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        if prof:
            if income is None:
                income = decrypt_field(prof.encrypted_salary) or 100000.0
            if expenses is None:
                expenses = decrypt_field(prof.encrypted_expenses) or 40000.0
            if savings is None:
                savings = decrypt_field(prof.encrypted_savings) or 250000.0

        if debts_list is None:
            user_debts = db.query(Debt).filter(Debt.user_id == user.id).all()
            debts_list = [
                {
                    "id": d.id,
                    "debt_name": d.debt_name,
                    "balance": decrypt_field(d.encrypted_balance) or 0.0,
                    "apr": d.apr,
                    "minimum_payment": decrypt_field(d.encrypted_minimum_payment) or 0.0,
                }
                for d in user_debts
            ]

    income = income if income is not None else 100000.0
    expenses = expenses if expenses is not None else 40000.0
    savings = savings if savings is not None else 250000.0
    debts_list = debts_list if debts_list is not None else []

    res = analyze_goal_conflicts(
        goals=req.goals,
        priority_output=req.priority_output,
        monthly_income=income,
        monthly_expenses=expenses,
        current_savings=savings,
        debts=debts_list,
        credit_cards=req.credit_cards,
        user_age=req.user_age or 30,
    )

    return res

# -------------------------------------------------------------
# CALCULATOR ENDPOINTS
# -------------------------------------------------------------

@router.post("/calculators/sip")
def sip_calculator_endpoint(req: SipRequest):
    return calculate_sip(
        initial_monthly_sip=req.initial_monthly_sip,
        annual_step_up_percent=req.annual_step_up_percent,
        expected_annual_return_percent=req.expected_annual_return_percent,
        duration_years=req.duration_years,
        inflation_rate_percent=req.inflation_rate_percent,
    )

@router.post("/calculators/lumpsum")
def lumpsum_calculator_endpoint(req: LumpsumRequest):
    return calculate_lumpsum(
        lumpsum_amount=req.lumpsum_amount,
        expected_annual_return_percent=req.expected_annual_return_percent,
        duration_years=req.duration_years,
        inflation_rate_percent=req.inflation_rate_percent,
    )

@router.post("/calculators/reverse-goal")
def reverse_goal_calculator_endpoint(req: ReverseGoalRequest):
    return calculate_reverse_goal(
        target_amount_today=req.target_amount_today,
        duration_years=req.duration_years,
        expected_annual_return_percent=req.expected_annual_return_percent,
        annual_step_up_percent=req.annual_step_up_percent,
        inflation_rate_percent=req.inflation_rate_percent,
    )

# -------------------------------------------------------------
# SCENARIO PERSISTENCE ENDPOINTS
# -------------------------------------------------------------

@router.get("/scenarios")
def list_scenarios(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = user.id if user else 1
    scenarios = db.query(SavedScenario).filter(SavedScenario.user_id == user_id).all()
    return [
        {
            "id": s.id,
            "scenario_name": s.scenario_name,
            "payload": json.loads(s.payload_json) if s.payload_json else {},
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in scenarios
    ]

@router.post("/scenarios")
def save_scenario(
    req: SaveScenarioRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = user.id if user else 1
    new_scenario = SavedScenario(
        user_id=user_id,
        scenario_name=req.scenario_name,
        payload_json=json.dumps(req.payload),
    )
    db.add(new_scenario)
    db.commit()
    db.refresh(new_scenario)
    return {
        "status": "success",
        "scenario": {
            "id": new_scenario.id,
            "scenario_name": new_scenario.scenario_name,
            "payload": req.payload,
        }
    }

@router.put("/scenarios/{scenario_id}")
def update_scenario(
    scenario_id: int,
    req: UpdateScenarioRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = user.id if user else 1
    scenario = db.query(SavedScenario).filter(
        SavedScenario.id == scenario_id, SavedScenario.user_id == user_id
    ).first()

    if not scenario:
        raise HTTPException(status_code=404, detail="Saved scenario not found")

    if req.scenario_name is not None:
        scenario.scenario_name = req.scenario_name
    if req.payload is not None:
        scenario.payload_json = json.dumps(req.payload)

    db.commit()
    db.refresh(scenario)
    return {
        "status": "success",
        "scenario": {
            "id": scenario.id,
            "scenario_name": scenario.scenario_name,
            "payload": json.loads(scenario.payload_json),
        }
    }

@router.delete("/scenarios/{scenario_id}")
def delete_scenario(
    scenario_id: int,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = user.id if user else 1
    scenario = db.query(SavedScenario).filter(
        SavedScenario.id == scenario_id, SavedScenario.user_id == user_id
    ).first()

    if not scenario:
        raise HTTPException(status_code=404, detail="Saved scenario not found")

    db.delete(scenario)
    db.commit()
    return {"status": "success", "message": "Scenario deleted successfully"}

# -------------------------------------------------------------
# SHELLY AI CHATBOT ENDPOINT
# -------------------------------------------------------------

class ShellyChatRequest(BaseModel):
    message: str
    current_path: Optional[str] = None

@router.post("/shelly-chat")
def shelly_chat_endpoint(req: ShellyChatRequest):
    raw_msg = req.message.strip().lower()
    actions = []

    # Clean out question prefixes and suffixes for normalization
    clean_msg = raw_msg
    for prefix in [
        "what is ", "what was ", "what are ", "explain ", "tell me about ",
        "definition of ", "meaning of ", "how does ", "how to ", "what does ",
        "can you explain ", "do you know ", "i want to know about ", "what's "
    ]:
        if clean_msg.startswith(prefix):
            clean_msg = clean_msg[len(prefix):].strip(" ?!.,")
            break

    for suffix in [" mean", " meaning", " definition", " work", " works", " mean?"]:
        if clean_msg.endswith(suffix):
            clean_msg = clean_msg[:-len(suffix)].strip(" ?!.,")
            break

    clean_msg = clean_msg.strip(" ?!.,")

    # Load seeded glossary dictionary for fallback definitions
    glossary_dict = {}
    glossary_path = os.path.join(os.path.dirname(__file__), "..", "engine", "config", "glossary.json")
    if os.path.exists(glossary_path):
        try:
            with open(glossary_path, "r", encoding="utf-8") as f:
                glossary_dict = json.load(f)
        except Exception:
            pass

    # Domain Pattern Matching (checking raw_msg and clean_msg)
    # 1. Equity, Equity Allocation, Debt Allocation & Asset Allocation
    if any(k in raw_msg or k in clean_msg for k in ["equity allocation", "equity", "debt allocation", "asset allocation", "allocation"]):
        reply = (
            "**Equity Allocation** is the percentage of your monthly surplus invested in equity assets (like Large Cap, Mid Cap, and Small Cap stock funds) vs safety debt assets (like FDs and Bonds):\n\n"
            "• **Equity Role**: Drives long-term wealth compounding and beats inflation (~12–15% CAGR).\n"
            "• **Debt Role**: Protects capital safety and provides emergency liquidity (~6.5–7.5% CAGR).\n"
            "• **Finverse Allocation Rule**: Based on the `100 - Age` formula adjusted by your personal risk capacity score (e.g., a 30-year-old with moderate risk gets **70% Equity / 30% Debt**).\n\n"
            "View your customized 6-Asset Portfolio breakdown on the **Portfolios** page!"
        )
        actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})
        actions.append({"label": "Check Risk Capacity", "path": "/priority"})

    # 2. Risk Capacity, Risk Score & Risk Profile
    elif any(k in raw_msg or k in clean_msg for k in ["risk capacity", "risk score", "risk tolerance", "risk profile"]):
        reply = (
            "**Risk Capacity** is an objective evaluation of how much financial market risk your situation allows you to take:\n\n"
            "• Calculated based on your **Age**, **Income Stability**, **Fixed Living Expenses**, **Toxic Debt Balance**, and **Number of Dependents**.\n"
            "• **High Risk Capacity**: Unlocks higher equity allocation (~70-80%) for aggressive long-term compounding.\n"
            "• **Low Risk Capacity**: Recommends higher FD & bond allocation to guarantee capital safety."
        )
        actions.append({"label": "View Risk Profile & Priority", "path": "/priority"})

    # 3. Portfolio Rebalancing
    elif any(k in raw_msg or k in clean_msg for k in ["rebalanc", "rebalance"]):
        reply = (
            "**Portfolio Rebalancing** means periodically resetting your investments back to your target asset mix (e.g. 70% Equity / 30% Debt):\n\n"
            "• **Why it matters**: When equity markets rally, equity might grow from 70% to 85% of your portfolio, exposing you to higher crash risk. Rebalancing systematically sells high and buys low to lock in profits!"
        )
        actions.append({"label": "View Portfolios Page", "path": "/portfolios"})

    # 4. XIRR & CAGR
    elif any(k in raw_msg or k in clean_msg for k in ["xirr", "extended internal rate of return"]):
        reply = (
            "**XIRR (Extended Internal Rate of Return)** is the accurate annualized return rate for investments made via multiple periodic cash flows (like monthly SIPs or step-up SIPs):\n\n"
            "• Unlike simple CAGR (which only measures single lumpsums), XIRR accounts for the exact dates of every monthly SIP installment."
        )
        actions.append({"label": "Try SIP Calculator", "path": "/calculator"})

    elif any(k in raw_msg or k in clean_msg for k in ["cagr", "rate of return", "compound rate"]):
        reply = (
            "**CAGR (Compound Annual Growth Rate)** measures the annualized rate at which an investment grows over time:\n\n"
            "Formula: `CAGR = (End Value / Start Value)^(1/Years) - 1`."
        )
        actions.append({"label": "Open Return Simulator", "path": "/calculator"})

    # 5. Expense Ratio & Direct vs Regular Mutual Funds
    elif any(k in raw_msg or k in clean_msg for k in ["expense ratio", "direct plan", "regular plan", "direct vs regular"]):
        reply = (
            "**Expense Ratio & Direct Mutual Funds**:\n\n"
            "• **Expense Ratio**: The small annual percentage fee charged by mutual fund companies to manage your money.\n"
            "• **Direct vs Regular**: Direct plans buy straight from the mutual fund company with **zero agent commissions**. Regular plans charge 0.5–1% extra per year in distributor fees, which can eat up lakhs over 20 years!"
        )
        actions.append({"label": "Explore Portfolios", "path": "/portfolios"})

    # 6. Tax Saving / Section 80C / ELSS / PPF / EPF / NPS
    elif any(k in raw_msg or k in clean_msg for k in ["elss", "80c", "tax save", "ppf", "epf", "nps", "section 80c"]):
        reply = (
            "**Tax Saving Instruments (Section 80C)** allow tax deductions up to ₹1.5 Lakhs per year:\n\n"
            "• **ELSS Mutual Funds**: Lowest lock-in (3 years) + highest growth potential (~12-14% CAGR).\n"
            "• **PPF (Public Provident Fund)**: 15-year lock-in, 100% tax-free guaranteed returns (~7.1%).\n"
            "• **EPF**: Mandatory 12% deduction for salaried employees.\n"
            "• **NPS**: Additional ₹50,000 tax deduction under Section 80CCD(1B)."
        )
        actions.append({"label": "View Priority Plan", "path": "/priority"})

    # 7. Insurance / Term Life Insurance / Health Insurance / ULIP
    elif any(k in raw_msg or k in clean_msg for k in ["insurance", "term insurance", "health insurance", "ulip"]):
        reply = (
            "**Financial Insurance Rules**:\n\n"
            "• **Term Life Insurance**: Pure life protection paying a large lump sum to your family if you pass away. High cover at low cost.\n"
            "• **Health Insurance**: Mandatory policy protecting your emergency savings from medical bills.\n"
            "• **Avoid ULIPs**: Blending insurance and investment results in high hidden fees and lower returns!"
        )
        actions.append({"label": "View Priority Protection", "path": "/priority"})

    # 8. SGB / Sovereign Gold Bonds / NAV / Index Funds / 6 Asset Classes
    elif any(k in raw_msg or k in clean_msg for k in ["sgb", "sovereign gold", "nav", "net asset value", "index fund", "asset class", "nifty", "large cap", "mid cap", "small cap", "gold", "fixed deposit", "bonds"]):
        reply = (
            "Finverse allocates capital across **6 distinct Indian asset classes**:\n\n"
            "1. **Nifty 50 Large Cap Index** (~12% CAGR) for blue-chip equity.\n"
            "2. **Flexi & Mid Cap Equity** (~13.5% CAGR) for growth.\n"
            "3. **Small Cap Index Funds** (~15% CAGR) for aggressive upside.\n"
            "4. **Fixed Deposits & Liquid Funds** (~6.5% CAGR) for capital safety.\n"
            "5. **Short Duration Debt Bonds** (~7.5% CAGR) for yield.\n"
            "6. **Sovereign Gold Bonds (SGB) / Gold ETFs** (~8% CAGR + 2.5% extra interest) for inflation hedging."
        )
        actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})

    # 9. APR / Annual Percentage Rate / Toxic Interest Rates
    elif any(k in raw_msg or k in clean_msg for k in ["apr", "annual percentage rate", "interest rate", "toxic rate", "toxic debt"]):
        reply = (
            "**APR (Annual Percentage Rate)** represents the annualized cost of borrowing money, including interest and fees:\n\n"
            "• **Toxic High-APR Debt (>18-24%)**: Credit cards & personal loans typically charge **36–42% APR**. Finverse prioritizes paying these off first before investing single Rupee in equity markets!\n"
            "• **Low-APR Debt (<9%)**: Home loans & education loans carry lower APRs and offer tax deductions under Sections 24(b) & 80E.\n\n"
            "View your debt payoff waterfall on the **Debt Portfolio** page!"
        )
        actions.append({"label": "Go to Debt Portfolio", "path": "/debt"})
        actions.append({"label": "View Dashboard Roadmap", "path": "/dashboard"})

    # 10. EMI / Minimum Payment / Minimum Due / Outstanding Dues
    elif any(k in raw_msg or k in clean_msg for k in ["emi", "monthly emi", "minimum payment", "minimum due", "due date", "outstanding balance"]):
        reply = (
            "**EMI (Equated Monthly Installment)** is the fixed monthly amount paid toward loans:\n\n"
            "• **Credit Card Minimum Dues Warning**: Paying only the minimum due on credit cards triggers 40%+ annual interest on your entire balance! Always pay 100% of bill statement dues before the due date.\n"
            "• **Debt Avalanche Method**: Pay minimum dues on all loans, then throw 100% of remaining surplus at the debt with the highest APR!"
        )
        actions.append({"label": "Open Debt Payoff Waterfall", "path": "/debt"})

    # 11. Credit Cards, Best Credit Cards, Rewards, Cashback & Airmiles
    elif any(k in raw_msg or k in clean_msg for k in ["credit card", "best card", "which card", "card reward", "cashback", "airmiles", "card recommendation", "recommend card"]):
        reply = (
            "To pick the **best credit card** for your profile, evaluate cards based on your major spending categories:\n\n"
            "• **Best for Online Cashback**: SBI Cashback (5% flat online cashback) / ICICI Amazon Pay.\n"
            "• **Best for Travel & Dining**: HDFC Regalia Gold / Axis Atlas (airport lounge access & airmiles).\n"
            "• **No CIBIL / New to Credit**: Secured FD-backed credit cards (IDFC FIRST Wow / OneCard FD) to build credit history safely.\n\n"
            "Explore top Indian cards and optimize rewards on our **Credit Card Rewards** page!"
        )
        actions.append({"label": "Optimize Card Rewards", "path": "/creditcard/rewards"})
        actions.append({"label": "Check Debt & CIBIL", "path": "/debt"})

    # 12. Emergency Fund, Flexi-FD, Bank Sweep-In & Liquid Funds
    elif any(k in raw_msg or k in clean_msg for k in ["flexi fd", "flexi-fd", "sweep in", "sweep-in", "emergency fund", "emergency reserve", "liquid fund", "6x", "reserve cushion"]):
        reply = (
            "The **Gold Standard Emergency Fund (6× Rule)** is saving **6 months of living expenses** in liquid, penalty-free instruments before taking equity market risk:\n\n"
            "• **50% Flexi-FD (Bank Sweep-In)**: Earns ~6.5–7.5% p.a. while connected to your bank account for **instant 24/7 ATM & UPI access** without premature withdrawal penalties.\n"
            "• **50% Liquid / Arbitrage Debt Fund**: Provides high tax efficiency for 20-30% tax bracket earners with T+1 business day instant redemption.\n\n"
            "Check your Emergency Reserve progress on the **Portfolios** page!"
        )
        actions.append({"label": "View Emergency Fund Target", "path": "/portfolios"})
        actions.append({"label": "View Priority Plan", "path": "/priority"})

    # 13. Surplus, Monthly Surplus, Cash Flow, Salary & Expenses
    elif any(k in raw_msg or k in clean_msg for k in ["surplus", "monthly surplus", "cash flow", "inflow", "outflow", "salary", "expenses"]):
        reply = (
            "**Monthly Surplus** is the money remaining after subtracting monthly living expenses from monthly salary (`Surplus = Inflow - Outflow`).\n\n"
            "Finverse routes your monthly surplus through a **3-Tier Priority Waterfall**:\n"
            "1. **Priority #1**: Pay off toxic high-APR debt (>18% APR).\n"
            "2. **Priority #2**: Build 6-month Emergency Shield buffer.\n"
            "3. **Priority #3**: Invest into your 6-Asset Portfolio SIP!"
        )
        actions.append({"label": "View Dashboard Waterfall", "path": "/dashboard"})
        actions.append({"label": "Explore Portfolios", "path": "/portfolios"})

    # 14. CIBIL, Credit Score, CIBIL Band & Credit History
    elif any(k in raw_msg or k in clean_msg for k in ["cibil", "credit score", "cibil band", "credit report"]):
        reply = (
            "**CIBIL Score (300-900)** measures your credit health in India:\n\n"
            "• **750+ Excellent**: Unlocks lowest interest rates on future home & car loans.\n"
            "• **Sub-650 (Poor)**: Triggers higher interest rates or loan rejections.\n"
            "• **How to Improve**: Pay 100% of bill statements on time and keep credit card utilization below 30%."
        )
        actions.append({"label": "Check CIBIL Payoff Nudges", "path": "/debt"})

    # 15. SWP (Systematic Withdrawal Plan)
    elif any(k in raw_msg or k in clean_msg for k in ["swp", "systematic withdrawal"]):
        reply = (
            "**Systematic Withdrawal Plan (SWP)** allows fixed monthly withdrawals from mutual fund investments at regular intervals:\n\n"
            "• **Key Benefit**: Provides regular passive income during retirement while remaining capital continues compounding.\n"
            "• **Tax Efficiency**: Only the capital gains portion is taxed, making it far more tax-efficient than FD interest."
        )
        actions.append({"label": "Open Return Calculators", "path": "/calculator"})

    # 16. SIP, Step-Up SIP, Lumpsum & Compounding
    elif any(k in raw_msg or k in clean_msg for k in ["sip", "systematic investment", "step-up", "step up", "lumpsum", "inflation"]):
        reply = (
            "A **Systematic Investment Plan (SIP)** automates monthly mutual fund investments:\n\n"
            "• **Step-Up SIP**: Increasing your monthly SIP by 10% annually dramatically accelerates wealth compounding.\n"
            "• **Rupee Cost Averaging**: Buys more fund units when prices drop, eliminating market timing stress."
        )
        actions.append({"label": "Open SIP Calculator", "path": "/calculator"})

    # 17. Onboarding & Editing Profile Parameters
    elif any(k in raw_msg or k in clean_msg for k in ["onboarding", "edit profile", "change salary", "change expenses", "update parameters"]):
        reply = (
            "To update your salary, expenses, age, or savings: click **'Edit Profile Parameters'** at the top of the **Onboarding** page. Your Dashboard and Portfolio roadmaps will dynamically recalculate!"
        )
        actions.append({"label": "Edit Profile Parameters", "path": "/onboarding"})

    # 18. Dashboard & 1-Year Dated Roadmap
    elif any(k in raw_msg or k in clean_msg for k in ["roadmap", "1-year roadmap", "milestone", "check-in", "checkin", "30-day"]):
        reply = (
            "The **1-Year Dated Financial Execution Roadmap** on your Dashboard sets step-by-step milestones (starting 1st September 2026) prioritized by your real cash flow mathematics!"
        )
        actions.append({"label": "View Dashboard Roadmap", "path": "/dashboard"})

    # 19. Dynamic Comprehensive Glossary Fallback
    else:
        matched_term = None
        matched_def = None

        # Try exact key or substring match in glossary_dict
        for term, definition in glossary_dict.items():
            t_lower = term.lower()
            if t_lower == clean_msg or t_lower in raw_msg or clean_msg in t_lower or t_lower in clean_msg:
                matched_term = term
                matched_def = definition
                break

        # Fallback word-level match if phrase match didn't trigger
        if not matched_term:
            msg_words = set(clean_msg.split())
            for term, definition in glossary_dict.items():
                t_words = set(term.lower().split())
                if len(t_words) > 1 and t_words.issubset(msg_words):
                    matched_term = term
                    matched_def = definition
                    break

        if matched_term and matched_def:
            reply = (
                f"**{matched_term.upper()}**:\n\n{matched_def}\n\n"
                f"Ask me how this applies to your Finverse roadmap or explore our tools!"
            )
            # Route contextual action buttons based on term category
            t_lower = matched_term.lower()
            if any(w in t_lower for w in ["debt", "apr", "emi", "cibil", "avalanche", "snowball", "minimum"]):
                actions.append({"label": "Go to Debt Portfolio", "path": "/debt"})
            elif any(w in t_lower for w in ["card", "rewards", "cashback", "points"]):
                actions.append({"label": "Optimize Card Rewards", "path": "/creditcard/rewards"})
            elif any(w in t_lower for w in ["sip", "swp", "lumpsum", "cagr", "xirr", "calculator", "inflation", "goal"]):
                actions.append({"label": "Open Return Calculators", "path": "/calculator"})
            elif any(w in t_lower for w in ["risk", "priority", "insurance", "deficit"]):
                actions.append({"label": "View Priority Plan", "path": "/priority"})
            else:
                actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})
                actions.append({"label": "Open Return Calculators", "path": "/calculator"})
        else:
            reply = (
                "I'm Prof. Shelly! 🐢 Ask me about any financial term across Finverse — such as **Equity Allocation**, **Debt Allocation**, **Risk Capacity**, **Toxic Debt**, **Flexi-FD**, **SWP**, **Step-Up SIP**, **CIBIL Score**, **Debt Avalanche**, **Sovereign Gold Bonds**, or **Credit Card Rewards**!"
            )
            actions.append({"label": "Explore Portfolios", "path": "/portfolios"})
            actions.append({"label": "Open Calculators", "path": "/calculator"})

    return {
        "status": "success",
        "reply": reply,
        "actions": actions
    }


class TaxAnalysisRequest(BaseModel):
    annual_salary: float
    sec_80c: Optional[float] = 150000.0
    sec_80d: Optional[float] = 25000.0
    sec_80ccd_1b: Optional[float] = 50000.0
    sec_24b: Optional[float] = 0.0

@router.post("/tax-analysis")
def get_tax_analysis(request: TaxAnalysisRequest):
    try:
        res = analyze_tax_optimization(
            annual_salary=request.annual_salary,
            sec_80c=request.sec_80c or 0.0,
            sec_80d=request.sec_80d or 0.0,
            sec_80ccd_1b=request.sec_80ccd_1b or 0.0,
            sec_24b=request.sec_24b or 0.0
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



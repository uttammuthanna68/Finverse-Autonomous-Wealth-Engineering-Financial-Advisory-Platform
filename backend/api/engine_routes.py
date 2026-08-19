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
from backend.engine.market_data import fetch_live_market_data
from backend.engine.shelly_gemini import generate_shelly_gemini_response

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

    market_snap = fetch_live_market_data()
    presets = generate_preset_lenses(
        user_age=age,
        monthly_surplus=surplus,
        user_risk_score=score,
        market_snapshot=market_snap
    )

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
    message: Optional[str] = None
    query: Optional[str] = None
    user_name: Optional[str] = None
    current_path: Optional[str] = None

    @property
    def text(self) -> str:
        return (self.message or self.query or "").strip()

@router.get("/market-intelligence")
def get_market_intelligence(force_refresh: bool = False):
    """
    Returns live market metrics (Nifty 50, Sensex, Gold, 10Y Bond), valuation regime, 
    and dynamic Lump Sum vs SIP investment advice.
    """
    try:
        data = fetch_live_market_data(force_refresh=force_refresh)
        return {
            "status": "success",
            "market_data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/shelly-chat")
@router.post("/shelly/ask")
def shelly_chat_endpoint(req: ShellyChatRequest):
    user_text = req.text
    if not user_text:
        raise HTTPException(status_code=400, detail="Message or query field is required.")
        
    raw_msg = user_text.lower()
    
    # 1. Fetch live market snapshot for context
    market_snapshot = fetch_live_market_data(force_refresh=False)
    
    # 2. Try Gemini AI integration first if key is present
    gemini_res = generate_shelly_gemini_response(
        user_message=user_text,
        user_context=None,
        market_snapshot=market_snapshot
    )
    if gemini_res:
        return {
            "status": "success",
            "reply": gemini_res["reply"],
            "answer": gemini_res["reply"],
            "actions": gemini_res["actions"],
            "source": "gemini_ai"
        }

    # 3. Local Rule Engine Fallback (Witty, Crisp & Market-Aware)
    actions = []
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
    # Lump Sum Specific Match with Live Market Warning
    if any(k in raw_msg or k in clean_msg for k in ["lump sum", "lumpsum", "single investment", "one time investment", "one-time"]):
        pe_level = market_snapshot.get("regime", {}).get("pe_level", 24.6)
        lumpsum_rec = market_snapshot.get("regime", {}).get("lumpsum_recommendation", "AVOID_LUMPSUM")
        
        if lumpsum_rec == "AVOID_LUMPSUM":
            reply = (
                f"**Lump Sum** means dumping a big pile of cash into an investment all at once — like dropping ₹1 Lakh into an equity index fund today.\n\n"
                f"🐢 **Shelly's Market Warning**: Right now, the Nifty 50 P/E ratio is sitting elevated at **{pe_level}**. "
                f"Lumping large cash into equity when valuations are high is like buying full-price tickets to a movie that's about to go on sale. "
                f"**My recommendation**: Hold off on equity lump sums right now! Break your money into monthly SIPs or park it in Short-Duration Debt/FDs."
            )
        else:
            reply = (
                f"**Lump Sum** means investing a single lump of capital upfront instead of spreading it out monthly (SIP).\n\n"
                f"• **When to do it**: When market valuations are low or after a healthy correction.\n"
                f"• **Finverse Rule**: Always keep your 6-month Emergency Reserve intact before doing any equity lump sum!"
            )
        actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})
        actions.append({"label": "Open Return Calculators", "path": "/calculator"})

    # Equity & Asset Allocation / Diversification
    elif any(k in raw_msg or k in clean_msg for k in ["diversify", "diversification", "diversified", "equity allocation", "equity", "debt allocation", "asset allocation", "allocation"]):
        reply = (
            "**Diversification** is the golden rule of wealth building: never put all your eggs in one shell! 🐢\n\n"
            "By spreading your capital across **6 distinct asset classes** (Nifty 50, Flexi Cap, Small Cap, Sovereign Gold, Short-Duration Debt, and Emergency FDs), you capture long-term compounding (~12-15% CAGR) while shielding your downside when one market sector dips.\n\n"
            "• **Equity (Nifty/Flexi/Small Cap)**: Drives primary wealth growth.\n"
            "• **Gold & Debt**: Acts as a shock absorber during market pullbacks.\n"
            "• **Finverse Rule**: We auto-allocate your monthly surplus based on your age, risk capacity score, and emergency reserve status!"
        )
        actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})
        actions.append({"label": "Open Priority Action Engine", "path": "/priority"})
        actions.append({"label": "Check Risk Profile", "path": "/priority"})

    # Risk Capacity
    elif any(k in raw_msg or k in clean_msg for k in ["risk capacity", "risk score", "risk tolerance", "risk profile"]):
        reply = (
            "**Risk Capacity** is how much market risk your real bank account can actually handle — not how brave you feel!\n\n"
            "• Calculated based on **Age**, **Income Stability**, **Fixed Expenses**, **Toxic Debt**, and **Dependents**."
        )
        actions.append({"label": "View Risk Profile & Priority", "path": "/priority"})

    # Portfolio Rebalancing
    elif any(k in raw_msg or k in clean_msg for k in ["rebalanc", "rebalance"]):
        reply = (
            "**Portfolio Rebalancing** means resetting your money back to your target asset mix (e.g. 70% Equity / 30% Debt).\n\n"
            "• When equity rallies, sell a little equity high and lock profits into debt. When equity crashes, buy low!"
        )
        actions.append({"label": "View Portfolios Page", "path": "/portfolios"})

    # XIRR & CAGR
    elif any(k in raw_msg or k in clean_msg for k in ["xirr", "extended internal rate of return"]):
        reply = (
            "**XIRR** is the true annualized return for monthly SIP cash flows, taking exact installment dates into account."
        )
        actions.append({"label": "Try SIP Calculator", "path": "/calculator"})

    elif any(k in raw_msg or k in clean_msg for k in ["cagr", "rate of return", "compound rate"]):
        reply = (
            "**CAGR** is the compound annual growth rate of a single lump sum investment over time."
        )
        actions.append({"label": "Open Return Simulator", "path": "/calculator"})

    # Expense Ratio & Direct vs Regular Mutual Funds
    elif any(k in raw_msg or k in clean_msg for k in ["expense ratio", "direct plan", "regular plan", "direct vs regular"]):
        reply = (
            "**Direct vs Regular Funds**:\n\n"
            "• **Direct Plan**: Zero distributor commissions. 100% of your money grows for you.\n"
            "• **Regular Plan**: Pays 0.5–1% extra annual fee to middleman brokers. Avoid them!"
        )
        actions.append({"label": "Explore Portfolios", "path": "/portfolios"})

    # Tax Saving / Section 80C
    elif any(k in raw_msg or k in clean_msg for k in ["elss", "80c", "tax save", "ppf", "epf", "nps", "section 80c"]):
        reply = (
            "**Tax Saving (Section 80C)** allows tax deductions up to ₹1.5 Lakhs/yr:\n\n"
            "• **ELSS Funds**: 3-yr lock-in + equity growth (~12-14% CAGR).\n"
            "• **PPF**: 15-yr lock-in, 100% tax-free guaranteed returns (~7.1%)."
        )
        actions.append({"label": "View Priority Plan", "path": "/priority"})

    # Insurance
    elif any(k in raw_msg or k in clean_msg for k in ["insurance", "term insurance", "health insurance", "ulip"]):
        reply = (
            "**Insurance Rules**:\n\n"
            "• **Term Insurance**: Pure life protection. High cover for low cost.\n"
            "• **Health Insurance**: Mandatory shield against hospital bills.\n"
            "• **Avoid ULIPs**: Blending investment + insurance gives bad returns and high fees!"
        )
        actions.append({"label": "View Priority Protection", "path": "/priority"})

    # 6 Asset Classes & SGB
    elif any(k in raw_msg or k in clean_msg for k in ["sgb", "sovereign gold", "nav", "net asset value", "index fund", "asset class", "nifty", "large cap", "mid cap", "small cap", "gold", "fixed deposit", "bonds"]):
        reply = (
            "Finverse allocates capital across **6 Indian asset classes**:\n"
            "1. Nifty 50 Large Cap (~12% CAGR)\n"
            "2. Flexi & Mid Cap (~13.5% CAGR)\n"
            "3. Small Cap Index (~15% CAGR)\n"
            "4. Fixed Deposits (~6.5% CAGR)\n"
            "5. Short Duration Debt (~7.5% CAGR)\n"
            "6. Sovereign Gold Bonds SGB (~8% CAGR + 2.5% interest)"
        )
        actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})

    # APR & Toxic Debt
    elif any(k in raw_msg or k in clean_msg for k in ["apr", "annual percentage rate", "interest rate", "toxic rate", "toxic debt"]):
        reply = (
            "**Toxic High-APR Debt (>18-24%)**: Credit cards & instant personal loans charge up to **42% APR**. "
            "Finverse requires paying these off 100% before investing single Rupee in equity!"
        )
        actions.append({"label": "Go to Debt Portfolio", "path": "/debt"})

    # EMI & Minimum Payment
    elif any(k in raw_msg or k in clean_msg for k in ["emi", "monthly emi", "minimum payment", "minimum due", "due date"]):
        reply = (
            "**Credit Card Minimum Dues Warning**: Paying only the minimum due triggers 40%+ interest on your full balance! Always pay 100% statement dues."
        )
        actions.append({"label": "Open Debt Payoff Waterfall", "path": "/debt"})

    # Credit Cards & Rewards
    elif any(k in raw_msg or k in clean_msg for k in ["credit card", "best card", "card reward", "cashback", "airmiles"]):
        reply = (
            "**Top Credit Cards**:\n\n"
            "• **Online Shopping**: SBI Cashback (5% flat online cashback).\n"
            "• **Travel & Dining**: Axis Atlas / HDFC Regalia Gold.\n"
            "• **New to Credit**: FD-backed cards like IDFC FIRST Wow."
        )
        actions.append({"label": "Optimize Card Rewards", "path": "/creditcard/rewards"})

    # Emergency Fund & Flexi-FD
    elif any(k in raw_msg or k in clean_msg for k in ["flexi fd", "flexi-fd", "sweep in", "emergency fund", "liquid fund"]):
        reply = (
            "**6-Month Emergency Shield**:\n\n"
            "• **50% Flexi-FD (Bank Sweep-In)**: Earns ~7% interest with 24/7 instant ATM access.\n"
            "• **50% Liquid Mutual Fund**: High tax efficiency for higher tax brackets."
        )
        actions.append({"label": "View Emergency Target", "path": "/portfolios"})

    # Monthly Surplus
    elif any(k in raw_msg or k in clean_msg for k in ["surplus", "monthly surplus", "cash flow", "salary"]):
        reply = (
            "**Monthly Surplus** = `Income - Expenses`.\n"
            "Finverse routes surplus: #1 Pay Toxic Debt -> #2 Build Emergency Shield -> #3 6-Asset Portfolio."
        )
        actions.append({"label": "View Waterfall", "path": "/dashboard"})

    # CIBIL Score
    elif any(k in raw_msg or k in clean_msg for k in ["cibil", "credit score"]):
        reply = (
            "**CIBIL Score (300-900)**: 750+ unlocks lowest loan interest rates. Keep card utilization under 30% to boost your score."
        )
        actions.append({"label": "Check CIBIL Payoff Nudges", "path": "/debt"})

    # SIP & Step-Up SIP
    elif any(k in raw_msg or k in clean_msg for k in ["sip", "systematic investment", "step-up", "step up"]):
        reply = (
            "**Systematic Investment Plan (SIP)** automates monthly investing. "
            "Increasing your SIP by 10% annually (**Step-Up SIP**) can double your final 20-year wealth!"
        )
        actions.append({"label": "Open SIP Calculator", "path": "/calculator"})

    # Dynamic Comprehensive Glossary Fallback
    else:
        matched_term = None
        matched_def = None

        for term, definition in glossary_dict.items():
            t_lower = term.lower()
            if t_lower == clean_msg or t_lower in raw_msg or clean_msg in t_lower or t_lower in clean_msg:
                matched_term = term
                matched_def = definition
                break

        if matched_term and matched_def:
            reply = f"**{matched_term.upper()}**:\n\n{matched_def}"
            actions.append({"label": "Explore 6-Asset Portfolios", "path": "/portfolios"})
            actions.append({"label": "Open Calculators", "path": "/calculator"})
        else:
            reply = (
                "I'm Prof. Shelly! 🐢 Ask me any financial question — e.g. **What is lump sum?**, **What is flexi-FD?**, **How does equity allocation work?**, or **Which credit card is best?**"
            )
            actions.append({"label": "Explore Portfolios", "path": "/portfolios"})
            actions.append({"label": "Open Calculators", "path": "/calculator"})

    return {
        "status": "success",
        "reply": reply,
        "answer": reply,
        "actions": actions,
        "source": "local_engine"
    }


class TaxAnalysisRequest(BaseModel):
    annual_salary: float
    sec_80c: Optional[float] = 150000.0
    sec_80d: Optional[float] = 25000.0
    sec_80ccd_1b: Optional[float] = 50000.0
    sec_24b: Optional[float] = 0.0
    financial_year: Optional[str] = "FY 2025-26"

@router.post("/tax-analysis")
def get_tax_analysis(request: TaxAnalysisRequest):
    try:
        res = analyze_tax_optimization(
            annual_salary=request.annual_salary,
            sec_80c=request.sec_80c or 0.0,
            sec_80d=request.sec_80d or 0.0,
            sec_80ccd_1b=request.sec_80ccd_1b or 0.0,
            sec_24b=request.sec_24b or 0.0,
            financial_year=request.financial_year or "FY 2025-26"
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



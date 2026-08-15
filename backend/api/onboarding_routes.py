from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.db.models import User, SavedScenario
from backend.auth.security import decode_access_token
import json

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])

class SaveStepRequest(BaseModel):
    step_id: str
    step_data: Dict[str, Any]

def get_current_user_optional(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Optional[User]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None
    return db.query(User).filter(User.id == int(payload["sub"])).first()

@router.post("/save-step")
def save_step(
    req: SaveStepRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Saves onboarding step data independently.
    Succeeds whenever submitted data itself is valid, entirely independent of recommendation engines.
    """
    if not req.step_id:
        raise HTTPException(status_code=400, detail="step_id is required.")

    user_id = user.id if user else 1 # Fallback to default user 1 for guest onboarding

    scenario_name = f"onboarding_step_{req.step_id}"
    existing = db.query(SavedScenario).filter(
        SavedScenario.user_id == user_id,
        SavedScenario.scenario_name == scenario_name
    ).first()

    payload_str = json.dumps(req.step_data)

    if existing:
        existing.payload_json = payload_str
    else:
        new_step = SavedScenario(
            user_id=user_id,
            scenario_name=scenario_name,
            payload_json=payload_str
        )
        db.add(new_step)

    # Sync step data directly into FinancialProfile, InsuranceStatus, and Debt tables if authenticated
    if user:
        from backend.db.models import FinancialProfile, InsuranceStatus, Debt
        from backend.db.encryption import encrypt_field

        profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
        if not profile:
            profile = FinancialProfile(user_id=user.id)
            db.add(profile)

        insurance = db.query(InsuranceStatus).filter(InsuranceStatus.user_id == user.id).first()
        if not insurance:
            insurance = InsuranceStatus(user_id=user.id)
            db.add(insurance)

        data = req.step_data or {}
        if "monthly_salary" in data and data["monthly_salary"] is not None:
            profile.encrypted_salary = encrypt_field(float(data["monthly_salary"]))
        if "monthly_expenses" in data and data["monthly_expenses"] is not None:
            profile.encrypted_expenses = encrypt_field(float(data["monthly_expenses"]))
        if "current_savings" in data and data["current_savings"] is not None:
            profile.encrypted_savings = encrypt_field(float(data["current_savings"]))
        if "age" in data and data["age"] is not None and data["age"] != "":
            profile.age = int(data["age"])
        if "employment_type" in data and data["employment_type"]:
            profile.employment_type = str(data["employment_type"])
        if "dependents" in data and data["dependents"] is not None:
            profile.dependents = int(data["dependents"])

        if "health_insurance" in data and data["health_insurance"] is not None:
            insurance.health_insurance = bool(data["health_insurance"])
        if "term_life_insurance" in data and data["term_life_insurance"] is not None:
            insurance.term_life_insurance = bool(data["term_life_insurance"])

        # Sync debts array into backend Debt table if provided in step 4 or step payload
        if "debts" in data and isinstance(data["debts"], list):
            # Delete existing debts for user to overwrite with latest onboarding list
            db.query(Debt).filter(Debt.user_id == user.id).delete()

            for d_item in data["debts"]:
                if isinstance(d_item, dict):
                    balance = float(d_item.get("balance") or 0.0)
                    apr = float(d_item.get("apr") or 0.0)
                    min_pay = float(d_item.get("minimum_payment") or 0.0)
                    raw_type = str(d_item.get("debt_type") or d_item.get("debt_name") or "Personal Loan")
                    d_name = raw_type.replace("_", " ").title()

                    if balance > 0:
                        new_debt = Debt(
                            user_id=user.id,
                            debt_name=d_name,
                            apr=apr,
                            encrypted_balance=encrypt_field(balance),
                            encrypted_minimum_payment=encrypt_field(min_pay)
                        )
                        db.add(new_debt)

        if req.step_id in ["step_6_goals", "step_6", "recommendation", "completed"]:
            profile.has_completed_onboarding = True

    db.commit()

    return {
        "status": "success",
        "saved_step": req.step_id,
        "message": f"Onboarding step '{req.step_id}' saved successfully."
    }

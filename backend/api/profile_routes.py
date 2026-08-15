from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.db.models import User, FinancialProfile, InsuranceStatus
from backend.db.encryption import encrypt_field, decrypt_field
from backend.auth.security import decode_access_token

router = APIRouter(prefix="/api/profile", tags=["Profile"])

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    employment_type: Optional[str] = None
    dependents: Optional[int] = 0
    salary: Optional[float] = None
    expenses: Optional[float] = None
    savings: Optional[float] = None
    has_completed_onboarding: Optional[bool] = None
    
    # Insurance toggles
    health_insurance: Optional[bool] = False
    term_life_insurance: Optional[bool] = False
    disability_insurance: Optional[bool] = False
    critical_illness_insurance: Optional[bool] = False

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

@router.get("/me")
@router.get("")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    insurance = db.query(InsuranceStatus).filter(InsuranceStatus.user_id == user.id).first()

    salary = decrypt_field(profile.encrypted_salary) if profile and profile.encrypted_salary else None
    expenses = decrypt_field(profile.encrypted_expenses) if profile and profile.encrypted_expenses else None
    savings = decrypt_field(profile.encrypted_savings) if profile and profile.encrypted_savings else None
    has_completed = profile.has_completed_onboarding if profile else False
    if salary and salary > 0:
        has_completed = True

    # Expose both top-level flat fields (for Dashboard/Portfolios) and nested objects (for ProfilePage)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "salary": salary,
        "expenses": expenses,
        "savings": savings,
        "age": profile.age if profile else 30,
        "employment_type": profile.employment_type if profile else "salaried-private",
        "dependents": profile.dependents if profile else 0,
        "has_completed_onboarding": has_completed,
        "health_insurance": insurance.health_insurance if insurance else False,
        "term_life_insurance": insurance.term_life_insurance if insurance else False,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
        "financial_profile": {
            "age": profile.age if profile else 30,
            "employment_type": profile.employment_type if profile else "salaried-private",
            "dependents": profile.dependents if profile else 0,
            "salary": salary,
            "expenses": expenses,
            "savings": savings,
            "has_completed_onboarding": has_completed,
        },
        "insurance": {
            "health_insurance": insurance.health_insurance if insurance else False,
            "term_life_insurance": insurance.term_life_insurance if insurance else False,
            "disability_insurance": insurance.disability_insurance if insurance else False,
            "critical_illness_insurance": insurance.critical_illness_insurance if insurance else False,
        }
    }

@router.put("/me")
@router.put("")
def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.full_name is not None:
        user.full_name = req.full_name

    profile = db.query(FinancialProfile).filter(FinancialProfile.user_id == user.id).first()
    if not profile:
        profile = FinancialProfile(user_id=user.id)
        db.add(profile)

    if req.age is not None:
        profile.age = req.age
    if req.employment_type is not None:
        profile.employment_type = req.employment_type
    if req.dependents is not None:
        profile.dependents = req.dependents
    if req.salary is not None:
        profile.encrypted_salary = encrypt_field(req.salary)
    if req.expenses is not None:
        profile.encrypted_expenses = encrypt_field(req.expenses)
    if req.savings is not None:
        profile.encrypted_savings = encrypt_field(req.savings)
    if req.has_completed_onboarding is not None:
        profile.has_completed_onboarding = req.has_completed_onboarding

    insurance = db.query(InsuranceStatus).filter(InsuranceStatus.user_id == user.id).first()
    if not insurance:
        insurance = InsuranceStatus(user_id=user.id)
        db.add(insurance)

    if req.health_insurance is not None:
        insurance.health_insurance = req.health_insurance
    if req.term_life_insurance is not None:
        insurance.term_life_insurance = req.term_life_insurance
    if req.disability_insurance is not None:
        insurance.disability_insurance = req.disability_insurance
    if req.critical_illness_insurance is not None:
        insurance.critical_illness_insurance = req.critical_illness_insurance

    db.commit()

    return {"status": "success", "message": "Financial profile updated successfully."}

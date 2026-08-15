"""
AUTHENTICATION ENTRYPOINT & DESIGN CHOICE:
Choice: JWT (JSON Web Token) Authentication.
Rationale: Stateless token authentication signed via HS256 with 7-day expiration.
Tokens are transmitted via HTTP Authorization Bearer headers.
Note: Technical details regarding auth mechanism choice (JWT vs Sessions) are documented
in this backend code comment and must NEVER be exposed on user-facing UI screens.
"""

import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import Optional

from backend.db.session import get_db
from backend.db.models import User, FinancialProfile, InsuranceStatus
from backend.auth.security import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# In-memory rate limiting tracker (max 30 requests per 60 seconds per IP for auth endpoints)
RATE_LIMIT_STORE = defaultdict(list)
MAX_REQUESTS_PER_WINDOW = 30
WINDOW_SECONDS = 60

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = RATE_LIMIT_STORE[client_ip]
    
    # Filter timestamps within current window
    valid_timestamps = [t for t in timestamps if now - t < WINDOW_SECONDS]
    RATE_LIMIT_STORE[client_ip] = valid_timestamps

    if len(valid_timestamps) >= MAX_REQUESTS_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again in a minute."
        )
    RATE_LIMIT_STORE[client_ip].append(now)

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    token: str
    user: dict

@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Create new user
    hashed = hash_password(req.password)
    user = User(
        email=req.email.lower(),
        password_hash=hashed,
        full_name=req.full_name or req.email.split("@")[0].title()
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize empty financial profile & insurance status
    profile = FinancialProfile(user_id=user.id)
    insurance = InsuranceStatus(user_id=user.id)
    db.add(profile)
    db.add(insurance)
    db.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)

    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }

@router.get("/me")
def get_me(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required.")

    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name
    }

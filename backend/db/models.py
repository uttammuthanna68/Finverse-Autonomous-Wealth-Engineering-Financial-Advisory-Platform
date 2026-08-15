import datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    financial_profile: Mapped[Optional["FinancialProfile"]] = relationship(
        "FinancialProfile", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    insurance_status: Mapped[Optional["InsuranceStatus"]] = relationship(
        "InsuranceStatus", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    goals: Mapped[list["Goal"]] = relationship(
        "Goal", back_populates="user", cascade="all, delete-orphan"
    )
    risk_assessment: Mapped[Optional["RiskAssessment"]] = relationship(
        "RiskAssessment", back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    saved_scenarios: Mapped[list["SavedScenario"]] = relationship(
        "SavedScenario", back_populates="user", cascade="all, delete-orphan"
    )
    debts: Mapped[list["Debt"]] = relationship(
        "Debt", back_populates="user", cascade="all, delete-orphan"
    )
    credit_cards: Mapped[list["CreditCard"]] = relationship(
        "CreditCard", back_populates="user", cascade="all, delete-orphan"
    )


class FinancialProfile(Base):
    __tablename__ = "financial_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dependents: Mapped[int] = mapped_column(Integer, default=0)

    # Application-level encrypted fields (Fernet payloads)
    encrypted_salary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_expenses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_savings: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    has_completed_onboarding: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="financial_profile")


class InsuranceStatus(Base):
    __tablename__ = "insurance_status"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    health_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    term_life_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    disability_insurance: Mapped[bool] = mapped_column(Boolean, default=False)
    critical_illness_insurance: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship("User", back_populates="insurance_status")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    goal_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_year: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Application-level encrypted target amount
    encrypted_target_amount: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="goals")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    risk_score: Mapped[int] = mapped_column(Integer, default=50) # 0 to 100
    risk_tolerance_label: Mapped[str] = mapped_column(String(100), default="Moderate")

    user: Mapped["User"] = relationship("User", back_populates="risk_assessment")


class SavedScenario(Base):
    __tablename__ = "saved_scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    scenario_name: Mapped[str] = mapped_column(String(255), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    user: Mapped["User"] = relationship("User", back_populates="saved_scenarios")


class Debt(Base):
    __tablename__ = "debts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    debt_name: Mapped[str] = mapped_column(String(255), nullable=False)
    apr: Mapped[float] = mapped_column(Float, nullable=False) # e.g. 14.5%
    
    # Application-level encrypted debt balance & minimum payment
    encrypted_balance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    encrypted_minimum_payment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="debts")


class CreditCard(Base):
    __tablename__ = "credit_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    card_name: Mapped[str] = mapped_column(String(255), nullable=False)
    apr: Mapped[float] = mapped_column(Float, nullable=False)
    credit_limit: Mapped[float] = mapped_column(Float, nullable=False)

    # Application-level encrypted balance
    encrypted_balance: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="credit_cards")

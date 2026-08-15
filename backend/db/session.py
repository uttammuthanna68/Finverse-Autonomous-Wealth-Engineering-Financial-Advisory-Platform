import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

# Default to local SQLite database if PostgreSQL environment is not configured
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./compound_dev.db")

# SQLite needs check_same_thread=False for multithreading
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database tables and seed demo credentials if empty."""
    Base.metadata.create_all(bind=engine)

    from .models import User, FinancialProfile, InsuranceStatus
    from backend.auth.security import hash_password

    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@example.com").first()
        if not demo_user:
            user = User(
                email="demo@example.com",
                password_hash=hash_password("password123"),
                full_name="Demo User"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = FinancialProfile(user_id=user.id)
            insurance = InsuranceStatus(user_id=user.id)
            db.add(profile)
            db.add(insurance)
            db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

def get_db():
    """Dependency provider for FastAPI route handlers."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

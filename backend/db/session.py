import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from .models import Base

# Default to local SQLite database if PostgreSQL environment is not configured
db_url = os.getenv("DATABASE_URL", "sqlite:///./compound_dev.db")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

DATABASE_URL = db_url

# Ensure parent folder exists if storing SQLite in subfolder (e.g. /data/finverse.db)
if DATABASE_URL.startswith("sqlite:///"):
    sqlite_path = DATABASE_URL.replace("sqlite:///", "")
    dir_name = os.path.dirname(sqlite_path)
    if dir_name and not os.path.exists(dir_name):
        try:
            os.makedirs(dir_name, exist_ok=True)
        except Exception:
            pass

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

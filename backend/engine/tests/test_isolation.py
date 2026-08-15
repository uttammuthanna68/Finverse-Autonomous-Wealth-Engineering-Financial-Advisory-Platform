import pytest
from fastapi.testclient import TestClient
from backend.api.main import app
from backend.db.session import SessionLocal, init_db
from backend.db.models import SavedScenario, User
import json

def test_recommendations_failure_does_not_corrupt_onboarding_data():
    """
    Test requirement:
    Simulates the recommendations endpoint throwing an error and confirms
    previously saved onboarding data remains untouched and retrievable.
    """
    # Ensure DB tables are initialized
    init_db()

    # Pre-create default user 1 if not present
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            default_user = User(id=1, email="test_isolation@compound.app", password_hash="dummy_hash", full_name="Isolation User")
            db.add(default_user)
            db.commit()
    finally:
        db.close()

    step_payload = {
        "step_id": "step_1_income",
        "step_data": {
            "monthly_income": 150000,
            "monthly_expenses": 60000,
            "emergency_savings": 300000
        }
    }

    with TestClient(app) as client:
        # 1. Save onboarding step data
        save_response = client.post("/api/onboarding/save-step", json=step_payload)
        assert save_response.status_code == 200
        save_json = save_response.json()
        assert save_json["status"] == "success"

        # 2. Simulate recommendation engine failure (trigger_error=True)
        recommendation_payload = {
            "user_id": 1,
            "trigger_error": True,
            "financial_data": step_payload["step_data"]
        }
        rec_response = client.post("/api/engine/generate-recommendations", json=recommendation_payload)
        assert rec_response.status_code == 500
        assert "Simulated Engine Calculation Failure" in rec_response.json()["detail"]

    # 3. Verify previously saved onboarding step data remains completely untouched and retrievable
    db = SessionLocal()
    try:
        saved_step = db.query(SavedScenario).filter(
            SavedScenario.user_id == 1,
            SavedScenario.scenario_name == "onboarding_step_step_1_income"
        ).first()

        assert saved_step is not None, "Saved onboarding step must exist in database"
        retrieved_data = json.loads(saved_step.payload_json)
        assert retrieved_data["monthly_income"] == 150000
        assert retrieved_data["monthly_expenses"] == 60000
        assert retrieved_data["emergency_savings"] == 300000
    finally:
        db.close()

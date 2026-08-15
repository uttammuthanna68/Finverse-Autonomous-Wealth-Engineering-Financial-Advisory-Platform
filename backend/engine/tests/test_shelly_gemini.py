import pytest
from backend.engine.shelly_gemini import generate_shelly_gemini_response
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_shelly_gemini_response_fallback_without_key():
    # Without key, generate_shelly_gemini_response returns None and endpoint falls back to local engine
    res = generate_shelly_gemini_response(
        user_message="what is lump sum?",
        user_context={"age": 30},
        market_snapshot={"regime": {"pe_level": 24.6, "lumpsum_recommendation": "AVOID_LUMPSUM"}}
    )
    # When key is not set, returns None so API endpoint handles fallback seamlessly
    assert res is None or "reply" in res

def test_market_intelligence_api_endpoint():
    response = client.get("/api/engine/market-intelligence")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "market_data" in data
    assert "nifty_50" in data["market_data"]

def test_shelly_chat_lumpsum_query():
    response = client.post("/api/engine/shelly-chat", json={"message": "what is lump sum"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "lump sum" in data["reply"].lower()
    assert len(data["actions"]) > 0

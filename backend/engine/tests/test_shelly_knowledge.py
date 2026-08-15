import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_shelly_chat_equity_allocation():
    response = client.post("/api/engine/shelly-chat", json={"message": "what was equity allocation"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data and data["status"] == "success"
    assert "equity allocation" in data["reply"].lower() or "equity" in data["reply"].lower()
    assert len(data["actions"]) > 0

def test_shelly_chat_equity_allocation_what_does_mean():
    response = client.post("/api/engine/shelly-chat", json={"message": "what does equity allocation mean"})
    assert response.status_code == 200
    data = response.json()
    assert "status" in data and data["status"] == "success"
    assert "equity allocation" in data["reply"].lower() or "equity" in data["reply"].lower()
    assert len(data["actions"]) > 0

def test_shelly_chat_flexi_fd():
    response = client.post("/api/engine/shelly-chat", json={"message": "what is flexi-fd?"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["emergency fund", "flexi-fd", "flexi", "fd", "deposit"])

def test_shelly_chat_toxic_debt():
    response = client.post("/api/engine/shelly-chat", json={"message": "explain toxic debt"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["toxic", "apr", "debt", "interest", "credit card"])

def test_shelly_chat_step_up_sip():
    response = client.post("/api/engine/shelly-chat", json={"message": "tell me about step-up sip"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["sip", "step-up", "step up", "increase"])

def test_shelly_chat_cibil_score():
    response = client.post("/api/engine/shelly-chat", json={"message": "what is cibil score?"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["cibil", "credit score", "credit", "score"])

def test_shelly_chat_sovereign_gold_bonds():
    response = client.post("/api/engine/shelly-chat", json={"message": "what are sovereign gold bonds?"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["gold", "sgb", "sovereign", "bond"])

def test_shelly_chat_arbitrage_fund():
    response = client.post("/api/engine/shelly-chat", json={"message": "what is arbitrage fund"})
    assert response.status_code == 200
    data = response.json()
    assert "arbitrage" in data["reply"].lower() or "fund" in data["reply"].lower()

def test_shelly_chat_direct_vs_regular():
    response = client.post("/api/engine/shelly-chat", json={"message": "direct vs regular plan"})
    assert response.status_code == 200
    data = response.json()
    assert any(k in data["reply"].lower() for k in ["direct", "regular", "expense ratio", "commission", "plan"])

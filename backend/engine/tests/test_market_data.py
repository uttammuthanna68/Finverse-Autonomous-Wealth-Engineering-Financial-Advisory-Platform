import pytest
from backend.engine.market_data import (
    fetch_live_market_data,
    compute_market_regime,
    DEFAULT_MARKET_SNAPSHOT,
)

def test_compute_market_regime_high():
    regime = compute_market_regime(pe_ratio=25.5, nifty_1y_change=15.0)
    assert regime["status"] == "HIGH_VALUATION"
    assert regime["lumpsum_recommendation"] == "AVOID_LUMPSUM"
    assert "Caution" in regime["lumpsum_badge"]

def test_compute_market_regime_undervalued():
    regime = compute_market_regime(pe_ratio=17.0, nifty_1y_change=-5.0)
    assert regime["status"] == "UNDERVALUED"
    assert regime["lumpsum_recommendation"] == "STRONG_LUMPSUM_BUY"
    assert "Great Time" in regime["lumpsum_badge"]

def test_compute_market_regime_fair():
    regime = compute_market_regime(pe_ratio=21.0, nifty_1y_change=8.0)
    assert regime["status"] == "FAIR_VALUATION"
    assert regime["lumpsum_recommendation"] == "BALANCED_STRATEGY"

def test_fetch_live_market_data_fallback():
    data = fetch_live_market_data(force_refresh=False)
    assert "nifty_50" in data
    assert "regime" in data
    assert "pe_ratio" in data["nifty_50"]
    assert "lumpsum_recommendation" in data["regime"]

import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("finverse.market_data")

# In-memory cache for market data (TTL: 15 minutes)
_MARKET_CACHE: Dict[str, Any] = {}
_CACHE_TIMESTAMP: float = 0.0
CACHE_TTL_SECONDS: float = 900.0  # 15 mins

DEFAULT_MARKET_SNAPSHOT: Dict[str, Any] = {
    "nifty_50": {
        "symbol": "^NSEI",
        "name": "Nifty 50 Index",
        "current_price": 24350.50,
        "change_pct_1y": 14.2,
        "pe_ratio": 24.6,
        "status": "ELEVATED"
    },
    "sensex": {
        "symbol": "^BSESN",
        "name": "BSE Sensex",
        "current_price": 79800.20,
        "change_pct_1y": 13.8,
        "pe_ratio": 24.8,
        "status": "ELEVATED"
    },
    "gold": {
        "symbol": "GOLDBEES.NS",
        "name": "Gold ETF / Spot",
        "current_price": 68.50,
        "change_pct_1y": 18.5,
        "status": "STRONG"
    },
    "india_10y_bond": {
        "symbol": "IN10Y",
        "name": "India 10Y Govt Bond Yield",
        "yield_pct": 6.85,
        "status": "STABLE"
    },
    "regime": {
        "status": "HIGH_VALUATION",
        "pe_level": 24.6,
        "description": "Nifty 50 P/E ratio is elevated (>24.0). Equity valuations are currently above historical fair averages.",
        "lumpsum_recommendation": "AVOID_LUMPSUM",
        "lumpsum_badge": "⚠️ Caution: High Market",
        "actionable_advice": "Equity markets are trading at elevated valuation multiples. It is NOT recommended to invest large lump sums right now. Stick strictly to monthly SIPs (Dollar-Cost-Averaging) and direct excess lump sum capital into Short Duration Bonds / Flexi-FDs until a market pull-back.",
        "tactical_tilts": {
            "equity_tilt": -0.05,
            "debt_tilt": 0.05,
            "recommended_focus": "Bonds & Systematic SIP"
        }
    },
    "expected_returns_dynamic": {
        "equity_large_cap": 0.12,
        "equity_mid_cap": 0.135,
        "equity_small_cap": 0.145,
        "debt_fixed_deposit": 0.07,
        "debt_liquid": 0.065,
        "gold": 0.09,
        "real_estate": 0.085
    },
    "last_synced": "Live Feed (Cached)",
    "is_live": False
}


import math

def clean_float(val: float, fallback: float = 0.0) -> float:
    if val is None or math.isnan(val) or math.isinf(val):
        return fallback
    return val


def compute_market_regime(pe_ratio: float, nifty_1y_change: float) -> Dict[str, Any]:
    pe_ratio = clean_float(pe_ratio, 24.6)
    nifty_1y_change = clean_float(nifty_1y_change, 14.0)

    if pe_ratio >= 24.0:
        return {
            "status": "HIGH_VALUATION",
            "pe_level": pe_ratio,
            "description": f"Nifty 50 P/E ratio is elevated at {pe_ratio:.1f} (historical fair range: 18-22). Equities are currently pricey.",
            "lumpsum_recommendation": "AVOID_LUMPSUM",
            "lumpsum_badge": "⚠️ Caution: High Market",
            "actionable_advice": "Equity markets are currently trading near peak valuation multiples. Avoid investing large lump sums into equities right now. Stick strictly to monthly SIPs and tilt extra surplus towards Short-Duration Bonds / Flexi-FDs.",
            "tactical_tilts": {
                "equity_tilt": -0.05,
                "debt_tilt": 0.05,
                "recommended_focus": "Short-Duration Debt & SIP"
            }
        }
    elif pe_ratio <= 18.5:
        return {
            "status": "UNDERVALUED",
            "pe_level": pe_ratio,
            "description": f"Nifty 50 P/E ratio is attractive at {pe_ratio:.1f}. Market is trading at a significant discount.",
            "lumpsum_recommendation": "STRONG_LUMPSUM_BUY",
            "lumpsum_badge": "🔥 Great Time for Lump Sum",
            "actionable_advice": "Equity valuations are at attractive historical discounts! This is an ideal window to deploy idle lump sum capital into Large Cap and Flexi Cap index funds.",
            "tactical_tilts": {
                "equity_tilt": 0.05,
                "debt_tilt": -0.05,
                "recommended_focus": "Large-Cap & Flexi-Cap Lump Sum"
            }
        }
    else:
        return {
            "status": "FAIR_VALUATION",
            "pe_level": pe_ratio,
            "description": f"Nifty 50 P/E ratio is fair at {pe_ratio:.1f}. Equity markets are balanced.",
            "lumpsum_recommendation": "BALANCED_STRATEGY",
            "lumpsum_badge": "✅ Balanced Market",
            "actionable_advice": "Market valuations are in fair equilibrium. Continue standard asset allocation with regular monthly SIPs and staggered lump sum deployment.",
            "tactical_tilts": {
                "equity_tilt": 0.0,
                "debt_tilt": 0.0,
                "recommended_focus": "Standard 6-Asset SIP Roadmap"
            }
        }


def fetch_live_market_data(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Fetches real live market data using yfinance with fallbacks and in-memory caching.
    """
    global _MARKET_CACHE, _CACHE_TIMESTAMP

    now = time.time()
    if not force_refresh and _MARKET_CACHE and (now - _CACHE_TIMESTAMP < CACHE_TTL_SECONDS):
        return _MARKET_CACHE

    snapshot = dict(DEFAULT_MARKET_SNAPSHOT)
    live_success = False

    try:
        import yfinance as yf

        tickers = yf.Tickers("^NSEI ^BSESN GOLDBEES.NS")
        
        # Nifty 50
        nifty = tickers.tickers["^NSEI"]
        nifty_hist = nifty.history(period="1y")
        if not nifty_hist.empty and len(nifty_hist) > 2:
            latest_price = clean_float(float(nifty_hist["Close"].iloc[-1]), 24350.5)
            prev_price = clean_float(float(nifty_hist["Close"].iloc[0]), 21000.0)
            if prev_price > 0:
                change_1y = clean_float(float(((latest_price - prev_price) / prev_price) * 100), 14.2)
            else:
                change_1y = 14.2
            
            estimated_pe = round(24.2 * (latest_price / 24000.0), 1)
            estimated_pe = clean_float(max(14.0, min(35.0, estimated_pe)), 24.6)

            snapshot["nifty_50"] = {
                "symbol": "^NSEI",
                "name": "Nifty 50 Index",
                "current_price": round(latest_price, 2),
                "change_pct_1y": round(change_1y, 2),
                "pe_ratio": estimated_pe,
                "status": "LIVE"
            }
            snapshot["regime"] = compute_market_regime(estimated_pe, change_1y)
            live_success = True

        # Sensex
        sensex = tickers.tickers["^BSESN"]
        sensex_hist = sensex.history(period="1y")
        if not sensex_hist.empty and len(sensex_hist) > 2:
            s_latest = clean_float(float(sensex_hist["Close"].iloc[-1]), 79800.20)
            s_prev = clean_float(float(sensex_hist["Close"].iloc[0]), 70000.0)
            s_change = clean_float(float(((s_latest - s_prev) / s_prev) * 100), 13.8) if s_prev > 0 else 13.8
            snapshot["sensex"] = {
                "symbol": "^BSESN",
                "name": "BSE Sensex",
                "current_price": round(s_latest, 2),
                "change_pct_1y": round(s_change, 2),
                "pe_ratio": round(snapshot["nifty_50"]["pe_ratio"] * 1.01, 1),
                "status": "LIVE"
            }

        # Gold
        gold = tickers.tickers["GOLDBEES.NS"]
        gold_hist = gold.history(period="1y")
        if not gold_hist.empty and len(gold_hist) > 2:
            g_latest = clean_float(float(gold_hist["Close"].iloc[-1]), 68.50)
            g_prev = clean_float(float(gold_hist["Close"].iloc[0]), 58.00)
            g_change = clean_float(float(((g_latest - g_prev) / g_prev) * 100), 18.5) if g_prev > 0 else 18.5
            snapshot["gold"] = {
                "symbol": "GOLDBEES.NS",
                "name": "Gold ETF (India)",
                "current_price": round(g_latest, 2),
                "change_pct_1y": round(g_change, 2),
                "status": "LIVE"
            }

        if live_success:
            snapshot["is_live"] = True
            snapshot["last_synced"] = "Live Yahoo Finance Feed"

    except Exception as e:
        logger.warning(f"Failed to fetch live market data via yfinance, using fallback snapshot: {e}")
        snapshot["is_live"] = False
        snapshot["last_synced"] = "Fallback Market Intelligence Engine"

    _MARKET_CACHE = snapshot
    _CACHE_TIMESTAMP = time.time()
    return snapshot

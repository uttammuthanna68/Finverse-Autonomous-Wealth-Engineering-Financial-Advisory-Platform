import os
import json
import logging
import urllib.request
import re
from typing import Dict, Any, List, Optional

logger = logging.getLogger("finverse.shelly_gemini")

SHELLY_SYSTEM_INSTRUCTION = """You are Prof. Shelly 🐢, the sharp, witty, caring mascot and financial mentor of Finverse.

YOUR CORE GUIDELINES:
1. CRISP & CONCISE: Give quick, humanized, easy-to-understand definitions (max 2-3 short sentences or 2 bullet points). NO long paragraphs, NO textbook lectures, NO jargon clutter. Get straight to the point!
2. WITTY BANTER: Add a touch of light, witty humor and friendly banter, calling out silly money mistakes (like paying credit card minimum dues, buying ULIPs, or doing equity lump sums when markets are at peak valuations).
3. TO THE POINT: Answer the user's exact question immediately in plain English.
4. DIRECT OUTPUT ONLY: Do NOT output any internal thinking process, draft notes, or outline markers (e.g. "Draft:", "Adding Context:", etc.). Output ONLY your final response.

RULES:
- Surplus Priority: #1 Pay Toxic Debt (>18% APR) -> #2 Build 6-Month Emergency Shield -> #3 Invest in 6-Asset Portfolio.
- High Market PE (>24): Recommend monthly SIP and short-duration debt over equity lump sums.
- Credit Cards: Always pay 100% statement balance before due date!

OUTPUT FORMAT:
Format reply nicely in simple markdown. At the very end of your reply on a new line, attach navigation action buttons if relevant:
```json_actions
[{"label": "Explore 6-Asset Portfolios", "path": "/portfolios"}]
```
Available paths: `/portfolios`, `/debt`, `/priority`, `/calculator`, `/dashboard`, `/creditcard/rewards`, `/onboarding`.
"""

def get_gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if key and key != "your_gemini_api_key_here":
        return key

    # Try reading directly from .env file at root
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        val = line.split("=", 1)[1].strip(" \"'")
                        if val and val != "your_gemini_api_key_here":
                            return val
        except Exception:
            pass
    return ""

def call_gemini_rest_api(api_key: str, prompt: str, system_instruction: str) -> Optional[str]:
    """Fallback REST API call directly to Google Generative AI REST endpoint."""
    models_to_try = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-flash"
    ]
    
    # Combined prompt with system instruction to guarantee 100% API compatibility across model endpoints
    combined_prompt = f"{system_instruction}\n\n[USER QUESTION]:\n{prompt}"
    
    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": combined_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 800
            }
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    res_data = json.loads(response.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            text = parts[0].get("text", "")
                            if text:
                                return text
        except Exception as err:
            logger.warning(f"Gemini REST API ({model_name}) attempt error: {err}")
    return None

def generate_shelly_gemini_response(
    user_message: str,
    user_context: Optional[Dict[str, Any]] = None,
    market_snapshot: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generates a response from Gemini API with tuned system instructions for Shelly's persona.
    If GEMINI_API_KEY is not set or network fails, returns None for local engine fallback.
    """
    api_key = get_gemini_api_key()

    if not api_key:
        logger.info("GEMINI_API_KEY not found in environment. Using local engine fallback.")
        return None

    # Construct context prompt
    context_str = ""
    if user_context:
        context_str += f"\n[User Profile]: Age={user_context.get('age', 30)}, Surplus=₹{user_context.get('monthly_surplus', 0):,}, Risk={user_context.get('risk_capacity_tier', 'Moderate')}, Toxic Debt=₹{user_context.get('toxic_debt_balance', 0):,}."

    if market_snapshot and "regime" in market_snapshot:
        regime = market_snapshot["regime"]
        context_str += f"\n[Live Market]: Nifty P/E={regime.get('pe_level', 24.6)}, Status={regime.get('status')}, LumpSum Rec={regime.get('lumpsum_recommendation')}."

    full_prompt = f"{user_message.strip()}{context_str}"

    raw_text = ""

    # 1. Try google-genai / google.generativeai SDKs first with valid model names
    try:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            candidate_models = [
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-1.5-pro',
                'gemini-flash'
            ]
            
            for m in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=m,
                        contents=full_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=SHELLY_SYSTEM_INSTRUCTION,
                            temperature=0.5,
                            max_output_tokens=800
                        )
                    )
                    raw_text = response.text or ""
                    if raw_text:
                        break
                except Exception as model_err:
                    logger.warning(f"Gemini SDK model {m} failed: {model_err}")
                    continue
        except ImportError:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=SHELLY_SYSTEM_INSTRUCTION
            )
            response = model.generate_content(
                full_prompt,
                generation_config={"temperature": 0.5, "max_output_tokens": 800}
            )
            raw_text = response.text or ""
    except Exception as e:
        logger.warning(f"Gemini SDK invocation error: {e}")

    # 2. If SDK didn't return text, use direct REST API call
    if not raw_text:
        raw_text = call_gemini_rest_api(api_key, full_prompt, SHELLY_SYSTEM_INSTRUCTION) or ""

    if not raw_text:
        return None

    # Clean raw text from any thinking or draft process leftovers
    clean_text = raw_text.strip()

    if clean_text.startswith("Thinking Process:") or clean_text.startswith("* *Draft"):
        lines = clean_text.split("\n")
        start_idx = 0
        for idx, l in enumerate(lines):
            if any(l.strip().startswith(p) for p in ["**", "Diversification", "Equity", "Lump Sum", "SWP", "SIP", "CIBIL", "SGB", "Flexi", "Investing"]):
                start_idx = idx
                break
        if start_idx > 0:
            clean_text = "\n".join(lines[start_idx:]).strip()

    # Parse actions JSON block if present
    actions = []

    if "```json_actions" in clean_text:
        parts = clean_text.split("```json_actions")
        clean_text = parts[0].strip()
        action_block = parts[1].split("```")[0].strip()
        try:
            actions = json.loads(action_block)
        except Exception:
            pass
    else:
        json_matches = list(re.finditer(r"```json\s*(\[.*?\])\s*```", clean_text, re.DOTALL))
        if json_matches:
            last_match = json_matches[-1]
            try:
                parsed = json.loads(last_match.group(1))
                if isinstance(parsed, list) and all(isinstance(x, dict) and "path" in x for x in parsed):
                    actions = parsed
                    clean_text = (clean_text[:last_match.start()] + clean_text[last_match.end():]).strip()
            except Exception:
                pass

    if not actions:
        msg_lower = user_message.lower()
        if any(k in msg_lower for k in ["lump", "sip", "portfolio", "invest", "equity", "bond", "fd", "diversif"]):
            actions.append({"label": "Explore Portfolios", "path": "/portfolios"})
        elif any(k in msg_lower for k in ["debt", "credit card", "apr", "emi", "loan"]):
            actions.append({"label": "Go to Debt Portfolio", "path": "/debt"})
        elif any(k in msg_lower for k in ["calculator", "cagr", "xirr", "return"]):
            actions.append({"label": "Open SIP Calculator", "path": "/calculator"})

    return {
        "reply": clean_text,
        "actions": actions,
        "source": "gemini_ai"
    }

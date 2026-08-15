import os
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("finverse.shelly_gemini")

SHELLY_SYSTEM_INSTRUCTION = """You are Shelly 🐢, the sharp, witty, caring mascot and financial mentor of Finverse.

YOUR CORE GUIDELINES:
1. CRISP & CONCISE: Give quick, humanized, easy-to-understand definitions (max 2-3 short sentences or 2 bullet points). NO long paragraphs, NO textbook lectures, NO jargon clutter. Get straight to the point!
2. WITTY & SARCASTIC BANTER: Add a touch of light, sarcastic humor and friendly banter, calling out silly money mistakes (like paying credit card minimum dues, buying ULIPs, or doing equity lump sums when markets are at peak valuations).
3. TO THE POINT: Answer the user's exact question immediately in plain English that anyone can understand.
4. USER CONTEXT: Naturally weave user profile or live market status into the answer if provided.

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

def generate_shelly_gemini_response(
    user_message: str,
    user_context: Optional[Dict[str, Any]] = None,
    market_snapshot: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generates a response from Gemini API with tuned system instructions for Shelly's persona.
    If GEMINI_API_KEY is not set or network fails, falls back gracefully.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        logger.info("GEMINI_API_KEY not found in environment. Using enhanced local engine fallback.")
        return None

    # Construct context prompt
    context_str = ""
    if user_context:
        context_str += f"\n[User Profile]: Age={user_context.get('age', 30)}, Surplus=₹{user_context.get('monthly_surplus', 0):,}, Risk={user_context.get('risk_capacity_tier', 'Moderate')}, Toxic Debt=₹{user_context.get('toxic_debt_balance', 0):,}."

    if market_snapshot and "regime" in market_snapshot:
        regime = market_snapshot["regime"]
        context_str += f"\n[Live Market]: Nifty P/E={regime.get('pe_level', 24.6)}, Status={regime.get('status')}, LumpSum Rec={regime.get('lumpsum_recommendation')}."

    full_prompt = f"{user_message.strip()}{context_str}"

    # Try official google-genai SDK first, then fallback to google.generativeai
    try:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SHELLY_SYSTEM_INSTRUCTION,
                    temperature=0.5,
                    max_output_tokens=250
                )
            )
            raw_text = response.text or ""
        except ImportError:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(
                model_name='gemini-1.5-flash',
                system_instruction=SHELLY_SYSTEM_INSTRUCTION
            )
            response = model.generate_content(
                full_prompt,
                generation_config={"temperature": 0.5, "max_output_tokens": 250}
            )
            raw_text = response.text or ""

        # Parse actions JSON block if present
        actions = []
        clean_text = raw_text
        if "```json_actions" in raw_text:
            parts = raw_text.split("```json_actions")
            clean_text = parts[0].strip()
            action_block = parts[1].split("```")[0].strip()
            try:
                actions = json.loads(action_block)
            except Exception:
                pass
        elif "```json" in raw_text:
            parts = raw_text.split("```json")
            clean_text = parts[0].strip()
            action_block = parts[1].split("```")[0].strip()
            try:
                parsed = json.loads(action_block)
                if isinstance(parsed, list):
                    actions = parsed
            except Exception:
                pass

        if not actions:
            msg_lower = user_message.lower()
            if any(k in msg_lower for k in ["lump", "sip", "portfolio", "invest", "equity", "bond", "fd"]):
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

    except Exception as e:
        logger.error(f"Error invoking Gemini API: {e}")
        return None

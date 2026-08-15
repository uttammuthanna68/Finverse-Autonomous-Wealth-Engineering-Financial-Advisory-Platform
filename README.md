# 💎 Finverse — Autonomous Wealth Engineering & Financial Advisory Platform

> An enterprise-grade, full-stack personal finance and wealth management platform built specifically for Indian investors. Combines quantitative financial engineering, a 3-tier debt & cash-flow priority waterfall, 6-asset class portfolio optimization, dynamic tax regime analysis (FY 2024–25 / FY 2025–26), and a goal-horizon suitability engine.

![Finverse Architecture](https://img.shields.io/badge/Architecture-Decoupled%20Engine-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-blue?style=for-the-badge&logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python)-009688?style=for-the-badge&logo=fastapi)
![SQLite](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-003B57?style=for-the-badge&logo=sqlite)
![Tests](https://img.shields.io/badge/Test%20Suite-42%2F42%20Passing%20(Pytest)-brightgreen?style=for-the-badge)

---

## 🌟 Key Features & Advisory Modules

### 1. 🌊 3-Tier Strategic Priority Waterfall Engine
Routes monthly net cash surplus through a strict, mathematically optimal financial priority sequence:
- **Priority #1 — Toxic Debt Elimination**: Detects high-interest debts (>18% APR like credit cards and personal loans) and executes **Debt Avalanche** or **Debt Snowball** payoff plans.
- **Priority #2 — 6-Month Emergency Shield**: Calculates 6× monthly expenses buffer split between **50% Bank Flexi-FD (Sweep-in)** for instant 24/7 liquid access and **50% Arbitrage/Liquid Mutual Funds**.
- **Priority #3 — Wealth SIP Compounding**: Automatically rolls remaining surplus into multi-asset compounding SIPs once debt & emergency thresholds are satisfied.

### 2. 📊 6-Asset Class Portfolio Allocator
Generates 3 non-stagnant, age-adjusted portfolio comparison lenses (**Safe**, **Medium**, **Risky**) across 6 real-world Indian asset classes:
1. **Nifty 50 Large Cap Index Funds** (~12.0% CAGR)
2. **Flexi Cap & Mid Cap Equity** (~13.5% CAGR)
3. **Small Cap Index Funds** (~15.0% CAGR)
4. **Fixed Deposits & Liquid Mutual Funds** (~6.5% CAGR)
5. **Short Duration Corporate Debt & G-Secs** (~7.5% CAGR)
6. **Sovereign Gold Bonds (SGB) & Gold ETFs** (~8.0% CAGR + 2.5% annual interest)

### 3. 🧾 Indian Tax Optimization Advisor Module (`/tax`)
- **Old vs. New Tax Regime Auditor**: Evaluates annual tax liabilities for FY 2024–25 and FY 2025–26 side-by-side.
- **Itemized Deduction Engine**: Calculates tax savings across Section **80C** (ELSS, EPF, PPF up to ₹1.5L), **80D** (Health Insurance up to ₹75k), **80CCD(1B)** (NPS ₹50k), **Section 24b** (Home Loan Interest up to ₹2L), Standard Deduction (₹75k), and **Section 87A** rebate.
- **Winner Regime Highlight**: Identifies the optimal tax regime and calculates exact annual Rupee savings.

### 4. 🎯 Goal Horizon & Asset Suitability Engine
Matches active financial goals to horizon-appropriate asset classes to protect capital:
- **Short-Term (< 3 Years)**: Recommends **Arbitrage Funds / Liquid Debt / Flexi-FD** (100% Capital Preserved; avoids equity crash risk).
- **Medium-Term (3 – 5 Years)**: Recommends **Balanced Advantage Hybrid Funds (60/40) + Gold**.
- **Long-Term (> 5 Years)**: Recommends **Nifty 50 Index Funds + Flexi-Cap Equity SIP**.

### 5. 💳 Credit Card Rewards & Cashback Maximizer
- Tracks category-specific spend multipliers (Fuel, Dining, Travel, Online Shopping).
- Recommends top Indian cards (SBI Cashback, HDFC Regalia Gold, Axis Atlas, IDFC FIRST Wow) and tracks annual fee waiver thresholds.

### 6. 📄 Printable CA Financial Health Audit Report
- Generates an offline-printable, formal Chartered Accountant (CA) style audit document with executive cash flow summary, waterfall priority status, tax strategy, and goal execution timelines.

### 7. 🐢 Prof. Shelly AI Assistant
- Interactive mascot companion providing instant, context-aware financial jargon definitions, step-up calculators, and navigation routing.

---

## 🏛️ System Architecture

```mermaid
graph TD
    A[React 18 + TypeScript SPA] -->|REST APIs via fetchWithAuth| B[FastAPI Engine Backend]
    B --> C[Phase 1: Risk Capacity Engine (0-100)]
    B --> D[Phase 2: Debt Payoff Waterfall Engine]
    B --> E[Phase 3: 6-Asset Portfolio Allocator]
    B --> F[Phase 4: Indian Tax Engine (Old vs New)]
    B --> G[Phase 5: Goal Horizon Suitability Engine]
    B --> H[SQLite / PostgreSQL DB (AES-256 Fernet Encrypted)]
```

### 🔒 Security & Privacy Architecture
- **Application-Level Encryption**: Financial figures (salary, expenses, savings, debt balances) are encrypted on disk using **AES-256 Fernet Symmetric Key Encryption**.
- **Password Security**: Passwords are salted and hashed using **Bcrypt**.
- **Zero Third-Party Cloud Tracking**: Runs 100% locally or on private cloud instances.

---

## 📐 Mathematical Rationale & Formulas

### Continuous Risk Capacity Score (0–100)
$$\text{Risk Score} = \text{AgeScore} + \text{IncomeScore} + \text{SavingsBufferScore} + \text{DTIScore} + \text{Modifiers}$$
Where:
- $\text{AgeScore} = \max\left(0, \frac{65 - \text{Age}}{45}\right) \times 25$
- $\text{SavingsBufferScore} = \min\left(1.0, \frac{\text{Current Savings}}{6 \times \text{Monthly Expenses}}\right) \times 25$

### Baseline Equity Percentage
$$\text{Base Equity \%} = \text{Clamp}\left(15\%, \, 85\%, \, (110 - \text{User Age}) + \frac{\text{Risk Score} - 50}{50} \times 15\%\right)$$

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### 1. Clone & Setup Repository
```bash
git clone https://github.com/uttammuthanna68/Finverse.git
cd Finverse
```

### 2. Frontend Development (React + Vite + TypeScript)
```bash
cd frontend
npm install
npm run dev
```
The frontend will run at `http://localhost:5173`.

### 3. Backend Development (FastAPI + Python)
```bash
# In project root
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r backend/requirements.txt
python -m uvicorn backend.api.main:app --host 127.0.0.1 --port 8000
```
The backend API documentation will be available at `http://127.0.0.1:8000/docs`.

### 4. Running the Test Suite
```bash
python -m pytest backend
```
Runs all **42 automated unit tests** across financial risk, debt waterfall, allocation, tax, and calculators modules.

---

## 📁 Repository Structure

```
Finverse/
├── backend/
│   ├── api/                 # FastAPI routes & endpoints (engine_routes, profile, auth)
│   ├── db/                  # SQLAlchemy ORM models, session, & AES-256 encryption
│   └── engine/              # Pure financial calculation engines (risk, priority, tax, debt, allocation)
│       └── tests/           # Pytest automated test suite (42 passing tests)
├── frontend/
│   ├── src/
│   │   ├── auth/            # Authentication & Profile management
│   │   ├── calculator/      # Interactive SIP, Lumpsum, SWP, Goal Calculators
│   │   ├── creditcard/      # Rewards & cashback maximizer
│   │   ├── dashboard/       # Main command center & dated execution roadmap
│   │   ├── debt/            # Debt payoff waterfall UI
│   │   ├── onboarding/      # 6-Step guided financial onboarding wizard
│   │   ├── portfolios/      # 6-Asset class portfolio builder & step-up CAGR engine
│   │   ├── priority/        # Action plan waterfall
│   │   ├── tax/             # Old vs New Regime Tax Optimization Advisor
│   │   └── components/      # Reusable UI components & Prof. Shelly Mascot
└── README.md
```

---

## 👤 Author & Portfolio Showcase

**Uttam Muthanna**
- **GitHub**: [@uttammuthanna68](https://github.com/uttammuthanna68)
- **Project**: Finverse — Autonomous Wealth Engineering & Advisory Platform

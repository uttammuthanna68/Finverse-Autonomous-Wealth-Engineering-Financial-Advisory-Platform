---
description: Run all engine unit tests, report pass/fail, and flag any function in /backend/engine missing a test file.
---

# Verify Calc Workflow (`verify-calc`)

This workflow is executed by the **Engine Agent** to validate calculation integrity, test coverage, and mathematical determinism across `/backend/engine`.

## Workflow Objectives
1. **Discover & Audit**: Scan all modules in `/backend/engine` for functions that lack dedicated unit test files or tests in `/backend/engine/tests/`.
2. **Execute Engine Test Suite**: Run `pytest` on all engine test suites.
3. **Report Pass/Fail Status**: Summarize pass/fail results and flag any untracked or untested engine calculations.

---

## Execution Instructions

### Step 1: Run Verification Script
Execute the test and coverage verification script from the project root:

```bash
python scripts/verify_calc.py
```

### Step 2: Individual Test Run (Pytest)
To run unit tests directly with verbose output:

```bash
pytest backend/engine/tests -v
```

### Step 3: Check Coverage
To generate a line-by-line coverage report:

```bash
pytest backend/engine/tests --cov=backend/engine --cov-report=term-missing
```

---

## Audit Rules

| Rule | Expected State | Action if Violated |
| :--- | :--- | :--- |
| **Test File Existence** | For every `backend/engine/<name>.py`, there must exist `backend/engine/tests/test_<name>.py` | Block PR / release; Flag module missing test file |
| **Function Test Parity** | Every public function `calc_*` or helper must have a corresponding `test_*` case | Flag missing function test in verification output |
| **Pure Function Contract** | Engine functions must not call external network services or UI components | Move side-effects out of `/backend/engine` |
| **JSON Assumptions** | All assumptions must load from `/backend/engine/config/*.json` | Replace hardcoded constants with JSON config entries |

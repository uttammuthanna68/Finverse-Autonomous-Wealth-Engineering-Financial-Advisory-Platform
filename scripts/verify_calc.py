#!/usr/bin/env python3
import os
import sys
import subprocess

def main():
    print("=== Compound Engine Audit & Verification ===")
    engine_dir = os.path.join("backend", "engine")
    tests_dir = os.path.join("backend", "engine", "tests")

    if not os.path.exists(engine_dir):
        print(f"Error: {engine_dir} directory not found.")
        sys.exit(1)

    # 1. Audit missing test files
    missing_tests = []
    for root, _, files in os.walk(engine_dir):
        if "tests" in root or "config" in root or "__pycache__" in root:
            continue
        for file in files:
            if file.endswith(".py") and not file.startswith("__"):
                mod_name = file[:-3]
                expected_test = f"test_{mod_name}.py"
                test_path = os.path.join(tests_dir, expected_test)
                if not os.path.exists(test_path):
                    missing_tests.append((file, expected_test))

    print("\n--- Audit: Module Test File Coverage ---")
    if missing_tests:
        print("[WARNING] The following engine modules lack dedicated test files:")
        for mod, test_file in missing_tests:
            print(f"  [MISSING] {mod} -> Expected: {test_file}")
    else:
        print("  [OK] All engine modules have corresponding test files.")

    # 2. Run pytest
    print("\n--- Executing Engine Test Suite ---")
    pytest_cmd = [sys.executable, "-m", "pytest", "backend/engine/tests", "-v"]
    result = subprocess.run(pytest_cmd)

    # Pytest returncode 0 = All passed, 5 = No tests collected (0 tests present)
    if result.returncode not in (0, 5):
        print(f"\n[FAIL] Engine test suite failed with exit code {result.returncode}.")
        sys.exit(result.returncode)

    if result.returncode == 5:
        print("\n[OK] Engine test suite executed (0 tests present).")
    else:
        print("\n[SUCCESS] All engine tests passed successfully.")

if __name__ == "__main__":
    main()

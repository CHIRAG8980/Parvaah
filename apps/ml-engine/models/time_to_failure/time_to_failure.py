#!/usr/bin/env python3
"""
Main execution script for TTF model validation and training.

This script runs the complete pipeline:
1. Data loading and temporal assessment
2. Validation checks
3. Defensibility determination
4. Model training (only if defensible)
5. Feasibility report generation

Usage:
    python run_pipeline.py
"""

import sys
from pathlib import Path

# Add parent directory to path so src is imported as package
sys.path.insert(0, str(Path(__file__).parent))

from src.train import main

if __name__ == "__main__":
    print("\n" + "="*70)
    print("TIME-TO-FAILURE MODEL VALIDATION PIPELINE")
    print("="*70)
    print("\nThis pipeline assesses whether available landslide data")
    print("supports defensible Time-to-Failure predictions.\n")

    result = main()

    print("\n" + "="*70)
    if result['success']:
        if result['can_train']:
            print("✓ RESULT: Data is sufficient for TTF modeling")
            print(f"  - Validated {result['n_events']} events")
            print("  - Model training completed")
        else:
            print("✗ RESULT: Data is NOT sufficient for TTF modeling")
            print(f"  - Only {result['n_events']} exact-date events available")
            print("  - See feasibility report for details")
    else:
        print("✗ PIPELINE FAILED")
        print(f"  - Error: {result.get('error')}")
    print("="*70 + "\n")

    sys.exit(0 if result['success'] else 1)

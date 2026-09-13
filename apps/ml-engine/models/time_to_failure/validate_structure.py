#!/usr/bin/env python3
"""
Structure validation script for TTF pipeline.
Verifies all components are in place without requiring dependencies.
"""
import os
from pathlib import Path


def check_file_exists(filepath: Path) -> tuple[bool, str]:
    """Check if file exists and has content."""
    if not filepath.exists():
        return False, "Missing"

    size = filepath.stat().st_size
    if size == 0:
        return False, "Empty"

    return True, f"OK ({size} bytes)"


def validate_ttf_pipeline():
    """Validate complete TTF pipeline structure."""

    base_dir = Path(__file__).parent

    print("="*70)
    print("TIME-TO-FAILURE PIPELINE STRUCTURE VALIDATION")
    print("="*70)

    # Core source files
    src_files = [
        "src/__init__.py",
        "src/config.py",
        "src/data_loader.py",
        "src/target_definition.py",
        "src/validation.py",
        "src/preprocessing.py",
        "src/feature_builder.py",
        "src/baseline.py",
        "src/model.py",
        "src/train.py",
        "src/evaluate.py",
        "src/predict.py",
        "src/survival_analysis.py",
        "src/utils.py",
    ]

    # Test files
    test_files = [
        "tests/test_ttf_validation.py",
    ]

    # Documentation
    doc_files = [
        "README.md",
        "requirements.txt",
        "run_pipeline.py",
    ]

    # Output directories
    output_dirs = [
        "outputs/predictions",
        "outputs/plots",
        "outputs/metrics",
        "outputs/diagnostics",
        "outputs/reports",
        "saved_models",
        "logs",
    ]

    all_valid = True

    # Check source files
    print("\n📁 SOURCE FILES:")
    for filepath in src_files:
        exists, status = check_file_exists(base_dir / filepath)
        symbol = "✓" if exists else "✗"
        print(f"  {symbol} {filepath:40s} {status}")
        if not exists:
            all_valid = False

    # Check test files
    print("\n🧪 TEST FILES:")
    for filepath in test_files:
        exists, status = check_file_exists(base_dir / filepath)
        symbol = "✓" if exists else "✗"
        print(f"  {symbol} {filepath:40s} {status}")
        if not exists:
            all_valid = False

    # Check documentation
    print("\n📖 DOCUMENTATION:")
    for filepath in doc_files:
        exists, status = check_file_exists(base_dir / filepath)
        symbol = "✓" if exists else "✗"
        print(f"  {symbol} {filepath:40s} {status}")
        if not exists:
            all_valid = False

    # Check output directories
    print("\n📂 OUTPUT DIRECTORIES:")
    for dirpath in output_dirs:
        full_path = base_dir / dirpath
        exists = full_path.exists()
        symbol = "✓" if exists else "✗"
        print(f"  {symbol} {dirpath:40s} {'OK' if exists else 'Missing'}")
        if not exists:
            all_valid = False

    # Check data files
    print("\n📊 DATA FILES (Ground Truth):")
    data_files = [
        "../../data/processed/dynamic_hazard/landslides_exact_date_matched.csv",
        "../../data/raw/ground_truth/isro_nrsc_landslide_atlas/meghalaya_landslides_clean.csv",
    ]
    for filepath in data_files:
        full_path = base_dir / filepath
        exists, status = check_file_exists(full_path)
        symbol = "✓" if exists else "✗"
        print(f"  {symbol} {filepath:40s} {status}")

    # Summary
    print("\n" + "="*70)
    if all_valid:
        print("✓ VALIDATION PASSED: All pipeline components present")
    else:
        print("✗ VALIDATION FAILED: Some components missing")
    print("="*70)

    # Key design principles
    print("\n🔑 KEY DESIGN PRINCIPLES:")
    print("  1. Never fabricate dates for year-only events")
    print("  2. Only exact dates used for TTF regression")
    print("  3. Honest feasibility assessment before training")
    print("  4. Temporal integrity (chronological splits, no leakage)")
    print("  5. Clear documentation when training not defensible")

    # Current data status
    print("\n📈 CURRENT DATA STATUS:")
    print("  • Exact-date events: 15 (May 27-30, 2024)")
    print("  • Temporal span: 4 days")
    print("  • Unique dates: 4")
    print("  • REQUIRED for defensible model:")
    print("    - Events: ≥50")
    print("    - Span: ≥30 days")
    print("    - Unique dates: ≥10")

    print("\n⚠️  EXPECTED BEHAVIOR:")
    print("  Pipeline will correctly determine that model training")
    print("  is NOT defensible with current data and generate a")
    print("  feasibility report explaining why.")

    print("\n" + "="*70 + "\n")

    return all_valid


if __name__ == "__main__":
    valid = validate_ttf_pipeline()
    exit(0 if valid else 1)

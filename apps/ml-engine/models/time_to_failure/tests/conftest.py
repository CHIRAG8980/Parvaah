"""
Pytest configuration for time_to_failure tests.
Registers 'ttf' package in sys.modules to prevent cross-suite import collisions.
"""
import sys
import importlib.util
from pathlib import Path

ttf_root = Path(__file__).resolve().parents[1]
if "ttf" not in sys.modules:
    spec = importlib.util.spec_from_file_location("ttf", str(ttf_root / "src" / "__init__.py"))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["ttf"] = mod
    spec.loader.exec_module(mod)

"""
Pytest configuration for fusion_risk tests.
Registers 'fusion_risk' package in sys.modules to prevent cross-suite import collisions.
"""
import sys
import importlib.util
from pathlib import Path

fr_root = Path(__file__).resolve().parents[1]
if "fusion_risk" not in sys.modules:
    spec = importlib.util.spec_from_file_location("fusion_risk", str(fr_root / "src" / "__init__.py"))
    mod = importlib.util.module_from_spec(spec)
    sys.modules["fusion_risk"] = mod
    spec.loader.exec_module(mod)

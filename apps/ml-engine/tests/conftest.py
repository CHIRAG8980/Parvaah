import sys
from pathlib import Path

ml_engine_root = Path(__file__).resolve().parents[1]
models_root = ml_engine_root / "models"
sys.path.insert(0, str(ml_engine_root))
sys.path.insert(0, str(models_root))
sys.path.insert(0, str(ml_engine_root / "src"))

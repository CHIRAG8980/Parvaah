import sys
from pathlib import Path

models_root = Path(__file__).resolve().parents[2]
if str(models_root) not in sys.path:
    sys.path.insert(0, str(models_root))

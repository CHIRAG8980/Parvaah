"""Configuration for Pre-Event Lead-Window Condition Classification Model"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ENGINE_ROOT = PROJECT_ROOT / "apps" / "ml-engine"
MODEL_ROOT = ML_ENGINE_ROOT / "models" / "lead_window"
DATA_ROOT = ML_ENGINE_ROOT / "data"

RAW_DATA = DATA_ROOT / "raw"
PROCESSED_DATA = DATA_ROOT / "processed"

SAVED_MODELS_DIR = MODEL_ROOT / "saved_models"
OUTPUTS_DIR = MODEL_ROOT / "outputs"
PLOTS_DIR = OUTPUTS_DIR / "plots"
METRICS_DIR = OUTPUTS_DIR / "metrics"
REPORTS_DIR = OUTPUTS_DIR / "reports"

LANDSLIDES_DATED_CSV = PROCESSED_DATA / "dynamic_hazard" / "landslides_exact_date_matched.csv"
RAINFALL_DAILY_CSV = PROCESSED_DATA / "features" / "rainfall_districtwise_daily_imd.csv"


@dataclass
class LeadWindowConfig:
    """Settings for Lead Window Classification"""

    # Feature definitions from IMD rainfall
    feature_names: List[str] = field(default_factory=lambda: [
        "rainfall_1d",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_14d",
        "rainfall_30d"
    ])

    # Lead window classes:
    # 0: Baseline Non-Event (normal dry/light conditions)
    # 1: Elevated Cumulative Saturation (T-7 to T-14 days prior to event)
    # 2: Imminent Trigger Window (T-1 to T-3 days prior to event)
    target_classes: Dict[int, str] = field(default_factory=lambda: {
        0: "Baseline Non-Event",
        1: "Elevated Cumulative Saturation (7-14d)",
        2: "Imminent Pre-Failure Window (1-3d)"
    })

    random_seed: int = 42
    test_size: float = 0.20
    val_size: float = 0.15

    def __post_init__(self):
        for p in [SAVED_MODELS_DIR, OUTPUTS_DIR, PLOTS_DIR, METRICS_DIR, REPORTS_DIR]:
            p.mkdir(parents=True, exist_ok=True)

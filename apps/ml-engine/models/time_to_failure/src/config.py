"""
Configuration for Time-to-Failure model pipeline.
"""
from pathlib import Path
from typing import Dict, Any

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ENGINE_ROOT = PROJECT_ROOT / "apps" / "ml-engine"
TTF_ROOT = ML_ENGINE_ROOT / "models" / "time_to_failure"

DATA_RAW = ML_ENGINE_ROOT / "data" / "raw"
DATA_PROCESSED = ML_ENGINE_ROOT / "data" / "processed"

# Ground truth
GROUND_TRUTH_EXACT = DATA_PROCESSED / "dynamic_hazard" / "landslides_exact_date_matched.csv"
GROUND_TRUTH_YEAR = DATA_RAW / "ground_truth" / "isro_nrsc_landslide_atlas" / "meghalaya_landslides_clean.csv"

# Outputs
OUTPUT_DIR = TTF_ROOT / "outputs"
PREDICTIONS_DIR = OUTPUT_DIR / "predictions"
PLOTS_DIR = OUTPUT_DIR / "plots"
METRICS_DIR = OUTPUT_DIR / "metrics"
DIAGNOSTICS_DIR = OUTPUT_DIR / "diagnostics"
REPORTS_DIR = OUTPUT_DIR / "reports"

# Saved models
MODELS_DIR = TTF_ROOT / "saved_models"

# Logs
LOGS_DIR = TTF_ROOT / "logs"

# Model requirements
MIN_EVENTS_FOR_TTF = 50  # Minimum events needed for defensible model
MIN_UNIQUE_DATES = 10    # Minimum temporal diversity
MIN_TEMPORAL_SPAN_DAYS = 30  # Minimum span needed

# Temporal validation
TRAIN_TEST_SPLIT_DATE = None  # Will be set based on available data
VALIDATION_STRATEGY = "chronological"  # Must respect time ordering

# Model configuration
MODEL_PARAMS: Dict[str, Any] = {
    "n_estimators": 100,
    "max_depth": 5,
    "learning_rate": 0.05,
    "random_state": 42,
}

# Feature configuration
FEATURE_CATEGORIES = {
    "rainfall": ["antecedent_3d", "antecedent_7d", "antecedent_14d", "cumulative_30d"],
    "terrain": ["slope", "aspect", "elevation", "curvature"],
    "susceptibility": ["static_risk_score"],
    "dynamic": ["soil_moisture", "ndvi"],
}

# Uncertainty quantification
CONFIDENCE_LEVELS = [0.68, 0.95]  # 1-sigma and 2-sigma
N_BOOTSTRAP_SAMPLES = 100

# Survival analysis configuration
SURVIVAL_TIME_BINS = [1, 3, 7, 14, 30]  # Days ahead for survival curves

# Reporting
REPORT_FORMAT = "markdown"
DIAGNOSTIC_LEVEL = "detailed"

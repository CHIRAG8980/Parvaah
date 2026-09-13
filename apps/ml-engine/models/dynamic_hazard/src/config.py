"""
Configuration for Dynamic Hazard LSTM Model
Production-quality settings for Parvaah landslide prediction system
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime

# Base paths
PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ENGINE_ROOT = PROJECT_ROOT / "apps" / "ml-engine"
MODEL_ROOT = ML_ENGINE_ROOT / "models" / "dynamic_hazard"

# Data paths
DATA_ROOT = ML_ENGINE_ROOT / "data"
RAW_DATA = DATA_ROOT / "raw"
PROCESSED_DATA = DATA_ROOT / "processed"

# Input data
LANDSLIDES_DATED = PROCESSED_DATA / "dynamic_hazard" / "landslides_exact_date_matched.csv"
RAINFALL_DAILY = PROCESSED_DATA / "features" / "rainfall_districtwise_daily_imd.csv"
RAINFALL_FEATURES = PROCESSED_DATA / "features" / "rainfall_features.csv"

# Output paths
OUTPUT_ROOT = MODEL_ROOT / "outputs"
PLOTS_DIR = OUTPUT_ROOT / "plots"
PREDICTIONS_DIR = OUTPUT_ROOT / "predictions"
MAPS_DIR = OUTPUT_ROOT / "maps"
METRICS_DIR = OUTPUT_ROOT / "metrics"
REPORTS_DIR = OUTPUT_ROOT / "reports"

# Model artifacts
SAVED_MODELS = MODEL_ROOT / "saved_models"
LOGS_DIR = MODEL_ROOT / "logs"


@dataclass
class DataConfig:
    """Data loading and preprocessing configuration"""

    # Date range for training (based on full 11-year IMD multi-annual rainfall dataset)
    start_date: str = "2014-01-01"
    end_date: str = "2024-12-31"

    # Target districts in Meghalaya
    target_districts: List[str] = field(default_factory=lambda: [
        "East Khasi Hills",
        "West Khasi Hills",
        "South West Khasi Hills",
        "Ri-Bhoi",
        "South Garo Hills",
        "East Garo Hills",
        "West Garo Hills"
    ])

    # Temporal split ratios (chronological)
    train_ratio: float = 0.6
    val_ratio: float = 0.2
    test_ratio: float = 0.2

    # Negative sampling strategy
    negative_sampling_ratio: float = 5.0  # 5 non-event days per event day

    # Sequence parameters
    sequence_length: int = 14  # 14 days of history
    prediction_horizon: int = 1  # Predict next day

    # Feature engineering
    rolling_windows: List[int] = field(default_factory=lambda: [3, 7, 14, 30])
    lag_days: List[int] = field(default_factory=lambda: [1, 3, 7])

    # Data quality
    min_data_completeness: float = 0.8  # Require 80% non-null values


@dataclass
class ModelConfig:
    """LSTM model architecture configuration"""

    # Model architecture
    lstm_units: List[int] = field(default_factory=lambda: [64, 32])
    dropout_rate: float = 0.3
    recurrent_dropout: float = 0.2

    # Dense layers after LSTM
    dense_units: List[int] = field(default_factory=lambda: [16])

    # Output
    activation: str = "sigmoid"  # Binary classification

    # Training
    batch_size: int = 16
    epochs: int = 50
    learning_rate: float = 0.001

    # Early stopping
    patience: int = 10
    min_delta: float = 0.001

    # Class imbalance handling
    use_class_weights: bool = True
    focal_loss_gamma: float = 2.0  # For focal loss if used

    # Regularization
    l2_reg: float = 0.01


@dataclass
class BaselineConfig:
    """Baseline model configurations"""

    models: List[str] = field(default_factory=lambda: [
        "logistic_regression",
        "random_forest",
        "xgboost"
    ])

    # Random Forest
    rf_n_estimators: int = 100
    rf_max_depth: int = 10
    rf_min_samples_split: int = 5

    # XGBoost
    xgb_n_estimators: int = 100
    xgb_max_depth: int = 6
    xgb_learning_rate: float = 0.1


@dataclass
class TrainingConfig:
    """Training pipeline configuration"""

    # Reproducibility
    random_seed: int = 42

    # Validation
    cross_validation: bool = False  # Use hold-out due to temporal nature

    # Model selection
    metric: str = "f1"  # Primary metric for model selection

    # Logging
    log_interval: int = 5  # Log every N epochs
    save_best_only: bool = True

    # Version tracking
    experiment_name: str = f"dynamic_hazard_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    model_version: str = "1.0.0"


@dataclass
class EvaluationConfig:
    """Model evaluation configuration"""

    # Metrics to compute
    metrics: List[str] = field(default_factory=lambda: [
        "accuracy", "precision", "recall", "f1",
        "roc_auc", "pr_auc", "confusion_matrix"
    ])

    # Threshold tuning
    tune_threshold: bool = True
    threshold_metric: str = "f1"  # Optimize threshold for this metric

    # Visualization
    plot_roc: bool = True
    plot_pr: bool = True
    plot_confusion: bool = True
    plot_feature_importance: bool = True


@dataclass
class PredictionConfig:
    """Prediction configuration"""

    # Output format
    save_predictions: bool = True
    save_probabilities: bool = True

    # Spatial output
    generate_maps: bool = True
    map_format: str = "geotiff"  # "geotiff" or "png"

    # Risk levels
    risk_thresholds: Dict[str, float] = field(default_factory=lambda: {
        "low": 0.3,
        "medium": 0.5,
        "high": 0.7,
        "critical": 0.9
    })


# Main configuration class
@dataclass
class Config:
    """Main configuration container"""

    data: DataConfig = field(default_factory=DataConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    baseline: BaselineConfig = field(default_factory=BaselineConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    evaluation: EvaluationConfig = field(default_factory=EvaluationConfig)
    prediction: PredictionConfig = field(default_factory=PredictionConfig)

    def __post_init__(self):
        """Ensure all output directories exist"""
        for path in [OUTPUT_ROOT, PLOTS_DIR, PREDICTIONS_DIR, MAPS_DIR,
                     METRICS_DIR, REPORTS_DIR, SAVED_MODELS, LOGS_DIR]:
            path.mkdir(parents=True, exist_ok=True)


def get_config() -> Config:
    """Get default configuration"""
    return Config()


if __name__ == "__main__":
    config = get_config()
    print("Configuration loaded successfully")
    print(f"Data source: {LANDSLIDES_DATED}")
    print(f"Output directory: {OUTPUT_ROOT}")
    print(f"Sequence length: {config.data.sequence_length} days")
    print(f"LSTM units: {config.model.lstm_units}")

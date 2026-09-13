"""
Configuration for Fusion/Risk Model
Combines static susceptibility, dynamic hazard, and environmental features
into final landslide risk score with confidence
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime

# Base paths
PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ENGINE_ROOT = PROJECT_ROOT / "apps" / "ml-engine"
MODEL_ROOT = ML_ENGINE_ROOT / "models" / "fusion_risk"

# Data paths
DATA_ROOT = ML_ENGINE_ROOT / "data"
RAW_DATA = DATA_ROOT / "raw"
PROCESSED_DATA = DATA_ROOT / "processed"

# Input features - individual 30m bands
FEATURES_DIR = PROCESSED_DATA / "features" / "individual_bands"

# Existing model outputs to fuse
STATIC_SUSCEPTIBILITY = PROCESSED_DATA / "outputs" / "static_susceptibility_map_30m.tif"
DYNAMIC_HAZARD = PROCESSED_DATA / "outputs" / "dynamic_hazard_alert_DOY235.tif"

# Ground truth
LANDSLIDES_DATED = PROCESSED_DATA / "dynamic_hazard" / "landslides_exact_date_matched.csv"
LANDSLIDES_INVENTORY = RAW_DATA / "ground_truth" / "meghalaya_1330_landslides.csv"

# Output paths
OUTPUT_ROOT = MODEL_ROOT / "outputs"
PLOTS_DIR = OUTPUT_ROOT / "plots"
PREDICTIONS_DIR = OUTPUT_ROOT / "predictions"
MAPS_DIR = OUTPUT_ROOT / "maps"
METRICS_DIR = OUTPUT_ROOT / "metrics"
EXPLANATIONS_DIR = OUTPUT_ROOT / "explanations"
REPORTS_DIR = OUTPUT_ROOT / "reports"

# Model artifacts
SAVED_MODELS = MODEL_ROOT / "saved_models"
LOGS_DIR = MODEL_ROOT / "logs"


@dataclass
class FeatureConfig:
    """Feature selection and fusion configuration"""

    # Core fusion inputs (existing model outputs)
    use_static_susceptibility: bool = True
    use_dynamic_hazard: bool = True

    # Topographic features (CartoDEM - ISRO)
    topographic_features: List[str] = field(default_factory=lambda: [
        "elevation_30m.tif",
        "slope_30m.tif",
        "aspect_30m.tif",
        "curvature_30m.tif"
    ])

    # Rainfall features (IMD)
    rainfall_features: List[str] = field(default_factory=lambda: [
        "rainfall_24h_30m.tif",
        "rainfall_72h_30m.tif",
        "rainfall_antecedent_7d_30m.tif"
    ])

    # Vegetation features (Sentinel-2)
    vegetation_features: List[str] = field(default_factory=lambda: [
        "ndvi_shillong_30m.tif"
    ])

    # SAR features (Sentinel-1)
    sar_features: List[str] = field(default_factory=lambda: [
        "sar_intensity_shillong_30m.tif",
        "sar_coherence_shillong_30m.tif",
        "sar_ratio_shillong_30m.tif"
    ])

    # Geological features (ISRO Bhuvan)
    geological_features: List[str] = field(default_factory=lambda: [
        "bhuvan_geomorphology_shillong_30m.tif",
        "bhuvan_lineament_shillong_30m.tif",
        "bhuvan_lulc_shillong_30m.tif"
    ])

    # Infrastructure features (OSM)
    infrastructure_features: List[str] = field(default_factory=lambda: [
        "distance_to_road_30m.tif",
        "distance_to_settlements_30m.tif",
        "distance_to_streams_30m.tif"
    ])

    # CRS and resolution
    target_crs: str = "EPSG:32646"  # WGS84 UTM Zone 46N
    target_resolution: float = 30.0  # meters

    # NoData handling
    nodata_value: float = -9999.0

    # Sampling for training
    sample_fraction: float = 0.1  # Sample 10% of pixels for training


@dataclass
class DataConfig:
    """Data loading and validation configuration"""

    # Spatial extent (Shillong area)
    min_lon: float = 91.0
    max_lon: float = 92.5
    min_lat: float = 25.0
    max_lat: float = 26.0

    # Data quality thresholds
    min_data_completeness: float = 0.7  # Require 70% non-null values
    max_nodata_fraction: float = 0.3

    # Split ratios
    train_ratio: float = 0.7
    val_ratio: float = 0.15
    test_ratio: float = 0.15

    # Random seed for reproducibility
    random_seed: int = 42

    # Negative sampling (non-landslide pixels)
    negative_sampling_ratio: float = 10.0  # 10 negative per positive


@dataclass
class ModelConfig:
    """Model architecture and training configuration"""

    # Model type
    model_type: str = "xgboost"  # Options: xgboost, lightgbm

    # XGBoost parameters
    xgb_n_estimators: int = 200
    xgb_max_depth: int = 8
    xgb_learning_rate: float = 0.05
    xgb_subsample: float = 0.8
    xgb_colsample_bytree: float = 0.8
    xgb_min_child_weight: int = 3
    xgb_gamma: float = 0.1
    xgb_reg_alpha: float = 0.1
    xgb_reg_lambda: float = 1.0

    # LightGBM parameters
    lgbm_n_estimators: int = 200
    lgbm_max_depth: int = 8
    lgbm_learning_rate: float = 0.05
    lgbm_num_leaves: int = 31
    lgbm_subsample: float = 0.8
    lgbm_colsample_bytree: float = 0.8
    lgbm_min_child_samples: int = 20
    lgbm_reg_alpha: float = 0.1
    lgbm_reg_lambda: float = 1.0

    # Training
    use_gpu: bool = False
    early_stopping_rounds: int = 20
    eval_metric: str = "auc"

    # Class imbalance
    use_scale_pos_weight: bool = True


@dataclass
class CalibrationConfig:
    """Probability calibration configuration"""

    calibrate_probabilities: bool = True
    calibration_method: str = "isotonic"  # Options: isotonic, platt


@dataclass
class ExplainabilityConfig:
    """SHAP explainability configuration"""

    compute_shap: bool = True
    shap_sample_size: int = 1000  # Sample size for SHAP computation
    plot_summary: bool = True
    plot_dependence: bool = True
    plot_feature_importance: bool = True


@dataclass
class SpatialConfig:
    """Spatial output configuration"""

    # Output CRS
    output_crs: str = "EPSG:32646"

    # Output resolution
    output_resolution: float = 30.0

    # Output format
    output_format: str = "GTiff"
    compression: str = "LZW"

    # Risk classification thresholds
    risk_thresholds: Dict[str, float] = field(default_factory=lambda: {
        "very_low": 0.2,
        "low": 0.4,
        "medium": 0.6,
        "high": 0.8,
        "very_high": 1.0
    })

    # Confidence thresholds
    min_confidence: float = 0.3  # Minimum confidence to report


@dataclass
class Config:
    """Main configuration container"""

    features: FeatureConfig = field(default_factory=FeatureConfig)
    data: DataConfig = field(default_factory=DataConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    calibration: CalibrationConfig = field(default_factory=CalibrationConfig)
    explainability: ExplainabilityConfig = field(default_factory=ExplainabilityConfig)
    spatial: SpatialConfig = field(default_factory=SpatialConfig)

    # Metadata
    model_version: str = "1.0.0"
    experiment_name: str = f"fusion_risk_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def __post_init__(self):
        """Ensure all output directories exist"""
        for path in [OUTPUT_ROOT, PLOTS_DIR, PREDICTIONS_DIR, MAPS_DIR,
                     METRICS_DIR, EXPLANATIONS_DIR, REPORTS_DIR,
                     SAVED_MODELS, LOGS_DIR]:
            path.mkdir(parents=True, exist_ok=True)


def get_config() -> Config:
    """Get default configuration"""
    return Config()


if __name__ == "__main__":
    config = get_config()
    print("Fusion/Risk Model Configuration")
    print(f"Model version: {config.model_version}")
    print(f"Static susceptibility: {STATIC_SUSCEPTIBILITY.exists()}")
    print(f"Dynamic hazard: {DYNAMIC_HAZARD.exists()}")
    print(f"Output directory: {OUTPUT_ROOT}")

"""Configuration for Static Landslide Susceptibility Model"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict

PROJECT_ROOT = Path(__file__).resolve().parents[5]
ML_ENGINE_ROOT = PROJECT_ROOT / "apps" / "ml-engine"
MODEL_ROOT = ML_ENGINE_ROOT / "models" / "static_susceptibility"
DATA_ROOT = ML_ENGINE_ROOT / "data"

RAW_DATA = DATA_ROOT / "raw"
PROCESSED_DATA = DATA_ROOT / "processed"
FEATURES_DIR = PROCESSED_DATA / "features" / "individual_bands"
OUTPUT_DIR = PROCESSED_DATA / "outputs"

SAVED_MODELS_DIR = MODEL_ROOT / "saved_models"
OUTPUTS_DIR = MODEL_ROOT / "outputs"
PLOTS_DIR = OUTPUTS_DIR / "plots"
METRICS_DIR = OUTPUTS_DIR / "metrics"
REPORTS_DIR = OUTPUTS_DIR / "reports"

GROUND_TRUTH_CSV = RAW_DATA / "ground_truth" / "meghalaya_1330_landslides.csv"
GROUND_TRUTH_GEOJSON = RAW_DATA / "ground_truth" / "meghalaya_1330_landslides.geojson"


@dataclass
class SusceptibilityConfig:
    """Settings for Static Susceptibility Modeling"""

    # 10 Indian-compliant static feature rasters
    feature_raster_names: List[str] = field(default_factory=lambda: [
        "elevation_30m.tif",
        "slope_30m.tif",
        "aspect_30m.tif",
        "curvature_30m.tif",
        "bhuvan_lulc_shillong_30m.tif",
        "bhuvan_geomorphology_shillong_30m.tif",
        "bhuvan_lineament_shillong_30m.tif",
        "distance_to_road_30m.tif",
        "distance_to_streams_30m.tif",
        "distance_to_settlements_30m.tif"
    ])

    feature_names: List[str] = field(default_factory=lambda: [
        "elevation",
        "slope",
        "aspect",
        "curvature",
        "bhuvan_lulc",
        "bhuvan_geomorphology",
        "bhuvan_lineament",
        "distance_to_road",
        "distance_to_streams",
        "distance_to_settlements"
    ])

    # Sampling parameters
    negative_ratio: float = 1.0  # Balanced 1:1 positive to negative ratio
    buffer_distance_deg: float = 0.005  # ~500m buffer away from positives for negative sampling
    random_seed: int = 42

    # Split parameters
    test_size: float = 0.20
    val_size: float = 0.15

    # Target raster output
    target_crs: str = "EPSG:4326"
    raster_width: int = 3600
    raster_height: int = 3600
    output_raster_path: Path = OUTPUT_DIR / "static_susceptibility_map_30m.tif"

    def __post_init__(self):
        for p in [SAVED_MODELS_DIR, OUTPUTS_DIR, PLOTS_DIR, METRICS_DIR, REPORTS_DIR, OUTPUT_DIR]:
            p.mkdir(parents=True, exist_ok=True)

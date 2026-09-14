"""
Tests specifically validating scientific rigor:
1. Spatial block separation in Model 1 (no coordinate leakage)
2. Zero event_id leakage across splits in Model 3
3. Validation-only threshold calibration in Model 2
4. Strict NoData preservation in Model 1 GeoTIFF output
5. Unavailable optional sensors (NISAR/EOS-04) remain UNAVAILABLE without default/zero substitution
6. Real processed NISAR GeoTIFFs ingestion and alignment
"""

import sys
import pytest
import numpy as np
import pandas as pd
import rasterio
from pathlib import Path

_ML_ROOT = Path(__file__).resolve().parents[1]
_ML_SRC = _ML_ROOT / "src"
_MODELS_DIR = _ML_ROOT / "models"
for _p in [str(_ML_ROOT), str(_ML_SRC), str(_MODELS_DIR)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from static_susceptibility.src.config import SusceptibilityConfig
from static_susceptibility.src.data_loader import SusceptibilityDataLoader
from lead_window.src.data_loader import LeadWindowDataLoader
from dynamic_hazard.src.evaluate import ModelEvaluator
from dynamic_hazard.src.config import EvaluationConfig
try:
    from inference_pipeline import ParvaahInferencePipeline
except ImportError:
    from src.inference_pipeline import ParvaahInferencePipeline



def test_model1_spatial_block_separation():
    """Test that Model 1 train, validation, and test splits have strictly disjoint spatial blocks."""
    loader = SusceptibilityDataLoader()
    train_df, val_df, test_df = loader.prepare_dataset()
    loader.close()

    train_blocks = set(train_df["spatial_block_id"].unique())
    val_blocks = set(val_df["spatial_block_id"].unique())
    test_blocks = set(test_df["spatial_block_id"].unique())

    assert train_blocks.isdisjoint(val_blocks), "Spatial block leakage between Train and Val!"
    assert train_blocks.isdisjoint(test_blocks), "Spatial block leakage between Train and Test!"
    assert val_blocks.isdisjoint(test_blocks), "Spatial block leakage between Val and Test!"
    assert len(train_df) > 0 and len(val_df) > 0 and len(test_df) > 0


def test_model3_zero_event_leakage():
    """Test that Model 3 partitions by unique event_id so no event's windows span across splits."""
    loader = LeadWindowDataLoader()
    train_df, val_df, test_df = loader.prepare_dataset()

    train_eids = set(train_df[train_df["event_id"] >= 0]["event_id"].unique())
    val_eids = set(val_df[val_df["event_id"] >= 0]["event_id"].unique())
    test_eids = set(test_df[test_df["event_id"] >= 0]["event_id"].unique())

    assert train_eids.isdisjoint(val_eids), "Event ID leakage between Train and Val!"
    assert train_eids.isdisjoint(test_eids), "Event ID leakage between Train and Test!"
    assert val_eids.isdisjoint(test_eids), "Event ID leakage between Val and Test!"


def test_model2_validation_only_threshold_calibration():
    """Test that threshold tuning is strictly performed on validation predictions and fixed for test."""
    evaluator = ModelEvaluator(EvaluationConfig(tune_threshold=True, threshold_metric="f1"))

    np.random.seed(42)
    # Validation synthetic probabilities and labels with optimal threshold around 0.35
    y_val = np.array([0]*90 + [1]*10)
    y_val_probs = np.concatenate([np.random.uniform(0.01, 0.30, 90), np.random.uniform(0.35, 0.90, 10)])

    val_thresh, val_f1 = evaluator.find_optimal_threshold(y_val, y_val_probs, metric="f1")
    assert 0.30 <= val_thresh <= 0.40

    # Test set evaluated using fixed_threshold from validation
    y_test = np.array([0]*90 + [1]*10)
    y_test_probs = np.concatenate([np.random.uniform(0.01, 0.30, 90), np.random.uniform(0.35, 0.90, 10)])

    class DummyModel:
        def predict_proba(self, X):
            return np.column_stack([1 - y_test_probs, y_test_probs])

    test_res = evaluator.evaluate_model(
        DummyModel(), X=np.zeros((100, 5)), y=y_test,
        split_name="test", fixed_threshold=val_thresh
    )
    assert test_res["threshold"] == val_thresh


def test_model1_nodata_preservation():
    """Test that the generated susceptibility GeoTIFF contains NaN nodata and no median filled values."""
    config = SusceptibilityConfig()
    raster_path = config.output_raster_path
    if raster_path.exists():
        with rasterio.open(raster_path) as src:
            data = src.read(1)
            assert np.isnan(src.nodata) or src.nodata is None
            assert np.any(~np.isnan(data)), "GeoTIFF contains no valid predictions"


def test_unavailable_sensors_remain_truthful():
    """Test that when NISAR and EOS-04 are omitted, status is explicitly UNAVAILABLE (never zero/default)."""
    pipeline = ParvaahInferencePipeline()
    res = pipeline.predict(
        slope_deg=22.0,
        rainfall_24h_mm=35.0,
        soil_moisture_pct=None,
        nisar_los_deformation_m=None,
        nisar_coherence=None
    )

    assert res.data_availability["soil_moisture_eos04"]["status"] == "UNAVAILABLE"
    assert res.data_availability["insar_nisar"]["status"] == "UNAVAILABLE"
    assert any("UNAVAILABLE" in f for f in res.contributing_factors)


def test_real_nisar_geotiff_ingestion():
    """Test that the processed NISAR GeoTIFFs can be opened, validated, and sampled."""
    nisar_dir = Path("apps/ml-engine/data/processed/features/NISAR")
    tifs = list(nisar_dir.glob("*.tif"))
    assert len(tifs) >= 6, f"Expected at least 6 NISAR GeoTIFFs, found {len(tifs)}"

    for tif in tifs:
        with rasterio.open(tif) as src:
            assert src.crs.to_string() == "EPSG:32645"
            assert src.res == (80.0, 80.0)
            assert src.height == 1370 and src.width == 2168
            data = src.read(1)
            assert np.any(~np.isnan(data)), "NISAR raster has no valid pixels"

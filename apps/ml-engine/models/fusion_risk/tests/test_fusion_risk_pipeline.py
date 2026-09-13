"""
Basic integration test for Fusion/Risk pipeline
Verifies all components work together
"""

import sys
from pathlib import Path
import numpy as np

# Add parent directory to path
from fusion_risk.config import get_config, STATIC_SUSCEPTIBILITY, FEATURES_DIR
from fusion_risk.data_loader import DataLoader, RasterLoader, RASTERIO_AVAILABLE
from fusion_risk.feature_builder import FeatureBuilder
from fusion_risk.preprocessing import Preprocessor
from fusion_risk.model import FusionRiskModel


def test_data_loading():
    """Test data loading"""
    config = get_config()
    loader = DataLoader(config)

    df, coords = loader.load_ground_truth()
    assert len(df) > 0, "No landslides loaded"
    assert len(coords) > 0, "No pixel coordinates"


def test_feature_loading():
    """Test feature raster loading"""
    config = get_config()
    raster_loader = RasterLoader(config)

    test_file = FEATURES_DIR / "elevation_30m.tif"
    assert test_file.exists(), f"Test file not found: {test_file}"
    array, metadata = raster_loader.load_raster(test_file)
    assert array.shape[0] > 0 and array.shape[1] > 0, "Invalid raster shape"
    assert "shape" in metadata
    assert "crs" in metadata


def test_feature_matrix():
    """Test feature matrix building"""
    print("Testing feature matrix building...")

    config = get_config()
    builder = FeatureBuilder(config)

    # Create dummy feature arrays
    shape = (100, 100)
    feature_arrays = {
        "elevation": np.random.randn(*shape),
        "slope": np.random.randn(*shape),
        "rainfall": np.random.randn(*shape)
    }

    X, feature_names, valid_mask = builder.rasters_to_feature_matrix(feature_arrays)

    assert X.shape[0] == shape[0] * shape[1], "Wrong number of samples"
    assert X.shape[1] == len(feature_arrays), "Wrong number of features"
    assert len(feature_names) == len(feature_arrays), "Feature names mismatch"

    print(f"✓ Feature matrix: {X.shape}")


def test_preprocessing():
    """Test preprocessing"""
    print("Testing preprocessing...")

    preprocessor = Preprocessor(scaler_type="standard")

    # Dummy data
    X_train = np.random.randn(100, 5)
    X_test = np.random.randn(20, 5)

    # Fit and transform
    preprocessor.fit(X_train)
    X_train_scaled = preprocessor.transform(X_train)
    X_test_scaled = preprocessor.transform(X_test)

    assert X_train_scaled.shape == X_train.shape, "Shape changed"
    assert X_test_scaled.shape == X_test.shape, "Shape changed"

    print(f"✓ Preprocessing: scaled {X_train.shape}")


def test_model():
    """Test model building and training"""
    print("Testing model...")

    config = get_config()
    model = FusionRiskModel(config)

    # Dummy data
    X_train = np.random.randn(100, 5)
    y_train = np.random.randint(0, 2, 100)

    # Build and train
    model.build_model(n_features=5, scale_pos_weight=2.0)
    history = model.train(X_train, y_train)

    assert model.is_trained, "Model not trained"

    # Predict
    proba = model.predict_proba(X_train[:10])
    assert proba.shape == (10, 2), "Wrong prediction shape"

    print(f"✓ Model trained and tested")


def run_all_tests():
    """Run all tests"""
    print("="*60)
    print("FUSION/RISK MODEL - INTEGRATION TESTS")
    print("="*60 + "\n")

    tests = [
        ("Data Loading", test_data_loading),
        ("Feature Loading", test_feature_loading),
        ("Feature Matrix", test_feature_matrix),
        ("Preprocessing", test_preprocessing),
        ("Model", test_model)
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            test_func()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"✗ {name} ERROR: {e}\n")

    print("="*60)
    print(f"Tests: {passed} passed, {failed} failed")
    print("="*60)

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(run_all_tests())

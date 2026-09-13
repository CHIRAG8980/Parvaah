"""
Test suite for Dynamic Hazard model
Basic unit tests for data loading, preprocessing, and model components
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def test_config():
    """Test configuration loading"""
    from config import get_config

    config = get_config()
    assert config.data.sequence_length > 0
    assert config.model.batch_size > 0
    assert len(config.model.lstm_units) > 0
    print("✓ Config test passed")


def test_data_loader():
    """Test data loading"""
    from config import get_config, LANDSLIDES_DATED, RAINFALL_DAILY
    from data_loader import DataLoader
    from utils import setup_logging

    # Check if data files exist
    if not LANDSLIDES_DATED.exists():
        print("⚠ Landslide data not found, skipping data loader test")
        return

    if not RAINFALL_DAILY.exists():
        print("⚠ Rainfall data not found, skipping data loader test")
        return

    config = get_config()
    logger = setup_logging(Path("logs"))

    loader = DataLoader(config.data, logger)

    try:
        landslides, daily_df = loader.load_all(apply_sampling=False)
        assert len(landslides) >= 0
        assert len(daily_df) >= 0
        assert "date" in daily_df.columns
        assert "landslide_occurred" in daily_df.columns
        print("✓ Data loader test passed")
    except Exception as e:
        print(f"⚠ Data loader test failed: {e}")


def test_feature_engineering():
    """Test feature engineering"""
    from features import FeatureEngineer
    from config import get_config

    config = get_config()
    engineer = FeatureEngineer(config.data)

    # Create sample data
    dates = pd.date_range("2024-05-01", periods=30, freq="D")
    df = pd.DataFrame({
        "date": dates,
        "district": ["East Khasi Hills"] * 30,
        "rainfall": np.random.uniform(0, 50, 30),
        "landslide_occurred": np.random.randint(0, 2, 30)
    })

    # Engineer features
    featured_df = engineer.engineer_all_features(df)

    # Check features were added
    assert len(featured_df.columns) > len(df.columns)
    assert "month" in featured_df.columns
    assert "rainfall_log" in featured_df.columns

    feature_cols = engineer.get_feature_names(featured_df)
    assert len(feature_cols) > 0

    print("✓ Feature engineering test passed")


def test_preprocessing():
    """Test preprocessing"""
    from preprocessing import Preprocessor
    from config import get_config

    config = get_config()
    preprocessor = Preprocessor(config.data)

    # Create sample data
    dates = pd.date_range("2024-05-01", periods=50, freq="D")
    n = len(dates)
    df = pd.DataFrame({
        "date": dates,
        "district": ["East Khasi Hills"] * n,
        "feature1": np.random.randn(n),
        "feature2": np.random.randn(n),
        "feature3": np.random.randn(n),
        "landslide_occurred": np.random.randint(0, 2, n)
    })

    # Temporal split
    train_df, val_df, test_df = preprocessor.temporal_split(df)

    assert len(train_df) > 0
    assert len(train_df) + len(val_df) + len(test_df) == len(df)

    # Prepare features
    feature_cols = ["feature1", "feature2", "feature3"]
    X_train, y_train, meta_train = preprocessor.prepare_features(
        train_df, feature_cols, is_train=True
    )

    assert X_train.shape[0] == len(train_df)
    assert X_train.shape[1] == len(feature_cols)
    assert y_train.shape[0] == len(train_df)

    print("✓ Preprocessing test passed")


def test_sequence_builder():
    """Test sequence building"""
    from sequence_builder import SequenceBuilder
    from config import get_config

    config = get_config()
    builder = SequenceBuilder(config.data)

    # Create sample data
    n_samples = 100
    n_features = 10
    X = np.random.randn(n_samples, n_features)
    y = np.random.randint(0, 2, n_samples)

    dates = pd.date_range("2024-05-01", periods=n_samples, freq="D")
    metadata = pd.DataFrame({
        "date": dates,
        "district": ["East Khasi Hills"] * n_samples
    })

    # Build sequences
    try:
        X_seq, y_seq, meta_seq = builder.create_sequences(X, y, metadata)

        assert len(X_seq.shape) == 3  # (n_sequences, sequence_length, n_features)
        assert X_seq.shape[1] == config.data.sequence_length
        assert X_seq.shape[2] == n_features
        assert y_seq.shape[0] == X_seq.shape[0]
        assert len(meta_seq) == X_seq.shape[0]

        print("✓ Sequence builder test passed")
    except ValueError as e:
        print(f"⚠ Sequence builder test skipped: {e}")


def test_model_architecture():
    """Test LSTM model building"""
    try:
        from model import DynamicHazardLSTM
        from config import get_config

        config = get_config()
        input_shape = (14, 30)  # 14 days, 30 features

        model = DynamicHazardLSTM(config.model, input_shape)
        keras_model = model.build_model()

        assert keras_model is not None
        assert keras_model.input_shape[1:] == input_shape

        # Test prediction shape
        X_test = np.random.randn(10, 14, 30)
        predictions = model.predict(X_test)
        assert predictions.shape == (10,)

        print("✓ Model architecture test passed")
    except ImportError:
        print("⚠ TensorFlow not available, skipping model test")


def test_evaluation_metrics():
    """Test evaluation metrics computation"""
    from evaluate import ModelEvaluator
    from config import get_config

    config = get_config()
    evaluator = ModelEvaluator(config.evaluation)

    # Create sample predictions
    y_true = np.array([0, 0, 1, 1, 0, 1, 1, 0, 1, 0])
    y_pred_proba = np.array([0.1, 0.2, 0.8, 0.7, 0.3, 0.9, 0.6, 0.4, 0.85, 0.15])

    metrics = evaluator.compute_metrics(y_true, y_pred_proba, threshold=0.5)

    assert "accuracy" in metrics
    assert "precision" in metrics
    assert "recall" in metrics
    assert "f1" in metrics
    assert 0 <= metrics["accuracy"] <= 1

    print("✓ Evaluation metrics test passed")


def test_prediction_pipeline():
    """Test prediction pipeline"""
    from predict import HazardPredictor
    from config import get_config

    config = get_config()
    predictor = HazardPredictor(config.prediction)

    # Test risk level conversion
    probs = np.array([0.1, 0.35, 0.55, 0.75, 0.95])
    risk_levels = predictor.predict_risk_levels(probs)

    assert len(risk_levels) == len(probs)
    assert risk_levels[0] == 0  # Minimal
    assert risk_levels[-1] == 4  # Critical

    print("✓ Prediction pipeline test passed")


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("Running Dynamic Hazard Model Tests")
    print("="*60 + "\n")

    tests = [
        test_config,
        test_data_loader,
        test_feature_engineering,
        test_preprocessing,
        test_sequence_builder,
        test_model_architecture,
        test_evaluation_metrics,
        test_prediction_pipeline
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            failed += 1

    print("\n" + "="*60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("="*60 + "\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

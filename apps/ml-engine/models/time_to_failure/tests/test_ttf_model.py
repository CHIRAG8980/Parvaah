"""
Unit tests for TTFModel, FeatureBuilder, and TTFPredictor.
"""
from pathlib import Path
import sys
import tempfile
import numpy as np
import pandas as pd
import pytest

from ttf.model import TTFModel, train_ttf_model
from ttf.feature_builder import FeatureBuilder
from ttf.predict import TTFPredictor


@pytest.fixture
def sample_training_data():
    np.random.seed(42)
    n = 30
    X = pd.DataFrame({
        "lat_rounded": np.linspace(25.0, 26.0, n),
        "lon_rounded": np.linspace(91.0, 92.0, n),
        "slope": np.random.uniform(10, 45, n),
        "antecedent_3d": np.random.uniform(0, 100, n),
        "antecedent_7d": np.random.uniform(20, 200, n),
    })
    y = pd.Series(np.random.uniform(10, 500, n), name="ttf_days")
    return X, y


def test_ttf_model_fit_and_predict(sample_training_data):
    X, y = sample_training_data
    model = TTFModel(model_type="random_forest", n_estimators=10, random_state=42)
    metrics = model.fit(X, y)

    assert "train_mae" in metrics
    assert "train_rmse" in metrics
    assert metrics["train_mae"] >= 0

    preds, uncertainty = model.predict(X, return_uncertainty=True)
    assert len(preds) == len(X)
    assert len(uncertainty) == len(X)
    assert all(preds >= 0)
    assert all(uncertainty >= 0)


def test_ttf_model_save_and_load(sample_training_data):
    X, y = sample_training_data
    with tempfile.TemporaryDirectory() as tmpdir:
        save_path = Path(tmpdir) / "test_ttf.joblib"
        model, _ = train_ttf_model(X, y, model_type="random_forest", n_estimators=5, save_path=save_path)

        loaded = TTFModel.load(save_path)
        assert loaded.trained is True
        assert loaded.feature_names == model.feature_names

        predictor = TTFPredictor(save_path)
        pred_df = predictor.predict(X, return_confidence=True)
        assert "predicted_ttf_days" in pred_df.columns
        assert "uncertainty_days" in pred_df.columns
        assert (pred_df["lower_bound_1sigma"] >= 0).all()


def test_feature_builder_spatial():
    builder = FeatureBuilder()
    df = pd.DataFrame({
        "latitude": [25.5788, 25.6],
        "longitude": [91.8933, 91.9]
    })
    result = builder.add_spatial_features(df)
    assert "dist_from_shillong" in result.columns
    assert result["dist_from_shillong"].iloc[0] == pytest.approx(0.0, abs=1e-2)

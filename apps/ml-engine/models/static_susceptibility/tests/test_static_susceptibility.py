"""Unit tests for Static Susceptibility Model"""

import pytest
import numpy as np
import pandas as pd

from static_susceptibility.src.config import SusceptibilityConfig
from static_susceptibility.src.model import SusceptibilityModel
from static_susceptibility.src.data_loader import SusceptibilityDataLoader
from static_susceptibility.src.evaluate import evaluate_susceptibility_model


def test_susceptibility_config():
    config = SusceptibilityConfig()
    assert len(config.feature_raster_names) == 10
    assert len(config.feature_names) == 10
    assert config.negative_ratio == 1.0


def test_susceptibility_model_fit_predict():
    np.random.seed(42)
    n_samples = 100
    n_features = 10
    X = np.random.randn(n_samples, n_features)
    y = np.random.randint(0, 2, n_samples)
    feature_names = [f"f_{i}" for i in range(n_features)]

    model = SusceptibilityModel(model_type="random_forest", random_state=42)
    model.fit(X, y, feature_names=feature_names)

    probs = model.predict_proba(X)
    assert probs.shape == (n_samples, 2)
    assert np.all((probs >= 0.0) & (probs <= 1.0))

    preds = model.predict(X)
    assert preds.shape == (n_samples,)
    assert set(preds).issubset({0, 1})

    imp = model.get_feature_importances()
    assert len(imp) == n_features


def test_susceptibility_evaluation():
    np.random.seed(42)
    n_samples = 50
    n_features = 10
    X = np.random.randn(n_samples, n_features)
    y = np.random.randint(0, 2, n_samples)
    feature_names = [f"f_{i}" for i in range(n_features)]

    model = SusceptibilityModel(model_type="random_forest", random_state=42)
    model.fit(X, y, feature_names=feature_names)

    metrics = evaluate_susceptibility_model(model, X, y, split_name="test_temp")
    assert "roc_auc" in metrics
    assert "pr_auc" in metrics
    assert "f1_score" in metrics
    assert metrics["sample_count"] == n_samples

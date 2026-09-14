"""Unit tests for Pre-Event Lead-Window Classifier"""

import pytest
import numpy as np
import pandas as pd

from lead_window.src.config import LeadWindowConfig
from lead_window.src.model import LeadWindowClassifier
from lead_window.src.evaluate import evaluate_lead_window_model


def test_lead_window_config():
    config = LeadWindowConfig()
    assert len(config.feature_names) == 5
    assert len(config.target_classes) == 3


def test_lead_window_model_fit_predict():
    np.random.seed(42)
    n_samples = 120
    n_features = 5
    X = np.random.exponential(scale=20.0, size=(n_samples, n_features))
    y = np.random.randint(0, 3, n_samples)
    feature_names = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "rainfall_14d", "rainfall_30d"]

    model = LeadWindowClassifier(model_type="random_forest", random_state=42)
    model.fit(X, y, feature_names=feature_names)

    probs = model.predict_proba(X)
    assert probs.shape == (n_samples, 3)
    assert np.allclose(probs.sum(axis=1), 1.0)

    preds = model.predict(X)
    assert preds.shape == (n_samples,)
    assert set(preds).issubset({0, 1, 2})


def test_lead_window_evaluation():
    np.random.seed(42)
    n_samples = 60
    n_features = 5
    X = np.random.exponential(scale=20.0, size=(n_samples, n_features))
    y = np.random.randint(0, 3, n_samples)
    feature_names = ["rainfall_1d", "rainfall_3d", "rainfall_7d", "rainfall_14d", "rainfall_30d"]

    model = LeadWindowClassifier(model_type="random_forest", random_state=42)
    model.fit(X, y, feature_names=feature_names)

    metrics = evaluate_lead_window_model(model, X, y, split_name="test_temp")
    assert "accuracy" in metrics
    assert "balanced_accuracy" in metrics
    assert "macro_f1" in metrics
    assert metrics["sample_count"] == n_samples

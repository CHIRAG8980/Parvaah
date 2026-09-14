"""Model wrapper for Pre-Event Lead-Window Condition Classification"""

from typing import Dict, Any, List
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import lightgbm as lgb
import numpy as np


class LeadWindowClassifier:
    """Classifies antecedent rainfall state into Lead Time Warning Windows."""

    def __init__(self, model_type: str = "random_forest", random_state: int = 42):
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.model = self._init_model()

    def _init_model(self):
        if self.model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=200,
                max_depth=8,
                min_samples_split=4,
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=-1
            )
        elif self.model_type == "lightgbm":
            return lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                class_weight="balanced",
                random_state=self.random_state,
                verbose=-1
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

    def fit(self, X, y, feature_names: List[str] = None):
        if feature_names:
            self.feature_names = list(feature_names)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        return self

    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def predict(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X_scaled)

    def get_feature_importances(self) -> Dict[str, float]:
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            names = self.feature_names or [f"f_{i}" for i in range(len(importances))]
            return dict(zip(names, [float(v) for v in importances]))
        return {}

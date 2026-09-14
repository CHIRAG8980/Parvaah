"""Model definition and wrapper for Landslide Susceptibility Modeling"""

from typing import Dict, Any
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import RobustScaler
import xgboost as xgb
import lightgbm as lgb


class SusceptibilityModel:
    """Wrapper supporting Random Forest, XGBoost, and LightGBM classifiers."""

    def __init__(self, model_type: str = "random_forest", random_state: int = 42):
        self.model_type = model_type.lower()
        self.random_state = random_state
        self.scaler = RobustScaler()
        self.model = self._init_model()
        self.feature_names = []

    def _init_model(self):
        if self.model_type == "random_forest":
            return RandomForestClassifier(
                n_estimators=200,
                max_depth=12,
                min_samples_split=4,
                min_samples_leaf=2,
                class_weight="balanced",
                random_state=self.random_state,
                n_jobs=-1
            )
        elif self.model_type == "xgboost":
            return xgb.XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state,
                eval_metric="logloss"
            )
        elif self.model_type == "lightgbm":
            return lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=self.random_state,
                verbose=-1
            )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

    def fit(self, X, y, feature_names=None):
        if feature_names:
            self.feature_names = list(feature_names)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        return self

    def predict_proba(self, X):
        X_scaled = self.scaler.transform(X)
        return self.model.predict_proba(X_scaled)

    def predict(self, X, threshold: float = 0.5):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def get_feature_importances(self) -> Dict[str, float]:
        if hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
            names = self.feature_names or [f"f_{i}" for i in range(len(importances))]
            return dict(zip(names, [float(v) for v in importances]))
        return {}

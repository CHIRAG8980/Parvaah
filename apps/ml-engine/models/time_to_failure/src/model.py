"""
Time-to-Failure ML model implementation.
Uses scikit-learn ensemble regressors with empirical uncertainty quantification.
"""
from pathlib import Path
from typing import Dict, Optional, Tuple, List, Union
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from .config import MODEL_PARAMS

logger = logging.getLogger(__name__)


class TTFModel:
    """Time-to-Failure regression model with uncertainty quantification."""

    def __init__(self, model_type: str = "random_forest", **kwargs):
        self.model_type = model_type
        self.feature_names: Optional[List[str]] = None
        self.trained = False
        self.train_metrics: Dict[str, float] = {}
        self.residual_std: float = 0.0

        params = {**MODEL_PARAMS, **kwargs}
        if model_type == "gradient_boosting":
            valid_keys = {"n_estimators", "max_depth", "learning_rate", "random_state", "min_samples_split"}
            self.model = GradientBoostingRegressor(**{k: v for k, v in params.items() if k in valid_keys})
        else:
            valid_keys = {"n_estimators", "max_depth", "random_state", "min_samples_split", "n_jobs"}
            self.model = RandomForestRegressor(**{k: v for k, v in params.items() if k in valid_keys})

        logger.info(f"Initialized {self.model_type} model")

    def fit(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: Optional[pd.DataFrame] = None,
        y_val: Optional[pd.Series] = None
    ) -> Dict[str, float]:
        """Train the model and calculate evaluation metrics."""
        self.feature_names = list(X_train.columns)
        self.model.fit(X_train, y_train)

        y_train_pred = self.model.predict(X_train)
        residuals = y_train.values - y_train_pred
        self.residual_std = float(np.std(residuals))

        self.train_metrics = {
            "train_mae": round(float(mean_absolute_error(y_train, y_train_pred)), 4),
            "train_rmse": round(float(np.sqrt(mean_squared_error(y_train, y_train_pred))), 4),
            "train_r2": round(float(r2_score(y_train, y_train_pred)), 4),
        }

        if X_val is not None and y_val is not None:
            y_val_pred = self.model.predict(X_val)
            self.train_metrics.update({
                "val_mae": round(float(mean_absolute_error(y_val, y_val_pred)), 4),
                "val_rmse": round(float(np.sqrt(mean_squared_error(y_val, y_val_pred))), 4),
                "val_r2": round(float(r2_score(y_val, y_val_pred)), 4),
            })

        self.trained = True
        return self.train_metrics

    def predict(
        self,
        X: pd.DataFrame,
        return_uncertainty: bool = False
    ) -> Union[Tuple[np.ndarray, np.ndarray], np.ndarray]:
        """Make predictions with optional per-sample uncertainty quantification."""
        if not self.trained:
            raise RuntimeError("Model not trained")

        X_aligned = X[self.feature_names]
        predictions = np.maximum(self.model.predict(X_aligned), 0)

        if not return_uncertainty:
            return predictions

        if isinstance(self.model, RandomForestRegressor):
            tree_preds = np.array([tree.predict(X_aligned.values) for tree in self.model.estimators_])
            uncertainty = np.std(tree_preds, axis=0)
        elif isinstance(self.model, GradientBoostingRegressor):
            staged_preds = np.array(list(self.model.staged_predict(X_aligned)))
            staged_tail = staged_preds[-min(20, len(staged_preds)):]
            uncertainty = np.maximum(np.std(staged_tail, axis=0), self.residual_std)
        else:
            uncertainty = np.full(len(predictions), fill_value=self.residual_std)

        return predictions, uncertainty

    def get_feature_importance(self) -> pd.DataFrame:
        """Compute feature importances."""
        if not self.trained:
            raise RuntimeError("Model not trained")

        importances = getattr(self.model, "feature_importances_", np.zeros(len(self.feature_names)))
        return pd.DataFrame({
            "feature": self.feature_names,
            "importance": importances
        }).sort_values("importance", ascending=False)

    def save(self, filepath: Path) -> None:
        """Save trained model to disk."""
        if not self.trained:
            raise RuntimeError("Cannot save untrained model")
        filepath.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "model_type": self.model_type,
            "feature_names": self.feature_names,
            "train_metrics": self.train_metrics,
            "residual_std": self.residual_std,
        }, filepath)
        logger.info(f"Model saved to {filepath}")

    @classmethod
    def load(cls, filepath: Path) -> "TTFModel":
        """Load trained model from disk."""
        data = joblib.load(filepath)
        instance = cls(model_type=data["model_type"])
        instance.model = data["model"]
        instance.feature_names = data["feature_names"]
        instance.train_metrics = data["train_metrics"]
        instance.residual_std = data.get("residual_std", 0.0)
        instance.trained = True
        logger.info(f"Model loaded from {filepath}")
        return instance


def train_ttf_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: Optional[pd.DataFrame] = None,
    y_val: Optional[pd.Series] = None,
    model_type: str = "random_forest",
    save_path: Optional[Path] = None,
    **kwargs
) -> Tuple[TTFModel, Dict[str, float]]:
    """Train and optionally save TTF model."""
    model = TTFModel(model_type=model_type, **kwargs)
    metrics = model.fit(X_train, y_train, X_val, y_val)
    if save_path:
        model.save(save_path)
    return model, metrics

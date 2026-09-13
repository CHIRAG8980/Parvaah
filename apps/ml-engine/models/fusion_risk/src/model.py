"""
Model implementation for Fusion/Risk.
Uses ensemble classifiers (GradientBoosting, RandomForest, or XGBoost if present).
"""
from pathlib import Path
from typing import Dict, Any, Optional, List
import logging
import pickle
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import roc_auc_score

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    xgb = None
    XGBOOST_AVAILABLE = False

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    lgb = None
    LIGHTGBM_AVAILABLE = False

from .config import Config
from .confidence import compute_confidence

logger = logging.getLogger(__name__)


class FusionRiskModel:
    """Ensemble classifier for multi-modal landslide risk prediction."""

    def __init__(self, config: Config):
        self.config = config
        self.model_type = config.model.model_type
        self.model = None
        self.is_trained = False
        self.feature_names: Optional[List[str]] = None
        self.n_features: Optional[int] = None

    def build_model(self, n_features: int, scale_pos_weight: Optional[float] = None) -> None:
        """Build model architecture based on availability."""
        self.n_features = n_features

        if self.model_type == "xgboost" and XGBOOST_AVAILABLE:
            params = {
                'objective': 'binary:logistic',
                'eval_metric': 'auc',
                'max_depth': self.config.model.xgb_max_depth,
                'learning_rate': self.config.model.xgb_learning_rate,
                'n_estimators': self.config.model.xgb_n_estimators,
                'subsample': self.config.model.xgb_subsample,
                'random_state': self.config.data.random_seed,
                'n_jobs': -1
            }
            if scale_pos_weight and self.config.model.use_scale_pos_weight:
                params['scale_pos_weight'] = scale_pos_weight
            self.model = xgb.XGBClassifier(**params)
        elif self.model_type == "lightgbm" and LIGHTGBM_AVAILABLE:
            params = {
                'objective': 'binary',
                'metric': 'auc',
                'max_depth': self.config.model.lgbm_max_depth,
                'learning_rate': self.config.model.lgbm_learning_rate,
                'n_estimators': self.config.model.lgbm_n_estimators,
                'random_state': self.config.data.random_seed,
                'n_jobs': -1,
                'verbose': -1
            }
            if scale_pos_weight and self.config.model.use_scale_pos_weight:
                params['scale_pos_weight'] = scale_pos_weight
            self.model = lgb.LGBMClassifier(**params)
        else:
            self.model = GradientBoostingClassifier(
                max_depth=getattr(self.config.model, 'xgb_max_depth', 5),
                learning_rate=getattr(self.config.model, 'xgb_learning_rate', 0.05),
                n_estimators=getattr(self.config.model, 'xgb_n_estimators', 100),
                subsample=getattr(self.config.model, 'xgb_subsample', 0.8),
                random_state=self.config.data.random_seed
            )

        logger.info(f"Built {type(self.model).__name__} model")

    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Train model and compute evaluation history."""
        if self.model is None:
            raise RuntimeError("Model not built. Call build_model() first.")

        self.feature_names = feature_names
        self.model.fit(X_train, y_train)
        self.is_trained = True

        train_preds = self.predict_proba(X_train)[:, 1]
        try:
            train_auc = float(roc_auc_score(y_train, train_preds))
        except Exception:
            train_auc = 0.5
        history: Dict[str, List[float]] = {'train_auc': [train_auc]}

        if X_val is not None and y_val is not None:
            val_preds = self.predict_proba(X_val)[:, 1]
            try:
                val_auc = float(roc_auc_score(y_val, val_preds))
            except Exception:
                val_auc = 0.5
            history['val_auc'] = [val_auc]

        logger.info(f"Training completed: train_auc={train_auc:.4f}")
        return history

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Predict class probabilities."""
        if not self.is_trained:
            raise RuntimeError("Model not trained")
        return self.model.predict_proba(X)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """Predict binary labels with threshold."""
        return (self.predict_proba(X)[:, 1] >= threshold).astype(int)

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance mapping."""
        if not self.is_trained:
            raise RuntimeError("Model not trained")
        importances = getattr(self.model, 'feature_importances_', np.ones(self.n_features or 1))
        if self.feature_names:
            return dict(zip(self.feature_names, [float(v) for v in importances]))
        return {f"feature_{i}": float(v) for i, v in enumerate(importances)}

    def save(self, output_path: Path) -> None:
        """Save model to disk."""
        if not self.is_trained:
            raise RuntimeError("Cannot save untrained model")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            pickle.dump(self, f)
        logger.info(f"Saved model to {output_path}")

    @staticmethod
    def load(input_path: Path) -> 'FusionRiskModel':
        """Load model from disk."""
        with open(input_path, 'rb') as f:
            model = pickle.load(f)
        logger.info(f"Loaded model from {input_path}")
        return model

    def get_metadata(self) -> Dict[str, Any]:
        """Get model metadata."""
        return {
            "model_type": type(self.model).__name__,
            "is_trained": self.is_trained,
            "n_features": self.n_features,
            "feature_names": self.feature_names
        }

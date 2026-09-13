"""
SHAP explainability for Fusion/Risk model.
Computes SHAP values and generates explainability metrics and plots.
"""
from pathlib import Path
from typing import Dict, Optional, List, Any
import logging
import numpy as np
import matplotlib.pyplot as plt

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False

from .config import Config, EXPLANATIONS_DIR
from .model import FusionRiskModel

logger = logging.getLogger(__name__)


class ExplainabilityAnalyzer:
    """Computes SHAP explainability for model predictions."""

    def __init__(self, model: FusionRiskModel, config: Config):
        if not SHAP_AVAILABLE:
            raise ImportError("SHAP not installed - cannot compute explainability")
        self.model = model
        self.config = config
        self.explainer = None
        self.shap_values: Optional[np.ndarray] = None

    def compute_shap_values(
        self,
        X_background: np.ndarray,
        X_explain: np.ndarray
    ) -> np.ndarray:
        """Compute SHAP values using tree or general explainer."""
        if len(X_background) > self.config.explainability.shap_sample_size:
            idx = np.random.choice(len(X_background), size=self.config.explainability.shap_sample_size, replace=False)
            X_background = X_background[idx]

        tree_types = {"xgboost", "lightgbm", "random_forest", "gradient_boosting"}
        if self.model.model_type in tree_types:
            self.explainer = shap.TreeExplainer(self.model.model)
        else:
            self.explainer = shap.Explainer(self.model.model.predict_proba, X_background)

        self.shap_values = self.explainer.shap_values(X_explain)
        if isinstance(self.shap_values, list) and len(self.shap_values) > 1:
            self.shap_values = self.shap_values[1]

        logger.info(f"SHAP values computed: shape={self.shap_values.shape}")
        return self.shap_values

    def plot_shap_summary(
        self,
        X: np.ndarray,
        feature_names: List[str],
        save_path: Optional[Path] = None,
        max_display: int = 20
    ) -> None:
        """Generate and save SHAP summary plot."""
        if self.shap_values is None:
            raise RuntimeError("SHAP values not computed. Call compute_shap_values() first.")

        plt.figure(figsize=(10, 8))
        shap.summary_plot(self.shap_values, X, feature_names=feature_names, max_display=max_display, show=False)
        dest = save_path or (EXPLANATIONS_DIR / "shap_summary.png")
        dest.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(dest, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved SHAP summary plot to {dest}")

    def plot_shap_feature_importance(
        self,
        feature_names: List[str],
        save_path: Optional[Path] = None,
        max_display: int = 20
    ) -> Dict[str, float]:
        """Plot and return mean absolute SHAP feature importances."""
        if self.shap_values is None:
            raise RuntimeError("SHAP values not computed")

        mean_abs_shap = np.abs(self.shap_values).mean(axis=0)
        sorted_indices = np.argsort(mean_abs_shap)[::-1][:max_display]
        sorted_features = [feature_names[i] for i in sorted_indices]
        sorted_importance = mean_abs_shap[sorted_indices]

        plt.figure(figsize=(10, 8))
        plt.barh(range(len(sorted_features)), sorted_importance)
        plt.yticks(range(len(sorted_features)), sorted_features)
        plt.xlabel('Mean |SHAP value|')
        plt.title(f'Top {max_display} Features by SHAP Importance')
        plt.gca().invert_yaxis()
        plt.tight_layout()

        dest = save_path or (EXPLANATIONS_DIR / "shap_feature_importance.png")
        dest.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(dest, dpi=300, bbox_inches='tight')
        plt.close()
        logger.info(f"Saved SHAP feature importance to {dest}")
        return dict(zip(sorted_features, [float(v) for v in sorted_importance]))

    def get_feature_group_contributions(
        self,
        feature_names: List[str],
        feature_groups: Dict[str, List[int]]
    ) -> Dict[str, float]:
        """Compute relative percentage contribution of feature groups."""
        if self.shap_values is None:
            raise RuntimeError("SHAP values not computed")

        mean_abs = np.abs(self.shap_values).mean(axis=0)
        group_contribs: Dict[str, float] = {}
        for group_name, feature_indices in feature_groups.items():
            if feature_indices:
                group_contribs[group_name] = float(np.sum(mean_abs[feature_indices]))

        total = sum(group_contribs.values())
        if total > 0:
            group_contribs = {k: round((v / total) * 100, 2) for k, v in group_contribs.items()}
        return group_contribs

    def save_shap_values(self, output_path: Optional[Path] = None) -> None:
        """Save SHAP values to disk."""
        if self.shap_values is None:
            raise RuntimeError("SHAP values not computed")
        dest = output_path or (EXPLANATIONS_DIR / "shap_values.npy")
        dest.parent.mkdir(parents=True, exist_ok=True)
        np.save(dest, self.shap_values)
        logger.info(f"Saved SHAP values to {dest}")

"""
Evaluation metrics and visualization for TTF model.
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
from typing import Dict, Optional
import logging

from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error

from .config import PLOTS_DIR, METRICS_DIR

logger = logging.getLogger(__name__)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """
    Compute comprehensive evaluation metrics.

    Args:
        y_true: Ground truth TTF values
        y_pred: Predicted TTF values

    Returns:
        Dictionary of metrics
    """
    metrics = {
        'mae': mean_absolute_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'r2': r2_score(y_true, y_pred),
        'mape': mean_absolute_percentage_error(y_true, y_pred) * 100,
    }

    # Additional metrics
    errors = y_pred - y_true
    metrics['mean_error'] = float(np.mean(errors))
    metrics['median_ae'] = float(np.median(np.abs(errors)))
    metrics['max_ae'] = float(np.max(np.abs(errors)))

    # Within-threshold accuracy
    for threshold in [1, 3, 7]:
        within = np.sum(np.abs(errors) <= threshold) / len(errors)
        metrics[f'within_{threshold}d'] = round(within, 4)

    # Round for readability
    for key in ['mae', 'rmse', 'r2', 'mape', 'mean_error', 'median_ae', 'max_ae']:
        metrics[key] = round(metrics[key], 4)

    return metrics


def plot_predictions_vs_actual(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    save_path: Optional[Path] = None,
    title: str = "TTF Predictions vs Actual"
) -> None:
    """
    Plot predicted vs actual TTF values.

    Args:
        y_true: Ground truth values
        y_pred: Predicted values
        save_path: Where to save plot
        title: Plot title
    """
    plt.figure(figsize=(10, 6))

    plt.scatter(y_true, y_pred, alpha=0.6, edgecolors='k', linewidths=0.5)

    # Perfect prediction line
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    plt.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Perfect prediction')

    plt.xlabel('Actual TTF (days)', fontsize=12)
    plt.ylabel('Predicted TTF (days)', fontsize=12)
    plt.title(title, fontsize=14, fontweight='bold')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()

    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"Saved plot to {save_path}")

    plt.close()


def plot_residuals(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    save_path: Optional[Path] = None
) -> None:
    """
    Plot residual distribution and residuals vs predicted.

    Args:
        y_true: Ground truth values
        y_pred: Predicted values
        save_path: Where to save plot
    """
    residuals = y_pred - y_true

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # Residuals vs predicted
    axes[0].scatter(y_pred, residuals, alpha=0.6, edgecolors='k', linewidths=0.5)
    axes[0].axhline(y=0, color='r', linestyle='--', linewidth=2)
    axes[0].set_xlabel('Predicted TTF (days)', fontsize=12)
    axes[0].set_ylabel('Residuals (days)', fontsize=12)
    axes[0].set_title('Residual Plot', fontsize=13, fontweight='bold')
    axes[0].grid(True, alpha=0.3)

    # Residual histogram
    axes[1].hist(residuals, bins=20, edgecolor='black', alpha=0.7)
    axes[1].axvline(x=0, color='r', linestyle='--', linewidth=2)
    axes[1].set_xlabel('Residuals (days)', fontsize=12)
    axes[1].set_ylabel('Frequency', fontsize=12)
    axes[1].set_title('Residual Distribution', fontsize=13, fontweight='bold')
    axes[1].grid(True, alpha=0.3, axis='y')

    plt.tight_layout()

    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"Saved residual plots to {save_path}")

    plt.close()


def plot_feature_importance(
    importance_df: pd.DataFrame,
    save_path: Optional[Path] = None,
    top_n: int = 15
) -> None:
    """
    Plot feature importance.

    Args:
        importance_df: DataFrame with 'feature' and 'importance' columns
        save_path: Where to save plot
        top_n: Number of top features to show
    """
    # Take top N features
    plot_df = importance_df.head(top_n)

    plt.figure(figsize=(10, 6))
    plt.barh(range(len(plot_df)), plot_df['importance'], color='steelblue', edgecolor='black')
    plt.yticks(range(len(plot_df)), plot_df['feature'])
    plt.xlabel('Importance Score', fontsize=12)
    plt.title(f'Top {top_n} Feature Importances', fontsize=14, fontweight='bold')
    plt.gca().invert_yaxis()
    plt.grid(True, alpha=0.3, axis='x')
    plt.tight_layout()

    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"Saved feature importance plot to {save_path}")

    plt.close()


def evaluate_model(
    model,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    dataset_name: str = "test"
) -> Dict[str, float]:
    """
    Comprehensive model evaluation.

    Args:
        model: Trained model
        X_test: Test features
        y_test: Test targets
        dataset_name: Name for logging

    Returns:
        Dictionary of evaluation metrics
    """
    logger.info(f"\nEvaluating model on {dataset_name} set ({len(X_test)} samples)")

    # Make predictions
    y_pred = model.predict(X_test)

    # Compute metrics
    metrics = compute_metrics(y_test.values, y_pred)

    # Log metrics
    logger.info(f"MAE: {metrics['mae']:.2f} days")
    logger.info(f"RMSE: {metrics['rmse']:.2f} days")
    logger.info(f"R²: {metrics['r2']:.3f}")
    logger.info(f"MAPE: {metrics['mape']:.1f}%")
    logger.info(f"Within 1 day: {metrics['within_1d']*100:.1f}%")
    logger.info(f"Within 3 days: {metrics['within_3d']*100:.1f}%")
    logger.info(f"Within 7 days: {metrics['within_7d']*100:.1f}%")

    # Generate plots
    plot_predictions_vs_actual(
        y_test.values,
        y_pred,
        PLOTS_DIR / f"{dataset_name}_predictions_vs_actual.png",
        title=f"TTF Predictions vs Actual ({dataset_name.title()} Set)"
    )

    plot_residuals(
        y_test.values,
        y_pred,
        PLOTS_DIR / f"{dataset_name}_residuals.png"
    )

    # Feature importance
    if hasattr(model, 'get_feature_importance'):
        importance_df = model.get_feature_importance()
        plot_feature_importance(
            importance_df,
            PLOTS_DIR / "feature_importance.png"
        )

    return metrics

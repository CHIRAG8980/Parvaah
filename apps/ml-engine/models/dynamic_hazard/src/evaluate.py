"""
Evaluation module for Dynamic Hazard model
Comprehensive model evaluation with metrics and visualizations
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple, Optional, Any
import logging

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    precision_recall_curve
)

try:
    import matplotlib
    matplotlib.use('Agg')  # Non-interactive backend
    import matplotlib.pyplot as plt
    import seaborn as sns
    PLOTTING_AVAILABLE = True
except ImportError:
    PLOTTING_AVAILABLE = False

from config import EvaluationConfig, PLOTS_DIR, METRICS_DIR
from utils import save_json, format_metrics


class ModelEvaluator:
    """Evaluate model performance"""

    def __init__(self, config: EvaluationConfig, logger: Optional[logging.Logger] = None):
        """
        Initialize evaluator

        Args:
            config: Evaluation configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    def compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        threshold: float = 0.5
    ) -> Dict[str, float]:
        """
        Compute classification metrics

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            threshold: Classification threshold

        Returns:
            Dictionary of metrics
        """
        y_pred = (y_pred_proba >= threshold).astype(int)

        metrics = {}

        # Basic metrics
        metrics["accuracy"] = accuracy_score(y_true, y_pred)
        metrics["precision"] = precision_score(y_true, y_pred, zero_division=0)
        metrics["recall"] = recall_score(y_true, y_pred, zero_division=0)
        metrics["f1"] = f1_score(y_true, y_pred, zero_division=0)

        # Probability-based metrics
        try:
            metrics["roc_auc"] = roc_auc_score(y_true, y_pred_proba)
        except ValueError:
            metrics["roc_auc"] = 0.0
            self.logger.warning("Cannot compute ROC AUC (only one class present)")

        try:
            metrics["pr_auc"] = average_precision_score(y_true, y_pred_proba)
        except ValueError:
            metrics["pr_auc"] = 0.0
            self.logger.warning("Cannot compute PR AUC (only one class present)")

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            metrics["true_negatives"] = int(tn)
            metrics["false_positives"] = int(fp)
            metrics["false_negatives"] = int(fn)
            metrics["true_positives"] = int(tp)

            # Additional derived metrics
            if tp + fn > 0:
                metrics["sensitivity"] = tp / (tp + fn)
            if tn + fp > 0:
                metrics["specificity"] = tn / (tn + fp)

        metrics["threshold"] = threshold

        return metrics

    def find_optimal_threshold(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        metric: str = "f1"
    ) -> Tuple[float, float]:
        """
        Find optimal classification threshold

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            metric: Metric to optimize

        Returns:
            Tuple of (optimal_threshold, best_metric_value)
        """
        thresholds = np.linspace(0.1, 0.9, 81)
        best_threshold = 0.5
        best_score = 0.0

        for threshold in thresholds:
            y_pred = (y_pred_proba >= threshold).astype(int)

            if metric == "f1":
                score = f1_score(y_true, y_pred, zero_division=0)
            elif metric == "precision":
                score = precision_score(y_true, y_pred, zero_division=0)
            elif metric == "recall":
                score = recall_score(y_true, y_pred, zero_division=0)
            elif metric == "accuracy":
                score = accuracy_score(y_true, y_pred)
            else:
                raise ValueError(f"Unknown metric: {metric}")

            if score > best_score:
                best_score = score
                best_threshold = threshold

        self.logger.info(f"Optimal threshold: {best_threshold:.3f} ({metric}={best_score:.4f})")
        return best_threshold, best_score

    def plot_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        save_path: Path,
        title: str = "Confusion Matrix"
    ) -> None:
        """
        Plot confusion matrix

        Args:
            y_true: True labels
            y_pred: Predicted labels
            save_path: Path to save plot
            title: Plot title
        """
        if not PLOTTING_AVAILABLE:
            self.logger.warning("Matplotlib not available, skipping confusion matrix plot")
            return

        cm = confusion_matrix(y_true, y_pred)

        plt.figure(figsize=(8, 6))
        sns.heatmap(
            cm,
            annot=True,
            fmt='d',
            cmap='Blues',
            xticklabels=['No Landslide', 'Landslide'],
            yticklabels=['No Landslide', 'Landslide']
        )
        plt.title(title)
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        self.logger.info(f"Confusion matrix saved to {save_path}")

    def plot_roc_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        save_path: Path,
        title: str = "ROC Curve"
    ) -> None:
        """
        Plot ROC curve

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            save_path: Path to save plot
            title: Plot title
        """
        if not PLOTTING_AVAILABLE:
            self.logger.warning("Matplotlib not available, skipping ROC curve plot")
            return

        fpr, tpr, thresholds = roc_curve(y_true, y_pred_proba)
        auc = roc_auc_score(y_true, y_pred_proba)

        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(title)
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        self.logger.info(f"ROC curve saved to {save_path}")

    def plot_precision_recall_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        save_path: Path,
        title: str = "Precision-Recall Curve"
    ) -> None:
        """
        Plot Precision-Recall curve

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            save_path: Path to save plot
            title: Plot title
        """
        if not PLOTTING_AVAILABLE:
            self.logger.warning("Matplotlib not available, skipping PR curve plot")
            return

        precision, recall, thresholds = precision_recall_curve(y_true, y_pred_proba)
        ap = average_precision_score(y_true, y_pred_proba)

        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, label=f'PR Curve (AP = {ap:.3f})', linewidth=2)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title(title)
        plt.legend()
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        self.logger.info(f"PR curve saved to {save_path}")

    def plot_training_history(
        self,
        history: Dict[str, list],
        save_path: Path
    ) -> None:
        """
        Plot training history

        Args:
            history: Training history dictionary
            save_path: Path to save plot
        """
        if not PLOTTING_AVAILABLE:
            self.logger.warning("Matplotlib not available, skipping training history plot")
            return

        fig, axes = plt.subplots(2, 2, figsize=(12, 10))

        # Loss
        axes[0, 0].plot(history['loss'], label='Training Loss')
        if 'val_loss' in history:
            axes[0, 0].plot(history['val_loss'], label='Validation Loss')
        axes[0, 0].set_title('Model Loss')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Loss')
        axes[0, 0].legend()
        axes[0, 0].grid(alpha=0.3)

        # Accuracy
        axes[0, 1].plot(history['accuracy'], label='Training Accuracy')
        if 'val_accuracy' in history:
            axes[0, 1].plot(history['val_accuracy'], label='Validation Accuracy')
        axes[0, 1].set_title('Model Accuracy')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Accuracy')
        axes[0, 1].legend()
        axes[0, 1].grid(alpha=0.3)

        # AUC
        if 'auc' in history:
            axes[1, 0].plot(history['auc'], label='Training AUC')
            if 'val_auc' in history:
                axes[1, 0].plot(history['val_auc'], label='Validation AUC')
            axes[1, 0].set_title('Model AUC')
            axes[1, 0].set_xlabel('Epoch')
            axes[1, 0].set_ylabel('AUC')
            axes[1, 0].legend()
            axes[1, 0].grid(alpha=0.3)

        # F1 (derived from precision and recall)
        if 'precision' in history and 'recall' in history:
            precision = np.array(history['precision'])
            recall = np.array(history['recall'])
            f1 = 2 * (precision * recall) / (precision + recall + 1e-10)
            axes[1, 1].plot(f1, label='Training F1')

            if 'val_precision' in history and 'val_recall' in history:
                val_precision = np.array(history['val_precision'])
                val_recall = np.array(history['val_recall'])
                val_f1 = 2 * (val_precision * val_recall) / (val_precision + val_recall + 1e-10)
                axes[1, 1].plot(val_f1, label='Validation F1')

            axes[1, 1].set_title('Model F1 Score')
            axes[1, 1].set_xlabel('Epoch')
            axes[1, 1].set_ylabel('F1 Score')
            axes[1, 1].legend()
            axes[1, 1].grid(alpha=0.3)

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        self.logger.info(f"Training history plot saved to {save_path}")

    def evaluate_model(
        self,
        model,
        X: np.ndarray,
        y: np.ndarray,
        metadata: pd.DataFrame,
        split_name: str = "test",
        save_prefix: str = "dynamic_hazard"
    ) -> Dict[str, Any]:
        """
        Complete model evaluation

        Args:
            model: Trained model with predict method
            X: Feature sequences
            y: True labels
            metadata: Metadata DataFrame
            split_name: Name of split (train/val/test)
            save_prefix: Prefix for saved files

        Returns:
            Dictionary of evaluation results
        """
        self.logger.info(f"\nEvaluating on {split_name} set...")

        # Get predictions
        if hasattr(model, 'predict'):
            y_pred_proba = model.predict(X)
            if len(y_pred_proba.shape) > 1:
                y_pred_proba = y_pred_proba.flatten()
        else:
            raise ValueError("Model must have predict method")

        # Find optimal threshold
        if self.config.tune_threshold:
            threshold, _ = self.find_optimal_threshold(
                y, y_pred_proba, self.config.threshold_metric
            )
        else:
            threshold = 0.5

        # Compute metrics
        metrics = self.compute_metrics(y, y_pred_proba, threshold)

        self.logger.info(f"\n{split_name.upper()} Metrics:")
        self.logger.info(format_metrics(metrics))

        # Generate plots
        y_pred = (y_pred_proba >= threshold).astype(int)

        if self.config.plot_confusion:
            self.plot_confusion_matrix(
                y, y_pred,
                PLOTS_DIR / f"{save_prefix}_{split_name}_confusion_matrix.png",
                f"Confusion Matrix - {split_name.title()}"
            )

        if self.config.plot_roc and len(np.unique(y)) > 1:
            self.plot_roc_curve(
                y, y_pred_proba,
                PLOTS_DIR / f"{save_prefix}_{split_name}_roc_curve.png",
                f"ROC Curve - {split_name.title()}"
            )

        if self.config.plot_pr and len(np.unique(y)) > 1:
            self.plot_precision_recall_curve(
                y, y_pred_proba,
                PLOTS_DIR / f"{save_prefix}_{split_name}_pr_curve.png",
                f"Precision-Recall Curve - {split_name.title()}"
            )

        # Save metrics
        metrics_path = METRICS_DIR / f"{save_prefix}_{split_name}_metrics.json"
        save_json(metrics, metrics_path)

        # Generate classification report
        report = classification_report(y, y_pred, target_names=['No Landslide', 'Landslide'])
        self.logger.info(f"\nClassification Report:\n{report}")

        results = {
            "metrics": metrics,
            "threshold": threshold,
            "n_samples": len(y),
            "n_positive": int(y.sum()),
            "n_negative": int((y == 0).sum())
        }

        return results


if __name__ == "__main__":
    # Example usage
    from config import get_config

    config = get_config()
    evaluator = ModelEvaluator(config.evaluation)

    # Simulate predictions
    np.random.seed(42)
    y_true = np.random.randint(0, 2, 100)
    y_pred_proba = np.random.rand(100)

    metrics = evaluator.compute_metrics(y_true, y_pred_proba)
    print("\nMetrics:")
    print(format_metrics(metrics))

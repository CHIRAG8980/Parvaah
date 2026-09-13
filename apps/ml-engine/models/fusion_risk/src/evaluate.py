"""
Model evaluation for Fusion/Risk model
Comprehensive evaluation metrics, plots, and analysis
"""

import logging
from pathlib import Path
from typing import Dict, Tuple, Optional
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve,
    average_precision_score, confusion_matrix, classification_report
)

from .config import Config, PLOTS_DIR, METRICS_DIR, REPORTS_DIR
from .utils import save_metadata


logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluates model performance"""

    def __init__(self, config: Config):
        """
        Initialize evaluator

        Args:
            config: Configuration object
        """
        self.config = config

    def evaluate(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        threshold: float = 0.5,
        split_name: str = "test"
    ) -> Dict:
        """
        Comprehensive model evaluation

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities (n_samples, 2)
            threshold: Classification threshold
            split_name: Name of data split (train/val/test)

        Returns:
            Dictionary of metrics
        """
        logger.info(f"Evaluating on {split_name} set...")

        # Binary predictions
        y_pred = (y_pred_proba[:, 1] >= threshold).astype(int)

        # Compute metrics
        metrics = {
            "split": split_name,
            "n_samples": len(y_true),
            "n_positive": int(np.sum(y_true == 1)),
            "n_negative": int(np.sum(y_true == 0)),
            "threshold": threshold,
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1": float(f1_score(y_true, y_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(y_true, y_pred_proba[:, 1])),
            "pr_auc": float(average_precision_score(y_true, y_pred_proba[:, 1]))
        }

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics["confusion_matrix"] = {
            "tn": int(cm[0, 0]),
            "fp": int(cm[0, 1]),
            "fn": int(cm[1, 0]),
            "tp": int(cm[1, 1])
        }

        # Additional metrics
        tn, fp, fn, tp = cm.ravel()
        metrics["specificity"] = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        metrics["false_positive_rate"] = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
        metrics["false_negative_rate"] = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

        # Log results
        logger.info(f"{split_name.capitalize()} metrics:")
        logger.info(f"  Samples: {metrics['n_samples']:,}")
        logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
        logger.info(f"  Precision: {metrics['precision']:.4f}")
        logger.info(f"  Recall: {metrics['recall']:.4f}")
        logger.info(f"  F1: {metrics['f1']:.4f}")
        logger.info(f"  ROC-AUC: {metrics['roc_auc']:.4f}")
        logger.info(f"  PR-AUC: {metrics['pr_auc']:.4f}")

        return metrics

    def plot_roc_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        split_name: str = "test",
        save_path: Optional[Path] = None
    ):
        """
        Plot ROC curve

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            split_name: Name of data split
            save_path: Path to save plot
        """
        fpr, tpr, thresholds = roc_curve(y_true, y_pred_proba[:, 1])
        auc = roc_auc_score(y_true, y_pred_proba[:, 1])

        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC curve (AUC = {auc:.3f})', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', label='Random classifier', linewidth=1)
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(f'ROC Curve - {split_name.capitalize()} Set')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()

        if save_path is None:
            save_path = PLOTS_DIR / f"roc_curve_{split_name}.png"

        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Saved ROC curve to {save_path}")

    def plot_precision_recall_curve(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        split_name: str = "test",
        save_path: Optional[Path] = None
    ):
        """
        Plot precision-recall curve

        Args:
            y_true: True labels
            y_pred_proba: Predicted probabilities
            split_name: Name of data split
            save_path: Path to save plot
        """
        precision, recall, thresholds = precision_recall_curve(
            y_true, y_pred_proba[:, 1]
        )
        ap = average_precision_score(y_true, y_pred_proba[:, 1])

        plt.figure(figsize=(8, 6))
        plt.plot(recall, precision, label=f'PR curve (AP = {ap:.3f})', linewidth=2)
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title(f'Precision-Recall Curve - {split_name.capitalize()} Set')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.tight_layout()

        if save_path is None:
            save_path = PLOTS_DIR / f"pr_curve_{split_name}.png"

        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Saved PR curve to {save_path}")

    def plot_confusion_matrix(
        self,
        y_true: np.ndarray,
        y_pred: np.ndarray,
        split_name: str = "test",
        save_path: Optional[Path] = None
    ):
        """
        Plot confusion matrix

        Args:
            y_true: True labels
            y_pred: Predicted labels
            split_name: Name of data split
            save_path: Path to save plot
        """
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
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.title(f'Confusion Matrix - {split_name.capitalize()} Set')
        plt.tight_layout()

        if save_path is None:
            save_path = PLOTS_DIR / f"confusion_matrix_{split_name}.png"

        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Saved confusion matrix to {save_path}")

    def plot_feature_importance(
        self,
        feature_importance: Dict[str, float],
        top_n: int = 20,
        save_path: Optional[Path] = None
    ):
        """
        Plot feature importance

        Args:
            feature_importance: Dictionary of feature names to importance scores
            top_n: Number of top features to plot
            save_path: Path to save plot
        """
        # Sort by importance
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_n]

        names = [f[0] for f in sorted_features]
        scores = [f[1] for f in sorted_features]

        plt.figure(figsize=(10, 8))
        plt.barh(range(len(names)), scores)
        plt.yticks(range(len(names)), names)
        plt.xlabel('Importance Score')
        plt.title(f'Top {top_n} Feature Importance')
        plt.gca().invert_yaxis()
        plt.tight_layout()

        if save_path is None:
            save_path = PLOTS_DIR / "feature_importance.png"

        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

        logger.info(f"Saved feature importance to {save_path}")

    def generate_evaluation_report(
        self,
        metrics: Dict,
        feature_importance: Dict[str, float],
        output_path: Optional[Path] = None
    ):
        """
        Generate comprehensive evaluation report

        Args:
            metrics: Evaluation metrics dictionary
            feature_importance: Feature importance dictionary
            output_path: Path to save report
        """
        if output_path is None:
            output_path = REPORTS_DIR / "evaluation_report.txt"

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            f.write("=" * 80 + "\n")
            f.write("FUSION/RISK MODEL EVALUATION REPORT\n")
            f.write("=" * 80 + "\n\n")

            f.write(f"Split: {metrics['split']}\n")
            f.write(f"Samples: {metrics['n_samples']:,}\n")
            f.write(f"  Positive (Landslides): {metrics['n_positive']:,}\n")
            f.write(f"  Negative: {metrics['n_negative']:,}\n\n")

            f.write("CLASSIFICATION METRICS\n")
            f.write("-" * 80 + "\n")
            f.write(f"Threshold: {metrics['threshold']:.3f}\n")
            f.write(f"Accuracy: {metrics['accuracy']:.4f}\n")
            f.write(f"Precision: {metrics['precision']:.4f}\n")
            f.write(f"Recall (Sensitivity): {metrics['recall']:.4f}\n")
            f.write(f"Specificity: {metrics['specificity']:.4f}\n")
            f.write(f"F1 Score: {metrics['f1']:.4f}\n")
            f.write(f"ROC-AUC: {metrics['roc_auc']:.4f}\n")
            f.write(f"PR-AUC: {metrics['pr_auc']:.4f}\n\n")

            f.write("CONFUSION MATRIX\n")
            f.write("-" * 80 + "\n")
            cm = metrics['confusion_matrix']
            f.write(f"True Negatives: {cm['tn']:,}\n")
            f.write(f"False Positives: {cm['fp']:,}\n")
            f.write(f"False Negatives: {cm['fn']:,}\n")
            f.write(f"True Positives: {cm['tp']:,}\n\n")

            f.write("TOP 10 FEATURES BY IMPORTANCE\n")
            f.write("-" * 80 + "\n")
            sorted_features = sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]

            for i, (name, score) in enumerate(sorted_features, 1):
                f.write(f"{i:2d}. {name:40s} {score:.4f}\n")

            f.write("\n" + "=" * 80 + "\n")

        logger.info(f"Saved evaluation report to {output_path}")

    def save_metrics(self, metrics: Dict, output_path: Optional[Path] = None):
        """
        Save metrics to JSON file

        Args:
            metrics: Metrics dictionary
            output_path: Path to save metrics
        """
        if output_path is None:
            output_path = METRICS_DIR / f"evaluation_metrics_{metrics['split']}.json"

        save_metadata(output_path, metrics)
        logger.info(f"Saved metrics to {output_path}")

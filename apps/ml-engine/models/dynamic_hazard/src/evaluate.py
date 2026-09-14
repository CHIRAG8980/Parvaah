"""
Evaluation module for Dynamic Hazard model with validation-calibrated thresholding
and event-level trigger detection analysis.
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple, Optional, Any, List
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
    from .config import EvaluationConfig, PLOTS_DIR, METRICS_DIR
    from .utils import save_json, format_metrics
except ImportError:
    from config import EvaluationConfig, PLOTS_DIR, METRICS_DIR
    from utils import save_json, format_metrics


class ModelEvaluator:
    """Evaluates dynamic hazard model with strict validation calibration (no test leakage)."""

    def __init__(self, config: EvaluationConfig, logger: Optional[logging.Logger] = None):
        self.config = config
        self.logger = logger or logging.getLogger(__name__)

    def compute_metrics(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """Compute standard classification metrics at a given threshold."""
        y_pred = (y_pred_proba >= threshold).astype(int)
        metrics = {}

        metrics["accuracy"] = float(accuracy_score(y_true, y_pred))
        metrics["precision"] = float(precision_score(y_true, y_pred, zero_division=0))
        metrics["recall"] = float(recall_score(y_true, y_pred, zero_division=0))
        metrics["f1"] = float(f1_score(y_true, y_pred, zero_division=0))

        try:
            metrics["roc_auc"] = float(roc_auc_score(y_true, y_pred_proba))
        except ValueError:
            metrics["roc_auc"] = 0.0

        try:
            metrics["pr_auc"] = float(average_precision_score(y_true, y_pred_proba))
        except ValueError:
            metrics["pr_auc"] = 0.0

        cm = confusion_matrix(y_true, y_pred)
        if cm.shape == (2, 2):
            tn, fp, fn, tp = cm.ravel()
            metrics["true_negatives"] = int(tn)
            metrics["false_positives"] = int(fp)
            metrics["false_negatives"] = int(fn)
            metrics["true_positives"] = int(tp)
            if tp + fn > 0:
                metrics["sensitivity"] = float(tp / (tp + fn))
            if tn + fp > 0:
                metrics["specificity"] = float(tn / (tn + fp))

        metrics["threshold"] = float(threshold)
        return metrics

    def find_optimal_threshold(
        self,
        y_true: np.ndarray,
        y_pred_proba: np.ndarray,
        metric: str = "f1"
    ) -> Tuple[float, float]:
        """Find optimal classification threshold strictly on the validation set."""
        thresholds = np.linspace(0.01, 0.95, 95)
        best_threshold = 0.5
        best_score = -1.0

        for threshold in thresholds:
            y_pred = (y_pred_proba >= threshold).astype(int)

            if metric == "f1":
                score = f1_score(y_true, y_pred, zero_division=0)
            elif metric == "precision":
                score = precision_score(y_true, y_pred, zero_division=0)
            elif metric == "recall":
                score = recall_score(y_true, y_pred, zero_division=0)
            elif metric == "f2":
                p = precision_score(y_true, y_pred, zero_division=0)
                r = recall_score(y_true, y_pred, zero_division=0)
                score = (5 * p * r) / (4 * p + r) if (4 * p + r) > 0 else 0.0
            else:
                score = f1_score(y_true, y_pred, zero_division=0)

            if score > best_score:
                best_score = score
                best_threshold = float(threshold)

        self.logger.info(f"Optimal threshold found on validation set: {best_threshold:.3f} ({metric}={best_score:.4f})")
        return best_threshold, best_score

    def evaluate_event_level_detection(
        self,
        events_df: pd.DataFrame,
        daily_preds_df: pd.DataFrame,
        threshold: float,
        lead_window_days: int = 2
    ) -> Dict[str, Any]:
        """
        Evaluate real-world event detection rate.
        An event is detected if an alert (prob >= threshold) triggers within [-lead_window_days, 0] of the event date.
        """
        if events_df is None or len(events_df) == 0:
            return {"event_detection_rate": 0.0, "detected_events": 0, "total_events": 0}

        events_df["event_date"] = pd.to_datetime(events_df["event_date"])
        daily_preds_df["date"] = pd.to_datetime(daily_preds_df["date"])

        detected_count = 0
        total_events = len(events_df)

        for _, event in events_df.iterrows():
            edate = event["event_date"]
            dist = event["district"] if "district" in event and pd.notnull(event["district"]) else None

            start_w = edate - pd.Timedelta(days=lead_window_days)
            end_w = edate

            subset = daily_preds_df[(daily_preds_df["date"] >= start_w) & (daily_preds_df["date"] <= end_w)]
            if dist is not None and "district" in daily_preds_df.columns:
                subset = subset[subset["district"] == dist]

            if (subset["pred_proba"] >= threshold).any():
                detected_count += 1

        rate = detected_count / total_events if total_events > 0 else 0.0
        return {
            "total_test_events": total_events,
            "detected_events": detected_count,
            "event_detection_rate": float(rate),
            "lead_window_days": lead_window_days
        }

    def evaluate_model(
        self,
        model,
        X: np.ndarray,
        y: np.ndarray,
        metadata: Optional[pd.DataFrame] = None,
        split_name: str = "test",
        save_prefix: str = "dynamic_hazard",
        fixed_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """Complete evaluation on a split using a fixed or calibrated threshold."""
        self.logger.info(f"\nEvaluating on {split_name} set...")

        if hasattr(model, 'predict_proba'):
            y_pred_proba = model.predict_proba(X)
            if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] > 1:
                y_pred_proba = y_pred_proba[:, 1]
            else:
                y_pred_proba = y_pred_proba.flatten()
        elif hasattr(model, 'predict'):
            y_pred_proba = model.predict(X)
            if len(y_pred_proba.shape) > 1 and y_pred_proba.shape[1] > 1:
                y_pred_proba = y_pred_proba[:, 1]
            else:
                y_pred_proba = y_pred_proba.flatten()
        else:
            raise ValueError("Model must have predict or predict_proba method")

        if fixed_threshold is not None:
            threshold = fixed_threshold
            self.logger.info(f"Using pre-calibrated validation threshold: {threshold:.3f}")
        elif self.config.tune_threshold and split_name == "val":
            threshold, _ = self.find_optimal_threshold(y, y_pred_proba, self.config.threshold_metric)
        else:
            threshold = 0.5

        metrics = self.compute_metrics(y, y_pred_proba, threshold)
        self.logger.info(f"\n{split_name.upper()} Metrics (Threshold={threshold:.3f}):")
        self.logger.info(format_metrics(metrics))

        metrics_path = METRICS_DIR / f"{save_prefix}_{split_name}_metrics.json"
        save_json(metrics, metrics_path)

        return {
            "metrics": metrics,
            "threshold": threshold,
            "y_pred_proba": y_pred_proba,
            "n_samples": len(y),
            "n_positive": int(y.sum()),
            "n_negative": int((y == 0).sum())
        }

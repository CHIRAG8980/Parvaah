"""Evaluation and metrics computation for Static Susceptibility Model"""

import json
from pathlib import Path
from typing import Dict, Any
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    roc_auc_score, average_precision_score, accuracy_score,
    precision_score, recall_score, f1_score, confusion_matrix,
    roc_curve, precision_recall_curve
)

try:
    from .config import PLOTS_DIR, METRICS_DIR, REPORTS_DIR
except ImportError:
    from config import PLOTS_DIR, METRICS_DIR, REPORTS_DIR


def evaluate_susceptibility_model(model, X_test, y_test, split_name: str = "test") -> Dict[str, Any]:
    probs = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)

    roc_auc = float(roc_auc_score(y_test, probs))
    pr_auc = float(average_precision_score(y_test, probs))
    acc = float(accuracy_score(y_test, preds))
    prec = float(precision_score(y_test, preds, zero_division=0))
    rec = float(recall_score(y_test, preds, zero_division=0))
    f1 = float(f1_score(y_test, preds, zero_division=0))
    cm = confusion_matrix(y_test, preds).tolist()

    metrics = {
        "split": split_name,
        "sample_count": len(y_test),
        "positive_count": int(np.sum(y_test == 1)),
        "negative_count": int(np.sum(y_test == 0)),
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1_score": f1,
        "confusion_matrix": {
            "tn": cm[0][0], "fp": cm[0][1],
            "fn": cm[1][0], "tp": cm[1][1]
        },
        "feature_importances": model.get_feature_importances()
    }

    metrics_path = METRICS_DIR / f"static_susceptibility_{split_name}_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    fpr, tpr, _ = roc_curve(y_test, probs)
    ax1.plot(fpr, tpr, color="#2563eb", lw=2, label=f"ROC (AUC = {roc_auc:.3f})")
    ax1.plot([0, 1], [0, 1], color="gray", linestyle="--")
    ax1.set_title("ROC Curve - Static Susceptibility")
    ax1.set_xlabel("False Positive Rate")
    ax1.set_ylabel("True Positive Rate")
    ax1.legend(loc="lower right")
    ax1.grid(True, alpha=0.3)

    precision_curve, recall_curve, _ = precision_recall_curve(y_test, probs)
    ax2.plot(recall_curve, precision_curve, color="#16a34a", lw=2, label=f"PR (AUC = {pr_auc:.3f})")
    ax2.set_title("Precision-Recall Curve - Static Susceptibility")
    ax2.set_xlabel("Recall")
    ax2.set_ylabel("Precision")
    ax2.legend(loc="lower left")
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plot_path = PLOTS_DIR / f"static_susceptibility_{split_name}_curves.png"
    plt.savefig(plot_path, dpi=200)
    plt.close()

    feat_imp = metrics["feature_importances"]
    if feat_imp:
        sorted_imp = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)
        names, vals = zip(*sorted_imp)
        plt.figure(figsize=(10, 6))
        plt.barh(names[::-1], vals[::-1], color="#3b82f6")
        plt.title("Static Susceptibility Feature Importances")
        plt.xlabel("Importance")
        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "feature_importance.png", dpi=200)
        plt.close()

    return metrics

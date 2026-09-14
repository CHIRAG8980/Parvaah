"""Evaluation module for Pre-Event Lead-Window Classifier"""

import json
from pathlib import Path
from typing import Dict, Any
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, precision_score,
    recall_score, f1_score, confusion_matrix, classification_report
)

try:
    from .config import PLOTS_DIR, METRICS_DIR, REPORTS_DIR
except ImportError:
    from config import PLOTS_DIR, METRICS_DIR, REPORTS_DIR


def evaluate_lead_window_model(model, X_test, y_test, split_name: str = "test") -> Dict[str, Any]:
    preds = model.predict(X_test)
    probs = model.predict_proba(X_test)

    acc = float(accuracy_score(y_test, preds))
    bal_acc = float(balanced_accuracy_score(y_test, preds))
    macro_f1 = float(f1_score(y_test, preds, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_test, preds, average="weighted", zero_division=0))
    cm = confusion_matrix(y_test, preds).tolist()
    report = classification_report(y_test, preds, output_dict=True, zero_division=0)

    metrics = {
        "split": split_name,
        "sample_count": len(y_test),
        "class_distribution": {int(c): int(np.sum(y_test == c)) for c in np.unique(y_test)},
        "accuracy": acc,
        "balanced_accuracy": bal_acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "confusion_matrix": cm,
        "classification_report": report,
        "feature_importances": model.get_feature_importances()
    }

    metrics_path = METRICS_DIR / f"lead_window_{split_name}_metrics.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    # Plot Confusion Matrix
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    plt.title(f"Lead Window Confusion Matrix ({split_name})")
    plt.colorbar()
    classes = ["Baseline (0)", "Elevated (1)", "Imminent (2)"]
    tick_marks = np.arange(len(classes))
    plt.xticks(tick_marks, classes, rotation=25)
    plt.yticks(tick_marks, classes)

    thresh = np.array(cm).max() / 2.0
    for i in range(len(cm)):
        for j in range(len(cm[i])):
            plt.text(j, i, format(cm[i][j], "d"),
                     horizontalalignment="center",
                     color="white" if cm[i][j] > thresh else "black")

    plt.ylabel("True Label")
    plt.xlabel("Predicted Label")
    plt.tight_layout()
    plt.savefig(PLOTS_DIR / f"lead_window_{split_name}_cm.png", dpi=200)
    plt.close()

    return metrics

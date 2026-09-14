"""Training pipeline for Pre-Event Lead-Window Classifier with Event-Level Chronological Splitting"""

import json
from pathlib import Path
import joblib

from .config import LeadWindowConfig, SAVED_MODELS_DIR
from .data_loader import LeadWindowDataLoader
from .model import LeadWindowClassifier
from .evaluate import evaluate_lead_window_model


def train_lead_window_model(model_type: str = "random_forest", config: LeadWindowConfig = None):
    config = config or LeadWindowConfig()
    loader = LeadWindowDataLoader(config)

    print("Partitioning unique historical landslide events chronologically (Train <=2021, Val 2022, Test 2023-2024)...")
    train_df, val_df, test_df = loader.prepare_dataset()

    train_eids = set(train_df[train_df["event_id"] >= 0]["event_id"].unique())
    val_eids = set(val_df[val_df["event_id"] >= 0]["event_id"].unique())
    test_eids = set(test_df[test_df["event_id"] >= 0]["event_id"].unique())

    print(f"Event Partitioning:")
    print(f"  Train: {len(train_df)} samples across {len(train_eids)} unique events (Years <=2021)")
    print(f"  Val:   {len(val_df)} samples across {len(val_eids)} unique events (Year 2022)")
    print(f"  Test:  {len(test_df)} samples across {len(test_eids)} unique events (Years 2023-2024)")

    # Assert zero event leakage
    assert train_eids.isdisjoint(test_eids), "Event leakage detected between Train and Test!"
    assert val_eids.isdisjoint(test_eids), "Event leakage detected between Val and Test!"

    feature_cols = config.feature_names
    X_train, y_train = train_df[feature_cols].values, train_df["label"].values
    X_val, y_val = val_df[feature_cols].values, val_df["label"].values
    X_test, y_test = test_df[feature_cols].values, test_df["label"].values

    print(f"\nTraining {model_type} lead-window condition classifier...")
    model = LeadWindowClassifier(model_type=model_type, random_state=config.random_seed)
    model.fit(X_train, y_train, feature_names=feature_cols)

    val_metrics = evaluate_lead_window_model(model, X_val, y_val, split_name="val")
    test_metrics = evaluate_lead_window_model(model, X_test, y_test, split_name="test")

    print(f"\n--- Validation Metrics (Chronological Holdout) ---")
    print(f"Accuracy: {val_metrics['accuracy']:.4f}, Balanced Acc: {val_metrics['balanced_accuracy']:.4f}, Macro F1: {val_metrics['macro_f1']:.4f}")

    print(f"\n--- Test Metrics (Chronological Holdout 2023-2024) ---")
    print(f"Accuracy: {test_metrics['accuracy']:.4f}, Balanced Acc: {test_metrics['balanced_accuracy']:.4f}, Macro F1: {test_metrics['macro_f1']:.4f}, Weighted F1: {test_metrics['weighted_f1']:.4f}")

    # Save standard estimator and scaler
    model_save_path = SAVED_MODELS_DIR / "lead_window_model.pkl"
    preprocessor_save_path = SAVED_MODELS_DIR / "preprocessor.pkl"
    meta_save_path = SAVED_MODELS_DIR / "training_metadata.json"
    feat_save_path = SAVED_MODELS_DIR / "feature_names.json"

    joblib.dump(model.model, model_save_path)
    joblib.dump(model.scaler, preprocessor_save_path)

    with open(feat_save_path, "w") as f:
        json.dump(feature_cols, f, indent=2)

    with open(meta_save_path, "w") as f:
        json.dump({
            "model_type": model_type,
            "classification_scope": "Historical Pre-Event Condition Similarity Classification (Not exact minute prediction)",
            "split_strategy": "chronological_event_grouped_split",
            "event_counts": {
                "train_events": len(train_eids),
                "val_events": len(val_eids),
                "test_events": len(test_eids)
            },
            "feature_names": feature_cols,
            "target_classes": config.target_classes,
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "val_metrics": val_metrics,
            "test_metrics": test_metrics,
            "random_seed": config.random_seed
        }, f, indent=2)

    print(f"Saved trained Model 3 artifacts to {SAVED_MODELS_DIR}")
    return model, test_metrics

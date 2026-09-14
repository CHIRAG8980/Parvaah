"""Training pipeline for Static Susceptibility Model with Spatial Block Partitioning"""

import json
from pathlib import Path
import joblib
import pandas as pd

from .config import SusceptibilityConfig, SAVED_MODELS_DIR
from .data_loader import SusceptibilityDataLoader
from .model import SusceptibilityModel
from .evaluate import evaluate_susceptibility_model
from .predict import generate_susceptibility_raster


def train_static_susceptibility(model_type: str = "random_forest", config: SusceptibilityConfig = None):
    config = config or SusceptibilityConfig()
    loader = SusceptibilityDataLoader(config)

    print("Loading data, filtering invalid pixels, and executing spatial block partitioning...")
    train_df, val_df, test_df = loader.prepare_dataset()
    loader.close()

    train_blocks = sorted(train_df["spatial_block_id"].unique().tolist())
    val_blocks = sorted(val_df["spatial_block_id"].unique().tolist())
    test_blocks = sorted(test_df["spatial_block_id"].unique().tolist())

    print(f"Spatial Partitioning (Block size: 0.20°):")
    print(f"  Train: {len(train_df)} samples ({sum(train_df['label']==1)} pos, {sum(train_df['label']==0)} neg) across {len(train_blocks)} blocks: {train_blocks}")
    print(f"  Val:   {len(val_df)} samples ({sum(val_df['label']==1)} pos, {sum(val_df['label']==0)} neg) across {len(val_blocks)} blocks: {val_blocks}")
    print(f"  Test:  {len(test_df)} samples ({sum(test_df['label']==1)} pos, {sum(test_df['label']==0)} neg) across {len(test_blocks)} blocks: {test_blocks}")

    feature_cols = config.feature_names
    X_train, y_train = train_df[feature_cols].values, train_df["label"].values
    X_val, y_val = val_df[feature_cols].values, val_df["label"].values
    X_test, y_test = test_df[feature_cols].values, test_df["label"].values

    print(f"\nTraining {model_type} susceptibility model on {len(feature_cols)} static features...")
    model = SusceptibilityModel(model_type=model_type, random_state=config.random_seed)
    model.fit(X_train, y_train, feature_names=feature_cols)

    # Evaluate on Validation & Test sets
    val_metrics = evaluate_susceptibility_model(model, X_val, y_val, split_name="val")
    test_metrics = evaluate_susceptibility_model(model, X_test, y_test, split_name="test")

    print(f"\n--- Validation Metrics (Spatial Holdout) ---")
    print(f"ROC-AUC: {val_metrics['roc_auc']:.4f}, PR-AUC: {val_metrics['pr_auc']:.4f}, F1: {val_metrics['f1_score']:.4f}")

    print(f"\n--- Test Metrics (Spatial Holdout) ---")
    print(f"ROC-AUC: {test_metrics['roc_auc']:.4f}, PR-AUC: {test_metrics['pr_auc']:.4f}, F1: {test_metrics['f1_score']:.4f}, Precision: {test_metrics['precision']:.4f}, Recall: {test_metrics['recall']:.4f}")

    # Save standard estimator and scaler
    model_save_path = SAVED_MODELS_DIR / "susceptibility_model.pkl"
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
            "split_strategy": "spatial_block_partitioning_0.2deg",
            "spatial_blocks": {
                "train": train_blocks,
                "val": val_blocks,
                "test": test_blocks
            },
            "train_samples": len(train_df),
            "val_samples": len(val_df),
            "test_samples": len(test_df),
            "val_metrics": val_metrics,
            "test_metrics": test_metrics,
            "random_seed": config.random_seed
        }, f, indent=2)

    print(f"Saved trained model artifacts to {SAVED_MODELS_DIR}")
    generate_susceptibility_raster(model, config)
    return model, test_metrics

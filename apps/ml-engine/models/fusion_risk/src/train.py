"""
Training pipeline for Fusion/Risk model
Orchestrates data loading, preprocessing, training, and model saving
"""

import logging
from pathlib import Path
from datetime import datetime
import json
import numpy as np

from .config import Config, get_config, LOGS_DIR, SAVED_MODELS, METRICS_DIR
from .data_loader import DataLoader
from .feature_builder import FeatureBuilder
from .preprocessing import Preprocessor
from .model import FusionRiskModel, compute_confidence
from .utils import setup_logging, save_metadata, get_feature_provenance


logger = logging.getLogger(__name__)


class TrainingPipeline:
    """Complete training pipeline for Fusion/Risk model"""

    def __init__(self, config: Config):
        """
        Initialize training pipeline

        Args:
            config: Configuration object
        """
        self.config = config
        self.data_loader = DataLoader(config)
        self.feature_builder = FeatureBuilder(config)
        self.preprocessor = Preprocessor(scaler_type="robust")
        self.model = FusionRiskModel(config)

        # Storage for pipeline artifacts
        self.feature_arrays = None
        self.feature_metadata = None
        self.feature_names = None
        self.X_train = None
        self.X_val = None
        self.X_test = None
        self.y_train = None
        self.y_val = None
        self.y_test = None
        self.training_history = None

    def run(self) -> dict:
        """
        Run complete training pipeline

        Returns:
            Results dictionary
        """
        logger.info("=" * 80)
        logger.info("FUSION/RISK MODEL TRAINING PIPELINE")
        logger.info("=" * 80)

        start_time = datetime.now()

        try:
            # Step 1: Load data
            logger.info("\n[STEP 1/7] Loading data...")
            self._load_data()

            # Step 2: Build features
            logger.info("\n[STEP 2/7] Building feature matrix...")
            self._build_features()

            # Step 3: Preprocess
            logger.info("\n[STEP 3/7] Preprocessing...")
            self._preprocess()

            # Step 4: Train model
            logger.info("\n[STEP 4/7] Training model...")
            self._train_model()

            # Step 5: Save artifacts
            logger.info("\n[STEP 5/7] Saving model artifacts...")
            self._save_artifacts()

            # Step 6: Compute metrics
            logger.info("\n[STEP 6/7] Computing training metrics...")
            metrics = self._compute_metrics()

            # Step 7: Save metadata
            logger.info("\n[STEP 7/7] Saving metadata...")
            self._save_metadata(metrics)

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            logger.info("=" * 80)
            logger.info(f"Training completed successfully in {duration:.1f} seconds")
            logger.info("=" * 80)

            return {
                "success": True,
                "duration_seconds": duration,
                "metrics": metrics,
                "model_path": str(SAVED_MODELS / "fusion_risk_model.pkl"),
                "preprocessor_path": str(SAVED_MODELS / "preprocessor.pkl")
            }

        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }

    def _load_data(self):
        """Load all required data"""
        # Load feature rasters
        self.feature_arrays, self.feature_metadata = self.data_loader.load_all_features()

        # Validate spatial alignment
        is_aligned = self.data_loader.validate_spatial_alignment(self.feature_arrays)
        if not is_aligned:
            raise ValueError("Feature rasters are not spatially aligned")

        # Load ground truth
        self.landslide_df, self.pixel_coords = self.data_loader.load_ground_truth()

        logger.info(f"Loaded {len(self.feature_arrays)} features")
        logger.info(f"Loaded {len(self.pixel_coords)} landslide locations")

    def _build_features(self):
        """Build feature matrix and labels"""
        # Convert rasters to feature matrix
        X_full, self.feature_names, valid_mask = \
            self.feature_builder.rasters_to_feature_matrix(self.feature_arrays)

        # Get reference shape
        reference_shape = next(iter(self.feature_arrays.values())).shape

        # Create labels
        y_full = self.feature_builder.create_training_labels(
            self.pixel_coords,
            reference_shape
        )

        # Sample training data (handles class imbalance)
        X_sampled, y_sampled, sampled_indices = \
            self.feature_builder.sample_training_data(X_full, y_full, valid_mask)

        # Split into train/val/test using spatial block partitioning
        self.X_train, self.X_val, self.X_test, \
        self.y_train, self.y_val, self.y_test = \
            self.feature_builder.split_train_val_test(
                X_sampled,
                y_sampled,
                sampled_indices=sampled_indices,
                reference_width=reference_shape[1]
            )

        # Compute class weights
        self.class_weights = self.feature_builder.compute_class_weights_from_labels(
            self.y_train
        )

        logger.info(f"Feature matrix built: {len(self.feature_names)} features")
        logger.info(f"Train/val/test: {len(self.X_train)}/{len(self.X_val)}/{len(self.X_test)}")

    def _preprocess(self):
        """Preprocess features"""
        # Fit preprocessor on training data
        self.preprocessor.fit(self.X_train)

        # Transform all splits
        self.X_train = self.preprocessor.transform(self.X_train)
        self.X_val = self.preprocessor.transform(self.X_val)
        self.X_test = self.preprocessor.transform(self.X_test)

        logger.info("Data preprocessing completed")

    def _train_model(self):
        """Train the model"""
        # Compute scale_pos_weight for imbalance handling
        scale_pos_weight = self.class_weights[1] / self.class_weights[0]

        # Build model
        self.model.build_model(
            n_features=len(self.feature_names),
            scale_pos_weight=scale_pos_weight
        )

        # Train
        self.training_history = self.model.train(
            self.X_train,
            self.y_train,
            self.X_val,
            self.y_val,
            feature_names=self.feature_names
        )

        logger.info("Model training completed")

    def _save_artifacts(self):
        """Save model and preprocessor"""
        # Save model
        model_path = SAVED_MODELS / "fusion_risk_model.pkl"
        self.model.save(model_path)

        # Save preprocessor
        preprocessor_path = SAVED_MODELS / "preprocessor.pkl"
        self.preprocessor.save(preprocessor_path)

        # Save feature names
        feature_list_path = SAVED_MODELS / "feature_names.json"
        with open(feature_list_path, 'w') as f:
            json.dump(self.feature_names, f, indent=2)

        logger.info(f"Saved model to {model_path}")
        logger.info(f"Saved preprocessor to {preprocessor_path}")

    def _compute_metrics(self) -> dict:
        """Compute training metrics"""
        from sklearn.metrics import (
            accuracy_score, precision_score, recall_score, f1_score,
            roc_auc_score, average_precision_score, confusion_matrix
        )

        # Predictions on validation set
        y_val_pred_proba = self.model.predict_proba(self.X_val)
        y_val_pred = self.model.predict(self.X_val, threshold=0.5)

        # Compute metrics
        metrics = {
            "accuracy": float(accuracy_score(self.y_val, y_val_pred)),
            "precision": float(precision_score(self.y_val, y_val_pred, zero_division=0)),
            "recall": float(recall_score(self.y_val, y_val_pred, zero_division=0)),
            "f1": float(f1_score(self.y_val, y_val_pred, zero_division=0)),
            "roc_auc": float(roc_auc_score(self.y_val, y_val_pred_proba[:, 1])),
            "pr_auc": float(average_precision_score(self.y_val, y_val_pred_proba[:, 1])),
            "confusion_matrix": confusion_matrix(self.y_val, y_val_pred).tolist()
        }

        # Feature importance
        feature_importance = self.model.get_feature_importance()
        top_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]

        metrics["top_10_features"] = [
            {"name": name, "importance": float(imp)}
            for name, imp in top_features
        ]

        logger.info(f"Validation metrics:")
        logger.info(f"  Accuracy: {metrics['accuracy']:.4f}")
        logger.info(f"  Precision: {metrics['precision']:.4f}")
        logger.info(f"  Recall: {metrics['recall']:.4f}")
        logger.info(f"  F1: {metrics['f1']:.4f}")
        logger.info(f"  ROC-AUC: {metrics['roc_auc']:.4f}")
        logger.info(f"  PR-AUC: {metrics['pr_auc']:.4f}")

        return metrics

    def _save_metadata(self, metrics: dict):
        """Save training metadata"""
        metadata = {
            "model_version": self.config.model_version,
            "experiment_name": self.config.experiment_name,
            "timestamp": datetime.now().isoformat(),
            "config": {
                "model_type": self.config.model.model_type,
                "n_features": len(self.feature_names),
                "train_samples": len(self.X_train),
                "val_samples": len(self.X_val),
                "test_samples": len(self.X_test)
            },
            "features": {
                "names": self.feature_names,
                "provenance": get_feature_provenance()
            },
            "metrics": metrics,
            "training_history": self.training_history
        }

        metadata_path = SAVED_MODELS / "training_metadata.json"
        save_metadata(metadata_path, metadata)

        logger.info(f"Saved metadata to {metadata_path}")


def main():
    """Main entry point"""
    # Setup logging
    logger = setup_logging(LOGS_DIR, "fusion_risk_train")

    # Load config
    config = get_config()

    # Run pipeline
    pipeline = TrainingPipeline(config)
    results = pipeline.run()

    # Save results
    results_path = METRICS_DIR / "training_results.json"
    save_metadata(results_path, results)

    return results


if __name__ == "__main__":
    main()

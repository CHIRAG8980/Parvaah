"""
Training script for Dynamic Hazard LSTM model
Complete training pipeline with baseline comparison
"""

import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
import logging
from typing import Dict, Any, Tuple, Optional

from config import get_config, SAVED_MODELS, LOGS_DIR, METRICS_DIR
from utils import (
    setup_logging,
    set_random_seed,
    save_json,
    save_pickle,
    calculate_class_weights,
    format_metrics
)
from data_loader import DataLoader
from validation import DataValidator
from features import FeatureEngineer
from preprocessing import Preprocessor
from sequence_builder import prepare_sequences_for_training
from model import DynamicHazardLSTM

# Optional baseline models
try:
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    try:
        import xgboost as xgb
        XGBOOST_AVAILABLE = True
    except ImportError:
        XGBOOST_AVAILABLE = False
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    XGBOOST_AVAILABLE = False


class BaselineModels:
    """Train baseline models for comparison"""

    def __init__(self, config, logger):
        self.config = config
        self.logger = logger
        self.models = {}

    def train_logistic_regression(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        class_weights: Dict[int, float]
    ) -> Any:
        """Train logistic regression baseline"""
        if not SKLEARN_AVAILABLE:
            self.logger.warning("scikit-learn not available, skipping logistic regression")
            return None

        self.logger.info("Training Logistic Regression baseline...")
        model = LogisticRegression(
            class_weight=class_weights,
            max_iter=1000,
            random_state=self.config.training.random_seed
        )

        # Flatten sequences for non-sequential model
        X_train_flat = X_train.reshape(X_train.shape[0], -1)
        model.fit(X_train_flat, y_train)

        self.models["logistic_regression"] = model
        self.logger.info("Logistic Regression trained")
        return model

    def train_random_forest(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        class_weights: Dict[int, float]
    ) -> Any:
        """Train random forest baseline"""
        if not SKLEARN_AVAILABLE:
            self.logger.warning("scikit-learn not available, skipping random forest")
            return None

        self.logger.info("Training Random Forest baseline...")
        model = RandomForestClassifier(
            n_estimators=self.config.baseline.rf_n_estimators,
            max_depth=self.config.baseline.rf_max_depth,
            min_samples_split=self.config.baseline.rf_min_samples_split,
            class_weight=class_weights,
            random_state=self.config.training.random_seed,
            n_jobs=-1
        )

        # Flatten sequences
        X_train_flat = X_train.reshape(X_train.shape[0], -1)
        model.fit(X_train_flat, y_train)

        self.models["random_forest"] = model
        self.logger.info("Random Forest trained")
        return model

    def train_xgboost(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Any:
        """Train XGBoost baseline"""
        if not XGBOOST_AVAILABLE:
            self.logger.warning("XGBoost not available, skipping")
            return None

        self.logger.info("Training XGBoost baseline...")

        # Calculate scale_pos_weight for imbalance
        pos_count = y_train.sum()
        neg_count = len(y_train) - pos_count
        scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0

        model = xgb.XGBClassifier(
            n_estimators=self.config.baseline.xgb_n_estimators,
            max_depth=self.config.baseline.xgb_max_depth,
            learning_rate=self.config.baseline.xgb_learning_rate,
            scale_pos_weight=scale_pos_weight,
            random_state=self.config.training.random_seed,
            use_label_encoder=False,
            eval_metric="logloss"
        )

        # Flatten sequences
        X_train_flat = X_train.reshape(X_train.shape[0], -1)
        eval_set = None
        if X_val is not None and y_val is not None:
            X_val_flat = X_val.reshape(X_val.shape[0], -1)
            eval_set = [(X_val_flat, y_val)]

        model.fit(
            X_train_flat,
            y_train,
            eval_set=eval_set,
            verbose=False
        )

        self.models["xgboost"] = model
        self.logger.info("XGBoost trained")
        return model

    def predict(self, model_name: str, X: np.ndarray) -> np.ndarray:
        """Get predictions from baseline model"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not trained")

        model = self.models[model_name]
        X_flat = X.reshape(X.shape[0], -1)

        # Get probabilities for positive class
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_flat)[:, 1]
        else:
            probs = model.predict(X_flat)

        return probs


def train_dynamic_hazard_model(
    config_override: Optional[Dict] = None,
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Main training pipeline for Dynamic Hazard LSTM model

    Args:
        config_override: Optional config overrides
        save_artifacts: Whether to save model artifacts

    Returns:
        Dictionary with training results
    """
    # Setup
    config = get_config()
    if config_override:
        # Apply overrides (simplified - in production use proper merging)
        pass

    logger = setup_logging(LOGS_DIR, config.training.experiment_name)
    set_random_seed(config.training.random_seed)

    logger.info("="*80)
    logger.info("Dynamic Hazard LSTM Model Training")
    logger.info("="*80)
    logger.info(f"Experiment: {config.training.experiment_name}")
    logger.info(f"Model version: {config.training.model_version}")

    results = {
        "experiment_name": config.training.experiment_name,
        "model_version": config.training.model_version,
        "timestamp": datetime.now().isoformat(),
        "config": {
            "sequence_length": config.data.sequence_length,
            "lstm_units": config.model.lstm_units,
            "batch_size": config.model.batch_size,
            "epochs": config.model.epochs,
        }
    }

    try:
        # 1. Load data
        logger.info("\n" + "="*80)
        logger.info("STEP 1: Loading data")
        logger.info("="*80)

        loader = DataLoader(config.data, logger)
        landslides, daily_df = loader.load_all(apply_sampling=True)

        results["data_stats"] = {
            "n_landslide_events": len(landslides),
            "n_daily_records": len(daily_df),
            "date_range": f"{daily_df['date'].min()} to {daily_df['date'].max()}"
        }

        # 2. Validate data
        logger.info("\n" + "="*80)
        logger.info("STEP 2: Validating data")
        logger.info("="*80)

        validator = DataValidator(config.data, logger)
        landslide_report = validator.validate_landslides(landslides)
        validator.print_report(landslide_report, "Landslide Data")

        daily_report = validator.validate_daily_dataset(daily_df)
        validator.print_report(daily_report, "Daily Dataset")

        if not landslide_report.passed or not daily_report.passed:
            raise ValueError("Data validation failed. Check logs for details.")

        # 3. Feature engineering
        logger.info("\n" + "="*80)
        logger.info("STEP 3: Feature engineering")
        logger.info("="*80)

        engineer = FeatureEngineer(config.data, logger)
        featured_df = engineer.engineer_all_features(daily_df)
        feature_cols = engineer.get_feature_names(featured_df)

        logger.info(f"Engineered {len(feature_cols)} features")
        results["n_features"] = len(feature_cols)

        # 4. Preprocessing and splitting
        logger.info("\n" + "="*80)
        logger.info("STEP 4: Preprocessing and temporal split")
        logger.info("="*80)

        preprocessor = Preprocessor(config.data, logger)
        train_df, val_df, test_df = preprocessor.temporal_split(featured_df)

        X_train, y_train, meta_train = preprocessor.prepare_features(
            train_df, feature_cols, is_train=True
        )

        X_val, y_val, meta_val = None, None, None
        if len(val_df) > 0:
            X_val, y_val, meta_val = preprocessor.prepare_features(
                val_df, feature_cols, is_train=False
            )

        X_test, y_test, meta_test = None, None, None
        if len(test_df) > 0:
            X_test, y_test, meta_test = preprocessor.prepare_features(
                test_df, feature_cols, is_train=False
            )

        results["split_dates"] = preprocessor.split_dates

        # 5. Create sequences
        logger.info("\n" + "="*80)
        logger.info("STEP 5: Creating sequences")
        logger.info("="*80)

        # Reconstruct DataFrames for sequence builder
        train_df_processed = train_df.copy()
        train_df_processed[feature_cols] = X_train

        val_df_processed = val_df.copy() if len(val_df) > 0 else pd.DataFrame()
        if len(val_df) > 0:
            val_df_processed[feature_cols] = X_val

        test_df_processed = test_df.copy() if len(test_df) > 0 else pd.DataFrame()
        if len(test_df) > 0:
            test_df_processed[feature_cols] = X_test

        (X_train_seq, y_train_seq, meta_train_seq), \
        (X_val_seq, y_val_seq, meta_val_seq), \
        (X_test_seq, y_test_seq, meta_test_seq) = prepare_sequences_for_training(
            train_df_processed,
            val_df_processed,
            test_df_processed,
            feature_cols,
            config.data,
            logger
        )

        results["sequence_stats"] = {
            "train": len(X_train_seq),
            "val": len(X_val_seq) if X_val_seq is not None and len(X_val_seq) > 0 else 0,
            "test": len(X_test_seq) if X_test_seq is not None and len(X_test_seq) > 0 else 0,
            "sequence_shape": X_train_seq.shape
        }

        # 6. Train baseline models
        logger.info("\n" + "="*80)
        logger.info("STEP 6: Training baseline models")
        logger.info("="*80)

        class_weights = calculate_class_weights(y_train_seq)
        baseline_models = BaselineModels(config, logger)

        baseline_models.train_logistic_regression(X_train_seq, y_train_seq, class_weights)
        baseline_models.train_random_forest(X_train_seq, y_train_seq, class_weights)
        baseline_models.train_xgboost(X_train_seq, y_train_seq, X_val_seq, y_val_seq)

        # 7. Train LSTM model
        logger.info("\n" + "="*80)
        logger.info("STEP 7: Training LSTM model")
        logger.info("="*80)

        input_shape = (X_train_seq.shape[1], X_train_seq.shape[2])
        lstm_model = DynamicHazardLSTM(config.model, input_shape, logger)
        lstm_model.build_model()

        logger.info(f"\nModel Summary:\n{lstm_model.get_model_summary()}")

        # Setup paths for checkpoints
        checkpoint_path = str(SAVED_MODELS / f"{config.training.experiment_name}_best.h5")
        log_dir = str(LOGS_DIR / f"{config.training.experiment_name}_tensorboard")

        # Train
        history = lstm_model.train(
            X_train_seq,
            y_train_seq,
            X_val_seq if len(X_val_seq) > 0 else None,
            y_val_seq if len(y_val_seq) > 0 else None,
            class_weights=class_weights,
            checkpoint_path=checkpoint_path,
            log_dir=log_dir
        )

        results["training_history"] = history

        # 8. Save artifacts
        if save_artifacts:
            logger.info("\n" + "="*80)
            logger.info("STEP 8: Saving artifacts")
            logger.info("="*80)

            # Save LSTM model
            model_path = SAVED_MODELS / f"{config.training.experiment_name}_final.h5"
            lstm_model.save_model(str(model_path))

            # Save preprocessing artifacts
            preprocessor.save_artifacts(SAVED_MODELS)

            # Save feature names
            save_pickle(feature_cols, SAVED_MODELS / "feature_names.pkl")

            # Save baseline models
            if baseline_models.models:
                save_pickle(baseline_models.models, SAVED_MODELS / "baseline_models.pkl")

            # Save config
            config_dict = {
                "experiment_name": config.training.experiment_name,
                "model_version": config.training.model_version,
                "sequence_length": config.data.sequence_length,
                "n_features": len(feature_cols),
                "lstm_units": config.model.lstm_units,
                "training_date": datetime.now().isoformat()
            }
            save_json(config_dict, SAVED_MODELS / "model_config.json")

            logger.info(f"Artifacts saved to {SAVED_MODELS}")

        # 9. Save training results
        results["status"] = "completed"
        save_json(results, METRICS_DIR / f"{config.training.experiment_name}_training_results.json")

        logger.info("\n" + "="*80)
        logger.info("Training completed successfully")
        logger.info("="*80)

        return results

    except Exception as e:
        logger.error(f"\nTraining failed: {str(e)}", exc_info=True)
        results["status"] = "failed"
        results["error"] = str(e)
        save_json(results, METRICS_DIR / f"{config.training.experiment_name}_training_results.json")
        raise


if __name__ == "__main__":
    results = train_dynamic_hazard_model()
    print("\nTraining Results:")
    print(f"Status: {results['status']}")
    print(f"Sequences: {results.get('sequence_stats', {})}")

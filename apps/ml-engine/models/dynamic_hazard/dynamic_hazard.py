#!/usr/bin/env python3
"""
Main CLI for Dynamic Hazard LSTM Model
Command-line interface for training, evaluation, and prediction
"""

import sys
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from config import get_config, LOGS_DIR, SAVED_MODELS
from utils import setup_logging, set_random_seed


def train_model(args):
    """Train the Dynamic Hazard model"""
    from train import train_dynamic_hazard_model

    print("\n" + "="*80)
    print("Training Dynamic Hazard LSTM Model")
    print("="*80 + "\n")

    results = train_dynamic_hazard_model(save_artifacts=True)

    print("\n" + "="*80)
    print("Training Summary")
    print("="*80)
    print(f"Status: {results['status']}")
    print(f"Experiment: {results['experiment_name']}")
    if 'sequence_stats' in results:
        print(f"Training sequences: {results['sequence_stats']['train']}")
        print(f"Validation sequences: {results['sequence_stats']['val']}")
        print(f"Test sequences: {results['sequence_stats']['test']}")
    print("="*80 + "\n")

    return 0 if results['status'] == 'completed' else 1


def evaluate_model(args):
    """Evaluate trained model"""
    from evaluate import ModelEvaluator
    from model import DynamicHazardLSTM
    from data_loader import DataLoader
    from features import FeatureEngineer
    from preprocessing import Preprocessor
    from sequence_builder import prepare_sequences_for_training
    from utils import load_pickle

    config = get_config()
    logger = setup_logging(LOGS_DIR, "evaluate")

    print("\n" + "="*80)
    print("Evaluating Dynamic Hazard Model")
    print("="*80 + "\n")

    try:
        # Load model
        model_files = list(SAVED_MODELS.glob("*_final.h5"))
        if not model_files:
            print("Error: No trained model found. Train the model first.")
            return 1

        import tensorflow as tf
        model_path = model_files[0]
        print(f"Loading model from {model_path}")
        keras_model = tf.keras.models.load_model(str(model_path))

        # Wrap in our model class
        lstm_model = DynamicHazardLSTM.__new__(DynamicHazardLSTM)
        lstm_model.model = keras_model
        lstm_model.config = config.model
        lstm_model.logger = logger

        # Load data
        loader = DataLoader(config.data, logger)
        _, daily_df = loader.load_all(apply_sampling=True)

        # Engineer features
        engineer = FeatureEngineer(config.data, logger)
        featured_df = engineer.engineer_all_features(daily_df)
        feature_cols = engineer.get_feature_names(featured_df)

        # Preprocess
        preprocessor = Preprocessor(config.data, logger)
        preprocessor.load_artifacts(SAVED_MODELS)

        train_df, val_df, test_df = preprocessor.temporal_split(featured_df)

        X_test, y_test, meta_test = preprocessor.prepare_features(
            test_df, feature_cols, is_train=False
        )

        # Create sequences
        train_df_processed = train_df.copy()
        val_df_processed = val_df.copy() if len(val_df) > 0 else pd.DataFrame()
        test_df_processed = test_df.copy()
        test_df_processed[feature_cols] = X_test

        _, _, (X_test_seq, y_test_seq, meta_test_seq) = prepare_sequences_for_training(
            train_df_processed, val_df_processed, test_df_processed,
            feature_cols, config.data, logger
        )

        # Evaluate
        evaluator = ModelEvaluator(config.evaluation, logger)
        results = evaluator.evaluate_model(
            lstm_model, X_test_seq, y_test_seq, meta_test_seq,
            split_name="test", save_prefix="dynamic_hazard"
        )

        print("\n" + "="*80)
        print("Evaluation Complete")
        print("="*80)
        print(f"Test samples: {results['n_samples']}")
        print(f"Accuracy: {results['metrics']['accuracy']:.4f}")
        print(f"F1 Score: {results['metrics']['f1']:.4f}")
        print(f"ROC AUC: {results['metrics']['roc_auc']:.4f}")
        print("="*80 + "\n")

        return 0

    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        return 1


def make_predictions(args):
    """Generate predictions"""
    from predict import HazardPredictor

    config = get_config()
    logger = setup_logging(LOGS_DIR, "predict")

    print("\n" + "="*80)
    print("Generating Predictions")
    print("="*80 + "\n")

    try:
        predictor = HazardPredictor(config.prediction, logger)
        predictor.load_model_artifacts(SAVED_MODELS)

        print("Model loaded successfully")
        print("Note: Prediction on new data requires prepared sequences")
        print("See predict.py for full prediction pipeline")

        return 0

    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        return 1


def run_tests(args):
    """Run test suite"""
    from tests.test_pipeline import run_all_tests

    print("\n" + "="*80)
    print("Running Test Suite")
    print("="*80 + "\n")

    success = run_all_tests()
    return 0 if success else 1


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Dynamic Hazard LSTM Model - Landslide Prediction",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train model
  python run.py train

  # Evaluate model
  python run.py evaluate

  # Run tests
  python run.py test

For more information, see README.md
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Train command
    train_parser = subparsers.add_parser("train", help="Train the model")

    # Evaluate command
    eval_parser = subparsers.add_parser("evaluate", help="Evaluate trained model")

    # Predict command
    pred_parser = subparsers.add_parser("predict", help="Generate predictions")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run test suite")

    args = parser.parse_args()

    if args.command == "train":
        return train_model(args)
    elif args.command == "evaluate":
        return evaluate_model(args)
    elif args.command == "predict":
        return make_predictions(args)
    elif args.command == "test":
        return run_tests(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())

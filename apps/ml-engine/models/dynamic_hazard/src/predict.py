"""
Prediction module for Dynamic Hazard model
Generate predictions and risk maps for operational deployment
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime

from config import (
    PredictionConfig,
    PREDICTIONS_DIR,
    MAPS_DIR,
    REPORTS_DIR,
    SAVED_MODELS
)
from utils import save_json, load_pickle


class HazardPredictor:
    """Generate dynamic hazard predictions"""

    def __init__(
        self,
        config: PredictionConfig,
        logger: Optional[logging.Logger] = None
    ):
        """
        Initialize predictor

        Args:
            config: Prediction configuration
            logger: Optional logger instance
        """
        self.config = config
        self.logger = logger or logging.getLogger(__name__)
        self.model = None
        self.preprocessor = None
        self.feature_names = None

    def load_model_artifacts(self, model_dir: Path) -> None:
        """
        Load trained model and preprocessing artifacts

        Args:
            model_dir: Directory containing model artifacts
        """
        self.logger.info(f"Loading model artifacts from {model_dir}")

        # Load LSTM model
        try:
            import tensorflow as tf
            model_path = model_dir / "dynamic_hazard_*_final.h5"
            model_files = list(model_dir.glob("*_final.h5"))
            if model_files:
                self.model = tf.keras.models.load_model(str(model_files[0]))
                self.logger.info(f"Loaded model from {model_files[0]}")
            else:
                raise FileNotFoundError("No model file found")
        except Exception as e:
            self.logger.error(f"Failed to load model: {e}")
            raise

        # Load preprocessing artifacts
        scaler_path = model_dir / "scaler.pkl"
        if scaler_path.exists():
            from preprocessing import Preprocessor
            self.preprocessor = Preprocessor.__new__(Preprocessor)
            self.preprocessor.scaler = load_pickle(scaler_path)
            self.logger.info("Loaded scaler")

        # Load feature names
        feature_names_path = model_dir / "feature_names.pkl"
        if feature_names_path.exists():
            self.feature_names = load_pickle(feature_names_path)
            self.logger.info(f"Loaded {len(self.feature_names)} feature names")

    def predict_probabilities(
        self,
        X: np.ndarray
    ) -> np.ndarray:
        """
        Generate probability predictions

        Args:
            X: Input sequences

        Returns:
            Predicted probabilities
        """
        if self.model is None:
            raise ValueError("Model not loaded. Call load_model_artifacts first.")

        predictions = self.model.predict(X, verbose=0)
        return predictions.flatten()

    def predict_risk_levels(
        self,
        probabilities: np.ndarray
    ) -> np.ndarray:
        """
        Convert probabilities to risk levels

        Args:
            probabilities: Predicted probabilities

        Returns:
            Risk level categories
        """
        risk_levels = np.zeros(len(probabilities), dtype=int)

        # Map probabilities to risk levels
        for i, prob in enumerate(probabilities):
            if prob >= self.config.risk_thresholds["critical"]:
                risk_levels[i] = 4  # Critical
            elif prob >= self.config.risk_thresholds["high"]:
                risk_levels[i] = 3  # High
            elif prob >= self.config.risk_thresholds["medium"]:
                risk_levels[i] = 2  # Medium
            elif prob >= self.config.risk_thresholds["low"]:
                risk_levels[i] = 1  # Low
            else:
                risk_levels[i] = 0  # Minimal

        return risk_levels

    def get_risk_label(self, level: int) -> str:
        """Get text label for risk level"""
        labels = {
            0: "Minimal",
            1: "Low",
            2: "Medium",
            3: "High",
            4: "Critical"
        }
        return labels.get(level, "Unknown")

    def create_predictions_dataframe(
        self,
        probabilities: np.ndarray,
        metadata: pd.DataFrame
    ) -> pd.DataFrame:
        """
        Create predictions DataFrame with metadata

        Args:
            probabilities: Predicted probabilities
            metadata: Metadata for each prediction

        Returns:
            DataFrame with predictions and metadata
        """
        predictions_df = metadata.copy()
        predictions_df["probability"] = probabilities

        # Add risk levels
        risk_levels = self.predict_risk_levels(probabilities)
        predictions_df["risk_level"] = risk_levels
        predictions_df["risk_label"] = predictions_df["risk_level"].apply(self.get_risk_label)

        # Add timestamp
        predictions_df["prediction_time"] = datetime.now().isoformat()

        return predictions_df

    def save_predictions(
        self,
        predictions_df: pd.DataFrame,
        filename: str
    ) -> Path:
        """
        Save predictions to CSV

        Args:
            predictions_df: Predictions DataFrame
            filename: Output filename

        Returns:
            Path to saved file
        """
        filepath = PREDICTIONS_DIR / filename
        predictions_df.to_csv(filepath, index=False)
        self.logger.info(f"Predictions saved to {filepath}")
        return filepath

    def generate_summary_statistics(
        self,
        predictions_df: pd.DataFrame
    ) -> Dict:
        """
        Generate summary statistics for predictions

        Args:
            predictions_df: Predictions DataFrame

        Returns:
            Dictionary of statistics
        """
        stats = {
            "total_predictions": len(predictions_df),
            "date_range": f"{predictions_df['date'].min()} to {predictions_df['date'].max()}",
            "risk_distribution": predictions_df["risk_label"].value_counts().to_dict(),
            "mean_probability": float(predictions_df["probability"].mean()),
            "max_probability": float(predictions_df["probability"].max()),
            "districts": predictions_df["district"].unique().tolist(),
            "high_risk_count": int((predictions_df["risk_level"] >= 3).sum()),
            "critical_risk_count": int((predictions_df["risk_level"] == 4).sum())
        }

        return stats

    def create_prediction_report(
        self,
        predictions_df: pd.DataFrame,
        stats: Dict,
        report_name: str
    ) -> Path:
        """
        Create human-readable prediction report

        Args:
            predictions_df: Predictions DataFrame
            stats: Summary statistics
            report_name: Report filename

        Returns:
            Path to report file
        """
        report_path = REPORTS_DIR / report_name

        with open(report_path, "w") as f:
            f.write("="*80 + "\n")
            f.write("DYNAMIC LANDSLIDE HAZARD PREDICTION REPORT\n")
            f.write("="*80 + "\n\n")

            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Model: Dynamic Hazard LSTM\n\n")

            f.write("SUMMARY\n")
            f.write("-"*80 + "\n")
            f.write(f"Total Predictions: {stats['total_predictions']}\n")
            f.write(f"Date Range: {stats['date_range']}\n")
            f.write(f"Districts: {', '.join(stats['districts'])}\n\n")

            f.write("RISK STATISTICS\n")
            f.write("-"*80 + "\n")
            f.write(f"Mean Probability: {stats['mean_probability']:.4f}\n")
            f.write(f"Max Probability: {stats['max_probability']:.4f}\n")
            f.write(f"High Risk Days: {stats['high_risk_count']}\n")
            f.write(f"Critical Risk Days: {stats['critical_risk_count']}\n\n")

            f.write("RISK LEVEL DISTRIBUTION\n")
            f.write("-"*80 + "\n")
            for level, count in sorted(stats['risk_distribution'].items()):
                pct = 100 * count / stats['total_predictions']
                f.write(f"{level}: {count} ({pct:.1f}%)\n")
            f.write("\n")

            # High risk days
            high_risk = predictions_df[predictions_df["risk_level"] >= 3].sort_values(
                "probability", ascending=False
            )

            if len(high_risk) > 0:
                f.write("HIGH RISK DAYS (Top 10)\n")
                f.write("-"*80 + "\n")
                for i, row in high_risk.head(10).iterrows():
                    f.write(
                        f"{row['date']} | {row['district']} | "
                        f"{row['risk_label']} | Prob: {row['probability']:.4f}\n"
                    )
                f.write("\n")

            f.write("="*80 + "\n")
            f.write("END OF REPORT\n")
            f.write("="*80 + "\n")

        self.logger.info(f"Report saved to {report_path}")
        return report_path

    def predict_and_save(
        self,
        X: np.ndarray,
        metadata: pd.DataFrame,
        prefix: str = "predictions"
    ) -> Tuple[pd.DataFrame, Dict, Path]:
        """
        Generate predictions and save results

        Args:
            X: Input sequences
            metadata: Metadata for predictions
            prefix: Prefix for output files

        Returns:
            Tuple of (predictions_df, statistics, report_path)
        """
        self.logger.info("Generating predictions...")

        # Generate predictions
        probabilities = self.predict_probabilities(X)

        # Create DataFrame
        predictions_df = self.create_predictions_dataframe(probabilities, metadata)

        # Save predictions
        if self.config.save_predictions:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pred_file = f"{prefix}_{timestamp}.csv"
            self.save_predictions(predictions_df, pred_file)

        # Generate statistics
        stats = self.generate_summary_statistics(predictions_df)

        # Save statistics
        stats_file = PREDICTIONS_DIR / f"{prefix}_stats_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        save_json(stats, stats_file)

        # Create report
        report_file = f"{prefix}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        report_path = self.create_prediction_report(predictions_df, stats, report_file)

        self.logger.info("Prediction pipeline complete")
        return predictions_df, stats, report_path


if __name__ == "__main__":
    from config import get_config
    from utils import setup_logging

    config = get_config()
    logger = setup_logging(config.training.experiment_name)

    predictor = HazardPredictor(config.prediction, logger)

    # Example: Load model and generate predictions
    try:
        predictor.load_model_artifacts(SAVED_MODELS)
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        logger.info("Train the model first using train.py")

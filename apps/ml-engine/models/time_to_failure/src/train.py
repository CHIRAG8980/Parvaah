"""
Main training pipeline for TTF model.
Runs complete feasibility assessment and trains production TTFModel if defensible.
"""
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
import logging
import pandas as pd
import numpy as np

from .config import (
    MODELS_DIR, LOGS_DIR, REPORTS_DIR,
    DIAGNOSTICS_DIR, METRICS_DIR
)
from .data_loader import load_all_data
from .target_definition import TimeToFailureTarget
from .validation import TTFValidation, check_model_defensibility
from .preprocessing import create_chronological_split, prepare_features_and_targets
from .feature_builder import FeatureBuilder
from .baseline import evaluate_baselines
from .model import train_ttf_model
from .utils import setup_logging, save_json, save_report, check_directory_structure, create_feasibility_report

logger = logging.getLogger(__name__)


class TTFTrainer:
    """Manages complete TTF training pipeline with defensibility checks."""

    def __init__(self):
        self.data_loaded = False
        self.validated = False
        self.can_train = False
        self.exact_df = pd.DataFrame()
        self.year_df = pd.DataFrame()
        self.temporal_assessment: Dict[str, Any] = {}
        self.validation_report: Dict[str, Any] = {}
        self.defensibility_check: Dict[str, Any] = {}

    def load_data(self) -> None:
        """Load and assess all available data."""
        self.exact_df, self.year_df, self.temporal_assessment = load_all_data()
        self.data_loaded = True
        save_json(self.temporal_assessment, DIAGNOSTICS_DIR / "temporal_assessment.json")

    def validate_data(self) -> None:
        """Run complete validation suite."""
        if not self.data_loaded:
            raise RuntimeError("Must load data before validation")
        validator = TTFValidation()
        self.validation_report = validator.run_all_validations(self.exact_df, date_col='event_date')
        save_json(self.validation_report, DIAGNOSTICS_DIR / "validation_report.json")
        self.validated = True

    def check_defensibility(self) -> None:
        """Determine if model training is defensible."""
        if not self.validated:
            raise RuntimeError("Must validate data before defensibility check")
        self.defensibility_check = check_model_defensibility(self.validation_report)
        self.can_train = self.defensibility_check['can_train']
        save_json(self.defensibility_check, DIAGNOSTICS_DIR / "defensibility_check.json")

    def build_features(self) -> None:
        """Build real spatial, rainfall, and terrain features."""
        if self.exact_df.empty:
            return
        builder = FeatureBuilder()
        self.exact_df = builder.build_all_features(
            self.exact_df,
            use_spatial=True,
            use_rainfall=True,
            use_terrain=True
        )

    def train_and_evaluate_model(self) -> Dict[str, Any]:
        """Train baseline and production TTFModel with chronological split."""
        reference_date = self.exact_df['event_date'].min()
        target = TimeToFailureTarget(reference_date=reference_date)
        self.exact_df['ttf_days'] = target.compute_ttf(self.exact_df['event_date'])

        train_df, test_df = create_chronological_split(self.exact_df, test_fraction=0.3)
        X_train, y_train = prepare_features_and_targets(train_df)
        X_test, y_test = prepare_features_and_targets(test_df)

        baseline_results = evaluate_baselines(X_train, y_train, X_test, y_test)
        save_json(baseline_results, METRICS_DIR / "baseline_results.json")

        model_save_path = MODELS_DIR / "ttf_model.joblib"
        model, metrics = train_ttf_model(
            X_train, y_train, X_test, y_test,
            model_type="random_forest",
            save_path=model_save_path
        )

        test_preds, test_uncertainty = model.predict(X_test, return_uncertainty=True)
        test_mae = float(np.mean(np.abs(y_test.values - test_preds)))
        test_rmse = float(np.sqrt(np.mean((y_test.values - test_preds) ** 2)))

        model_metrics = {
            **metrics,
            "test_mae": round(test_mae, 4),
            "test_rmse": round(test_rmse, 4),
            "mean_uncertainty": round(float(np.mean(test_uncertainty)), 4),
            "model_path": str(model_save_path),
            "features": model.feature_names
        }
        save_json(model_metrics, METRICS_DIR / "ttf_model_metrics.json")
        logger.info(f"TTF Model trained: Test MAE={test_mae:.2f}, RMSE={test_rmse:.2f}")
        return model_metrics

    def generate_feasibility_report(self) -> None:
        """Generate comprehensive feasibility report."""
        report = create_feasibility_report(
            self.validation_report,
            self.defensibility_check,
            self.temporal_assessment
        )
        report_path = REPORTS_DIR / "ttf_feasibility_report.md"
        save_report(report, report_path)

    def run_complete_pipeline(self) -> Dict[str, Any]:
        """Execute complete training pipeline."""
        check_directory_structure(Path(__file__).parent.parent)
        setup_logging(LOGS_DIR, "ttf_training")
        logger.info(f"Started pipeline at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        try:
            self.load_data()
            self.validate_data()
            self.check_defensibility()

            metrics = {}
            if self.can_train:
                self.build_features()
                metrics = self.train_and_evaluate_model()

            self.generate_feasibility_report()

            return {
                "success": True,
                "can_train": self.can_train,
                "validation_passed": self.validation_report.get('overall_passed', False),
                "n_events": self.temporal_assessment.get('n_events', 0),
                "metrics": metrics
            }
        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            return {"success": False, "error": str(e)}


def main() -> Dict[str, Any]:
    """Main entry point."""
    trainer = TTFTrainer()
    result = trainer.run_complete_pipeline()
    if result['success']:
        print(f"Pipeline finished: can_train={result['can_train']}, events={result['n_events']}")
    else:
        print(f"Pipeline failed: {result.get('error')}")
    return result

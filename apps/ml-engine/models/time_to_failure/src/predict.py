"""
Prediction interface for trained TTF model.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Optional
import logging

from .model import TTFModel
from .config import MODELS_DIR, PREDICTIONS_DIR

logger = logging.getLogger(__name__)


class TTFPredictor:
    """Interface for making TTF predictions with trained model."""

    def __init__(self, model_path: Path):
        """
        Args:
            model_path: Path to saved model
        """
        self.model = TTFModel.load(model_path)
        logger.info(f"Loaded model from {model_path}")

    def predict(
        self,
        features: pd.DataFrame,
        return_confidence: bool = True
    ) -> pd.DataFrame:
        """
        Make TTF predictions with uncertainty estimates.

        Args:
            features: Input features matching training schema
            return_confidence: Whether to include confidence intervals

        Returns:
            DataFrame with predictions and uncertainty
        """
        # Get predictions
        if return_confidence:
            predictions, uncertainty = self.model.predict(features, return_uncertainty=True)

            result = pd.DataFrame({
                'predicted_ttf_days': predictions,
                'uncertainty_days': uncertainty,
                'lower_bound_1sigma': predictions - uncertainty,
                'upper_bound_1sigma': predictions + uncertainty,
                'lower_bound_2sigma': predictions - 2 * uncertainty,
                'upper_bound_2sigma': predictions + 2 * uncertainty,
            })
        else:
            predictions = self.model.predict(features, return_uncertainty=False)
            result = pd.DataFrame({'predicted_ttf_days': predictions})

        # Ensure non-negative bounds
        if return_confidence:
            result['lower_bound_1sigma'] = result['lower_bound_1sigma'].clip(lower=0)
            result['lower_bound_2sigma'] = result['lower_bound_2sigma'].clip(lower=0)

        return result

    def predict_for_locations(
        self,
        locations: pd.DataFrame,
        feature_builder,
        save_path: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Make predictions for specific locations with feature engineering.

        Args:
            locations: DataFrame with latitude, longitude
            feature_builder: FeatureBuilder instance
            save_path: Where to save predictions (optional)

        Returns:
            DataFrame with locations and predictions
        """
        # Build features
        features_df = feature_builder.build_all_features(locations)

        # Make predictions
        predictions_df = self.predict(features_df, return_confidence=True)

        # Combine with locations
        result = pd.concat([
            locations.reset_index(drop=True),
            predictions_df.reset_index(drop=True)
        ], axis=1)

        if save_path:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            result.to_csv(save_path, index=False)
            logger.info(f"Saved predictions to {save_path}")

        return result


def load_predictor(model_name: str = "ttf_model.pkl") -> TTFPredictor:
    """
    Load predictor from saved model.

    Args:
        model_name: Name of model file in MODELS_DIR

    Returns:
        TTFPredictor instance
    """
    model_path = MODELS_DIR / model_name

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    return TTFPredictor(model_path)

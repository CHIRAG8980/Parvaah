"""
Baseline models for Time-to-Failure prediction.
Simple models to establish performance floor.
"""
import pandas as pd
import numpy as np
from typing import Dict, Tuple
import logging
logger = logging.getLogger(__name__)


class BaselineModel:
    """Base class for baseline TTF models."""

    def __init__(self, name: str):
        self.name = name
        self.fitted = False

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Fit baseline model."""
        raise NotImplementedError

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make predictions."""
        raise NotImplementedError

class ConstantBaseline(BaselineModel):
    """Predict constant TTF (mean or median of training data)."""

    def __init__(self, statistic: str = 'mean'):
        """
        Args:
            statistic: 'mean' or 'median'
        """
        super().__init__(f"constant_{statistic}")
        self.statistic = statistic
        self.value = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Fit by computing statistic of training targets."""
        if self.statistic == 'mean':
            self.value = y.mean()
        elif self.statistic == 'median':
            self.value = y.median()
        else:
            raise ValueError(f"Unknown statistic: {self.statistic}")

        self.fitted = True
        logger.info(f"ConstantBaseline fitted: {self.statistic}={self.value:.2f} days")

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Return constant prediction for all samples."""
        if not self.fitted:
            raise RuntimeError("Model not fitted")
        return np.full(len(X), self.value)


class LinearTrendBaseline(BaselineModel):
    """Simple linear model using one feature."""

    def __init__(self, feature_name: str = 'antecedent_rainfall'):
        """
        Args:
            feature_name: Name of feature to use for linear fit
        """
        super().__init__(f"linear_{feature_name}")
        self.feature_name = feature_name
        self.slope = None
        self.intercept = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Fit linear model with least squares."""
        if self.feature_name not in X.columns:
            raise ValueError(f"Feature '{self.feature_name}' not found in data")

        x = X[self.feature_name].values
        y_vals = y.values

        # Remove NaN values
        mask = ~(np.isnan(x) | np.isnan(y_vals))
        x = x[mask]
        y_vals = y_vals[mask]

        if len(x) < 2:
            logger.warning("Insufficient valid data for linear fit, using mean")
            self.slope = 0
            self.intercept = y_vals.mean()
        else:
            # Simple least squares
            self.slope = np.cov(x, y_vals)[0, 1] / np.var(x)
            self.intercept = y_vals.mean() - self.slope * x.mean()

        self.fitted = True
        logger.info(
            f"LinearTrendBaseline fitted: "
            f"y = {self.slope:.4f} * {self.feature_name} + {self.intercept:.2f}"
        )

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Make linear predictions."""
        if not self.fitted:
            raise RuntimeError("Model not fitted")

        x = X[self.feature_name].values
        return self.slope * x + self.intercept


class HistoricalAverageBaseline(BaselineModel):
    """Predict based on historical average for each location/zone."""

    def __init__(self, groupby_col: str = 'zone'):
        """
        Args:
            groupby_col: Column to group by for computing averages
        """
        super().__init__(f"historical_avg_{groupby_col}")
        self.groupby_col = groupby_col
        self.group_means = {}
        self.global_mean = None

    def fit(self, X: pd.DataFrame, y: pd.Series) -> None:
        """Compute mean TTF per group."""
        if self.groupby_col not in X.columns:
            raise ValueError(f"Column '{self.groupby_col}' not found")

        df = X.copy()
        df['target'] = y

        self.group_means = df.groupby(self.groupby_col)['target'].mean().to_dict()
        self.global_mean = y.mean()

        self.fitted = True
        logger.info(
            f"HistoricalAverageBaseline fitted: "
            f"{len(self.group_means)} groups, global mean={self.global_mean:.2f}"
        )

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict using group mean, fallback to global mean."""
        if not self.fitted:
            raise RuntimeError("Model not fitted")

        predictions = X[self.groupby_col].map(self.group_means).fillna(self.global_mean).values
        return predictions


def evaluate_baselines(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series
) -> Dict[str, Dict[str, float]]:
    """
    Train and evaluate all baseline models.

    Args:
        X_train, y_train: Training data
        X_test, y_test: Test data

    Returns:
        Dictionary of baseline results
    """
    baselines = [
        ConstantBaseline('mean'),
        ConstantBaseline('median'),
    ]

    # Add feature-based baselines if features available
    if 'antecedent_rainfall' in X_train.columns:
        baselines.append(LinearTrendBaseline('antecedent_rainfall'))

    if 'zone' in X_train.columns:
        baselines.append(HistoricalAverageBaseline('zone'))

    results = {}

    for baseline in baselines:
        try:
            baseline.fit(X_train, y_train)
            y_pred = baseline.predict(X_test)

            # Compute metrics
            mae = np.mean(np.abs(y_test.values - y_pred))
            rmse = np.sqrt(np.mean((y_test.values - y_pred) ** 2))
            mape = np.mean(np.abs((y_test.values - y_pred) / y_test.values)) * 100

            results[baseline.name] = {
                "mae": round(mae, 4),
                "rmse": round(rmse, 4),
                "mape": round(mape, 2),
            }

            logger.info(f"{baseline.name}: MAE={mae:.2f}, RMSE={rmse:.2f}, MAPE={mape:.1f}%")

        except Exception as e:
            logger.error(f"Failed to evaluate {baseline.name}: {e}")
            results[baseline.name] = {"error": str(e)}

    return results

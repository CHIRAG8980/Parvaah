"""
Confidence estimation methods for Fusion/Risk predictions.
"""
import numpy as np


def compute_confidence(
    probabilities: np.ndarray,
    method: str = "entropy"
) -> np.ndarray:
    """
    Compute prediction confidence scores.

    Args:
        probabilities: Predicted probabilities (n_samples, 2)
        method: 'entropy', 'margin', or 'max_prob'

    Returns:
        Confidence scores [0, 1]
    """
    if method == "entropy":
        p = probabilities[:, 1]
        eps = 1e-10
        entropy = -(p * np.log2(p + eps) + (1 - p) * np.log2(1 - p + eps))
        return 1.0 - entropy
    elif method == "margin":
        p = probabilities[:, 1]
        return np.abs(p - 0.5) * 2.0
    elif method == "max_prob":
        return np.max(probabilities, axis=1)
    else:
        raise ValueError(f"Unknown confidence method: {method}")

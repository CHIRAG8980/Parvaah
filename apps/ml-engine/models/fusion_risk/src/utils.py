"""
Utility functions for Fusion/Risk model
"""

import logging
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
import numpy as np


def setup_logging(log_dir: Path, name: str = "fusion_risk") -> logging.Logger:
    """
    Set up logging configuration

    Args:
        log_dir: Directory for log files
        name: Logger name

    Returns:
        Configured logger
    """
    log_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"{name}_{timestamp}.log"

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # File handler
    fh = logging.FileHandler(log_file)
    fh.setLevel(logging.INFO)

    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)

    logger.addHandler(fh)
    logger.addHandler(ch)

    return logger


def save_metadata(output_path: Path, metadata: Dict[str, Any]) -> None:
    """
    Save metadata to JSON file

    Args:
        output_path: Path to save metadata
        metadata: Metadata dictionary
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert non-serializable types
    def convert(obj):
        if isinstance(obj, (np.integer, np.floating)):
            return obj.item()
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, Path):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return obj

    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=convert)


def load_metadata(metadata_path: Path) -> Dict[str, Any]:
    """
    Load metadata from JSON file

    Args:
        metadata_path: Path to metadata file

    Returns:
        Metadata dictionary
    """
    with open(metadata_path, 'r') as f:
        return json.load(f)


def compute_class_weights(y: np.ndarray) -> Dict[int, float]:
    """
    Compute class weights for imbalanced data

    Args:
        y: Target labels

    Returns:
        Dictionary of class weights
    """
    classes, counts = np.unique(y, return_counts=True)
    total = len(y)

    weights = {}
    for cls, count in zip(classes, counts):
        weights[int(cls)] = total / (len(classes) * count)

    return weights


def get_feature_provenance() -> Dict[str, str]:
    """
    Return provenance information for all features

    Returns:
        Dictionary mapping feature names to data sources
    """
    return {
        # Model outputs
        "static_susceptibility": "XGBoost model trained on ISRO/GSI landslide inventory",
        "dynamic_hazard": "LSTM model trained on IMD rainfall + landslide events",

        # Topographic (CartoDEM - ISRO)
        "elevation": "CartoDEM 30m - ISRO/NRSC",
        "slope": "Derived from CartoDEM 30m - ISRO/NRSC",
        "aspect": "Derived from CartoDEM 30m - ISRO/NRSC",
        "curvature": "Derived from CartoDEM 30m - ISRO/NRSC",

        # Rainfall (IMD)
        "rainfall_24h": "IMD 0.25° gridded rainfall resampled to 30m",
        "rainfall_72h": "IMD 0.25° gridded rainfall resampled to 30m",
        "rainfall_antecedent_7d": "IMD 0.25° gridded rainfall resampled to 30m",

        # Vegetation (Sentinel-2)
        "ndvi": "Sentinel-2 MSI L2A (ESA) - August 2024",

        # SAR (Sentinel-1)
        "sar_intensity": "Sentinel-1 IW SLC (ESA) - August 2024",
        "sar_coherence": "Sentinel-1 coherence (ESA) - August 2024",
        "sar_ratio": "Sentinel-1 intensity ratio (ESA) - August 2024",

        # Geological (ISRO Bhuvan)
        "geomorphology": "ISRO Bhuvan Geomorphology - Meghalaya",
        "lineament": "ISRO Bhuvan Lineament - Meghalaya",
        "lulc": "ISRO Bhuvan Land Use Land Cover - Meghalaya",

        # Infrastructure (OSM)
        "distance_to_road": "Derived from OpenStreetMap",
        "distance_to_settlements": "Derived from OpenStreetMap",
        "distance_to_streams": "Derived from OpenStreetMap"
    }


def validate_crs_match(crs1: Any, crs2: Any) -> bool:
    """
    Check if two CRS match

    Args:
        crs1: First CRS
        crs2: Second CRS

    Returns:
        True if CRS match
    """
    # Handle different CRS representations
    str1 = str(crs1).replace(" ", "").upper()
    str2 = str(crs2).replace(" ", "").upper()

    return str1 == str2


def validate_transform_match(transform1: Any, transform2: Any, tolerance: float = 1e-4) -> bool:
    """
    Check if two raster transforms match

    Args:
        transform1: First transform
        transform2: Second transform
        tolerance: Numerical tolerance

    Returns:
        True if transforms match
    """
    if transform1 is None or transform2 is None:
        return False

    # Compare transform parameters
    for i in range(6):
        if abs(transform1[i] - transform2[i]) > tolerance:
            return False

    return True


def validate_shape_match(shape1: tuple, shape2: tuple) -> bool:
    """
    Check if two raster shapes match

    Args:
        shape1: First shape (height, width)
        shape2: Second shape (height, width)

    Returns:
        True if shapes match
    """
    return shape1 == shape2


def create_version_string() -> str:
    """
    Create version string with timestamp

    Returns:
        Version string
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"v1.0.0_{timestamp}"


def format_bytes(num_bytes: int) -> str:
    """
    Format bytes as human-readable string

    Args:
        num_bytes: Number of bytes

    Returns:
        Formatted string (e.g., "1.5 GB")
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if num_bytes < 1024.0:
            return f"{num_bytes:.2f} {unit}"
        num_bytes /= 1024.0
    return f"{num_bytes:.2f} PB"

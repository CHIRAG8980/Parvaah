"""
Utility functions for Dynamic Hazard model
Helper functions, logging, and common operations
"""

import logging
import json
import pickle
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
import numpy as np
import pandas as pd


def setup_logging(log_dir: Path, name: str = "dynamic_hazard") -> logging.Logger:
    """
    Set up logging with both file and console handlers

    Args:
        log_dir: Directory to save log files
        name: Logger name

    Returns:
        Configured logger instance
    """
    log_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"{name}_{timestamp}.log"

    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Remove existing handlers
    logger.handlers.clear()

    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(file_formatter)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter("%(levelname)s - %(message)s")
    console_handler.setFormatter(console_formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.info(f"Logging initialized. Log file: {log_file}")
    return logger


def save_json(data: Dict[str, Any], filepath: Path) -> None:
    """
    Save dictionary to JSON file

    Args:
        data: Dictionary to save
        filepath: Output file path
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)

    # Convert numpy and pandas types to native Python types
    def convert_types(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (pd.Timestamp, datetime)):
            return obj.isoformat()
        elif hasattr(obj, 'isoformat') and callable(getattr(obj, 'isoformat')):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_types(item) for item in obj]
        return obj

    converted_data = convert_types(data)

    with open(filepath, "w") as f:
        json.dump(converted_data, f, indent=2)


def load_json(filepath: Path) -> Dict[str, Any]:
    """
    Load dictionary from JSON file

    Args:
        filepath: Input file path

    Returns:
        Loaded dictionary
    """
    with open(filepath, "r") as f:
        return json.load(f)


def save_pickle(obj: Any, filepath: Path) -> None:
    """
    Save object to pickle file

    Args:
        obj: Object to save
        filepath: Output file path
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "wb") as f:
        pickle.dump(obj, f)


def load_pickle(filepath: Path) -> Any:
    """
    Load object from pickle file

    Args:
        filepath: Input file path

    Returns:
        Loaded object
    """
    with open(filepath, "rb") as f:
        return pickle.load(f)


def set_random_seed(seed: int = 42) -> None:
    """
    Set random seed for reproducibility

    Args:
        seed: Random seed value
    """
    np.random.seed(seed)
    try:
        import random
        random.seed(seed)
    except ImportError:
        pass

    try:
        import tensorflow as tf
        tf.random.set_seed(seed)
    except ImportError:
        pass

    try:
        import torch
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)
    except ImportError:
        pass


def format_metrics(metrics: Dict[str, float], prefix: str = "") -> str:
    """
    Format metrics dictionary for logging

    Args:
        metrics: Dictionary of metric names and values
        prefix: Optional prefix for metric names

    Returns:
        Formatted string
    """
    lines = []
    for name, value in metrics.items():
        full_name = f"{prefix}{name}" if prefix else name
        if isinstance(value, (int, np.integer)):
            lines.append(f"{full_name}: {value}")
        else:
            lines.append(f"{full_name}: {value:.4f}")
    return "\n".join(lines)


def check_file_exists(filepath: Path, name: str) -> None:
    """
    Check if file exists, raise informative error if not

    Args:
        filepath: Path to check
        name: Descriptive name for error message

    Raises:
        FileNotFoundError: If file does not exist
    """
    if not filepath.exists():
        raise FileNotFoundError(
            f"{name} not found at: {filepath}\n"
            f"Please ensure data has been collected and processed."
        )


def calculate_class_weights(y: np.ndarray) -> Dict[int, float]:
    """
    Calculate class weights for imbalanced classification

    Args:
        y: Target labels (0 or 1)

    Returns:
        Dictionary mapping class to weight
    """
    unique, counts = np.unique(y, return_counts=True)
    total = len(y)
    weights = {}
    for cls, count in zip(unique, counts):
        weights[int(cls)] = total / (len(unique) * count)
    return weights


def get_date_range_string(start_date: str, end_date: str) -> str:
    """
    Format date range as string

    Args:
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Formatted date range string
    """
    return f"{start_date} to {end_date}"


if __name__ == "__main__":
    # Test utilities
    from config import LOGS_DIR

    logger = setup_logging(LOGS_DIR)
    logger.info("Utilities module test")

    # Test random seed
    set_random_seed(42)
    logger.info(f"Random number: {np.random.rand()}")

    # Test metrics formatting
    metrics = {"accuracy": 0.85, "f1": 0.72, "loss": 0.45}
    logger.info(f"Metrics:\n{format_metrics(metrics)}")

    print("Utilities module loaded successfully")

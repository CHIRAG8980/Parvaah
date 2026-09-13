"""
Utility functions for TTF pipeline.
"""
import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def setup_logging(log_dir: Path, log_name: str = "ttf_pipeline") -> None:
    """
    Configure logging for TTF pipeline.

    Args:
        log_dir: Directory for log files
        log_name: Base name for log file
    """
    log_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = log_dir / f"{log_name}_{timestamp}.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

    logger.info(f"Logging initialized. Log file: {log_file}")


def save_json(data: Dict[str, Any], filepath: Path) -> None:
    """
    Save dictionary as JSON file.

    Args:
        data: Dictionary to save
        filepath: Output file path
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)

    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)

    logger.info(f"Saved JSON to {filepath}")


def load_json(filepath: Path) -> Dict[str, Any]:
    """
    Load JSON file as dictionary.

    Args:
        filepath: Path to JSON file

    Returns:
        Dictionary from JSON
    """
    with open(filepath, 'r') as f:
        data = json.load(f)

    logger.info(f"Loaded JSON from {filepath}")
    return data


def save_report(report: str, filepath: Path) -> None:
    """
    Save text report to file.

    Args:
        report: Report text
        filepath: Output file path
    """
    filepath.parent.mkdir(parents=True, exist_ok=True)

    with open(filepath, 'w') as f:
        f.write(report)

    logger.info(f"Saved report to {filepath}")


def format_datetime(dt: datetime) -> str:
    """Format datetime for display."""
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def compute_temporal_split(
    dates: pd.Series,
    test_fraction: float = 0.2
) -> datetime:
    """
    Compute chronological split point for train/test.

    Args:
        dates: Series of dates
        test_fraction: Fraction of data for test set

    Returns:
        Split date (events before = train, after = test)
    """
    sorted_dates = dates.sort_values()
    split_idx = int(len(sorted_dates) * (1 - test_fraction))
    split_date = sorted_dates.iloc[split_idx]

    logger.info(f"Temporal split at {split_date.date()} ({test_fraction*100}% test)")
    return split_date


def check_directory_structure(base_dir: Path) -> bool:
    """
    Verify required directory structure exists.

    Args:
        base_dir: Base directory to check

    Returns:
        True if all required directories exist
    """
    required_dirs = [
        "outputs/predictions",
        "outputs/plots",
        "outputs/metrics",
        "outputs/diagnostics",
        "outputs/reports",
        "saved_models",
        "logs"
    ]

    all_exist = True
    for dir_path in required_dirs:
        full_path = base_dir / dir_path
        if not full_path.exists():
            logger.warning(f"Missing directory: {full_path}")
            all_exist = False
            full_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {full_path}")

    return all_exist


def calculate_metrics_summary(metrics: Dict[str, float]) -> str:
    """
    Format metrics dictionary as readable string.

    Args:
        metrics: Dictionary of metric names and values

    Returns:
        Formatted string
    """
    lines = ["Metrics Summary:"]
    for name, value in metrics.items():
        if isinstance(value, float):
            lines.append(f"  {name}: {value:.4f}")
        else:
            lines.append(f"  {name}: {value}")
    return "\n".join(lines)


def create_feasibility_report(
    validation_report: dict,
    defensibility_check: dict,
    temporal_stats: dict
) -> str:
    """
    Create comprehensive feasibility report.

    Args:
        validation_report: From validation.run_all_validations
        defensibility_check: From validation.check_model_defensibility
        temporal_stats: Temporal coverage statistics

    Returns:
        Markdown-formatted report
    """
    report_lines = [
        "# Time-to-Failure Model Feasibility Report",
        "",
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "",
        "## Executive Summary",
        "",
        f"**Model Training Defensible:** {'✓ YES' if defensibility_check['can_train'] else '✗ NO'}",
        "",
        defensibility_check['rationale'],
        "",
        "## Data Assessment",
        "",
        "### Available Data",
        f"- **Exact-date events:** {temporal_stats.get('n_events', 0)}",
        f"- **Temporal span:** {temporal_stats.get('span_days', 0)} days",
        f"- **Unique dates:** {temporal_stats.get('unique_dates', 0)}",
        f"- **Date range:** {temporal_stats.get('date_range', 'N/A')}",
        "",
        "### Validation Results",
        ""
    ]

    for validation in validation_report['validations']:
        status = "✓ PASS" if validation['passed'] else "✗ FAIL"
        report_lines.append(f"**{validation['check']}:** {status}")
        report_lines.append(f"  - {validation['message']}")
        report_lines.append("")

    if not defensibility_check['can_train']:
        report_lines.extend([
            "## Recommendations",
            "",
            "To enable defensible TTF modeling, the following improvements are needed:",
            ""
        ])
        for i, rec in enumerate(defensibility_check['recommendations'], 1):
            report_lines.append(f"{i}. {rec}")
        report_lines.append("")

    report_lines.extend([
        "## Statistical Requirements for TTF",
        "",
        "A defensible time-to-failure regression model requires:",
        f"- **Minimum events:** {MIN_EVENTS_FOR_TTF} (for meaningful train/test split)",
        f"- **Minimum temporal span:** {MIN_TEMPORAL_SPAN_DAYS} days (to capture temporal patterns)",
        f"- **Minimum unique dates:** {MIN_UNIQUE_DATES} (for temporal diversity)",
        "- **Chronological validation:** Strict time-based train/test split",
        "- **No temporal leakage:** Test events must occur after all training events",
        "",
        "## Alternative Approaches",
        "",
        "If exact-date TTF is not feasible, consider:",
        "",
        "1. **Survival Analysis with Interval Censoring:**",
        "   - Use year-only events as interval-censored data",
        "   - Model probability of failure within time windows",
        "   - Requires specialized survival models (Cox, Weibull, etc.)",
        "",
        "2. **Binary Hazard Classification:**",
        "   - Predict probability of failure in next N days (yes/no)",
        "   - Less granular than TTF but may be more robust with limited data",
        "",
        "3. **Enhanced Data Collection:**",
        "   - Deploy monitoring systems for real-time event detection",
        "   - Integrate additional institutional sources with exact dates",
        "   - Collaborate with field teams for temporal validation",
        "",
        "---",
        "",
        "*This report was generated automatically by the TTF validation pipeline.*"
    ])

    return "\n".join(report_lines)


# Import at module level for use in report
from .config import MIN_EVENTS_FOR_TTF, MIN_TEMPORAL_SPAN_DAYS, MIN_UNIQUE_DATES

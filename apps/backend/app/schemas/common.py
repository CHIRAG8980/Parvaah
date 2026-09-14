"""Common enumeration types across API schemas."""

from enum import Enum


class RiskLevel(str, Enum):
    """Categorical landslide risk level."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    OUT_OF_COVERAGE = "OUT_OF_COVERAGE"


class AlertSeverity(str, Enum):
    """Alert severity designation."""

    ADVISORY = "Advisory"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class AlertStatus(str, Enum):
    """Alert review and lifecycle state."""

    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_ESCALATED = "auto_escalated"
    DISPATCHED = "dispatched"


class RoadStatus(str, Enum):
    """Road operational status."""

    OPEN = "open"
    AT_RISK = "at_risk"
    BLOCKED = "blocked"


class ConfidenceLevel(str, Enum):
    """Data quality and model confidence level."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    OUT_OF_COVERAGE = "out_of_coverage"

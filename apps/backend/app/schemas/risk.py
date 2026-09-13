"""Pydantic schemas for risk scoring and ML explainability."""

from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import RiskLevel, ConfidenceLevel


class ExplainabilityFactors(BaseModel):
    """Contributing factor breakdown for predictions."""

    slope_degrees: float = Field(..., description="Slope angle in degrees")
    rainfall24h_mm: float = Field(..., description="24h precipitation in mm")
    rainfall72h_cumulative_mm: float = Field(
        ..., description="72h cumulative precipitation in mm"
    )
    insar_deformation_mm_yr: float = Field(
        ..., description="InSAR displacement rate mm/yr"
    )
    ndvi_index: float = Field(
        ..., description="Normalized difference vegetation index"
    )
    soil_moisture_pct: float = Field(
        ..., description="Soil moisture saturation percentage"
    )
    top_factors: list[str] = Field(
        default_factory=list, description="Top SHAP feature drivers"
    )


class RiskScoreResponse(BaseModel):
    """Comprehensive risk score payload."""

    risk_score_id: str
    zone_id: str
    computed_at: datetime
    risk_level: RiskLevel
    risk_score_numeric: float = Field(
        ..., ge=0.0, le=100.0, description="Risk score from 0 to 100"
    )
    time_to_failure_min_days: int | None = None
    time_to_failure_max_days: int | None = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    confidence_level: ConfidenceLevel
    model_version: str
    factors: ExplainabilityFactors


class RiskSimulationRequest(BaseModel):
    """Parameters for what-if simulation inference."""

    rainfall24h_mm: float = Field(..., ge=0.0, le=1000.0)
    rainfall72h_cumulative_mm: float = Field(..., ge=0.0, le=2000.0)
    slope_degrees: float = Field(..., ge=0.0, le=90.0)
    soil_moisture_pct: float = Field(..., ge=0.0, le=100.0)
    insar_deformation_mm_yr: float = Field(default=-15.0)
    ndvi_index: float = Field(default=0.45)


class RiskSimulationResponse(BaseModel):
    """Inference output from simulation."""

    risk_score_numeric: float
    risk_level: RiskLevel
    confidence_score: float
    time_to_failure_estimate: str
    primary_driver: str
    factors: ExplainabilityFactors
    model_engine: str = "xgboost_ensemble"
    feature_importances: dict[str, float] = Field(default_factory=dict)

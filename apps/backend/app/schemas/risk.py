"""Pydantic schemas for risk scoring, multi-model outputs, and ML explainability."""

from datetime import datetime
from typing import Any, Optional
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
        default=0.0, description="InSAR displacement rate mm/yr"
    )
    ndvi_index: float = Field(
        default=0.0, description="Normalized difference vegetation index"
    )
    soil_moisture_pct: float = Field(
        default=0.0, description="Soil moisture saturation percentage"
    )
    top_factors: list[str] = Field(
        default_factory=list, description="Top feature drivers"
    )


class StaticSusceptibilityDetails(BaseModel):
    """Model 1: Static Susceptibility Output (10 CartoDEM/Bhuvan/PWD features)."""

    score: Optional[float] = Field(None, description="Susceptibility score (0-1)")
    category: str = Field(..., description="Susceptibility category (LOW, MODERATE, HIGH, VERY_HIGH, UNAVAILABLE)")
    status: str = Field(..., description="Availability status (AVAILABLE, UNAVAILABLE, INCOMPLETE_FEATURES)")
    model_type: str = Field(default="RandomForest (10 Bhuvan/CartoDEM features)")
    features: dict[str, Optional[float]] = Field(default_factory=dict)


class DynamicHazardDetails(BaseModel):
    """Model 2: Dynamic Hazard / Trigger Output (IMD multi-scale rainfall trigger)."""

    score: Optional[float] = Field(None, description="Trigger probability score (0-1)")
    trigger_state: str = Field(..., description="Trigger state (CRITICAL_TRIGGER, WARNING_TRIGGER, WATCH, BASELINE)")
    confidence: Optional[float] = Field(None, description="Model trigger confidence")
    status: str = Field(..., description="Availability status (AVAILABLE, UNAVAILABLE)")
    model_type: str = Field(default="XGBoost Dynamic Hazard Classifier")
    rainfall_24h_mm: float = 0.0
    rainfall_72h_mm: float = 0.0
    rainfall_antecedent_7d_mm: float = 0.0


class LeadWindowDetails(BaseModel):
    """Model 3: Pre-Event Lead-Window Condition Output."""

    condition_class: Optional[int] = Field(None, description="Condition class (0=Baseline, 1=Elevated, 2=Critical)")
    similarity_score: Optional[float] = Field(None, description="Pattern similarity score to historical pre-events")
    description: str = Field(..., description="Lead-window condition description")
    historical_condition_window: Optional[str] = Field(None, description="Pre-event similarity profile window")
    lead_days_min: Optional[int] = Field(None, description="Estimated lead window min days")
    lead_days_max: Optional[int] = Field(None, description="Estimated lead window max days")
    status: str = Field(..., description="Availability status (AVAILABLE, UNAVAILABLE)")
    model_type: str = Field(default="RandomForest Lead-Window Classifier")


class FusionDetails(BaseModel):
    """Model 4: Multi-Modal Fusion Risk Output."""

    score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Fused risk score (0-100)")
    risk_level: str = Field(..., description="Risk level (LOW, MEDIUM, HIGH, CRITICAL, OUT_OF_COVERAGE)")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    confidence_level: Optional[str] = Field(None, description="Confidence level (LOW, MEDIUM, HIGH, OUT_OF_COVERAGE)")
    status: str = Field(..., description="Availability status (AVAILABLE, UNAVAILABLE, OUT_OF_COVERAGE)")
    model_type: str = Field(default="FusionRiskModel XGBoost Multi-Modal")


class ModelsBreakdown(BaseModel):
    """Container for the 4 sovereign ML models."""

    static_susceptibility: StaticSusceptibilityDetails
    dynamic_hazard: DynamicHazardDetails
    lead_window: LeadWindowDetails
    fusion: FusionDetails


class UnifiedRiskPredictionResponse(BaseModel):
    """Standardized multi-model response for Parvaah API."""

    zone_id: str
    zone_name: Optional[str] = None
    risk_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="Risk score from 0 to 100")
    risk_level: RiskLevel
    confidence: Optional[ConfidenceLevel] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    historical_condition_window: Optional[str] = Field(None, description="Pre-event similarity profile")
    time_to_failure_window: Optional[str] = Field(None, description="Legacy field alias for pre-event similarity window")
    time_to_failure_min_days: Optional[int] = None
    time_to_failure_max_days: Optional[int] = None
    models: ModelsBreakdown
    data_availability: dict[str, Any]
    contributing_factors: list[str] = Field(default_factory=list)
    model_version: str
    model_loaded: bool
    preprocessor_loaded: bool
    data_source: str
    rainfall_reading_timestamp: Optional[str] = None
    prediction_computed_at: str
    risk_score_id: str
    feature_importances: dict[str, float] = Field(default_factory=dict)
    explainability: ExplainabilityFactors
    factors: Optional[ExplainabilityFactors] = None


class MultiModalPredictRequest(BaseModel):
    """Request payload for on-demand multi-modal prediction."""

    latitude: float = Field(..., description="Latitude in EPSG:4326")
    longitude: float = Field(..., description="Longitude in EPSG:4326")
    rainfall_24h_mm: float = Field(default=0.0, ge=0.0, le=1000.0)
    rainfall_72h_mm: float = Field(default=0.0, ge=0.0, le=2000.0)
    rainfall_antecedent_7d_mm: Optional[float] = None
    rainfall_14d_mm: Optional[float] = None
    rainfall_30d_mm: Optional[float] = None
    slope_degrees: Optional[float] = Field(None, ge=0.0, le=90.0)
    soil_moisture_pct: Optional[float] = Field(None, ge=0.0, le=100.0)
    nisar_los_deformation_m: Optional[float] = None
    nisar_coherence: Optional[float] = None
    zone_id: Optional[str] = None
    zone_name: Optional[str] = None
    district: Optional[str] = None


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
    soil_moisture_pct: float = Field(default=45.0, ge=0.0, le=100.0)
    insar_deformation_mm_yr: float = Field(default=-15.0)
    ndvi_index: float = Field(default=0.45)


class RiskSimulationResponse(BaseModel):
    """Inference output from simulation."""

    risk_score_numeric: float
    risk_level: RiskLevel
    confidence_score: float
    historical_condition_window: Optional[str] = Field(None, description="Pre-event similarity profile")
    time_to_failure_estimate: str
    primary_driver: str
    factors: ExplainabilityFactors
    models: Optional[ModelsBreakdown] = None
    data_availability: Optional[dict[str, Any]] = None
    model_engine: str = "xgboost_ensemble_fusion"
    feature_importances: dict[str, float] = Field(default_factory=dict)

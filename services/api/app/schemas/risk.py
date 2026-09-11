from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, List

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RiskFactors(BaseModel):
    rainfall24h_mm: float
    rainfall72h_cumulative_mm: float
    soil_moisture_pct: float
    slope_degrees: float
    insar_deformation_mm_yr: Optional[float] = None
    ndvi_index: Optional[float] = None

class ZoneRiskSchema(BaseModel):
    zone_id: str
    zone_name: str
    state: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevel
    confidence: ConfidenceLevel
    factors: RiskFactors

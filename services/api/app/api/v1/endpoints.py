from fastapi import APIRouter
from typing import List
from app.schemas.risk import ZoneRiskSchema, RiskLevel, ConfidenceLevel, RiskFactors

api_router = APIRouter()

@api_router.get("/risks", response_model=List[ZoneRiskSchema], tags=["Risks"])
def get_monitored_risks():
    """
    Get current landslide risk assessment for North Eastern Region monitoring zones.
    """
    return [
        ZoneRiskSchema(
            zone_id="NER-MEG-001",
            zone_name="Sohra (Cherrapunji) Sector A",
            state="Meghalaya",
            risk_score=0.91,
            risk_level=RiskLevel.CRITICAL,
            confidence=ConfidenceLevel.HIGH,
            factors=RiskFactors(
                rainfall24h_mm=198.4,
                rainfall72h_cumulative_mm=342.1,
                soil_moisture_pct=88.5,
                slope_degrees=38.2,
                insar_deformation_mm_yr=-24.6,
                ndvi_index=0.38
            )
        ),
        ZoneRiskSchema(
            zone_id="NER-SKM-014",
            zone_name="Dikchu - Singtam Faultline",
            state="Sikkim",
            risk_score=0.76,
            risk_level=RiskLevel.HIGH,
            confidence=ConfidenceLevel.HIGH,
            factors=RiskFactors(
                rainfall24h_mm=88.2,
                rainfall72h_cumulative_mm=164.0,
                soil_moisture_pct=74.0,
                slope_degrees=42.0,
                insar_deformation_mm_yr=-18.2,
                ndvi_index=0.44
            )
        )
    ]

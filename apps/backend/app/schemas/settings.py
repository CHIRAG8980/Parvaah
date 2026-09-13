"""Pydantic schemas for system configuration and sensory thresholds."""

from datetime import datetime
from pydantic import BaseModel, Field


class BroadcastChannelsSchema(BaseModel):
    ndmaCap: bool = True
    whatsappSdma: bool = True
    smsDisasterRelay: bool = True
    broRadioPush: bool = True
    sirenCivilDefense: bool = False
    emailBulletin: bool = True


class SystemSettingsResponse(BaseModel):
    rainfall_warning: float = Field(..., description="24h rainfall warning threshold in mm")
    rainfall_critical: float = Field(..., description="24h rainfall critical threshold in mm")
    insar_velocity: float = Field(..., description="InSAR creep velocity trigger in mm/yr")
    soil_saturation: float = Field(..., description="Volumetric soil water content in %")
    seismic_threshold: float = Field(..., description="Peak ground acceleration trigger in g")
    channels: BroadcastChannelsSchema
    aws_poll_rate: str = "30s"
    insar_sync_interval: str = "30m"
    inclinometer_heartbeat: str = "1m"
    edge_failover: bool = True
    updated_at: datetime


class SystemSettingsUpdateRequest(BaseModel):
    rainfall_warning: float | None = None
    rainfall_critical: float | None = None
    insar_velocity: float | None = None
    soil_saturation: float | None = None
    seismic_threshold: float | None = None
    channels: BroadcastChannelsSchema | None = None
    aws_poll_rate: str | None = None
    insar_sync_interval: str | None = None
    inclinometer_heartbeat: str | None = None
    edge_failover: bool | None = None

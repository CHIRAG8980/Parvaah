"""Pydantic schemas for citizen mobile device registration."""

from pydantic import BaseModel, Field


class DeviceRegisterRequest(BaseModel):
    """Payload to register citizen device for push alerts."""

    fcm_token: str = Field(..., description="Firebase Cloud Messaging token")
    zone_id: str = Field(..., description="Subscribed zone identifier")
    language: str = Field(default="en", description="Preferred ISO language code")
    platform: str = Field(default="android", description="android or ios")


class DeviceRegisterResponse(BaseModel):
    """Response confirming push token registration."""

    status: str = "registered"
    device_id: str
    zone_id: str
    language: str
    message: str

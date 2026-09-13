"""Central API router aggregating all v1 domain modules."""

from fastapi import APIRouter
from app.api.v1.zones import router as zones_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.roads import router as roads_router
from app.api.v1.weather import router as weather_router
from app.api.v1.datasources import router as datasources_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.predict import router as predict_router
from app.api.v1.audit import router as audit_router
from app.api.v1.devices import router as devices_router
from app.api.v1.auth import router as auth_router
from app.api.v1.settings import router as settings_router

api_router = APIRouter()

api_router.include_router(zones_router)
api_router.include_router(alerts_router)
api_router.include_router(roads_router)
api_router.include_router(weather_router)
api_router.include_router(datasources_router)
api_router.include_router(analytics_router)
api_router.include_router(predict_router)
api_router.include_router(audit_router)
api_router.include_router(devices_router)
api_router.include_router(auth_router)
api_router.include_router(settings_router)

# Backwards compatibility alias for /api/v1/risks
from app.api.v1.zones import list_zones
api_router.add_api_route("/risks", list_zones, methods=["GET"], tags=["Risks"])

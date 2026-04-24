from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.settings import BusinessSettings
from app.services.settings_service import SettingsService

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _svc(db: AsyncIOMotorDatabase = Depends(get_database)) -> SettingsService:
    return SettingsService(db)


@router.get("/business")
async def get_settings(
    _: dict = Depends(get_current_user),
    svc: SettingsService = Depends(_svc),
) -> dict:
    return await svc.get()


@router.put("/business")
async def update_settings(
    body: BusinessSettings,
    _: dict = Depends(get_current_user),
    svc: SettingsService = Depends(_svc),
) -> dict:
    return await svc.update(body.model_dump())

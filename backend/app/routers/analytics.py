from __future__ import annotations

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.analytics import (
    AnalyticsOverview,
    CallLogResponse,
    ChatSessionsResponse,
    VoiceSessionsResponse,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _svc(db: AsyncIOMotorDatabase = Depends(get_database)) -> AnalyticsService:
    return AnalyticsService(db)


@router.get("/overview", response_model=AnalyticsOverview)
async def get_overview(
    _: dict = Depends(get_current_user),
    svc: AnalyticsService = Depends(_svc),
) -> AnalyticsOverview:
    data = await svc.get_overview()
    return AnalyticsOverview(**data)


@router.get("/calls", response_model=CallLogResponse)
async def list_calls(
    skip: int = 0,
    limit: int = 50,
    _: dict = Depends(get_current_user),
    svc: AnalyticsService = Depends(_svc),
) -> CallLogResponse:
    data = await svc.list_calls(skip=skip, limit=limit)
    return CallLogResponse(**data)


@router.get("/chats", response_model=ChatSessionsResponse)
async def list_chats(
    skip: int = 0,
    limit: int = 50,
    _: dict = Depends(get_current_user),
    svc: AnalyticsService = Depends(_svc),
) -> ChatSessionsResponse:
    data = await svc.list_chats(skip=skip, limit=limit)
    return ChatSessionsResponse(**data)


@router.get("/voice", response_model=VoiceSessionsResponse)
async def list_voice(
    skip: int = 0,
    limit: int = 50,
    _: dict = Depends(get_current_user),
    svc: AnalyticsService = Depends(_svc),
) -> VoiceSessionsResponse:
    data = await svc.list_voice(skip=skip, limit=limit)
    return VoiceSessionsResponse(**data)

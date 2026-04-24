from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings
from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.session import SessionEndRequest, SessionEndResponse, VoiceTokenRequest, VoiceTokenResponse
from app.services.livekit_service import LiveKitService

router = APIRouter(prefix="/api/voice", tags=["voice"])


def _svc() -> LiveKitService:
    return LiveKitService()


# ── Get LiveKit room token ─────────────────────────────────────────────────────

@router.post("/token", response_model=VoiceTokenResponse)
async def get_voice_token(
    body: VoiceTokenRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
    svc: LiveKitService = Depends(_svc),
) -> VoiceTokenResponse:
    settings = get_settings()

    if not settings.LIVEKIT_API_KEY or not settings.LIVEKIT_API_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LiveKit is not configured on this server",
        )

    room_name = body.room_name or svc.generate_room_name(current_user["id"])
    token = svc.create_room_token(
        user_id=current_user["id"],
        username=current_user["username"],
        room_name=room_name,
    )

    await svc.create_session_record(db, current_user["id"], room_name)

    try:
        await svc.dispatch_agent(room_name)
    except Exception as exc:
        logger.warning("Agent dispatch failed: {}", exc)

    return VoiceTokenResponse(
        token=token,
        room_name=room_name,
        livekit_url=settings.LIVEKIT_URL,
    )


# ── End session ────────────────────────────────────────────────────────────────

@router.post("/session/end", response_model=SessionEndResponse)
async def end_session(
    body: SessionEndRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
    svc: LiveKitService = Depends(_svc),
) -> SessionEndResponse:
    record = await svc.end_session_record(db, body.room_name)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    started = record.get("started_at")
    ended = record.get("ended_at") or datetime.now(timezone.utc)
    duration = (ended - started).total_seconds() if started else 0.0

    return SessionEndResponse(
        session_id=str(record["_id"]),
        duration_seconds=duration,
        transcript=record.get("transcript", []),
    )


# ── LiveKit webhook ────────────────────────────────────────────────────────────

@router.post("/webhook/livekit", status_code=status.HTTP_200_OK)
async def livekit_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    try:
        body = await request.json()
        event = body.get("event", "")
        room = body.get("room", {}).get("name", "")
        logger.info("LiveKit webhook event={} room={}", event, room)

        if event == "room_finished" and room:
            await db.voice_sessions.update_many(
                {"room_name": room, "status": "active"},
                {"$set": {"status": "ended"}},
            )
    except Exception as exc:
        logger.warning("Webhook parse error: {}", exc)

    return {"received": True}

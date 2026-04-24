from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from livekit.api import AccessToken, VideoGrants, LiveKitAPI, CreateAgentDispatchRequest

from loguru import logger

from app.core.config import get_settings


class LiveKitService:
    """Room token generation and agent dispatch — no HTTP concerns."""

    def __init__(self) -> None:
        self._s = get_settings()

    # ── Token ──────────────────────────────────────────────────────────────

    def create_room_token(
        self,
        user_id: str,
        username: str,
        room_name: str,
        ttl_minutes: int = 60,
    ) -> str:
        token = (
            AccessToken(
                api_key=self._s.LIVEKIT_API_KEY,
                api_secret=self._s.LIVEKIT_API_SECRET,
            )
            .with_identity(user_id)
            .with_name(username)
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=room_name,
                    can_publish=True,
                    can_subscribe=True,
                    can_publish_data=True,
                )
            )
            .with_ttl(timedelta(minutes=ttl_minutes))
            .to_jwt()
        )
        logger.debug("Room token created user={} room={}", user_id, room_name)
        return token

    @staticmethod
    def generate_room_name(user_id: str) -> str:
        return f"room-{user_id[:8]}-{uuid.uuid4().hex[:8]}"

    # ── Agent dispatch ─────────────────────────────────────────────────────

    async def dispatch_agent(self, room_name: str) -> None:
        """Ask LiveKit to assign the voice-receptionist agent to the room."""
        if not self._s.LIVEKIT_API_KEY:
            logger.warning("LiveKit not configured — skipping agent dispatch")
            return

        async with LiveKitAPI(
            url=self._s.LIVEKIT_URL,
            api_key=self._s.LIVEKIT_API_KEY,
            api_secret=self._s.LIVEKIT_API_SECRET,
        ) as api:
            await api.agent_dispatch.create_dispatch(
                CreateAgentDispatchRequest(
                    agent_name="voice-receptionist",
                    room=room_name,
                )
            )
            logger.info("Agent dispatched room={}", room_name)

    # ── Session DB helpers ─────────────────────────────────────────────────

    @staticmethod
    async def create_session_record(db, user_id: str, room_name: str) -> str:
        now = datetime.now(timezone.utc)
        result = await db.voice_sessions.insert_one({
            "user_id": user_id,
            "room_name": room_name,
            "status": "active",
            "started_at": now,
            "ended_at": None,
            "transcript": [],
        })
        return str(result.inserted_id)

    @staticmethod
    async def end_session_record(db, room_name: str) -> dict | None:
        from datetime import timezone as tz
        now = datetime.now(timezone.utc)
        record = await db.voice_sessions.find_one_and_update(
            {"room_name": room_name, "status": "active"},
            {"$set": {"status": "ended", "ended_at": now}},
            return_document=True,
        )
        return record

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from livekit.api import LiveKitAPI, CreateSIPParticipantRequest, CreateAgentDispatchRequest, CreateRoomRequest
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings


class PhoneService:
    """Orchestrates SIP/phone calls via LiveKit + Twilio."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._s = get_settings()

    # ── Inbound webhook (Twilio → LiveKit SIP) ─────────────────────────────

    async def handle_inbound_webhook(
        self,
        from_number: str,
        to_number: str,
        call_sid: str,
    ) -> str:
        """Persist call record and return TwiML that routes to LiveKit SIP."""
        s = self._s
        room_name = f"phone-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        await self._db.phone_calls.insert_one({
            "call_id": call_sid,
            "direction": "inbound",
            "from_number": from_number,
            "to_number": to_number,
            "status": "ringing",
            "duration_seconds": 0,
            "room_name": room_name,
            "created_at": now,
            "updated_at": now,
        })

        logger.info("Inbound call call_sid={} from={} room={}", call_sid, from_number, room_name)

        # TwiML: dial out to the LiveKit SIP inbound trunk
        sip_uri = f"sip:{room_name}@{s.LIVEKIT_SIP_DOMAIN}"
        return (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            "<Response>\n"
            "  <Dial>\n"
            f'    <Sip username="{s.TWILIO_SIP_USERNAME}"'
            f' password="{s.TWILIO_SIP_PASSWORD}">'
            f"{sip_uri}</Sip>\n"
            "  </Dial>\n"
            "</Response>"
        )

    async def handle_status_callback(
        self,
        call_sid: str,
        call_status: str,
        call_duration: str | None,
    ) -> None:
        """Update call record from Twilio status callback."""
        update: dict = {
            "status": call_status,
            "updated_at": datetime.now(timezone.utc),
        }
        if call_duration:
            try:
                update["duration_seconds"] = int(call_duration)
            except ValueError:
                pass
        await self._db.phone_calls.update_one(
            {"call_id": call_sid},
            {"$set": update},
        )
        logger.info("Call status updated call_sid={} status={}", call_sid, call_status)

    # ── Outbound call (LiveKit SIP → Twilio → phone) ───────────────────────

    async def initiate_outbound(self, user_id: str, to_number: str) -> dict:
        """Create a LiveKit room and dial out via the SIP outbound trunk."""
        s = self._s
        call_id = str(uuid.uuid4())
        room_name = f"phone-out-{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        await self._db.phone_calls.insert_one({
            "call_id": call_id,
            "direction": "outbound",
            "from_number": s.TWILIO_PHONE_NUMBER,
            "to_number": to_number,
            "status": "initiated",
            "duration_seconds": 0,
            "room_name": room_name,
            "initiated_by": user_id,
            "created_at": now,
            "updated_at": now,
        })

        async with LiveKitAPI(
            url=s.LIVEKIT_URL,
            api_key=s.LIVEKIT_API_KEY,
            api_secret=s.LIVEKIT_API_SECRET,
        ) as lkapi:
            await lkapi.room.create_room(CreateRoomRequest(name=room_name))
            await lkapi.agent_dispatch.create_dispatch(
                CreateAgentDispatchRequest(
                    agent_name="voice-receptionist",
                    room=room_name,
                )
            )
            await lkapi.sip.create_sip_participant(
                CreateSIPParticipantRequest(
                    sip_trunk_id=s.LIVEKIT_SIP_OUTBOUND_TRUNK_ID,
                    sip_call_to=to_number,
                    sip_number=s.TWILIO_PHONE_NUMBER,
                    room_name=room_name,
                    participant_identity=f"phone-{to_number}",
                    participant_name=to_number,
                )
            )

        await self._db.phone_calls.update_one(
            {"call_id": call_id},
            {"$set": {"status": "ringing", "updated_at": datetime.now(timezone.utc)}},
        )

        logger.info("Outbound call initiated call_id={} to={} room={}", call_id, to_number, room_name)
        return {"call_id": call_id, "room_name": room_name, "status": "ringing", "created_at": now}

    # ── Call history ───────────────────────────────────────────────────────

    async def list_calls(self, skip: int = 0, limit: int = 50) -> dict:
        total = await self._db.phone_calls.count_documents({})
        cursor = (
            self._db.phone_calls.find({})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        calls = []
        async for doc in cursor:
            calls.append(self._format(doc))
        return {"calls": calls, "total": total}

    async def get_call(self, call_id: str) -> dict | None:
        doc = await self._db.phone_calls.find_one({"call_id": call_id})
        return self._format(doc) if doc else None

    # ── Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _format(doc: dict) -> dict:
        return {
            "call_id": doc["call_id"],
            "direction": doc["direction"],
            "from_number": doc["from_number"],
            "to_number": doc["to_number"],
            "status": doc["status"],
            "duration_seconds": doc.get("duration_seconds", 0),
            "room_name": doc["room_name"],
            "created_at": doc["created_at"],
            "updated_at": doc["updated_at"],
        }

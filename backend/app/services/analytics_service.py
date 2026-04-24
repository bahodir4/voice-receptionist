from __future__ import annotations

from datetime import datetime, timedelta, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


class AnalyticsService:
    """MongoDB aggregation queries for the admin analytics panel."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db

    # ── Overview ───────────────────────────────────────────────────────────

    async def get_overview(self) -> dict:
        now = datetime.now(timezone.utc)
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)

        phone_today   = await self._db.phone_calls.count_documents({"created_at": {"$gte": today}})
        phone_all     = await self._db.phone_calls.count_documents({})
        voice_today   = await self._db.voice_sessions.count_documents({"started_at": {"$gte": today}})
        voice_all     = await self._db.voice_sessions.count_documents({})
        chat_today    = await self._db.chat_sessions.count_documents({"created_at": {"$gte": today}})
        chat_all      = await self._db.chat_sessions.count_documents({})

        avg_result = await self._db.phone_calls.aggregate([
            {"$match": {"status": "completed", "duration_seconds": {"$gt": 0}}},
            {"$group": {"_id": None, "avg": {"$avg": "$duration_seconds"}}},
        ]).to_list(1)
        avg_duration = int(avg_result[0]["avg"]) if avg_result else 0

        chart = await self._chart_data(7)

        return {
            "today": {
                "phone_calls": phone_today,
                "voice_sessions": voice_today,
                "chat_sessions": chat_today,
                "total": phone_today + voice_today + chat_today,
            },
            "all_time": {
                "phone_calls": phone_all,
                "voice_sessions": voice_all,
                "chat_sessions": chat_all,
                "total": phone_all + voice_all + chat_all,
            },
            "avg_call_duration": avg_duration,
            "chart": chart,
        }

    async def _chart_data(self, days: int) -> list[dict]:
        now = datetime.now(timezone.utc)
        points: list[dict] = []

        for i in range(days - 1, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end   = day_start + timedelta(days=1)
            date_str  = day_start.strftime("%Y-%m-%d")

            phone  = await self._db.phone_calls.count_documents(
                {"created_at": {"$gte": day_start, "$lt": day_end}}
            )
            voice  = await self._db.voice_sessions.count_documents(
                {"started_at": {"$gte": day_start, "$lt": day_end}}
            )
            chat   = await self._db.chat_sessions.count_documents(
                {"created_at": {"$gte": day_start, "$lt": day_end}}
            )
            points.append({"date": date_str, "phone_calls": phone, "voice_sessions": voice, "chat_sessions": chat})

        return points

    # ── Call logs ──────────────────────────────────────────────────────────

    async def list_calls(self, skip: int = 0, limit: int = 50) -> dict:
        total = await self._db.phone_calls.count_documents({})
        cursor = self._db.phone_calls.find({}).sort("created_at", -1).skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            items.append({
                "call_id": doc["call_id"],
                "direction": doc["direction"],
                "from_number": doc["from_number"],
                "to_number": doc["to_number"],
                "status": doc["status"],
                "duration_seconds": doc.get("duration_seconds", 0),
                "created_at": doc["created_at"].isoformat(),
            })
        return {"items": items, "total": total}

    # ── Chat sessions ──────────────────────────────────────────────────────

    async def list_chats(self, skip: int = 0, limit: int = 50) -> dict:
        total = await self._db.chat_sessions.count_documents({})
        cursor = self._db.chat_sessions.find(
            {}, {"_id": 1, "title": 1, "messages": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1).skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            messages = doc.get("messages", [])
            items.append({
                "session_id": str(doc["_id"]),
                "title": doc.get("title", ""),
                "message_count": len(messages),
                "created_at": doc["created_at"].isoformat(),
                "updated_at": doc["updated_at"].isoformat(),
            })
        return {"items": items, "total": total}

    # ── Voice sessions ─────────────────────────────────────────────────────

    async def list_voice(self, skip: int = 0, limit: int = 50) -> dict:
        total = await self._db.voice_sessions.count_documents({})
        cursor = self._db.voice_sessions.find({}).sort("started_at", -1).skip(skip).limit(limit)
        items = []
        async for doc in cursor:
            items.append({
                "session_id": str(doc["_id"]),
                "room_name": doc.get("room_name", ""),
                "status": doc.get("status", ""),
                "started_at": doc["started_at"].isoformat(),
                "ended_at": doc["ended_at"].isoformat() if doc.get("ended_at") else None,
                "transcript_count": len(doc.get("transcript", [])),
            })
        return {"items": items, "total": total}

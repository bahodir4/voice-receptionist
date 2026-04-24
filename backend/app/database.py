from __future__ import annotations

from loguru import logger
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings


class Database:
    """Singleton Motor client wrapper with connection pooling and TTL indexes."""

    _client: AsyncIOMotorClient | None = None
    _db: AsyncIOMotorDatabase | None = None

    # ── Lifecycle ──────────────────────────────────────────────────────────

    @classmethod
    async def connect(cls) -> None:
        settings = get_settings()
        cls._client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5_000,
            connectTimeoutMS=5_000,
            socketTimeoutMS=10_000,
            maxPoolSize=50,
            minPoolSize=5,
            retryWrites=True,
        )
        cls._db = cls._client[settings.MONGODB_DB_NAME]
        await cls._client.admin.command("ping")
        await cls._ensure_indexes()
        logger.info("MongoDB connected — db={}", settings.MONGODB_DB_NAME)

    @classmethod
    async def disconnect(cls) -> None:
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB disconnected")

    # ── Index bootstrap ────────────────────────────────────────────────────

    @classmethod
    async def _ensure_indexes(cls) -> None:
        db = cls._db

        # users
        await db.users.create_index("email", unique=True)
        await db.users.create_index("username", unique=True)

        # sessions — TTL index auto-deletes expired rows
        await db.sessions.create_index("user_id")
        await db.sessions.create_index("expires_at", expireAfterSeconds=0)

        # email_tokens — TTL index auto-deletes expired rows
        await db.email_tokens.create_index("token", unique=True)
        await db.email_tokens.create_index("user_id")
        await db.email_tokens.create_index("expires_at", expireAfterSeconds=0)

        # chat_sessions
        await db.chat_sessions.create_index("user_id")
        await db.chat_sessions.create_index([("user_id", 1), ("created_at", -1)])
        await db.chat_sessions.create_index("status")

        # phone_calls
        await db.phone_calls.create_index("call_id", unique=True)
        await db.phone_calls.create_index([("created_at", -1)])
        await db.phone_calls.create_index("status")
        await db.phone_calls.create_index("direction")

        # voice_sessions
        await db.voice_sessions.create_index("user_id")
        await db.voice_sessions.create_index([("started_at", -1)])
        await db.voice_sessions.create_index("status")

        # business_settings (single doc — no compound index needed)
        await db.business_settings.create_index("_id")

        logger.info("MongoDB indexes ensured")

    # ── Accessor ───────────────────────────────────────────────────────────

    @classmethod
    def get(cls) -> AsyncIOMotorDatabase:
        if cls._db is None:
            raise RuntimeError("Database not initialised — call Database.connect() first")
        return cls._db


async def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency."""
    return Database.get()

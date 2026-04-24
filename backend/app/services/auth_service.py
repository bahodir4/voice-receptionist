from __future__ import annotations

from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from loguru import logger

from app.core.config import get_settings
from app.core.security import SecurityService
from app.services.email_service import EmailService

_TOKEN_EXPIRE_VERIFY = timedelta(hours=24)
_TOKEN_EXPIRE_RESET = timedelta(hours=1)


class AuthService:
    """All authentication business logic — no HTTP concerns."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db
        self._security = SecurityService()
        self._email = EmailService()
        self._settings = get_settings()

    # ── Register ───────────────────────────────────────────────────────────

    async def register(self, username: str, email: str, password: str) -> dict:
        if await self._db.users.find_one({"email": email}):
            raise ValueError("Email already registered")
        if await self._db.users.find_one({"username": username}):
            raise ValueError("Username already taken")

        hashed = SecurityService.hash_password(password)
        now = datetime.now(timezone.utc)
        user = {
            "username": username,
            "email": email,
            "password_hash": hashed,
            "is_verified": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = await self._db.users.insert_one(user)
        user_id = str(result.inserted_id)

        token = await self._create_email_token(user_id, "verify", _TOKEN_EXPIRE_VERIFY)

        try:
            await self._email.send_verification_email(email, username, token)
        except Exception:
            logger.warning("Verification email failed for {} — continuing", email)

        return {"id": user_id, "email": email, "username": username, "is_verified": False, "created_at": now}

    # ── Verify email ───────────────────────────────────────────────────────

    async def verify_email(self, token: str) -> dict:
        record = await self._db.email_tokens.find_one({"token": token, "purpose": "verify"})
        if not record:
            raise ValueError("Invalid or expired verification token")

        from bson import ObjectId
        user = await self._db.users.find_one({"_id": ObjectId(record["user_id"])})
        if not user:
            raise ValueError("User not found")
        if user.get("is_verified"):
            raise ValueError("Email already verified")

        await self._db.users.update_one(
            {"_id": ObjectId(record["user_id"])},
            {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}},
        )
        await self._db.email_tokens.delete_one({"_id": record["_id"]})

        return self._format_user(user, override={"is_verified": True})

    # ── Login ──────────────────────────────────────────────────────────────

    async def login(self, email: str, password: str, remember_me: bool = False) -> dict:
        user = await self._db.users.find_one({"email": email})
        if not user:
            logger.debug("Login failed — no user found for email={}", email)
            raise ValueError("Invalid email or password")
        if not SecurityService.verify_password(password, user["password_hash"]):
            logger.debug("Login failed — wrong password for email={}", email)
            raise ValueError("Invalid email or password")
        if not user.get("is_active", True):
            logger.debug("Login failed — account disabled email={}", email)
            raise ValueError("Account disabled")
        if not user.get("is_verified", False):
            logger.debug("Login failed — email not verified email={}", email)
            raise ValueError("Please verify your email before logging in")

        user_id = str(user["_id"])
        expire_hours = self._settings.JWT_EXPIRE_HOURS * (24 if remember_me else 1)
        access_token = SecurityService.create_access_token(user_id, expire_hours=expire_hours)

        now = datetime.now(timezone.utc)
        await self._db.sessions.insert_one({
            "user_id": user_id,
            "token_prefix": access_token[:16],
            "created_at": now,
            "expires_at": now + timedelta(hours=expire_hours),
        })

        return {"access_token": access_token, "user": self._format_user(user)}

    # ── Logout ─────────────────────────────────────────────────────────────

    async def logout(self, user_id: str, token_prefix: str) -> None:
        await self._db.sessions.delete_one({"user_id": user_id, "token_prefix": token_prefix})

    # ── Forgot password ────────────────────────────────────────────────────

    async def forgot_password(self, email: str) -> None:
        user = await self._db.users.find_one({"email": email})
        if not user:
            return  # silent — never leak whether email exists

        user_id = str(user["_id"])
        await self._db.email_tokens.delete_many({"user_id": user_id, "purpose": "reset"})
        token = await self._create_email_token(user_id, "reset", _TOKEN_EXPIRE_RESET)

        try:
            await self._email.send_password_reset_email(email, user["username"], token)
        except Exception:
            logger.warning("Reset email failed for {}", email)

    # ── Reset password ─────────────────────────────────────────────────────

    async def reset_password(self, token: str, new_password: str) -> None:
        record = await self._db.email_tokens.find_one({"token": token, "purpose": "reset"})
        if not record:
            raise ValueError("Invalid or expired reset token")

        from bson import ObjectId
        hashed = SecurityService.hash_password(new_password)
        await self._db.users.update_one(
            {"_id": ObjectId(record["user_id"])},
            {"$set": {"password_hash": hashed, "updated_at": datetime.now(timezone.utc)}},
        )
        await self._db.email_tokens.delete_one({"_id": record["_id"]})
        await self._db.sessions.delete_many({"user_id": record["user_id"]})

    # ── Get me ─────────────────────────────────────────────────────────────

    async def get_me(self, user_id: str) -> dict:
        from bson import ObjectId
        user = await self._db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError("User not found")
        return self._format_user(user)

    # ── Helpers ────────────────────────────────────────────────────────────

    async def _create_email_token(self, user_id: str, purpose: str, ttl: timedelta) -> str:
        token = SecurityService.generate_token()
        now = datetime.now(timezone.utc)
        await self._db.email_tokens.insert_one({
            "user_id": user_id,
            "token": token,
            "purpose": purpose,
            "created_at": now,
            "expires_at": now + ttl,
        })
        return token

    @staticmethod
    def _format_user(user: dict, override: dict | None = None) -> dict:
        data = {
            "id": str(user["_id"]),
            "email": user["email"],
            "username": user["username"],
            "is_verified": user.get("is_verified", False),
            "created_at": user["created_at"],
        }
        if override:
            data.update(override)
        return data

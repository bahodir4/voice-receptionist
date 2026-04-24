from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

_pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityService:
    """Stateless utility class for passwords and JWT."""

    # ── Passwords ──────────────────────────────────────────────────────────

    @staticmethod
    def hash_password(plain: str) -> str:
        return _pwd_ctx.hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return _pwd_ctx.verify(plain, hashed)

    # ── JWT ────────────────────────────────────────────────────────────────

    @staticmethod
    def create_access_token(
        subject: str,
        extra: dict[str, Any] | None = None,
        expire_hours: int | None = None,
    ) -> str:
        settings = get_settings()
        hours = expire_hours if expire_hours is not None else settings.JWT_EXPIRE_HOURS
        expire = datetime.now(timezone.utc) + timedelta(hours=hours)
        payload: dict[str, Any] = {
            "sub": subject,
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access",
        }
        if extra:
            payload.update(extra)
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def decode_access_token(token: str) -> dict[str, Any]:
        settings = get_settings()
        try:
            return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        except JWTError as exc:
            raise ValueError(f"Invalid token: {exc}") from exc

    # ── Random tokens ──────────────────────────────────────────────────────

    @staticmethod
    def generate_token(length: int = 64) -> str:
        return secrets.token_urlsafe(length)

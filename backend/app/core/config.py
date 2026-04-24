from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── MongoDB ────────────────────────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "voice_receptionist"

    # ── JWT ───────────────────────────────────────────────────────────────
    JWT_SECRET: str = "change-me-in-production-use-32-char-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # ── SMTP (Gmail App Password recommended) ─────────────────────────────
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587

    # ── App ───────────────────────────────────────────────────────────────
    APP_NAME: str = "Voice Receptionist"
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    DEBUG: bool = True

    # ── LiveKit (Phase 2) ─────────────────────────────────────────────────
    LIVEKIT_URL: str = ""
    LIVEKIT_API_KEY: str = ""
    LIVEKIT_API_SECRET: str = ""

    # ── Groq LLM (Phase 2) ────────────────────────────────────────────────
    GROK_API_KEY: str = ""
    GROK_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROK_MODEL: str = "llama-3.3-70b-versatile"

    # ── ElevenLabs (Phase 2) ──────────────────────────────────────────────
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"

    # ── Twilio / SIP (Phase 4) ────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # LiveKit SIP — provisioned once via LiveKit console / CLI
    LIVEKIT_SIP_DOMAIN: str = ""               # e.g. abc123.sip.livekit.cloud
    LIVEKIT_SIP_INBOUND_TRUNK_ID: str = ""     # created once via lk sip inbound create
    LIVEKIT_SIP_OUTBOUND_TRUNK_ID: str = ""    # created once via lk sip outbound create
    TWILIO_SIP_USERNAME: str = ""              # auth username for inbound SIP trunk
    TWILIO_SIP_PASSWORD: str = ""              # auth password for inbound SIP trunk

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

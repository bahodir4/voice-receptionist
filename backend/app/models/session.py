from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TranscriptTurn(BaseModel):
    role: Literal["user", "agent"]
    text: str
    timestamp: datetime


class VoiceTokenRequest(BaseModel):
    room_name: str | None = None


class VoiceTokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str


class SessionEndRequest(BaseModel):
    room_name: str


class SessionEndResponse(BaseModel):
    session_id: str
    duration_seconds: float
    transcript: list[TranscriptTurn]

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ── Sub-documents ──────────────────────────────────────────────────────────────

class ChatMessageSchema(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    timestamp: datetime


# ── Request schemas ────────────────────────────────────────────────────────────

class ChatMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4_000)


# ── Response schemas ───────────────────────────────────────────────────────────

class ChatSessionCreateResponse(BaseModel):
    session_id: str
    created_at: datetime


class ChatSessionResponse(BaseModel):
    session_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageSchema]

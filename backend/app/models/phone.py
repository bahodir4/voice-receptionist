from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

CallStatus = Literal[
    "initiated", "ringing", "in-progress",
    "completed", "failed", "no-answer", "busy", "canceled",
]
CallDirection = Literal["inbound", "outbound"]


class PhoneCallRecord(BaseModel):
    call_id: str
    direction: CallDirection
    from_number: str
    to_number: str
    status: CallStatus
    duration_seconds: int = 0
    room_name: str
    created_at: datetime
    updated_at: datetime


class OutboundCallRequest(BaseModel):
    to_number: str = Field(
        min_length=7,
        max_length=20,
        description="E.164 format, e.g. +12025551234",
    )


class OutboundCallResponse(BaseModel):
    call_id: str
    room_name: str
    status: CallStatus
    created_at: datetime


class CallListResponse(BaseModel):
    calls: list[PhoneCallRecord]
    total: int

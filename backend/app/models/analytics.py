from __future__ import annotations

from pydantic import BaseModel


class DayCount(BaseModel):
    phone_calls: int = 0
    voice_sessions: int = 0
    chat_sessions: int = 0
    total: int = 0


class ChartPoint(BaseModel):
    date: str          # YYYY-MM-DD
    phone_calls: int = 0
    voice_sessions: int = 0
    chat_sessions: int = 0


class AnalyticsOverview(BaseModel):
    today: DayCount
    all_time: DayCount
    avg_call_duration: int = 0   # seconds
    chart: list[ChartPoint] = []


class CallLogItem(BaseModel):
    call_id: str
    direction: str
    from_number: str
    to_number: str
    status: str
    duration_seconds: int = 0
    created_at: str


class CallLogResponse(BaseModel):
    items: list[CallLogItem]
    total: int


class ChatSessionItem(BaseModel):
    session_id: str
    title: str
    message_count: int
    created_at: str
    updated_at: str


class ChatSessionsResponse(BaseModel):
    items: list[ChatSessionItem]
    total: int


class VoiceSessionItem(BaseModel):
    session_id: str
    room_name: str
    status: str
    started_at: str
    ended_at: str | None
    transcript_count: int


class VoiceSessionsResponse(BaseModel):
    items: list[VoiceSessionItem]
    total: int

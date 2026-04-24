from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.chat import (
    ChatMessageRequest,
    ChatSessionCreateResponse,
    ChatSessionResponse,
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _svc(db: AsyncIOMotorDatabase = Depends(get_database)) -> ChatService:
    return ChatService(db)


# ── Create session ─────────────────────────────────────────────────────────────

@router.post(
    "/sessions",
    response_model=ChatSessionCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    current_user: dict = Depends(get_current_user),
    svc: ChatService = Depends(_svc),
) -> ChatSessionCreateResponse:
    result = await svc.create_session(current_user["id"])
    return ChatSessionCreateResponse(**result)


# ── Get session history ────────────────────────────────────────────────────────

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    svc: ChatService = Depends(_svc),
) -> ChatSessionResponse:
    try:
        data = await svc.get_session(session_id, current_user["id"])
        return ChatSessionResponse(**data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


# ── Send message (streaming SSE) ───────────────────────────────────────────────

@router.post("/sessions/{session_id}/messages", status_code=status.HTTP_200_OK)
async def send_message(
    session_id: str,
    body: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    svc: ChatService = Depends(_svc),
) -> StreamingResponse:
    try:
        # Validate session ownership before opening the stream
        await svc.get_session(session_id, current_user["id"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return StreamingResponse(
        svc.stream_response(session_id, current_user["id"], body.content),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Delete session ─────────────────────────────────────────────────────────────

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    svc: ChatService = Depends(_svc),
) -> Response:
    try:
        await svc.delete_session(session_id, current_user["id"])
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

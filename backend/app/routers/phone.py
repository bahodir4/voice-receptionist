from __future__ import annotations

import traceback

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.phone import (
    CallListResponse,
    OutboundCallRequest,
    OutboundCallResponse,
    PhoneCallRecord,
)
from app.services.phone_service import PhoneService

router = APIRouter(prefix="/api/phone", tags=["phone"])


def _svc(db: AsyncIOMotorDatabase = Depends(get_database)) -> PhoneService:
    return PhoneService(db)


# ── Twilio inbound webhook ─────────────────────────────────────────────────────

@router.post("/webhook/twilio", include_in_schema=False)
async def twilio_inbound_webhook(
    request: Request,
    svc: PhoneService = Depends(_svc),
) -> Response:
    form = await request.form()
    twiml = await svc.handle_inbound_webhook(
        from_number=str(form.get("From", "")),
        to_number=str(form.get("To", "")),
        call_sid=str(form.get("CallSid", "")),
    )
    return Response(content=twiml, media_type="text/xml")


# ── Twilio status callback ─────────────────────────────────────────────────────

@router.post("/webhook/twilio/status", include_in_schema=False)
async def twilio_status_callback(
    request: Request,
    svc: PhoneService = Depends(_svc),
) -> Response:
    form = await request.form()
    await svc.handle_status_callback(
        call_sid=str(form.get("CallSid", "")),
        call_status=str(form.get("CallStatus", "")),
        call_duration=form.get("CallDuration"),  # type: ignore[arg-type]
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Outbound call ──────────────────────────────────────────────────────────────

@router.post(
    "/calls/outbound",
    response_model=OutboundCallResponse,
    status_code=status.HTTP_201_CREATED,
)
async def initiate_outbound_call(
    body: OutboundCallRequest,
    current_user: dict = Depends(get_current_user),
    svc: PhoneService = Depends(_svc),
) -> OutboundCallResponse:
    try:
        result = await svc.initiate_outbound(current_user["id"], body.to_number)
        return OutboundCallResponse(**result)
    except Exception as exc:
        logger.error("Outbound call failed: {}\n{}", exc, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))


# ── Call history ───────────────────────────────────────────────────────────────

@router.get("/calls", response_model=CallListResponse)
async def list_calls(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    svc: PhoneService = Depends(_svc),
) -> CallListResponse:
    data = await svc.list_calls(skip=skip, limit=limit)
    return CallListResponse(
        calls=[PhoneCallRecord(**c) for c in data["calls"]],
        total=data["total"],
    )


# ── Get single call ────────────────────────────────────────────────────────────

@router.get("/calls/{call_id}", response_model=PhoneCallRecord)
async def get_call(
    call_id: str,
    _current_user: dict = Depends(get_current_user),
    svc: PhoneService = Depends(_svc),
) -> PhoneCallRecord:
    doc = await svc.get_call(call_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Call not found")
    return PhoneCallRecord(**doc)

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_database
from app.middleware.auth_middleware import get_current_user
from app.models.user import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _svc(db: AsyncIOMotorDatabase = Depends(get_database)) -> AuthService:
    return AuthService(db)


# ── Register ───────────────────────────────────────────────────────────────────

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, svc: AuthService = Depends(_svc)) -> MessageResponse:
    try:
        await svc.register(body.username, body.email, body.password)
        return MessageResponse(message="Account created. Check your email to verify your account.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


# ── Verify email ───────────────────────────────────────────────────────────────

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(body: VerifyEmailRequest, svc: AuthService = Depends(_svc)) -> MessageResponse:
    try:
        await svc.verify_email(body.token)
        return MessageResponse(message="Email verified successfully. You can now log in.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, svc: AuthService = Depends(_svc)) -> TokenResponse:
    try:
        result = await svc.login(body.email, body.password, body.remember_me)
        return TokenResponse(
            access_token=result["access_token"],
            user=UserResponse(**result["user"]),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


# ── Logout ─────────────────────────────────────────────────────────────────────

@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: dict = Depends(get_current_user),
    svc: AuthService = Depends(_svc),
) -> MessageResponse:
    await svc.logout(current_user["id"], current_user["_token"][:16])
    return MessageResponse(message="Logged out successfully.")


# ── Forgot password ────────────────────────────────────────────────────────────

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, svc: AuthService = Depends(_svc)) -> MessageResponse:
    await svc.forgot_password(body.email)
    return MessageResponse(message="If that email exists, a reset link has been sent.")


# ── Reset password ─────────────────────────────────────────────────────────────

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, svc: AuthService = Depends(_svc)) -> MessageResponse:
    try:
        await svc.reset_password(body.token, body.password)
        return MessageResponse(message="Password reset successfully. You can now log in.")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# ── Get current user ───────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: dict = Depends(get_current_user),
    svc: AuthService = Depends(_svc),
) -> UserResponse:
    try:
        user = await svc.get_me(current_user["id"])
        return UserResponse(**user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

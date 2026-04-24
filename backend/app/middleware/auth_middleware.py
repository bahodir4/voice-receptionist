from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import SecurityService
from app.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    token = credentials.credentials
    try:
        payload = SecurityService.decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id: str = payload.get("sub", "")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token")

    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled")

    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "username": user["username"],
        "is_verified": user.get("is_verified", False),
        "created_at": user["created_at"],
        "_token": token,
    }

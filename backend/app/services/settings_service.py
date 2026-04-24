from __future__ import annotations

from datetime import datetime, timezone

from loguru import logger
from motor.motor_asyncio import AsyncIOMotorDatabase

_SETTINGS_ID = "default"

_DEFAULT: dict = {
    "_id": _SETTINGS_ID,
    "business_name": "",
    "business_hours": "",
    "business_address": "",
    "business_phone": "",
    "business_email": "",
    "business_description": "",
    "custom_instructions": "",
    "faqs": [],
    "updated_at": None,
}


class SettingsService:
    """CRUD for the single business-settings document."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self._db = db

    async def get(self) -> dict:
        doc = await self._db.business_settings.find_one({"_id": _SETTINGS_ID})
        return self._fmt(doc if doc else _DEFAULT)

    async def update(self, data: dict) -> dict:
        data.pop("_id", None)
        data["updated_at"] = datetime.now(timezone.utc)
        await self._db.business_settings.replace_one(
            {"_id": _SETTINGS_ID},
            {"_id": _SETTINGS_ID, **data},
            upsert=True,
        )
        logger.info("Business settings updated")
        return await self.get()

    @staticmethod
    def _fmt(doc: dict) -> dict:
        out = {k: v for k, v in doc.items() if k != "_id"}
        if out.get("updated_at") and hasattr(out["updated_at"], "isoformat"):
            out["updated_at"] = out["updated_at"].isoformat()
        return out

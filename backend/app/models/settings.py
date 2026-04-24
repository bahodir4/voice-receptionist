from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FAQ(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class BusinessSettings(BaseModel):
    business_name: str = ""
    business_hours: str = ""
    business_address: str = ""
    business_phone: str = ""
    business_email: str = ""
    business_description: str = ""
    custom_instructions: str = ""
    faqs: list[FAQ] = []
    updated_at: Optional[datetime] = None

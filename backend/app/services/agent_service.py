from __future__ import annotations

from loguru import logger
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import get_settings

_BASE_PROMPT = """You are a professional AI voice receptionist for a business.

Your personality:
- Warm, polite, and highly professional at all times
- Concise — keep responses short and natural for voice (2-3 sentences max per turn)
- Never use markdown, bullet points, or symbols — speak in plain conversational language
- If you don't know something specific about the business, offer to take a message or connect to a human

Your capabilities:
- Greet callers and understand the reason for their call
- Answer frequently asked questions about the business
- Schedule appointments (ask for name, preferred date/time, and contact info)
- Take messages when staff are unavailable
- Transfer to a human agent when the caller requests it or the issue is complex

Important rules:
- Never make up specific business hours, addresses, or staff names unless configured
- If asked something you cannot help with, say so clearly and offer alternatives
- Keep the conversation focused — don't go off-topic
- Speak naturally — use contractions, vary sentence length, sound human
"""


def build_system_prompt(settings: dict | None = None) -> str:
    """Combine the base prompt with live business settings from the database."""
    prompt = _BASE_PROMPT

    if not settings:
        return prompt

    info_lines: list[str] = []
    if settings.get("business_name"):
        info_lines.append(f"Business name: {settings['business_name']}")
    if settings.get("business_hours"):
        info_lines.append(f"Business hours: {settings['business_hours']}")
    if settings.get("business_address"):
        info_lines.append(f"Address: {settings['business_address']}")
    if settings.get("business_phone"):
        info_lines.append(f"Phone: {settings['business_phone']}")
    if settings.get("business_email"):
        info_lines.append(f"Email: {settings['business_email']}")
    if settings.get("business_description"):
        info_lines.append(f"About: {settings['business_description']}")

    if info_lines:
        prompt += "\n\nBusiness information:\n" + "\n".join(f"- {l}" for l in info_lines)

    faqs = settings.get("faqs", [])
    if faqs:
        faq_block = "\n".join(f"Q: {f['question']}\nA: {f['answer']}" for f in faqs)
        prompt += f"\n\nFrequently Asked Questions:\n{faq_block}"

    if settings.get("custom_instructions"):
        prompt += f"\n\nAdditional instructions:\n{settings['custom_instructions']}"

    return prompt


async def load_business_settings() -> dict | None:
    """Connect to MongoDB and return the business settings document."""
    s = get_settings()
    try:
        client = AsyncIOMotorClient(s.MONGODB_URI, serverSelectionTimeoutMS=3_000)
        db = client[s.MONGODB_DB_NAME]
        doc = await db.business_settings.find_one({"_id": "default"})
        client.close()
        return doc
    except Exception as exc:
        logger.warning("Could not load business settings: {}", exc)
        return None


def get_system_prompt() -> str:
    """Sync fallback — returns base prompt without DB settings."""
    return _BASE_PROMPT


def get_agent_config() -> dict:
    s = get_settings()
    return {
        "livekit_url": s.LIVEKIT_URL,
        "livekit_api_key": s.LIVEKIT_API_KEY,
        "livekit_api_secret": s.LIVEKIT_API_SECRET,
        "grok_api_key": s.GROK_API_KEY,
        "grok_model": s.GROK_MODEL,
        "grok_base_url": s.GROK_BASE_URL,
        "elevenlabs_api_key": s.ELEVENLABS_API_KEY,
        "elevenlabs_voice_id": s.ELEVENLABS_VOICE_ID,
        "elevenlabs_model_id": s.ELEVENLABS_MODEL_ID,
    }

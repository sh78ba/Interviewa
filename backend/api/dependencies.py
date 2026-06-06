from fastapi import Header
from core.config import settings

async def get_user_session(x_user_session_id: str = Header("local")) -> str:
    return x_user_session_id

async def get_ai_credentials(
    x_ai_service_url: str | None = Header(None),
    x_groq_api_key: str | None = Header(None)
) -> dict:
    return {
        "ai_service_url": x_ai_service_url or settings.ai_service_url,
        "groq_api_key": x_groq_api_key or settings.groq_api_key
    }

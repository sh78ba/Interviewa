import httpx
from core.config import settings

async def transcribe(audio_bytes: bytes) -> str:
    """Send audio to Colab Whisper, get transcript."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{settings.ai_service_url}/transcribe",
            files={"audio": ("audio.webm", audio_bytes, "audio/webm")},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        return r.json().get("text", "")

async def speak(text: str) -> bytes:
    """Send text to Colab TTS, get MP3 audio bytes back."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{settings.ai_service_url}/speak",
            json={"text": text},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        return r.content
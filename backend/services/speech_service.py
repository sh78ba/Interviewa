import httpx
from core.config import settings

async def transcribe(audio_bytes: bytes, ai_service_url: str = None) -> str:
    """Send audio to Colab Whisper, get transcript."""
    url = ai_service_url or settings.ai_service_url
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.post(
            f"{url}/transcribe",
            files={"audio": ("audio.webm", audio_bytes, "audio/webm")},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        return r.json().get("text", "")

async def speak(text: str, ai_service_url: str = None) -> bytes:
    """Send text to Colab TTS, get MP3 audio bytes back."""
    url = ai_service_url or settings.ai_service_url
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{url}/speak",
            json={"text": text},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        return r.content
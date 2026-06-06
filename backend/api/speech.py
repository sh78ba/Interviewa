from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import Response
from services.speech_service import transcribe, speak
from api.dependencies import get_ai_credentials

router = APIRouter(prefix="/api/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    creds: dict = Depends(get_ai_credentials)
):
    audio_bytes = await audio.read()
    text = await transcribe(audio_bytes, ai_service_url=creds["ai_service_url"])
    return {"text": text}

@router.post("/speak")
async def text_to_speech(
    body: dict,
    creds: dict = Depends(get_ai_credentials)
):
    audio_bytes = await speak(body.get("text", ""), ai_service_url=creds["ai_service_url"])
    return Response(content=audio_bytes, media_type="audio/mpeg")
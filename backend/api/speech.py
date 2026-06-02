from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response
from services.speech_service import transcribe, speak

router = APIRouter(prefix="/api/speech", tags=["speech"])

@router.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    text = await transcribe(audio_bytes)
    return {"text": text}

@router.post("/speak")
async def text_to_speech(body: dict):
    audio_bytes = await speak(body.get("text", ""))
    return Response(content=audio_bytes, media_type="audio/mpeg")
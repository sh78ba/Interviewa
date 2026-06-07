from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.database import init_db
from api.interview import router as interview_router
from api.speech import router as speech_router
from core.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="Interviewa API", version="1.0.0", lifespan=lifespan)

allowed_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(interview_router)
app.include_router(speech_router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Interviewa API"}
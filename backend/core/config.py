from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_service_url: str
    database_url: str
    redis_url: str
    groq_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    class Config:
        # Resolve backend/.env relative to this file so settings load
        # correctly regardless of the current working directory.
        env_file = str((Path(__file__).resolve().parent.parent / ".env"))
        extra = "allow"


settings = Settings()
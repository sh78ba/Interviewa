from pathlib import Path
from pydantic import field_validator, Field, AliasChoices
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_service_url: str = Field("", validation_alias=AliasChoices("INTERVIEWA_AI_SERVICE_URL", "AI_SERVICE_URL"))
    database_url: str = Field(validation_alias=AliasChoices("INTERVIEWA_DATABASE_URL", "DATABASE_URL"))
    redis_url: str = Field(validation_alias=AliasChoices("INTERVIEWA_REDIS_URL", "REDIS_URL"))
    groq_api_key: str = Field("", validation_alias=AliasChoices("INTERVIEWA_GROQ_API_KEY", "GROQ_API_KEY"))
    cors_origins: str = Field("http://localhost:3000", validation_alias=AliasChoices("INTERVIEWA_CORS_ORIGINS", "CORS_ORIGINS"))
    langfuse_public_key: str = Field("", validation_alias=AliasChoices("INTERVIEWA_LANGFUSE_PUBLIC_KEY", "LANGFUSE_PUBLIC_KEY"))
    langfuse_secret_key: str = Field("", validation_alias=AliasChoices("INTERVIEWA_LANGFUSE_SECRET_KEY", "LANGFUSE_SECRET_KEY"))
    chroma_host: str = Field("localhost", validation_alias=AliasChoices("INTERVIEWA_CHROMA_HOST", "CHROMA_HOST"))
    chroma_port: int = Field(8001, validation_alias=AliasChoices("INTERVIEWA_CHROMA_PORT", "CHROMA_PORT"))

    @field_validator("database_url", mode="before")
    @classmethod
    def format_database_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        # Resolve backend/.env relative to this file so settings load
        # correctly regardless of the current working directory.
        env_file = str((Path(__file__).resolve().parent.parent / ".env"))
        extra = "allow"


settings = Settings()
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ai_service_url: str
    database_url: str
    redis_url: str
    jwt_secret: str
    jwt_expire_minutes: int = 1440
    groq_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    class Config:
        env_file = "../.env"
        extra = "allow"

settings = Settings()
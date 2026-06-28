from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import text, event
from core.config import settings

# Configure SQLite specific options to prevent 'database is locked' errors
connect_args = {}
if "sqlite" in settings.database_url:
    connect_args["timeout"] = 30.0

engine = create_async_engine(
    settings.database_url,
    echo=False,
    connect_args=connect_args
)

if "sqlite" in settings.database_url:
    @event.listens_for(engine.sync_engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.close()

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE interviews ADD COLUMN company VARCHAR DEFAULT '';"))
        except Exception:
            pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
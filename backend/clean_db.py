import asyncio
from sqlalchemy import text
from core.database import engine

async def clean_database():
    print("Starting database cleanup...")
    try:
        async with engine.begin() as conn:
            # Delete all records from the tables
            await conn.execute(text("DELETE FROM answers;"))
            await conn.execute(text("DELETE FROM questions;"))
            await conn.execute(text("DELETE FROM reports;"))
            await conn.execute(text("DELETE FROM interviews;"))
        print("Database cleanup completed successfully.")
    except Exception as e:
        print(f"Error during database cleanup: {e}")

if __name__ == "__main__":
    asyncio.run(clean_database())

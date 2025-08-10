import asyncio
from typing import AsyncGenerator
from sqlalchemy import create_engine, select
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Base class for models
Base = declarative_base()

# Database engine
engine = create_engine(
    settings.database_url or "sqlite:///./reservations.db",
    connect_args={"check_same_thread": False} if "sqlite" in (settings.database_url or "") else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


async def get_async_db() -> AsyncGenerator[Session, None]:
    """Async database dependency using asyncio"""
    loop = asyncio.get_event_loop()
    
    def get_sync_db():
        db = SessionLocal()
        try:
            return db
        except Exception as e:
            db.close()
            raise e
    
    # Run sync database operations in thread pool
    db = await loop.run_in_executor(None, get_sync_db)
    try:
        yield db
    finally:
        await loop.run_in_executor(None, db.close)


async def create_tables():
    """Create all tables asynchronously"""
    loop = asyncio.get_event_loop()
    
    def sync_create_tables():
        Base.metadata.create_all(bind=engine)
    
    await loop.run_in_executor(None, sync_create_tables)
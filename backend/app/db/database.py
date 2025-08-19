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


async def init_admin_data():
    """Initialize admin data if not exists"""
    loop = asyncio.get_event_loop()
    
    def sync_init_admin_data():
        from app.models.admin import Admin
        
        db = SessionLocal()
        try:
            # 관리자 데이터가 이미 존재하는지 확인
            existing_admins = db.query(Admin).first()
            if existing_admins:
                return  # 이미 데이터가 있으면 초기화하지 않음
            
            # 초기 관리자 데이터 삽입
            initial_admins = [
                Admin(admin_id=1, name="최분옥", phone="010-7102-2552"),
                Admin(admin_id=2, name="최창환", phone="010-4872-3713"),
                Admin(admin_id=3, name="박서은", phone="010-2060-2552"),
                Admin(admin_id=4, name="박지영", phone="010-4022-2552"),
                Admin(admin_id=5, name="박태현", phone="010-3794-3420"),
            ]
            
            for admin in initial_admins:
                db.add(admin)
            
            db.commit()
        except Exception as e:
            db.rollback()
            raise e
        finally:
            db.close()
    
    await loop.run_in_executor(None, sync_init_admin_data)
import pytest
import pytest_asyncio
import asyncio
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.main import app
from app.db.database import get_async_db, Base
from datetime import date

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


async def override_get_async_db():
    loop = asyncio.get_event_loop()
    
    def get_sync_test_db():
        db = TestingSessionLocal()
        try:
            return db
        except Exception as e:
            db.close()
            raise e
    
    db = await loop.run_in_executor(None, get_sync_test_db)
    try:
        yield db
    finally:
        await loop.run_in_executor(None, db.close)


app.dependency_overrides[get_async_db] = override_get_async_db


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_database():
    loop = asyncio.get_event_loop()
    
    def sync_create_tables():
        Base.metadata.create_all(bind=test_engine)
    
    def sync_drop_tables():
        Base.metadata.drop_all(bind=test_engine)
    
    await loop.run_in_executor(None, sync_create_tables)
    yield
    await loop.run_in_executor(None, sync_drop_tables)


@pytest.mark.asyncio
async def test_create_reservation():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        reservation_data = {
            "name": "홍길동",
            "phone": "010-1234-5678",
            "start_date": "2024-03-01",
            "end_date": "2024-03-03",
            "duration": 2,
            "guests": 4,
            "purpose": "가족 휴가"
        }
        
        response = await ac.post("/api/v1/reservations/", json=reservation_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "홍길동"
        assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_get_reservations():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/reservations/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["async"] is True


@pytest.mark.asyncio
async def test_reservation_conflict():
    """예약 충돌 테스트"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 첫 번째 예약 생성
        reservation_data = {
            "name": "홍길동",
            "phone": "010-1234-5678",
            "start_date": "2024-03-01",
            "end_date": "2024-03-03",
            "duration": 2,
            "guests": 4,
            "purpose": "가족 휴가"
        }
        
        response1 = await ac.post("/api/v1/reservations/", json=reservation_data)
        assert response1.status_code == 201
        
        # 중복 날짜로 두 번째 예약 시도
        reservation_data2 = {
            "name": "김철수",
            "phone": "010-9876-5432",
            "start_date": "2024-03-02",
            "end_date": "2024-03-04",
            "duration": 2,
            "guests": 2,
            "purpose": "휴식"
        }
        
        response2 = await ac.post("/api/v1/reservations/", json=reservation_data2)
        assert response2.status_code == 409  # Conflict
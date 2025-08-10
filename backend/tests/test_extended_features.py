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
TEST_DATABASE_URL = "sqlite:///./test_extended.db"
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
async def test_create_reservation_with_password():
    """비밀번호를 포함한 예약 생성 (2번 기능)"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        reservation_data = {
            "name": "홍길동",
            "phone": "010-1234-5678",
            "start_date": "2024-08-10",
            "end_date": "2024-08-12",
            "duration": 2,
            "guests": 4,
            "purpose": "가족 휴가",
            "password": "mypass123"
        }
        
        response = await ac.post("/api/v1/reservations-extended/with-password", json=reservation_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "홍길동"
        assert data["status"] == "pending"


@pytest.mark.asyncio
async def test_verify_reservation():
    """예약자 인증 (3번 기능)"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 먼저 예약 생성
        reservation_data = {
            "name": "김철수",
            "phone": "010-5678-1234",
            "start_date": str(date.today()),
            "end_date": str(date.today()),
            "duration": 1,
            "guests": 2,
            "password": "test1234"
        }
        
        create_response = await ac.post("/api/v1/reservations-extended/with-password", json=reservation_data)
        assert create_response.status_code == 201
        
        # 인증 테스트
        verify_data = {
            "name": "김철수",
            "phone": "010-5678-1234",
            "password": "test1234"
        }
        
        verify_response = await ac.post("/api/v1/reservations-extended/verify", json=verify_data)
        assert verify_response.status_code == 200
        verify_result = verify_response.json()
        assert verify_result["verified"] is True
        assert verify_result["reservation_id"] is not None


@pytest.mark.asyncio
async def test_get_monthly_reservations():
    """월별 예약 조회 (1번 기능)"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 2024년 8월 예약 생성
        reservation_data = {
            "name": "박영희",
            "phone": "010-9876-5432",
            "start_date": "2024-08-15",
            "end_date": "2024-08-17",
            "duration": 2,
            "guests": 3,
            "password": "park123"
        }
        
        await ac.post("/api/v1/reservations-extended/with-password", json=reservation_data)
        
        # 월별 조회
        response = await ac.get("/api/v1/reservations-extended/monthly/2024/8")
        assert response.status_code == 200
        reservations = response.json()
        assert len(reservations) == 1
        assert reservations[0]["name"] == "박영희"


@pytest.mark.asyncio
async def test_admin_operations():
    """관리자 기능 테스트 (6번, 7번)"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 관리자 존재 여부 확인
        response = await ac.get("/api/v1/admins/exists/홍길동")
        assert response.status_code == 200
        assert response.json()["exists"] is False
        
        # 예약 생성
        reservation_data = {
            "name": "이순신",
            "phone": "010-1111-2222",
            "start_date": "2024-09-01",
            "end_date": "2024-09-03",
            "duration": 2,
            "guests": 4,
            "password": "admiral123"
        }
        
        create_response = await ac.post("/api/v1/reservations-extended/with-password", json=reservation_data)
        reservation_id = create_response.json()["id"]
        
        # 관리자 상태 업데이트
        admin_update = {
            "status": "confirmed",
            "admin_name": "홍길동"
        }
        
        update_response = await ac.patch(f"/api/v1/reservations-extended/{reservation_id}/admin-status", json=admin_update)
        assert update_response.status_code == 200
        updated_reservation = update_response.json()
        assert updated_reservation["status"] == "confirmed"
        assert updated_reservation["confirmed_by"] is not None
        
        # 관리자가 생성되었는지 확인
        admin_check = await ac.get("/api/v1/admins/exists/홍길동")
        assert admin_check.json()["exists"] is True


@pytest.mark.asyncio
async def test_delete_reservation_with_auth():
    """인증을 통한 예약 삭제 (5번 기능)"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # 예약 생성
        reservation_data = {
            "name": "강감찬",
            "phone": "010-3333-4444",
            "start_date": "2024-10-01",
            "end_date": "2024-10-03",
            "duration": 2,
            "guests": 2,
            "password": "general123"
        }
        
        create_response = await ac.post("/api/v1/reservations-extended/with-password", json=reservation_data)
        reservation_id = create_response.json()["id"]
        
        # 잘못된 비밀번호로 삭제 시도
        wrong_delete = {
            "reservation_id": reservation_id,
            "name": "강감찬",
            "phone": "010-3333-4444",
            "password": "wrong_password"
        }
        
        wrong_response = await ac.delete("/api/v1/reservations-extended/auth-delete", json=wrong_delete)
        assert wrong_response.status_code == 401
        
        # 올바른 비밀번호로 삭제
        correct_delete = {
            "reservation_id": reservation_id,
            "name": "강감찬",
            "phone": "010-3333-4444",
            "password": "general123"
        }
        
        correct_response = await ac.delete("/api/v1/reservations-extended/auth-delete", json=correct_delete)
        assert correct_response.status_code == 204
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
TEST_DATABASE_URL = "sqlite:///./test_structured.db"
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


class TestPublicAPI:
    """공개 API 테스트"""
    
    @pytest.mark.asyncio
    async def test_root(self):
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/api/v1/public/")
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert "version" in data
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/api/v1/public/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["async"] is True


class TestUserAPI:
    """사용자 API 테스트"""
    
    @pytest.mark.asyncio
    async def test_create_user_reservation(self):
        """사용자 예약 생성 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            reservation_data = {
                "name": "사용자",
                "phone": "010-1111-2222",
                "start_date": "2024-12-01",
                "end_date": "2024-12-03",
                "duration": 2,
                "guests": 4,
                "password": "user123"
            }
            
            response = await ac.post("/api/v1/user/reservations/", json=reservation_data)
            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "사용자"
            assert data["status"] == "pending"
    
    @pytest.mark.asyncio
    async def test_user_reservation_auth(self):
        """사용자 예약 인증 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # 예약 생성 (오늘 날짜)
            reservation_data = {
                "name": "인증테스트",
                "phone": "010-3333-4444",
                "start_date": str(date.today()),
                "end_date": str(date.today()),
                "duration": 1,
                "guests": 2,
                "password": "auth123"
            }
            
            await ac.post("/api/v1/user/reservations/", json=reservation_data)
            
            # 인증 테스트
            auth_data = {
                "name": "인증테스트",
                "phone": "010-3333-4444",
                "password": "auth123"
            }
            
            response = await ac.post("/api/v1/user/auth/verify", json=auth_data)
            assert response.status_code == 200
            data = response.json()
            assert data["verified"] is True
            assert data["reservation_id"] is not None
    
    @pytest.mark.asyncio
    async def test_get_monthly_reservations(self):
        """월별 예약 조회 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # 예약 생성
            reservation_data = {
                "name": "월별조회",
                "phone": "010-5555-6666",
                "start_date": "2024-12-15",
                "end_date": "2024-12-17",
                "duration": 2,
                "guests": 3,
                "password": "monthly123"
            }
            
            await ac.post("/api/v1/user/reservations/", json=reservation_data)
            
            # 월별 조회
            response = await ac.get("/api/v1/user/reservations/monthly/2024/12")
            assert response.status_code == 200
            reservations = response.json()
            assert len(reservations) >= 1
    
    @pytest.mark.asyncio
    async def test_user_delete_reservation(self):
        """사용자 예약 삭제 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # 예약 생성
            reservation_data = {
                "name": "삭제테스트",
                "phone": "010-7777-8888",
                "start_date": "2024-12-20",
                "end_date": "2024-12-22",
                "duration": 2,
                "guests": 2,
                "password": "delete123"
            }
            
            create_response = await ac.post("/api/v1/user/reservations/", json=reservation_data)
            reservation_id = create_response.json()["id"]
            
            # 예약 삭제
            delete_data = {
                "reservation_id": reservation_id,
                "name": "삭제테스트",
                "phone": "010-7777-8888",
                "password": "delete123"
            }
            
            response = await ac.delete("/api/v1/user/reservations/", json=delete_data)
            assert response.status_code == 204


class TestAdminAPI:
    """관리자 API 테스트"""
    
    @pytest.mark.asyncio
    async def test_admin_create_and_check(self):
        """관리자 생성 및 존재 확인 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # 관리자 존재 여부 확인 (존재하지 않음)
            response = await ac.get("/api/v1/admin/admins/exists/테스트관리자")
            assert response.status_code == 200
            assert response.json()["exists"] is False
            
            # 관리자 생성
            admin_data = {"name": "테스트관리자"}
            create_response = await ac.post("/api/v1/admin/admins/", json=admin_data)
            assert create_response.status_code == 201
            
            # 관리자 존재 여부 확인 (존재함)
            check_response = await ac.get("/api/v1/admin/admins/exists/테스트관리자")
            assert check_response.status_code == 200
            assert check_response.json()["exists"] is True
    
    @pytest.mark.asyncio
    async def test_admin_reservation_status_update(self):
        """관리자 예약 상태 변경 테스트"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # 사용자 예약 생성
            reservation_data = {
                "name": "상태변경테스트",
                "phone": "010-9999-0000",
                "start_date": "2024-12-25",
                "end_date": "2024-12-27",
                "duration": 2,
                "guests": 4,
                "password": "status123"
            }
            
            create_response = await ac.post("/api/v1/user/reservations/", json=reservation_data)
            reservation_id = create_response.json()["id"]
            
            # 관리자가 상태 변경
            status_update = {
                "status": "confirmed",
                "admin_name": "확인관리자"
            }
            
            response = await ac.patch(
                f"/api/v1/admin/reservations/{reservation_id}/status",
                json=status_update
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "confirmed"
            assert data["confirmed_by"] is not None
            
            # 관리자가 자동 생성되었는지 확인
            admin_check = await ac.get("/api/v1/admin/admins/exists/확인관리자")
            assert admin_check.json()["exists"] is True


class TestAPIStructure:
    """API 구조 테스트"""
    
    @pytest.mark.asyncio
    async def test_api_tags_structure(self):
        """API 태그 구조 확인"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/openapi.json")
            assert response.status_code == 200
            
            openapi_data = response.json()
            tags = [tag["name"] for tag in openapi_data.get("tags", [])]
            
            # 예상되는 태그들이 존재하는지 확인
            expected_tags = [
                "user-reservations", "user-auth", 
                "admin-reservations", "admin-management", 
                "public", "legacy-reservations"
            ]
            
            for tag in expected_tags:
                assert tag in tags or any(tag in existing_tag for existing_tag in tags)
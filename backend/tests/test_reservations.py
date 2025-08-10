import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.database import get_db, Base
from datetime import date

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_reservation():
    reservation_data = {
        "name": "홍길동",
        "phone": "010-1234-5678",
        "start_date": "2024-03-01",
        "end_date": "2024-03-03",
        "duration": 2,
        "guests": 4,
        "purpose": "가족 휴가"
    }
    
    response = client.post("/api/v1/reservations/", json=reservation_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "홍길동"
    assert data["status"] == "pending"

def test_get_reservations():
    response = client.get("/api/v1/reservations/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
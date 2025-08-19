from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import create_tables, init_admin_data


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시 테이블 생성
    await create_tables()
    # 초기 관리자 데이터 생성
    await init_admin_data()
    yield
    # 종료 시 정리 작업 (필요한 경우)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Ok's House 별장 예약시스템 Backend API (Structured)",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함 - 구조화된 라우팅
app.include_router(api_router, prefix="/api/v1")
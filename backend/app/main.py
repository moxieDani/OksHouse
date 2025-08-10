from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import create_tables

# Create tables on startup
create_tables()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Ok's House 별장 예약시스템 Backend API"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 포함
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Ok's House 별장 예약시스템 API", "version": settings.app_version}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
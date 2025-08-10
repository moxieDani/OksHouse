from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/")
async def root():
    """기본 정보 조회"""
    return {"message": "Ok's House 별장 예약시스템 API", "version": settings.app_version}


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy", "async": True}
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette import status
from typing import List
from app.core.config import settings


class APIKeyMiddleware(BaseHTTPMiddleware):
    """Origin 기반 API 접근 제어 미들웨어"""
    
    def __init__(self, app, excluded_paths: List[str] = None):
        super().__init__(app)
        self.excluded_paths = excluded_paths or []
        # 완전 공개 경로들 (외부 접근 허용)
        self.public_paths = [
            "/docs",
            "/redoc", 
            "/openapi.json",
        ]
        # 정확히 매칭해야 하는 공개 경로들
        self.exact_public_paths = ["/"]
        # 허용된 Origin (관리자/사용자 페이지)
        self.allowed_origins = set(settings.allowed_origins_list)
        
    async def dispatch(self, request: Request, call_next):
        """모든 API 요청에 대한 Origin 기반 접근 제어"""
        
        # 완전 공개 경로 확인 (docs, redoc 등)
        if self._is_public_path(request.url.path):
            return await call_next(request)
        
        # 추가 제외 경로 확인
        if self._is_custom_excluded_path(request.url.path):
            return await call_next(request)
        
        # 모든 API 경로에 대해 Origin 기반 검증 적용
        if request.url.path.startswith("/api/"):
            # Origin 기반 접근 허용 확인 (관리자/사용자 페이지)
            if self._is_allowed_origin(request):
                return await call_next(request)
            
            # 외부 접근 차단
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "API access is restricted to authorized origins only. Please access through the official admin or user interface.",
                    "error_code": "EXTERNAL_API_ACCESS_FORBIDDEN"
                }
            )
        
        # API가 아닌 경로는 기본 처리
        return await call_next(request)
    
    def _is_public_path(self, path: str) -> bool:
        """완전 공개 경로인지 확인"""
        # 정확히 매칭해야 하는 경로 확인
        if path in self.exact_public_paths:
            return True
        
        # 시작으로 매칭하는 경로 확인
        for public_path in self.public_paths:
            if path.startswith(public_path):
                return True
        
        return False
    
    def _is_custom_excluded_path(self, path: str) -> bool:
        """사용자 정의 제외 경로인지 확인"""
        for excluded_path in self.excluded_paths:
            if path.startswith(excluded_path):
                return True
        return False
    
    def _is_allowed_origin(self, request: Request) -> bool:
        """허용된 Origin에서의 요청인지 확인"""
        origin = request.headers.get("origin")
        referer = request.headers.get("referer")
        
        # Origin 헤더 확인
        if origin and origin in self.allowed_origins:
            return True
        
        # Referer 헤더 확인 (Origin이 없는 경우)
        if referer:
            for allowed_origin in self.allowed_origins:
                if referer.startswith(allowed_origin):
                    return True
        
        return False
    

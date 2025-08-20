from pydantic import BaseModel, Field
from typing import Optional


class AdminPhoneRequest(BaseModel):
    """관리자 전화번호 인증 요청"""
    phone: str = Field(..., description="관리자 전화번호", example="010-1234-5678")


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str = Field(..., description="액세스 토큰")
    token_type: str = Field(default="bearer", description="토큰 타입")
    admin_id: int = Field(..., description="관리자 ID")
    admin_name: str = Field(..., description="관리자 이름")
    refresh_token_renewed: Optional[bool] = Field(None, description="리프레시 토큰이 갱신되었는지 여부")
    refresh_token_expires_in: Optional[int] = Field(None, description="리프레시 토큰 만료까지 남은 시간(초)")


class AdminInfo(BaseModel):
    """현재 인증된 관리자 정보"""
    admin_id: int = Field(..., description="관리자 ID")
    name: str = Field(..., description="관리자 이름") 
    phone: str = Field(..., description="관리자 전화번호")


class RefreshTokenRequest(BaseModel):
    """리프레시 토큰 요청 (선택적)"""
    refresh_token: Optional[str] = Field(None, description="리프레시 토큰 (쿠키에서 자동 추출)")
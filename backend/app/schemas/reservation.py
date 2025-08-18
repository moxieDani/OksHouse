from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional


class ReservationBase(BaseModel):
    """예약 기본 스키마"""
    name: str = Field(..., min_length=1, description="예약자명")
    phone: str = Field(..., min_length=1, description="연락처") 
    start_date: date = Field(..., description="시작일")
    end_date: date = Field(..., description="종료일")
    duration: int = Field(..., gt=0, description="숙박일수")


class ReservationCreate(ReservationBase):
    """예약 생성 스키마"""
    password: Optional[str] = Field(None, min_length=4, description="예약자 비밀번호")


class ReservationWithAuth(BaseModel):
    """예약 인증 스키마"""
    name: str = Field(..., min_length=1, description="예약자명")
    phone: str = Field(..., min_length=1, description="연락처")
    password: str = Field(..., min_length=4, description="예약자 비밀번호")


class ReservationDelete(ReservationWithAuth):
    """예약 삭제 스키마"""
    reservation_id: int = Field(..., description="예약 ID")


class AdminStatusUpdate(BaseModel):
    """관리자 상태 업데이트 스키마"""
    status: str = Field(..., pattern="^(pending|confirmed|cancelled)$", description="예약상태")
    admin_name: str = Field(..., min_length=1, description="관리자명")




class ReservationResponse(ReservationBase):
    """예약 응답 스키마"""
    id: int
    status: str = Field(..., description="예약상태: pending(예약대기), confirmed(예약확정), cancelled(예약취소)")
    confirmed_by: Optional[str] = Field(None, description="확정 관리자명")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True




class ReservationVerifyResponse(BaseModel):
    """예약 인증 응답 스키마"""
    reservation_id: Optional[int] = Field(None, description="인증된 예약 ID")
    verified: bool = Field(..., description="인증 성공 여부")


class UserReservationsRequest(BaseModel):
    """사용자 예약 목록 조회 요청 스키마"""
    name: str = Field(..., min_length=1, description="예약자명")
    phone: str = Field(..., min_length=1, description="연락처")


class ReservationUpdate(BaseModel):
    """예약 업데이트 스키마"""
    reservation_id: int = Field(..., description="예약 ID")
    name: str = Field(..., min_length=1, description="예약자명")
    phone: str = Field(..., min_length=1, description="연락처")
    start_date: date = Field(..., description="새로운 시작일")
    end_date: date = Field(..., description="새로운 종료일")
    duration: int = Field(..., gt=0, description="새로운 숙박일수")
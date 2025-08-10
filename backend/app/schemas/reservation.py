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
    guests: int = Field(..., gt=0, description="인원수")
    purpose: Optional[str] = Field(None, description="목적")


class ReservationCreate(ReservationBase):
    """예약 생성 스키마"""
    pass


class ReservationUpdate(BaseModel):
    """예약 업데이트 스키마"""
    status: str = Field(..., pattern="^(pending|confirmed|denied)$", description="예약상태")


class ReservationResponse(ReservationBase):
    """예약 응답 스키마"""
    id: int
    status: str = Field(..., description="예약상태: pending(예약신청), confirmed(예약확정), denied(예약거부)")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
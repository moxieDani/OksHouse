from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional
import re


class AdminBase(BaseModel):
    """관리자 기본 스키마"""
    name: str = Field(..., min_length=1, description="관리자명")
    phone: Optional[str] = Field(None, description="전화번호")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # 한국 전화번호 형식 검증 (010-1234-5678, 02-123-4567 등)
        phone_pattern = r'^(\d{2,3})-(\d{3,4})-(\d{4})$'
        if not re.match(phone_pattern, v):
            raise ValueError('전화번호는 XXX-XXXX-XXXX 형식이어야 합니다.')
        return v


class AdminCreate(AdminBase):
    """관리자 생성 스키마"""
    pass


class AdminResponse(AdminBase):
    """관리자 응답 스키마"""
    admin_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminUpdate(BaseModel):
    """관리자 정보 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, description="관리자명")
    phone: Optional[str] = Field(None, description="전화번호")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # 한국 전화번호 형식 검증 (010-1234-5678, 02-123-4567 등)
        phone_pattern = r'^(\d{2,3})-(\d{3,4})-(\d{4})$'
        if not re.match(phone_pattern, v):
            raise ValueError('전화번호는 XXX-XXXX-XXXX 형식이어야 합니다.')
        return v


class AdminCheck(BaseModel):
    """관리자 존재 확인 스키마"""
    exists: bool = Field(..., description="관리자 존재 여부")
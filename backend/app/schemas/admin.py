from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class AdminBase(BaseModel):
    """관리자 기본 스키마"""
    name: str = Field(..., min_length=1, description="관리자명")


class AdminCreate(AdminBase):
    """관리자 생성 스키마"""
    pass


class AdminResponse(AdminBase):
    """관리자 응답 스키마"""
    admin_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminCheck(BaseModel):
    """관리자 존재 확인 스키마"""
    exists: bool = Field(..., description="관리자 존재 여부")
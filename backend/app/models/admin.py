from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Admin(Base):
    """관리자 모델"""
    __tablename__ = "admins"
    
    admin_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, comment="관리자명")
    phone = Column(String, nullable=True, comment="전화번호")
    created_at = Column(DateTime, default=func.now(), comment="생성일시")
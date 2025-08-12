from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Reservation(Base):
    """예약 모델"""
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, comment="예약자명")
    phone = Column(String, nullable=False, comment="연락처")
    start_date = Column(Date, nullable=False, comment="체크인 날짜")
    end_date = Column(Date, nullable=False, comment="체크아웃 날짜")
    duration = Column(Integer, nullable=False, comment="숙박일수")
    password = Column(String, nullable=True, comment="예약자 비밀번호")
    status = Column(String, default="pending", comment="예약상태: pending, confirmed, denied")
    confirmed_by = Column(String, nullable=True, comment="확정 관리자명")
    created_at = Column(DateTime, default=func.now(), comment="생성일시")
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), comment="수정일시")
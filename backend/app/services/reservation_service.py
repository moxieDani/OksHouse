import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from app.models.reservation import Reservation
from app.schemas.reservation import ReservationCreate, ReservationUpdate
from typing import List, Optional
from datetime import date


class ReservationService:
    """예약 관련 비즈니스 로직"""
    
    @staticmethod
    async def create_reservation(db: Session, reservation: ReservationCreate) -> Reservation:
        """예약 생성"""
        loop = asyncio.get_event_loop()
        
        def sync_create():
            db_reservation = Reservation(**reservation.model_dump())
            db.add(db_reservation)
            db.commit()
            db.refresh(db_reservation)
            return db_reservation
        
        return await loop.run_in_executor(None, sync_create)
    
    @staticmethod
    async def get_reservation(db: Session, reservation_id: int) -> Optional[Reservation]:
        """예약 조회"""
        loop = asyncio.get_event_loop()
        
        def sync_get():
            return db.query(Reservation).filter(Reservation.id == reservation_id).first()
        
        return await loop.run_in_executor(None, sync_get)
    
    @staticmethod
    async def get_reservations(db: Session, skip: int = 0, limit: int = 100) -> List[Reservation]:
        """예약 목록 조회"""
        loop = asyncio.get_event_loop()
        
        def sync_get_all():
            return db.query(Reservation).offset(skip).limit(limit).all()
        
        result = await loop.run_in_executor(None, sync_get_all)
        return list(result)
    
    @staticmethod
    async def update_reservation_status(
        db: Session, 
        reservation_id: int, 
        update_data: ReservationUpdate
    ) -> Optional[Reservation]:
        """예약 상태 업데이트"""
        loop = asyncio.get_event_loop()
        
        def sync_update():
            db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
            if db_reservation:
                db_reservation.status = update_data.status
                db.commit()
                db.refresh(db_reservation)
            return db_reservation
        
        return await loop.run_in_executor(None, sync_update)
    
    @staticmethod
    async def delete_reservation(db: Session, reservation_id: int) -> bool:
        """예약 삭제"""
        loop = asyncio.get_event_loop()
        
        def sync_delete():
            db_reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
            if db_reservation:
                db.delete(db_reservation)
                db.commit()
                return True
            return False
        
        return await loop.run_in_executor(None, sync_delete)
    
    @staticmethod
    async def check_availability(
        db: Session, 
        start_date: date, 
        end_date: date, 
        exclude_id: Optional[int] = None
    ) -> bool:
        """날짜 범위 예약 가능 여부 확인"""
        loop = asyncio.get_event_loop()
        
        def sync_check():
            query = db.query(Reservation).filter(
                Reservation.status.in_(["confirmed", "pending"]),
                Reservation.start_date < end_date,
                Reservation.end_date > start_date
            )
            
            if exclude_id:
                query = query.filter(Reservation.id != exclude_id)
                
            conflicting_reservations = query.all()
            return len(conflicting_reservations) == 0
        
        return await loop.run_in_executor(None, sync_check)
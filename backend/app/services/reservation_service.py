import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from app.models.reservation import Reservation
from app.models.admin import Admin
from app.schemas.reservation import ReservationCreate, ReservationWithAuth, AdminStatusUpdate
from app.services.admin_service import AdminService
from app.core.security import encrypt_password, verify_password
from typing import List, Optional, Tuple
from datetime import date, datetime


class ReservationService:
    """확장된 예약 관련 비즈니스 로직"""
    
    @staticmethod
    async def get_reservations_by_month(db: Session, year: str, month: str) -> List[Reservation]:
        """특정 년/월 예약 조회 (1번 기능)"""
        loop = asyncio.get_event_loop()
        
        def sync_get_monthly():
            year_int = int(year)
            month_int = int(month)
            
            # 해당 월의 첫째 날과 마지막 날
            first_day = date(year_int, month_int, 1)
            if month_int == 12:
                last_day = date(year_int + 1, 1, 1)
            else:
                last_day = date(year_int, month_int + 1, 1)
            
            return db.query(Reservation).filter(
                Reservation.status.in_(["confirmed", "pending"]),
                or_(
                    # 체크인 날짜가 해당 월에 포함
                    and_(
                        extract('year', Reservation.start_date) == year_int,
                        extract('month', Reservation.start_date) == month_int
                    ),
                    # 체크아웃 날짜가 해당 월에 포함
                    and_(
                        extract('year', Reservation.end_date) == year_int,
                        extract('month', Reservation.end_date) == month_int
                    ),
                    # 예약 기간이 해당 월을 포함
                    and_(
                        Reservation.start_date <= last_day,
                        Reservation.end_date >= first_day
                    )
                )
            ).all()
        
        result = await loop.run_in_executor(None, sync_get_monthly)
        return list(result)
    
    @staticmethod
    async def add_reservation_with_password(db: Session, reservation: ReservationCreate) -> Reservation:
        """비밀번호를 포함한 예약 추가 (2번 기능)"""
        loop = asyncio.get_event_loop()
        
        def sync_add():
            reservation_data = reservation.model_dump()
            password = reservation_data.pop('password', None)
            
            # 비밀번호 암호화
            password_hash = None
            if password:
                password_hash = encrypt_password(password)
            
            db_reservation = Reservation(
                **reservation_data,
                password_hash=password_hash
            )
            db.add(db_reservation)
            db.commit()
            db.refresh(db_reservation)
            return db_reservation
        
        return await loop.run_in_executor(None, sync_add)
    
    @staticmethod
    async def verify_reservation(db: Session, auth: ReservationWithAuth) -> Optional[int]:
        """오늘 날짜 기준 예약자 인증 (3번 기능)"""
        loop = asyncio.get_event_loop()
        
        def sync_verify():
            today = date.today()
            reservations = db.query(Reservation).filter(
                Reservation.name == auth.name,
                Reservation.phone == auth.phone,
                Reservation.start_date <= today,
                Reservation.end_date >= today
            ).all()
            
            for reservation in reservations:
                if reservation.password_hash and verify_password(auth.password, reservation.password_hash):
                    return reservation.id
            return None
        
        return await loop.run_in_executor(None, sync_verify)
    
    @staticmethod
    async def delete_reservation_with_auth(
        db: Session, 
        reservation_id: int, 
        name: str, 
        phone: str, 
        password: str
    ) -> bool:
        """인증을 통한 예약 삭제 (5번 기능)"""
        loop = asyncio.get_event_loop()
        
        def sync_delete():
            reservation = db.query(Reservation).filter(
                Reservation.id == reservation_id,
                Reservation.name == name,
                Reservation.phone == phone
            ).first()
            
            if not reservation or not reservation.password_hash:
                return False
            
            if not verify_password(password, reservation.password_hash):
                return False
            
            db.delete(reservation)
            db.commit()
            return True
        
        return await loop.run_in_executor(None, sync_delete)
    
    @staticmethod
    async def update_reservation_status_by_admin(
        db: Session, 
        reservation_id: int, 
        status_update: AdminStatusUpdate
    ) -> Optional[Reservation]:
        """관리자 예약 상태 변경 (6번 기능)"""
        loop = asyncio.get_event_loop()
        
        def sync_admin_update():
            # 관리자 조회 또는 생성
            admin = db.query(Admin).filter(Admin.name == status_update.admin_name).first()
            if not admin:
                admin = Admin(name=status_update.admin_name)
                db.add(admin)
                db.commit()
                db.refresh(admin)
            
            # 예약 상태 업데이트
            reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
            if reservation:
                reservation.status = status_update.status
                reservation.confirmed_by = admin.admin_id
                db.commit()
                db.refresh(reservation)
            
            return reservation
        
        return await loop.run_in_executor(None, sync_admin_update)
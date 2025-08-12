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
            today = date.today()
            
            # 해당 월의 첫째 날과 마지막 날
            first_day = date(year_int, month_int, 1)
            if month_int == 12:
                last_day = date(year_int + 1, 1, 1)
            else:
                last_day = date(year_int, month_int + 1, 1)
            
            return db.query(Reservation).filter(
                Reservation.status.in_(["confirmed", "pending"]),
                Reservation.end_date >= today,  # 체크아웃 날짜가 오늘 이후인 예약만
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
                password=password_hash
            )
            db.add(db_reservation)
            db.commit()
            db.refresh(db_reservation)
            return db_reservation
        
        return await loop.run_in_executor(None, sync_add)
    
    @staticmethod
    async def verify_reservation(db: Session, auth: ReservationWithAuth) -> Optional[int]:
        """예약자 인증 - 해당 사용자의 모든 유효한 예약 확인 (예약 관리용)"""
        loop = asyncio.get_event_loop()
        
        def sync_verify():
            # 해당 사용자의 모든 예약을 조회 (취소되지 않은 예약)
            reservations = db.query(Reservation).filter(
                Reservation.name == auth.name,
                Reservation.phone == auth.phone,
                Reservation.status.in_(["pending", "confirmed"])  # 유효한 예약만
            ).all()
            
            for reservation in reservations:
                if reservation.password and verify_password(auth.password, reservation.password):
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
        """ID 기반 예약 삭제 (5번 기능) - 이미 인증된 사용자의 예약 삭제"""
        loop = asyncio.get_event_loop()
        
        def sync_delete():
            reservation = db.query(Reservation).filter(
                Reservation.id == reservation_id,
                Reservation.name == name,
                Reservation.phone == phone
            ).first()
            
            if not reservation:
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
    
    @staticmethod
    async def get_all_reservations_by_month_admin(db: Session, year: str, month: str) -> List[Reservation]:
        """관리자용 특정 년/월 모든 예약 조회 (8번 기능) - 상태 무관"""
        loop = asyncio.get_event_loop()
        
        def sync_get_all_monthly():
            year_int = int(year)
            month_int = int(month)
            
            # 해당 월의 첫째 날과 마지막 날
            first_day = date(year_int, month_int, 1)
            if month_int == 12:
                last_day = date(year_int + 1, 1, 1)
            else:
                last_day = date(year_int, month_int + 1, 1)
            
            # 관리자는 모든 상태의 예약을 볼 수 있음
            return db.query(Reservation).filter(
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
            ).order_by(Reservation.start_date).all()
        
        result = await loop.run_in_executor(None, sync_get_all_monthly)
        return list(result)
    
    @staticmethod
    async def delete_reservation_by_admin(db: Session, reservation_id: int) -> bool:
        """관리자용 예약 삭제 (9번 기능) - 인증 없이 삭제 가능"""
        loop = asyncio.get_event_loop()
        
        def sync_admin_delete():
            reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
            if reservation:
                db.delete(reservation)
                db.commit()
                return True
            return False
        
        return await loop.run_in_executor(None, sync_admin_delete)
    
    @staticmethod
    async def get_user_reservations(db: Session, name: str, phone: str) -> List[Reservation]:
        """사용자의 현재/미래 예약 조회 (이름, 전화번호 기준)"""
        loop = asyncio.get_event_loop()
        
        def sync_get_user_reservations():
            today = date.today()
            return db.query(Reservation).filter(
                Reservation.name == name,
                Reservation.phone == phone,
                Reservation.end_date >= today  # 체크아웃 날짜가 오늘 이후인 예약만
            ).order_by(Reservation.start_date.asc()).all()
        
        return await loop.run_in_executor(None, sync_get_user_reservations)
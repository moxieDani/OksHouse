from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_async_db
from app.services.extended_reservation_service import ExtendedReservationService
from app.services.admin_service import AdminService
from app.schemas.reservation import (
    ReservationCreate, ReservationResponse, MonthlyReservationsQuery,
    ReservationWithAuth, ReservationVerifyResponse, ReservationDelete,
    AdminStatusUpdate
)

router = APIRouter()


@router.get("/monthly/{year}/{month}", response_model=List[ReservationResponse])
async def get_monthly_reservations(
    year: str,
    month: str,
    db: Session = Depends(get_async_db)
):
    """특정 년/월 예약 조회 (1번 기능)"""
    if not year.isdigit() or len(year) != 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="년도는 4자리 숫자여야 합니다."
        )
    
    if not month.isdigit() or int(month) < 1 or int(month) > 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="월은 01-12 사이의 값이어야 합니다."
        )
    
    # 월을 2자리로 포맷팅
    month = f"{int(month):02d}"
    
    return await ExtendedReservationService.get_reservations_by_month(db, year, month)


@router.post("/with-password", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def add_reservation_with_password(
    reservation: ReservationCreate,
    db: Session = Depends(get_async_db)
):
    """비밀번호를 포함한 예약 추가 (2번 기능)"""
    return await ExtendedReservationService.add_reservation_with_password(db=db, reservation=reservation)


@router.post("/verify", response_model=ReservationVerifyResponse)
async def verify_reservation(
    auth: ReservationWithAuth,
    db: Session = Depends(get_async_db)
):
    """오늘 날짜 기준 예약자 인증 (3번 기능)"""
    reservation_id = await ExtendedReservationService.verify_reservation(db, auth)
    return ReservationVerifyResponse(
        reservation_id=reservation_id,
        verified=reservation_id is not None
    )


@router.delete("/auth-delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation_with_auth(
    delete_request: ReservationDelete,
    db: Session = Depends(get_async_db)
):
    """인증을 통한 예약 삭제 (5번 기능)"""
    success = await ExtendedReservationService.delete_reservation_with_auth(
        db,
        delete_request.reservation_id,
        delete_request.name,
        delete_request.phone,
        delete_request.password
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="예약 정보가 일치하지 않거나 권한이 없습니다."
        )


@router.patch("/{reservation_id}/admin-status", response_model=ReservationResponse)
async def update_reservation_status_by_admin(
    reservation_id: int,
    status_update: AdminStatusUpdate,
    db: Session = Depends(get_async_db)
):
    """관리자 예약 상태 변경 (6번 기능)"""
    reservation = await ExtendedReservationService.update_reservation_status_by_admin(
        db, reservation_id, status_update
    )
    
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
    
    return reservation
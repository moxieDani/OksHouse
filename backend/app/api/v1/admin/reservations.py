from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_async_db
from app.services.reservation_service import ReservationService
from app.schemas.reservation import AdminStatusUpdate, ReservationResponse

router = APIRouter()


@router.get("/monthly/{year}/{month}", response_model=List[ReservationResponse])
async def get_all_reservations_by_month_admin(
    year: str,
    month: str,
    db: Session = Depends(get_async_db)
):
    """관리자용 특정 년/월 모든 예약 조회 (8번 기능) - 관리자 전용"""
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
    
    return await ReservationService.get_all_reservations_by_month_admin(db, year, month)


@router.patch("/{reservation_id}/status", response_model=ReservationResponse)
async def update_reservation_status(
    reservation_id: int,
    status_update: AdminStatusUpdate,
    db: Session = Depends(get_async_db)
):
    """관리자 예약 상태 변경 (6번 기능) - 관리자 전용"""
    reservation = await ReservationService.update_reservation_status_by_admin(
        db, reservation_id, status_update
    )
    
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
    
    return reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation_by_admin(
    reservation_id: int,
    db: Session = Depends(get_async_db)
):
    """관리자용 예약 삭제 (9번 기능) - 관리자 전용"""
    success = await ReservationService.delete_reservation_by_admin(db, reservation_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
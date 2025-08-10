from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_async_db
from app.services.extended_reservation_service import ExtendedReservationService
from app.schemas.reservation import AdminStatusUpdate, ReservationResponse

router = APIRouter()


@router.patch("/{reservation_id}/status", response_model=ReservationResponse)
async def update_reservation_status(
    reservation_id: int,
    status_update: AdminStatusUpdate,
    db: Session = Depends(get_async_db)
):
    """관리자 예약 상태 변경 (6번 기능) - 관리자 전용"""
    reservation = await ExtendedReservationService.update_reservation_status_by_admin(
        db, reservation_id, status_update
    )
    
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
    
    return reservation
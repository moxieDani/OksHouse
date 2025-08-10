from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_async_db
from app.services.reservation_service import ReservationService
from app.schemas.reservation import ReservationWithAuth, ReservationVerifyResponse

router = APIRouter()


@router.post("/verify", response_model=ReservationVerifyResponse)
async def verify_reservation(
    auth: ReservationWithAuth,
    db: Session = Depends(get_async_db)
):
    """오늘 날짜 기준 예약자 인증 (3번 기능) - 사용자용"""
    reservation_id = await ReservationService.verify_reservation(db, auth)
    return ReservationVerifyResponse(
        reservation_id=reservation_id,
        verified=reservation_id is not None
    )
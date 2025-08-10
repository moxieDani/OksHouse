from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_async_db
from app.services.reservation_service import ReservationService
from app.schemas.reservation import ReservationCreate, ReservationUpdate, ReservationResponse

router = APIRouter()


@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_async_db)
):
    """새 예약 생성"""
    # 예약 가능 여부 확인
    is_available = await ReservationService.check_availability(
        db, reservation.start_date, reservation.end_date
    )
    if not is_available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="선택한 날짜에 이미 예약이 있습니다."
        )
    
    return await ReservationService.create_reservation(db=db, reservation=reservation)


@router.get("/", response_model=List[ReservationResponse])
async def get_reservations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_async_db)
):
    """예약 목록 조회"""
    return await ReservationService.get_reservations(db, skip=skip, limit=limit)


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_async_db)
):
    """특정 예약 조회"""
    reservation = await ReservationService.get_reservation(db, reservation_id=reservation_id)
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
    return reservation


@router.patch("/{reservation_id}/status", response_model=ReservationResponse)
async def update_reservation_status(
    reservation_id: int,
    update_data: ReservationUpdate,
    db: Session = Depends(get_async_db)
):
    """예약 상태 업데이트"""
    reservation = await ReservationService.update_reservation_status(
        db, reservation_id=reservation_id, update_data=update_data
    )
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
    return reservation


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation(
    reservation_id: int,
    db: Session = Depends(get_async_db)
):
    """예약 삭제"""
    success = await ReservationService.delete_reservation(db, reservation_id=reservation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없습니다."
        )
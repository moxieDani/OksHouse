from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_async_db
from app.services.reservation_service import ReservationService
from app.schemas.reservation import (
    ReservationCreate, ReservationResponse,
    ReservationDelete, UserReservationsRequest, ReservationUpdate
)

router = APIRouter()


@router.get("/monthly/{year}/{month}", response_model=List[ReservationResponse])
async def get_monthly_reservations(
    year: str,
    month: str,
    db: Session = Depends(get_async_db)
):
    """특정 년/월 예약 조회 (1번 기능) - 사용자용"""
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
    
    return await ReservationService.get_reservations_by_month(db, year, month)


@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation_with_password(
    reservation: ReservationCreate,
    db: Session = Depends(get_async_db)
):
    """비밀번호를 포함한 예약 생성 (2번 기능) - 사용자용"""
    return await ReservationService.add_reservation_with_password(db=db, reservation=reservation)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reservation_with_auth(
    delete_request: ReservationDelete,
    db: Session = Depends(get_async_db)
):
    """인증을 통한 예약 삭제 (5번 기능) - 사용자용"""
    success = await ReservationService.delete_reservation_with_auth(
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


@router.post("/user", response_model=List[ReservationResponse])
async def get_user_reservations(
    user_request: UserReservationsRequest,
    db: Session = Depends(get_async_db)
):
    """사용자의 모든 예약 조회 (이름, 전화번호 기준)"""
    return await ReservationService.get_user_reservations(
        db=db, 
        name=user_request.name, 
        phone=user_request.phone
    )


@router.put("/", response_model=ReservationResponse)
async def update_reservation(
    update_request: ReservationUpdate,
    db: Session = Depends(get_async_db)
):
    """예약 정보 업데이트 - 상태를 pending으로 초기화"""
    updated_reservation = await ReservationService.update_reservation(
        db=db,
        reservation_id=update_request.reservation_id,
        name=update_request.name,
        phone=update_request.phone,
        start_date=update_request.start_date,
        end_date=update_request.end_date,
        duration=update_request.duration
    )
    
    if not updated_reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="예약을 찾을 수 없거나 권한이 없습니다."
        )
    
    return updated_reservation
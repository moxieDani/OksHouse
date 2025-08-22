from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_async_db
from app.services.reservation_service import ReservationService
from app.schemas.reservation import ReservationWithAuth, ReservationVerifyResponse
from app.schemas.auth import UserLoginRequest, UserLoginResponse
from app.core.security import encrypt_password
from app.core.config import settings

router = APIRouter()


@router.post("/login", response_model=UserLoginResponse)
async def user_login(request: UserLoginRequest):
    """사용자 로그인"""
    try:
        # 입력된 비밀번호를 암호화
        encrypted_password = encrypt_password(request.password)
        
        # 환경변수의 LOGIN_KEYS와 비교
        if encrypted_password in settings.login_keys_list:
            return UserLoginResponse(
                success=True,
                message="로그인 성공"
            )
        else:
            return UserLoginResponse(
                success=False,
                message="비밀번호가 틀렸습니다"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="로그인 처리 중 오류가 발생했습니다"
        )


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
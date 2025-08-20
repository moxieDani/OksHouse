from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.database import get_async_db
from app.services.fcm_service import FCMService
from app.services.auth_service import AuthService


router = APIRouter()


class FCMTokenRequest(BaseModel):
    """FCM 토큰 등록 요청"""
    fcm_token: str


class FCMTokenResponse(BaseModel):
    """FCM 토큰 응답"""
    success: bool
    message: str


@router.post("/register-token", response_model=FCMTokenResponse)
async def register_fcm_token(
    token_request: FCMTokenRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_async_db)
):
    """관리자 FCM 토큰 등록"""
    try:
        # 관리자 인증 확인
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="인증이 필요합니다")
        
        access_token = authorization.replace("Bearer ", "")
        admin_info = await AuthService.get_current_admin(db, access_token)
        
        if not admin_info:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
        
        # FCM 토큰 등록
        admin_id = admin_info.admin_id
        FCMService.add_admin_token(admin_id, token_request.fcm_token)
        
        return FCMTokenResponse(
            success=True,
            message="FCM 토큰이 등록되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"FCM 토큰 등록 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/unregister-token", response_model=FCMTokenResponse)
async def unregister_fcm_token(
    token_request: FCMTokenRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_async_db)
):
    """관리자 FCM 토큰 해제"""
    try:
        # 관리자 인증 확인
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="인증이 필요합니다")
        
        access_token = authorization.replace("Bearer ", "")
        admin_info = await AuthService.get_current_admin(db, access_token)
        
        if not admin_info:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
        
        # FCM 토큰 해제
        admin_id = admin_info.admin_id
        FCMService.remove_admin_token(admin_id, token_request.fcm_token)
        
        return FCMTokenResponse(
            success=True,
            message="FCM 토큰이 해제되었습니다"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"FCM 토큰 해제 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/test-notification", response_model=dict)
async def test_notification(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_async_db)
):
    """FCM 알림 테스트"""
    try:
        # 관리자 인증 확인
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="인증이 필요합니다")
        
        access_token = authorization.replace("Bearer ", "")
        admin_info = await AuthService.get_current_admin(db, access_token)
        
        if not admin_info:
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
        
        # 테스트 알림 전송
        admin_id = admin_info.admin_id
        admin_tokens = FCMService.get_admin_tokens(admin_id)
        
        if not admin_tokens:
            return {
                "success": False,
                "message": "등록된 FCM 토큰이 없습니다"
            }
        
        result = await FCMService.send_notification(
            tokens=admin_tokens,
            title="🔔 테스트 알림",
            body="FCM 푸시 알림이 정상적으로 작동합니다!",
            data={"type": "test"},
            click_action="/"
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"테스트 알림 전송 중 오류가 발생했습니다: {str(e)}"
        )
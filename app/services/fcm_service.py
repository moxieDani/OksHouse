import asyncio
from typing import List, Optional, Dict
from datetime import datetime
import httpx
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.fcm import FCMToken
import os


class FCMService:
    """Firebase Cloud Messaging 서비스 - 서비스 계정 키 방식"""
    
    FCM_URL = "https://fcm.googleapis.com/v1/projects/okshouse/messages:send"
    FCM_SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]
    
    # 서비스 계정 키 캐시
    _credentials = None
    
    @classmethod
    def add_admin_token(cls, db: Session, admin_id: int, fcm_token: str):
        """관리자 FCM 토큰을 데이터베이스에 추가 (중복 방지)"""
        # 이미 해당 토큰이 DB에 있는지 확인
        existing_token = db.query(FCMToken).filter(FCMToken.fcm_token == fcm_token).first()
        if existing_token:
            # 이미 있으면 아무것도 안함 (정상 처리)
            return
        
        # 새 토큰 추가
        new_token = FCMToken(admin_id=admin_id, fcm_token=fcm_token)
        db.add(new_token)
        db.commit()
    
    @classmethod
    def remove_admin_token(cls, db: Session, admin_id: int, fcm_token: str):
        """관리자 FCM 토큰을 데이터베이스에서 제거"""
        token_to_delete = db.query(FCMToken).filter(
            FCMToken.admin_id == admin_id, 
            FCMToken.fcm_token == fcm_token
        ).first()
        
        if token_to_delete:
            db.delete(token_to_delete)
            db.commit()
    
    @classmethod
    def get_admin_tokens(cls, db: Session, admin_id: int) -> List[str]:
        """특정 관리자의 모든 FCM 토큰을 DB에서 조회"""
        tokens = db.query(FCMToken.fcm_token).filter(FCMToken.admin_id == admin_id).all()
        return [token for (token,) in tokens]
    
    @classmethod
    def get_all_admin_tokens(cls, db: Session) -> List[str]:
        """모든 관리자의 FCM 토큰을 DB에서 조회"""
        tokens = db.query(FCMToken.fcm_token).all()
        return [token for (token,) in tokens]
    
    @classmethod
    def _get_service_account_path(cls) -> str:
        """서비스 계정 키 파일 경로 확인"""
        service_account_path = getattr(settings, 'fcm_service_account_path', None)
        if service_account_path and os.path.exists(service_account_path):
            return service_account_path
        
        default_paths = [
            "service-account-key.json",
            "firebase-service-account.json",
            "../service-account-key.json"
        ]
        
        for path in default_paths:
            if os.path.exists(path):
                return path
        
        return None
    
    @classmethod
    async def get_access_token(cls) -> Optional[str]:
        """Google OAuth2 액세스 토큰 획득"""
        try:
            if cls._credentials and cls._credentials.valid:
                return cls._credentials.token
            
            service_account_json = os.getenv("FCM_SERVICE_ACCOUNT_JSON")
            if service_account_json:
                import json
                try:
                    service_account_info = json.loads(service_account_json)
                    cls._credentials = service_account.Credentials.from_service_account_info(
                        service_account_info, scopes=cls.FCM_SCOPES
                    )
                except json.JSONDecodeError as e:
                    print(f"FCM_SERVICE_ACCOUNT_JSON 파싱 오류: {e}")
                    return None
            else:
                service_account_path = cls._get_service_account_path()
                if not service_account_path:
                    print("FCM 서비스 계정 키를 찾을 수 없습니다.")
                    return None
                
                cls._credentials = service_account.Credentials.from_service_account_file(
                    service_account_path, scopes=cls.FCM_SCOPES
                )
            
            cls._credentials.refresh(Request())
            return cls._credentials.token
            
        except Exception as e:
            print(f"FCM 액세스 토큰 획득 실패: {e}")
            return None
    
    @classmethod
    async def send_notification(
        cls,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict] = None,
        click_action: Optional[str] = None
    ) -> Dict:
        """FCM 푸시 알림 전송"""
        if not tokens:
            return {"success": False, "message": "토큰이 없습니다"}
        
        results = []
        access_token = await cls.get_access_token()
        if not access_token:
            return {"success": False, "message": "액세스 토큰 획득 실패"}

        async with httpx.AsyncClient() as client:
            for token in tokens:
                try:
                    message_data = {
                        "title": title,
                        "body": body,
                        "icon": "/icons/icon-192x192.png",
                        "badge": "/icons/badge-72x72.png",
                        "click_action": click_action or "/",
                        "type": "notification"
                    }
                    if data:
                        message_data.update(data)
                    
                    message = {
                        "message": {
                            "token": token,
                            "data": message_data,
                            "webpush": {"headers": {"Urgency": "high"}}
                        }
                    }
                    
                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                    
                    response = await client.post(cls.FCM_URL, json=message, headers=headers, timeout=30.0)
                    
                    if response.status_code == 200:
                        results.append({"token": token, "success": True})
                    else:
                        error_detail = f"HTTP {response.status_code}: {response.text}"
                        results.append({"token": token, "success": False, "error": error_detail})
                        # 토큰이 유효하지 않은 경우 DB에서 삭제하는 로직 추가 가능
                        if response.status_code in [400, 404]:
                            # self.remove_invalid_token(db, token) # 비동기 컨텍스트 문제로 별도 처리 필요
                            pass
                            
                except Exception as e:
                    results.append({"token": token, "success": False, "error": str(e)})
        
        success_count = sum(1 for r in results if r["success"])
        return {
            "success": success_count > 0,
            "total": len(tokens),
            "success_count": success_count,
            "results": results
        }
    
    @classmethod
    async def send_reservation_notification(
        cls,
        db: Session, # db 세션 추가
        reservation_data: Dict,
        notification_type: str = "new"
    ):
        """예약 관련 알림 전송"""
        try:
            all_tokens = cls.get_all_admin_tokens(db) # db 세션 전달
            
            if not all_tokens:
                print("등록된 관리자 토큰이 없습니다")
                return
            
            guest_name = reservation_data.get("name", "손님")
            start_date = reservation_data.get("start_date", "")
            end_date = reservation_data.get("end_date", "")
            duration = reservation_data.get("duration", "")

            if notification_type == "new":
                title = "[OksHouse] 새로운 예약 등록 알림"
                body = f"{guest_name}, {duration}박 {duration+1}일\n{start_date} ~ {end_date}"
            elif notification_type == "update":
                title = "[OksHouse] 예약 변경 알림"
                body = f"{guest_name}, {duration}박 {duration+1}일\n{start_date} ~ {end_date}"
            elif notification_type == "delete":
                title = "[OksHouse] 예약 삭제 알림"
                body = f"{guest_name}, {duration}박 {duration+1}일\n{start_date} ~ {end_date}"
            else:
                title = "[OksHouse] 예약 알림"
                body = f"{guest_name}님의 예약 관련 알림"
            
            click_action = "/OksHouse-Admin"
            data = {
                "type": "reservation",
                "action": notification_type,
                "reservation_id": str(reservation_data.get("id", "")),
                "guest_name": guest_name,
                "timestamp": datetime.now().isoformat()
            }
            
            result = await cls.send_notification(
                tokens=all_tokens, title=title, body=body, data=data, click_action=click_action
            )
            
            return result
            
        except Exception as e:
            print(f"예약 알림 전송 중 오류: {e}")
            return {"success": False, "message": str(e)}

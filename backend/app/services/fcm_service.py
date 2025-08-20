import asyncio
from typing import List, Optional, Dict
from datetime import datetime
import httpx
from google.auth.transport.requests import Request
from google.oauth2 import service_account
from app.core.config import settings
import os


class FCMService:
    """Firebase Cloud Messaging 서비스 - 서비스 계정 키 방식"""
    
    FCM_URL = "https://fcm.googleapis.com/v1/projects/okshouse/messages:send"
    FCM_SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"]
    
    # 관리자 FCM 토큰 저장소 (실제로는 데이터베이스에 저장해야 함)
    admin_tokens: Dict[str, List[str]] = {}
    
    # 서비스 계정 키 캐시
    _credentials = None
    
    @classmethod
    def add_admin_token(cls, admin_id: str, fcm_token: str):
        """관리자 FCM 토큰 추가"""
        if admin_id not in cls.admin_tokens:
            cls.admin_tokens[admin_id] = []
        
        if fcm_token not in cls.admin_tokens[admin_id]:
            cls.admin_tokens[admin_id].append(fcm_token)
    
    @classmethod
    def remove_admin_token(cls, admin_id: str, fcm_token: str):
        """관리자 FCM 토큰 제거"""
        if admin_id in cls.admin_tokens and fcm_token in cls.admin_tokens[admin_id]:
            cls.admin_tokens[admin_id].remove(fcm_token)
    
    @classmethod
    def get_admin_tokens(cls, admin_id: str) -> List[str]:
        """관리자의 모든 FCM 토큰 조회"""
        return cls.admin_tokens.get(admin_id, [])
    
    @classmethod
    def get_all_admin_tokens(cls) -> List[str]:
        """모든 관리자의 FCM 토큰 조회"""
        all_tokens = []
        for tokens in cls.admin_tokens.values():
            all_tokens.extend(tokens)
        return all_tokens
    
    @classmethod
    def _get_service_account_path(cls) -> str:
        """서비스 계정 키 파일 경로 확인"""
        # 1. 환경변수(.env)에서 경로 확인 (우선순위 높음)
        service_account_path = getattr(settings, 'fcm_service_account_path', None)
        if service_account_path and os.path.exists(service_account_path):
            return service_account_path
        
        # 2. 기본 경로들 확인
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
        """Google OAuth2 액세스 토큰 획득 (서비스 계정 키 방식)"""
        try:
            # 이미 캐시된 credentials가 있고 유효하면 사용
            if cls._credentials and cls._credentials.valid:
                return cls._credentials.token
            
            # 서비스 계정 키 파일 경로 확인
            service_account_path = cls._get_service_account_path()
            if not service_account_path:
                print("FCM 서비스 계정 키 파일을 찾을 수 없습니다.")
                print("다음 중 하나의 방법으로 설정해주세요:")
                print("1. 환경변수 FCM_SERVICE_ACCOUNT_PATH 설정")
                print("2. 프로젝트 루트에 service-account-key.json 파일 배치")
                return None
            
            # 서비스 계정 키로 credentials 생성
            cls._credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=cls.FCM_SCOPES
            )
            
            # 토큰 갱신
            cls._credentials.refresh(Request())
            
            print("FCM 서비스 계정 인증 완료")
            return cls._credentials.token
            
        except Exception as e:
            print(f"FCM 액세스 토큰 획득 실패: {e}")
            print("서비스 계정 키 파일이 올바른지 확인하세요.")
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
        
        try:
            # 간단한 HTTP 요청 방식 (서버 키 사용)
            # 실제 프로덕션에서는 서비스 계정 키 사용 권장
            
            results = []
            
            for token in tokens:
                try:
                    # 액세스 토큰 획득
                    access_token = await cls.get_access_token()
                    if not access_token:
                        results.append({
                            "token": token, 
                            "success": False, 
                            "error": "액세스 토큰 획득 실패"
                        })
                        continue
                    
                    # FCM v1 API 메시지 구조
                    message = {
                        "message": {
                            "token": token,
                            "notification": {
                                "title": title,
                                "body": body
                            },
                            "webpush": {
                                "notification": {
                                    "title": title,
                                    "body": body,
                                    "icon": "/icons/icon-192x192.png",
                                    "badge": "/icons/badge-72x72.png",
                                    "click_action": click_action or "/"
                                }
                            }
                        }
                    }
                    
                    if data:
                        message["message"]["data"] = data
                    
                    # HTTP 요청 전송
                    async with httpx.AsyncClient() as client:
                        headers = {
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json"
                        }
                        
                        response = await client.post(
                            cls.FCM_URL,
                            json=message,
                            headers=headers,
                            timeout=30.0
                        )
                        
                        if response.status_code == 200:
                            results.append({"token": token, "success": True})
                        else:
                            error_detail = f"HTTP {response.status_code}: {response.text}"
                            results.append({
                                "token": token, 
                                "success": False, 
                                "error": error_detail
                            })
                            
                except Exception as e:
                    results.append({
                        "token": token, 
                        "success": False, 
                        "error": str(e)
                    })
            
            success_count = sum(1 for r in results if r["success"])
            return {
                "success": success_count > 0,
                "total": len(tokens),
                "success_count": success_count,
                "results": results
            }
            
        except Exception as e:
            print(f"FCM 알림 전송 실패: {e}")
            return {"success": False, "message": str(e)}
    
    @classmethod
    async def send_reservation_notification(
        cls,
        reservation_data: Dict,
        notification_type: str = "new"  # "new", "update"
    ):
        """예약 관련 알림 전송"""
        
        try:
            # 모든 관리자에게 알림 전송
            all_tokens = cls.get_all_admin_tokens()
            
            if not all_tokens:
                print("등록된 관리자 토큰이 없습니다")
                return
            
            # 알림 메시지 구성
            guest_name = reservation_data.get("name", "손님")
            start_date = reservation_data.get("start_date", "")
            end_date = reservation_data.get("end_date", "")
            
            if notification_type == "new":
                title = "🔔 새로운 예약이 등록되었습니다"
                body = f"{guest_name}님의 예약 ({start_date} ~ {end_date})"
            elif notification_type == "update":
                title = "📝 예약 정보가 수정되었습니다"
                body = f"{guest_name}님의 예약이 변경되었습니다"
            else:
                title = "📋 예약 알림"
                body = f"{guest_name}님의 예약 관련 알림"
            
            # 클릭 시 관리자 페이지로 이동
            click_action = "/"
            
            # 추가 데이터
            data = {
                "type": "reservation",
                "action": notification_type,
                "reservation_id": str(reservation_data.get("id", "")),
                "guest_name": guest_name,
                "timestamp": datetime.now().isoformat()
            }
            
            # 알림 전송
            result = await cls.send_notification(
                tokens=all_tokens,
                title=title,
                body=body,
                data=data,
                click_action=click_action
            )
            
            print(f"예약 알림 전송 결과: {result}")
            return result
            
        except Exception as e:
            print(f"예약 알림 전송 중 오류: {e}")
            return {"success": False, "message": str(e)}
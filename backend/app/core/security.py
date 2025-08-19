import base64
import time
from typing import Optional
import jwt
from fastapi import HTTPException
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from app.core.config import settings


def encrypt_password(password: str) -> str:
    """비밀번호를 AES로 암호화"""
    if not settings.aes_key or not settings.aes_iv:
        raise ValueError("AES_KEY and AES_IV must be set in environment variables")
    
    key = base64.b64decode(settings.aes_key)
    iv = base64.b64decode(settings.aes_iv)
    
    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted_bytes = cipher.encrypt(pad(password.encode(), AES.block_size))
    return base64.b64encode(encrypted_bytes).decode()


def verify_password(plain_password: str, encrypted_password: str) -> bool:
    """비밀번호 검증"""
    try:
        encrypted_input = encrypt_password(plain_password)
        return encrypted_input == encrypted_password
    except Exception:
        return False


# JWT Settings
JWT_SECRET_KEY = "okshouse-admin-secret-key-2024"  # 실제 운영에서는 환경변수로 관리
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 300  # 5분
REFRESH_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 365  # 1년

# 인증된 관리자 세션 관리
authenticated_admin_sessions = set()


def create_access_token(admin_id: int, admin_name: str) -> str:
    """액세스 토큰 생성"""
    expire = int(time.time()) + ACCESS_TOKEN_EXPIRE_SECONDS
    payload = {
        "sub": str(admin_id),
        "name": admin_name,
        "exp": expire,
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(admin_id: int, admin_name: str) -> str:
    """리프레시 토큰 생성"""
    expire = int(time.time()) + REFRESH_TOKEN_EXPIRE_SECONDS
    payload = {
        "sub": str(admin_id),
        "name": admin_name,
        "exp": expire,
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> dict:
    """토큰 검증 및 페이로드 반환"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return {
            "admin_id": int(payload.get("sub")),
            "admin_name": payload.get("name"),
            "type": payload.get("type")
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")


def add_admin_session(admin_id: int):
    """관리자 세션 추가"""
    authenticated_admin_sessions.add(admin_id)


def remove_admin_session(admin_id: int):
    """관리자 세션 제거"""
    authenticated_admin_sessions.discard(admin_id)


def is_admin_session_valid(admin_id: int) -> bool:
    """관리자 세션 유효성 확인"""
    return admin_id in authenticated_admin_sessions
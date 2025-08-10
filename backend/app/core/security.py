import base64
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
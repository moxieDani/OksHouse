import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings"""
    
    # App settings
    app_name: str = os.getenv("APP_NAME", "Ok's House 별장 예약시스템")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    debug: bool = os.getenv("DEBUG", "False").lower() == "true"
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Database settings
    database_url: str = os.getenv("DATABASE_URL", "")
    
    # Server settings
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    
    # CORS settings
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000")
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def login_keys_list(self) -> list[str]:
        if not self.login_keys:
            return []
        return [key.strip() for key in self.login_keys.split("|")]
    
    # Security settings
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    aes_key: str = os.getenv("AES_KEY", "")
    aes_iv: str = os.getenv("AES_IV", "")
    login_keys: str = os.getenv("LOGIN_KEYS", "")
    https_only: bool = os.getenv("HTTPS_ONLY", "False").lower() == "true"
    secure_cookies: bool = os.getenv("SECURE_COOKIES", "False").lower() == "true"
    
    # JWT settings
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "okshouse-admin-secret-key-2024")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_seconds: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "300"))
    refresh_token_expire_seconds: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_SECONDS", "31536000"))
    
    # Logging settings
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_file: str = os.getenv("LOG_FILE", "./logs/app.log")
    
    # File upload settings
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    upload_path: str = os.getenv("UPLOAD_PATH", "./uploads")
    
    # Backup settings
    backup_path: str = os.getenv("BACKUP_PATH", "./backups")
    backup_interval: int = int(os.getenv("BACKUP_INTERVAL", "24"))
    
    # Email settings (for future notifications)
    smtp_host: str = os.getenv("SMTP_HOST", "")
    smtp_port: int = int(os.getenv("SMTP_PORT", "0")) if os.getenv("SMTP_PORT") else 0
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_tls: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    
    # Cache settings (Redis)
    redis_url: str = os.getenv("REDIS_URL", "")
    redis_password: str = os.getenv("REDIS_PASSWORD", "")
    
    # External API settings
    payment_api_key: str = os.getenv("PAYMENT_API_KEY", "")
    payment_api_secret: str = os.getenv("PAYMENT_API_SECRET", "")
    sms_api_key: str = os.getenv("SMS_API_KEY", "")
    sms_api_secret: str = os.getenv("SMS_API_SECRET", "")
    
    # Monitoring settings
    enable_metrics: bool = os.getenv("ENABLE_METRICS", "False").lower() == "true"
    enable_health_check: bool = os.getenv("ENABLE_HEALTH_CHECK", "True").lower() == "true"
    
    # FCM settings
    fcm_service_account_path: str = os.getenv("FCM_SERVICE_ACCOUNT_PATH", "")


settings = Settings()
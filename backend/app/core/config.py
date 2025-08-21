from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    app_name: str = "Ok's House 별장 예약시스템"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # Database settings
    database_url: Optional[str] = None
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS settings
    allowed_origins: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    @property
    def login_keys_list(self) -> list[str]:
        if not self.login_keys:
            return []
        return [key.strip() for key in self.login_keys.split("|")]
    
    # Security settings
    secret_key: str = "your-secret-key-here"
    aes_key: Optional[str] = None
    aes_iv: Optional[str] = None
    login_keys: Optional[str] = None
    https_only: bool = False
    secure_cookies: bool = False
    
    # JWT settings
    jwt_secret_key: str = "okshouse-admin-secret-key-2024"
    jwt_algorithm: str = "HS256"
    access_token_expire_seconds: int = 300
    refresh_token_expire_seconds: int = 31536000
    
    # Logging settings
    log_level: str = "INFO"
    log_file: str = "./logs/app.log"
    
    # File upload settings
    max_file_size: int = 10485760  # 10MB
    upload_path: str = "./uploads"
    
    # Backup settings
    backup_path: str = "./backups"
    backup_interval: int = 24
    
    # Email settings (for future notifications)
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_tls: bool = True
    
    # Cache settings (Redis)
    redis_url: Optional[str] = None
    redis_password: Optional[str] = None
    
    # External API settings
    payment_api_key: Optional[str] = None
    payment_api_secret: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_api_secret: Optional[str] = None
    
    # Monitoring settings
    enable_metrics: bool = False
    enable_health_check: bool = True
    
    # FCM settings
    fcm_service_account_path: str | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
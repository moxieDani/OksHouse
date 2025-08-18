from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    app_name: str = "Ok's House 별장 예약시스템"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Database settings
    database_url: Optional[str] = None
    
    # CORS settings
    allowed_origins: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    
    # Security settings
    secret_key: str = "your-secret-key-here"
    aes_key: Optional[str] = None
    aes_iv: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
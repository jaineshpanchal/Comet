"""
Configuration settings for AI Services
"""
from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Basic settings
    app_name: str = "Comet AI Services"
    version: str = "1.0.0"
    debug: bool = True
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Database settings (placeholder)
    database_url: Optional[str] = None
    
    # Redis settings (placeholder)
    redis_url: Optional[str] = None
    
    # API Keys (placeholder)
    openai_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
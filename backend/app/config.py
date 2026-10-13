import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Customer 360 - Agentic WooCommerce CRM"
    DATABASE_URL: str = "sqlite:///./crm.db"
    
    # WooCommerce Configuration
    WOOCOMMERCE_STORE_URL: str = ""
    WOOCOMMERCE_CONSUMER_KEY: str = ""
    WOOCOMMERCE_CONSUMER_SECRET: str = ""
    WOOCOMMERCE_TIMEOUT: float = 15.0
    
    # LLM & Agent Configuration
    LLM_PROVIDER: str = "openai"  # openai, groq, gemini, ollama, mock
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

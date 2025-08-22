"""Application configuration"""

import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    # Application
    app_name: str = "AgisFL Enterprise"
    version: str = "4.0.0"
    environment: str = "production"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8001
    
    # Security
    jwt_secret: str = os.getenv("JWT_SECRET", "agisfl-enterprise-secure-key-2025")
    jwt_algorithm: str = "HS256"
    jwt_expiration: int = 3600
    
    # Database
    database_url: str = "sqlite:///./data/agisfl.db"
    
    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # Federated Learning
    fl_min_clients: int = 2
    fl_max_clients: int = 100
    fl_rounds: int = 50
    fl_strategy: str = "FedAvg"
    
    # IDS Configuration
    ids_threshold: float = 0.7
    ids_model_path: str = "./models/ids_model.pkl"
    
    # Monitoring
    metrics_enabled: bool = True
    log_level: str = "INFO"
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: str = "1/minute"
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
"""
Production Configuration for AgisFL Enterprise
"""

import os
from typing import List, Optional
from dataclasses import dataclass, field

@dataclass
class ProductionConfig:
    # Application
    app_name: str = "AgisFL Enterprise"
    version: str = "4.0.0"
    environment: str = "production"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", 8000))
    workers: int = int(os.getenv("WORKERS", 4))
    
    # Database - PostgreSQL
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost:5432/agisfl_db")
    postgres_user: str = os.getenv("POSTGRES_USER", "postgres")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "admin")
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", 5432))
    postgres_db: str = os.getenv("POSTGRES_DB", "agisfl_db")
    
    # Security
    jwt_secret: str = os.getenv("JWT_SECRET", os.urandom(32).hex())
    encryption_key: str = os.getenv("ENCRYPTION_KEY", os.urandom(32).hex())
    
    # CORS
    cors_origins: List[str] = field(default_factory=lambda: [
        "https://agisfl.com",
        "https://www.agisfl.com",
        "https://app.agisfl.com",
        "https://dashboard.agisfl.com"
    ])
    cors_allow_credentials: bool = True
    
    # Rate Limiting
    @dataclass
    class RateLimit:
        default_limit: str = "1000/minute"
        auth_limit: str = "20/minute"
        api_limit: str = "5000/minute"
    
    rate_limit: RateLimit = field(default_factory=RateLimit)
    
    # Monitoring
    @dataclass
    class Monitoring:
        enable_prometheus: bool = True
        enable_jaeger: bool = True
        enable_logging: bool = True
        log_level: str = "INFO"
        alert_thresholds = {
            'cpu_usage': 80,
            'memory_usage': 85,
            'disk_usage': 90,
            'network_in': 1000000,
            'network_out': 1000000,
            'error_rate': 0.05,
            'response_time_ms': 1000
        }
    
    monitoring: Monitoring = field(default_factory=Monitoring)
    
    # Security
    @dataclass
    class Security:
        jwt_expiration: int = 3600  # 1 hour
        refresh_token_expiration: int = 86400 * 7  # 7 days
        password_min_length: int = 12
        require_mfa: bool = True
        session_timeout: int = 1800  # 30 minutes
    
    security: Security = field(default_factory=Security)
    
    # Performance
    @dataclass
    class Performance:
        cache_ttl: int = 300  # 5 minutes
        max_request_size: int = 100 * 1024 * 1024  # 100MB
        connection_pool_size: int = 20
        query_timeout: int = 30
    
    performance: Performance = field(default_factory=Performance)
    
    # Features
    @dataclass
    class Features:
        enable_mfa: bool = True
        enable_audit_logging: bool = True
        enable_threat_detection: bool = True
        enable_packet_capture: bool = True
        enable_model_versioning: bool = True
        enable_advanced_fl: bool = True
    
    features: Features = field(default_factory=Features)
    
    def is_production(self) -> bool:
        return self.environment == "production"
    
    def should_enable_debug(self) -> bool:
        return False
    
    def get_log_level(self) -> str:
        return self.monitoring.log_level

def get_production_config() -> ProductionConfig:
    return ProductionConfig()
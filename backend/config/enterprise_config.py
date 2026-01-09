"""
Enterprise Configuration Management - Simplified for Production
Provides all required attributes for the main application
"""

import os
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

class EnterpriseConfig:
    """Simplified enterprise configuration with all required attributes"""
    
    def __init__(self):
        # Basic application configuration
        self.app_name = "AgisFL Enterprise"
        self.version = "5.0.0"
        self.debug = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes", "on")
        self.environment = os.getenv("ENVIRONMENT", "development")
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))
        self.workers = int(os.getenv("WORKERS", "1"))

        # Authentication settings
        self.disable_authentication = os.getenv("DISABLE_AUTHENTICATION", "false").lower() in ("true", "1", "yes", "on")
        self.allow_anonymous_access = self.disable_authentication or os.getenv("ALLOW_ANONYMOUS_ACCESS", "false").lower() in ("true", "1", "yes", "on")

        # CORS settings
        self.cors_origins = [
            "http://localhost:5173",
            "http://localhost:5173/",
            "http://localhost:8000",
            "http://localhost:3000",
            "https://agisfl.com",
            "https://*.agisfl.com"
        ]

        # Rate limiting configuration
        self.rate_limit = type('RateLimit', (), {
            'default_limit': "100/minute",
            'auth_limit': "10/minute",
            'requests_per_minute': 60,
            'burst_requests': 10
        })()

        # Monitoring configuration
        self.monitoring = type('Monitoring', (), {
            'enable_prometheus': False,
            'enable_jaeger': False
        })()

        # Security configuration
        self.security = type('Security', (), {
            'jwt_expiration': 1800,  # 30 minutes
            'secret_key': "fallback-secret-key-change-in-production",
            'algorithm': "HS256",
            'access_token_expire_minutes': 30
        })()

        # Database configuration
        self.database = type('Database', (), {
            'password': "admin",
            'host': "localhost", 
            'port': 5432,
            'name': "agisfl_db"
        })()

        # Redis configuration
        self.redis = type('Redis', (), {
            'host': os.getenv('REDIS_HOST', 'localhost'),
            'port': int(os.getenv('REDIS_PORT', '6379')),
            'db': int(os.getenv('REDIS_DB', '0')),
            'password': os.getenv('REDIS_PASSWORD', 'Rahul@10071890'),
            'socket_timeout': 5,
            'socket_connect_timeout': 5,
            'max_connections': 50
        })()

        # FL configuration
        self.fl = type('FL', (), {
            'max_clients': 100,
            'min_clients': 2,
            'rounds': 10,
            'epochs': 5,
            'batch_size': 32,
            'learning_rate': 0.001
        })()

    def is_production(self):
        return self.environment == "production"

    def should_enable_debug(self):
        return self.debug

    def get_log_level(self):
        return "DEBUG" if self.debug else "INFO"

# Global configuration instance
config_manager = EnterpriseConfig()

def get_config():
    """Get main configuration manager"""
    return config_manager

def get_security_config():
    """Get security configuration"""
    return config_manager.security

def get_database_config():
    """Get database configuration"""
    return config_manager.database

def get_redis_config():
    """Get Redis configuration"""
    return config_manager.redis

def get_monitoring_config():
    """Get monitoring configuration"""
    return config_manager.monitoring

def get_fl_config():
    """Get FL configuration"""
    return config_manager.fl

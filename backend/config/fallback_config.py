"""
Fallback Configuration
Simple configuration when enterprise config is not available
"""

import os
from typing import Any, Dict, List, Optional

class FallbackConfig:
    """Simple fallback configuration"""
    
    def __init__(self):
        self.app_name = "AgisFL Enterprise"
        self.version = "4.0.0"
        self.debug = os.getenv("DEBUG", "false").lower() == "true"  # Secure: defaults to False
        self.environment = os.getenv("ENVIRONMENT", "production")  # Secure: defaults to production
        self.host = "0.0.0.0"
        self.port = 8000
        self.workers = 1
        
        # Rate limiting
        self.rate_limit = self._create_rate_limit_config()
        
        # Monitoring
        self.monitoring = self._create_monitoring_config()
        
        # Security
        self.security = self._create_security_config()
        
        # CORS
        self.cors_origins = [
            "http://localhost:5173",
            "http://localhost:5173/",  # Add version with trailing slash
            "http://localhost:8000", 
            "http://localhost:3000",
            "https://agisfl.com",
            "https://*.agisfl.com"
        ]
    
    def _create_rate_limit_config(self):
        class RateLimit:
            default_limit = "100/minute"
            auth_limit = "10/minute"
        return RateLimit()
    
    def _create_monitoring_config(self):
        class Monitoring:
            enable_prometheus = False
            enable_jaeger = False
            alert_thresholds = {
                'cpu_usage': 80,
                'memory_usage': 85,
                'disk_usage': 90,
                'network_in': 1000000,
                'network_out': 1000000,
                'error_rate': 0.05,
                'response_time_ms': 1000
            }
        return Monitoring()
    
    def _create_security_config(self):
        class Security:
            jwt_expiration = 1800  # 30 minutes
        return Security()
    
    def is_production(self):
        return self.environment == "production"
    
    def should_enable_debug(self):
        return self.debug
    
    def get_log_level(self):
        return "DEBUG" if self.debug else "INFO"

# Global fallback config instance
fallback_config = FallbackConfig()
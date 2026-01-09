"""
Comprehensive Security Configuration
Centralized security settings and hardening configurations with lightweight persistence helpers
"""
import os
import secrets
from typing import Dict, List, Any, Optional
from pathlib import Path
import json

class SecurityConfig:
    """Centralized security configuration"""
    
    def __init__(self):
        # Authentication & Authorization
        self.JWT_SECRET = os.getenv("JWT_SECRET", self._generate_secure_secret())
        self.JWT_ALGORITHM = "HS256"
        self.JWT_EXPIRATION = int(os.getenv("JWT_EXPIRATION", "3600"))  # 1 hour
        self.REFRESH_TOKEN_EXPIRATION = int(os.getenv("REFRESH_TOKEN_EXPIRATION", "604800"))  # 7 days
        
        # Password Security
        self.BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", "12"))
        self.MIN_PASSWORD_LENGTH = 8
        self.REQUIRE_SPECIAL_CHARS = True
        self.REQUIRE_NUMBERS = True
        self.REQUIRE_UPPERCASE = True
        
        # Rate Limiting
        self.LOGIN_RATE_LIMIT = int(os.getenv("LOGIN_RATE_LIMIT", "5"))  # 5 attempts per minute
        self.API_RATE_LIMIT = int(os.getenv("API_RATE_LIMIT", "100"))  # 100 requests per minute
        self.UPLOAD_RATE_LIMIT = int(os.getenv("UPLOAD_RATE_LIMIT", "10"))  # 10 uploads per hour
        
        # File Security
        self.MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(500 * 1024 * 1024)))  # 500MB
        self.ALLOWED_FILE_EXTENSIONS = [".csv", ".json", ".txt"]
        self.UPLOAD_DIRECTORY = Path("datasets/uploads")
        self.QUARANTINE_DIRECTORY = Path("datasets/quarantine")
        
        # Input Validation
        self.MAX_INPUT_LENGTH = 1000
        self.SANITIZE_HTML = True
        self.VALIDATE_SQL_INJECTION = True
        self.VALIDATE_XSS = True
        self.VALIDATE_PATH_TRAVERSAL = True
        
        # Logging Security
        self.LOG_SANITIZATION = True
        self.MAX_LOG_ENTRY_LENGTH = 200
        self.AUDIT_LOG_RETENTION_DAYS = 90
        
        # Network Security
        self.ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
        self.SECURE_HEADERS = True
        self.HSTS_MAX_AGE = 31536000  # 1 year
        
        # Privacy & Encryption
        self.ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", self._generate_encryption_key())
        self.ENABLE_DIFFERENTIAL_PRIVACY = True
        self.DEFAULT_EPSILON = 1.0
        self.ENABLE_SECURE_AGGREGATION = True
        
        # Session Security
        self.SESSION_TIMEOUT = int(os.getenv("SESSION_TIMEOUT", "1800"))  # 30 minutes
        self.SECURE_COOKIES = True
        self.HTTPONLY_COOKIES = True
        self.SAMESITE_COOKIES = "strict"
        
        # Database Security
        self.DB_CONNECTION_TIMEOUT = 30
        self.DB_QUERY_TIMEOUT = 60
        self.ENABLE_DB_ENCRYPTION = True
        
        # Monitoring & Alerting
        self.ENABLE_SECURITY_MONITORING = True
        self.ENABLE_THREAT_DETECTION = True  # Add missing attribute
        self.ALERT_ON_FAILED_LOGINS = 3
        self.ALERT_ON_SUSPICIOUS_ACTIVITY = True
        self.SECURITY_LOG_LEVEL = "WARNING"
        
        # Admin Security
        self.ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "AgisFL@2024!")
        self.REQUIRE_MFA_FOR_ADMIN = True
        self.ADMIN_SESSION_TIMEOUT = 900  # 15 minutes
        
        # Backup & Recovery
        self.BACKUP_ENCRYPTION = True
        self.BACKUP_RETENTION_DAYS = 30
        self.ENABLE_DISASTER_RECOVERY = True
        
    def _generate_secure_secret(self) -> str:
        """Generate a cryptographically secure secret"""
        return secrets.token_urlsafe(64)
    
    def _generate_encryption_key(self) -> str:
        """Generate encryption key for data at rest"""
        return secrets.token_urlsafe(32)
    
    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers for HTTP responses"""
        if not self.SECURE_HEADERS:
            return {}
        
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": f"max-age={self.HSTS_MAX_AGE}; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }
    
    def get_cors_config(self) -> Dict[str, Any]:
        """Get CORS configuration"""
        return {
            "allow_origins": self.ALLOWED_ORIGINS,
            "allow_credentials": True,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["*"],
            "expose_headers": ["X-Total-Count"]
        }
    
    def validate_password(self, password: str) -> List[str]:
        """Validate password strength"""
        errors = []
        
        if len(password) < self.MIN_PASSWORD_LENGTH:
            errors.append(f"Password must be at least {self.MIN_PASSWORD_LENGTH} characters long")
        
        if self.REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
            errors.append("Password must contain at least one uppercase letter")
        
        if self.REQUIRE_NUMBERS and not any(c.isdigit() for c in password):
            errors.append("Password must contain at least one number")
        
        if self.REQUIRE_SPECIAL_CHARS and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain at least one special character")
        
        return errors
    
    def is_file_allowed(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        if not filename:
            return False
        
        file_ext = Path(filename).suffix.lower()
        return file_ext in self.ALLOWED_FILE_EXTENSIONS
    
    def get_audit_config(self) -> Dict[str, Any]:
        """Get audit logging configuration"""
        return {
            "enabled": True,
            "retention_days": self.AUDIT_LOG_RETENTION_DAYS,
            "log_level": self.SECURITY_LOG_LEVEL,
            "sanitize_logs": self.LOG_SANITIZATION,
            "max_entry_length": self.MAX_LOG_ENTRY_LENGTH,
            "events_to_log": [
                "login_success",
                "login_failure",
                "logout",
                "password_change",
                "permission_change",
                "data_access",
                "data_modification",
                "admin_action",
                "security_event",
                "system_error"
            ]
        }
    
    def get_privacy_config(self) -> Dict[str, Any]:
        """Get privacy-preserving configuration"""
        return {
            "differential_privacy": {
                "enabled": self.ENABLE_DIFFERENTIAL_PRIVACY,
                "default_epsilon": self.DEFAULT_EPSILON,
                "delta": 1e-5,
                "sensitivity": 1.0
            },
            "secure_aggregation": {
                "enabled": self.ENABLE_SECURE_AGGREGATION,
                "key_size": 2048
            },
            "homomorphic_encryption": {
                "enabled": True,
                "scheme": "paillier"
            },
            "data_minimization": True,
            "purpose_limitation": True,
            "storage_limitation_days": 365
        }

_SECURITY_SINGLETON: Optional["SecurityConfig"] = None

def get_security_config() -> "SecurityConfig":
    """Return a process-wide singleton SecurityConfig instance.

    This avoids re-initializing secrets or env-derived values repeatedly.
    """
    global _SECURITY_SINGLETON
    if _SECURITY_SINGLETON is None:
        _SECURITY_SINGLETON = SecurityConfig()
    return _SECURITY_SINGLETON

def validate_security_config() -> List[str]:
    """Validate security configuration and return any issues"""
    issues = []
    config = get_security_config()
    
    # Check critical security settings
    if config.JWT_SECRET == "default_secret":
        issues.append("JWT_SECRET is using default value - should be changed in production")
    
    if config.BCRYPT_ROUNDS < 10:
        issues.append("BCRYPT_ROUNDS is too low - should be at least 10 for production")
    
    if "*" in config.ALLOWED_ORIGINS and os.getenv("ENVIRONMENT") == "production":
        issues.append("CORS allows all origins in production - should be restricted")
    
    if not config.SECURE_HEADERS:
        issues.append("Security headers are disabled - should be enabled in production")
    
    if config.MAX_FILE_SIZE > 1024 * 1024 * 1024:  # 1GB
        issues.append("Maximum file size is very large - consider reducing for security")
    
    return issues

# -------------------------
# Persistence (JSON on disk)
# -------------------------
_CONFIG_DIR = Path(__file__).resolve().parent
_STATE_FILE = _CONFIG_DIR / "security_state.json"
_ENHANCED_SECURITY_FILE = _CONFIG_DIR / "enhanced_security_config.json"

def _ensure_dir(path: Path):
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

def save_state(data: Dict[str, Any]) -> bool:
    """Persist arbitrary security state to JSON.

    Returns True on success, False on failure.
    """
    try:
        _ensure_dir(_STATE_FILE)
        with _STATE_FILE.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True)
        return True
    except Exception:
        return False

def load_state(default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    try:
        if _STATE_FILE.exists():
            with _STATE_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return default or {}

def save_enhanced_security_config(config_dict: Dict[str, Any]) -> bool:
    """Persist the Security API's enhanced SecurityConfiguration (pydantic) dict."""
    try:
        _ensure_dir(_ENHANCED_SECURITY_FILE)
        with _ENHANCED_SECURITY_FILE.open("w", encoding="utf-8") as f:
            json.dump(config_dict, f, indent=2, sort_keys=True)
        return True
    except Exception:
        return False

def load_enhanced_security_config(default: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    try:
        if _ENHANCED_SECURITY_FILE.exists():
            with _ENHANCED_SECURITY_FILE.open("r", encoding="utf-8") as f:
                return json.load(f)
    except Exception:
        pass
    return default or {}

__all__ = [
    "SecurityConfig",
    "get_security_config",
    "save_state",
    "load_state",
    "save_enhanced_security_config",
    "load_enhanced_security_config",
]
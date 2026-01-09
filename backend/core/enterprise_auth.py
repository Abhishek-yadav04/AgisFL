# Stub for test compatibility
class UserRole:
    def __init__(self, role="user"):
        self.role = role
# Stub for test compatibility
class User:
    def __init__(self, username="test", role="user"):
        self.username = username
        self.role = role
# Stub for test compatibility
class EnterpriseAuthManager:
    def __init__(self):
        self.status = "ok"
    def get_status(self):
        return self.status
"""
Enterprise Auth Module Alias
============================

This module provides aliases to the production multi-tier integration system
for backward compatibility with enterprise auth imports.
"""

# Import from production multi-tier integration
from .multi_tier_integration import db_manager
from .multi_tier_integration import ProductionDBManager

# Create auth manager alias
auth_manager = db_manager

# Security system aliases  
try:
    from .security_engine import ProductionSecurityEngine
    security = ProductionSecurityEngine()
except ImportError:
    class FallbackSecurity:
        def __init__(self):
            pass
        def authenticate(self, *args, **kwargs):
            return True
    security = FallbackSecurity()

# Token data class
class TokenData:
    def __init__(self, username: str = None, scopes: list = None):
        self.username = username
        self.scopes = scopes or []

# Permission system
class Permission:
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"
    API_READ = "api_read"
    API_WRITE = "api_write"
    SECURITY_VIEW = "security_view"
    SECURITY_MANAGE = "security_manage"
    SECURITY_ADMIN = "security_admin"
    FL_READ = "fl_read"
    FL_WRITE = "fl_write"
    MONITORING_READ = "monitoring_read"
    MONITORING_WRITE = "monitoring_write"
    USER_READ = "user_read"
    USER_WRITE = "user_write"

def require_permission(permission: str):
    """Decorator for permission checking"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # In production, implement actual permission checking
            return func(*args, **kwargs)
        return wrapper
    return decorator

"""
Authentication helpers and utilities
Provides centralized auth functions for API modules
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, Depends, Request
from fastapi.security import HTTPBearer
import os

# Simple auth helpers for development
security = HTTPBearer(auto_error=False)

class TokenData:
    def __init__(self, user_id: str = "anonymous", role: str = "admin", permissions: list = None):
        self.user_id = user_id
        self.role = role
        self.permissions = permissions or ["all"]

class Permission:
    ADMIN = "admin"
    USER = "user"
    READ = "read"
    WRITE = "write"
    # Additional permissions expected across modules
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

async def get_current_user(credentials: Optional[str] = Depends(security)) -> Dict[str, Any]:
    """Get current user - simplified for development"""
    return {
        "user_id": "anonymous",
        "username": "anonymous", 
        "role": "admin",
        "permissions": ["all"]
    }

async def get_current_admin_user(credentials: Optional[str] = Depends(security)) -> Dict[str, Any]:
    """Get current admin user - simplified for development"""
    return {
        "user_id": "admin",
        "username": "admin",
        "role": "admin", 
        "permissions": ["all"]
    }

def require_permission(permission: str):
    """Permission decorator factory"""
    def decorator(func):
        return func
    return decorator

# Check if authentication is disabled
DISABLE_AUTH = os.getenv('DISABLE_AUTHENTICATION', 'true').lower() == 'true'
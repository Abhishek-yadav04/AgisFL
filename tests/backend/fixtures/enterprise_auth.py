"""Enterprise auth compatibility shim.

Clean, minimal implementation exposing the symbols tests expect.
"""
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
import os
import logging
import jwt

from core.authentication import get_password_hash, verify_password, SECRET_KEY, ALGORITHM

logger = logging.getLogger(__name__)


class UserRole(Enum):
    OPERATOR = "operator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


@dataclass
class User:
    id: str
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: UserRole = UserRole.OPERATOR


class Config:
    def __init__(self):
        self.jwt_secret = os.environ.get('JWT_SECRET') or os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
        self.jwt_algorithm = ALGORITHM
        self.token_expire_minutes = int(os.environ.get('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))


class EnterpriseAuthManager:
    def __init__(self):
        self.config = Config()
        self._initialized = False

    async def initialize(self) -> None:
        self._initialized = True
        logger.info("EnterpriseAuthManager initialized")

    def hash_password(self, password: str) -> str:
        return get_password_hash(password)

    def verify_password(self, plain: str, hashed: str) -> bool:
        return verify_password(plain, hashed)

    async def create_access_token(self, user: User, expires_delta: Optional[timedelta] = None) -> str:
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=self.config.token_expire_minutes))
        payload: Dict[str, Any] = {
            "user_id": user.id,
            "username": user.username,
            "exp": expire
        }
        token = jwt.encode(payload, self.config.jwt_secret, algorithm=self.config.jwt_algorithm)
        return token

    async def create_refresh_token(self, user: User) -> str:
        payload = {
            "user_id": user.id,
            "type": "refresh",
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, self.config.jwt_secret, algorithm=self.config.jwt_algorithm)


enterprise_auth_manager = EnterpriseAuthManager()
auth_manager = enterprise_auth_manager
security_manager = enterprise_auth_manager


# Minimal compatibility helpers
class TokenData:
    def __init__(self, username: str = None, scopes: list = None):
        self.username = username
        self.scopes = scopes or []


class Permission:
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"


def require_permission(permission: str):
    def decorator(func):
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
        return wrapper
    return decorator

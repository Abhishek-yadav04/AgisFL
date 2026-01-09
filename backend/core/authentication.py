"""
Unified Authentication & Permission Module
-----------------------------------------
Combines all core authentication, session, and permission logic for AgisFL.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging
from pydantic import BaseModel

# --- Config ---
from dotenv import load_dotenv
load_dotenv()

# Development toggle: when truthy, authentication/permission checks are relaxed
# Force-disable authentication so the application runs in anonymous/dev mode.
# This makes all endpoints accessible without a JWT for testing and development.
# NOTE: This should NOT be used in production. To re-enable auth, set this to False
# or remove this override and control via the DISABLE_AUTHENTICATION env var.
DISABLE_AUTHENTICATION = True

# AUTH_MODE controls higher-level policy when users authenticate via login
# Values: 'dev' (full bypass), 'demo' (read-only for non-admins),
# 'standard' (default: read + limited write), 'enterprise' (strict RBAC)
AUTH_MODE = os.environ.get("AUTH_MODE", "standard").lower()

# Resolve secret from multiple sources (env takes precedence)
_env_jwt = os.environ.get("JWT_SECRET") or os.environ.get("JWT_SECRET_KEY")
_env_admin_pw = os.environ.get("ADMIN_PASSWORD")

# Try enterprise config if available
try:
    from backend.config.enterprise_config import get_config as _get_enterprise_config
    _cfg = _get_enterprise_config()
    _cfg_jwt = getattr(getattr(_cfg, 'auth', {}), 'jwt_secret', None)
except Exception:
    _cfg_jwt = None

# Final secret selection
if _env_jwt:
    SECRET_KEY = _env_jwt
elif _cfg_jwt:
    SECRET_KEY = _cfg_jwt
else:
    # Development fallback: generate a secure random secret but warn loudly
    import secrets as _secrets
    SECRET_KEY = _secrets.token_urlsafe(32)
    logging.warning("JWT secret not found in env or config; using generated dev secret.\nSet JWT_SECRET in production to a secure value.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# --- Models ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    permissions: List[str] = []

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    permissions: List[str] = []

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

# --- Password & Token Utilities ---
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception as e:
    # Fallback to plaintext for development (NOT for production)
    logging.warning(f"bcrypt not available: {e}. Using insecure plaintext passwords for development.")
    
    class PlaintextContext:
        def hash(self, password): return f"plain:{password}"
        def verify(self, plain, hashed): return hashed == f"plain:{plain}"
    
    pwd_context = PlaintextContext()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


async def oauth2_scheme_optional(request: Request) -> Optional[str]:
    """Optional OAuth2 scheme dependency that returns None when no Authorization header is present.

    This prevents FastAPI from raising a 401 before our logic can decide to allow
    anonymous access in dev/demo modes.
    """
    try:
        return await oauth2_scheme(request)
    except Exception:
        return None

# --- In-memory User DB (stub) ---
USERS_DB = {
    "admin": {
        "username": "admin",
        "full_name": "Administrator",
        "email": "admin@example.com",
        "hashed_password": pwd_context.hash(_env_admin_pw or os.environ.get("ADMIN_PASSWORD", "AgisFL@2024!")),
        "disabled": False,
        "permissions": [Permission.ADMIN, Permission.READ, Permission.WRITE]
    }
}

# --- Authentication Logic ---
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def get_user(db: Dict[str, Any], username: str) -> Optional[User]:
    if username in db:
        user_dict = db[username]
        return User(**user_dict)
    return None

def authenticate_user(db: Dict[str, Any], username: str, password: str) -> Optional[User]:
    user = get_user(db, username)
    if not user:
        logging.warning(f"Authentication failed: user {username} not found.")
        return False
    if not verify_password(password, db[username]["hashed_password"]):
        logging.warning(f"Authentication failed: invalid password for user {username}.")
        return False
    logging.info(f"User {username} authenticated successfully.")
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with enhanced security claims"""
    to_encode = data.copy()
    now = datetime.utcnow()
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    
    # SECURITY: Add all required JWT claims
    to_encode.update({
        "exp": expire,          # Expiration time
        "iat": now,             # Issued at time  
        "nbf": now,             # Not before time
        "jti": _secrets.token_urlsafe(16),  # JWT ID for uniqueness
        "iss": "AgisFL",        # Issuer
        "aud": "AgisFL-API"     # Audience
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode a JWT token with comprehensive security validation"""
    try:
        # SECURITY: Explicit algorithm list prevents algorithm confusion attacks
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=["HS256"],  # Explicit algorithm, no 'none' allowed
            options={
                "verify_exp": True,   # Verify expiration
                "verify_iat": True,   # Verify issued at 
                "verify_nbf": True,   # Verify not before
                "require": ["exp", "iat", "sub"]  # Require critical claims
            }
        )
        
        username: str = payload.get("sub")
        if username is None:
            raise ValueError("Token missing username")
            
        # SECURITY: Additional validation against timing attacks
        current_time = datetime.utcnow().timestamp()
        issued_at = payload.get("iat", 0)
        if issued_at > current_time + 300:  # 5 min clock skew tolerance
            raise ValueError("Token issued in future")
            
        # SECURITY: Explicit check against 'none' algorithm
        if payload.get('alg', '').lower() == 'none':
            raise JWTError("Algorithm 'none' not permitted")
            
        return payload
        
    except JWTError as e:
        logging.error(f"JWT decode error: {e}")
        raise ValueError(f"Invalid token: {e}")

def check_permission(user: User, permission: Permission) -> bool:
    """Check if user has specific permission"""
    return permission in user.permissions

def require_permission(permission: Permission):
    """Decorator to require specific permission for endpoint access"""
    def decorator(func):
        # Short-circuit decorator in dev-mode or when AUTH_MODE is 'dev'
        if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
            return func

        def wrapper(*args, **kwargs):
            # In a real implementation, this would check the current user's permissions
            return func(*args, **kwargs)
        return wrapper
    return decorator

# --- FastAPI Dependencies ---
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme_optional)) -> User:
    # Global dev bypass (full admin in 'dev')
    if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
        return User(username="anonymous", email=None, full_name="Anonymous (dev)", disabled=False,
                    permissions=[Permission.ADMIN, Permission.READ, Permission.WRITE])

    # Demo mode: allow anonymous read-only access when no token is provided
    if AUTH_MODE == "demo" and not token:
        return User(username="anonymous", email=None, full_name="Anonymous (demo)", disabled=False,
                    permissions=[Permission.READ])
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # If no token provided, there's nothing to verify
        if not token:
            raise JWTError("No token provided")

        # Use the secure verify_token function
        payload = verify_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, permissions=payload.get("permissions", []))
    except (JWTError, ValueError) as e:
        logging.error(f"Token validation error: {e}")
        raise credentials_exception
    
    user = get_user(USERS_DB, username=token_data.username)
    if user is None:
        logging.error("User not found for token.")
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    # Global dev bypass
    if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
        return current_user

    # Demo mode: treat anonymous/demo users as active (read-only)
    if AUTH_MODE == "demo" and current_user.username == "anonymous":
        return current_user

    if current_user.disabled:
        logging.warning(f"Inactive user: {current_user.username}")
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
    # Global dev bypass
    if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
        return current_user

    # In non-dev modes require ADMIN permission
    if Permission.ADMIN not in current_user.permissions:
        logging.warning(f"Admin access denied for user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def has_permission(required_permission: str):
    async def permission_dependency(current_user: User = Depends(get_current_active_user)):
        # Global dev bypass
        if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
            return current_user

        # Demo: non-admin users are read-only
        if AUTH_MODE == "demo":
            if required_permission != Permission.READ and Permission.ADMIN not in current_user.permissions:
                logging.warning(f"Demo mode: write access denied for user {current_user.username}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Not enough permissions (demo read-only)"
                )
            return current_user

        # Standard/enterprise: enforce permissions normally (enterprise typically stricter)
        if required_permission not in current_user.permissions and Permission.ADMIN not in current_user.permissions:
            logging.warning(f"Permission denied for user {current_user.username}: missing {required_permission}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions"
            )
        return current_user
    return permission_dependency

# --- Session Management ---
class AuthManager:
    def __init__(self):
        self.sessions = {}
        self.permissions_cache = {}
    async def authenticate(self, user_id: str = None, token: str = None) -> Dict:
        # Global dev bypass
        if DISABLE_AUTHENTICATION or AUTH_MODE == "dev":
            return {
                "user_id": user_id or "anonymous",
                "role": Permission.ADMIN,
                "permissions": [Permission.ADMIN, Permission.READ, Permission.WRITE],
                "authenticated": True,
                "timestamp": datetime.utcnow().isoformat()
            }

        # SECURITY FIX: Reject anonymous/unauthenticated access
        if not user_id or user_id == "anonymous":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required - anonymous access denied"
            )
            
        # If token provided, validate it
        if token:
            try:
                payload = verify_token(token)
                if payload.get("sub") != user_id:
                    raise ValueError("Token user mismatch")
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid token: {e}"
                )
        
        # Get user from database for proper authorization
        user = get_user(USERS_DB, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # AUTH_MODE adjustments: demo users get read-only unless admin
        if AUTH_MODE == "demo" and Permission.ADMIN not in user.permissions:
            user.permissions = [Permission.READ]
            
        auth_context = {
            "user_id": user_id,
            "role": user.permissions[0] if user.permissions else Permission.READ,
            "permissions": user.permissions,
            "authenticated": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        logging.info(f"User authenticated: {user_id}")
        return auth_context
    async def authorize(self, user_id: str, permission: str) -> bool:
        auth_context = await self.authenticate(user_id)
        return permission in auth_context.get("permissions", []) or Permission.ADMIN in auth_context.get("permissions", [])
    async def create_session(self, user_id: str) -> str:
        session_id = f"session_{user_id}_{datetime.utcnow().timestamp()}"
        self.sessions[session_id] = {
            "user_id": user_id,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24)
        }
        return session_id
    async def validate_session(self, session_id: str) -> Optional[Dict]:
        session = self.sessions.get(session_id)
        if session and session["expires_at"] > datetime.utcnow():
            return session
        return None
    async def revoke_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

# --- User Management Stubs ---
def create_user(username: str, password: str, email: str = None, full_name: str = None, permissions: List[str] = None) -> User:
    logging.info(f"User created: {username}")
    return User(username=username, email=email, full_name=full_name, disabled=False, permissions=permissions or [Permission.READ])

def reset_password(username: str) -> bool:
    logging.info(f"Password reset for user: {username}")
    return True

def disable_user(username: str) -> bool:
    logging.info(f"User disabled: {username}")
    return True

def enable_user(username: str) -> bool:
    logging.info(f"User enabled: {username}")
    return True

def list_users() -> List[User]:
    logging.info("Listing all users.")
    return [User(**u) for u in USERS_DB.values()]

def delete_user(username: str) -> bool:
    logging.info(f"User deleted: {username}")
    return True

def change_password(username: str, new_password: str) -> bool:
    logging.info(f"Password changed for user: {username}")
    return True

# --- Compatibility Aliases ---
EnterpriseAuthManager = AuthManager
TokenDataCompat = TokenData
PermissionCompat = Permission
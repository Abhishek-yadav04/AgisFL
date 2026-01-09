from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

try:
    # Prefer canonical core authentication helpers when available, otherwise
    # fall back to the API-level helpers in auth_helpers which provide a
    # permissive development mode.
    from .auth_helpers import security, TokenData, require_permission, Permission
    # Try to import production helpers when present
    from backend.core.authentication import authenticate_user, create_access_token
except Exception:
    # Best-effort fallback stubs to keep imports safe in minimal dev envs
    def authenticate_user(db, username, password):
        return False
    def create_access_token(data: Dict[str, Any]):
        return "dev-token"

router = APIRouter(tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


@router.get("/health")
async def auth_health():
    return {"status": "ok", "component": "authentication"}


@router.post("/login")
async def login(req: LoginRequest):
    # Very small compatibility / fallback endpoint used by some frontends
    user = authenticate_user(None, req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": req.username})
    return {"access_token": token, "token_type": "bearer"}

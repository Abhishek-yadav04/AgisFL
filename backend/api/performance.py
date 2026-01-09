from fastapi import APIRouter
from backend.core.advanced_performance import get_active_performance_backend

router = APIRouter()


@router.get("/api/performance/active-backend")
async def active_performance_backend():
    """Return which performance backend is active (v2, working, or stubs)."""
    return {"active_backend": get_active_performance_backend()}

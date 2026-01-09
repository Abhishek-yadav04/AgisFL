from fastapi import APIRouter, Response
import structlog
from datetime import datetime, timezone

logger = structlog.get_logger()

router = APIRouter()


@router.get("/apiService", summary="Compatibility: handle malformed frontend call /apiService")
async def compatibility_api_service():
    """Return a small, helpful response for a malformed frontend call.

    This endpoint exists only as a compatibility shim. Frontend should be
    updated to call the real API path (likely under /api/...).
    """
    logger.info("compat_apiService_called", timestamp=datetime.now(timezone.utc).isoformat())
    return Response(content='{"error":"apiService is invalid - please update frontend to use /api/... paths"}', media_type="application/json", status_code=400)

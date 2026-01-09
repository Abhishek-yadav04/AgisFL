"""Rate Limiting API - Simplified Version"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any


# Use the central authentication helpers so mode-based policies are applied
from .auth_helpers import security as security_sync, TokenData, Permission, require_permission
from typing import Any


import time
import logging
from fastapi import Query
from pydantic import BaseModel, Field
from typing import List, Optional

logger = logging.getLogger(__name__)
router = APIRouter()

# Enterprise rate limiting configuration
class RateLimitConfig(BaseModel):
    enabled: bool = True
    max_requests_per_minute: int = 1000
    block_duration_seconds: int = 60
    alert_threshold: int = 900
    dynamic_adjustment: bool = True
    last_updated: float = time.time()

rate_limit_config = RateLimitConfig()

# In-memory analytics (for demo)
rate_limit_analytics = {
    "requests": [],
    "blocked": [],
    "hits": 0,
    "last_reset": time.time()
}

class RateLimitStatsModel(BaseModel):
    total_requests: int
    blocked_requests: int
    rate_limit_hits: int
    status: str
    avg_requests_per_minute: float
    peak_requests_per_minute: int
    last_block_time: Optional[float] = None
    config: RateLimitConfig



@router.get("/status", response_model=Dict[str, Any])
@require_permission(Permission.API_READ)
async def get_rate_limit_status(current_user: Any = Depends(security_sync)):
    """Get rate limiting status and configuration"""
    try:
        avg_requests = 0
        peak_requests = 0
        now = time.time()
        minute_window = [t for t in rate_limit_analytics["requests"] if now - t < 60]
        avg_requests = len(minute_window)
        peak_requests = max(avg_requests, rate_limit_analytics.get("peak", 0))
        status = "active" if rate_limit_config.enabled else "disabled"
        return {
            "status": status,
            "message": "Rate limiting router is operational", 
            "user": current_user.username if current_user else "unknown",
            "config": rate_limit_config.dict(),
            "avg_requests_per_minute": avg_requests,
            "peak_requests_per_minute": peak_requests,
            "last_block_time": rate_limit_analytics["blocked"][-1] if rate_limit_analytics["blocked"] else None
        }
    except Exception as e:
        logger.error(f"Rate limit status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get rate limit status")


@router.get("/stats", response_model=RateLimitStatsModel)
@require_permission(Permission.API_READ)
async def get_rate_limit_stats(current_user: Any = Depends(security_sync)):
    """Get advanced rate limiting statistics and analytics"""
    now = time.time()
    minute_window = [t for t in rate_limit_analytics["requests"] if now - t < 60]
    avg_requests = len(minute_window)
    peak_requests = max(avg_requests, rate_limit_analytics.get("peak", 0))
    blocked_requests = len([t for t in rate_limit_analytics["blocked"] if now - t < 3600])
    stats = RateLimitStatsModel(
        total_requests=len(rate_limit_analytics["requests"]),
        blocked_requests=blocked_requests,
        rate_limit_hits=rate_limit_analytics["hits"],
        status="active" if rate_limit_config.enabled else "disabled",
        avg_requests_per_minute=avg_requests,
        peak_requests_per_minute=peak_requests,
        last_block_time=rate_limit_analytics["blocked"][-1] if rate_limit_analytics["blocked"] else None,
        config=rate_limit_config
    )
    return stats

# Enterprise feature: dynamic config update
@router.post("/config/update", response_model=RateLimitConfig)
@require_permission(Permission.API_WRITE)
async def update_rate_limit_config(
    max_requests_per_minute: int = Query(..., ge=100, le=10000),
    block_duration_seconds: int = Query(..., ge=10, le=600),
    alert_threshold: int = Query(..., ge=100, le=10000),
    dynamic_adjustment: bool = Query(True),
    enabled: bool = Query(True)
):
    """Update enterprise rate limiting configuration"""
    rate_limit_config.max_requests_per_minute = max_requests_per_minute
    rate_limit_config.block_duration_seconds = block_duration_seconds
    rate_limit_config.alert_threshold = alert_threshold
    rate_limit_config.dynamic_adjustment = dynamic_adjustment
    rate_limit_config.enabled = enabled
    rate_limit_config.last_updated = time.time()
    logger.info("Rate limit config updated", config=rate_limit_config.dict())
    return rate_limit_config

# Advanced analytics endpoint
@router.get("/analytics", response_model=Dict[str, Any])
@require_permission(Permission.API_READ)
async def get_rate_limit_analytics(
    minutes: int = Query(60, ge=1, le=1440)
):
    """Get advanced analytics for rate limiting usage"""
    now = time.time()
    window = [t for t in rate_limit_analytics["requests"] if now - t < minutes * 60]
    blocked = [t for t in rate_limit_analytics["blocked"] if now - t < minutes * 60]
    return {
        "total_requests": len(window),
        "blocked_requests": len(blocked),
        "peak_requests": max(len(window), rate_limit_analytics.get("peak", 0)),
        "window_minutes": minutes,
        "last_block_time": blocked[-1] if blocked else None,
        "config": rate_limit_config.dict()
    }

# Enterprise feature: simulate request for analytics demo
@router.post("/simulate-request", response_model=Dict[str, Any])
@require_permission(Permission.API_WRITE)
async def simulate_rate_limit_request():
    """Simulate a request for analytics demo purposes"""
    now = time.time()
    rate_limit_analytics["requests"].append(now)
    minute_window = [t for t in rate_limit_analytics["requests"] if now - t < 60]
    if len(minute_window) > rate_limit_config.max_requests_per_minute:
        rate_limit_analytics["blocked"].append(now)
        rate_limit_analytics["hits"] += 1
        logger.warning("Rate limit exceeded", current_count=len(minute_window))
        return {"status": "blocked", "timestamp": now}
    else:
        rate_limit_analytics["peak"] = max(rate_limit_analytics.get("peak", 0), len(minute_window))
        return {"status": "allowed", "timestamp": now}

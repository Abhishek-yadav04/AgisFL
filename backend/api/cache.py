"""
Cache Management API Module
Provides REST endpoints for managing thread-safe cache
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import logging

try:
    import structlog
    logger = structlog.get_logger()
except ImportError:
    logger = logging.getLogger(__name__)


# Import real business logic only
try:
    from core.thread_safe_cache import get_cache, get_async_cache
    from core.security_engine import security_engine
except ImportError as e:
    raise ImportError("Real cache backend not available. All endpoints require real business logic.")

# Use auth helper which provides a callable `security` dependency and safe fallbacks
from .auth_helpers import security, TokenData, require_permission, Permission
from typing import Optional

router = APIRouter()
# Get cache instances
sync_cache = get_cache()
async_cache = get_async_cache()

class CacheEntryModel(BaseModel):
    """Cache entry model"""
    key: str = Field(description="Cache key")
    value: Any = Field(description="Cache value")
    ttl: Optional[float] = Field(None, ge=0, description="Time to live in seconds")

class CacheStatsModel(BaseModel):
    """Cache statistics model"""
    size: int
    max_size: int
    hit_rate: float
    hits: int
    misses: int
    evictions: int
    expired: int

@router.get("/status")
async def get_cache_status() -> Dict[str, Any]:
    """Get cache service status"""
    
    try:
        # Get cache statistics
        sync_stats = sync_cache.get_stats() if sync_cache else {"hits": 0, "misses": 0, "size": 0}
        async_stats = await async_cache.get_stats() if async_cache else {"hits": 0, "misses": 0, "size": 0}
        
        # Calculate overall health
        sync_available = sync_cache is not None
        async_available = async_cache is not None
        
        total_hits = sync_stats.get("hits", 0) + async_stats.get("hits", 0)
        total_misses = sync_stats.get("misses", 0) + async_stats.get("misses", 0)
        hit_rate = (total_hits / (total_hits + total_misses)) * 100 if (total_hits + total_misses) > 0 else 0
        
        return {
            "status": "success",
            "service": "Cache Management API",
            "version": "1.0.0",
            "cache_types": {
                "sync_cache": {
                    "available": sync_available,
                    "size": sync_stats.get("size", 0),
                    "hits": sync_stats.get("hits", 0),
                    "misses": sync_stats.get("misses", 0)
                },
                "async_cache": {
                    "available": async_available,
                    "size": async_stats.get("size", 0),
                    "hits": async_stats.get("hits", 0),
                    "misses": async_stats.get("misses", 0)
                }
            },
            "performance": {
                "total_hits": total_hits,
                "total_misses": total_misses,
                "overall_hit_rate": round(hit_rate, 2),
                "cache_efficiency": "high" if hit_rate > 80 else "medium" if hit_rate > 50 else "low"
            },
            "endpoints": [
                "/stats",
                "/entry/{key}",
                "/entry",
                "/clear",
                "/cleanup",
                "/keys",
                "/config",
                "/status"
            ],
            "last_updated": "2024-01-01T00:00:00Z"  # Placeholder
        }
        
    except Exception as e:
        logger.error("Failed to get cache status", error=str(e))
        return {
            "status": "error",
            "service": "Cache Management API",
            "error": str(e),
            "cache_types": {
                "sync_cache": {"available": False},
                "async_cache": {"available": False}
            },
            "timestamp": "2024-01-01T00:00:00Z"
        }

@router.get("/entry/{key}")
async def get_cache_entry(
    key: str,
    cache_type: str = Query("async", description="Cache type (sync or async)"),
    current_user: Optional[Any] = Depends(security)
):
    """Get a cache entry by key"""
    try:
        # Check permissions
        if not current_user or Permission.API_READ not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        if cache_type == "sync":
            value = sync_cache.get(key)
        elif cache_type == "async":
            value = await async_cache.get(key)
        else:
            raise HTTPException(status_code=400, detail="Invalid cache type. Use 'sync' or 'async'")

        if value is None:
            raise HTTPException(status_code=404, detail="Cache entry not found")

        return {
            "status": "success",
            "data": {
                "key": key,
                "value": value,
                "cache_type": cache_type
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get cache entry", error=str(e), key=key)
        raise HTTPException(status_code=500, detail="Failed to retrieve cache entry")

@router.post("/entry")
async def set_cache_entry(
    entry: CacheEntryModel,
    cache_type: str = Query("async", description="Cache type (sync or async)"),
    current_user: Optional[Any] = Depends(security)
):
    """Set a cache entry"""
    try:
        # Check permissions
        if not current_user or Permission.API_WRITE not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        if cache_type == "sync":
            sync_cache.set(entry.key, entry.value, entry.ttl)
        elif cache_type == "async":
            await async_cache.set(entry.key, entry.value, entry.ttl)
        else:
            raise HTTPException(status_code=400, detail="Invalid cache type. Use 'sync' or 'async'")

        logger.info("Cache entry set", key=entry.key, cache_type=cache_type, user=current_user.username if current_user else "unknown")
        return {
            "status": "success",
            "message": f"Cache entry '{entry.key}' set successfully",
            "data": {
                "key": entry.key,
                "cache_type": cache_type,
                "ttl": entry.ttl
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to set cache entry", error=str(e), key=entry.key)
        raise HTTPException(status_code=500, detail="Failed to set cache entry")

@router.delete("/entry/{key}")
async def delete_cache_entry(
    key: str,
    cache_type: str = Query("async", description="Cache type (sync or async)"),
    current_user: Optional[Any] = Depends(security)
):
    """Delete a cache entry"""
    try:
        # Check permissions
        if not current_user or Permission.API_WRITE not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        if cache_type == "sync":
            deleted = sync_cache.delete(key)
        elif cache_type == "async":
            deleted = await async_cache.delete(key)
        else:
            raise HTTPException(status_code=400, detail="Invalid cache type. Use 'sync' or 'async'")

        if not deleted:
            raise HTTPException(status_code=404, detail="Cache entry not found")

        logger.info("Cache entry deleted", key=key, cache_type=cache_type, user=current_user.username if current_user else "unknown")
        return {
            "status": "success",
            "message": f"Cache entry '{key}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete cache entry", error=str(e), key=key)
        raise HTTPException(status_code=500, detail="Failed to delete cache entry")

@router.delete("/clear")
async def clear_cache(
    cache_type: str = Query("both", description="Cache type (sync, async, or both)"),
    current_user: Optional[Any] = Depends(security)
):
    """Clear cache"""
    try:
        # Check permissions
        if not current_user or Permission.API_WRITE not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        if cache_type in ["sync", "both"]:
            sync_cache.clear()
            logger.info("Sync cache cleared", user=current_user.username if current_user else "unknown")

        if cache_type in ["async", "both"]:
            await async_cache.clear()
            logger.info("Async cache cleared", user=current_user.username if current_user else "unknown")

        return {
            "status": "success",
            "message": f"{cache_type.capitalize()} cache cleared successfully"
        }
    except Exception as e:
        logger.error("Failed to clear cache", error=str(e), cache_type=cache_type)
        raise HTTPException(status_code=500, detail="Failed to clear cache")

@router.post("/cleanup")
async def cleanup_expired_entries(
    cache_type: str = Query("both", description="Cache type (sync, async, or both)"),
    current_user: Optional[Any] = Depends(security)
):
    """Cleanup expired cache entries"""
    try:
        # Check permissions
        if not current_user or Permission.API_WRITE not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        sync_cleaned = 0
        async_cleaned = 0

        if cache_type in ["sync", "both"]:
            sync_cleaned = sync_cache.cleanup_expired()
            logger.info("Sync cache cleanup completed", cleaned=sync_cleaned, user=current_user.username if current_user else "unknown")

        if cache_type in ["async", "both"]:
            async_cleaned = await async_cache.cleanup_expired()
            logger.info("Async cache cleanup completed", cleaned=async_cleaned, user=current_user.username if current_user else "unknown")

        return {
            "status": "success",
            "message": "Cache cleanup completed",
            "data": {
                "sync_entries_cleaned": sync_cleaned,
                "async_entries_cleaned": async_cleaned,
                "total_cleaned": sync_cleaned + async_cleaned
            }
        }
    except Exception as e:
        logger.error("Failed to cleanup cache", error=str(e), cache_type=cache_type)
        raise HTTPException(status_code=500, detail="Failed to cleanup cache")

@router.get("/keys")
async def get_cache_keys(
    cache_type: str = Query("async", description="Cache type (sync or async)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of keys to return"),
    current_user: Optional[Any] = Depends(security)
):
    """Get cache keys (limited for performance)"""
    try:
        # Check permissions
        if not current_user or Permission.API_READ not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        if cache_type == "sync":
            # For sync cache, we need to access the internal cache
            keys = list(sync_cache._cache.keys())[:limit]
        elif cache_type == "async":
            # For async cache, we need to access the internal cache
            keys = list(async_cache._cache.keys())[:limit]
        else:
            raise HTTPException(status_code=400, detail="Invalid cache type. Use 'sync' or 'async'")

        return {
            "status": "success",
            "data": {
                "keys": keys,
                "count": len(keys),
                "cache_type": cache_type,
                "limit": limit
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get cache keys", error=str(e), cache_type=cache_type)
        raise HTTPException(status_code=500, detail="Failed to retrieve cache keys")

@router.get("/config", response_model=Dict[str, Any])
async def get_cache_config(current_user: Optional[Any] = Depends(security)):
    """Get cache configuration"""
    try:
        # Check permissions
        if not current_user or Permission.API_READ not in current_user.permissions:
            raise HTTPException(status_code=403, detail="Insufficient permissions")

        return {
            "status": "success",
            "data": {
                "sync_cache": {
                    "max_size": sync_cache.max_size,
                    "default_ttl": sync_cache.default_ttl
                },
                "async_cache": {
                    "max_size": async_cache.max_size,
                    "default_ttl": async_cache.default_ttl
                }
            }
        }
    except Exception as e:
        logger.error("Failed to get cache config", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve cache configuration")

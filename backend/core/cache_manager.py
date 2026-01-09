"""
Enterprise Cache Manager for AgisFL - Integrated with existing caching system
"""
import json
import time
import hashlib
from typing import Any, Optional, Dict, Union
from functools import wraps
import asyncio
import logging

# Import existing cache system
try:
    from utils.caching import global_cache, initialize_cache, CacheConfig
    from core.thread_safe_cache import get_cache, get_async_cache
    EXISTING_CACHE_AVAILABLE = True
except ImportError:
    EXISTING_CACHE_AVAILABLE = False


# ===============================
# Event-driven hooks and audit trail
# ===============================
class CacheEventHooks:
    def __init__(self, logger):
        self.logger = logger

    def emit_event(self, event_type: str, details: Dict[str, Any]):
        self.logger.info(f"CACHE_MANAGER EVENT: {event_type}", extra={"details": details})

    def log_audit(self, action: str, details: Dict[str, Any]):
        self.logger.info(f"AUDIT: {action}", extra={"details": details})


class EnterpriseCache:
    """Enterprise cache manager integrating existing systems"""
    def __init__(self):
        self.memory_cache = {}
        self.redis_client = None
        self.cache_stats = {"hits": 0, "misses": 0, "sets": 0}
        self.thread_safe_cache = None
        self.async_cache = None
        self.logger = logging.getLogger("core.cache_manager")
        self.event_hooks = CacheEventHooks(self.logger)
        self._init_caches()

    def _init_caches(self):
        """Initialize all available cache systems"""
        try:
            import redis
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True,
                socket_timeout=1,
                socket_connect_timeout=1
            )
            self.redis_client.ping()
            self.logger.info("Redis cache connected")
            self.event_hooks.emit_event("redis_cache_connected", {})
        except Exception as e:
            self.logger.error(f"Redis unavailable: {str(e)}")
            self.redis_client = None
            self.event_hooks.emit_event("redis_cache_unavailable", {"error": str(e)})
        if EXISTING_CACHE_AVAILABLE:
            try:
                self.thread_safe_cache = get_cache()
                self.async_cache = get_async_cache()
                self.logger.info("Thread-safe cache systems loaded")
                self.event_hooks.emit_event("thread_safe_cache_loaded", {})
            except Exception as e:
                self.logger.error(f"Thread-safe cache unavailable: {str(e)}")
                self.event_hooks.emit_event("thread_safe_cache_unavailable", {"error": str(e)})

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (try all systems)"""
        try:
            if self.async_cache:
                value = await self.async_cache.get(key)
                if value is not None:
                    self.cache_stats["hits"] += 1
                    self.event_hooks.emit_event("cache_hit", {"key": key, "source": "async_cache"})
                    self.event_hooks.log_audit("cache_hit", {"key": key, "source": "async_cache"})
                    return value
            if self.thread_safe_cache:
                value = self.thread_safe_cache.get(key)
                if value is not None:
                    self.cache_stats["hits"] += 1
                    self.event_hooks.emit_event("cache_hit", {"key": key, "source": "thread_safe_cache"})
                    self.event_hooks.log_audit("cache_hit", {"key": key, "source": "thread_safe_cache"})
                    return value
            if self.redis_client:
                value = self.redis_client.get(f"agisfl:{key}")
                if value:
                    self.cache_stats["hits"] += 1
                    self.event_hooks.emit_event("cache_hit", {"key": key, "source": "redis"})
                    self.event_hooks.log_audit("cache_hit", {"key": key, "source": "redis"})
                    return json.loads(value)
            
            # Fallback to memory cache
            if key in self.memory_cache:
                entry = self.memory_cache[key]
                if entry["expires"] > time.time():
                    self.cache_stats["hits"] += 1
                    return entry["value"]
                else:
                    del self.memory_cache[key]
            
            self.cache_stats["misses"] += 1
            return None
            
        except Exception as e:
            self.logger.error(f"Cache get error: {e}")
            self.cache_stats["misses"] += 1
            return None
    
    async def set(self, key: str, value: Any, expire: int = 300) -> bool:
        """Set value in all available caches"""
        success = True
        
        try:
            # Set in async cache
            if self.async_cache:
                await self.async_cache.set(key, value, expire)
            
            # Set in thread-safe cache
            if self.thread_safe_cache:
                self.thread_safe_cache.set(key, value, expire)
            
            # Set in Redis
            if self.redis_client:
                serialized = json.dumps(value, default=str)
                self.redis_client.setex(f"agisfl:{key}", expire, serialized)
            
            # Set in memory cache as final fallback
            self.memory_cache[key] = {
                "value": value,
                "expires": time.time() + expire
            }
            
            self.cache_stats["sets"] += 1
            return success
            
        except Exception as e:
            self.logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from all caches"""
        try:
            # Delete from all systems
            if self.async_cache:
                await self.async_cache.delete(key)
            
            if self.thread_safe_cache:
                self.thread_safe_cache.delete(key)
            
            if self.redis_client:
                self.redis_client.delete(f"agisfl:{key}")
            
            if key in self.memory_cache:
                del self.memory_cache[key]
            
            return True
        except Exception as e:
            self.logger.error(f"Cache delete error: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear all caches"""
        try:
            # Clear all systems
            if self.async_cache:
                await self.async_cache.clear()
            
            if self.thread_safe_cache:
                self.thread_safe_cache.clear()
            
            if self.redis_client:
                keys = self.redis_client.keys("agisfl:*")
                if keys:
                    self.redis_client.delete(*keys)
            
            self.memory_cache.clear()
            return True
        except Exception as e:
            self.logger.error(f"Cache clear error: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        hit_rate = (self.cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        stats = {
            "hits": self.cache_stats["hits"],
            "misses": self.cache_stats["misses"],
            "sets": self.cache_stats["sets"],
            "hit_rate_percent": round(hit_rate, 2),
            "memory_cache_size": len(self.memory_cache),
            "redis_available": self.redis_client is not None,
            "thread_safe_cache_available": self.thread_safe_cache is not None,
            "async_cache_available": self.async_cache is not None
        }
        
        # Add stats from other cache systems
        if self.thread_safe_cache:
            stats["thread_safe_stats"] = self.thread_safe_cache.get_stats()
        
        return stats
    
    def cleanup_expired(self):
        """Clean up expired entries from all caches"""
        # Memory cache cleanup
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.memory_cache.items()
            if entry["expires"] <= current_time
        ]
        for key in expired_keys:
            del self.memory_cache[key]
        
        # Thread-safe cache cleanup
        if self.thread_safe_cache:
            self.thread_safe_cache.cleanup_expired()

# Global cache manager
cache_manager = EnterpriseCache()

def cache(expire: int = 300, key_prefix: str = ""):
    """Cache decorator for functions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key_data = f"{key_prefix}{func.__name__}{str(args)}{str(sorted(kwargs.items()))}"
            cache_key = hashlib.sha256(key_data.encode()).hexdigest()
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, expire)
            
            return result
        return wrapper
    return decorator
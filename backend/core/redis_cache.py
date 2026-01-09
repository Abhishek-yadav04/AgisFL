#!/usr/bin/env python3
"""
Redis Cache Implementation for High-Performance API Operations
============================================================

Production-grade Redis caching system with automatic expiration,
connection pooling, and performance monitoring for sub-200ms responses.
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from functools import wraps
import hashlib

try:
    import redis.asyncio as redis
    from redis.asyncio import ConnectionPool
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class RedisCacheManager:
    """Production Redis cache manager with connection pooling"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        self.redis_url = redis_url
        self.pool = None
        self.client = None
        self.connected = False
        self.cache_stats = {
            "hits": 0,
            "misses": 0,
            "sets": 0,
            "deletes": 0,
            "errors": 0
        }
        
    async def initialize(self) -> bool:
        """Initialize Redis connection with retry logic"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available - using in-memory fallback cache")
            self.fallback_cache = {}
            self.fallback_expiry = {}
            return False
            
        try:
            # Create connection pool for high performance
            self.pool = ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
            self.client = redis.Redis(connection_pool=self.pool)
            
            # Test connection
            await self.client.ping()
            self.connected = True
            
            logger.info("✅ Redis cache manager initialized successfully")
            return True
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Using fallback cache.")
            self.fallback_cache = {}
            self.fallback_expiry = {}
            return False
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate deterministic cache key from arguments"""
        key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return f"agisfl:{hashlib.md5(key_data.encode()).hexdigest()}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache with automatic deserialization"""
        try:
            if self.connected and self.client:
                value = await self.client.get(key)
                if value:
                    self.cache_stats["hits"] += 1
                    return json.loads(value.decode('utf-8'))
                else:
                    self.cache_stats["misses"] += 1
                    return None
            else:
                # Fallback cache
                if key in self.fallback_cache:
                    expiry_time = self.fallback_expiry.get(key)
                    if expiry_time and datetime.now() > expiry_time:
                        del self.fallback_cache[key]
                        del self.fallback_expiry[key]
                        self.cache_stats["misses"] += 1
                        return None
                    self.cache_stats["hits"] += 1
                    return self.fallback_cache[key]
                else:
                    self.cache_stats["misses"] += 1
                    return None
                    
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            self.cache_stats["errors"] += 1
            return None
    
    async def set(self, key: str, value: Any, expire_seconds: int = 300) -> bool:
        """Set value in cache with automatic serialization and expiration"""
        try:
            if self.connected and self.client:
                serialized = json.dumps(value, default=str)
                await self.client.setex(key, expire_seconds, serialized)
                self.cache_stats["sets"] += 1
                return True
            else:
                # Fallback cache
                self.fallback_cache[key] = value
                self.fallback_expiry[key] = datetime.now() + timedelta(seconds=expire_seconds)
                self.cache_stats["sets"] += 1
                return True
                
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            self.cache_stats["errors"] += 1
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if self.connected and self.client:
                await self.client.delete(key)
                self.cache_stats["deletes"] += 1
                return True
            else:
                # Fallback cache
                if key in self.fallback_cache:
                    del self.fallback_cache[key]
                if key in self.fallback_expiry:
                    del self.fallback_expiry[key]
                self.cache_stats["deletes"] += 1
                return True
                
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            self.cache_stats["errors"] += 1
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        try:
            if self.connected and self.client:
                keys = await self.client.keys(pattern)
                if keys:
                    deleted = await self.client.delete(*keys)
                    self.cache_stats["deletes"] += deleted
                    return deleted
                return 0
            else:
                # Fallback cache pattern matching
                deleted = 0
                keys_to_delete = []
                for key in self.fallback_cache.keys():
                    if pattern.replace('*', '') in key:
                        keys_to_delete.append(key)
                
                for key in keys_to_delete:
                    del self.fallback_cache[key]
                    if key in self.fallback_expiry:
                        del self.fallback_expiry[key]
                    deleted += 1
                    
                self.cache_stats["deletes"] += deleted
                return deleted
                
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            self.cache_stats["errors"] += 1
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache performance statistics"""
        total_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        hit_rate = (self.cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            **self.cache_stats,
            "hit_rate_percent": round(hit_rate, 2),
            "total_requests": total_requests,
            "connected": self.connected,
            "cache_type": "redis" if self.connected else "memory"
        }
    
    async def health_check(self) -> Dict[str, Any]:
        """Health check for cache system"""
        if self.connected and self.client:
            try:
                start_time = time.time()
                await self.client.ping()
                latency = (time.time() - start_time) * 1000
                
                return {
                    "status": "healthy",
                    "latency_ms": round(latency, 2),
                    "connected": True,
                    "cache_type": "redis"
                }
            except Exception as e:
                return {
                    "status": "unhealthy",
                    "error": str(e),
                    "connected": False,
                    "cache_type": "redis"
                }
        else:
            return {
                "status": "healthy",
                "latency_ms": 0.1,
                "connected": False,
                "cache_type": "memory"
            }
    
    async def shutdown(self):
        """Gracefully shutdown cache connections"""
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()
        logger.info("Redis cache manager shut down")

# Global cache manager instance
cache_manager = None

async def get_cache_manager() -> RedisCacheManager:
    """Get or create global cache manager"""
    global cache_manager
    if cache_manager is None:
        cache_manager = RedisCacheManager()
        await cache_manager.initialize()
    return cache_manager

def cache_result(expire_seconds: int = 300, prefix: str = "api"):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = await get_cache_manager()
            
            # Generate cache key
            cache_key = cache._generate_cache_key(f"{prefix}:{func.__name__}", *args, **kwargs)
            
            # Try to get from cache
            cached_result = await cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            start_time = time.time()
            result = await func(*args, **kwargs)
            execution_time = (time.time() - start_time) * 1000
            
            # Cache the result
            await cache.set(cache_key, result, expire_seconds)
            
            logger.debug(f"Function {func.__name__} executed in {execution_time:.2f}ms, cached for {expire_seconds}s")
            
            return result
        return wrapper
    return decorator

def cache_fl_experiments(expire_seconds: int = 60):
    """Specialized cache decorator for FL experiments"""
    return cache_result(expire_seconds=expire_seconds, prefix="fl_experiments")

def cache_datasets(expire_seconds: int = 300):
    """Specialized cache decorator for datasets"""
    return cache_result(expire_seconds=expire_seconds, prefix="datasets")

def cache_metrics(expire_seconds: int = 30):
    """Specialized cache decorator for metrics"""
    return cache_result(expire_seconds=expire_seconds, prefix="metrics")

class CacheInvalidation:
    """Cache invalidation utilities"""
    
    @staticmethod
    async def invalidate_fl_experiments():
        """Invalidate all FL experiment caches"""
        cache = await get_cache_manager()
        return await cache.clear_pattern("agisfl:*fl_experiments*")
    
    @staticmethod
    async def invalidate_datasets():
        """Invalidate all dataset caches"""
        cache = await get_cache_manager()
        return await cache.clear_pattern("agisfl:*datasets*")
    
    @staticmethod
    async def invalidate_metrics():
        """Invalidate all metrics caches"""
        cache = await get_cache_manager()
        return await cache.clear_pattern("agisfl:*metrics*")
    
    @staticmethod
    async def invalidate_all():
        """Invalidate all caches"""
        cache = await get_cache_manager()
        return await cache.clear_pattern("agisfl:*")

# Performance monitoring utilities
class PerformanceMonitor:
    """Monitor API performance and caching effectiveness"""
    
    def __init__(self):
        self.request_times = []
        self.cache_effectiveness = {}
    
    def record_request_time(self, endpoint: str, duration_ms: float):
        """Record API request time"""
        self.request_times.append({
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "timestamp": datetime.now()
        })
        
        # Keep only last 1000 requests
        if len(self.request_times) > 1000:
            self.request_times = self.request_times[-1000:]
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.request_times:
            return {"status": "no_data"}
        
        recent_times = [r["duration_ms"] for r in self.request_times[-100:]]
        
        return {
            "avg_response_time_ms": sum(recent_times) / len(recent_times),
            "max_response_time_ms": max(recent_times),
            "min_response_time_ms": min(recent_times),
            "sub_200ms_percent": (len([t for t in recent_times if t < 200]) / len(recent_times)) * 100,
            "total_requests": len(self.request_times),
            "recent_requests": len(recent_times)
        }

# Global performance monitor
performance_monitor = PerformanceMonitor()

def monitor_performance(func):
    """Decorator to monitor endpoint performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            
            performance_monitor.record_request_time(func.__name__, duration_ms)
            
            if duration_ms > 200:
                logger.warning(f"Slow endpoint {func.__name__}: {duration_ms:.2f}ms")
            
            return result
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            performance_monitor.record_request_time(f"{func.__name__}_error", duration_ms)
            raise
    
    return wrapper
"""
Advanced Caching System for Performance Optimization
Provides Redis-based caching, in-memory caching, and cache management utilities
"""

import asyncio
import time
import json
import hashlib
import logging
import pickle
from typing import Any, Dict, List, Optional, Union, Callable, TypeVar, Generic, TYPE_CHECKING
from functools import lru_cache
from datetime import datetime, timedelta
from collections import OrderedDict
from dataclasses import dataclass
import functools
import weakref

# Import caching dependencies with fallbacks
try:
    import redis
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    import msgpack
    MSGPACK_AVAILABLE = True
except ImportError:
    MSGPACK_AVAILABLE = False

try:
    import lz4.frame
    LZ4_AVAILABLE = True
except ImportError:
    LZ4_AVAILABLE = False

logger = logging.getLogger("utils.caching")

T = TypeVar('T')

@dataclass
class CacheConfig:
    """Cache configuration settings"""
    default_ttl: int = 3600  # 1 hour
    max_memory_size: int = 100 * 1024 * 1024  # 100MB
    max_items: int = 10000
    compression_enabled: bool = True
    compression_threshold: int = 1024  # Compress if data > 1KB
    serialization_format: str = "json"  # json, pickle, msgpack
    key_prefix: str = "agisfl:"
    redis_url: Optional[str] = None
    redis_db: int = 0
    redis_max_connections: int = 10

class CacheEntry:
    """Cache entry with metadata"""
    
    def __init__(
        self,
        value: Any,
        ttl: Optional[int] = None,
        created_at: Optional[datetime] = None,
        hit_count: int = 0,
        size: Optional[int] = None
    ):
        self.value = value
        self.ttl = ttl
        self.created_at = created_at or datetime.utcnow()
        self.hit_count = hit_count
        self.size = size or self._calculate_size(value)
        self.last_accessed = self.created_at
    
    def _calculate_size(self, value: Any) -> int:
        """Estimate size of cached value"""
        try:
            if isinstance(value, (str, bytes)):
                return len(value)
            elif isinstance(value, (int, float, bool)):
                return 8
            elif isinstance(value, (list, tuple, dict)):
                return len(json.dumps(value, default=str).encode())
            else:
                return len(pickle.dumps(value))
        except Exception:
            return 100  # Default estimate
    
    def is_expired(self) -> bool:
        """Check if cache entry is expired"""
        if self.ttl is None:
            return False
        
        age = (datetime.utcnow() - self.created_at).total_seconds()
        return age > self.ttl
    
    def access(self) -> Any:
        """Access cache entry and update metadata"""
        self.hit_count += 1
        self.last_accessed = datetime.utcnow()
        return self.value

class MemoryCache:
    """High-performance in-memory cache with LRU eviction"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.cache = OrderedDict()
        self.total_size = 0
        self.stats = {
            "hits": 0,
            "misses": 0,
            "evictions": 0,
            "expired": 0
        }
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key"""
        return f"{self.config.key_prefix}{key}"
    
    def _serialize_value(self, value: Any) -> bytes:
        """Serialize value for storage"""
        try:
            if self.config.serialization_format == "json":
                data = json.dumps(value, default=str).encode()
            elif self.config.serialization_format == "pickle":
                data = pickle.dumps(value)
            elif self.config.serialization_format == "msgpack" and MSGPACK_AVAILABLE:
                data = msgpack.packb(value)
            else:
                data = json.dumps(value, default=str).encode()
            
            # Apply compression if enabled and data is large enough
            if (self.config.compression_enabled and 
                len(data) > self.config.compression_threshold and 
                LZ4_AVAILABLE):
                data = lz4.frame.compress(data)
            
            return data
        except Exception as e:
            logger.error(f"Serialization failed: {e}")
            return b""
    
    def _deserialize_value(self, data: bytes) -> Any:
        """Deserialize value from storage"""
        try:
            # Try decompression first if LZ4 is available
            if LZ4_AVAILABLE:
                try:
                    data = lz4.frame.decompress(data)
                except lz4.frame.LZ4FrameError:
                    pass  # Data was not compressed
            
            if self.config.serialization_format == "json":
                return json.loads(data.decode())
            elif self.config.serialization_format == "pickle":
                return pickle.loads(data)
            elif self.config.serialization_format == "msgpack" and MSGPACK_AVAILABLE:
                return msgpack.unpackb(data)
            else:
                return json.loads(data.decode())
        except Exception as e:
            logger.error(f"Deserialization failed: {e}")
            return None
    
    def _evict_lru(self):
        """Evict least recently used items"""
        while (len(self.cache) >= self.config.max_items or 
               self.total_size >= self.config.max_memory_size):
            if not self.cache:
                break
            
            key, entry = self.cache.popitem(last=False)
            self.total_size -= entry.size
            self.stats["evictions"] += 1
            
            logger.debug(f"Evicted cache entry: {key}")
    
    def _cleanup_expired(self):
        """Remove expired entries"""
        expired_keys = []
        
        for key, entry in self.cache.items():
            if entry.is_expired():
                expired_keys.append(key)
        
        for key in expired_keys:
            entry = self.cache.pop(key)
            self.total_size -= entry.size
            self.stats["expired"] += 1
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        cache_key = self._make_key(key)
        
        if cache_key not in self.cache:
            self.stats["misses"] += 1
            return None
        
        entry = self.cache[cache_key]
        
        if entry.is_expired():
            del self.cache[cache_key]
            self.total_size -= entry.size
            self.stats["expired"] += 1
            self.stats["misses"] += 1
            return None
        
        # Move to end (most recently used)
        self.cache.move_to_end(cache_key)
        self.stats["hits"] += 1
        
        return entry.access()
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        cache_key = self._make_key(key)
        ttl = ttl or self.config.default_ttl
        
        try:
            # Create cache entry
            entry = CacheEntry(value, ttl)
            
            # Remove existing entry if present
            if cache_key in self.cache:
                old_entry = self.cache[cache_key]
                self.total_size -= old_entry.size
            
            # Check if we need to evict items
            self._evict_lru()
            
            # Add new entry
            self.cache[cache_key] = entry
            self.total_size += entry.size
            
            # Periodic cleanup
            if len(self.cache) % 100 == 0:
                self._cleanup_expired()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to set cache entry {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        cache_key = self._make_key(key)
        
        if cache_key in self.cache:
            entry = self.cache.pop(cache_key)
            self.total_size -= entry.size
            return True
        
        return False
    
    def clear(self):
        """Clear all cache entries"""
        self.cache.clear()
        self.total_size = 0
        self.stats = {"hits": 0, "misses": 0, "evictions": 0, "expired": 0}
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "entries": len(self.cache),
            "total_size": self.total_size,
            "max_size": self.config.max_memory_size,
            "max_items": self.config.max_items,
            "hit_rate": hit_rate,
            **self.stats
        }

class RedisCache:
    """Redis-based distributed cache"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.redis_client = None
        self.is_connected = False
        self.stats = {
            "hits": 0,
            "misses": 0,
            "errors": 0
        }
    
    async def connect(self):
        """Connect to Redis"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available - using memory cache only")
            return False
        
        if not self.config.redis_url:
            logger.warning("Redis URL not configured")
            return False
        
        try:
            self.redis_client = aioredis.from_url(
                self.config.redis_url,
                db=self.config.redis_db,
                max_connections=self.config.redis_max_connections,
                decode_responses=False,  # We handle encoding ourselves
                socket_timeout=2.0,  # 2 second timeout
                socket_connect_timeout=2.0,  # 2 second connection timeout
                retry_on_timeout=False  # Don't retry on timeout
            )
            
            # Test connection with timeout
            await asyncio.wait_for(self.redis_client.ping(), timeout=2.0)
            self.is_connected = True
            
            logger.info("Connected to Redis cache")
            return True
            
        except asyncio.TimeoutError:
            logger.warning("Redis unavailable: Connection timeout")
            self.is_connected = False
            return False
        except Exception as e:
            logger.warning(f"Redis unavailable: {str(e)[:100]}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.is_connected = False
    
    def _make_key(self, key: str) -> str:
        """Create prefixed cache key"""
        return f"{self.config.key_prefix}{key}"
    
    def _serialize_value(self, value: Any) -> bytes:
        """Serialize value for Redis storage"""
        try:
            if self.config.serialization_format == "json":
                data = json.dumps(value, default=str).encode()
            elif self.config.serialization_format == "pickle":
                data = pickle.dumps(value)
            elif self.config.serialization_format == "msgpack" and MSGPACK_AVAILABLE:
                data = msgpack.packb(value)
            else:
                data = json.dumps(value, default=str).encode()
            
            # Apply compression if enabled
            if (self.config.compression_enabled and 
                len(data) > self.config.compression_threshold and 
                LZ4_AVAILABLE):
                data = lz4.frame.compress(data)
            
            return data
        except Exception as e:
            logger.error(f"Redis serialization failed: {e}")
            return b""
    
    def _deserialize_value(self, data: bytes) -> Any:
        """Deserialize value from Redis storage"""
        try:
            # Try decompression first if LZ4 is available
            if LZ4_AVAILABLE:
                try:
                    data = lz4.frame.decompress(data)
                except lz4.frame.LZ4FrameError:
                    pass  # Data was not compressed
            
            if self.config.serialization_format == "json":
                return json.loads(data.decode())
            elif self.config.serialization_format == "pickle":
                return pickle.loads(data)
            elif self.config.serialization_format == "msgpack" and MSGPACK_AVAILABLE:
                msgpack_lib = _get_msgpack()
                if msgpack_lib:
                    return msgpack_lib.unpackb(data)
                else:
                    return json.loads(data.decode())
            else:
                return json.loads(data.decode())
        except Exception as e:
            logger.error(f"Redis deserialization failed: {e}")
            return None
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from Redis cache"""
        if not self.is_connected:
            self.stats["misses"] += 1
            return None
        
        cache_key = self._make_key(key)
        
        try:
            data = await self.redis_client.get(cache_key)
            
            if data is None:
                self.stats["misses"] += 1
                return None
            
            value = self._deserialize_value(data)
            self.stats["hits"] += 1
            
            return value
            
        except Exception as e:
            logger.error(f"Redis get failed for key {key}: {e}")
            self.stats["errors"] += 1
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in Redis cache"""
        if not self.is_connected:
            return False
        
        cache_key = self._make_key(key)
        ttl = ttl or self.config.default_ttl
        
        try:
            data = self._serialize_value(value)
            
            if not data:
                return False
            
            result = await self.redis_client.setex(cache_key, ttl, data)
            return result is True
            
        except Exception as e:
            logger.error(f"Redis set failed for key {key}: {e}")
            self.stats["errors"] += 1
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from Redis cache"""
        if not self.is_connected:
            return False
        
        cache_key = self._make_key(key)
        
        try:
            result = await self.redis_client.delete(cache_key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Redis delete failed for key {key}: {e}")
            self.stats["errors"] += 1
            return False
    
    async def clear(self, pattern: str = None):
        """Clear cache entries"""
        if not self.is_connected:
            return
        
        try:
            if pattern:
                pattern = self._make_key(pattern)
            else:
                pattern = f"{self.config.key_prefix}*"
            
            keys = await self.redis_client.keys(pattern)
            
            if keys:
                await self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cache entries")
            
        except Exception as e:
            logger.error(f"Redis clear failed: {e}")
            self.stats["errors"] += 1
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get Redis cache statistics"""
        stats = self.stats.copy()
        
        if self.is_connected:
            try:
                info = await self.redis_client.info("memory")
                stats.update({
                    "redis_memory_used": info.get("used_memory", 0),
                    "redis_memory_peak": info.get("used_memory_peak", 0),
                    "redis_connected_clients": info.get("connected_clients", 0)
                })
            except Exception as e:
                logger.error(f"Failed to get Redis info: {e}")
        
        total_requests = stats["hits"] + stats["misses"]
        stats["hit_rate"] = (stats["hits"] / total_requests * 100) if total_requests > 0 else 0
        stats["connected"] = self.is_connected
        
        return stats

class HybridCache:
    """Hybrid cache combining memory and Redis caches"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.memory_cache = MemoryCache(config)
        self.redis_cache = RedisCache(config)
        self.use_redis = False
    
    async def initialize(self):
        """Initialize cache systems"""
        # Try to connect to Redis
        self.use_redis = await self.redis_cache.connect()
        
        if self.use_redis:
            logger.info("Hybrid cache initialized with Redis support")
        else:
            logger.info("Hybrid cache initialized with memory-only support")
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache (memory first, then Redis)"""
        # Try memory cache first
        value = self.memory_cache.get(key)
        
        if value is not None:
            return value
        
        # Try Redis cache if available
        if self.use_redis:
            value = await self.redis_cache.get(key)
            
            if value is not None:
                # Store in memory cache for faster access
                self.memory_cache.set(key, value, self.config.default_ttl)
                return value
        
        return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in both caches"""
        success = True
        
        # Set in memory cache
        if not self.memory_cache.set(key, value, ttl):
            success = False
        
        # Set in Redis cache if available
        if self.use_redis:
            if not await self.redis_cache.set(key, value, ttl):
                success = False
        
        return success
    
    async def delete(self, key: str) -> bool:
        """Delete value from both caches"""
        memory_deleted = self.memory_cache.delete(key)
        redis_deleted = True
        
        if self.use_redis:
            redis_deleted = await self.redis_cache.delete(key)
        
        return memory_deleted or redis_deleted
    
    async def clear(self, pattern: str = None):
        """Clear both caches"""
        self.memory_cache.clear()
        
        if self.use_redis:
            await self.redis_cache.clear(pattern)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get combined cache statistics"""
        memory_stats = self.memory_cache.get_stats()
        redis_stats = await self.redis_cache.get_stats() if self.use_redis else {}
        
        return {
            "memory": memory_stats,
            "redis": redis_stats,
            "hybrid_enabled": self.use_redis
        }

class CacheDecorator:
    """Decorator for function result caching"""
    
    def __init__(self, cache: HybridCache):
        self.cache = cache
    
    def cached(
        self,
        ttl: Optional[int] = None,
        key_func: Optional[Callable] = None,
        namespace: str = "func"
    ):
        """Cache function results"""
        def decorator(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                # Generate cache key
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    key_parts = [namespace, func.__name__]
                    if args:
                        key_parts.extend(str(arg) for arg in args)
                    if kwargs:
                        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                    
                    cache_key = hashlib.sha256(":".join(key_parts).encode()).hexdigest()
                
                # Try to get from cache
                cached_result = await self.cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Execute function and cache result
                result = await func(*args, **kwargs)
                await self.cache.set(cache_key, result, ttl)
                
                return result
            
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                # For sync functions, we need to create a simple wrapper
                # This is a simplified version that uses only memory cache
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    key_parts = [namespace, func.__name__]
                    if args:
                        key_parts.extend(str(arg) for arg in args)
                    if kwargs:
                        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                    
                    cache_key = hashlib.sha256(":".join(key_parts).encode()).hexdigest()
                
                # Try memory cache only for sync functions
                cached_result = self.cache.memory_cache.get(cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                self.cache.memory_cache.set(cache_key, result, ttl)
                
                return result
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        
        return decorator

# Global cache instances
default_config = CacheConfig()
global_cache = HybridCache(default_config)
cache_decorator = CacheDecorator(global_cache)

# Utility functions
async def initialize_cache(config: CacheConfig = None):
    """Initialize the global cache system"""
    global global_cache, cache_decorator
    
    if config:
        global_cache = HybridCache(config)
        cache_decorator = CacheDecorator(global_cache)
    
    await global_cache.initialize()
    logger.info("Cache system initialized")

async def get_cache_health() -> Dict[str, Any]:
    """Get cache system health status"""
    stats = await global_cache.get_stats()
    
    health = {
        "status": "healthy",
        "memory_cache_active": True,
        "redis_cache_active": global_cache.use_redis,
        "stats": stats
    }
    
    # Check for issues
    if stats.get("redis", {}).get("errors", 0) > 10:
        health["status"] = "degraded"
        health["issues"] = ["High Redis error rate"]
    
    return health

def cached(ttl: Optional[int] = None, key_func: Optional[Callable] = None, namespace: str = "func"):
    """Decorator for caching function results"""
    return cache_decorator.cached(ttl, key_func, namespace)

# Export key classes and functions
__all__ = [
    'CacheConfig',
    'CacheEntry',
    'MemoryCache',
    'RedisCache',
    'HybridCache',
    'CacheDecorator',
    'global_cache',
    'initialize_cache',
    'get_cache_health',
    'cached'
]

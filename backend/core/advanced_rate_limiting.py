"""
Advanced Rate Limiting and Request Throttling Module
Provides sophisticated rate limiting with user-based, IP-based, and endpoint-based controls
"""

import time
import asyncio
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Callable
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None
    
from fastapi import Request, HTTPException, status
import structlog

logger = structlog.get_logger()

class RateLimitExceeded(HTTPException):
    """Custom rate limit exceeded exception"""
    def __init__(self, detail: str, retry_after: Optional[int] = None):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)
        self.retry_after = retry_after

class RateLimitRule:
    """Defines a rate limiting rule"""
    
    def __init__(
        self,
        requests: int,
        window: int,  # seconds
        per: str = "ip",  # ip, user, endpoint, global
        burst_multiplier: float = 1.5,
        grace_period: int = 0  # seconds of grace period for new users
    ):
        self.requests = requests
        self.window = window
        self.per = per
        self.burst_limit = int(requests * burst_multiplier)
        self.grace_period = grace_period
        
    def __str__(self):
        return f"{self.requests} requests per {self.window}s ({self.per})"

class AdvancedRateLimiter:
    """Advanced rate limiter with multiple strategies and persistence"""
    
    def __init__(self, redis_client: Optional[Any] = None):
        if not REDIS_AVAILABLE:
            redis_client = None  # Force to None if Redis not available
        self.redis_client = redis_client
        self.local_cache: Dict[str, deque] = defaultdict(deque)
        self.user_first_seen: Dict[str, datetime] = {}
        self.suspicious_ips: set = set()
        self.whitelist_ips: set = set()
        self.blacklist_ips: set = set()
        
        # Default rules for different endpoints
        self.default_rules = {
            "auth_login": RateLimitRule(5, 300, "ip"),  # 5 login attempts per 5 minutes
            "auth_register": RateLimitRule(3, 3600, "ip"),  # 3 registrations per hour
            "auth_forgot_password": RateLimitRule(3, 3600, "ip"),  # 3 password resets per hour
            "api_default": RateLimitRule(100, 60, "user"),  # 100 requests per minute per user
            "api_upload": RateLimitRule(10, 60, "user"),  # 10 uploads per minute
            "api_heavy": RateLimitRule(10, 300, "user"),  # 10 heavy operations per 5 minutes
            "websocket": RateLimitRule(1000, 60, "ip"),  # 1000 WS messages per minute
            "global": RateLimitRule(10000, 60, "global"),  # Global limit
        }
        
        # Adaptive rules based on system load
        self.adaptive_rules: Dict[str, RateLimitRule] = {}
        self.system_load_factor = 1.0
        
    async def initialize(self):
        """Initialize the rate limiter"""
        logger.info("Initializing advanced rate limiter")
        
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available, using in-memory rate limiting")
            self.redis_client = None
        
        # Load persistent data if Redis is available
        if self.redis_client:
            try:
                await self._load_persistent_data()
                logger.info("Rate limiter data loaded from Redis")
            except Exception as e:
                logger.warning("Failed to load rate limiter data from Redis", error=str(e))
    
    async def _load_persistent_data(self):
        """Load persistent rate limiting data from Redis"""
        if not self.redis_client:
            return
            
        # Load suspicious IPs
        suspicious_data = await self.redis_client.get("rate_limiter:suspicious_ips")
        if suspicious_data:
            self.suspicious_ips = set(json.loads(suspicious_data))
        
        # Load whitelist
        whitelist_data = await self.redis_client.get("rate_limiter:whitelist_ips")
        if whitelist_data:
            self.whitelist_ips = set(json.loads(whitelist_data))
        
        # Load blacklist
        blacklist_data = await self.redis_client.get("rate_limiter:blacklist_ips")
        if blacklist_data:
            self.blacklist_ips = set(json.loads(blacklist_data))
    
    async def _save_persistent_data(self):
        """Save persistent rate limiting data to Redis"""
        if not self.redis_client:
            return
            
        try:
            # Save suspicious IPs
            await self.redis_client.setex(
                "rate_limiter:suspicious_ips",
                3600,  # 1 hour TTL
                json.dumps(list(self.suspicious_ips))
            )
            
            # Save whitelist
            await self.redis_client.setex(
                "rate_limiter:whitelist_ips", 
                86400,  # 24 hour TTL
                json.dumps(list(self.whitelist_ips))
            )
            
            # Save blacklist
            await self.redis_client.setex(
                "rate_limiter:blacklist_ips",
                86400,  # 24 hour TTL
                json.dumps(list(self.blacklist_ips))
            )
        except Exception as e:
            logger.warning("Failed to save rate limiter data to Redis", error=str(e))
    
    def add_to_whitelist(self, ip: str):
        """Add IP to whitelist"""
        self.whitelist_ips.add(ip)
        asyncio.create_task(self._save_persistent_data())
        logger.info("IP added to whitelist", ip=ip)
    
    def add_to_blacklist(self, ip: str, duration: int = 3600):
        """Add IP to blacklist"""
        self.blacklist_ips.add(ip)
        asyncio.create_task(self._save_persistent_data())
        logger.warning("IP added to blacklist", ip=ip, duration=duration)
        
        # Schedule removal from blacklist
        async def remove_from_blacklist():
            await asyncio.sleep(duration)
            self.blacklist_ips.discard(ip)
            await self._save_persistent_data()
            logger.info("IP removed from blacklist", ip=ip)
        
        asyncio.create_task(remove_from_blacklist())
    
    def mark_suspicious(self, ip: str):
        """Mark IP as suspicious"""
        self.suspicious_ips.add(ip)
        asyncio.create_task(self._save_persistent_data())
        logger.warning("IP marked as suspicious", ip=ip)
    
    async def is_rate_limited(
        self,
        request: Request,
        rule_name: str = "api_default",
        user_id: Optional[str] = None,
        custom_rule: Optional[RateLimitRule] = None
    ) -> Tuple[bool, Optional[int], Dict[str, Any]]:
        """
        Check if request should be rate limited
        Returns: (is_limited, retry_after_seconds, headers)
        """
        
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Check blacklist
        if client_ip in self.blacklist_ips:
            logger.warning("Request from blacklisted IP", ip=client_ip)
            raise RateLimitExceeded("IP address is blacklisted", retry_after=3600)
        
        # Skip whitelist
        if client_ip in self.whitelist_ips:
            return False, None, {}
        
        # Get rate limit rule
        rule = custom_rule or self.adaptive_rules.get(rule_name) or self.default_rules.get(rule_name)
        if not rule:
            rule = self.default_rules["api_default"]
        
        # Adjust rule based on system load
        adjusted_rule = self._adjust_rule_for_load(rule)
        
        # Determine key for rate limiting
        limit_key = self._get_limit_key(request, adjusted_rule, user_id, client_ip)
        
        # Check rate limit
        current_time = time.time()
        is_limited, retry_after = await self._check_rate_limit(limit_key, adjusted_rule, current_time)
        
        # Get current usage for headers
        usage = await self._get_current_usage(limit_key, adjusted_rule, current_time)
        
        from backend.utils.security_utils import sanitize_html
        headers = {
            "X-RateLimit-Limit": sanitize_html(str(adjusted_rule.requests)),
            "X-RateLimit-Remaining": sanitize_html(str(max(0, adjusted_rule.requests - usage))),
            "X-RateLimit-Reset": sanitize_html(str(int(current_time + adjusted_rule.window))),
            "X-RateLimit-Window": sanitize_html(str(adjusted_rule.window))
        }
        
        if retry_after:
            headers["Retry-After"] = str(retry_after)
        
        # Enhanced monitoring for suspicious activity
        if is_limited:
            from backend.utils.security_utils import sanitize_html
            safe_client_ip = sanitize_html(client_ip)
            safe_user_id = sanitize_html(user_id) if user_id else None
            await self._handle_rate_limit_violation(safe_client_ip, safe_user_id, rule_name, adjusted_rule)
        
        return is_limited, retry_after, headers
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP with proxy support"""
        # Check for forwarded headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        if request.client and request.client.host:
            return request.client.host
        
        return "unknown"
    
    def _get_limit_key(
        self, 
        request: Request, 
        rule: RateLimitRule, 
        user_id: Optional[str],
        client_ip: str
    ) -> str:
        """Generate rate limit key based on rule type"""
        if rule.per == "global":
            return "global"
        elif rule.per == "ip":
            return f"ip:{client_ip}"
        elif rule.per == "user" and user_id:
            return f"user:{user_id}"
        elif rule.per == "endpoint":
            endpoint = request.url.path
            return f"endpoint:{endpoint}:{client_ip}"
        else:
            # Fallback to IP-based limiting
            return f"ip:{client_ip}"
    
    def _adjust_rule_for_load(self, rule: RateLimitRule) -> RateLimitRule:
        """Adjust rate limit rule based on system load"""
        if self.system_load_factor <= 1.0:
            return rule
        
        # Reduce limits when system is under high load
        adjusted_requests = int(rule.requests / self.system_load_factor)
        adjusted_burst = int(rule.burst_limit / self.system_load_factor)
        
        return RateLimitRule(
            requests=max(1, adjusted_requests),
            window=rule.window,
            per=rule.per,
            burst_multiplier=adjusted_burst / adjusted_requests if adjusted_requests > 0 else rule.burst_limit / rule.requests,
            grace_period=rule.grace_period
        )
    
    async def _check_rate_limit(
        self, 
        key: str, 
        rule: RateLimitRule, 
        current_time: float
    ) -> Tuple[bool, Optional[int]]:
        """Check if rate limit is exceeded"""
        
        if self.redis_client:
            return await self._check_rate_limit_redis(key, rule, current_time)
        else:
            return await self._check_rate_limit_memory(key, rule, current_time)
    
    async def _check_rate_limit_redis(
        self, 
        key: str, 
        rule: RateLimitRule, 
        current_time: float
    ) -> Tuple[bool, Optional[int]]:
        """Redis-based rate limiting with sliding window"""
        
        pipe = self.redis_client.pipeline()
        
        # Remove old entries outside the window
        window_start = current_time - rule.window
        pipe.zremrangebyscore(key, 0, window_start)
        
        # Count current requests
        pipe.zcard(key)
        
        # Add current request
        pipe.zadd(key, {str(current_time): current_time})
        
        # Set expiration
        pipe.expire(key, rule.window)
        
        results = await pipe.execute()
        current_count = results[1]
        
        # Check if limit exceeded
        if current_count >= rule.requests:
            # Check burst limit
            if current_count >= rule.burst_limit:
                # Calculate retry after
                oldest_request = await self.redis_client.zrange(key, 0, 0, withscores=True)
                if oldest_request:
                    retry_after = int(oldest_request[0][1] + rule.window - current_time) + 1
                    return True, retry_after
                return True, rule.window
            else:
                # Allow burst but mark as suspicious
                return False, None
        
        return False, None
    
    async def _check_rate_limit_memory(
        self, 
        key: str, 
        rule: RateLimitRule, 
        current_time: float
    ) -> Tuple[bool, Optional[int]]:
        """Memory-based rate limiting"""
        
        if key not in self.local_cache:
            self.local_cache[key] = deque()
        
        request_times = self.local_cache[key]
        
        # Remove old requests outside the window
        window_start = current_time - rule.window
        while request_times and request_times[0] < window_start:
            request_times.popleft()
        
        # Check if limit exceeded
        if len(request_times) >= rule.requests:
            if len(request_times) >= rule.burst_limit:
                # Calculate retry after
                retry_after = int(request_times[0] + rule.window - current_time) + 1
                return True, retry_after
            else:
                # Allow burst
                request_times.append(current_time)
                return False, None
        
        # Add current request
        request_times.append(current_time)
        return False, None
    
    async def _get_current_usage(
        self, 
        key: str, 
        rule: RateLimitRule, 
        current_time: float
    ) -> int:
        """Get current usage count for the key"""
        
        if self.redis_client:
            window_start = current_time - rule.window
            count = await self.redis_client.zcount(key, window_start, current_time)
            return count
        else:
            if key in self.local_cache:
                return len(self.local_cache[key])
            return 0
    
    async def _handle_rate_limit_violation(
        self, 
        client_ip: str, 
        user_id: Optional[str], 
        rule_name: str, 
        rule: RateLimitRule
    ):
        """Handle rate limit violations with escalating responses"""
        
        # Log the violation
        logger.warning(
            "Rate limit exceeded",
            ip=client_ip,
            user_id=user_id,
            rule=rule_name,
            limit=rule.requests,
            window=rule.window
        )
        
        # Track violations for this IP
        violation_key = f"violations:{client_ip}"
        
        if self.redis_client:
            # Increment violation count
            violations = await self.redis_client.incr(violation_key)
            await self.redis_client.expire(violation_key, 3600)  # Reset hourly
        else:
            # Use memory tracking
            violations = len(self.local_cache.get(violation_key, [])) + 1
        
        # Escalating responses based on violation count
        if violations >= 50:  # Severe violations
            self.add_to_blacklist(client_ip, duration=3600)  # 1 hour ban
        elif violations >= 20:  # Moderate violations
            self.add_to_blacklist(client_ip, duration=300)   # 5 minute ban
        elif violations >= 10:  # Light violations
            self.mark_suspicious(client_ip)
        
        # Adaptive rule adjustment
        if violations >= 5:
            # Temporarily reduce limits for this IP
            adaptive_key = f"adaptive:{client_ip}"
            if adaptive_key not in self.adaptive_rules:
                self.adaptive_rules[adaptive_key] = RateLimitRule(
                    requests=max(1, rule.requests // 2),
                    window=rule.window,
                    per="ip"
                )
    
    def update_system_load(self, load_factor: float):
        """Update system load factor to adjust rate limits dynamically"""
        self.system_load_factor = max(0.1, min(10.0, load_factor))
        logger.info("System load factor updated", load_factor=self.system_load_factor)
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        stats = {
            "suspicious_ips": len(self.suspicious_ips),
            "blacklisted_ips": len(self.blacklist_ips),
            "whitelisted_ips": len(self.whitelist_ips),
            "active_limits": len(self.local_cache),
            "system_load_factor": self.system_load_factor,
            "default_rules": {name: str(rule) for name, rule in self.default_rules.items()},
            "adaptive_rules": len(self.adaptive_rules)
        }
        
        if self.redis_client:
            # Get Redis statistics
            try:
                redis_info = await self.redis_client.info()
                stats["redis_memory_usage"] = redis_info.get("used_memory_human", "unknown")
                stats["redis_connected_clients"] = redis_info.get("connected_clients", 0)
            except Exception as e:
                logger.warning("Failed to get Redis statistics", error=str(e))
        
        return stats
    
    async def cleanup(self):
        """Cleanup expired entries and save persistent data"""
        current_time = time.time()
        
        # Cleanup local cache
        expired_keys = []
        for key, request_times in self.local_cache.items():
            # Remove requests older than 1 hour (conservative cleanup)
            cutoff = current_time - 3600
            while request_times and request_times[0] < cutoff:
                request_times.popleft()
            
            # Remove empty deques
            if not request_times:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.local_cache[key]
        
        # Save persistent data
        await self._save_persistent_data()
        
        logger.debug("Rate limiter cleanup completed", cleaned_keys=len(expired_keys))

# Rate limiting middleware factory
def create_rate_limit_middleware(rate_limiter: AdvancedRateLimiter):
    """Create rate limiting middleware"""
    
    async def rate_limit_middleware(request: Request, call_next):
        """Rate limiting middleware"""
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/healthz", "/readyz"]:
            return await call_next(request)
        
        # Determine rule based on endpoint
        path = request.url.path
        rule_name = "api_default"
        
        if path.startswith("/auth/login"):
            rule_name = "auth_login"
        elif path.startswith("/auth/register"):
            rule_name = "auth_register"
        elif path.startswith("/auth/forgot"):
            rule_name = "auth_forgot_password"
        elif path.startswith("/api/upload"):
            rule_name = "api_upload"
        elif path.startswith("/api/fl/train") or path.startswith("/api/datasets/analyze"):
            rule_name = "api_heavy"
        
        # Extract user ID from token if available
        user_id = None
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # This would require importing auth functions
                # user_id = extract_user_id_from_token(auth_header.split(" ")[1])
                pass
        except Exception:
            pass
        
        # Check rate limit
        try:
            is_limited, retry_after, headers = await rate_limiter.is_rate_limited(
                request, rule_name, user_id
            )
            
            if is_limited:
                raise RateLimitExceeded(
                    f"Rate limit exceeded for {rule_name}",
                    retry_after=retry_after
                )
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            for header, value in headers.items():
                response.headers[header] = value
            
            return response
            
        except RateLimitExceeded:
            raise
        except Exception as e:
            logger.error("Rate limiting error", error=str(e))
            # Allow request to proceed on rate limiter error
            return await call_next(request)
    
    return rate_limit_middleware

# Export rate limiter instance
rate_limiter = AdvancedRateLimiter()

__all__ = [
    'AdvancedRateLimiter',
    'RateLimitRule', 
    'RateLimitExceeded',
    'create_rate_limit_middleware',
    'rate_limiter'
]

"""
Enterprise Rate Limiter for AgisFL
"""
import time
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from fastapi import HTTPException, Request

class EnterpriseRateLimiter:
    """Enterprise rate limiter with sliding window"""
    
    def __init__(self):
        self.requests = defaultdict(deque)  # IP -> deque of timestamps
        self.blocked_ips = {}  # IP -> block_until_timestamp
        self.stats = {"requests_processed": 0, "requests_blocked": 0}
    
    async def initialize(self):
        """Initialize rate limiter"""
        print("✅ Rate limiter initialized")
    
    async def cleanup(self):
        """Cleanup rate limiter"""
        print("🚦 Rate limiter cleanup")
    
    def is_allowed(self, client_ip: str, limit: int = 100, window: int = 60) -> bool:
        """Check if request is allowed under rate limit"""
        
        current_time = time.time()
        
        # Check if IP is blocked
        if client_ip in self.blocked_ips:
            if current_time < self.blocked_ips[client_ip]:
                self.stats["requests_blocked"] += 1
                return False
            else:
                del self.blocked_ips[client_ip]
        
        # Clean old requests outside window
        request_times = self.requests[client_ip]
        while request_times and request_times[0] < current_time - window:
            request_times.popleft()
        
        # Check rate limit
        if len(request_times) >= limit:
            # Block IP for 5 minutes
            self.blocked_ips[client_ip] = current_time + 300
            self.stats["requests_blocked"] += 1
            return False
        
        # Allow request
        request_times.append(current_time)
        self.stats["requests_processed"] += 1
        return True
    
    def check_auth_limit(self, client_ip: str) -> bool:
        """Check authentication rate limit (stricter)"""
        return self.is_allowed(client_ip, limit=10, window=60)
    
    def check_api_limit(self, client_ip: str) -> bool:
        """Check API rate limit"""
        return self.is_allowed(client_ip, limit=100, window=60)
    
    def check_upload_limit(self, client_ip: str) -> bool:
        """Check file upload rate limit"""
        return self.is_allowed(client_ip, limit=5, window=300)  # 5 uploads per 5 minutes
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get rate limiter statistics"""
        current_time = time.time()
        
        # Count active blocks
        active_blocks = sum(1 for block_time in self.blocked_ips.values() if block_time > current_time)
        
        # Count recent requests (last minute)
        recent_requests = 0
        for request_times in self.requests.values():
            recent_requests += sum(1 for t in request_times if t > current_time - 60)
        
        return {
            "requests_processed": self.stats["requests_processed"],
            "requests_blocked": self.stats["requests_blocked"],
            "active_blocks": active_blocks,
            "recent_requests_per_minute": recent_requests,
            "unique_ips": len(self.requests),
            "block_rate_percent": round(
                (self.stats["requests_blocked"] / max(self.stats["requests_processed"], 1)) * 100, 2
            )
        }
    
    def get_client_status(self, client_ip: str) -> Dict[str, Any]:
        """Get status for specific client IP"""
        current_time = time.time()
        
        # Check if blocked
        is_blocked = client_ip in self.blocked_ips and self.blocked_ips[client_ip] > current_time
        block_remaining = max(0, self.blocked_ips.get(client_ip, 0) - current_time)
        
        # Count recent requests
        request_times = self.requests.get(client_ip, deque())
        recent_requests = sum(1 for t in request_times if t > current_time - 60)
        
        return {
            "ip": client_ip,
            "is_blocked": is_blocked,
            "block_remaining_seconds": int(block_remaining),
            "recent_requests": recent_requests,
            "requests_remaining": max(0, 100 - recent_requests)
        }

# Global rate limiter
rate_limiter = EnterpriseRateLimiter()

async def check_rate_limit(request: Request, limit_type: str = "api"):
    """Rate limit middleware"""
    client_ip = request.client.host if request.client else "unknown"
    
    if limit_type == "auth":
        allowed = rate_limiter.check_auth_limit(client_ip)
    elif limit_type == "upload":
        allowed = rate_limiter.check_upload_limit(client_ip)
    else:
        allowed = rate_limiter.check_api_limit(client_ip)
    
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": "300"}
        )
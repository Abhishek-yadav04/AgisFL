"""
Performance Middleware for Sub-50ms Response Times
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from .ultra_cache import ultra_cache, get_instant_response

logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware to optimize API response times"""
    
    def __init__(self, app, target_response_time: float = 0.05):
        super().__init__(app)
        self.target_response_time = target_response_time  # 50ms target
        self.slow_requests = []
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Check for instant responses first
        path = request.url.path
        instant_response = self._get_instant_response(path)
        if instant_response:
            response = Response(
                content=instant_response,
                media_type="application/json"
            )
            return response
        
        # Process request normally
        response = await call_next(request)
        
        # Track performance
        process_time = time.time() - start_time
        
        # Log slow requests
        if process_time > self.target_response_time:
            self.slow_requests.append({
                "path": path,
                "method": request.method,
                "duration": process_time,
                "timestamp": time.time()
            })
            
            # Keep only last 100 slow requests
            if len(self.slow_requests) > 100:
                self.slow_requests = self.slow_requests[-100:]
            
            logger.warning(f"Slow request: {request.method} {path} took {process_time*1000:.1f}ms")
        
        # Add performance headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Cache-Status"] = "miss"  # Will be overridden by cache hits
        
        return response
    
    def _get_instant_response(self, path: str) -> str:
        """Get instant response for common endpoints"""
        import json
        
        # Map paths to instant responses
        instant_map = {
            "/health": "health_basic",
            "/api/health": "health_basic",
            "/api/fl/status": "fl_status_basic"
        }
        
        if path in instant_map:
            response_data = get_instant_response(instant_map[path])
            if response_data:
                return json.dumps(response_data)
        
        return None
    
    def get_performance_stats(self):
        """Get performance statistics"""
        if not self.slow_requests:
            return {"slow_requests": 0, "average_slow_time": 0}
        
        avg_slow_time = sum(req["duration"] for req in self.slow_requests) / len(self.slow_requests)
        
        return {
            "slow_requests": len(self.slow_requests),
            "average_slow_time": avg_slow_time,
            "target_response_time": self.target_response_time,
            "recent_slow_requests": self.slow_requests[-10:]  # Last 10
        }

# Export for use in main app
__all__ = ['PerformanceMiddleware']

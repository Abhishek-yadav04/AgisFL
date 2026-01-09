#!/usr/bin/env python3
"""
Performance Integration Middleware
=================================

Middleware to integrate advanced performance optimizations into FastAPI application.
Addresses all identified performance bottlenecks with comprehensive solutions.
"""

import time
import asyncio
import json
from typing import Dict, Any, Optional, Callable
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog

# Try different FastAPI middleware imports
try:
    from fastapi.middleware.base import BaseHTTPMiddleware
except ImportError:
    try:
        from starlette.middleware.base import BaseHTTPMiddleware
    except ImportError:
        # Fallback implementation
        class BaseHTTPMiddleware:
            def __init__(self, app):
                self.app = app
            
            async def __call__(self, scope, receive, send):
                if scope["type"] != "http":
                    await self.app(scope, receive, send)
                    return
                
                request = Request(scope, receive)
                response = await self.dispatch(request, lambda r: self.app(scope, receive, send))
                await response(scope, receive, send)
            
            async def dispatch(self, request, call_next):
                return await call_next(request)

# Try to import performance optimizations with fallbacks
try:
    from backend.core.advanced_performance_working import (
        AdvancedPerformanceManager,
        performance_manager
    )
    PERFORMANCE_AVAILABLE = True
except ImportError:
    try:
        from backend.core.advanced_performance_v2 import (
            AdvancedPerformanceManager,
            performance_manager
        )
        PERFORMANCE_AVAILABLE = True
    except ImportError:
        try:
            from core.advanced_performance_working import (
                AdvancedPerformanceManager,
                performance_manager
            )
            PERFORMANCE_AVAILABLE = True
        except ImportError:
            # Create fallback performance manager
            class FallbackPerformanceManager:
                def __init__(self):
                    self.memory_optimizer = self
                    self.json_optimizer = self
                    self.background_manager = self
                
                async def initialize(self):
                    pass
                
                async def cleanup(self):
                    pass
                
                async def get_comprehensive_stats(self):
                    return {"status": "fallback_mode", "optimizations": []}
                
                def get_memory_stats(self):
                    return {"memory_percent": 0, "fallback": True}
                
                def force_gc_collection(self):
                    import gc
                    return gc.collect()
                
                def serialize(self, data):
                    import json
                    return json.dumps(data)
                
                def get_stats(self):
                    return {"cache_size": 0, "fallback": True}
                
                async def submit_task(self, task):
                    return f"fallback_task_{time.time()}"
            
            performance_manager = FallbackPerformanceManager()
            PERFORMANCE_AVAILABLE = False

logger = structlog.get_logger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for performance optimization"""
    
    def __init__(self, app: FastAPI, enable_monitoring: bool = True):
        super().__init__(app)
        self.enable_monitoring = enable_monitoring
        self.request_stats = {}
        self.performance_thresholds = {
            'slow_request_time': 2.0,
            'memory_warning_percent': 85,
            'high_cpu_percent': 80
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with performance optimizations"""
        start_time = time.time()
        request_id = f"req-{int(start_time * 1000)}"
        
        # Log request start
        logger.info("Request started", 
                   request_id=request_id,
                   method=request.method,
                   path=request.url.path)
        
        try:
            # Apply request-level optimizations
            await self._optimize_request(request)
            
            # Process request
            response = await call_next(request)
            
            # Process response optimizations
            response = await self._optimize_response(response, request)
            
            # Calculate and log performance metrics
            execution_time = time.time() - start_time
            await self._log_performance_metrics(request, response, execution_time, request_id)
            
            return response
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error("Request failed",
                        request_id=request_id,
                        error=str(e),
                        execution_time=execution_time)
            
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error", "request_id": request_id}
            )
    
    async def _optimize_request(self, request: Request):
        """Apply request-level optimizations"""
        # Optimize JSON parsing for large payloads
        if request.headers.get("content-type", "").startswith("application/json"):
            if hasattr(request, "_body"):
                body_size = len(request._body) if request._body else 0
                if body_size > 10000:  # Large JSON payload
                    logger.info("Large JSON payload detected", size=body_size)
        
        # Memory optimization check
        memory_stats = performance_manager.memory_optimizer.get_memory_stats()
        if memory_stats.get('memory_percent', 0) > self.performance_thresholds['memory_warning_percent']:
            # Trigger garbage collection
            performance_manager.memory_optimizer.force_gc_collection()
            logger.warning("High memory usage detected, triggered GC",
                          memory_percent=memory_stats.get('memory_percent'))
    
    async def _optimize_response(self, response: Response, request: Request) -> Response:
        """Apply response-level optimizations"""
        # Optimize JSON responses
        if hasattr(response, 'body') and response.media_type == "application/json":
            try:
                # Use high-performance JSON serialization
                if hasattr(response, 'body') and response.body:
                    original_body = json.loads(response.body)
                    optimized_body = performance_manager.json_optimizer.serialize(original_body)
                    
                    # Create optimized response
                    new_response = Response(
                        content=optimized_body,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type="application/json"
                    )
                    return new_response
            except Exception as e:
                logger.warning("Failed to optimize JSON response", error=str(e))
        
        return response
    
    async def _log_performance_metrics(self, request: Request, response: Response, 
                                     execution_time: float, request_id: str):
        """Log detailed performance metrics"""
        
        # Basic metrics
        metrics = {
            'request_id': request_id,
            'method': request.method,
            'path': request.url.path,
            'status_code': response.status_code,
            'execution_time': execution_time,
            'timestamp': time.time()
        }
        
        # Check for slow requests
        if execution_time > self.performance_thresholds['slow_request_time']:
            logger.warning("Slow request detected", **metrics)
        else:
            logger.info("Request completed", **metrics)
        
        # Store stats for analysis
        endpoint_key = f"{request.method} {request.url.path}"
        if endpoint_key not in self.request_stats:
            self.request_stats[endpoint_key] = {
                'count': 0,
                'total_time': 0.0,
                'avg_time': 0.0,
                'min_time': float('inf'),
                'max_time': 0.0
            }
        
        stats = self.request_stats[endpoint_key]
        stats['count'] += 1
        stats['total_time'] += execution_time
        stats['avg_time'] = stats['total_time'] / stats['count']
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['max_time'] = max(stats['max_time'], execution_time)
    
    def get_endpoint_stats(self) -> Dict[str, Any]:
        """Get endpoint performance statistics"""
        return dict(self.request_stats)

class PerformanceOptimizedApp:
    """Factory for creating performance-optimized FastAPI application"""
    
    def __init__(self):
        self.performance_middleware = None
        
    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        """Application lifespan with performance optimization setup"""
        logger.info("Initializing performance-optimized application...")
        
        try:
            # Initialize performance manager
            await performance_manager.initialize()
            
            logger.info("Performance optimizations initialized successfully")
            
            yield
            
        except Exception as e:
            logger.error(f"Failed to initialize performance optimizations: {e}")
            raise
        finally:
            # Cleanup performance resources
            logger.info("Cleaning up performance resources...")
            await performance_manager.cleanup()
    
    def create_app(self) -> FastAPI:
        """Create FastAPI application with performance optimizations"""
        
        # Create FastAPI app with performance lifespan
        app = FastAPI(
            title="AgisFL - Performance Optimized",
            description="Advanced Federated Learning Platform with Comprehensive Performance Optimizations",
            version="1.0.0",
            lifespan=self.lifespan
        )
        
        # Add performance middleware
        self.performance_middleware = PerformanceMiddleware(app)
        app.add_middleware(PerformanceMiddleware)
        
        return app
    
    def add_performance_endpoints(self, app: FastAPI):
        """Add performance monitoring endpoints"""
        
        @app.get("/api/performance/stats")
        async def get_performance_stats():
            """Get comprehensive performance statistics"""
            try:
                stats = await performance_manager.get_comprehensive_stats()
                
                # Add middleware stats
                if self.performance_middleware:
                    stats['endpoint_performance'] = self.performance_middleware.get_endpoint_stats()
                
                return {"status": "success", "data": stats}
                
            except Exception as e:
                logger.error(f"Failed to get performance stats: {e}")
                raise HTTPException(status_code=500, detail="Failed to retrieve performance statistics")
        
        @app.get("/api/performance/memory")
        async def get_memory_stats():
            """Get detailed memory statistics"""
            try:
                memory_stats = performance_manager.memory_optimizer.get_memory_stats()
                return {"status": "success", "data": memory_stats}
                
            except Exception as e:
                logger.error(f"Failed to get memory stats: {e}")
                raise HTTPException(status_code=500, detail="Failed to retrieve memory statistics")
        
        @app.post("/api/performance/optimize")
        async def trigger_optimization():
            """Manually trigger performance optimizations"""
            try:
                # Force garbage collection
                gc_stats = performance_manager.memory_optimizer.force_gc_collection()
                
                # Clear caches if needed
                json_stats = performance_manager.json_optimizer.get_stats()
                if json_stats.get('cache_size', 0) > 1000:
                    performance_manager.json_optimizer.serialization_cache.clear()
                    
                return {
                    "status": "success", 
                    "message": "Performance optimization triggered",
                    "gc_stats": gc_stats
                }
                
            except Exception as e:
                logger.error(f"Failed to trigger optimization: {e}")
                raise HTTPException(status_code=500, detail="Failed to trigger performance optimization")
        
        @app.get("/api/performance/background-tasks")
        async def get_background_task_stats():
            """Get background task statistics"""
            try:
                bg_stats = performance_manager.background_manager.get_stats()
                return {"status": "success", "data": bg_stats}
                
            except Exception as e:
                logger.error(f"Failed to get background task stats: {e}")
                raise HTTPException(status_code=500, detail="Failed to retrieve background task statistics")
        
        @app.post("/api/performance/background-task")
        async def submit_background_task(task_data: Dict[str, Any]):
            """Submit a background task for processing"""
            try:
                # This is a demonstration endpoint - in practice, you'd have specific task types
                task_name = task_data.get('task_name', 'generic_task')
                
                # Submit a demo background task
                async def demo_task():
                    await asyncio.sleep(5)  # Simulate work
                    return {"task_name": task_name, "completed": True}
                
                task_id = await performance_manager.background_manager.submit_task(demo_task)
                
                return {
                    "status": "success",
                    "task_id": task_id,
                    "message": f"Background task {task_name} submitted"
                }
                
            except Exception as e:
                logger.error(f"Failed to submit background task: {e}")
                raise HTTPException(status_code=500, detail="Failed to submit background task")

# Performance monitoring decorators for route handlers
def monitor_performance(func):
    """Decorator to monitor endpoint performance"""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            logger.info("Endpoint performance",
                       endpoint=func.__name__,
                       execution_time=execution_time)
            
            return result
            
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error("Endpoint error",
                        endpoint=func.__name__,
                        execution_time=execution_time,
                        error=str(e))
            raise
    
    return wrapper

def optimize_json_response(func):
    """Decorator to optimize JSON responses"""
    async def wrapper(*args, **kwargs):
        result = await func(*args, **kwargs)
        
        # Use optimized JSON serialization
        if isinstance(result, dict):
            optimized_json = performance_manager.json_optimizer.serialize(result)
            return Response(
                content=optimized_json,
                media_type="application/json"
            )
        
        return result
    
    return wrapper

def cache_result(cache_key_func: Callable = None, ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        cache = {}
        
        async def wrapper(*args, **kwargs):
            # Generate cache key
            if cache_key_func:
                cache_key = cache_key_func(*args, **kwargs)
            else:
                cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Check cache
            if cache_key in cache:
                cached_result, timestamp = cache[cache_key]
                if time.time() - timestamp < ttl:
                    return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            cache[cache_key] = (result, time.time())
            
            return result
        
        return wrapper
    return decorator

# Global performance app factory
performance_app_factory = PerformanceOptimizedApp()

# Export key components
__all__ = [
    'PerformanceMiddleware',
    'PerformanceOptimizedApp', 
    'performance_app_factory',
    'monitor_performance',
    'optimize_json_response',
    'cache_result'
]
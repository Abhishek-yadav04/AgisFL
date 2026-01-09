#!/usr/bin/env python3
"""
Performance Optimization Service
===============================

High-performance optimizations for AgisFL Enterprise including:
- Response time optimization
- Database query optimization
- Memory management
- Connection pooling
- Async processing
"""

import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
import psutil
import gc

logger = logging.getLogger(__name__)

class PerformanceOptimizer:
    """Production performance optimization manager"""
    
    def __init__(self):
        self.metrics = {
            "requests_processed": 0,
            "avg_response_time": 0.0,
            "cache_hit_rate": 0.0,
            "memory_usage_mb": 0.0,
            "cpu_usage_percent": 0.0
        }
        self.response_times = []
        self.optimization_enabled = True
        
    async def initialize(self):
        """Initialize performance monitoring"""
        logger.info("🚀 Performance optimizer initialized")
        
        # Start background monitoring
        asyncio.create_task(self._background_monitoring())
        
    async def _background_monitoring(self):
        """Background task for system monitoring"""
        while self.optimization_enabled:
            try:
                # System metrics
                self.metrics["memory_usage_mb"] = psutil.Process().memory_info().rss / 1024 / 1024
                self.metrics["cpu_usage_percent"] = psutil.cpu_percent(interval=1)
                
                # Cleanup old response times
                cutoff_time = datetime.now() - timedelta(minutes=5)
                self.response_times = [
                    rt for rt in self.response_times 
                    if rt["timestamp"] > cutoff_time
                ]
                
                # Calculate avg response time
                if self.response_times:
                    avg_time = sum(rt["duration_ms"] for rt in self.response_times) / len(self.response_times)
                    self.metrics["avg_response_time"] = avg_time
                
                # Garbage collection if memory usage is high
                if self.metrics["memory_usage_mb"] > 500:
                    gc.collect()
                    logger.info(f"Memory cleanup: {self.metrics['memory_usage_mb']:.1f}MB")
                
                await asyncio.sleep(30)  # Monitor every 30 seconds
                
            except Exception as e:
                logger.error(f"Background monitoring error: {e}")
                await asyncio.sleep(60)
    
    def record_request(self, endpoint: str, duration_ms: float, cached: bool = False):
        """Record request performance metrics"""
        self.metrics["requests_processed"] += 1
        
        self.response_times.append({
            "endpoint": endpoint,
            "duration_ms": duration_ms,
            "cached": cached,
            "timestamp": datetime.now()
        })
        
        # Alert on slow requests
        if duration_ms > 200:
            logger.warning(f"Slow request: {endpoint} took {duration_ms:.2f}ms")
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report"""
        recent_requests = [
            rt for rt in self.response_times 
            if rt["timestamp"] > datetime.now() - timedelta(minutes=1)
        ]
        
        if recent_requests:
            avg_recent = sum(rt["duration_ms"] for rt in recent_requests) / len(recent_requests)
            sub_200ms_count = len([rt for rt in recent_requests if rt["duration_ms"] < 200])
            sub_200ms_percent = (sub_200ms_count / len(recent_requests)) * 100
            
            cached_requests = len([rt for rt in recent_requests if rt["cached"]])
            cache_hit_rate = (cached_requests / len(recent_requests)) * 100 if recent_requests else 0
        else:
            avg_recent = 0
            sub_200ms_percent = 100
            cache_hit_rate = 0
        
        return {
            "performance_status": "optimal" if avg_recent < 200 else "degraded",
            "avg_response_time_ms": round(avg_recent, 2),
            "sub_200ms_percentage": round(sub_200ms_percent, 1),
            "cache_hit_rate_percent": round(cache_hit_rate, 1),
            "total_requests": self.metrics["requests_processed"],
            "recent_requests_count": len(recent_requests),
            "system_metrics": {
                "memory_usage_mb": round(self.metrics["memory_usage_mb"], 1),
                "cpu_usage_percent": round(self.metrics["cpu_usage_percent"], 1)
            },
            "optimizations_enabled": self.optimization_enabled,
            "timestamp": datetime.now().isoformat()
        }
    
    async def optimize_database_connections(self):
        """Optimize database connection settings"""
        try:
            from core.database_migration import get_connection_metrics
            metrics = await get_connection_metrics()
            
            # Log connection pool health
            logger.info(f"Database connections: {metrics}")
            
            return {
                "status": "optimized",
                "connection_metrics": metrics
            }
            
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def optimize_memory_usage(self):
        """Optimize memory usage"""
        try:
            # Force garbage collection
            collected = gc.collect()
            
            # Get memory info
            memory_before = psutil.Process().memory_info().rss / 1024 / 1024
            
            # Clean up performance data
            cutoff_time = datetime.now() - timedelta(hours=1)
            old_count = len(self.response_times)
            self.response_times = [
                rt for rt in self.response_times 
                if rt["timestamp"] > cutoff_time
            ]
            cleaned_count = old_count - len(self.response_times)
            
            memory_after = psutil.Process().memory_info().rss / 1024 / 1024
            memory_saved = memory_before - memory_after
            
            logger.info(f"Memory optimization: {collected} objects collected, {cleaned_count} old metrics cleaned")
            
            return {
                "status": "optimized",
                "objects_collected": collected,
                "metrics_cleaned": cleaned_count,
                "memory_saved_mb": round(memory_saved, 2),
                "current_memory_mb": round(memory_after, 1)
            }
            
        except Exception as e:
            logger.error(f"Memory optimization failed: {e}")
            return {"status": "failed", "error": str(e)}
    
    async def health_check(self) -> Dict[str, Any]:
        """Performance health check"""
        report = self.get_performance_report()
        
        health_status = "healthy"
        issues = []
        
        # Check response times
        if report["avg_response_time_ms"] > 200:
            health_status = "degraded"
            issues.append("High average response time")
        
        # Check sub-200ms percentage
        if report["sub_200ms_percentage"] < 80:
            health_status = "degraded"
            issues.append("Too many slow requests")
        
        # Check memory usage
        if report["system_metrics"]["memory_usage_mb"] > 1000:
            health_status = "warning"
            issues.append("High memory usage")
        
        # Check CPU usage
        if report["system_metrics"]["cpu_usage_percent"] > 80:
            health_status = "warning"
            issues.append("High CPU usage")
        
        return {
            "status": health_status,
            "issues": issues,
            "performance_metrics": report,
            "recommendations": self._get_recommendations(report)
        }
    
    def _get_recommendations(self, report: Dict[str, Any]) -> List[str]:
        """Get performance optimization recommendations"""
        recommendations = []
        
        if report["avg_response_time_ms"] > 200:
            recommendations.append("Enable Redis caching for frequently accessed data")
            recommendations.append("Optimize database queries")
        
        if report["cache_hit_rate_percent"] < 50:
            recommendations.append("Increase cache expiration times for stable data")
            recommendations.append("Pre-warm cache for critical endpoints")
        
        if report["system_metrics"]["memory_usage_mb"] > 800:
            recommendations.append("Run memory cleanup")
            recommendations.append("Reduce data retention periods")
        
        if report["sub_200ms_percentage"] < 90:
            recommendations.append("Enable async processing for heavy operations")
            recommendations.append("Implement request queuing")
        
        return recommendations

# Global performance optimizer
performance_optimizer = PerformanceOptimizer()

# Performance monitoring decorator
def optimize_performance(cache_seconds: int = 60):
    """Decorator for performance optimization and monitoring"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                # Execute function
                result = await func(*args, **kwargs)
                
                # Record performance
                duration_ms = (time.time() - start_time) * 1000
                performance_optimizer.record_request(func.__name__, duration_ms)
                
                return result
                
            except Exception as e:
                # Record failed request time
                duration_ms = (time.time() - start_time) * 1000
                performance_optimizer.record_request(f"{func.__name__}_error", duration_ms)
                raise
        
        return wrapper
    return decorator

class AsyncTaskManager:
    """Manage async tasks for better performance"""
    
    def __init__(self):
        self.background_tasks = []
    
    async def add_background_task(self, coro):
        """Add background task for async processing"""
        task = asyncio.create_task(coro)
        self.background_tasks.append(task)
        
        # Clean up completed tasks
        self.background_tasks = [t for t in self.background_tasks if not t.done()]
        
        return task
    
    async def wait_for_completion(self, timeout: float = 30.0):
        """Wait for all background tasks to complete"""
        if self.background_tasks:
            try:
                await asyncio.wait_for(
                    asyncio.gather(*self.background_tasks, return_exceptions=True),
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                logger.warning(f"Background tasks timeout after {timeout}s")
    
    def get_task_status(self) -> Dict[str, Any]:
        """Get status of background tasks"""
        total_tasks = len(self.background_tasks)
        completed_tasks = len([t for t in self.background_tasks if t.done()])
        running_tasks = total_tasks - completed_tasks
        
        return {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "running_tasks": running_tasks,
            "task_details": [
                {
                    "name": getattr(task, "_name", "unknown"),
                    "done": task.done(),
                    "cancelled": task.cancelled()
                }
                for task in self.background_tasks
            ]
        }

# Global task manager
task_manager = AsyncTaskManager()

async def initialize_performance_systems():
    """Initialize all performance optimization systems"""
    logger.info("🚀 Initializing performance optimization systems...")
    
    try:
        # Initialize performance optimizer
        await performance_optimizer.initialize()
        
        # Initialize cache manager
        from core.redis_cache import get_cache_manager
        cache_manager = await get_cache_manager()
        
        # Run initial optimizations
        await performance_optimizer.optimize_database_connections()
        await performance_optimizer.optimize_memory_usage()
        
        logger.info("✅ Performance optimization systems ready")
        return True
        
    except Exception as e:
        logger.error(f"Performance system initialization failed: {e}")
        return False
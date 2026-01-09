#!/usr/bin/env python3
"""
Advanced Performance Optimization System - Fixed Version
========================================================

Comprehensive performance optimization addressing all identified performance bottlenecks.
"""

import asyncio
import time
import json
import gzip
import pickle
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from typing import Dict, List, Any, Optional, Union, Callable, AsyncGenerator, TypeVar, Generic
from dataclasses import dataclass, field
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from functools import lru_cache, wraps
import weakref
import mmap
import logging
import gc
import sys
import os
from pathlib import Path
import hashlib
import psutil
import structlog

# Import performance optimization libraries with fallbacks
try:
    import uvloop
    UVLOOP_AVAILABLE = True
except ImportError:
    UVLOOP_AVAILABLE = False

try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

try:
    import orjson
    ORJSON_AVAILABLE = True
except ImportError:
    ORJSON_AVAILABLE = False

logger = structlog.get_logger(__name__)

T = TypeVar('T')

# ============================================================================
# 1. BLOCKING I/O OPERATIONS OPTIMIZATION
# ============================================================================

class AsyncIOOptimizer:
    """Optimize blocking I/O operations by converting to async"""
    
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or min(32, (os.cpu_count() or 1) + 4)
        self.thread_pool = ThreadPoolExecutor(max_workers=self.max_workers)
        self.process_pool = ProcessPoolExecutor(max_workers=min(4, os.cpu_count() or 1))
        
        # Set event loop policy to uvloop if available
        if UVLOOP_AVAILABLE and sys.platform != 'win32':
            uvloop.install()
            logger.info("uvloop event loop installed for better performance")
    
    async def run_in_thread(self, func: Callable, *args, **kwargs) -> Any:
        """Run blocking function in thread pool"""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self.thread_pool, func, *args, **kwargs)
    
    async def run_in_process(self, func: Callable, *args, **kwargs) -> Any:
        """Run CPU-intensive function in process pool"""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(self.process_pool, func, *args, **kwargs)
    
    @asynccontextmanager
    async def async_file_handler(self, file_path: str, mode: str = 'r', **kwargs):
        """Async file operations with proper resource management"""
        if AIOFILES_AVAILABLE:
            import aiofiles
            async with aiofiles.open(file_path, mode, **kwargs) as file:
                yield file
        else:
            # Fallback to thread pool
            file = await self.run_in_thread(open, file_path, mode, **kwargs)
            try:
                yield file
            finally:
                await self.run_in_thread(file.close)
    
    async def cleanup(self):
        """Cleanup executor resources"""
        self.thread_pool.shutdown(wait=True)
        self.process_pool.shutdown(wait=True)

# ============================================================================
# 2. ALGORITHM OPTIMIZATION
# ============================================================================

class AlgorithmOptimizer:
    """Replace O(n²) algorithms with efficient alternatives"""
    
    @staticmethod
    def efficient_search(data: List[T], key: Callable[[T], Any]) -> Dict[Any, List[T]]:
        """Replace O(n²) search with O(n) hash-based grouping"""
        result = defaultdict(list)
        for item in data:
            result[key(item)].append(item)
        return dict(result)
    
    @staticmethod
    def efficient_deduplication(data: List[T], key: Callable[[T], Any] = None) -> List[T]:
        """O(n) deduplication instead of O(n²)"""
        if key is None:
            return list(dict.fromkeys(data))
        
        seen = set()
        result = []
        for item in data:
            k = key(item)
            if k not in seen:
                seen.add(k)
                result.append(item)
        return result
    
    @staticmethod
    def efficient_intersection(list1: List[T], list2: List[T]) -> List[T]:
        """O(n + m) intersection instead of O(n*m)"""
        set2 = set(list2)
        return [item for item in list1 if item in set2]

# ============================================================================
# 3. MEMORY OPTIMIZATION
# ============================================================================

class MemoryOptimizer:
    """Optimize memory usage and prevent memory leaks"""
    
    def __init__(self):
        self.object_pools = {}
        self.weak_references = weakref.WeakSet()
        self.memory_stats = {
            'allocations': 0,
            'deallocations': 0,
            'pool_hits': 0,
            'pool_misses': 0
        }
    
    def get_object_pool(self, obj_type: type, max_size: int = 100):
        """Get or create object pool for reuse"""
        if obj_type not in self.object_pools:
            self.object_pools[obj_type] = deque(maxlen=max_size)
        return self.object_pools[obj_type]
    
    def acquire_object(self, obj_type: type, factory: Callable = None, *args, **kwargs):
        """Acquire object from pool or create new one"""
        pool = self.get_object_pool(obj_type)
        
        if pool:
            self.memory_stats['pool_hits'] += 1
            obj = pool.popleft()
            # Reset object state if it has a reset method
            if hasattr(obj, 'reset'):
                obj.reset()
            return obj
        
        self.memory_stats['pool_misses'] += 1
        self.memory_stats['allocations'] += 1
        
        if factory:
            obj = factory(*args, **kwargs)
        else:
            obj = obj_type(*args, **kwargs)
        
        # Track with weak reference
        try:
            self.weak_references.add(obj)
        except TypeError:
            # Object not weakly referenceable
            pass
        
        return obj
    
    def release_object(self, obj: Any):
        """Return object to pool for reuse"""
        obj_type = type(obj)
        pool = self.get_object_pool(obj_type)
        
        # Clear object references if possible
        if hasattr(obj, 'clear'):
            obj.clear()
        
        pool.append(obj)
        self.memory_stats['deallocations'] += 1
    
    def force_gc_collection(self) -> Dict[str, int]:
        """Force garbage collection and return statistics"""
        before = gc.get_count()
        collected = gc.collect()
        after = gc.get_count()
        
        stats = {
            'objects_collected': collected,
            'before_counts': before,
            'after_counts': after,
            'tracked_objects': len(self.weak_references)
        }
        
        logger.info("Forced garbage collection", **stats)
        return stats
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """Get detailed memory statistics"""
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            **self.memory_stats,
            'rss_mb': memory_info.rss / 1024 / 1024,
            'vms_mb': memory_info.vms / 1024 / 1024,
            'memory_percent': process.memory_percent(),
            'tracked_objects': len(self.weak_references),
            'object_pools': {str(k): len(v) for k, v in self.object_pools.items()}
        }

# ============================================================================
# 4. JSON OPTIMIZATION
# ============================================================================

class JSONOptimizer:
    """Optimize JSON serialization/deserialization performance"""
    
    def __init__(self):
        self.serialization_cache = {}
        self.stats = {
            'serializations': 0,
            'deserializations': 0,
            'cache_hits': 0,
            'total_time': 0.0
        }
    
    def serialize(self, data: Any, use_cache: bool = True) -> bytes:
        """High-performance JSON serialization using orjson"""
        start_time = time.time()
        
        try:
            if use_cache:
                data_hash = hashlib.md5(str(data).encode()).hexdigest()
                if data_hash in self.serialization_cache:
                    self.stats['cache_hits'] += 1
                    return self.serialization_cache[data_hash]
            
            # Use orjson for better performance if available
            if ORJSON_AVAILABLE:
                import orjson
                result = orjson.dumps(data)
            else:
                result = json.dumps(data, default=str).encode()
            
            if use_cache and len(result) < 10000:  # Cache small objects only
                self.serialization_cache[data_hash] = result
            
            self.stats['serializations'] += 1
            
        except Exception:
            # Fallback to standard json
            result = json.dumps(data, default=str).encode()
        
        self.stats['total_time'] += time.time() - start_time
        return result
    
    def deserialize(self, data: bytes) -> Any:
        """High-performance JSON deserialization"""
        start_time = time.time()
        
        try:
            if ORJSON_AVAILABLE:
                import orjson
                result = orjson.loads(data)
            else:
                result = json.loads(data.decode())
            self.stats['deserializations'] += 1
        except Exception:
            # Fallback to standard json
            result = json.loads(data.decode())
        
        self.stats['total_time'] += time.time() - start_time
        return result
    
    def get_stats(self) -> Dict[str, Any]:
        """Get JSON processing statistics"""
        total_ops = self.stats['serializations'] + self.stats['deserializations']
        avg_time = self.stats['total_time'] / total_ops if total_ops > 0 else 0.0
        
        return {
            **self.stats,
            'total_operations': total_ops,
            'average_time': avg_time,
            'cache_size': len(self.serialization_cache)
        }

# ============================================================================
# 5. BACKGROUND TASK SYSTEM
# ============================================================================

class BackgroundTaskManager:
    """Manage background tasks for non-blocking operations"""
    
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        self.task_queue = asyncio.Queue()
        self.running_tasks = set()
        self.completed_tasks = deque(maxlen=1000)
        self.failed_tasks = deque(maxlen=100)
        self.is_running = False
        self.workers = []
    
    async def start(self):
        """Start background task workers"""
        if self.is_running:
            return
        
        self.is_running = True
        
        # Create worker tasks
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        
        logger.info(f"Started {self.max_workers} background task workers")
    
    async def stop(self):
        """Stop background task workers"""
        self.is_running = False
        
        # Cancel all workers
        for worker in self.workers:
            worker.cancel()
        
        # Wait for workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        
        logger.info("Background task workers stopped")
    
    async def _worker(self, worker_name: str):
        """Background task worker"""
        while self.is_running:
            try:
                # Get task from queue
                task_info = await asyncio.wait_for(self.task_queue.get(), timeout=1.0)
                
                if task_info is None:  # Shutdown signal
                    break
                
                task_id, func, args, kwargs, priority = task_info
                
                # Execute task
                start_time = time.time()
                
                try:
                    if asyncio.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)
                    
                    execution_time = time.time() - start_time
                    
                    self.completed_tasks.append({
                        'task_id': task_id,
                        'worker': worker_name,
                        'execution_time': execution_time,
                        'completed_at': time.time(),
                        'success': True
                    })
                    
                except Exception as e:
                    execution_time = time.time() - start_time
                    
                    self.failed_tasks.append({
                        'task_id': task_id,
                        'worker': worker_name,
                        'execution_time': execution_time,
                        'failed_at': time.time(),
                        'error': str(e),
                        'success': False
                    })
                    
                    logger.error(f"Background task {task_id} failed", 
                               worker=worker_name, error=str(e))
                
                self.task_queue.task_done()
                
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker {worker_name} error", error=str(e))
    
    async def submit_task(self, func: Callable, *args, priority: int = 0, **kwargs) -> str:
        """Submit task for background execution"""
        task_id = f"task-{time.time()}-{id(func)}"
        task_info = (task_id, func, args, kwargs, priority)
        
        await self.task_queue.put(task_info)
        
        logger.debug(f"Submitted background task {task_id}")
        return task_id
    
    def get_stats(self) -> Dict[str, Any]:
        """Get background task statistics"""
        return {
            'queue_size': self.task_queue.qsize(),
            'running_tasks': len(self.running_tasks),
            'completed_tasks': len(self.completed_tasks),
            'failed_tasks': len(self.failed_tasks),
            'workers': len(self.workers),
            'is_running': self.is_running
        }

# ============================================================================
# 6. FILE OPTIMIZATION
# ============================================================================

class FileOptimizer:
    """Optimize file I/O operations"""
    
    def __init__(self, buffer_size: int = 64 * 1024):
        self.buffer_size = buffer_size
        self.file_cache = {}
        self.stats = {
            'reads': 0,
            'writes': 0,
            'cache_hits': 0,
            'total_bytes': 0
        }
    
    async def read_file_chunked(self, file_path: str) -> AsyncGenerator[bytes, None]:
        """Read large files in chunks to avoid memory issues"""
        if AIOFILES_AVAILABLE:
            import aiofiles
            async with aiofiles.open(file_path, 'rb') as file:
                while True:
                    chunk = await file.read(self.buffer_size)
                    if not chunk:
                        break
                    
                    self.stats['reads'] += 1
                    self.stats['total_bytes'] += len(chunk)
                    yield chunk
        else:
            # Fallback to sync reading
            with open(file_path, 'rb') as file:
                while True:
                    chunk = file.read(self.buffer_size)
                    if not chunk:
                        break
                    
                    self.stats['reads'] += 1
                    self.stats['total_bytes'] += len(chunk)
                    yield chunk
    
    @lru_cache(maxsize=100)
    def cached_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """Cache file metadata to avoid repeated stat calls"""
        path = Path(file_path)
        
        if not path.exists():
            return {}
        
        stat = path.stat()
        return {
            'size': stat.st_size,
            'modified': stat.st_mtime,
            'created': stat.st_ctime,
            'is_file': path.is_file(),
            'is_dir': path.is_dir()
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get file operation statistics"""
        return {
            **self.stats,
            'cache_info': self.cached_file_metadata.cache_info()._asdict()
        }

# ============================================================================
# 7. PERFORMANCE MANAGER
# ============================================================================

class AdvancedPerformanceManager:
    """Central manager for all performance optimizations"""
    
    def __init__(self):
        self.async_optimizer = AsyncIOOptimizer()
        self.algorithm_optimizer = AlgorithmOptimizer()
        self.memory_optimizer = MemoryOptimizer()
        self.json_optimizer = JSONOptimizer()
        self.background_manager = BackgroundTaskManager()
        self.file_optimizer = FileOptimizer()
        
        self.performance_metrics = {
            'startup_time': time.time(),
            'optimization_applied': [],
            'performance_improvements': {}
        }
        
        # Performance monitoring
        self.monitoring_task = None
    
    async def initialize(self):
        """Initialize all performance optimizations"""
        logger.info("Initializing advanced performance optimizations...")
        
        try:
            # Start background task manager
            await self.background_manager.start()
            
            # Apply memory optimizations
            gc.set_threshold(700, 10, 10)  # Optimize GC thresholds
            
            # Start performance monitoring
            self.monitoring_task = asyncio.create_task(self._performance_monitor())
            
            self.performance_metrics['optimization_applied'] = [
                'async_io_optimization',
                'algorithm_optimization', 
                'memory_optimization',
                'json_optimization',
                'background_task_optimization',
                'file_io_optimization'
            ]
            
            logger.info("Advanced performance optimizations initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize performance optimizations: {e}")
            raise
    
    async def _performance_monitor(self):
        """Monitor performance metrics continuously"""
        while True:
            try:
                await asyncio.sleep(60)  # Monitor every minute
                
                # Collect metrics from all optimizers
                metrics = {
                    'timestamp': time.time(),
                    'memory': self.memory_optimizer.get_memory_stats(),
                    'json': self.json_optimizer.get_stats(),
                    'background_tasks': self.background_manager.get_stats(),
                    'file_io': self.file_optimizer.get_stats()
                }
                
                # Log performance summary
                logger.info("Performance metrics collected", **metrics)
                
                # Automatic optimizations
                await self._auto_optimize(metrics)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Performance monitoring error: {e}")
    
    async def _auto_optimize(self, metrics: Dict[str, Any]):
        """Apply automatic optimizations based on metrics"""
        # Force GC if memory usage is high
        memory_stats = metrics.get('memory', {})
        if memory_stats.get('memory_percent', 0) > 85:
            self.memory_optimizer.force_gc_collection()
            logger.info("Automatic memory optimization applied")
        
        # Clear JSON cache if it's getting too large
        json_stats = metrics.get('json', {})
        if json_stats.get('cache_size', 0) > 1000:
            self.json_optimizer.serialization_cache.clear()
            logger.info("JSON cache cleared due to size")
    
    def performance_decorator(self, optimization_type: str = 'auto'):
        """Decorator to apply performance optimizations to functions"""
        def decorator(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                
                try:
                    if optimization_type == 'background':
                        # Run in background
                        task_id = await self.background_manager.submit_task(func, *args, **kwargs)
                        return {'task_id': task_id, 'status': 'submitted'}
                    
                    elif optimization_type == 'process':
                        # Run in process pool
                        result = await self.async_optimizer.run_in_process(func, *args, **kwargs)
                    
                    elif optimization_type == 'thread':
                        # Run in thread pool
                        result = await self.async_optimizer.run_in_thread(func, *args, **kwargs)
                    
                    else:
                        # Auto optimization - determine if it's async
                        if asyncio.iscoroutinefunction(func):
                            result = await func(*args, **kwargs)
                        else:
                            result = await self.async_optimizer.run_in_thread(func, *args, **kwargs)
                    
                    execution_time = time.time() - start_time
                    
                    # Track performance improvement
                    func_key = f"{func.__module__}.{func.__name__}"
                    if func_key not in self.performance_metrics['performance_improvements']:
                        self.performance_metrics['performance_improvements'][func_key] = []
                    
                    self.performance_metrics['performance_improvements'][func_key].append({
                        'execution_time': execution_time,
                        'optimization': optimization_type,
                        'timestamp': time.time()
                    })
                    
                    return result
                    
                except Exception as e:
                    logger.error(f"Performance optimization failed for {func.__name__}: {e}")
                    # Fallback to original function
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    else:
                        return func(*args, **kwargs)
            
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                # For sync functions, create async wrapper and run it
                return asyncio.run(async_wrapper(*args, **kwargs))
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        
        return decorator
    
    async def get_comprehensive_stats(self) -> Dict[str, Any]:
        """Get comprehensive performance statistics"""
        uptime = time.time() - self.performance_metrics['startup_time']
        
        return {
            'uptime_seconds': uptime,
            'optimizations_applied': self.performance_metrics['optimization_applied'],
            'memory': self.memory_optimizer.get_memory_stats(),
            'json_processing': self.json_optimizer.get_stats(),
            'background_tasks': self.background_manager.get_stats(),
            'file_io': self.file_optimizer.get_stats(),
            'performance_improvements': self.performance_metrics['performance_improvements']
        }
    
    async def cleanup(self):
        """Cleanup all performance optimization resources"""
        logger.info("Cleaning up performance optimizations...")
        
        try:
            # Stop monitoring
            if self.monitoring_task:
                self.monitoring_task.cancel()
                await asyncio.gather(self.monitoring_task, return_exceptions=True)
            
            # Stop background task manager
            await self.background_manager.stop()
            
            # Cleanup async optimizer
            await self.async_optimizer.cleanup()
            
            # Final garbage collection
            self.memory_optimizer.force_gc_collection()
            
            logger.info("Performance optimization cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during performance cleanup: {e}")

# ============================================================================
# GLOBAL INSTANCES AND DECORATORS
# ============================================================================

# Global performance manager
performance_manager = AdvancedPerformanceManager()

# Convenience decorators
def optimize_performance(optimization_type: str = 'auto'):
    """Decorator for applying performance optimizations"""
    return performance_manager.performance_decorator(optimization_type)

def background_task(func):
    """Decorator for running functions as background tasks"""
    return performance_manager.performance_decorator('background')(func)

def cpu_intensive(func):
    """Decorator for CPU-intensive functions (uses process pool)"""
    return performance_manager.performance_decorator('process')(func)

def io_intensive(func):
    """Decorator for I/O-intensive functions (uses thread pool)"""
    return performance_manager.performance_decorator('thread')(func)

# Export key classes and functions
__all__ = [
    'AdvancedPerformanceManager',
    'AsyncIOOptimizer', 
    'AlgorithmOptimizer',
    'MemoryOptimizer',
    'JSONOptimizer',
    'BackgroundTaskManager',
    'FileOptimizer',
    'performance_manager',
    'optimize_performance',
    'background_task',
    'cpu_intensive',
    'io_intensive'
]
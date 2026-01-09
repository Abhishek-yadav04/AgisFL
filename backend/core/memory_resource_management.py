#!/usr/bin/env python3
"""
Memory Management & Resource Cleanup System
===========================================

Comprehensive solution addressing:
- Memory Leaks - Unused variables and dead stores
- Resource Management - Proper cleanup of database connections
- Circular Imports - Import dependency issues
- Thread Safety Issues - Shared state synchronization
- Graceful Shutdown - Cleanup on application termination
"""

import os
import gc
import sys
import time
import asyncio
import threading
import weakref
import signal
from typing import Dict, List, Any, Optional, Set, Callable
from dataclasses import dataclass, field
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
import psutil
import structlog

logger = structlog.get_logger(__name__)

# ============================================================================
# MEMORY LEAK DETECTION & PREVENTION
# ============================================================================

@dataclass
class MemoryStats:
    """Memory usage statistics"""
    rss_mb: float
    vms_mb: float
    percent: float
    available_mb: float
    timestamp: float
    gc_stats: Dict[str, int]
    object_counts: Dict[str, int]

class MemoryLeakDetector:
    """Advanced memory leak detection and prevention"""
    
    def __init__(self):
        self.baseline_memory = None
        self.memory_history = []
        self.object_tracking = {}
        self.weak_references = weakref.WeakSet()
        self.monitoring_enabled = True
        self.gc_threshold_adjustments = 0
        self.leak_threshold_mb = 50  # Alert if memory grows by 50MB
        self.monitoring_interval = 30  # seconds
    
    def start_monitoring(self):
        """Start continuous memory monitoring"""
        if not self.monitoring_enabled:
            return
        
        self.baseline_memory = self._get_memory_stats()
        
        # Start background monitoring task
        if asyncio.get_event_loop().is_running():
            asyncio.create_task(self._monitoring_loop())
        else:
            threading.Thread(target=self._sync_monitoring_loop, daemon=True).start()
    
    def _get_memory_stats(self) -> MemoryStats:
        """Get current memory statistics"""
        try:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_percent = process.memory_percent()
            virtual_memory = psutil.virtual_memory()
            
            # Get garbage collection stats
            gc_stats = {
                f'generation_{i}': len(gc.get_objects(i))
                for i in range(3)
            }
            gc_stats['total_collections'] = sum(gc.get_stats()[i]['collections'] for i in range(3))
            
            # Get object type counts
            object_counts = {}
            for obj in gc.get_objects():
                obj_type = type(obj).__name__
                object_counts[obj_type] = object_counts.get(obj_type, 0) + 1
            
            # Keep only top 10 object types
            top_objects = dict(sorted(object_counts.items(), key=lambda x: x[1], reverse=True)[:10])
            
            return MemoryStats(
                rss_mb=memory_info.rss / 1024 / 1024,
                vms_mb=memory_info.vms / 1024 / 1024,
                percent=memory_percent,
                available_mb=virtual_memory.available / 1024 / 1024,
                timestamp=time.time(),
                gc_stats=gc_stats,
                object_counts=top_objects
            )
            
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return MemoryStats(0, 0, 0, 0, time.time(), {}, {})
    
    async def _monitoring_loop(self):
        """Async monitoring loop"""
        while self.monitoring_enabled:
            try:
                await asyncio.sleep(self.monitoring_interval)
                await self._check_memory_usage()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Memory monitoring error: {e}")
    
    def _sync_monitoring_loop(self):
        """Synchronous monitoring loop for non-async contexts"""
        while self.monitoring_enabled:
            try:
                time.sleep(self.monitoring_interval)
                asyncio.run(self._check_memory_usage())
            except Exception as e:
                logger.error(f"Memory monitoring error: {e}")
    
    async def _check_memory_usage(self):
        """Check current memory usage and detect leaks"""
        current_stats = self._get_memory_stats()
        self.memory_history.append(current_stats)
        
        # Keep only last 100 measurements
        if len(self.memory_history) > 100:
            self.memory_history.pop(0)
        
        # Detect memory leaks
        if self.baseline_memory and len(self.memory_history) > 5:
            memory_growth = current_stats.rss_mb - self.baseline_memory.rss_mb
            
            if memory_growth > self.leak_threshold_mb:
                await self._handle_potential_leak(current_stats, memory_growth)
        
        # Auto-adjust GC thresholds if needed
        if current_stats.rss_mb > 500:  # 500MB threshold
            self._adjust_gc_thresholds()
    
    async def _handle_potential_leak(self, current_stats: MemoryStats, growth_mb: float):
        """Handle potential memory leak detection"""
        logger.warning(
            f"Potential memory leak detected: {growth_mb:.1f}MB growth",
            current_memory=f"{current_stats.rss_mb:.1f}MB",
            baseline_memory=f"{self.baseline_memory.rss_mb:.1f}MB"
        )
        
        # Trigger aggressive garbage collection
        collected = self.force_garbage_collection()
        
        # Log top object types
        top_objects = list(current_stats.object_counts.items())[:5]
        logger.info(f"Top object types: {top_objects}")
        logger.info(f"Garbage collection freed {collected} objects")
        
        # Update baseline after cleanup
        new_stats = self._get_memory_stats()
        if new_stats.rss_mb < current_stats.rss_mb:
            self.baseline_memory = new_stats
    
    def _adjust_gc_thresholds(self):
        """Adjust garbage collection thresholds for better memory management"""
        if self.gc_threshold_adjustments < 3:  # Limit adjustments
            current_thresholds = gc.get_threshold()
            
            # More aggressive collection
            new_thresholds = (
                max(400, current_thresholds[0] - 100),
                max(5, current_thresholds[1] - 2),
                max(5, current_thresholds[2] - 2)
            )
            
            gc.set_threshold(*new_thresholds)
            self.gc_threshold_adjustments += 1
            
            logger.info(f"Adjusted GC thresholds: {current_thresholds} -> {new_thresholds}")
    
    def force_garbage_collection(self) -> int:
        """Force comprehensive garbage collection"""
        # Clear internal caches
        sys.intern.clear() if hasattr(sys, 'intern') and hasattr(sys.intern, 'clear') else None
        
        # Multiple GC passes
        collected = 0
        for _ in range(3):
            collected += gc.collect()
        
        # Collect generation-specific
        for generation in range(3):
            collected += gc.collect(generation)
        
        return collected
    
    def register_object(self, obj: Any, name: str = None):
        """Register object for tracking"""
        if name:
            self.object_tracking[name] = weakref.ref(obj)
        self.weak_references.add(obj)
    
    def get_tracked_objects_status(self) -> Dict[str, Any]:
        """Get status of tracked objects"""
        alive_objects = {}
        dead_objects = []
        
        for name, ref in list(self.object_tracking.items()):
            if ref() is not None:
                alive_objects[name] = type(ref()).__name__
            else:
                dead_objects.append(name)
                del self.object_tracking[name]
        
        return {
            'alive_objects': alive_objects,
            'dead_objects': dead_objects,
            'weak_references_count': len(self.weak_references),
            'tracking_count': len(self.object_tracking)
        }
    
    def get_memory_report(self) -> Dict[str, Any]:
        """Get comprehensive memory report"""
        current_stats = self._get_memory_stats()
        
        # Calculate trends
        trend = "stable"
        if len(self.memory_history) >= 3:
            recent_memories = [s.rss_mb for s in self.memory_history[-3:]]
            if recent_memories[-1] > recent_memories[0] * 1.1:
                trend = "increasing"
            elif recent_memories[-1] < recent_memories[0] * 0.9:
                trend = "decreasing"
        
        return {
            'current_memory': {
                'rss_mb': current_stats.rss_mb,
                'percent': current_stats.percent,
                'available_mb': current_stats.available_mb
            },
            'baseline_memory': {
                'rss_mb': self.baseline_memory.rss_mb if self.baseline_memory else 0
            },
            'trend': trend,
            'gc_stats': current_stats.gc_stats,
            'top_objects': current_stats.object_counts,
            'tracked_objects': self.get_tracked_objects_status(),
            'monitoring_enabled': self.monitoring_enabled,
            'history_length': len(self.memory_history)
        }
    
    def stop_monitoring(self):
        """Stop memory monitoring"""
        self.monitoring_enabled = False

# ============================================================================
# RESOURCE MANAGEMENT & CLEANUP
# ============================================================================

class ResourceManager:
    """Comprehensive resource management and cleanup"""
    
    def __init__(self):
        self.resources = {}
        self.cleanup_handlers = []
        self.locks = {}
        self.thread_local = threading.local()
        self.shutdown_handlers = []
        self.resource_pools = {}
    
    def register_resource(self, name: str, resource: Any, cleanup_func: Callable = None):
        """Register a resource for management"""
        self.resources[name] = {
            'resource': resource,
            'cleanup_func': cleanup_func,
            'created_at': time.time(),
            'thread_id': threading.current_thread().ident,
            'ref_count': 1
        }
        
        # Create weak reference for automatic cleanup
        if hasattr(resource, '__del__'):
            weakref.finalize(resource, self._cleanup_resource, name)
    
    def get_resource(self, name: str) -> Any:
        """Get registered resource"""
        if name in self.resources:
            self.resources[name]['ref_count'] += 1
            return self.resources[name]['resource']
        return None
    
    def release_resource(self, name: str):
        """Release resource reference"""
        if name in self.resources:
            self.resources[name]['ref_count'] -= 1
            
            if self.resources[name]['ref_count'] <= 0:
                self._cleanup_resource(name)
    
    def _cleanup_resource(self, name: str):
        """Clean up specific resource"""
        if name in self.resources:
            resource_info = self.resources[name]
            
            try:
                if resource_info['cleanup_func']:
                    resource_info['cleanup_func'](resource_info['resource'])
                elif hasattr(resource_info['resource'], 'close'):
                    resource_info['resource'].close()
                elif hasattr(resource_info['resource'], 'cleanup'):
                    resource_info['resource'].cleanup()
                
                logger.debug(f"Cleaned up resource: {name}")
                
            except Exception as e:
                logger.error(f"Failed to cleanup resource {name}: {e}")
            
            finally:
                del self.resources[name]
    
    def register_cleanup_handler(self, handler: Callable):
        """Register cleanup handler for shutdown"""
        self.cleanup_handlers.append(handler)
    
    def register_shutdown_handler(self, handler: Callable):
        """Register shutdown handler"""
        self.shutdown_handlers.append(handler)
    
    def get_thread_safe_lock(self, name: str) -> threading.Lock:
        """Get thread-safe lock for shared resources"""
        if name not in self.locks:
            self.locks[name] = threading.RLock()
        return self.locks[name]
    
    @asynccontextmanager
    async def async_resource(self, name: str, factory: Callable):
        """Async context manager for resources"""
        resource = None
        try:
            resource = factory()
            self.register_resource(name, resource)
            yield resource
        finally:
            if resource:
                self.release_resource(name)
    
    def create_resource_pool(self, name: str, factory: Callable, max_size: int = 10):
        """Create a resource pool"""
        from queue import Queue
        
        pool = Queue(maxsize=max_size)
        
        # Pre-populate pool
        for _ in range(min(3, max_size)):
            try:
                resource = factory()
                pool.put(resource)
            except Exception as e:
                logger.error(f"Failed to create pooled resource: {e}")
        
        self.resource_pools[name] = {
            'pool': pool,
            'factory': factory,
            'max_size': max_size,
            'created_count': pool.qsize(),
            'active_count': 0
        }
    
    def get_from_pool(self, pool_name: str):
        """Get resource from pool"""
        if pool_name not in self.resource_pools:
            raise ValueError(f"Pool {pool_name} does not exist")
        
        pool_info = self.resource_pools[pool_name]
        pool = pool_info['pool']
        
        try:
            # Try to get existing resource
            resource = pool.get_nowait()
            pool_info['active_count'] += 1
            return resource
        except:
            # Create new resource if pool not full
            if pool_info['created_count'] < pool_info['max_size']:
                try:
                    resource = pool_info['factory']()
                    pool_info['created_count'] += 1
                    pool_info['active_count'] += 1
                    return resource
                except Exception as e:
                    logger.error(f"Failed to create resource from pool: {e}")
                    raise
            else:
                # Wait for resource to become available
                resource = pool.get(timeout=30)
                pool_info['active_count'] += 1
                return resource
    
    def return_to_pool(self, pool_name: str, resource: Any):
        """Return resource to pool"""
        if pool_name not in self.resource_pools:
            return
        
        pool_info = self.resource_pools[pool_name]
        
        try:
            pool_info['pool'].put_nowait(resource)
            pool_info['active_count'] -= 1
        except:
            # Pool full, cleanup resource
            try:
                if hasattr(resource, 'close'):
                    resource.close()
            except:
                pass
            pool_info['created_count'] -= 1
            pool_info['active_count'] -= 1
    
    def cleanup_all(self):
        """Clean up all resources"""
        logger.info("Starting resource cleanup...")
        
        # Run cleanup handlers
        for handler in self.cleanup_handlers:
            try:
                handler()
            except Exception as e:
                logger.error(f"Cleanup handler failed: {e}")
        
        # Clean up registered resources
        for name in list(self.resources.keys()):
            self._cleanup_resource(name)
        
        # Clean up resource pools
        for pool_name, pool_info in self.resource_pools.items():
            pool = pool_info['pool']
            while not pool.empty():
                try:
                    resource = pool.get_nowait()
                    if hasattr(resource, 'close'):
                        resource.close()
                except:
                    pass
        
        self.resource_pools.clear()
        
        logger.info("Resource cleanup completed")
    
    def get_resource_stats(self) -> Dict[str, Any]:
        """Get resource management statistics"""
        return {
            'registered_resources': len(self.resources),
            'resource_pools': {
                name: {
                    'max_size': info['max_size'],
                    'created_count': info['created_count'],
                    'active_count': info['active_count'],
                    'available_count': info['pool'].qsize()
                }
                for name, info in self.resource_pools.items()
            },
            'cleanup_handlers': len(self.cleanup_handlers),
            'shutdown_handlers': len(self.shutdown_handlers),
            'locks_created': len(self.locks)
        }

# ============================================================================
# GRACEFUL SHUTDOWN SYSTEM
# ============================================================================

class GracefulShutdownManager:
    """Manage graceful application shutdown"""
    
    def __init__(self, resource_manager: ResourceManager):
        self.resource_manager = resource_manager
        self.shutdown_timeout = int(os.getenv("GRACEFUL_SHUTDOWN_TIMEOUT", "30"))
        self.shutdown_in_progress = False
        self.shutdown_handlers = []
        self.background_tasks = set()
        self._setup_signal_handlers()
    
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        if os.name != 'nt':  # Unix systems
            signal.signal(signal.SIGTERM, self._signal_handler)
            signal.signal(signal.SIGINT, self._signal_handler)
        else:  # Windows
            signal.signal(signal.SIGINT, self._signal_handler)
            signal.signal(signal.SIGBREAK, self._signal_handler)
    
    def _signal_handler(self, signum: int, frame):
        """Handle shutdown signals"""
        logger.info(f"Received shutdown signal {signum}")
        
        if not self.shutdown_in_progress:
            # Start graceful shutdown in background
            if asyncio.get_event_loop().is_running():
                asyncio.create_task(self.graceful_shutdown())
            else:
                threading.Thread(target=lambda: asyncio.run(self.graceful_shutdown())).start()
    
    def register_shutdown_handler(self, handler: Callable):
        """Register shutdown handler"""
        self.shutdown_handlers.append(handler)
    
    def add_background_task(self, task):
        """Add background task for tracking"""
        if asyncio.iscoroutine(task):
            task = asyncio.create_task(task)
        self.background_tasks.add(task)
        task.add_done_callback(self.background_tasks.discard)
        return task
    
    async def graceful_shutdown(self):
        """Perform graceful shutdown"""
        if self.shutdown_in_progress:
            return
        
        self.shutdown_in_progress = True
        logger.info("Starting graceful shutdown...")
        
        try:
            # Cancel background tasks
            logger.info(f"Cancelling {len(self.background_tasks)} background tasks...")
            for task in list(self.background_tasks):
                if not task.done():
                    task.cancel()
            
            # Wait for tasks to complete or timeout
            if self.background_tasks:
                try:
                    await asyncio.wait_for(
                        asyncio.gather(*self.background_tasks, return_exceptions=True),
                        timeout=self.shutdown_timeout / 2
                    )
                except asyncio.TimeoutError:
                    logger.warning("Some background tasks did not complete within timeout")
            
            # Run shutdown handlers
            logger.info("Running shutdown handlers...")
            for handler in self.shutdown_handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler()
                    else:
                        handler()
                except Exception as e:
                    logger.error(f"Shutdown handler failed: {e}")
            
            # Clean up resources
            logger.info("Cleaning up resources...")
            self.resource_manager.cleanup_all()
            
            logger.info("Graceful shutdown completed")
            
        except Exception as e:
            logger.error(f"Error during graceful shutdown: {e}")
        
        finally:
            # Force exit if needed
            os._exit(0)

# ============================================================================
# CIRCULAR IMPORT DETECTION
# ============================================================================

class CircularImportDetector:
    """Detect and prevent circular imports"""
    
    def __init__(self):
        self.import_stack = []
        self.import_graph = {}
        self.detected_cycles = []
    
    def check_imports(self, start_module: str = None) -> List[List[str]]:
        """Check for circular imports in the application"""
        import importlib.util
        import pkgutil
        
        if start_module is None:
            # Default to current package
            start_module = __package__ or 'backend'
        
        try:
            # Build import graph
            self._build_import_graph(start_module)
            
            # Detect cycles
            self._detect_cycles()
            
            return self.detected_cycles
            
        except Exception as e:
            logger.error(f"Failed to check circular imports: {e}")
            return []
    
    def _build_import_graph(self, module_name: str, visited: Set[str] = None):
        """Build graph of module imports"""
        if visited is None:
            visited = set()
        
        if module_name in visited:
            return
        
        visited.add(module_name)
        
        try:
            spec = importlib.util.find_spec(module_name)
            if spec is None or spec.origin is None:
                return
            
            # Read module file to find imports
            with open(spec.origin, 'r', encoding='utf-8') as f:
                content = f.read()
            
            imports = self._extract_imports(content)
            self.import_graph[module_name] = imports
            
            # Recursively build graph for imported modules
            for imported_module in imports:
                if imported_module.startswith(('backend', 'core', 'api')):
                    self._build_import_graph(imported_module, visited)
                    
        except Exception as e:
            logger.debug(f"Could not process module {module_name}: {e}")
    
    def _extract_imports(self, content: str) -> List[str]:
        """Extract import statements from module content"""
        import ast
        import re
        
        imports = []
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)
                        
        except SyntaxError:
            # Fallback to regex if AST parsing fails
            import_patterns = [
                r'^\s*import\s+([^\s#]+)',
                r'^\s*from\s+([^\s#]+)\s+import'
            ]
            
            for pattern in import_patterns:
                matches = re.findall(pattern, content, re.MULTILINE)
                imports.extend(matches)
        
        return [imp.split('.')[0] for imp in imports if imp]
    
    def _detect_cycles(self):
        """Detect cycles in import graph using DFS"""
        visited = set()
        rec_stack = set()
        
        def dfs(module: str, path: List[str]) -> bool:
            if module in rec_stack:
                # Found cycle
                cycle_start = path.index(module)
                cycle = path[cycle_start:] + [module]
                self.detected_cycles.append(cycle)
                return True
            
            if module in visited:
                return False
            
            visited.add(module)
            rec_stack.add(module)
            
            for neighbor in self.import_graph.get(module, []):
                if dfs(neighbor, path + [neighbor]):
                    return True
            
            rec_stack.remove(module)
            return False
        
        for module in self.import_graph:
            if module not in visited:
                dfs(module, [module])

# Global instances
memory_detector = MemoryLeakDetector()
resource_manager = ResourceManager()
shutdown_manager = GracefulShutdownManager(resource_manager)
import_detector = CircularImportDetector()

# Start monitoring
memory_detector.start_monitoring()

# Export key classes
__all__ = [
    'MemoryLeakDetector',
    'ResourceManager',
    'GracefulShutdownManager',
    'CircularImportDetector',
    'memory_detector',
    'resource_manager',
    'shutdown_manager',
    'import_detector'
]
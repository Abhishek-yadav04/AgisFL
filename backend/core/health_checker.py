"""
Comprehensive Health Checker for AgisFL Enterprise
"""
import asyncio
import time
import psutil
import logging
from typing import Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class HealthChecker:
    """Enterprise health checker with comprehensive monitoring"""
    
    def __init__(self):
        self.start_time = time.time()
        self.last_check = None
        self.health_history = []
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get comprehensive health status"""
        
        health_data = {
            "healthy": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": int(time.time() - self.start_time),
            "components": {}
        }
        
        # Check system resources
        try:
            health_data["components"]["system"] = await self._check_system_health()
        except Exception as e:
            health_data["components"]["system"] = {"healthy": False, "error": str(e)}
            health_data["healthy"] = False
        
        # Check database
        try:
            health_data["components"]["database"] = await self._check_database_health()
        except Exception as e:
            health_data["components"]["database"] = {"healthy": False, "error": str(e)}
            health_data["healthy"] = False
        
        # Check cache
        try:
            health_data["components"]["cache"] = await self._check_cache_health()
        except Exception as e:
            health_data["components"]["cache"] = {"healthy": False, "error": str(e)}
        
        # Check external services
        try:
            health_data["components"]["external"] = await self._check_external_services()
        except Exception as e:
            health_data["components"]["external"] = {"healthy": False, "error": str(e)}
        
        self.last_check = time.time()
        self._record_health_history(health_data)
        
        return health_data
    
    async def _check_system_health(self) -> Dict[str, Any]:
        """Check system resource health"""
        
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        
        try:
            import os
            if os.name == 'nt':  # Windows
                disk = psutil.disk_usage('C:\\')
            else:
                disk = psutil.disk_usage('/')
        except:
            disk = type('obj', (object,), {'percent': 0})()
        
        healthy = (
            cpu_percent < 90 and
            memory.percent < 90 and
            disk.percent < 90
        )
        
        return {
            "healthy": healthy,
            "cpu_percent": round(cpu_percent, 1),
            "memory_percent": round(memory.percent, 1),
            "disk_percent": round(disk.percent, 1),
            "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
        }
    
    async def _check_database_health(self) -> Dict[str, Any]:
        """Check database connectivity and performance"""
        
        try:
            # Import database manager
            from core.multi_tier_integration import db_manager
            
            start_time = time.time()
            # Simple connectivity test
            await db_manager.get_user_by_username("health_check")
            response_time = time.time() - start_time
            
            return {
                "healthy": response_time < 1.0,  # 1 second threshold
                "response_time_ms": round(response_time * 1000, 2),
                "connection_pool_size": getattr(db_manager, 'pool_size', 'unknown')
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": "Database connection failed",
                "details": str(e)[:100]
            }
    
    async def _check_cache_health(self) -> Dict[str, Any]:
        """Check cache (Redis) health"""
        
        try:
            import redis
            r = redis.Redis(host='localhost', port=6379, decode_responses=True)
            
            start_time = time.time()
            r.ping()
            response_time = time.time() - start_time
            
            info = r.info()
            
            return {
                "healthy": response_time < 0.1,  # 100ms threshold
                "response_time_ms": round(response_time * 1000, 2),
                "memory_usage_mb": round(info.get('used_memory', 0) / 1024 / 1024, 2),
                "connected_clients": info.get('connected_clients', 0)
            }
        except Exception as e:
            return {
                "healthy": False,
                "error": "Cache connection failed",
                "available": False
            }
    
    async def _check_external_services(self) -> Dict[str, Any]:
        """Check external service dependencies"""
        
        services = {}
        
        # Check PostgreSQL database health
        try:
            from backend.config.enterprise_config import config_manager
            database_url = config_manager.get_database_url()
            
            # Only check PostgreSQL if not using SQLite
            if not database_url.startswith("sqlite"):
                services["postgresql"] = await self._check_postgresql()
        except Exception as e:
            logger.warning(f"Could not determine database configuration: {e}")
        
        services["threat_intel"] = await self._check_threat_intel_api()
        
        healthy = all(service.get("healthy", False) for service in services.values())
        
        return {
            "healthy": healthy,
            "services": services
        }
    
    async def _check_postgresql(self) -> Dict[str, Any]:
        """Check PostgreSQL connectivity"""

        try:
            import asyncpg
            import time

            from backend.config.enterprise_config import config_manager
            database_url = config_manager.get_database_url()

            start_time = time.time()
            
            # Parse database URL to get connection parameters
            if database_url.startswith("postgresql://"):
                # Simple connection test
                conn = await asyncpg.connect(database_url)
                await conn.close()
                
                response_time = time.time() - start_time
                
                return {
                    "healthy": True,
                    "response_time_ms": round(response_time * 1000, 2),
                    "status": "connected"
                }
            else:
                return {
                    "healthy": False,
                    "error": "Invalid database URL format",
                    "available": False
                }
                
        except Exception as e:
            return {
                "healthy": False,
                "error": f"PostgreSQL connection failed: {str(e)}",
                "available": False
            }
    
    async def _check_threat_intel_api(self) -> Dict[str, Any]:
        """Check threat intelligence API"""
        
        try:
            import httpx
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                start_time = time.time()
                response = await client.get("https://api.github.com")  # Simple connectivity test
                response_time = time.time() - start_time
                
                return {
                    "healthy": response.status_code == 200 and response_time < 3.0,
                    "response_time_ms": round(response_time * 1000, 2),
                    "status_code": response.status_code
                }
        except Exception as e:
            return {
                "healthy": False,
                "error": "External API unreachable",
                "available": False
            }
    
    def _record_health_history(self, health_data: Dict[str, Any]):
        """Record health check history"""
        
        self.health_history.append({
            "timestamp": health_data["timestamp"],
            "healthy": health_data["healthy"],
            "uptime": health_data["uptime_seconds"]
        })
        
        # Keep only last 100 records
        if len(self.health_history) > 100:
            self.health_history = self.health_history[-100:]
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health summary statistics"""
        
        if not self.health_history:
            return {"availability": 0, "total_checks": 0}
        
        healthy_checks = sum(1 for check in self.health_history if check["healthy"])
        total_checks = len(self.health_history)
        
        return {
            "availability_percent": round((healthy_checks / total_checks) * 100, 2),
            "total_checks": total_checks,
            "healthy_checks": healthy_checks,
            "last_check": self.last_check,
            "uptime_seconds": int(time.time() - self.start_time)
        }

# Global health checker instance
health_checker = HealthChecker()
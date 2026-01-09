"""Real-time data engine for live system metrics"""

import asyncio
import time
import psutil
from typing import Dict, Any, List
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()

class RealTimeEngine:
    def __init__(self):
        self.is_running = False
        self.metrics_history = []
        self.max_history = 1000
        
    async def start(self):
        """Start real-time data collection"""
        self.is_running = True
        asyncio.create_task(self._collect_metrics())
        logger.info("Real-time engine started")
    
    async def _collect_metrics(self):
        """Collect real system metrics continuously"""
        while self.is_running:
            try:
                metrics = await self._get_system_metrics()
                self.metrics_history.append(metrics)
                
                # Keep only recent metrics
                if len(self.metrics_history) > self.max_history:
                    self.metrics_history = self.metrics_history[-self.max_history:]
                
                await asyncio.sleep(1)  # Collect every second
                
            except Exception as e:
                logger.error("Metrics collection error", error=str(e))
                await asyncio.sleep(5)
    
    async def _get_system_metrics(self) -> Dict[str, Any]:
        """Get real system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            
            # Network metrics
            network = psutil.net_io_counters()
            
            # Process metrics
            process_count = len(psutil.pids())
            
            return {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count,
                    "load_avg": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                    "free": memory.free
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": disk.percent
                },
                "network": {
                    "bytes_sent": network.bytes_sent,
                    "bytes_recv": network.bytes_recv,
                    "packets_sent": network.packets_sent,
                    "packets_recv": network.packets_recv,
                    "errin": network.errin,
                    "errout": network.errout,
                    "dropin": network.dropin,
                    "dropout": network.dropout
                },
                "processes": {
                    "count": process_count
                }
            }
            
        except Exception as e:
            logger.error("System metrics error", error=str(e))
            return {"timestamp": datetime.now(timezone.utc).isoformat(), "error": str(e)}
    
    def get_latest_metrics(self) -> Dict[str, Any]:
        """Get latest system metrics"""
        if not self.metrics_history:
            return {}
        return self.metrics_history[-1]
    
    def get_metrics_history(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent metrics history"""
        return self.metrics_history[-limit:] if self.metrics_history else []
    
    def stop(self):
        """Stop real-time data collection"""
        self.is_running = False
        logger.info("Real-time engine stopped")

# Global instance
real_time_engine = RealTimeEngine()
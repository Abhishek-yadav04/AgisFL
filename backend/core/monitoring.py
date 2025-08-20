"""System monitoring and metrics collection"""

import threading
import time
import psutil
from typing import Dict, Any
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()

class MetricsCollector:
    """System metrics collector"""
    
    def __init__(self):
        self.is_running = False
        self.current_metrics = {}
        
    def start(self):
        """Start metrics collection"""
        self.is_running = True
        threading.Thread(target=self._collection_loop, daemon=True).start()
        logger.info("Metrics collector started")
    
    def _collection_loop(self):
        """Metrics collection loop"""
        while self.is_running:
            try:
                self.current_metrics = {
                    'cpu_percent': psutil.cpu_percent(interval=1),
                    'memory_percent': psutil.virtual_memory().percent,
                    'disk_percent': psutil.disk_usage('/').percent,
                    'network_io': psutil.net_io_counters()._asdict(),
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                time.sleep(5)
            except Exception as e:
                logger.error("Metrics collection error", error=str(e))
                time.sleep(10)
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        return self.current_metrics.copy()
    
    def stop(self):
        """Stop metrics collection"""
        self.is_running = False
        logger.info("Metrics collector stopped")
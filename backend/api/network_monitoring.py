"""
Network Monitoring API
Provides network monitoring status and metrics
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import time
import psutil
from datetime import datetime, timezone

router = APIRouter(tags=["Network Monitoring"])

@router.get("/status")
async def get_network_monitoring_status() -> Dict[str, Any]:
    """Get network monitoring status"""
    try:
        # Get network statistics
        net_io = psutil.net_io_counters()
        net_connections = psutil.net_connections()
        
        # Calculate network usage
        active_connections = len([conn for conn in net_connections if conn.status == 'ESTABLISHED'])
        
        return {
            "status": "active",
            "monitoring_enabled": True,
            "network_stats": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_received": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_received": net_io.packets_recv,
                "active_connections": active_connections,
                "total_connections": len(net_connections)
            },
            "performance": {
                "throughput_mbps": round((net_io.bytes_sent + net_io.bytes_recv) / (1024 * 1024), 2),
                "connection_utilization": min(100, (active_connections / max(1, len(net_connections))) * 100),
                "network_health": "good" if active_connections < 1000 else "degraded"
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "uptime_seconds": time.time()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.get("/metrics")
async def get_network_metrics() -> Dict[str, Any]:
    """Get detailed network metrics"""
    try:
        net_io = psutil.net_io_counters()
        
        return {
            "interface_stats": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_received": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_received": net_io.packets_recv,
                "errors_in": net_io.errin,
                "errors_out": net_io.errout,
                "drops_in": net_io.dropin,
                "drops_out": net_io.dropout
            },
            "connection_stats": {
                "total_connections": len(psutil.net_connections()),
                "established": len([c for c in psutil.net_connections() if c.status == 'ESTABLISHED']),
                "listening": len([c for c in psutil.net_connections() if c.status == 'LISTEN']),
                "time_wait": len([c for c in psutil.net_connections() if c.status == 'TIME_WAIT'])
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
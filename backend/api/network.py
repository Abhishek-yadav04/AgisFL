"""Network monitoring API endpoints"""

from fastapi import APIRouter
from typing import Dict, Any
import random
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/network", tags=["Network"])

@router.get("/stats")
async def get_network_stats() -> Dict[str, Any]:
    """Get network statistics"""
    return {
        "total_packets": random.randint(10000, 50000),
        "suspicious_packets": random.randint(100, 500),
        "bandwidth_mbps": round(random.uniform(50, 200), 2),
        "active_connections": random.randint(100, 500),
        "packet_loss": round(random.uniform(0.1, 2.0), 2),
        "latency_ms": round(random.uniform(10, 50), 1),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/packets")
async def get_network_packets() -> Dict[str, Any]:
    """Get network packet data"""
    packets = []
    for i in range(20):
        packets.append({
            "id": f"packet_{i}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": f"192.168.1.{random.randint(1, 254)}",
            "destination_ip": f"10.0.0.{random.randint(1, 254)}",
            "protocol": random.choice(["TCP", "UDP", "ICMP"]),
            "length": random.randint(64, 1500),
            "suspicious_score": round(random.uniform(0, 1), 3),
            "threat_level": random.choice(["low", "medium", "high"])
        })
    
    return {"packets": packets, "total": len(packets)}
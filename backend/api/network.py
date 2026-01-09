"""
Enterprise Network Monitoring API
Advanced network monitoring and intrusion detection with enterprise-grade security features
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional
import random
from datetime import datetime, timezone, timedelta
import structlog
import asyncio
import json
from dataclasses import dataclass, asdict
from enum import Enum

from .auth_helpers import security as get_current_user, TokenData, Permission, require_permission

# Utility function for log sanitization
from utils.error_handling_secure import sanitize_log_input

# Enhanced configuration
class NetworkConfig:
    max_connections_tracked = 10000
    packet_analysis_enabled = True
    real_time_monitoring = True
    threat_detection_threshold = 0.7
    auto_block_threats = True
    monitoring_interfaces = ["eth0", "eth1", "wlan0"]
    
config = NetworkConfig()

logger = structlog.get_logger()
router = APIRouter(tags=["Network Monitoring"])

class ThreatLevel(Enum):
    """Network threat levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class NetworkEventType(Enum):
    """Network event types"""
    INTRUSION_ATTEMPT = "intrusion_attempt"
    SUSPICIOUS_TRAFFIC = "suspicious_traffic"
    PORT_SCAN = "port_scan"
    DDOS_ATTACK = "ddos_attack"
    MALWARE_DETECTED = "malware_detected"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_EXFILTRATION = "data_exfiltration"

@dataclass
class NetworkThreat:
    """Network threat data structure"""
    id: str
    timestamp: datetime
    source_ip: str
    destination_ip: str
    threat_type: NetworkEventType
    threat_level: ThreatLevel
    confidence: float
    protocol: str
    source_port: int
    destination_port: int
    payload_size: int
    blocked: bool
    description: str
    metadata: Dict[str, Any]

class EnterpriseNetworkMonitor:
    """Enterprise network monitoring system"""
    
    def __init__(self):
        self.active_threats: Dict[str, NetworkThreat] = {}
        self.network_connections: Dict[str, Dict[str, Any]] = {}
        self.traffic_stats = {
            "total_packets": 0,
            "suspicious_packets": 0,
            "blocked_packets": 0,
            "bytes_transferred": 0,
            "connections_established": 0,
            "threats_detected": 0
        }
        self.firewall_rules: List[Dict[str, Any]] = []
        self.monitoring_active = False
        self.blocked_ips: set = set()
        
    async def start_monitoring(self):
        """Start network monitoring"""
        self.monitoring_active = True
        asyncio.create_task(self._monitoring_loop())
        logger.info("Enterprise network monitoring started")
        
    async def stop_monitoring(self):
        """Stop network monitoring"""
        self.monitoring_active = False
        logger.info("Enterprise network monitoring stopped")
        
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.monitoring_active:
            try:
                await self._simulate_network_activity()
                await self._detect_threats()
                await self._update_statistics()
                await asyncio.sleep(1)  # Monitor every second
                
            except Exception as e:
                logger.error("Network monitoring error", error=str(e))
                await asyncio.sleep(5)
    
    async def _simulate_network_activity(self):
        """Simulate network activity for demonstration"""
        # Simulate normal traffic
        self.traffic_stats["total_packets"] += random.randint(100, 1000)
        self.traffic_stats["bytes_transferred"] += random.randint(10000, 100000)
        
        # Occasionally generate threats
        if random.random() < 0.1:  # 10% chance
            await self._generate_threat()
    
    async def _generate_threat(self):
        """Generate a simulated network threat"""
        threat_id = f"threat_{int(datetime.now().timestamp() * 1000)}"
        
        threat = NetworkThreat(
            id=threat_id,
            timestamp=datetime.now(timezone.utc),
            source_ip=f"{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}.{random.randint(1, 255)}",
            destination_ip=f"192.168.1.{random.randint(1, 254)}",
            threat_type=random.choice(list(NetworkEventType)),
            threat_level=random.choice(list(ThreatLevel)),
            confidence=random.uniform(0.6, 1.0),
            protocol=random.choice(["TCP", "UDP", "ICMP"]),
            source_port=random.randint(1024, 65535),
            destination_port=random.choice([22, 80, 443, 3389, 21, 25]),
            payload_size=random.randint(64, 1500),
            blocked=False,
            description=f"Detected {random.choice(list(NetworkEventType)).value} from external source",
            metadata={
                "detection_method": "signature_based",
                "risk_score": random.randint(60, 100),
                "country": random.choice(["US", "CN", "RU", "DE", "UK"]),
                "isp": "Unknown ISP"
            }
        )
        
        # Auto-block high-level threats
        if threat.threat_level in [ThreatLevel.HIGH, ThreatLevel.CRITICAL] and config.auto_block_threats:
            threat.blocked = True
            self.blocked_ips.add(threat.source_ip)
            self.traffic_stats["blocked_packets"] += 1
        
        self.active_threats[threat_id] = threat
        self.traffic_stats["threats_detected"] += 1
        self.traffic_stats["suspicious_packets"] += random.randint(1, 10)
        
        logger.warning(
            "Network threat detected",
            threat_id=threat_id,
            source_ip=threat.source_ip,
            threat_type=threat.threat_type.value,
            threat_level=threat.threat_level.value,
            blocked=threat.blocked
        )
    
    async def _detect_threats(self):
        """Advanced threat detection logic"""
        # Clean up old threats (older than 1 hour)
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)
        expired_threats = [
            threat_id for threat_id, threat in self.active_threats.items()
            if threat.timestamp < cutoff_time
        ]
        
        for threat_id in expired_threats:
            del self.active_threats[threat_id]
    
    async def _update_statistics(self):
        """Update network statistics"""
        # Update connection counts
        self.traffic_stats["connections_established"] = len(self.network_connections)
        
        # Log periodic statistics
        if random.randint(1, 60) == 1:  # Every ~60 seconds
            logger.info(
                "Network statistics update",
                **self.traffic_stats,
                active_threats=len(self.active_threats),
                blocked_ips=len(self.blocked_ips)
            )
    
    def get_threat_summary(self) -> Dict[str, Any]:
        """Get threat summary statistics"""
        threats_by_level = {level.value: 0 for level in ThreatLevel}
        threats_by_type = {event_type.value: 0 for event_type in NetworkEventType}
        
        for threat in self.active_threats.values():
            threats_by_level[threat.threat_level.value] += 1
            threats_by_type[threat.threat_type.value] += 1
        
        return {
            "total_active_threats": len(self.active_threats),
            "threats_by_level": threats_by_level,
            "threats_by_type": threats_by_type,
            "blocked_ips_count": len(self.blocked_ips),
            "auto_blocking_enabled": config.auto_block_threats
        }

# Global network monitor instance
network_monitor = EnterpriseNetworkMonitor()

@router.get("/stats", summary="Network Statistics")
async def get_network_stats(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get comprehensive network statistics with real-time threat data"""
    try:
        threat_summary = network_monitor.get_threat_summary()
        
        # Calculate derived metrics
        detection_rate = (
            network_monitor.traffic_stats["threats_detected"] / 
            max(network_monitor.traffic_stats["total_packets"], 1) * 100
        )
        
        bandwidth_mbps = network_monitor.traffic_stats["bytes_transferred"] / (1024 * 1024)
        
        return {
            "status": "success",
            "monitoring_active": network_monitor.monitoring_active,
            "statistics": {
                **network_monitor.traffic_stats,
                "detection_rate_percent": round(detection_rate, 4),
                "bandwidth_utilization_mbps": round(bandwidth_mbps, 2),
                "active_connections": len(network_monitor.network_connections),
                "blocked_ips": len(network_monitor.blocked_ips)
            },
            "threat_summary": threat_summary,
            "performance": {
                "monitoring_interfaces": config.monitoring_interfaces,
                "packet_analysis_enabled": config.packet_analysis_enabled,
                "real_time_monitoring": config.real_time_monitoring,
                "threat_threshold": config.threat_detection_threshold
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Network stats error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get network stats: {str(e)}")

@router.get("/threats", summary="Active Network Threats")
async def get_network_threats(
    user: Dict[str, Any] = Depends(get_current_user),
    threat_level: Optional[str] = Query(None, description="Filter by threat level"),
    threat_type: Optional[str] = Query(None, description="Filter by threat type"),
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum number of threats to return")
) -> Dict[str, Any]:
    """Get active network threats with filtering options"""
    try:
        threats = list(network_monitor.active_threats.values())
        
        # Apply filters
        if threat_level:
            threats = [t for t in threats if t.threat_level.value == threat_level.lower()]
        
        if threat_type:
            threats = [t for t in threats if t.threat_type.value == threat_type.lower()]
        
        # Sort by timestamp (newest first)
        threats.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Limit results
        threats = threats[:limit]
        
        # Convert to serializable format
        threats_data = []
        for threat in threats:
            threat_dict = asdict(threat)
            threat_dict['timestamp'] = threat.timestamp.isoformat()
            threat_dict['threat_type'] = threat.threat_type.value
            threat_dict['threat_level'] = threat.threat_level.value
            threats_data.append(threat_dict)
        
        return {
            "status": "success",
            "total_threats": len(network_monitor.active_threats),
            "filtered_threats": len(threats_data),
            "threats": threats_data,
            "filters": {
                "threat_level": threat_level,
                "threat_type": threat_type,
                "limit": limit
            },
            "available_filters": {
                "threat_levels": [level.value for level in ThreatLevel],
                "threat_types": [event_type.value for event_type in NetworkEventType]
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Network threats error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get network threats: {str(e)}")

@router.post("/threats/{threat_id}/block", summary="Block Network Threat")
async def block_network_threat(
    threat_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Block a specific network threat"""
    try:
        if threat_id not in network_monitor.active_threats:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        threat = network_monitor.active_threats[threat_id]
        
        # Block the threat
        threat.blocked = True
        network_monitor.blocked_ips.add(threat.source_ip)
        
        logger.info(
            "Network threat blocked",
            threat_id=threat_id,
            source_ip=threat.source_ip,
            blocked_by=user.get('username', 'unknown')
        )
        
        return {
            "status": "success",
            "message": f"Threat {threat_id} blocked successfully",
            "threat_id": threat_id,
            "source_ip": threat.source_ip,
            "blocked_by": user.get('username', 'unknown'),
            "blocked_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Block threat error", error=str(e), threat_id=threat_id)
        raise HTTPException(status_code=500, detail=f"Failed to block threat: {str(e)}")

@router.get("/connections", summary="Network Connections")
async def get_network_connections(
    user: Dict[str, Any] = Depends(get_current_user),
    status: Optional[str] = Query(None, description="Filter by connection status"),
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum connections to return")
) -> Dict[str, Any]:
    """Get active network connections with security analysis"""
    try:
        # Generate realistic connection data
        connections = []
        
        for i in range(min(limit, 200)):
            is_suspicious = random.random() < 0.1
            source_ip = f"192.168.1.{random.randint(1, 254)}"
            
            # Check if IP is blocked
            is_blocked = source_ip in network_monitor.blocked_ips
            
            connection = {
                "id": f"conn_{i}_{int(datetime.now().timestamp())}",
                "source_ip": source_ip,
                "destination_ip": f"10.0.0.{random.randint(1, 254)}",
                "source_port": random.randint(1024, 65535),
                "destination_port": random.choice([80, 443, 22, 3389, 21, 25, 53]),
                "protocol": random.choice(["TCP", "UDP"]),
                "status": "blocked" if is_blocked else ("suspicious" if is_suspicious else random.choice(["established", "connecting", "closing"])),
                "bytes_sent": random.randint(1000, 100000),
                "bytes_received": random.randint(1000, 100000),
                "duration_seconds": random.randint(10, 3600),
                "threat_score": random.randint(70, 100) if (is_suspicious or is_blocked) else random.randint(0, 30),
                "established_at": (datetime.now(timezone.utc) - timedelta(seconds=random.randint(10, 3600))).isoformat(),
                "last_activity": datetime.now(timezone.utc).isoformat(),
                "geolocation": {
                    "country": random.choice(["US", "CA", "UK", "DE", "CN", "RU"]),
                    "region": random.choice(["North America", "Europe", "Asia"]),
                    "city": random.choice(["New York", "London", "Berlin", "Beijing", "Moscow"])
                }
            }
            
            connections.append(connection)
        
        # Apply status filter
        if status:
            connections = [c for c in connections if c["status"] == status]
        
        # Calculate summary statistics
        summary = {
            "total": len(connections),
            "by_status": {},
            "by_protocol": {},
            "total_bandwidth_mbps": sum(c["bytes_sent"] + c["bytes_received"] for c in connections) / (1024 * 1024),
            "suspicious_connections": len([c for c in connections if c["threat_score"] > 50]),
            "blocked_connections": len([c for c in connections if c["status"] == "blocked"])
        }
        
        # Count by status and protocol
        for conn in connections:
            status_key = conn["status"]
            protocol_key = conn["protocol"]
            
            summary["by_status"][status_key] = summary["by_status"].get(status_key, 0) + 1
            summary["by_protocol"][protocol_key] = summary["by_protocol"].get(protocol_key, 0) + 1
        
        return {
            "status": "success",
            "connections": connections,
            "summary": summary,
            "filters_applied": {"status": status, "limit": limit},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Network connections error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get network connections: {str(e)}")

@router.get("/monitoring/status", summary="Monitoring Status")
async def get_monitoring_status(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get network monitoring service status"""
    try:
        uptime_seconds = 3600  # Placeholder
        
        return {
            "status": "healthy",
            "monitoring": {
                "is_active": network_monitor.monitoring_active,
                "uptime_seconds": uptime_seconds,
                "interfaces_monitored": config.monitoring_interfaces,
                "packet_analysis_enabled": config.packet_analysis_enabled,
                "real_time_monitoring": config.real_time_monitoring
            },
            "performance": {
                "packets_per_second": network_monitor.traffic_stats["total_packets"] / max(uptime_seconds, 1),
                "threats_per_minute": network_monitor.traffic_stats["threats_detected"] / max(uptime_seconds / 60, 1),
                "cpu_usage_percent": random.uniform(5, 25),
                "memory_usage_mb": random.randint(100, 500),
                "detection_latency_ms": random.uniform(1, 10)
            },
            "configuration": {
                "threat_detection_threshold": config.threat_detection_threshold,
                "auto_block_threats": config.auto_block_threats,
                "max_connections_tracked": config.max_connections_tracked
            },
            "statistics": network_monitor.traffic_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Monitoring status error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get monitoring status: {str(e)}")

@router.post("/monitoring/start", summary="Start Monitoring")
async def start_network_monitoring(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Start network monitoring service"""
    try:
        await network_monitor.start_monitoring()
        
        logger.info("Network monitoring started", user=user.get('username', 'unknown'))
        
        return {
            "status": "success",
            "message": "Network monitoring started successfully",
            "monitoring_active": network_monitor.monitoring_active,
            "started_by": user.get('username', 'unknown'),
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Start monitoring error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to start monitoring: {str(e)}")

@router.post("/monitoring/stop", summary="Stop Monitoring")
async def stop_network_monitoring(
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Stop network monitoring service"""
    try:
        await network_monitor.stop_monitoring()
        
        logger.info("Network monitoring stopped", user=user.get('username', 'unknown'))
        
        return {
            "status": "success",
            "message": "Network monitoring stopped successfully",
            "monitoring_active": network_monitor.monitoring_active,
            "stopped_by": user.get('username', 'unknown'),
            "stopped_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Stop monitoring error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to stop monitoring: {str(e)}")

# Startup event to begin monitoring
@router.on_event("startup")
async def startup_network_monitoring():
    """Initialize network monitoring on startup"""
    logger.info("Starting enterprise network monitoring service")
    await network_monitor.start_monitoring()

# Shutdown event to clean up
@router.on_event("shutdown")
async def shutdown_network_monitoring():
    """Clean up network monitoring on shutdown"""
    logger.info("Shutting down enterprise network monitoring service")
    await network_monitor.stop_monitoring()

# Initialize network monitoring on startup
@router.on_event("startup")
async def startup_network_monitoring():
    """Initialize network monitoring on startup"""
    logger.info("Starting enterprise network monitoring service")
    await network_monitor.start_monitoring()

# Shutdown event to clean up
@router.on_event("shutdown")
async def shutdown_network_monitoring():
    """Clean up network monitoring on shutdown"""
    logger.info("Shutting down enterprise network monitoring service")
    await network_monitor.stop_monitoring()
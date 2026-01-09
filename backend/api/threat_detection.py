"""Enhanced Threat Detection API with ML Integration"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging
import asyncio
import json
from pydantic import BaseModel, Field

try:
    from core.ids_engine import ids_engine, ThreatDetectionResult
    from .auth_helpers import security as get_current_user, TokenData, require_permission, Permission
    from utils.security_utils import sanitize_log_input
except ImportError:
    def get_current_user():
        return {"username": "admin", "role": "admin"}
    
    def sanitize_log_input(text):
        return str(text).replace('\n', '').replace('\r', '')[:200]
    
    # Mock IDS engine for fallback
    class MockIDSEngine:
        async def initialize(self):
            return True
        
        async def analyze_packet(self, packet_data):
            from dataclasses import dataclass
            @dataclass
            class MockResult:
                threat_detected: bool = False
                confidence: float = 0.5
                risk_level: str = "low"
                threat_type: str = "normal"
                details: dict = None
                timestamp: datetime = datetime.now(timezone.utc)
            
            return MockResult(details={})
        
        async def get_threat_statistics(self):
            return {"total_analyzed": 0, "threats_detected": 0, "threat_rate": 0.0}
        
        async def batch_analyze_packets(self, packets):
            return []
    
    ids_engine = MockIDSEngine()

router = APIRouter(tags=["Threat Detection"])
logger = logging.getLogger(__name__)

# Pydantic models
class PacketData(BaseModel):
    src_ip: str = Field(..., description="Source IP address")
    dst_ip: str = Field(..., description="Destination IP address")
    protocol: str = Field(..., description="Protocol type (TCP/UDP/ICMP)")
    port_src: int = Field(..., description="Source port")
    port_dst: int = Field(..., description="Destination port")
    size: int = Field(..., description="Packet size in bytes")
    flags: Optional[List[str]] = Field(default=[], description="TCP flags")
    payload: Optional[str] = Field(default="", description="Packet payload")
    timestamp: Optional[str] = Field(default=None, description="Packet timestamp")

class BatchAnalysisRequest(BaseModel):
    packets: List[PacketData] = Field(..., description="List of packets to analyze")
    analysis_options: Optional[Dict[str, Any]] = Field(default={}, description="Analysis options")

def _dev_mode_enabled() -> bool:
    import os
    return os.getenv("DISABLE_AUTHENTICATION", "").lower() == "true"

async def _require_auth(request: Request = None):
    if _dev_mode_enabled():
        return {"username": "anonymous", "role": "admin"}
    
    import inspect
    if 'get_current_user' in globals():
        fn = get_current_user
        if inspect.iscoroutinefunction(fn):
            try:
                return await fn(request)
            except TypeError:
                return await fn()
        else:
            try:
                return fn(request)
            except TypeError:
                return fn()
    
    raise HTTPException(status_code=401, detail="Authentication required")

@router.on_event("startup")
async def initialize_ids_engine():
    """Initialize IDS engine on startup"""
    try:
        success = await ids_engine.initialize()
        if success:
            logger.info("IDS Engine initialized successfully with ML models")
        else:
            logger.warning("IDS Engine initialized with fallback detection")
    except Exception as e:
        logger.error(f"Failed to initialize IDS Engine: {e}")

@router.get("/status", summary="Get Threat Detection Status")
async def get_threat_detection_status() -> Dict[str, Any]:
    """Get current status of threat detection system"""
    try:
        stats = await ids_engine.get_threat_statistics()
        
        return {
            "status": "success",
            "threat_detection": {
                "engine_status": "active",
                "ml_models_loaded": hasattr(ids_engine, 'is_initialized') and ids_engine.is_initialized,
                "statistics": stats,
                "capabilities": {
                    "real_time_analysis": True,
                    "batch_analysis": True,
                    "ml_based_detection": hasattr(ids_engine, 'is_initialized') and ids_engine.is_initialized,
                    "rule_based_fallback": True,
                    "threat_classification": True,
                    "risk_assessment": True
                }
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get threat detection status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")

@router.post("/analyze-packet", summary="Analyze Single Packet")
async def analyze_packet(
    packet: PacketData,
    user: Dict[str, Any] = Depends(_require_auth)
) -> Dict[str, Any]:
    """Analyze a single packet for threats using ML models"""
    try:
        # Convert Pydantic model to dict
        packet_data = packet.dict()
        
        # Add timestamp if not provided
        if not packet_data.get('timestamp'):
            packet_data['timestamp'] = datetime.now(timezone.utc).isoformat()
        
        # Analyze packet
        result = await ids_engine.analyze_packet(packet_data)
        
        # Log threat detection
        if result.threat_detected:
            logger.warning(
                f"THREAT DETECTED: {result.threat_type} "
                f"(confidence: {result.confidence:.2f}, risk: {result.risk_level}) "
                f"from {packet.src_ip}:{packet.port_src} to {packet.dst_ip}:{packet.port_dst}"
            )
        
        return {
            "status": "success",
            "analysis_result": {
                "threat_detected": result.threat_detected,
                "confidence": result.confidence,
                "risk_level": result.risk_level,
                "threat_type": result.threat_type,
                "details": result.details,
                "timestamp": result.timestamp.isoformat(),
                "packet_info": {
                    "src": f"{packet.src_ip}:{packet.port_src}",
                    "dst": f"{packet.dst_ip}:{packet.port_dst}",
                    "protocol": packet.protocol,
                    "size": packet.size
                }
            },
            "analyzed_by": user.get('username', 'system'),
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Packet analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch-analyze", summary="Batch Analyze Packets")
async def batch_analyze_packets(
    request: BatchAnalysisRequest,
    user: Dict[str, Any] = Depends(_require_auth)
) -> Dict[str, Any]:
    """Analyze multiple packets in batch for improved performance"""
    try:
        # Convert packets to dict format
        packets_data = []
        for packet in request.packets:
            packet_data = packet.dict()
            if not packet_data.get('timestamp'):
                packet_data['timestamp'] = datetime.now(timezone.utc).isoformat()
            packets_data.append(packet_data)
        
        # Batch analysis
        results = await ids_engine.batch_analyze_packets(packets_data)
        
        # Process results
        analysis_summary = {
            "total_packets": len(results),
            "threats_detected": sum(1 for r in results if r.threat_detected),
            "risk_distribution": {},
            "threat_types": {}
        }
        
        detailed_results = []
        for i, result in enumerate(results):
            # Update summary statistics
            risk_level = result.risk_level
            threat_type = result.threat_type
            
            analysis_summary["risk_distribution"][risk_level] = \
                analysis_summary["risk_distribution"].get(risk_level, 0) + 1
            analysis_summary["threat_types"][threat_type] = \
                analysis_summary["threat_types"].get(threat_type, 0) + 1
            
            # Add detailed result
            detailed_results.append({
                "packet_index": i,
                "threat_detected": result.threat_detected,
                "confidence": result.confidence,
                "risk_level": result.risk_level,
                "threat_type": result.threat_type,
                "details": result.details,
                "timestamp": result.timestamp.isoformat()
            })
        
        # Log batch analysis
        threats_found = analysis_summary["threats_detected"]
        if threats_found > 0:
            logger.warning(
                f"BATCH ANALYSIS: {threats_found}/{len(results)} packets flagged as threats "
                f"by {user.get('username', 'system')}"
            )
        
        return {
            "status": "success",
            "batch_analysis": {
                "summary": analysis_summary,
                "detailed_results": detailed_results,
                "analysis_options": request.analysis_options
            },
            "analyzed_by": user.get('username', 'system'),
            "analysis_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.get("/statistics", summary="Get Threat Statistics")
async def get_threat_statistics() -> Dict[str, Any]:
    """Get comprehensive threat detection statistics"""
    try:
        stats = await ids_engine.get_threat_statistics()
        
        # Enhanced statistics
        enhanced_stats = {
            "overview": {
                "total_packets_analyzed": stats.get("total_analyzed", 0),
                "threats_detected": stats.get("threats_detected", 0),
                "threat_detection_rate": stats.get("threat_rate", 0.0),
                "model_status": stats.get("model_status", "unknown"),
                "last_analysis": stats.get("last_analysis")
            },
            "risk_analysis": {
                "risk_level_distribution": stats.get("risk_distribution", {}),
                "threat_type_distribution": stats.get("threat_types", {}),
                "high_risk_percentage": 0.0,
                "critical_threats": 0
            },
            "performance_metrics": {
                "detection_accuracy": "N/A",  # Would need ground truth for real accuracy
                "false_positive_rate": "N/A",
                "processing_speed": "Real-time",
                "model_confidence_avg": 0.0
            },
            "system_health": {
                "engine_status": "operational",
                "ml_models_loaded": hasattr(ids_engine, 'is_initialized') and ids_engine.is_initialized,
                "memory_usage": "Normal",
                "last_update": datetime.now(timezone.utc).isoformat()
            }
        }
        
        # Calculate enhanced metrics
        risk_dist = stats.get("risk_distribution", {})
        total_risks = sum(risk_dist.values())
        
        if total_risks > 0:
            high_risk_count = risk_dist.get("high", 0) + risk_dist.get("critical", 0)
            enhanced_stats["risk_analysis"]["high_risk_percentage"] = \
                (high_risk_count / total_risks) * 100
            enhanced_stats["risk_analysis"]["critical_threats"] = risk_dist.get("critical", 0)
        
        return {
            "status": "success",
            "statistics": enhanced_stats,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get threat statistics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")

@router.get("/recent-threats", summary="Get Recent Threats")
async def get_recent_threats(
    limit: int = 50,
    risk_level: Optional[str] = None
) -> Dict[str, Any]:
    """Get recent threat detections with optional filtering"""
    try:
        # Get threat history from IDS engine
        if hasattr(ids_engine, 'threat_history'):
            threats = ids_engine.threat_history[-limit:]
        else:
            threats = []
        
        # Filter by risk level if specified
        if risk_level:
            threats = [t for t in threats if t.risk_level == risk_level]
        
        # Format threats for response
        formatted_threats = []
        for threat in threats:
            formatted_threats.append({
                "threat_id": f"threat_{hash(str(threat.timestamp))}",
                "threat_detected": threat.threat_detected,
                "confidence": threat.confidence,
                "risk_level": threat.risk_level,
                "threat_type": threat.threat_type,
                "details": threat.details,
                "timestamp": threat.timestamp.isoformat(),
                "severity_score": threat.confidence * (
                    {"critical": 5, "high": 4, "medium": 3, "low": 2, "minimal": 1}.get(
                        threat.risk_level, 1
                    )
                )
            })
        
        # Sort by severity score (highest first)
        formatted_threats.sort(key=lambda x: x["severity_score"], reverse=True)
        
        return {
            "status": "success",
            "recent_threats": {
                "threats": formatted_threats,
                "total_count": len(formatted_threats),
                "filter_applied": {"risk_level": risk_level} if risk_level else None,
                "time_range": {
                    "from": threats[0].timestamp.isoformat() if threats else None,
                    "to": threats[-1].timestamp.isoformat() if threats else None
                }
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent threats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent threats: {str(e)}")

@router.post("/simulate-threat", summary="Simulate Threat for Testing")
async def simulate_threat(
    threat_type: str = "ddos_attempt",
    user: Dict[str, Any] = Depends(_require_auth)
) -> Dict[str, Any]:
    """Simulate a threat for testing the detection system"""
    try:
        # Create simulated threat packet
        threat_packets = {
            "ddos_attempt": {
                "src_ip": "192.168.1.100",
                "dst_ip": "10.0.0.1",
                "protocol": "UDP",
                "port_src": 12345,
                "port_dst": 80,
                "size": 2048,
                "flags": ["SYN"],
                "payload": "A" * 1000,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "brute_force_attempt": {
                "src_ip": "192.168.1.200",
                "dst_ip": "10.0.0.1",
                "protocol": "TCP",
                "port_src": 54321,
                "port_dst": 22,
                "size": 128,
                "flags": ["SYN", "ACK"],
                "payload": "ssh_login_attempt",
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            "web_attack": {
                "src_ip": "192.168.1.300",
                "dst_ip": "10.0.0.1",
                "protocol": "TCP",
                "port_src": 45678,
                "port_dst": 443,
                "size": 3000,
                "flags": ["PSH", "ACK"],
                "payload": "GET /admin/../../etc/passwd HTTP/1.1",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
        if threat_type not in threat_packets:
            raise HTTPException(
                status_code=400, 
                detail=f"Unknown threat type. Available: {list(threat_packets.keys())}"
            )
        
        # Analyze simulated threat
        packet_data = threat_packets[threat_type]
        result = await ids_engine.analyze_packet(packet_data)
        
        logger.info(f"Threat simulation '{threat_type}' executed by {user.get('username')}")
        
        return {
            "status": "success",
            "simulation": {
                "threat_type": threat_type,
                "simulated_packet": packet_data,
                "detection_result": {
                    "threat_detected": result.threat_detected,
                    "confidence": result.confidence,
                    "risk_level": result.risk_level,
                    "detected_threat_type": result.threat_type,
                    "details": result.details
                },
                "test_passed": result.threat_detected,
                "simulation_timestamp": datetime.now(timezone.utc).isoformat()
            },
            "simulated_by": user.get('username', 'system')
        }
        
    except Exception as e:
        logger.error(f"Threat simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")
"""Threat Analysis Integration for Packet Capture"""

from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import logging

try:
    from core.ids_engine import ids_engine
    from api.packet_capture import capture_engine
except ImportError:
    class MockEngine:
        packets = []
        async def analyze_packet(self, packet):
            return {"threat_detected": False}
        async def get_threat_statistics(self):
            return {"total_analyzed": 0}
    
    ids_engine = MockEngine()
    capture_engine = MockEngine()

router = APIRouter(tags=["Threat Analysis"])
logger = logging.getLogger(__name__)

def _dev_mode_enabled() -> bool:
    import os
    return os.getenv("DISABLE_AUTHENTICATION", "").lower() == "true"

async def _require_auth(request: Request = None):
    if _dev_mode_enabled():
        return {"username": "anonymous", "role": "admin"}
    raise HTTPException(status_code=401, detail="Authentication required")

@router.get("/packet-threats", summary="Get Threats from Captured Packets")
async def get_packet_threats(
    risk_level: Optional[str] = None,
    limit: int = 50,
    user: Dict[str, Any] = Depends(_require_auth)
) -> Dict[str, Any]:
    """Get threat analysis from captured packets"""
    try:
        packets = list(capture_engine.packets)
        
        threat_packets = []
        for packet in packets:
            threat_analysis = packet.get("threat_analysis", {})
            if threat_analysis.get("threat_detected", False):
                if not risk_level or threat_analysis.get("risk_level") == risk_level:
                    threat_packets.append({
                        "packet_info": {
                            "src_ip": packet.get("src_ip"),
                            "dst_ip": packet.get("dst_ip"),
                            "protocol": packet.get("protocol"),
                            "port_src": packet.get("port_src"),
                            "port_dst": packet.get("port_dst"),
                            "size": packet.get("size"),
                            "timestamp": packet.get("timestamp")
                        },
                        "threat_analysis": threat_analysis
                    })
        
        threat_packets = threat_packets[-limit:]
        
        return {
            "status": "success",
            "threats": threat_packets,
            "summary": {
                "total_threats": len(threat_packets),
                "filter_applied": {"risk_level": risk_level} if risk_level else None
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get packet threats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get threats: {str(e)}")

@router.get("/threat-summary", summary="Get Threat Detection Summary")
async def get_threat_summary() -> Dict[str, Any]:
    """Get comprehensive threat detection summary"""
    try:
        packets = list(capture_engine.packets)
        
        total_packets = len(packets)
        threat_count = 0
        risk_levels = {}
        threat_types = {}
        
        for packet in packets:
            threat_analysis = packet.get("threat_analysis", {})
            if threat_analysis.get("threat_detected", False):
                threat_count += 1
                
                risk_level = threat_analysis.get("risk_level", "unknown")
                threat_type = threat_analysis.get("threat_type", "unknown")
                
                risk_levels[risk_level] = risk_levels.get(risk_level, 0) + 1
                threat_types[threat_type] = threat_types.get(threat_type, 0) + 1
        
        return {
            "status": "success",
            "summary": {
                "total_packets_analyzed": total_packets,
                "threats_detected": threat_count,
                "threat_rate": threat_count / total_packets if total_packets > 0 else 0.0,
                "risk_level_distribution": risk_levels,
                "threat_type_distribution": threat_types,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get threat summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")
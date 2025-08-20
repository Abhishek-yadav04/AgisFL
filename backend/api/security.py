"""Security API endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import structlog

from ..main import app_state

logger = structlog.get_logger()
router = APIRouter(prefix="/api/security", tags=["Security"])

@router.get("/threats")
async def get_threats() -> Dict[str, Any]:
    """Get detected threats"""
    if not app_state.ids_engine:
        return {"threats": [], "total": 0}
    
    metrics = await app_state.ids_engine.get_current_metrics()
    threats = metrics.get('recent_threats', [])
    
    return {
        "threats": threats,
        "total": len(threats),
        "threat_types": metrics.get('threat_types', {}),
        "detection_stats": metrics.get('detection_stats', {})
    }

@router.get("/metrics")
async def get_security_metrics() -> Dict[str, Any]:
    """Get security metrics"""
    if not app_state.ids_engine:
        return {"error": "IDS engine not available"}
    
    metrics = await app_state.ids_engine.get_current_metrics()
    return {
        "detection_accuracy": metrics.get('detection_stats', {}).get('accuracy', 0.0),
        "threats_detected": metrics.get('detection_stats', {}).get('threats_detected', 0),
        "false_positive_rate": metrics.get('detection_stats', {}).get('false_positives', 0),
        "monitoring_status": "active" if metrics.get('is_running') else "inactive"
    }

@router.post("/start-monitoring")
async def start_security_monitoring() -> Dict[str, Any]:
    """Start security monitoring"""
    if not app_state.ids_engine:
        raise HTTPException(status_code=503, detail="IDS engine not available")
    
    await app_state.ids_engine.start_monitoring()
    return {"message": "Security monitoring started"}
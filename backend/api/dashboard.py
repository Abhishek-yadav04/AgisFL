"""Dashboard API endpoints"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
from datetime import datetime, timezone
import structlog

from ..core.config import settings
from ..main import app_state

logger = structlog.get_logger()
router = APIRouter(prefix="/api", tags=["Dashboard"])

@router.get("/dashboard")
async def get_dashboard_data() -> Dict[str, Any]:
    """Get comprehensive dashboard data"""
    try:
        # System metrics
        system_metrics = {}
        if app_state.metrics_collector:
            system_metrics = app_state.metrics_collector.get_metrics()
        
        # FL metrics
        fl_metrics = {}
        if app_state.fl_engine:
            fl_metrics = await app_state.fl_engine.get_current_metrics()
        
        # IDS metrics
        ids_metrics = {}
        if app_state.ids_engine:
            ids_metrics = await app_state.ids_engine.get_current_metrics()
        
        return {
            "overview": {
                "system_health": 95,
                "security_score": 92,
                "fl_accuracy": fl_metrics.get('accuracy', 0.0),
                "active_threats": len(ids_metrics.get('recent_threats', [])),
                "uptime_hours": (time.time() - app_state.start_time) / 3600
            },
            "system": system_metrics,
            "federated_learning": fl_metrics,
            "intrusion_detection": ids_metrics,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": settings.version,
            "environment": settings.environment
        }
        
    except Exception as e:
        logger.error("Dashboard data error", error=str(e))
        raise HTTPException(status_code=500, detail="Dashboard data unavailable")
"""
Basic API endpoints for minimal functionality
"""

from fastapi import APIRouter, Request
from typing import Dict, Any
import time
from datetime import datetime

router = APIRouter()

@router.get("/status")
async def get_status() -> Dict[str, Any]:
    """Get basic system status"""
    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "version": "4.0.0",
        "message": "AgisFL Enterprise is running"
    }

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Basic health check"""
    return {"status": "healthy"}

@router.get("/info")
async def system_info() -> Dict[str, Any]:
    """Get basic system information"""
    return {
        "name": "AgisFL Enterprise",
        "version": "4.0.0",
        "description": "Federated Learning Intrusion Detection System",
        "uptime": time.time(),
        "endpoints": [
            "/api/status",
            "/api/health", 
            "/api/info"
        ]
    }
"""Federated Learning API endpoints"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import structlog

from ..main import app_state

logger = structlog.get_logger()
router = APIRouter(prefix="/api/fl", tags=["Federated Learning"])

@router.get("/status")
async def get_fl_status() -> Dict[str, Any]:
    """Get FL system status"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    
    return await app_state.fl_engine.get_current_metrics()

@router.post("/start")
async def start_fl_training(rounds: int = 50) -> Dict[str, Any]:
    """Start FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    
    await app_state.fl_engine.start_training(rounds)
    return {"message": "FL training started", "rounds": rounds}

@router.post("/stop")
async def stop_fl_training() -> Dict[str, Any]:
    """Stop FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    
    app_state.fl_engine.stop_training()
    return {"message": "FL training stopped"}

@router.get("/strategies")
async def get_fl_strategies() -> Dict[str, Any]:
    """Get available FL strategies"""
    return {
        "strategies": [
            {
                "name": "FedAvg",
                "description": "Federated Averaging - Standard FL algorithm",
                "suitable_for": ["IID data", "Balanced clients"],
                "performance": {"convergence": 0.85, "communication": 0.90}
            },
            {
                "name": "FedProx", 
                "description": "Federated Proximal - Handles heterogeneous data",
                "suitable_for": ["Non-IID data", "System heterogeneity"],
                "performance": {"convergence": 0.88, "communication": 0.85}
            }
        ],
        "current_strategy": app_state.fl_engine.current_strategy if app_state.fl_engine else "FedAvg"
    }

@router.post("/strategy/{strategy_name}")
async def set_fl_strategy(strategy_name: str) -> Dict[str, Any]:
    """Set FL strategy"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    
    try:
        app_state.fl_engine.set_strategy(strategy_name)
        return {"message": f"Strategy set to {strategy_name}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
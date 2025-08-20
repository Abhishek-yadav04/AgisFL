"""Federated Learning API Endpoints (Upgraded)"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Dict, Any, List
import structlog

from ..main import app_state
from ..security.auth import get_current_user  # <-- add authentication
from ..schemas.fl import StrategyConfig, TrainingStatus  # <-- pydantic schemas

logger = structlog.get_logger()
router = APIRouter(prefix="/api/fl", tags=["Federated Learning"])

# ---------------------------
# Helpers
# ---------------------------
def _check_fl_engine():
    """Ensure FL engine exists before API calls"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    return app_state.fl_engine

# ---------------------------
# Endpoints
# ---------------------------
@router.get("/status", response_model=TrainingStatus)
async def get_fl_status(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Get FL system status (metrics, rounds, clients)."""
    engine = _check_fl_engine()
    try:
        metrics = await engine.get_current_metrics()
        logger.info("FL status fetched", user=user["username"], metrics=metrics)
        return metrics
    except Exception as e:
        logger.error("Failed to fetch FL status", error=str(e))
        raise HTTPException(status_code=500, detail="Error fetching FL status")

@router.post("/start")
async def start_fl_training(
    rounds: int = Query(50, ge=1, le=1000, description="Number of FL rounds"),
    user: Dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Start FL training with given rounds."""
    engine = _check_fl_engine()
    try:
        await engine.start_training(rounds)
        logger.info("FL training started", user=user["username"], rounds=rounds)
        return {"message": "FL training started", "rounds": rounds}
    except Exception as e:
        logger.error("Failed to start FL training", error=str(e))
        raise HTTPException(status_code=500, detail="Error starting training")

@router.post("/stop")
async def stop_fl_training(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Stop ongoing FL training."""
    engine = _check_fl_engine()
    try:
        engine.stop_training()
        logger.info("FL training stopped", user=user["username"])
        return {"message": "FL training stopped"}
    except Exception as e:
        logger.error("Failed to stop FL training", error=str(e))
        raise HTTPException(status_code=500, detail="Error stopping training")

@router.get("/strategies", response_model=Dict[str, Any])
async def get_fl_strategies(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Get available FL strategies and current one."""
    engine = _check_fl_engine()
    return {
        "strategies": engine.get_available_strategies(),
        "current_strategy": engine.current_strategy or "FedAvg"
    }

@router.post("/strategy/{strategy_name}")
async def set_fl_strategy(strategy_name: str, user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Set FL training strategy."""
    engine = _check_fl_engine()
    try:
        engine.set_strategy(strategy_name)
        logger.info("FL strategy updated", user=user["username"], strategy=strategy_name)
        return {"message": f"Strategy set to {strategy_name}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to set strategy", error=str(e))
        raise HTTPException(status_code=500, detail="Error updating strategy")

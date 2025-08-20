"""
Federated Learning API Endpoints — AgisFL (upgraded)
- JWT/RBAC protected
- Structured logging via structlog
- WebSocket: /api/fl/ws/training for real-time progress
"""

from fastapi import APIRouter, HTTPException, Query, Depends, WebSocket, WebSocketDisconnect
from typing import Dict, Any, Set
import structlog

from ..app_state import app_state  # keep your existing pattern if different
from ..security.auth import get_current_user, require_role
from ..schemas.fl import TrainingStatus, StrategyListResponse, StrategyInfo
from ..services.ws_manager import ws_manager

logger = structlog.get_logger()
router = APIRouter(prefix="/api/fl", tags=["Federated Learning"])


def _engine():
    engine = getattr(app_state, "fl_engine", None)
    if not engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    return engine


@router.get("/status", response_model=TrainingStatus)
async def get_fl_status(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Return FL status/metrics."""
    engine = _engine()
    try:
        metrics = await engine.get_current_metrics()
        logger.info("fl.status", user=user.get("username"), **{k: v for k, v in metrics.items() if k in ("status","round","total_rounds","accuracy","loss")})
        return TrainingStatus(**metrics)
    except Exception as e:
        logger.exception("fl.status.error", error=str(e))
        raise HTTPException(status_code=500, detail="Error fetching FL status")


@router.post("/start")
async def start_fl_training(
    rounds: int = Query(50, ge=1, le=10000, description="Number of FL rounds"),
    user: Dict = Depends(require_role("admin")),
) -> Dict[str, Any]:
    """Start FL training (admin only)."""
    engine = _engine()
    try:
        await engine.start_training(rounds)
        logger.info("fl.start", user=user.get("username"), rounds=rounds)
        return {"message": "FL training started", "rounds": rounds}
    except Exception as e:
        logger.exception("fl.start.error", error=str(e))
        raise HTTPException(status_code=500, detail="Error starting training")


@router.post("/stop")
async def stop_fl_training(user: Dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Stop ongoing FL training (admin only)."""
    engine = _engine()
    try:
        engine.stop_training()
        logger.info("fl.stop", user=user.get("username"))
        return {"message": "FL training stopped"}
    except Exception as e:
        logger.exception("fl.stop.error", error=str(e))
        raise HTTPException(status_code=500, detail="Error stopping training")


@router.get("/strategies", response_model=StrategyListResponse)
async def get_fl_strategies(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    """Get available strategies + current."""
    engine = _engine()
    try:
        if hasattr(engine, "get_available_strategies"):
            strategies = engine.get_available_strategies()
        else:
            strategies = [
                {
                    "name": "FedAvg",
                    "description": "Federated Averaging - standard FL algorithm",
                    "suitable_for": ["IID data", "Balanced clients"],
                    "performance": {"convergence": 0.85, "communication": 0.90},
                },
                {
                    "name": "FedProx",
                    "description": "Federated Proximal - handles heterogeneous data",
                    "suitable_for": ["Non-IID data", "System heterogeneity"],
                    "performance": {"convergence": 0.88, "communication": 0.85},
                },
            ]
        current = getattr(engine, "current_strategy", None) or "FedAvg"
        return StrategyListResponse(
            strategies=[StrategyInfo(**s) for s in strategies],
            current_strategy=current,
        )
    except Exception as e:
        logger.exception("fl.strategies.error", error=str(e))
        raise HTTPException(status_code=500, detail="Error fetching strategies")


@router.post("/strategy/{strategy_name}")
async def set_fl_strategy(strategy_name: str, user: Dict = Depends(require_role("admin"))) -> Dict[str, Any]:
    """Set strategy (admin only)."""
    engine = _engine()
    try:
        if hasattr(engine, "get_available_strategies"):
            names = {s["name"] for s in engine.get_available_strategies()}
            if strategy_name not in names:
                raise HTTPException(status_code=400, detail=f"Unknown strategy '{strategy_name}'")
        engine.set_strategy(strategy_name)
        logger.info("fl.strategy.set", user=user.get("username"), strategy=strategy_name)
        return {"message": f"Strategy set to {strategy_name}"}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("fl.strategy.error", error=str(e))
        raise HTTPException(status_code=500, detail="Error updating strategy")


# ---------------------------
# WebSocket: live training progress
# ---------------------------
@router.websocket("/ws/training")
async def training_ws(ws: WebSocket):
    """
    Live progress stream.
    Your engine should call: await ws_manager.broadcast({...}) during training.
    """
    await ws_manager.connect(ws)
    try:
        while True:
            # Keep-alive: ignore messages from client; this is broadcast-only.
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
    except Exception:
        ws_manager.disconnect(ws)

"""Federated Learning API endpoints (Upgraded In-File Version)"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.security.api_key import APIKeyHeader
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import structlog

from ..main import app_state

logger = structlog.get_logger()
router = APIRouter(prefix="/api/fl", tags=["Federated Learning"])

# ------------------ AUTH ------------------
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)
VALID_KEYS = {"admin-key": "admin", "user-key": "user"}  # TODO: replace with DB later

async def get_current_user(api_key: str = Depends(API_KEY_HEADER)) -> str:
    if api_key not in VALID_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    return VALID_KEYS[api_key]

# ------------------ SCHEMAS ------------------
class TrainingRequest(BaseModel):
    rounds: int = Field(50, gt=0, le=1000, description="Number of FL training rounds")

class StrategyResponse(BaseModel):
    name: str
    description: str
    suitable_for: List[str]
    performance: Dict[str, float]

class StatusResponse(BaseModel):
    current_round: int
    total_rounds: int
    metrics: Dict[str, Any]

# ------------------ WEBSOCKET MANAGER ------------------
class WSConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WS connected", total=len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WS disconnected", total=len(self.active_connections))

    async def broadcast(self, message: Dict[str, Any]):
        for conn in list(self.active_connections):
            try:
                await conn.send_json(message)
            except Exception:
                self.disconnect(conn)

ws_manager = WSConnectionManager()

@router.websocket("/ws/training")
async def training_progress_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep alive
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# ------------------ ROUTES ------------------
@router.get("/status", response_model=StatusResponse)
async def get_fl_status(user: str = Depends(get_current_user)):
    """Get FL system status"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    return await app_state.fl_engine.get_current_metrics()

@router.post("/start")
async def start_fl_training(req: TrainingRequest, user: str = Depends(get_current_user)):
    """Start FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    await app_state.fl_engine.start_training(req.rounds, callback=ws_manager.broadcast)
    logger.info("Training started", rounds=req.rounds, user=user)
    return {"message": "FL training started", "rounds": req.rounds}

@router.post("/stop")
async def stop_fl_training(user: str = Depends(get_current_user)):
    """Stop FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    app_state.fl_engine.stop_training()
    await ws_manager.broadcast({"event": "stopped"})
    logger.info("Training stopped", user=user)
    return {"message": "FL training stopped"}

@router.post("/pause")
async def pause_fl_training(user: str = Depends(get_current_user)):
    """Pause FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    app_state.fl_engine.pause_training()
    await ws_manager.broadcast({"event": "paused"})
    logger.info("Training paused", user=user)
    return {"message": "FL training paused"}

@router.post("/resume")
async def resume_fl_training(user: str = Depends(get_current_user)):
    """Resume FL training"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    app_state.fl_engine.resume_training()
    await ws_manager.broadcast({"event": "resumed"})
    logger.info("Training resumed", user=user)
    return {"message": "FL training resumed"}

@router.get("/strategies")
async def get_fl_strategies(user: str = Depends(get_current_user)) -> Dict[str, Any]:
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
async def set_fl_strategy(strategy_name: str, user: str = Depends(get_current_user)):
    """Set FL strategy"""
    if not app_state.fl_engine:
        raise HTTPException(status_code=503, detail="FL engine not available")
    try:
        app_state.fl_engine.set_strategy(strategy_name)
        logger.info("Strategy changed", strategy=strategy_name, user=user)
        await ws_manager.broadcast({"event": "strategy_changed", "strategy": strategy_name})
        return {"message": f"Strategy set to {strategy_name}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

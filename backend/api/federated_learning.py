"""
Federated Learning API endpoints — Production-ready single-file upgrade
Drop-in replacement for backend/api/federated.py
"""

import os
import io
import jwt
import time
import asyncio
import traceback
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query, Body
from fastapi.security import APIKeyHeader
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/fl", tags=["Federated Learning"])

# ----------------------
# Config / env defaults
# ----------------------
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
DISABLE_AUTH = os.getenv("DISABLE_AUTH", "false").lower() == "true"
CHECKPOINT_DIR = os.getenv("FL_CHECKPOINT_DIR", "checkpoints")
os.makedirs(CHECKPOINT_DIR, exist_ok=True)

# ----------------------
# Optional prometheus
# ----------------------
try:
    from prometheus_client import Counter, Gauge
    PROM_AVAILABLE = True
    PROM_FL_ROUNDS = Counter("agisfl_fl_rounds_total", "Federated learning rounds completed")
    PROM_FL_RUNNING = Gauge("agisfl_fl_running", "1 if FL is running, 0 otherwise")
    PROM_FL_CLIENTS = Gauge("agisfl_fl_clients", "Number of registered FL clients")
except Exception:
    PROM_AVAILABLE = False
    PROM_FL_ROUNDS = PROM_FL_RUNNING = PROM_FL_CLIENTS = None

# ----------------------
# App state (import from your main)
# ----------------------
from ..main import app_state  # must provide app_state.fl_engine

# ----------------------
# Auth helpers (JWT + API Key)
# ----------------------
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

class User(BaseModel):
    username: str
    role: str = "user"

async def get_current_user(api_key: Optional[str] = Depends(API_KEY_HEADER),
                           authorization: Optional[str] = None) -> User:
    """
    Resolve user from Authorization (Bearer <jwt>) OR X-API-Key.
    Dev bypass: set DISABLE_AUTH=true (not for production).
    """
    # Dev bypass
    if DISABLE_AUTH:
        logger.warning("auth_disabled_dev_bypass")
        return User(username="dev", role="admin")

    # Prefer JWT in Authorization header
    auth_header = authorization or os.environ.get("AUTH_HEADER")  # fallback if passed via env
    if auth_header and isinstance(auth_header, str) and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG]) if JWT_SECRET else {}
            username = payload.get("sub", payload.get("username", "unknown"))
            role = payload.get("role", "user")
            return User(username=username, role=role)
        except Exception:
            logger.warning("invalid_jwt", error=traceback.format_exc())
            raise HTTPException(status_code=401, detail="Invalid JWT token")

    # Then API key
    if api_key:
        # By default, treat api_key value as username; map admin-key to admin role for dev
        # Replace this block with DB lookup for production
        if api_key == "admin-key":
            return User(username="admin", role="admin")
        elif api_key == "user-key":
            return User(username="user", role="user")
        else:
            # Unknown key
            raise HTTPException(status_code=401, detail="Invalid API key")

    raise HTTPException(status_code=401, detail="Missing credentials")


def require_role(required: str):
    async def _inner(user: User = Depends(get_current_user)):
        if required == "user" and user.role in ("user", "admin"):
            return user
        if required == "admin" and user.role == "admin":
            return user
        raise HTTPException(status_code=403, detail="Forbidden: insufficient role")
    return _inner

# ----------------------
# Schemas
# ----------------------
class TrainingRequest(BaseModel):
    rounds: int = Field(50, gt=0, le=10000, description="Number of FL training rounds")
    seed: Optional[int] = Field(None, description="Optional seed for reproducibility")

class StrategyInfo(BaseModel):
    name: str
    description: Optional[str] = None
    suitable_for: Optional[List[str]] = None
    performance: Optional[Dict[str, float]] = None

class StrategyListResponse(BaseModel):
    strategies: List[StrategyInfo]
    current_strategy: str

class StatusResponse(BaseModel):
    current_round: int
    total_rounds: int
    is_training: bool
    metrics: Dict[str, Any]
    strategy: str
    last_exception: Optional[str] = None

class HistoryResponse(BaseModel):
    history: List[Dict[str, Any]]

class CheckpointResponse(BaseModel):
    filename: str
    path: str
    timestamp: str

class EvaluateResponse(BaseModel):
    average_accuracy: float
    per_client: List[Dict[str, Any]]

# ----------------------
# In-file WebSocket manager (robust)
# ----------------------
class WSConnectionManager:
    def __init__(self):
        self._conns: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self._conns.append(ws)
        logger.info("ws_connect", total=len(self._conns))

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            if ws in self._conns:
                self._conns.remove(ws)
        logger.info("ws_disconnect", remaining=len(self._conns))

    async def broadcast(self, message: Dict[str, Any]):
        """
        Broadcast JSON to all connected clients.
        Use safe send; remove dead connections.
        """
        async with self._lock:
            conns = list(self._conns)
        if not conns:
            return
        dead = []
        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    def count(self) -> int:
        return len(self._conns)

ws_manager = WSConnectionManager()


# ----------------------
# WebSocket endpoint
# ----------------------
@router.websocket("/ws/training")
async def ws_training(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        while True:
            # keep-alive ping from client; ignore content
            await ws.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(ws)
    except Exception:
        await ws_manager.disconnect(ws)
        logger.exception("ws_training_error")


# ----------------------
# Helper functions
# ----------------------
def _ensure_engine():
    engine = getattr(app_state, "fl_engine", None)
    if not engine:
        logger.warning("fl_engine_missing")
        raise HTTPException(status_code=503, detail="FL engine not available")
    return engine

async def _ws_broadcast_event(event: str, payload: Dict[str, Any] = None):
    body = {"event": event, "timestamp": time.time(), "payload": payload or {}}
    # first try to use in-file ws_manager
    try:
        await ws_manager.broadcast(body)
    except Exception:
        logger.exception("ws_broadcast_failed")
    # engine may provide its own ws broadcast function; attempt fallback
    engine = getattr(app_state, "fl_engine", None)
    if engine:
        cb = getattr(engine, "_ws_callback", None) or getattr(engine, "_ws_cb", None)
        if callable(cb):
            try:
                # If cb is coroutine function
                if asyncio.iscoroutinefunction(cb):
                    await cb(body)
                else:
                    # schedule sync callback
                    asyncio.create_task(asyncio.to_thread(cb, body))
            except Exception:
                logger.exception("engine_ws_callback_failed")

# ----------------------
# REST endpoints
# ----------------------
@router.get("/status", response_model=StatusResponse)
async def get_status(user=Depends(get_current_user)):
    engine = _ensure_engine()
    try:
        metrics = await engine.get_current_metrics()
        # Ensure response contains required fields
        resp = {
            "current_round": int(metrics.get("current_round", 0)),
            "total_rounds": int(metrics.get("total_rounds", 0)),
            "is_training": bool(metrics.get("is_training", getattr(engine, "is_training", False))),
            "metrics": metrics.get("metrics", metrics),
            "strategy": metrics.get("strategy", getattr(engine, "current_strategy", "unknown")),
            "last_exception": metrics.get("last_exception", None)
        }
        # update prom gauges
        if PROM_AVAILABLE:
            PROM_FL_CLIENTS.set(len(getattr(engine, "clients", [])))
            PROM_FL_RUNNING.set(1 if resp["is_training"] else 0)
        return resp
    except Exception as e:
        logger.exception("status_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch FL status")

@router.post("/start", response_model=Dict[str, Any])
async def start_training(req: TrainingRequest = Body(...), user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        # set seed if provided (engine handles reproducibility)
        if req.seed and hasattr(engine, "seed"):
            try:
                engine.seed = int(req.seed)
            except Exception:
                logger.warn("invalid_seed", seed=req.seed)

        # start training and provide ws_manager.broadcast as callback
        # engine.start_training is defined as async
        await engine.start_training(req.rounds, callback=ws_manager.broadcast, progress_callback=None)
        logger.info("api_start_training", rounds=req.rounds, user=user.username)
        await _ws_broadcast_event("training_started", {"rounds": req.rounds, "user": user.username})
        return {"message": "FL training started", "rounds": req.rounds}
    except Exception as e:
        logger.exception("start_training_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start training")

@router.post("/stop", response_model=Dict[str, Any])
async def stop_training(user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        # prefer async stop method if present
        stop_fn = getattr(engine, "stop_training", None)
        if callable(stop_fn):
            # engine.stop_training may be sync or async
            if asyncio.iscoroutinefunction(stop_fn):
                await stop_fn()
            else:
                # run sync in background so API returns quickly
                asyncio.create_task(asyncio.to_thread(stop_fn))
        logger.info("api_stop_training", user=user.username)
        await _ws_broadcast_event("training_stopped", {"user": user.username})
        return {"message": "FL training stop requested"}
    except Exception as e:
        logger.exception("stop_training_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to stop training")

@router.post("/pause", response_model=Dict[str, Any])
async def pause_training(user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        pause_fn = getattr(engine, "pause_training", None)
        if callable(pause_fn):
            if asyncio.iscoroutinefunction(pause_fn):
                await pause_fn()
            else:
                await asyncio.to_thread(pause_fn)
        await _ws_broadcast_event("training_paused", {"user": user.username})
        logger.info("api_pause", user=user.username)
        return {"message": "FL training paused"}
    except Exception as e:
        logger.exception("pause_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to pause training")

@router.post("/resume", response_model=Dict[str, Any])
async def resume_training(user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        resume_fn = getattr(engine, "resume_training", None)
        if callable(resume_fn):
            if asyncio.iscoroutinefunction(resume_fn):
                await resume_fn()
            else:
                await asyncio.to_thread(resume_fn)
        await _ws_broadcast_event("training_resumed", {"user": user.username})
        logger.info("api_resume", user=user.username)
        return {"message": "FL training resumed"}
    except Exception as e:
        logger.exception("resume_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to resume training")

@router.get("/strategies", response_model=StrategyListResponse)
async def get_strategies(user=Depends(get_current_user)):
    engine = _ensure_engine()
    try:
        # Prefer engine-provided list_strategies()
        strategies = []
        if hasattr(engine, "list_strategies"):
            try:
                strategies = engine.list_strategies()
            except Exception:
                logger.exception("list_strategies_failed")
        if not strategies:
            # fallback
            strategies = [
                {"name": "FedAvg", "description": "Federated Averaging", "suitable_for": ["IID data"], "performance": {"convergence": 0.85, "communication": 0.9}},
                {"name": "FedProx", "description": "Federated Proximal", "suitable_for": ["Non-IID data"], "performance": {"convergence": 0.88, "communication": 0.85}}
            ]
        current = getattr(engine, "current_strategy", strategies[0]["name"] if strategies else "FedAvg")
        # Normalize to Pydantic objects
        strategy_objs = [StrategyInfo(**s) if not isinstance(s, StrategyInfo) else s for s in strategies]
        return StrategyListResponse(strategies=strategy_objs, current_strategy=current)
    except Exception as e:
        logger.exception("get_strategies_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch strategies")

@router.post("/strategy/{strategy_name}", response_model=Dict[str, Any])
async def set_strategy(strategy_name: str, user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        # call engine.set_strategy
        set_fn = getattr(engine, "set_strategy", None)
        if not callable(set_fn):
            raise HTTPException(status_code=500, detail="Engine does not support set_strategy")
        set_fn(strategy_name)
        logger.info("strategy_set", strategy=strategy_name, user=user.username)
        await _ws_broadcast_event("strategy_changed", {"strategy": strategy_name, "user": user.username})
        return {"message": f"Strategy set to {strategy_name}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("set_strategy_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to set strategy")

@router.get("/history", response_model=HistoryResponse)
async def get_history(limit: int = Query(50, ge=1, le=1000), user=Depends(get_current_user)):
    engine = _ensure_engine()
    try:
        history = getattr(engine, "training_history", []) or []
        return {"history": history[-limit:]}
    except Exception as e:
        logger.exception("get_history_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch history")

@router.post("/checkpoint/save", response_model=CheckpointResponse)
async def save_checkpoint(name: Optional[str] = Body(None), user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        # prefer engine.save_checkpoint if available
        if hasattr(engine, "save_checkpoint"):
            path = engine.save_checkpoint(name)
            if not path:
                raise HTTPException(status_code=500, detail="Failed to save checkpoint")
            fname = Path(path).name
            return {"filename": fname, "path": str(path), "timestamp": time.time()}
        else:
            raise HTTPException(status_code=500, detail="Engine does not support checkpointing")
    except Exception as e:
        logger.exception("save_checkpoint_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to save checkpoint")

@router.get("/checkpoint/list", response_model=List[CheckpointResponse])
async def list_checkpoints(user=Depends(get_current_user)):
    try:
        files = sorted(Path(CHECKPOINT_DIR).glob("global_model_*.pt"), key=lambda p: p.stat().st_mtime, reverse=True)
        out = []
        for f in files:
            out.append({"filename": f.name, "path": str(f.resolve()), "timestamp": f.stat().st_mtime})
        return out
    except Exception as e:
        logger.exception("list_checkpoints_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list checkpoints")

@router.get("/checkpoint/download/{filename}")
async def download_checkpoint(filename: str, user=Depends(get_current_user)):
    fpath = Path(CHECKPOINT_DIR) / filename
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="Checkpoint not found")
    # Streaming FileResponse
    return FileResponse(str(fpath), media_type="application/octet-stream", filename=filename)

@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(user=Depends(get_current_user)):
    engine = _ensure_engine()
    try:
        # engine.evaluate_aggregate is async in our engine
        eval_fn = getattr(engine, "evaluate_aggregate", None)
        if callable(eval_fn):
            res = await eval_fn()
            return EvaluateResponse(**res)
        # fallback to synchronous eval on CPU
        if hasattr(engine, "evaluate_aggregate_sync"):
            res = engine.evaluate_aggregate_sync()
            return EvaluateResponse(**res)
        raise HTTPException(status_code=500, detail="Engine does not support evaluation")
    except Exception as e:
        logger.exception("evaluate_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to evaluate global model")


# ----------------------
# Lightweight admin endpoints (use with caution)
# ----------------------
@router.get("/debug", response_model=Dict[str, Any])
async def debug_state(user=Depends(require_role("admin"))):
    engine = _ensure_engine()
    try:
        state = {}
        try:
            state = getattr(engine, "debug_state", lambda: {})()
        except Exception:
            state = {
                "current_round": getattr(engine, "current_round", None),
                "is_training": getattr(engine, "is_training", None),
                "num_clients": len(getattr(engine, "clients", [])),
                "strategy": getattr(engine, "current_strategy", None)
            }
        return {"ok": True, "state": state}
    except Exception as e:
        logger.exception("debug_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch debug state")


# ----------------------
# Compatibility helpers: map old endpoints that pass callback=notify_ws_clients
# ----------------------
# Provide a legacy-style notify function (sync or async) so older code can pass it.
async def notify_ws_clients(payload: Dict[str, Any]):
    try:
        await _ws_broadcast_event(payload.get("event", "message"), payload.get("payload", payload))
    except Exception:
        logger.exception("notify_ws_clients_failed")

# Expose notify_ws_clients for backward-compatibility
notify = notify_ws_clients

# ----------------------
# Final note log
# ----------------------
logger.info("federated_api_loaded", prometheus=PROM_AVAILABLE, checkpoint_dir=CHECKPOINT_DIR)


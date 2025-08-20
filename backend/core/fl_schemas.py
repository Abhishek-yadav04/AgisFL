# backend/core/fl_schema.py

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime

# ✅ Existing API Schemas
class FLStatusResponse(BaseModel):
    rounds_completed: int
    total_rounds: int
    accuracy: float
    loss: float
    active_clients: int

class FLStartRequest(BaseModel):
    rounds: int = Field(default=50, ge=1, le=1000)

class FLStartResponse(BaseModel):
    message: str
    rounds: int

class FLStopResponse(BaseModel):
    message: str

class FLStrategyInfo(BaseModel):
    name: str
    description: str
    suitable_for: list[str]
    performance: Dict[str, float]

class FLStrategyResponse(BaseModel):
    strategies: list[FLStrategyInfo]
    current_strategy: str

class FLSetStrategyResponse(BaseModel):
    message: str


# ✅ New: WebSocket + Training Event Schemas
class FLClientUpdate(BaseModel):
    client_id: str
    round: int
    metrics: Dict[str, Any]
    timestamp: datetime

class FLGlobalModel(BaseModel):
    round: int
    accuracy: float
    loss: float
    aggregated_at: datetime

class FLTrainingEvent(BaseModel):
    event: str   # e.g., "round_start", "round_end", "model_aggregated"
    payload: Dict[str, Any]
    timestamp: datetime
    sender: Optional[str] = None

class WebSocketMessage(BaseModel):
    type: str    # "client_update", "global_update", "event"
    data: Dict[str, Any]

"""WebSocket connection management"""

import asyncio
import json
from typing import Set, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        self.connection_metadata[websocket] = {
            "connected_at": datetime.now(timezone.utc),
            "last_activity": datetime.now(timezone.utc)
        }
        logger.info("WebSocket connected", total_connections=len(self.active_connections))
    
    def disconnect(self, websocket: WebSocket):
        """Disconnect WebSocket"""
        self.active_connections.discard(websocket)
        self.connection_metadata.pop(websocket, None)
        logger.info("WebSocket disconnected", remaining_connections=len(self.active_connections))
    
    async def send_json(self, websocket: WebSocket, data: Dict[str, Any]):
        """Send JSON data to specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(data))
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["last_activity"] = datetime.now(timezone.utc)
        except Exception as e:
            logger.error("Failed to send WebSocket message", error=str(e))
            self.disconnect(websocket)
    
    async def broadcast(self, data: Dict[str, Any]):
        """Broadcast data to all connected WebSockets"""
        if not self.active_connections:
            return
        
        message = json.dumps(data)
        disconnected = set()
        
        for websocket in self.active_connections.copy():
            try:
                await websocket.send_text(message)
            except Exception:
                disconnected.add(websocket)
        
        for websocket in disconnected:
            self.disconnect(websocket)

    class WSManager:
        def __init__(self) -> None:
            self.active: Set[WebSocket] = set()
            self._lock = asyncio.Lock()


        async def connect(self, ws: WebSocket):
            await ws.accept()
        async with self._lock:
            self.active.add(ws)


        def disconnect(self, ws: WebSocket):
            self.active.discard(ws)


        async def broadcast(self, message: dict):
            dead = []
            for ws in list(self.active):
        try:
            await ws.send_json(message)
        except Exception:
            dead.append(ws)
        for ws in dead:
            self.disconnect(ws)
            
        ws_manager = WSManager()
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)

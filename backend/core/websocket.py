"""WebSocket connection management"""

import asyncio
import json
from typing import Set, Dict, Any
from fastapi import WebSocket
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()  # ensure thread safety
    
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
            self.connection_metadata[websocket] = {
                "connected_at": datetime.now(timezone.utc),
                "last_activity": datetime.now(timezone.utc)
            }
        logger.info("WebSocket connected", total_connections=len(self.active_connections))
    
    async def disconnect(self, websocket: WebSocket):
        """Disconnect WebSocket"""
        async with self._lock:
            self.active_connections.discard(websocket)
            self.connection_metadata.pop(websocket, None)
        logger.info("WebSocket disconnected", remaining_connections=len(self.active_connections))
    
    async def send_json(self, websocket: WebSocket, data: Dict[str, Any]):
        """Send JSON data to a specific WebSocket"""
        try:
            await websocket.send_text(json.dumps(data))
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["last_activity"] = datetime.now(timezone.utc)
        except Exception as e:
            logger.error("Failed to send WebSocket message", error=str(e))
            await self.disconnect(websocket)
    
    async def broadcast(self, data: Dict[str, Any]):
        """Broadcast data to all connected WebSockets"""
        if not self.active_connections:
            return
        
        message = json.dumps(data)
        dead = []
        
        for websocket in list(self.active_connections):
            try:
                await websocket.send_text(message)
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["last_activity"] = datetime.now(timezone.utc)
            except Exception:
                dead.append(websocket)
        
        for ws in dead:
            await self.disconnect(ws)

    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
    

# Create a global instance for use in routes
ws_manager = WebSocketManager()

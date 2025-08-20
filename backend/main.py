#!/usr/bin/env python3
"""
AgisFL Enterprise - Production-Ready Federated Learning IDS
World-class implementation with enterprise security and scalability
"""

import asyncio
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import structlog

# Import core modules
from core.config import settings
from core.database import DatabaseManager
from core.auth import AuthManager
from core.websocket import WebSocketManager
from core.fl_engine import FederatedLearningEngine
from core.ids_engine import IntrusionDetectionEngine
from core.security import SecurityEngine
from core.monitoring import MetricsCollector

# Import API routers
from api.dashboard import router as dashboard_router
from api.federated_learning import router as fl_router
from api.security import router as security_router
from api.network import router as network_router
from api.datasets import router as datasets_router
from api.integrations import router as integrations_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
REQUEST_COUNT = Counter('agisfl_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('agisfl_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('agisfl_active_connections', 'Active WebSocket connections')
FL_ROUNDS = Counter('agisfl_fl_rounds_total', 'Total FL rounds completed')
THREATS_DETECTED = Counter('agisfl_threats_detected_total', 'Total threats detected')

# Application state
class ApplicationState:
    def __init__(self):
        self.db_manager: Optional[DatabaseManager] = None
        self.auth_manager: Optional[AuthManager] = None
        self.websocket_manager: Optional[WebSocketManager] = None
        self.fl_engine: Optional[FederatedLearningEngine] = None
        self.ids_engine: Optional[IntrusionDetectionEngine] = None
        self.security_engine: Optional[SecurityEngine] = None
        self.metrics_collector: Optional[MetricsCollector] = None
        self.start_time: float = time.time()
        self.is_ready: bool = False

app_state = ApplicationState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("🚀 Starting AgisFL Enterprise Platform")
    
    try:
        # Initialize core components
        app_state.db_manager = DatabaseManager()
        await app_state.db_manager.initialize()
        
        app_state.auth_manager = AuthManager(settings.jwt_secret)
        app_state.websocket_manager = WebSocketManager()
        
        # Initialize FL engine with advanced algorithms
        app_state.fl_engine = FederatedLearningEngine()
        await app_state.fl_engine.initialize()
        
        # Initialize IDS engine
        app_state.ids_engine = IntrusionDetectionEngine()
        await app_state.ids_engine.initialize()
        
        # Initialize security engine
        app_state.security_engine = SecurityEngine()
        await app_state.security_engine.start()
        
        # Initialize metrics collector
        app_state.metrics_collector = MetricsCollector()
        app_state.metrics_collector.start()
        
        app_state.is_ready = True
        logger.info("✅ All services initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error("❌ Startup failed", error=str(e))
        raise
    finally:
        logger.info("🛑 Shutting down services")
        if app_state.security_engine:
            await app_state.security_engine.stop()
        if app_state.metrics_collector:
            app_state.metrics_collector.stop()

# Create FastAPI application
app = FastAPI(
    title="AgisFL Enterprise - Federated Learning IDS",
    description="World-class Federated Learning Intrusion Detection System",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Request metrics middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_DURATION.observe(duration)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response

# Mount static files
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API routers
app.include_router(dashboard_router)
app.include_router(fl_router)
app.include_router(security_router)
app.include_router(network_router)
app.include_router(datasets_router)
app.include_router(integrations_router)

@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint"""
    return {
        "name": "AgisFL Enterprise",
        "version": "4.0.0",
        "description": "World-class Federated Learning Intrusion Detection System",
        "status": "operational" if app_state.is_ready else "initializing",
        "uptime": time.time() - app_state.start_time,
        "endpoints": {
            "dashboard": "/app",
            "api_docs": "/docs",
            "health": "/health",
            "metrics": "/metrics"
        }
    }

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Comprehensive health check"""
    health_status = {
        "status": "healthy" if app_state.is_ready else "starting",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": time.time() - app_state.start_time,
        "services": {
            "database": app_state.db_manager is not None,
            "authentication": app_state.auth_manager is not None,
            "websocket": app_state.websocket_manager is not None,
            "federated_learning": app_state.fl_engine is not None and app_state.fl_engine.is_ready,
            "intrusion_detection": app_state.ids_engine is not None and app_state.ids_engine.is_running,
            "security_engine": app_state.security_engine is not None,
            "metrics_collector": app_state.metrics_collector is not None
        }
    }
    
    if not app_state.is_ready:
        return JSONResponse(content=health_status, status_code=503)
    
    return health_status

@app.get("/healthz")
async def liveness_probe():
    """Kubernetes liveness probe"""
    return {"status": "ok"}

@app.get("/readyz")
async def readiness_probe():
    """Kubernetes readiness probe"""
    if app_state.is_ready:
        return {"status": "ready"}
    return JSONResponse(content={"status": "not ready"}, status_code=503)

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.get("/app")
async def serve_frontend():
    """Serve frontend application"""
    # In production, this would serve the built React app
    # For development, redirect to Vite dev server
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>AgisFL Enterprise</title>
        <meta http-equiv="refresh" content="0; url=http://localhost:5173/app/">
    </head>
    <body>
        <p>Redirecting to frontend...</p>
    </body>
    </html>
    """)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await app_state.websocket_manager.connect(websocket)
    ACTIVE_CONNECTIONS.set(app_state.websocket_manager.get_connection_count())
    
    try:
        while True:
            # Send real-time updates
            if app_state.fl_engine and app_state.fl_engine.is_training:
                fl_metrics = await app_state.fl_engine.get_current_metrics()
                await app_state.websocket_manager.send_json(websocket, {
                    "type": "fl_update",
                    "data": fl_metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            if app_state.ids_engine:
                ids_metrics = await app_state.ids_engine.get_current_metrics()
                await app_state.websocket_manager.send_json(websocket, {
                    "type": "ids_update", 
                    "data": ids_metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
            
            await asyncio.sleep(2)
            
    except WebSocketDisconnect:
        app_state.websocket_manager.disconnect(websocket)
        ACTIVE_CONNECTIONS.set(app_state.websocket_manager.get_connection_count())

if __name__ == "__main__":
    logger.info("Starting AgisFL Enterprise Platform")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info",
        access_log=True
    )
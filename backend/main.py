#!/usr/bin/env python3
"""
AgisFL Enterprise - Production-Ready Federated Learning IDS
Enterprise implementation with full security, scalability, and observability
"""

import asyncio
import logging
import os
import sys
import time
import uuid
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

# Core modules
from core.config import settings
from core.database import DatabaseManager
from core.auth import AuthManager
from core.websocket import WebSocketManager
from core.fl_engine import FederatedLearningEngine
from core.ids_engine import IntrusionDetectionEngine
from core.security import SecurityEngine
from core.monitoring import MetricsCollector

# API routers
from api.dashboard import router as dashboard_router
from api.federated_learning import router as fl_router
from api.security import router as security_router
from api.network import router as network_router
from api.datasets import router as datasets_router
from api.integrations import router as integrations_router

# Structured logging
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
REQUEST_COUNT = Counter("agisfl_requests_total", "Total HTTP requests", ["method", "endpoint", "status"])
REQUEST_DURATION = Histogram("agisfl_request_duration_seconds", "Request duration")
ACTIVE_CONNECTIONS = Gauge("agisfl_active_connections", "Active WebSocket connections")
FL_ROUNDS = Counter("agisfl_fl_rounds_total", "Total FL rounds completed")
THREATS_DETECTED = Counter("agisfl_threats_detected_total", "Total threats detected")
WS_MESSAGES = Counter("agisfl_ws_messages_total", "Total WebSocket messages", ["type"])
DB_QUERIES = Counter("agisfl_db_queries_total", "Total DB queries", ["status"])

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
    logger.info(" Starting AgisFL Enterprise Platform")

    try:
        # Initialize core components
        app_state.db_manager = DatabaseManager()
        await app_state.db_manager.initialize()
        DB_QUERIES.labels(status="init").inc()

        app_state.auth_manager = AuthManager(settings.jwt_secret)
        app_state.websocket_manager = WebSocketManager()

        app_state.fl_engine = FederatedLearningEngine()
        await app_state.fl_engine.initialize()

        app_state.ids_engine = IntrusionDetectionEngine()
        await app_state.ids_engine.initialize()

        app_state.security_engine = SecurityEngine()
        await app_state.security_engine.start()

        app_state.metrics_collector = MetricsCollector()
        app_state.metrics_collector.start()

        app_state.is_ready = True
        logger.info(" All services initialized successfully")

        yield

    except Exception as e:
        logger.error(" Startup failed", error=str(e))
        raise
    finally:
        logger.info(" Shutting down services")
        if app_state.security_engine:
            await app_state.security_engine.stop()
        if app_state.metrics_collector:
            app_state.metrics_collector.stop()
        if app_state.fl_engine:
            await app_state.fl_engine.shutdown()
        if app_state.ids_engine:
            await app_state.ids_engine.shutdown()

# Base path support
root_path = getattr(settings, "base_path", "")

app = FastAPI(
    title="AgisFL Enterprise - Federated Learning IDS",
    description="World-class Federated Learning Intrusion Detection System",
    version="4.0.0",
    docs_url=f"{root_path}/docs",
    redoc_url=f"{root_path}/redoc",
    openapi_url=f"{root_path}/openapi.json",
    lifespan=lifespan,
    root_path=root_path
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
    trace_id = str(uuid.uuid4())
    logger.info("📥 Incoming request", method=request.method, url=str(request.url), trace_id=trace_id)

    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    REQUEST_DURATION.observe(duration)
    REQUEST_COUNT.labels(method=request.method, endpoint=request.url.path, status=response.status_code).inc()

    logger.info(" Request completed", status=response.status_code, duration=duration, trace_id=trace_id)
    return response

# Static files
if os.path.exists("static"):
    app.mount(f"{root_path}/static", StaticFiles(directory="static"), name="static")

# API routers
app.include_router(dashboard_router, prefix=f"{root_path}/api")
app.include_router(fl_router, prefix=f"{root_path}/api")
app.include_router(security_router, prefix=f"{root_path}/api")
app.include_router(network_router, prefix=f"{root_path}/api")
app.include_router(datasets_router, prefix=f"{root_path}/api")
app.include_router(integrations_router, prefix=f"{root_path}/api")

@app.get(f"{root_path}/")
async def root() -> Dict[str, Any]:
    """Root endpoint"""
    return {
        "name": "AgisFL Enterprise",
        "version": "4.0.0",
        "description": "World-class Federated Learning Intrusion Detection System",
        "status": "operational" if app_state.is_ready else "initializing",
        "uptime": time.time() - app_state.start_time,
        "endpoints": {
            "dashboard": f"{root_path}/app",
            "api_docs": f"{root_path}/docs",
            "health": f"{root_path}/health",
            "metrics": f"{root_path}/metrics"
        }
    }

@app.get(f"{root_path}/health")
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
    return JSONResponse(content=health_status, status_code=200 if app_state.is_ready else 503)

@app.get(f"{root_path}/healthz")
async def liveness_probe():
    return {"status": "ok"}

@app.get(f"{root_path}/readyz")
async def readiness_probe():
    return {"status": "ready"} if app_state.is_ready else JSONResponse(content={"status": "not ready"}, status_code=503)

@app.get(f"{root_path}/metrics")
async def metrics():
    return JSONResponse(content=generate_latest().decode("utf-8"), media_type=CONTENT_TYPE_LATEST)

@app.get(f"{root_path}/app")
async def serve_frontend():
    """Serve frontend"""
    if os.path.exists("frontend/dist/index.html"):
        return HTMLResponse(open("frontend/dist/index.html").read())
    return HTMLResponse("""
    <!DOCTYPE html><html><head>
    <title>AgisFL Enterprise</title>
    <meta http-equiv="refresh" content="0; url=http://localhost:5173/app/">
    </head><body><p>Redirecting to frontend...</p></body></html>
    """)

@app.websocket(f"{root_path}/ws")
async def websocket_endpoint(websocket: WebSocket):
    await app_state.websocket_manager.connect(websocket)
    ACTIVE_CONNECTIONS.set(app_state.websocket_manager.get_connection_count())

    try:
        while True:
            if app_state.fl_engine and app_state.fl_engine.is_training:
                fl_metrics = await app_state.fl_engine.get_current_metrics()
                await app_state.websocket_manager.broadcast({
                    "type": "fl_update",
                    "data": fl_metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                WS_MESSAGES.labels(type="fl_update").inc()

            if app_state.ids_engine:
                ids_metrics = await app_state.ids_engine.get_current_metrics()
                await app_state.websocket_manager.broadcast({
                    "type": "ids_update",
                    "data": ids_metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                WS_MESSAGES.labels(type="ids_update").inc()

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

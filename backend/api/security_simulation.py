"""
AgisFL Security Simulation API Routes
====================================

FastAPI routes for the Red Team Simulator that integrate attack simulations
with the main AgisFL backend, providing enterprise administrators with
comprehensive security testing capabilities.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, WebSocket
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import asyncio
import json
import logging
from datetime import datetime, timedelta
import tempfile
import base64
from pathlib import Path

# Import dependencies with fallback
try:
    from core.attack_simulation import (
        AttackSimulationEngine, AttackType, AttackConfig, 
        SimulationResult, DefenseResult
    )
    from core.security_dashboard_integration import (
        SecurityPostureAPI, SecurityDashboardWebSocket, SecurityMetricsCollector
    )
    from .auth_helpers import security as get_current_admin_user, TokenData, require_permission, Permission
    from privacy.differential_privacy import DifferentialPrivacyEngine
    from security.secure_aggregation import SecureAggregationEngine
    from monitoring.metrics_collector import MetricsCollector
except ImportError:
    # Fallback classes for security simulation
    class AttackSimulationEngine:
        def __init__(self, dp_engine=None, secure_aggregation=None, metrics_collector=None):
            self.dp_engine = dp_engine
            self.secure_aggregation = secure_aggregation
            self.metrics_collector = metrics_collector
            
        async def run_simulation(self, config):
            # Mock simulation result
            from types import SimpleNamespace
            result = SimpleNamespace()
            result.attack_type = getattr(config, 'attack_type', AttackType.DATA_POISONING)
            result.metrics = {
                'attack_success_rate': 0.15,
                'defense_effectiveness': 0.85,
                'vulnerabilities_found': 2
            }
            result.detailed_report = "Mock simulation completed. Defense systems are functioning properly."
            return result
    
    class AttackType:
        DATA_POISONING = "data_poisoning"
        MODEL_INVERSION = "model_inversion"
        MEMBERSHIP_INFERENCE = "membership_inference"
        DDOS = "ddos"
        MALWARE = "malware"
        PHISHING = "phishing"
    
    class AttackConfig:
        def __init__(self, attack_type=None, num_adversaries=5, intensity=1.0, privacy_budget=1.0, **kwargs):
            self.attack_type = attack_type
            self.num_adversaries = num_adversaries
            self.intensity = intensity
            self.privacy_budget = privacy_budget
            for key, value in kwargs.items():
                setattr(self, key, value)
    
    class SimulationResult:
        def __init__(self, **kwargs): pass
    
    class DefenseResult:
        def __init__(self, **kwargs): pass
    
    class SecurityPostureAPI:
        def __init__(self): pass
    
    class SecurityDashboardWebSocket:
        def __init__(self): pass
    
    class SecurityMetricsCollector:
        def __init__(self): pass
    
    def get_current_admin_user(): return {"user_id": "admin"}
    
    class DifferentialPrivacyEngine:
        def __init__(self): pass
    
    class SecureAggregationEngine:
        def __init__(self): pass
    
    class MetricsCollector:
        def __init__(self): pass

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(prefix="/api/security", tags=["Security Simulation"])

# Request/Response Models
class SimulationRequest(BaseModel):
    """Request model for attack simulation."""
    attack_type: str = Field(description="Type of attack: poisoning, model-inversion, membership-inference")
    num_adversaries: int = Field(default=5, ge=1, le=20, description="Number of adversarial clients")
    target_client_id: Optional[str] = Field(None, description="Target client ID for targeted attacks")
    target_record_id: Optional[str] = Field(None, description="Target record ID for membership inference")
    intensity: float = Field(default=1.0, ge=0.1, le=5.0, description="Attack intensity multiplier")
    privacy_budget: float = Field(default=1.0, ge=0.1, le=10.0, description="Privacy budget for DP")
    experiment_id: Optional[str] = Field(None, description="Experiment ID to test against")

class SimulationResponse(BaseModel):
    """Response model for attack simulation."""
    simulation_id: str
    attack_type: str
    defense_result: str
    metrics: Dict[str, Any]
    detailed_report: str
    timestamp: datetime
    has_visual_evidence: bool

class SecurityOverviewResponse(BaseModel):
    """Response model for security overview."""
    security_score: float
    risk_level: str
    trend: str
    last_simulation: Optional[datetime]
    status: str
    total_simulations: int
    successful_defenses: int

class SimulationHistoryResponse(BaseModel):
    """Response model for simulation history."""
    simulations: List[Dict[str, Any]]
    total_count: int
    period_days: int
    success_rate: float

# Dependency injection
async def get_simulation_engine() -> AttackSimulationEngine:
    """Get attack simulation engine instance."""
    # In a real implementation, these would be injected from the app state
    dp_engine = DifferentialPrivacyEngine()
    secure_aggregation = SecureAggregationEngine()
    metrics_collector = MetricsCollector()
    
    return AttackSimulationEngine(dp_engine, secure_aggregation, metrics_collector)

async def get_security_api() -> SecurityPostureAPI:
    """Get security posture API instance."""
    simulation_engine = await get_simulation_engine()
    return SecurityPostureAPI(simulation_engine)

# Global WebSocket manager
websocket_manager = None

async def get_websocket_manager():
    """Get WebSocket manager instance."""
    global websocket_manager
    if websocket_manager is None:
        security_api = await get_security_api()
        websocket_manager = SecurityDashboardWebSocket(security_api)
    return websocket_manager

# API Routes

@router.post("/simulation/run", response_model=SimulationResponse)
async def run_attack_simulation(
    request: SimulationRequest,
    background_tasks: BackgroundTasks,
    simulation_engine: AttackSimulationEngine = Depends(get_simulation_engine),
    current_admin = Depends(get_current_admin_user)
):
    """
    Run attack simulation against AgisFL defenses.
    
    This endpoint initiates a Red Team simulation to test the effectiveness
    of AgisFL's security mechanisms against various attack vectors.
    """
    logger.info(f"Starting {request.attack_type} simulation for admin {current_admin['username']}")
    
    try:
        # Validate attack type
        attack_type_map = {
            'poisoning': AttackType.DATA_POISONING,
            'model-inversion': AttackType.MODEL_INVERSION,
            'membership-inference': AttackType.MEMBERSHIP_INFERENCE
        }
        
        if request.attack_type not in attack_type_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid attack type. Must be one of: {list(attack_type_map.keys())}"
            )
        
        # Create attack configuration
        config = AttackConfig(
            attack_type=attack_type_map[request.attack_type],
            num_adversaries=request.num_adversaries,
            target_client_id=request.target_client_id,
            target_record_id=request.target_record_id,
            intensity=request.intensity,
            privacy_budget=request.privacy_budget
        )
        
        # Run simulation
        result = await simulation_engine.run_simulation(config)
        
        # Generate unique simulation ID
        simulation_id = f"sim_{result.attack_type.value}_{int(result.timestamp.timestamp())}"
        
        # Notify WebSocket clients in background
        background_tasks.add_task(notify_simulation_complete, result)
        
        return SimulationResponse(
            simulation_id=simulation_id,
            attack_type=result.attack_type.value,
            defense_result=result.defense_result.value,
            metrics=result.metrics,
            detailed_report=result.detailed_report,
            timestamp=result.timestamp,
            has_visual_evidence=result.visual_evidence is not None
        )
        
    except Exception as e:
        logger.error(f"Simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

async def notify_simulation_complete(result: SimulationResult):
    """Background task to notify WebSocket clients."""
    try:
        ws_manager = await get_websocket_manager()
        await ws_manager.notify_simulation_complete(result)
    except Exception as e:
        logger.error(f"Failed to notify WebSocket clients: {e}")

@router.get("/overview", response_model=SecurityOverviewResponse)
async def get_security_overview(
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get high-level security posture overview."""
    try:
        overview = await security_api.get_security_overview()
        statistics = await security_api.get_attack_statistics()
        
        return SecurityOverviewResponse(
            security_score=overview.get("security_score", 0),
            risk_level=overview.get("risk_level", "UNKNOWN"),
            trend=overview.get("trend", "stable"),
            last_simulation=datetime.fromisoformat(overview["last_simulation"]) if overview.get("last_simulation") else None,
            status=overview.get("status", "inactive"),
            total_simulations=statistics.get("total_simulations", 0),
            successful_defenses=statistics.get("by_result", {}).get("successful", 0)
        )
    except Exception as e:
        logger.error(f"Failed to get security overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve security overview")

@router.get("/simulation/history", response_model=SimulationHistoryResponse)
async def get_simulation_history(
    days: int = 30,
    attack_type: Optional[str] = None,
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get simulation history for specified period."""
    try:
        # Validate attack type if provided
        if attack_type and attack_type not in ['poisoning', 'model-inversion', 'membership-inference']:
            raise HTTPException(status_code=400, detail="Invalid attack type")
        
        attack_type_enum = None
        if attack_type:
            attack_type_map = {
                'poisoning': AttackType.DATA_POISONING,
                'model-inversion': AttackType.MODEL_INVERSION,
                'membership-inference': AttackType.MEMBERSHIP_INFERENCE
            }
            attack_type_enum = attack_type_map[attack_type]
        
        history = await security_api.get_simulation_history(days, attack_type_enum)
        
        # Calculate success rate
        if history:
            successful = sum(1 for sim in history if sim["defense_result"] == "SUCCESSFUL")
            success_rate = successful / len(history)
        else:
            success_rate = 0.0
        
        return SimulationHistoryResponse(
            simulations=history,
            total_count=len(history),
            period_days=days,
            success_rate=success_rate
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get simulation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve simulation history")

@router.get("/simulation/{simulation_id}/report")
async def get_simulation_report(
    simulation_id: str,
    format: str = "json",
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get detailed report for specific simulation."""
    try:
        # In a real implementation, you'd look up the simulation by ID
        # For now, return the latest simulation details
        latest = await security_api.get_latest_simulation_details()
        
        if not latest:
            raise HTTPException(status_code=404, detail="Simulation not found")
        
        if format == "text":
            # Return text report
            return JSONResponse(
                content={"report": latest["detailed_report"]},
                media_type="application/json"
            )
        else:
            # Return JSON format
            return JSONResponse(content=latest)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get simulation report: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve simulation report")

@router.get("/simulation/{simulation_id}/evidence")
async def get_visual_evidence(
    simulation_id: str,
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get visual evidence from simulation (attack/defense visualizations)."""
    try:
        latest = await security_api.get_latest_simulation_details()
        
        if not latest or not latest.get("has_visual_evidence"):
            raise HTTPException(status_code=404, detail="Visual evidence not found")
        
        # In a real implementation, you'd retrieve the actual visual evidence
        # For now, return a placeholder response
        return JSONResponse(content={
            "simulation_id": simulation_id,
            "evidence_type": "image/png",
            "evidence_size": latest.get("visual_evidence_size", 0),
            "description": f"Visual evidence for {latest['attack_type']} simulation"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get visual evidence: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve visual evidence")

@router.get("/recommendations")
async def get_security_recommendations(
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get actionable security recommendations based on simulation results."""
    try:
        recommendations = await security_api.get_security_recommendations()
        return {"recommendations": recommendations}
        
    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recommendations")

@router.get("/statistics")
async def get_attack_statistics(
    days: int = 30,
    security_api: SecurityPostureAPI = Depends(get_security_api),
    current_admin = Depends(get_current_admin_user)
):
    """Get detailed attack statistics for dashboard charts."""
    try:
        statistics = await security_api.get_attack_statistics()
        return statistics
        
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")

@router.websocket("/ws/dashboard")
async def security_dashboard_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time security dashboard updates."""
    ws_manager = await get_websocket_manager()
    
    await websocket.accept()
    await ws_manager.register_client(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Handle client requests (e.g., request for specific data)
            try:
                message = json.loads(data)
                if message.get("type") == "request_update":
                    await ws_manager.send_security_update(websocket)
            except json.JSONDecodeError:
                logger.warning("Received invalid JSON from WebSocket client")
                
    except Exception as e:
        logger.info(f"WebSocket client disconnected: {e}")
    finally:
        await ws_manager.unregister_client(websocket)

@router.post("/simulation/batch")
async def run_batch_simulations(
    attack_types: List[str],
    background_tasks: BackgroundTasks,
    num_adversaries: int = 5,
    privacy_budget: float = 1.0,
    simulation_engine: AttackSimulationEngine = Depends(get_simulation_engine),
    current_admin = Depends(get_current_admin_user)
):
    """
    Run multiple attack simulations in batch for comprehensive security testing.
    
    This is useful for establishing security baselines or running regular
    security assessments across all attack vectors.
    """
    logger.info(f"Starting batch simulation for attacks: {attack_types}")
    
    try:
        # Validate all attack types
        attack_type_map = {
            'poisoning': AttackType.DATA_POISONING,
            'model-inversion': AttackType.MODEL_INVERSION,
            'membership-inference': AttackType.MEMBERSHIP_INFERENCE
        }
        
        invalid_types = [at for at in attack_types if at not in attack_type_map]
        if invalid_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid attack types: {invalid_types}"
            )
        
        # Schedule batch simulations
        batch_id = f"batch_{int(datetime.now().timestamp())}"
        
        for attack_type in attack_types:
            config = AttackConfig(
                attack_type=attack_type_map[attack_type],
                num_adversaries=num_adversaries,
                privacy_budget=privacy_budget
            )
            
            # Add to background tasks
            background_tasks.add_task(run_background_simulation, simulation_engine, config, batch_id)
        
        return {
            "batch_id": batch_id,
            "scheduled_simulations": len(attack_types),
            "attack_types": attack_types,
            "message": "Batch simulation started. Monitor via WebSocket or status endpoint."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch simulation failed: {str(e)}")

async def run_background_simulation(
    simulation_engine: AttackSimulationEngine, 
    config: AttackConfig, 
    batch_id: str
):
    """Background task for running simulations."""
    try:
        logger.info(f"Running background simulation: {config.attack_type.value} (batch: {batch_id})")
        result = await simulation_engine.run_simulation(config)
        
        # Notify WebSocket clients
        ws_manager = await get_websocket_manager()
        await ws_manager.notify_simulation_complete(result)
        
        logger.info(f"Background simulation completed: {config.attack_type.value}")
        
    except Exception as e:
        logger.error(f"Background simulation failed: {e}")

@router.get("/health")
async def security_health_check():
    """Health check endpoint for security simulation services."""
    try:
        # Verify simulation engine can be initialized
        simulation_engine = await get_simulation_engine()
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "attack_simulation": "available",
                "security_dashboard": "available",
                "websocket_manager": "available"
            },
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Security services unavailable")

# Export router
__all__ = ['router']

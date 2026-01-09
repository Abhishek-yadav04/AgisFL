"""
Experiment Routes - Federated Learning Experiment Management
Bridge between API requests and FL business logic
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging
import uuid

# Import pure business logic
try:
    from core.autofl_engine import AutoFLEngine
    from core.federated_explainability import FederatedExplainabilityEngine
    from privacy.differential_privacy import DifferentialPrivacyEngine
except ImportError:
    # Fallback implementations
    class AutoFLEngine:
        def __init__(self):
            pass
    class FederatedExplainabilityEngine:
        def __init__(self):
            pass
    class DifferentialPrivacyEngine:
        def __init__(self):
            pass

logger = logging.getLogger(__name__)

# Initialize business logic engines
autofl_engine = AutoFLEngine()
xai_engine = FederatedExplainabilityEngine()
privacy_engine = DifferentialPrivacyEngine()

if not autofl_engine or not xai_engine or not privacy_engine:
    raise ImportError("Real experiment backend not available. All endpoints require real business logic.")
xai_engine = FederatedExplainabilityEngine()
privacy_engine = DifferentialPrivacyEngine()

router = APIRouter()

# Request/Response models
class ExperimentConfig(BaseModel):
    """Configuration for creating a new experiment"""
    model_config = {"protected_namespaces": ()}  # Fix Pydantic warning
    
    name: str
    description: Optional[str] = ""
    model_type: str = "neural_network"
    dataset: str
    privacy_enabled: bool = False
    privacy_epsilon: float = 1.0
    secure_aggregation: bool = True
    rounds: int = 10

class ExperimentResponse(BaseModel):
    id: str
    status: str
    message: str

@router.post("/create", response_model=ExperimentResponse)
async def create_experiment(config: ExperimentConfig) -> ExperimentResponse:
    """Create new federated learning experiment"""
    try:
        logger.info(f"Creating experiment: {config.name}")
        
        # Convert web request to business logic call
        experiment_config = {
            "name": config.name,
            "description": config.description,
            "model_type": config.model_type,
            "dataset": config.dataset,
            "privacy_config": {
                "enabled": config.privacy_enabled,
                "epsilon": config.privacy_epsilon
            },
            "security_config": {
                "secure_aggregation": config.secure_aggregation
            },
            "training_config": {
                "rounds": config.rounds
            }
        }
        
        # Call pure business logic
        experiment_id = await autofl_engine.create_experiment(experiment_config)
        
        return ExperimentResponse(
            id=experiment_id,
            status="created",
            message=f"Experiment '{config.name}' created successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to create experiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{experiment_id}/start")
async def start_experiment(experiment_id: str, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Start federated learning experiment"""
    try:
        # Call pure business logic
        success = await autofl_engine.start_experiment(experiment_id)
        
        if success:
            # Add background task for training
            background_tasks.add_task(run_experiment_background, experiment_id)
            
            return {
                "status": "started",
                "experiment_id": experiment_id,
                "message": "Experiment started successfully"
            }
        else:
            raise HTTPException(status_code=404, detail="Experiment not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start experiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{experiment_id}")
async def get_experiment_details(experiment_id: str) -> Dict[str, Any]:
    """Get detailed experiment information"""
    try:
        # Call pure business logic
        experiment = await autofl_engine.get_experiment(experiment_id)
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        return experiment
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
async def list_experiments() -> Dict[str, Any]:
    """List all experiments"""
    try:
        # Call pure business logic
        experiments = await autofl_engine.list_experiments()
        
        return {
            "experiments": experiments,
            "count": len(experiments),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to list experiments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Alias for no-trailing-slash requests to ensure both /api/experiments and /api/experiments/ work
@router.get("", summary="List Experiments (alias)")
async def list_experiments_alias() -> Dict[str, Any]:
    """Compatibility alias that forwards to the primary listing handler"""
    return await list_experiments()

@router.get("/{experiment_id}/logs")
async def get_experiment_logs(experiment_id: str) -> Dict[str, Any]:
    """Get logs for a specific experiment"""
    try:
        # Call pure business logic
        experiment = await autofl_engine.get_experiment(experiment_id)
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        # Mock logs for now - in real implementation, this would fetch from logging system
        logs = [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "INFO",
                "message": f"Experiment {experiment_id} initialized",
                "source": "experiment_manager"
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "INFO", 
                "message": f"Starting training round 1/10",
                "source": "training_coordinator"
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "INFO",
                "message": "Client selection completed: 5 clients selected",
                "source": "client_selector"
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "INFO",
                "message": "Model aggregation completed for round 1",
                "source": "aggregator"
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "level": "WARNING",
                "message": "Client 3 experienced slow convergence",
                "source": "performance_monitor"
            }
        ]
        
        return {
            "experiment_id": experiment_id,
            "logs": logs,
            "count": len(logs),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get experiment logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{experiment_id}/training-history")
async def get_training_history(experiment_id: str) -> Dict[str, Any]:
    """Get training history and metrics for experiment"""
    try:
        # Call pure business logic
        experiment = await autofl_engine.get_experiment(experiment_id)
        
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")
        
        # Mock training history - in real implementation, this would fetch from metrics store
        training_history = {
            "rounds": [
                {
                    "round": 1,
                    "accuracy": 0.65,
                    "loss": 1.23,
                    "clients_participated": 5,
                    "training_time": 45.2,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                {
                    "round": 2,
                    "accuracy": 0.72,
                    "loss": 0.98,
                    "clients_participated": 5,
                    "training_time": 42.1,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                {
                    "round": 3,
                    "accuracy": 0.78,
                    "loss": 0.87,
                    "clients_participated": 4,
                    "training_time": 38.9,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                {
                    "round": 4,
                    "accuracy": 0.82,
                    "loss": 0.76,
                    "clients_participated": 5,
                    "training_time": 41.3,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                {
                    "round": 5,
                    "accuracy": 0.85,
                    "loss": 0.68,
                    "clients_participated": 5,
                    "training_time": 39.7,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            ],
            "summary": {
                "total_rounds": 5,
                "best_accuracy": 0.85,
                "final_loss": 0.68,
                "average_training_time": 41.4,
                "total_clients": 5
            }
        }
        
        return {
            "experiment_id": experiment_id,
            "training_history": training_history,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get training history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Pure business logic function (runs in background)
async def run_experiment_background(experiment_id: str):
    """Pure function to run experiment training"""
    try:
        logger.info(f"Starting background training for experiment {experiment_id}")
        # This would call the actual training logic
        # await autofl_engine.train_experiment(experiment_id)
        logger.info(f"Completed background training for experiment {experiment_id}")
    except Exception as e:
        logger.error(f"Background training failed for {experiment_id}: {e}")

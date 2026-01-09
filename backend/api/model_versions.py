"""
Model Versioning API
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import time
import uuid

router = APIRouter()

# Mock model versions data
MOCK_VERSIONS = [
    {
        "version_id": "v1.0.0",
        "algorithm": "FedAvg",
        "accuracy": 0.942,
        "loss": 0.058,
        "round_number": 10,
        "num_clients": 5,
        "created_at": "2024-01-15T10:30:00Z",
        "model_hash": "abc123def456"
    },
    {
        "version_id": "v1.0.1",
        "algorithm": "FedProx",
        "accuracy": 0.951,
        "loss": 0.049,
        "round_number": 15,
        "num_clients": 5,
        "created_at": "2024-01-16T14:20:00Z",
        "model_hash": "def456ghi789"
    },
    {
        "version_id": "v1.1.0",
        "algorithm": "FedNova",
        "accuracy": 0.958,
        "loss": 0.042,
        "round_number": 20,
        "num_clients": 7,
        "created_at": "2024-01-17T09:15:00Z",
        "model_hash": "ghi789jkl012"
    }
]

@router.get("/status")
async def get_models_status():
    """Get models service status"""
    
    try:
        return {
            "status": "success",
            "service": "Model Versioning API",
            "version": "1.0.0",
            "total_models": len(MOCK_VERSIONS),
            "latest_version": MOCK_VERSIONS[-1]["version_id"] if MOCK_VERSIONS else None,
            "algorithms": list(set(v["algorithm"] for v in MOCK_VERSIONS)),
            "avg_accuracy": sum(v["accuracy"] for v in MOCK_VERSIONS) / len(MOCK_VERSIONS) if MOCK_VERSIONS else 0,
            "last_updated": MOCK_VERSIONS[-1]["created_at"] if MOCK_VERSIONS else None,
            "endpoints": [
                "/models/versions",
                "/models/versions/{version_id}",
                "/models/latest",
                "/models/stats",
                "/status"
            ]
        }
        
    except Exception as e:
        return {
            "status": "error",
            "service": "Model Versioning API",
            "error": str(e)
        }

@router.get("/models/versions/{version_id}")
async def get_model_version(version_id: str):
    """Get specific model version"""
    version = next((v for v in MOCK_VERSIONS if v["version_id"] == version_id), None)
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found")
    return {"status": "success", "version": version}

@router.get("/models/latest")
async def get_latest_model():
    """Get latest model version"""
    if MOCK_VERSIONS:
        return {"status": "success", "version": MOCK_VERSIONS[-1]}
    raise HTTPException(status_code=404, detail="No models found")

@router.post("/models/compare")
async def compare_models(data: dict):
    """Compare two model versions"""
    version1 = data.get("version1")
    version2 = data.get("version2")
    
    v1 = next((v for v in MOCK_VERSIONS if v["version_id"] == version1), None)
    v2 = next((v for v in MOCK_VERSIONS if v["version_id"] == version2), None)
    
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="One or both model versions not found")
    
    accuracy_diff = v2["accuracy"] - v1["accuracy"]
    better_version = version2 if accuracy_diff > 0 else version1
    
    return {
        "status": "success",
        "comparison": {
            "version1": v1,
            "version2": v2,
            "accuracy_diff": accuracy_diff,
            "better_version": better_version
        }
    }

@router.delete("/models/versions/{version_id}")
async def delete_model_version(version_id: str):
    """Delete model version"""
    global MOCK_VERSIONS
    MOCK_VERSIONS = [v for v in MOCK_VERSIONS if v["version_id"] != version_id]
    return {"status": "success", "message": f"Model version {version_id} deleted"}

@router.get("/models/stats")
async def get_model_stats():
    """Get model statistics"""
    if not MOCK_VERSIONS:
        return {"status": "success", "stats": {"total_models": 0, "avg_accuracy": 0}}
    
    avg_accuracy = sum(v["accuracy"] for v in MOCK_VERSIONS) / len(MOCK_VERSIONS)
    
    return {
        "status": "success",
        "stats": {
            "total_models": len(MOCK_VERSIONS),
            "avg_accuracy": avg_accuracy,
            "latest_accuracy": MOCK_VERSIONS[-1]["accuracy"],
            "algorithms_used": list(set(v["algorithm"] for v in MOCK_VERSIONS))
        }
    }
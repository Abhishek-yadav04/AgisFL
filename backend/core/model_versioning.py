"""
Model Versioning System
"""

import hashlib
import json
import pickle
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
import torch
import torch.nn as nn

@dataclass
class ModelVersion:
    version_id: str
    model_hash: str
    created_at: str
    algorithm: str
    accuracy: float
    loss: float
    num_clients: int
    round_number: int
    metadata: Dict[str, Any]
    file_path: str

class ModelVersionManager:
    # Event hooks and audit trail
    def _emit_event(self, event_type: str, details: Dict[str, Any]):
        import logging
        logging.info(f"ModelVersionManager event: {event_type}", extra={"details": details})
        # Extend here to integrate with external event bus or audit system

    def _log_audit(self, action: str, details: Dict[str, Any]):
        import logging
        logging.info(f"AUDIT: {action}", extra={"details": details})
        # Extend here to write to audit trail file or external system
    """Manages model versions and persistence"""
    
    def __init__(self, storage_path: str = "models/versions"):
        self.storage_path = storage_path
        self.versions: Dict[str, ModelVersion] = {}
        self.latest_version: Optional[str] = None
        
        # Create storage directory
        os.makedirs(storage_path, exist_ok=True)
        
        # Load existing versions
        self._load_versions()
    
    def save_model_version(self, model: nn.Module, metadata: Dict[str, Any]) -> str:
        """Save a new model version with event and audit hooks"""
        model_state = model.state_dict()
        model_hash = self._calculate_model_hash(model_state)
        timestamp = datetime.now().isoformat()
        version_id = f"v{datetime.now().strftime('%Y%m%d_%H%M%S')}_{model_hash[:8]}"

        version = ModelVersion(
            version_id=version_id,
            model_hash=model_hash,
            created_at=timestamp,
            algorithm=metadata.get("algorithm", "unknown"),
            accuracy=metadata.get("accuracy", 0.0),
            loss=metadata.get("loss", 0.0),
            num_clients=metadata.get("num_clients", 0),
            round_number=metadata.get("round_number", 0),
            metadata=metadata,
            file_path=os.path.join(self.storage_path, f"{version_id}.pkl")
        )

        torch.save({
            "model_state_dict": model_state,
            "model_class": model.__class__.__name__,
            "metadata": metadata
        }, version.file_path)

        self.versions[version_id] = version
        self.latest_version = version_id
        self._save_version_registry()

        self._emit_event("model_version_saved", {"version_id": version_id, "metadata": metadata})
        self._log_audit("save_model_version", {"version_id": version_id, "metadata": metadata})

        return version_id
    
    def load_model_version(self, version_id: str, model_class: nn.Module = None) -> Any:
        """Load a specific model version with event and audit hooks"""
        import logging
        if version_id not in self.versions:
            logging.error(f"Model version {version_id} not found")
            self._emit_event("model_version_load_failed", {"version_id": version_id, "reason": "not found"})
            self._log_audit("load_model_version_failed", {"version_id": version_id, "reason": "not found"})
            return {"error": "Model version not found", "version_id": version_id}

        version = self.versions[version_id]

        if not os.path.exists(version.file_path):
            logging.error(f"Model file not found: {version.file_path}")
            self._emit_event("model_version_load_failed", {"version_id": version_id, "reason": "file not found"})
            self._log_audit("load_model_version_failed", {"version_id": version_id, "reason": "file not found"})
            return {"error": "Model file not found", "file_path": version.file_path}

        checkpoint = torch.load(version.file_path, map_location='cpu')

        if model_class is None:
            logging.error("Model class must be provided to load model")
            self._emit_event("model_version_load_failed", {"version_id": version_id, "reason": "model class missing"})
            self._log_audit("load_model_version_failed", {"version_id": version_id, "reason": "model class missing"})
            return {"error": "Model class must be provided"}

        try:
            model = model_class()
            model.load_state_dict(checkpoint["model_state_dict"])
            self._emit_event("model_version_loaded", {"version_id": version_id})
            self._log_audit("load_model_version", {"version_id": version_id})
            return model
        except Exception as e:
            logging.error(f"Failed to load model state: {e}")
            self._emit_event("model_version_load_failed", {"version_id": version_id, "reason": str(e)})
            self._log_audit("load_model_version_failed", {"version_id": version_id, "exception": str(e)})
            return {"error": "Failed to load model state", "exception": str(e)}
    
    def get_latest_version(self) -> Optional[str]:
        """Get the latest model version ID"""
        return self.latest_version
    
    def list_versions(self, limit: int = 10) -> List[ModelVersion]:
        """List model versions (most recent first)"""
        sorted_versions = sorted(
            self.versions.values(),
            key=lambda v: v.created_at,
            reverse=True
        )
        return sorted_versions[:limit]
    
    def get_version_info(self, version_id: str) -> Optional[ModelVersion]:
        """Get information about a specific version"""
        return self.versions.get(version_id)
    
    def delete_version(self, version_id: str) -> bool:
        """Delete a model version with event and audit hooks"""
        if version_id not in self.versions:
            self._emit_event("model_version_delete_failed", {"version_id": version_id, "reason": "not found"})
            self._log_audit("delete_model_version_failed", {"version_id": version_id, "reason": "not found"})
            return False

        version = self.versions[version_id]

        if os.path.exists(version.file_path):
            os.remove(version.file_path)

        del self.versions[version_id]

        if self.latest_version == version_id:
            remaining_versions = sorted(
                self.versions.values(),
                key=lambda v: v.created_at,
                reverse=True
            )
            self.latest_version = remaining_versions[0].version_id if remaining_versions else None

        self._save_version_registry()
        self._emit_event("model_version_deleted", {"version_id": version_id})
        self._log_audit("delete_model_version", {"version_id": version_id})
        return True
    
    def compare_versions(self, version1: str, version2: str) -> Dict[str, Any]:
        """Compare two model versions with event and audit hooks"""
        import logging
        if version1 not in self.versions or version2 not in self.versions:
            logging.error(f"One or both versions not found: {version1}, {version2}")
            self._emit_event("model_version_compare_failed", {"version1": version1, "version2": version2, "reason": "not found"})
            self._log_audit("compare_model_versions_failed", {"version1": version1, "version2": version2, "reason": "not found"})
            return {"error": "One or both versions not found", "version1": version1, "version2": version2}

        v1 = self.versions[version1]
        v2 = self.versions[version2]

        try:
            result = {
                "version1": {
                    "id": v1.version_id,
                    "accuracy": v1.accuracy,
                    "loss": v1.loss,
                    "created_at": v1.created_at
                },
                "version2": {
                    "id": v2.version_id,
                    "accuracy": v2.accuracy,
                    "loss": v2.loss,
                    "created_at": v2.created_at
                },
                "accuracy_diff": v2.accuracy - v1.accuracy,
                "loss_diff": v2.loss - v1.loss,
                "better_version": version2 if v2.accuracy > v1.accuracy else version1
            }
            self._emit_event("model_versions_compared", {"version1": version1, "version2": version2, "result": result})
            self._log_audit("compare_model_versions", {"version1": version1, "version2": version2, "result": result})
            return result
        except Exception as e:
            logging.error(f"Failed to compare versions: {e}")
            self._emit_event("model_version_compare_failed", {"version1": version1, "version2": version2, "exception": str(e)})
            self._log_audit("compare_model_versions_failed", {"version1": version1, "version2": version2, "exception": str(e)})
            return {"error": "Failed to compare versions", "exception": str(e)}
    
    def _calculate_model_hash(self, model_state: Dict[str, torch.Tensor]) -> str:
        """Calculate hash of model state"""
        # Convert model state to string representation
        model_str = ""
        for key in sorted(model_state.keys()):
            tensor = model_state[key]
            model_str += f"{key}:{tensor.shape}:{tensor.sum().item()}"
        
        return hashlib.sha256(model_str.encode()).hexdigest()
    
    def _save_version_registry(self):
        """Save version registry to disk"""
        registry_path = os.path.join(self.storage_path, "registry.json")
        registry_data = {
            "versions": {vid: asdict(version) for vid, version in self.versions.items()},
            "latest_version": self.latest_version
        }
        
        with open(registry_path, 'w') as f:
            json.dump(registry_data, f, indent=2)
    
    def _load_versions(self):
        """Load existing versions from disk"""
        registry_path = os.path.join(self.storage_path, "registry.json")
        
        if not os.path.exists(registry_path):
            return
        
        try:
            with open(registry_path, 'r') as f:
                registry_data = json.load(f)
            
            # Load versions
            for vid, version_data in registry_data.get("versions", {}).items():
                self.versions[vid] = ModelVersion(**version_data)
            
            self.latest_version = registry_data.get("latest_version")
            
        except Exception as e:
            import logging
            logging.getLogger("core.model_versioning").error(f"Error loading version registry: {e}")


# Lazy-init singleton factory for ModelVersionManager
_model_version_manager_instance = None
def get_model_version_manager(storage_path: str = "models/versions"):
    global _model_version_manager_instance
    if _model_version_manager_instance is None:
        _model_version_manager_instance = ModelVersionManager(storage_path)
    return _model_version_manager_instance
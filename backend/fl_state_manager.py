"""
FL State Manager - Persistent state for federated learning
Prevents data loss on page refresh
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any

class FLStateManager:
    def __init__(self, state_file="fl_state.json"):
        self.state_file = state_file
        self.advanced_state_file = "advanced_fl_state.json"
        self.state = self.load_state()
        self.advanced_state = self.load_advanced_state()
    
    def load_state(self) -> Dict[str, Any]:
        """Load FL state from file"""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        
        # Default state
        return {
            "is_training": False,
            "current_round": 0,
            "total_rounds": 10,
            "global_accuracy": 0.0,
            "active_clients": 0,
            "algorithm": "fedavg",
            "experiment_id": None,
            "start_time": None,
            "training_history": [],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    def save_state(self):
        """Save FL state to file"""
        try:
            self.state["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2)
        except Exception as e:
            print(f"Failed to save FL state: {e}")
    
    def update_training_status(self, is_training: bool, experiment_id: str = None):
        """Update training status"""
        self.state["is_training"] = is_training
        if experiment_id:
            self.state["experiment_id"] = experiment_id
        if is_training:
            self.state["start_time"] = datetime.now(timezone.utc).isoformat()
        self.save_state()
    
    def update_round(self, round_num: int, accuracy: float = None):
        """Update current round and accuracy"""
        self.state["current_round"] = round_num
        if accuracy is not None:
            self.state["global_accuracy"] = accuracy
            # Add to history
            self.state["training_history"].append({
                "round": round_num,
                "accuracy": accuracy,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            # Keep only last 50 entries
            if len(self.state["training_history"]) > 50:
                self.state["training_history"] = self.state["training_history"][-50:]
        self.save_state()
    
    def get_state(self) -> Dict[str, Any]:
        """Get current state"""
        return self.state.copy()
    
    def load_advanced_state(self) -> Dict[str, Any]:
        """Load advanced FL state from file"""
        if os.path.exists(self.advanced_state_file):
            try:
                with open(self.advanced_state_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        
        # Default advanced state
        return {
            "is_training": False,
            "current_experiment": None,
            "algorithm": "fedavg",
            "current_round": 0,
            "total_rounds": 10,
            "accuracy": 0.0,
            "participants": 5,
            "privacy_level": "medium",
            "autonomous_mode": False,
            "fednas_status": "idle",
            "fedhpo_status": "idle",
            "drift_monitoring": {
                "status": "monitoring",
                "baseline_accuracy": 0.0,
                "current_accuracy": 0.0,
                "recent_alerts": 0
            },
            "training_history": [],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    def save_advanced_state(self):
        """Save advanced FL state to file"""
        try:
            self.advanced_state["last_updated"] = datetime.now(timezone.utc).isoformat()
            with open(self.advanced_state_file, 'w') as f:
                json.dump(self.advanced_state, f, indent=2)
        except Exception as e:
            print(f"Failed to save advanced FL state: {e}")
    
    def update_advanced_training_status(self, is_training: bool, experiment_id: str = None, algorithm: str = None):
        """Update advanced training status"""
        self.advanced_state["is_training"] = is_training
        if experiment_id:
            self.advanced_state["current_experiment"] = experiment_id
        if algorithm:
            self.advanced_state["algorithm"] = algorithm
        if is_training:
            self.advanced_state["start_time"] = datetime.now(timezone.utc).isoformat()
        self.save_advanced_state()
    
    def update_advanced_round(self, round_num: int, accuracy: float = None):
        """Update advanced training round"""
        self.advanced_state["current_round"] = round_num
        if accuracy is not None:
            self.advanced_state["accuracy"] = accuracy
            # Add to history
            self.advanced_state["training_history"].append({
                "round": round_num,
                "accuracy": accuracy,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            # Keep only last 50 entries
            if len(self.advanced_state["training_history"]) > 50:
                self.advanced_state["training_history"] = self.advanced_state["training_history"][-50:]
        self.save_advanced_state()
    
    def get_advanced_state(self) -> Dict[str, Any]:
        """Get current advanced state"""
        return self.advanced_state.copy()
    
    def reset_state(self):
        """Reset to default state"""
        self.state = {
            "is_training": False,
            "current_round": 0,
            "total_rounds": 10,
            "global_accuracy": 0.0,
            "active_clients": 0,
            "algorithm": "fedavg",
            "experiment_id": None,
            "start_time": None,
            "training_history": [],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        self.save_state()
        
        # Also reset advanced state
        self.advanced_state = self.load_advanced_state()
        self.save_advanced_state()

# Global state manager
fl_state_manager = FLStateManager()
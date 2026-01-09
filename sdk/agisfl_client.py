"""
AgisFL Client SDK - Developer Experience Package
===============================================

Make federated learning as simple as regular machine learning.

Philosophy: "Three-Line Integration"
1. agisfl.init() - Initialize and authenticate
2. data_loader = agisfl.load_data() - Load data (optional helper)  
3. agisfl.run_training() - Run federated training

Example Usage:
    import agisfl
    import torch.nn as nn
    
    # 1. Initialize & Authenticate
    agisfl.init(api_key="your_api_key")
    
    # 2. Load data (optional helper)
    train_loader = agisfl.load_data("./data")
    
    # 3. Run federated training
    class MyModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.linear = nn.Linear(784, 10)
        
        def forward(self, x):
            return self.linear(x)
    
    model = MyModel()
    agisfl.run_training(model, train_loader)
"""

import asyncio
import atexit
import warnings
import logging
from typing import Any, Dict, List, Optional, Union, Callable
from pathlib import Path
import json
import os

# Core imports
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from torch.utils.data import DataLoader, Dataset

# HTTP client for API communication
import httpx
import websockets
from websockets.exceptions import ConnectionClosed

# Configuration and utilities
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import time

# Set up logging
logger = logging.getLogger(__name__)

__version__ = "1.0.0"
__author__ = "AgisFL Team"

# Global client state
_client_instance = None

@dataclass
class AgisConfig:
    """Configuration for AgisFL client"""
    api_key: str = ""
    server_url: str = "http://localhost:8000"
    client_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timeout: int = 30
    max_retries: int = 3
    log_level: str = "INFO"
    experiment_name: str = "default_experiment"
    
    # Training configuration
    local_epochs: int = 5
    batch_size: int = 32
    learning_rate: float = 0.01
    
    # Privacy settings
    use_differential_privacy: bool = False
    privacy_budget: float = 1.0
    
    # Communication settings
    use_compression: bool = True
    compression_ratio: float = 0.1
    
    # Explainability settings
    enable_explainability: bool = True
    explanation_method: str = "shap"

class AgisDataset(Dataset):
    """Wrapper for user data to integrate with AgisFL"""
    
    def __init__(self, features: np.ndarray, labels: np.ndarray = None):
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels) if labels is not None else None
        
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        if self.labels is not None:
            return self.features[idx], self.labels[idx]
        return self.features[idx]

class AgisClient:
    """Main AgisFL client for federated learning"""
    
    def __init__(self, config: AgisConfig):
        self.config = config
        self.session = httpx.AsyncClient(timeout=config.timeout)
        # If a resource registry exists in the backend, register this AsyncClient
        try:
            # Import local backend registry if available (this import is optional)
            from backend.resource_registry import register_resource
            # register a close coroutine so the app can gracefully shutdown the client
            try:
                register_resource('sdk_httpx_client', lambda: self.session.aclose(), {'type': 'httpx', 'owner': 'sdk'})
            except Exception:
                # Best-effort: do not fail initialization when registry registration fails
                pass
        except Exception:
            # Not running inside backend context - ignore
            pass
        self.websocket = None
        self.is_authenticated = False
        self.current_round = 0
        self.model = None
        self.data_loader = None
        self.optimizer = None
        self.loss_fn = None
        
        # Setup logging
        logging.basicConfig(level=getattr(logging, config.log_level.upper()))
        logger.info(f"AgisFL Client v{__version__} initialized")
    
    async def authenticate(self) -> bool:
        """Authenticate with AgisFL server"""
        try:
            response = await self.session.post(
                f"{self.config.server_url}/api/auth/login",
                json={
                    "api_key": self.config.api_key,
                    "client_id": self.config.client_id,
                    "client_type": "sdk"
                }
            )
            
            if response.status_code == 200:
                auth_data = response.json()
                self.session.headers.update({
                    "Authorization": f"Bearer {auth_data.get('token', '')}",
                    "X-Client-ID": self.config.client_id
                })
                self.is_authenticated = True
                logger.info("Successfully authenticated with AgisFL server")
                return True
            else:
                logger.error(f"Authentication failed: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False
    
    async def connect_websocket(self) -> bool:
        """Connect to real-time federated learning updates"""
        try:
            ws_url = self.config.server_url.replace("http", "ws") + "/ws/federated"
            self.websocket = await websockets.connect(
                ws_url,
                extra_headers={
                    "Authorization": f"Bearer {self.session.headers.get('Authorization', '').replace('Bearer ', '')}",
                    "X-Client-ID": self.config.client_id
                }
            )
            logger.info("Connected to federated learning websocket")
            return True
            
        except Exception as e:
            logger.warning(f"WebSocket connection failed: {e}")
            return False
    
    async def register_for_experiment(self, experiment_config: Dict[str, Any]) -> bool:
        """Register this client for a federated learning experiment"""
        try:
            response = await self.session.post(
                f"{self.config.server_url}/api/fl/experiments/join",
                json={
                    "experiment_name": self.config.experiment_name,
                    "client_capabilities": {
                        "frameworks": ["pytorch"],
                        "data_size": len(self.data_loader.dataset) if self.data_loader else 0,
                        "compute_type": "cpu",  # Could detect GPU
                        "privacy_features": self.config.use_differential_privacy,
                        "explainability_support": self.config.enable_explainability
                    },
                    "config": experiment_config
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Registered for experiment: {result.get('experiment_id')}")
                return True
            else:
                logger.error(f"Experiment registration failed: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Experiment registration error: {e}")
            return False
    
    def load_model_state(self, model_state: Dict[str, Any]) -> None:
        """Load global model state received from server"""
        if self.model is None:
            raise ValueError("Model not set. Call set_model() first.")
        
        try:
            # Convert model state to state dict
            state_dict = {}
            for name, param_data in model_state.items():
                if isinstance(param_data, list):
                    state_dict[name] = torch.tensor(param_data)
                else:
                    state_dict[name] = torch.tensor(param_data)
            
            self.model.load_state_dict(state_dict)
            logger.info("📥 Loaded global model state")
            
        except Exception as e:
            logger.error(f"❌ Failed to load model state: {e}")
    
    def get_model_state(self) -> Dict[str, Any]:
        """Get current model state for sending to server"""
        if self.model is None:
            raise ValueError("Model not set.")
        
        state_dict = {}
        for name, param in self.model.state_dict().items():
            state_dict[name] = param.cpu().numpy().tolist()
        
        return state_dict
    
    async def train_local_epoch(self) -> Dict[str, float]:
        """Train model for one local epoch"""
        if not all([self.model, self.data_loader, self.optimizer, self.loss_fn]):
            raise ValueError("Model, data_loader, optimizer, and loss_fn must be set")
        
        self.model.train()
        total_loss = 0.0
        num_batches = 0
        correct = 0
        total = 0
        
        for batch_idx, (data, target) in enumerate(self.data_loader):
            self.optimizer.zero_grad()
            output = self.model(data)
            loss = self.loss_fn(output, target)
            loss.backward()
            
            # Apply differential privacy if enabled
            if self.config.use_differential_privacy:
                # Simple noise addition for DP (production would use more sophisticated methods)
                for param in self.model.parameters():
                    if param.grad is not None:
                        noise = torch.normal(0, 0.1, param.grad.shape)
                        param.grad += noise
            
            self.optimizer.step()
            
            total_loss += loss.item()
            num_batches += 1
            
            # Calculate accuracy
            pred = output.argmax(dim=1, keepdim=True)
            correct += pred.eq(target.view_as(pred)).sum().item()
            total += target.size(0)
        
        avg_loss = total_loss / num_batches if num_batches > 0 else 0.0
        accuracy = correct / total if total > 0 else 0.0
        
        logger.info(f"📊 Local training complete - Loss: {avg_loss:.4f}, Accuracy: {accuracy:.4f}")
        
        return {
            "loss": avg_loss,
            "accuracy": accuracy,
            "samples": total
        }
    
    async def send_model_update(self, training_metrics: Dict[str, float]) -> bool:
        """Send model update to server"""
        try:
            model_state = self.get_model_state()
            
            # Apply compression if enabled
            if self.config.use_compression:
                # Simple compression simulation (production would use actual compression)
                compressed_size = sum(len(str(v)) for v in model_state.values())
                logger.info(f"📦 Model compressed (simulated): {compressed_size} bytes")
            
            response = await self.session.post(
                f"{self.config.server_url}/api/fl/model-updates",
                json={
                    "client_id": self.config.client_id,
                    "round": self.current_round,
                    "model_state": model_state,
                    "training_metrics": training_metrics,
                    "timestamp": datetime.now().isoformat()
                }
            )
            
            if response.status_code == 200:
                logger.info("✅ Model update sent successfully")
                return True
            else:
                logger.error(f"❌ Failed to send model update: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error sending model update: {e}")
            return False
    
    async def wait_for_next_round(self) -> Dict[str, Any]:
        """Wait for next round instructions from server"""
        try:
            if self.websocket:
                # Use WebSocket for real-time updates
                message = await self.websocket.recv()
                return json.loads(message)
            else:
                # Fallback to polling
                response = await self.session.get(
                    f"{self.config.server_url}/api/fl/round-status",
                    params={"client_id": self.config.client_id}
                )
                return response.json()
                
        except ConnectionClosed:
            logger.warning("🔌 WebSocket connection closed, falling back to polling")
            self.websocket = None
            return await self.wait_for_next_round()
        except Exception as e:
            logger.error(f"❌ Error waiting for next round: {e}")
            return {}
    
    def set_model(self, model: nn.Module):
        """Set the model for federated training"""
        self.model = model
        logger.info(f"🤖 Model set: {model.__class__.__name__}")
    
    def set_data_loader(self, data_loader: DataLoader):
        """Set the data loader for training"""
        self.data_loader = data_loader
        logger.info(f"📊 Data loader set: {len(data_loader.dataset)} samples")
    
    def set_optimizer(self, optimizer: torch.optim.Optimizer):
        """Set the optimizer for training"""
        self.optimizer = optimizer
        logger.info(f"🔧 Optimizer set: {optimizer.__class__.__name__}")
    
    def set_loss_function(self, loss_fn: Callable):
        """Set the loss function for training"""
        self.loss_fn = loss_fn
        logger.info(f"📏 Loss function set: {loss_fn.__class__.__name__}")
    
    async def run_federated_training(self, max_rounds: int = 100) -> Dict[str, Any]:
        """Run the complete federated training loop"""
        logger.info(f"🚀 Starting federated training for {max_rounds} rounds")
        
        # Register for experiment
        experiment_config = {
            "local_epochs": self.config.local_epochs,
            "learning_rate": self.config.learning_rate,
            "privacy_budget": self.config.privacy_budget if self.config.use_differential_privacy else None
        }
        
        if not await self.register_for_experiment(experiment_config):
            return {"success": False, "error": "Failed to register for experiment"}
        
        # Connect WebSocket for real-time updates
        await self.connect_websocket()
        
        training_history = []
        
        for round_num in range(max_rounds):
            self.current_round = round_num
            logger.info(f"🔄 Round {round_num + 1}/{max_rounds}")
            
            # Wait for round instructions
            round_info = await self.wait_for_next_round()
            
            if round_info.get("action") == "stop":
                logger.info("🛑 Training stopped by server")
                break
            elif round_info.get("action") == "train":
                # Load global model if provided
                if "global_model" in round_info:
                    self.load_model_state(round_info["global_model"])
                
                # Train local epochs
                total_metrics = {"loss": 0.0, "accuracy": 0.0, "samples": 0}
                
                for epoch in range(self.config.local_epochs):
                    epoch_metrics = await self.train_local_epoch()
                    total_metrics["loss"] += epoch_metrics["loss"]
                    total_metrics["accuracy"] += epoch_metrics["accuracy"]
                    total_metrics["samples"] = epoch_metrics["samples"]  # Same for all epochs
                
                # Average metrics across local epochs
                avg_metrics = {
                    "loss": total_metrics["loss"] / self.config.local_epochs,
                    "accuracy": total_metrics["accuracy"] / self.config.local_epochs,
                    "samples": total_metrics["samples"]
                }
                
                # Send model update
                if await self.send_model_update(avg_metrics):
                    training_history.append({
                        "round": round_num,
                        "metrics": avg_metrics,
                        "timestamp": datetime.now().isoformat()
                    })
                else:
                    logger.error(f"❌ Failed to send update for round {round_num}")
            
            # Small delay between rounds
            await asyncio.sleep(1)
        
        logger.info("🎉 Federated training completed!")
        
        return {
            "success": True,
            "rounds_completed": len(training_history),
            "training_history": training_history,
            "final_model_state": self.get_model_state()
        }
    
    async def get_model_explanations(self) -> Dict[str, Any]:
        """Get model explanations using AgisFL's federated explainability"""
        if not self.config.enable_explainability:
            return {"error": "Explainability not enabled"}
        
        try:
            response = await self.session.post(
                f"{self.config.server_url}/api/fl/explain",
                json={
                    "client_id": self.config.client_id,
                    "method": self.config.explanation_method,
                    "data_samples": 100  # Number of samples to explain
                }
            )
            
            if response.status_code == 200:
                explanations = response.json()
                logger.info("🧠 Model explanations retrieved successfully")
                return explanations
            else:
                logger.error(f"❌ Failed to get explanations: {response.text}")
                return {"error": response.text}
                
        except Exception as e:
            logger.error(f"❌ Error getting explanations: {e}")
            return {"error": str(e)}
    
    async def close(self):
        """Clean up client resources"""
        if self.websocket:
            await self.websocket.close()
        await self.session.aclose()
        logger.info("🔒 AgisFL client closed")

# =============================================================================
# PUBLIC API FUNCTIONS - The "Three-Line Integration"
# =============================================================================

def init(api_key: str, server_url: str = "http://localhost:8000", **kwargs) -> AgisClient:
    """
    Initialize AgisFL client - Line 1 of 3
    
    Args:
        api_key: Your AgisFL API key
        server_url: AgisFL server URL (default: localhost)
        **kwargs: Additional configuration options
    
    Returns:
        Configured AgisFL client
    
    Example:
        client = agisfl.init(api_key="your_api_key")
    """
    global _client_instance
    
    config = AgisConfig(
        api_key=api_key,
        server_url=server_url,
        **kwargs
    )
    
    _client_instance = AgisClient(config)
    
    # Run authentication in sync context
    async def _authenticate():
        return await _client_instance.authenticate()
    
    try:
        # Run authentication
        auth_result = asyncio.run(_authenticate())
        if not auth_result:
            raise ValueError("Authentication failed. Please check your API key.")
        
        logger.info("🎯 AgisFL initialized successfully")
        # Register atexit shutdown to ensure resources are cleaned up if the
        # process exits without explicit close. We use asyncio.run to execute
        # the async close() safely in a synchronous atexit handler.
        def _shutdown_client():
            try:
                if _client_instance is not None:
                    asyncio.run(_client_instance.close())
            except Exception:
                # Don't raise during interpreter shutdown
                pass

        atexit.register(_shutdown_client)
        return _client_instance
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize AgisFL: {e}")
        raise

def load_data(data_path: str = None, 
              features: np.ndarray = None, 
              labels: np.ndarray = None,
              batch_size: int = 32) -> DataLoader:
    """
    Load data for federated learning - Line 2 of 3 (optional)
    
    Args:
        data_path: Path to data file (CSV, NPZ, etc.)
        features: Feature array (if not using file)
        labels: Label array (if not using file)
        batch_size: Batch size for data loader
    
    Returns:
        PyTorch DataLoader ready for federated training
    
    Example:
        data_loader = agisfl.load_data("./data/train.csv")
        # OR
        data_loader = agisfl.load_data(features=X, labels=y)
    """
    if data_path:
        # Load from file
        path = Path(data_path)
        
        if path.suffix == '.csv':
            df = pd.read_csv(data_path)
            features = df.iloc[:, :-1].values
            labels = df.iloc[:, -1].values
        elif path.suffix == '.npz':
            data = np.load(data_path)
            features = data['features']
            labels = data['labels']
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")
    
    elif features is not None:
        # Use provided arrays
        pass
    else:
        raise ValueError("Either data_path or features must be provided")
    
    # Create dataset and data loader
    dataset = AgisDataset(features, labels)
    data_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    logger.info(f"📊 Data loaded: {len(dataset)} samples, batch size: {batch_size}")
    
    return data_loader

def run_training(model: nn.Module, 
                data_loader: DataLoader,
                optimizer: torch.optim.Optimizer = None,
                loss_fn: Callable = None,
                max_rounds: int = 100) -> Dict[str, Any]:
    """
    Run federated training - Line 3 of 3
    
    Args:
        model: PyTorch model to train
        data_loader: Data loader with training data
        optimizer: Optimizer (default: Adam)
        loss_fn: Loss function (default: CrossEntropyLoss)
        max_rounds: Maximum training rounds
    
    Returns:
        Training results and final model
    
    Example:
        results = agisfl.run_training(model, data_loader)
    """
    global _client_instance
    
    if _client_instance is None:
        raise ValueError("AgisFL not initialized. Call agisfl.init() first.")
    
    # Set up defaults
    if optimizer is None:
        optimizer = torch.optim.Adam(model.parameters(), lr=_client_instance.config.learning_rate)
    
    if loss_fn is None:
        loss_fn = nn.CrossEntropyLoss()
    
    # Configure client
    _client_instance.set_model(model)
    _client_instance.set_data_loader(data_loader)
    _client_instance.set_optimizer(optimizer)
    _client_instance.set_loss_function(loss_fn)
    
    # Run training
    async def _run_training():
        return await _client_instance.run_federated_training(max_rounds)
    
    try:
        results = asyncio.run(_run_training())
        logger.info("🎉 Federated training completed successfully!")
        return results
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        raise
    finally:
        # Clean up
        async def _cleanup():
            await _client_instance.close()
        asyncio.run(_cleanup())

def explain_model(method: str = "shap") -> Dict[str, Any]:
    """
    Get model explanations using federated explainability
    
    Args:
        method: Explanation method (shap, lime, etc.)
    
    Returns:
        Model explanations
    
    Example:
        explanations = agisfl.explain_model()
    """
    global _client_instance
    
    if _client_instance is None:
        raise ValueError("AgisFL not initialized. Call agisfl.init() first.")
    
    _client_instance.config.explanation_method = method
    
    async def _get_explanations():
        return await _client_instance.get_model_explanations()
    
    return asyncio.run(_get_explanations())

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_client() -> AgisClient:
    """Get the current AgisFL client instance"""
    global _client_instance
    if _client_instance is None:
        raise ValueError("AgisFL not initialized. Call agisfl.init() first.")
    return _client_instance

def create_simple_model(input_size: int, num_classes: int, hidden_size: int = 128) -> nn.Module:
    """
    Create a simple neural network model for quick testing
    
    Args:
        input_size: Number of input features
        num_classes: Number of output classes
        hidden_size: Hidden layer size
    
    Returns:
        Simple PyTorch model
    
    Example:
        model = agisfl.create_simple_model(784, 10)  # For MNIST
    """
    class SimpleNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(input_size, hidden_size)
            self.fc2 = nn.Linear(hidden_size, hidden_size)
            self.fc3 = nn.Linear(hidden_size, num_classes)
            self.relu = nn.ReLU()
            self.dropout = nn.Dropout(0.2)
        
        def forward(self, x):
            x = x.view(x.size(0), -1)  # Flatten
            x = self.relu(self.fc1(x))
            x = self.dropout(x)
            x = self.relu(self.fc2(x))
            x = self.dropout(x)
            x = self.fc3(x)
            return x
    
    return SimpleNet()

# Version info
def version():
    """Get AgisFL SDK version"""
    return __version__

# Suppress warnings for cleaner experience
warnings.filterwarnings("ignore", category=UserWarning)

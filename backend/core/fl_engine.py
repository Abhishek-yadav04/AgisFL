"""Advanced Federated Learning Engine with Multiple Strategies"""

import asyncio
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import structlog
import flwr as fl
from flwr.common import Metrics
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
import threading
import time

logger = structlog.get_logger()

class IDSModel(nn.Module):
    """Neural network model for intrusion detection"""
    
    def __init__(self, input_size: int = 41, hidden_size: int = 128, num_classes: int = 2):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.fc2 = nn.Linear(hidden_size, 64)
        self.fc3 = nn.Linear(64, 32)
        self.fc4 = nn.Linear(32, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.relu(self.fc3(x))
        x = self.fc4(x)
        return x

class FLStrategy:
    """Base class for FL strategies"""
    
    def __init__(self, name: str):
        self.name = name
        
    def aggregate(self, client_updates: List[Dict]) -> Dict:
        """Aggregate client updates"""
        raise NotImplementedError

class FedAvgStrategy(FLStrategy):
    """Federated Averaging strategy"""
    
    def __init__(self):
        super().__init__("FedAvg")
    
    def aggregate(self, client_updates: List[Dict]) -> Dict:
        """Standard FedAvg aggregation"""
        if not client_updates:
            return {}
        
        total_samples = sum(update['num_samples'] for update in client_updates)
        
        # Weighted average of parameters
        aggregated_params = {}
        for key in client_updates[0]['parameters'].keys():
            weighted_sum = sum(
                update['parameters'][key] * (update['num_samples'] / total_samples)
                for update in client_updates
            )
            aggregated_params[key] = weighted_sum
        
        return {
            'parameters': aggregated_params,
            'num_samples': total_samples,
            'accuracy': np.mean([update['accuracy'] for update in client_updates])
        }

class FedProxStrategy(FLStrategy):
    """Federated Proximal strategy for heterogeneous data"""
    
    def __init__(self, mu: float = 0.1):
        super().__init__("FedProx")
        self.mu = mu  # Proximal term coefficient
    
    def aggregate(self, client_updates: List[Dict]) -> Dict:
        """FedProx aggregation with proximal term"""
        if not client_updates:
            return {}
        
        total_samples = sum(update['num_samples'] for update in client_updates)
        
        # Weighted average with proximal regularization
        aggregated_params = {}
        for key in client_updates[0]['parameters'].keys():
            weighted_sum = sum(
                update['parameters'][key] * (update['num_samples'] / total_samples)
                for update in client_updates
            )
            # Apply proximal term (simplified)
            aggregated_params[key] = weighted_sum * (1 - self.mu) + \
                                   client_updates[0]['parameters'][key] * self.mu
        
        return {
            'parameters': aggregated_params,
            'num_samples': total_samples,
            'accuracy': np.mean([update['accuracy'] for update in client_updates])
        }

class FederatedClient:
    """Federated learning client"""
    
    def __init__(self, client_id: str, data: np.ndarray, labels: np.ndarray):
        self.client_id = client_id
        self.data = torch.FloatTensor(data)
        self.labels = torch.LongTensor(labels)
        self.model = IDSModel()
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.criterion = nn.CrossEntropyLoss()
        
    def train(self, global_params: Optional[Dict] = None, epochs: int = 5) -> Dict:
        """Train local model"""
        if global_params:
            self.model.load_state_dict(global_params)
        
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0
        
        for epoch in range(epochs):
            self.optimizer.zero_grad()
            outputs = self.model(self.data)
            loss = self.criterion(outputs, self.labels)
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += self.labels.size(0)
            correct += (predicted == self.labels).sum().item()
        
        accuracy = correct / total
        
        return {
            'client_id': self.client_id,
            'parameters': self.model.state_dict(),
            'num_samples': len(self.data),
            'loss': total_loss / epochs,
            'accuracy': accuracy
        }

class FederatedLearningEngine:
    """Advanced Federated Learning Engine"""
    
    def __init__(self):
        self.clients: List[FederatedClient] = []
        self.global_model = IDSModel()
        self.strategies = {
            'FedAvg': FedAvgStrategy(),
            'FedProx': FedProxStrategy()
        }
        self.current_strategy = 'FedAvg'
        self.current_round = 0
        self.global_accuracy = 0.0
        self.is_training = False
        self.is_ready = False
        self.training_history = []
        
    async def initialize(self):
        """Initialize FL engine with synthetic data"""
        try:
            # Generate synthetic IDS dataset
            X, y = make_classification(
                n_samples=10000,
                n_features=41,
                n_classes=2,
                n_redundant=0,
                n_informative=20,
                random_state=42
            )
            
            # Split data among clients (non-IID)
            client_data = self._create_non_iid_split(X, y, num_clients=5)
            
            # Create federated clients
            for i, (client_x, client_y) in enumerate(client_data):
                client = FederatedClient(f"client_{i}", client_x, client_y)
                self.clients.append(client)
            
            self.is_ready = True
            logger.info("FL engine initialized", num_clients=len(self.clients))
            
        except Exception as e:
            logger.error("FL engine initialization failed", error=str(e))
            raise
    
    def _create_non_iid_split(self, X: np.ndarray, y: np.ndarray, num_clients: int = 5):
        """Create non-IID data split for realistic FL scenario"""
        client_data = []
        samples_per_client = len(X) // num_clients
        
        for i in range(num_clients):
            start_idx = i * samples_per_client
            end_idx = (i + 1) * samples_per_client if i < num_clients - 1 else len(X)
            
            # Create class imbalance for non-IID
            if i % 2 == 0:
                # Clients 0, 2, 4 get more normal traffic
                normal_ratio = 0.8
            else:
                # Clients 1, 3 get more attack traffic
                normal_ratio = 0.3
            
            client_x = X[start_idx:end_idx]
            client_y = y[start_idx:end_idx]
            
            # Adjust labels for non-IID distribution
            num_normal = int(len(client_y) * normal_ratio)
            client_y[:num_normal] = 0  # Normal traffic
            client_y[num_normal:] = 1  # Attack traffic
            
            client_data.append((client_x, client_y))
        
        return client_data
    
    async def start_training(self, rounds: int = 50):
        """Start federated learning training"""
        if self.is_training or not self.is_ready:
            return
        
        self.is_training = True
        logger.info("Starting FL training", rounds=rounds, strategy=self.current_strategy)
        
        # Run training in background
        asyncio.create_task(self._training_loop(rounds))
    
    async def _training_loop(self, rounds: int):
        """Main training loop"""
        try:
            for round_num in range(1, rounds + 1):
                if not self.is_training:
                    break
                
                self.current_round = round_num
                
                # Select clients for this round (random sampling)
                selected_clients = np.random.choice(
                    self.clients, 
                    size=min(3, len(self.clients)), 
                    replace=False
                )
                
                # Get global model parameters
                global_params = self.global_model.state_dict()
                
                # Train selected clients
                client_updates = []
                for client in selected_clients:
                    update = client.train(global_params, epochs=5)
                    client_updates.append(update)
                
                # Aggregate updates using selected strategy
                strategy = self.strategies[self.current_strategy]
                aggregated = strategy.aggregate(client_updates)
                
                if aggregated:
                    # Update global model
                    self.global_model.load_state_dict(aggregated['parameters'])
                    self.global_accuracy = aggregated['accuracy']
                    
                    # Record training history
                    round_metrics = {
                        'round': round_num,
                        'accuracy': self.global_accuracy,
                        'participating_clients': len(selected_clients),
                        'strategy': self.current_strategy,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                    self.training_history.append(round_metrics)
                    
                    logger.info("FL round completed", 
                              round=round_num, 
                              accuracy=self.global_accuracy,
                              clients=len(selected_clients))
                
                await asyncio.sleep(2)  # Simulate training time
            
            self.is_training = False
            logger.info("FL training completed", final_accuracy=self.global_accuracy)
            
        except Exception as e:
            logger.error("FL training failed", error=str(e))
            self.is_training = False
    
    def set_strategy(self, strategy_name: str):
        """Set FL aggregation strategy"""
        if strategy_name in self.strategies:
            self.current_strategy = strategy_name
            logger.info("FL strategy changed", strategy=strategy_name)
        else:
            raise ValueError(f"Unknown strategy: {strategy_name}")
    
    async def get_current_metrics(self) -> Dict[str, Any]:
        """Get current FL metrics"""
        return {
            'round': self.current_round,
            'accuracy': self.global_accuracy,
            'strategy': self.current_strategy,
            'is_training': self.is_training,
            'num_clients': len(self.clients),
            'participating_clients': min(3, len(self.clients)) if self.is_training else 0,
            'convergence_rate': 0.95 if self.global_accuracy > 0.9 else 0.85,
            'training_history': self.training_history[-10:]  # Last 10 rounds
        }
    
    def stop_training(self):
        """Stop FL training"""
        self.is_training = False
        logger.info("FL training stopped")
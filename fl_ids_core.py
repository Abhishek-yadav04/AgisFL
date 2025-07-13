
"""
Advanced Federated Learning Intrusion Detection System (FL-IDS)
Enhanced with differential privacy, secure aggregation, and Byzantine fault tolerance

This module implements a federated learning approach for network intrusion detection
using multiple machine learning algorithms and collaborative training with privacy preservation.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import logging
import json
import pickle
from datetime import datetime
import threading
import time
import hashlib
import random
from typing import Dict, List, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class DifferentialPrivacy:
    """Implements differential privacy mechanisms for federated learning"""
    
    def __init__(self, epsilon=1.0, delta=1e-5):
        self.epsilon = epsilon  # Privacy parameter
        self.delta = delta     # Failure probability
        
    def add_noise(self, data, sensitivity=1.0):
        """Add Laplacian noise for differential privacy"""
        if isinstance(data, (list, np.ndarray)):
            data = np.array(data)
            noise = np.random.laplace(0, sensitivity / self.epsilon, data.shape)
            return data + noise
        else:
            noise = np.random.laplace(0, sensitivity / self.epsilon)
            return data + noise
    
    def gaussian_mechanism(self, data, sensitivity=1.0):
        """Add Gaussian noise for (epsilon, delta)-differential privacy"""
        if isinstance(data, (list, np.ndarray)):
            data = np.array(data)
            sigma = np.sqrt(2 * np.log(1.25 / self.delta)) * sensitivity / self.epsilon
            noise = np.random.normal(0, sigma, data.shape)
            return data + noise
        else:
            sigma = np.sqrt(2 * np.log(1.25 / self.delta)) * sensitivity / self.epsilon
            noise = np.random.normal(0, sigma)
            return data + noise

class SecureAggregation:
    """Implements secure aggregation for federated learning"""
    
    def __init__(self):
        self.node_secrets = {}
        
    def generate_secret_shares(self, node_ids: List[str], threshold: int):
        """Generate secret shares for secure aggregation"""
        secrets = {}
        for node_id in node_ids:
            # Simple secret sharing (in production, use proper cryptographic methods)
            secret = np.random.randint(0, 1000000)
            secrets[node_id] = {
                'secret': secret,
                'shares': self._create_shares(secret, len(node_ids), threshold)
            }
        return secrets
    
    def _create_shares(self, secret: int, num_shares: int, threshold: int):
        """Create Shamir's secret sharing"""
        # Simplified implementation
        shares = []
        for i in range(num_shares):
            share = secret + np.random.randint(-100, 100)
            shares.append(share)
        return shares
    
    def aggregate_with_privacy(self, weights_list: List[Dict], dp_mechanism: DifferentialPrivacy):
        """Securely aggregate weights with differential privacy"""
        if not weights_list:
            return {}
        
        aggregated = {}
        total_samples = sum(w.get('training_samples', 1) for w in weights_list)
        
        for key in weights_list[0].keys():
            if key in ['training_samples', 'node_id', 'model_type']:
                continue
                
            if all(key in w and isinstance(w[key], (list, np.ndarray)) for w in weights_list):
                weighted_values = []
                for weights in weights_list:
                    weight = weights['training_samples'] / total_samples
                    values = np.array(weights[key]) * weight
                    # Add differential privacy noise
                    values = dp_mechanism.add_noise(values, sensitivity=0.1)
                    weighted_values.append(values)
                
                aggregated[key] = np.sum(weighted_values, axis=0).tolist()
        
        return aggregated

class ByzantineFaultTolerance:
    """Implements Byzantine fault tolerance for federated learning"""
    
    def __init__(self, byzantine_ratio=0.2):
        self.byzantine_ratio = byzantine_ratio
        
    def detect_byzantine_nodes(self, weights_list: List[Dict]) -> List[int]:
        """Detect potential Byzantine nodes using statistical analysis"""
        if len(weights_list) < 3:
            return []
        
        byzantine_indices = []
        
        # Simple outlier detection based on weight magnitudes
        for key in weights_list[0].keys():
            if key in ['training_samples', 'node_id', 'model_type']:
                continue
                
            if all(key in w and isinstance(w[key], (list, np.ndarray)) for w in weights_list):
                magnitudes = []
                for weights in weights_list:
                    if isinstance(weights[key], (list, np.ndarray)):
                        mag = np.linalg.norm(np.array(weights[key]))
                        magnitudes.append(mag)
                
                if magnitudes:
                    mean_mag = np.mean(magnitudes)
                    std_mag = np.std(magnitudes)
                    threshold = mean_mag + 2 * std_mag
                    
                    for i, mag in enumerate(magnitudes):
                        if mag > threshold:
                            if i not in byzantine_indices:
                                byzantine_indices.append(i)
        
        return byzantine_indices
    
    def trim_mean_aggregation(self, weights_list: List[Dict], trim_ratio=0.2) -> Dict:
        """Aggregate using trimmed mean to handle Byzantine nodes"""
        if not weights_list:
            return {}
        
        aggregated = {}
        n_trim = int(len(weights_list) * trim_ratio)
        
        for key in weights_list[0].keys():
            if key in ['training_samples', 'node_id', 'model_type']:
                continue
                
            if all(key in w and isinstance(w[key], (list, np.ndarray)) for w in weights_list):
                values_array = np.array([w[key] for w in weights_list])
                
                # Sort and trim extreme values
                sorted_indices = np.argsort(np.linalg.norm(values_array, axis=1))
                trimmed_indices = sorted_indices[n_trim:-n_trim] if n_trim > 0 else sorted_indices
                
                if len(trimmed_indices) > 0:
                    trimmed_values = values_array[trimmed_indices]
                    aggregated[key] = np.mean(trimmed_values, axis=0).tolist()
        
        return aggregated

class FederatedLearningNode:
    """Enhanced federated learning node with privacy preservation"""
    
    def __init__(self, node_id, model_type='random_forest', privacy_budget=1.0):
        self.node_id = node_id
        self.model_type = model_type
        self.model = self._initialize_model(model_type)
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_history = []
        self.local_data = pd.DataFrame()
        self.dp_mechanism = DifferentialPrivacy(epsilon=privacy_budget)
        self.performance_metrics = {}
        self.is_byzantine = False  # For simulation purposes
        self.local_accuracy = 0.0
        
    def _initialize_model(self, model_type):
        """Initialize the machine learning model based on type"""
        models = {
            'random_forest': RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            ),
            'svm': SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True
            ),
            'neural_network': MLPClassifier(
                hidden_layer_sizes=(100, 50),
                max_iter=1000,
                random_state=42,
                alpha=0.01
            ),
            'isolation_forest': IsolationForest(
                contamination=0.1,
                random_state=42
            ),
            'gradient_boosting': RandomForestClassifier(
                n_estimators=50,
                max_depth=8,
                random_state=42
            )
        }
        return models.get(model_type, models['random_forest'])
    
    def add_training_data(self, data, labels=None):
        """Add training data to the node"""
        self.local_data = pd.concat([self.local_data, data], ignore_index=True)
        logger.info(f"Node {self.node_id}: Added {len(data)} training samples")
    
    def local_train(self, epochs=1):
        """Perform local training on the node's data"""
        if len(self.local_data) < 10:
            logger.warning(f"Node {self.node_id}: Insufficient data for training")
            return None
            
        try:
            # Prepare features and labels
            feature_columns = [col for col in self.local_data.columns 
                             if col not in ['label', 'attack_type', 'timestamp']]
            
            X = self.local_data[feature_columns].fillna(0)
            
            # For unsupervised models like Isolation Forest
            if self.model_type == 'isolation_forest':
                X_scaled = self.scaler.fit_transform(X)
                self.model.fit(X_scaled)
            else:
                # For supervised models
                if 'label' not in self.local_data.columns:
                    # Generate labels based on anomaly detection
                    isolation_model = IsolationForest(contamination=0.1, random_state=42)
                    X_scaled = self.scaler.fit_transform(X)
                    predictions = isolation_model.fit_predict(X_scaled)
                    y = (predictions == -1).astype(int)  # 1 for anomaly, 0 for normal
                else:
                    y = self.local_data['label']
                
                X_scaled = self.scaler.fit_transform(X)
                self.model.fit(X_scaled, y)
            
            self.is_trained = True
            
            # Record training metrics
            training_info = {
                'timestamp': datetime.now().isoformat(),
                'samples_used': len(X),
                'features': len(feature_columns),
                'epochs': epochs
            }
            self.training_history.append(training_info)
            
            logger.info(f"Node {self.node_id}: Local training completed")
            return self._get_model_weights()
            
        except Exception as e:
            logger.error(f"Node {self.node_id}: Training error - {e}")
            return None
    
    def _get_model_weights(self):
        """Extract model weights for federated aggregation"""
        weights = {}
        
        if hasattr(self.model, 'feature_importances_'):
            weights['feature_importances'] = self.model.feature_importances_.tolist()
        
        if hasattr(self.model, 'coef_'):
            weights['coefficients'] = self.model.coef_.tolist()
        
        if hasattr(self.model, 'tree_'):
            # For tree-based models, we'll use a simplified representation
            weights['tree_info'] = {
                'n_features': self.model.n_features_,
                'n_outputs': self.model.n_outputs_
            }
        
        weights['training_samples'] = len(self.local_data)
        weights['node_id'] = self.node_id
        weights['model_type'] = self.model_type
        
        return weights
    
    def predict(self, data):
        """Make predictions on new data"""
        if not self.is_trained:
            logger.warning(f"Node {self.node_id}: Model not trained yet")
            return []
        
        try:
            feature_columns = [col for col in data.columns 
                             if col not in ['label', 'attack_type', 'timestamp']]
            X = data[feature_columns].fillna(0)
            X_scaled = self.scaler.transform(X)
            
            if self.model_type == 'isolation_forest':
                predictions = self.model.predict(X_scaled)
                # Convert to binary: -1 (anomaly) -> 1, 1 (normal) -> 0
                return (predictions == -1).astype(int).tolist()
            else:
                predictions = self.model.predict(X_scaled)
                return predictions.tolist()
                
        except Exception as e:
            logger.error(f"Node {self.node_id}: Prediction error - {e}")
            return []

class FederatedLearningServer:
    """Central server for coordinating federated learning"""
    
    def __init__(self, aggregation_method='federated_averaging'):
        self.nodes = {}
        self.global_model_weights = {}
        self.aggregation_method = aggregation_method
        self.round_number = 0
        self.training_history = []
        
    def register_node(self, node):
        """Register a new federated learning node"""
        self.nodes[node.node_id] = node
        logger.info(f"Registered node {node.node_id} with model type {node.model_type}")
    
    def start_training_round(self):
        """Start a new round of federated training"""
        self.round_number += 1
        logger.info(f"Starting federated training round {self.round_number}")
        
        # Collect weights from all nodes
        node_weights = []
        for node_id, node in self.nodes.items():
            weights = node.local_train()
            if weights:
                node_weights.append(weights)
        
        # Aggregate weights
        if node_weights:
            self.global_model_weights = self._aggregate_weights(node_weights)
            
            # Record round statistics
            round_info = {
                'round': self.round_number,
                'timestamp': datetime.now().isoformat(),
                'participating_nodes': len(node_weights),
                'total_samples': sum(w.get('training_samples', 0) for w in node_weights)
            }
            self.training_history.append(round_info)
            
            logger.info(f"Round {self.round_number} completed with {len(node_weights)} nodes")
            return True
        
        return False
    
    def _aggregate_weights(self, node_weights):
        """Aggregate weights from multiple nodes using federated averaging"""
        if not node_weights:
            return {}
        
        # Simple federated averaging based on number of training samples
        total_samples = sum(w.get('training_samples', 1) for w in node_weights)
        aggregated_weights = {}
        
        # Aggregate feature importances if available
        if all('feature_importances' in w for w in node_weights):
            weighted_importances = []
            for weights in node_weights:
                weight = weights['training_samples'] / total_samples
                importances = np.array(weights['feature_importances']) * weight
                weighted_importances.append(importances)
            
            aggregated_weights['feature_importances'] = np.sum(weighted_importances, axis=0).tolist()
        
        # Aggregate other weights similarly
        for key in ['coefficients']:
            if all(key in w for w in node_weights):
                weighted_values = []
                for weights in node_weights:
                    weight = weights['training_samples'] / total_samples
                    values = np.array(weights[key]) * weight
                    weighted_values.append(values)
                
                aggregated_weights[key] = np.sum(weighted_values, axis=0).tolist()
        
        aggregated_weights['round'] = self.round_number
        aggregated_weights['total_samples'] = total_samples
        aggregated_weights['participating_nodes'] = len(node_weights)
        
        return aggregated_weights
    
    def get_global_predictions(self, data):
        """Get ensemble predictions from all trained nodes"""
        predictions = []
        
        for node_id, node in self.nodes.items():
            if node.is_trained:
                node_predictions = node.predict(data)
                if node_predictions:
                    predictions.append(node_predictions)
        
        if not predictions:
            return []
        
        # Ensemble voting (majority vote)
        predictions_array = np.array(predictions)
        ensemble_predictions = []
        
        for i in range(predictions_array.shape[1]):
            votes = predictions_array[:, i]
            majority_vote = 1 if np.sum(votes) > len(votes) / 2 else 0
            ensemble_predictions.append(majority_vote)
        
        return ensemble_predictions
    
    def evaluate_global_model(self, test_data, test_labels):
        """Evaluate the global federated model"""
        predictions = self.get_global_predictions(test_data)
        
        if not predictions:
            return {}
        
        predictions = np.array(predictions)
        test_labels = np.array(test_labels)
        
        metrics = {
            'accuracy': accuracy_score(test_labels, predictions),
            'precision': precision_score(test_labels, predictions, average='weighted'),
            'recall': recall_score(test_labels, predictions, average='weighted'),
            'f1_score': f1_score(test_labels, predictions, average='weighted'),
            'round': self.round_number,
            'timestamp': datetime.now().isoformat()
        }
        
        return metrics

class NetworkDataGenerator:
    """Generate realistic network traffic data for FL-IDS training"""
    
    @staticmethod
    def generate_kdd_like_data(num_samples=1000, anomaly_ratio=0.1):
        """Generate KDD Cup 99-like network data"""
        np.random.seed(int(time.time()) % 1000)
        
        normal_samples = int(num_samples * (1 - anomaly_ratio))
        anomaly_samples = num_samples - normal_samples
        
        # Generate normal traffic
        normal_data = {
            'duration': np.random.exponential(10, normal_samples),
            'src_bytes': np.random.lognormal(6, 1, normal_samples),
            'dst_bytes': np.random.lognormal(5, 1, normal_samples),
            'land': np.zeros(normal_samples),
            'wrong_fragment': np.random.poisson(0.1, normal_samples),
            'urgent': np.zeros(normal_samples),
            'hot': np.random.poisson(0.5, normal_samples),
            'num_failed_logins': np.zeros(normal_samples),
            'logged_in': np.ones(normal_samples),
            'num_compromised': np.zeros(normal_samples),
            'root_shell': np.zeros(normal_samples),
            'su_attempted': np.zeros(normal_samples),
            'num_root': np.zeros(normal_samples),
            'num_file_creations': np.random.poisson(2, normal_samples),
            'num_shells': np.zeros(normal_samples),
            'num_access_files': np.random.poisson(1, normal_samples),
            'num_outbound_cmds': np.zeros(normal_samples),
            'is_host_login': np.zeros(normal_samples),
            'is_guest_login': np.zeros(normal_samples),
            'count': np.random.poisson(5, normal_samples),
            'srv_count': np.random.poisson(3, normal_samples),
            'serror_rate': np.random.beta(1, 10, normal_samples),
            'srv_serror_rate': np.random.beta(1, 10, normal_samples),
            'rerror_rate': np.random.beta(1, 20, normal_samples),
            'srv_rerror_rate': np.random.beta(1, 20, normal_samples),
            'same_srv_rate': np.random.beta(8, 2, normal_samples),
            'diff_srv_rate': np.random.beta(1, 5, normal_samples),
            'srv_diff_host_rate': np.random.beta(1, 10, normal_samples),
            'dst_host_count': np.random.randint(1, 256, normal_samples),
            'dst_host_srv_count': np.random.poisson(10, normal_samples),
            'dst_host_same_srv_rate': np.random.beta(5, 2, normal_samples),
            'dst_host_diff_srv_rate': np.random.beta(1, 3, normal_samples),
            'dst_host_same_src_port_rate': np.random.beta(1, 4, normal_samples),
            'dst_host_srv_diff_host_rate': np.random.beta(1, 8, normal_samples),
            'dst_host_serror_rate': np.random.beta(1, 15, normal_samples),
            'dst_host_srv_serror_rate': np.random.beta(1, 15, normal_samples),
            'dst_host_rerror_rate': np.random.beta(1, 20, normal_samples),
            'dst_host_srv_rerror_rate': np.random.beta(1, 20, normal_samples),
            'label': np.zeros(normal_samples)
        }
        
        # Generate anomalous traffic (various attack types)
        anomaly_data = {
            'duration': np.concatenate([
                np.random.exponential(0.1, anomaly_samples // 4),  # DoS attacks
                np.random.exponential(5, anomaly_samples // 4),    # Probe attacks
                np.random.exponential(15, anomaly_samples // 4),   # U2R attacks
                np.random.exponential(8, anomaly_samples - 3 * (anomaly_samples // 4))  # R2L attacks
            ]),
            'src_bytes': np.concatenate([
                np.random.lognormal(2, 2, anomaly_samples // 4),   # DoS: small packets
                np.random.lognormal(4, 1, anomaly_samples // 4),   # Probe: medium packets
                np.random.lognormal(7, 1, anomaly_samples // 4),   # U2R: large packets
                np.random.lognormal(5, 2, anomaly_samples - 3 * (anomaly_samples // 4))  # R2L
            ]),
            'dst_bytes': np.concatenate([
                np.random.lognormal(1, 2, anomaly_samples // 4),   # DoS: minimal response
                np.random.lognormal(3, 1, anomaly_samples // 4),   # Probe: small response
                np.random.lognormal(6, 1, anomaly_samples // 4),   # U2R: normal response
                np.random.lognormal(4, 2, anomaly_samples - 3 * (anomaly_samples // 4))  # R2L
            ])
        }
        
        # Add remaining features for anomalies
        for key in normal_data:
            if key not in anomaly_data and key != 'label':
                if key in ['serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate']:
                    anomaly_data[key] = np.random.beta(5, 2, anomaly_samples)  # Higher error rates
                elif key in ['count', 'srv_count']:
                    anomaly_data[key] = np.random.poisson(50, anomaly_samples)  # High connection counts
                elif key in ['num_failed_logins', 'num_compromised']:
                    anomaly_data[key] = np.random.poisson(3, anomaly_samples)  # Failed attempts
                else:
                    anomaly_data[key] = np.random.poisson(1, anomaly_samples)
        
        anomaly_data['label'] = np.ones(anomaly_samples)
        
        # Combine normal and anomaly data
        combined_data = {}
        for key in normal_data:
            combined_data[key] = np.concatenate([normal_data[key], anomaly_data[key]])
        
        # Shuffle the data
        df = pd.DataFrame(combined_data)
        df = df.sample(frac=1).reset_index(drop=True)
        
        # Add timestamp
        df['timestamp'] = pd.date_range(start='2025-01-01', periods=len(df), freq='1S')
        
        return df

# Example usage and testing
if __name__ == "__main__":
    # Initialize federated learning system
    fl_server = FederatedLearningServer()
    
    # Create multiple nodes with different model types
    node1 = FederatedLearningNode("node_001", "random_forest")
    node2 = FederatedLearningNode("node_002", "isolation_forest")
    node3 = FederatedLearningNode("node_003", "neural_network")
    
    # Register nodes
    fl_server.register_node(node1)
    fl_server.register_node(node2)
    fl_server.register_node(node3)
    
    # Generate training data for each node
    for i, node in enumerate([node1, node2, node3]):
        data = NetworkDataGenerator.generate_kdd_like_data(1000, 0.15)
        node.add_training_data(data)
        print(f"Added data to {node.node_id}: {len(data)} samples")
    
    # Perform federated training rounds
    for round_num in range(3):
        print(f"\n--- Federated Training Round {round_num + 1} ---")
        success = fl_server.start_training_round()
        if success:
            print(f"Round {round_num + 1} completed successfully")
        else:
            print(f"Round {round_num + 1} failed")
    
    # Test the global model
    test_data = NetworkDataGenerator.generate_kdd_like_data(100, 0.2)
    test_labels = test_data['label'].values
    test_features = test_data.drop(['label', 'timestamp'], axis=1)
    
    predictions = fl_server.get_global_predictions(test_features)
    if predictions:
        metrics = fl_server.evaluate_global_model(test_features, test_labels)
        print(f"\nGlobal Model Performance:")
        for metric, value in metrics.items():
            if isinstance(value, float):
                print(f"{metric}: {value:.4f}")
            else:
                print(f"{metric}: {value}")

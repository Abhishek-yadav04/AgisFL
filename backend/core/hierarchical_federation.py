"""
Hierarchical Federated Learning Architecture
Implements multi-tier federation with regional combiners for massive scale

This module provides the architecture for hierarchical FL that can scale to
thousands of clients by introducing intermediate aggregation nodes (combiners)
that perform regional aggregation before sending to the central orchestrator.
"""

import asyncio
import time
from typing import Dict, List, Set, Optional, Any, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
import threading
from concurrent.futures import ThreadPoolExecutor, Future
import structlog
import uuid
import json

logger = structlog.get_logger(__name__)

class NodeType(Enum):
    """Types of nodes in the hierarchical federation"""
    CLIENT = "client"
    COMBINER = "combiner"
    ORCHESTRATOR = "orchestrator"

class NodeStatus(Enum):
    """Status of nodes in the hierarchy"""
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    FAILED = "failed"
    MAINTENANCE = "maintenance"

@dataclass
class NodeInfo:
    """Information about a node in the hierarchical federation"""
    node_id: str
    node_type: NodeType
    status: NodeStatus = NodeStatus.OFFLINE
    region: str = "default"
    capabilities: Dict[str, Any] = field(default_factory=dict)
    parent_node: Optional[str] = None
    child_nodes: Set[str] = field(default_factory=set)
    last_heartbeat: float = field(default_factory=time.time)
    load_factor: float = 0.0  # 0.0 = idle, 1.0 = fully loaded
    performance_metrics: Dict[str, float] = field(default_factory=dict)

@dataclass
class HierarchicalRoundConfig:
    """Configuration for hierarchical federated learning round"""
    round_id: str
    min_clients_per_combiner: int = 5
    max_clients_per_combiner: int = 50
    min_combiners: int = 2
    combiner_timeout: float = 300.0  # 5 minutes
    orchestrator_timeout: float = 600.0  # 10 minutes
    aggregation_strategy: str = "weighted_average"
    fault_tolerance_level: float = 0.8  # 80% participation required

class CombinerNode:
    """
    Regional Combiner Node for Hierarchical Federation
    Performs initial aggregation for clients in a specific region
    """
    
    def __init__(self, combiner_id: str, region: str, max_clients: int = 50):
        """
        Initialize combiner node
        
        Args:
            combiner_id: Unique identifier for this combiner
            region: Geographic or logical region this combiner serves
            max_clients: Maximum number of clients this combiner can handle
        """
        self.combiner_id = combiner_id
        self.region = region
        self.max_clients = max_clients
        self.status = NodeStatus.ONLINE
        
        # Client management
        self.registered_clients: Dict[str, NodeInfo] = {}
        self.active_clients: Set[str] = set()
        
        # Round management
        self.current_round: Optional[str] = None
        self.round_state: Dict[str, Any] = {}
        self.client_updates: Dict[str, Any] = {}
        
        # Performance tracking
        self.aggregation_times: List[float] = []
        self.throughput_history: List[float] = []
        
        # Synchronization
        self.lock = threading.RLock()
        
        logger.info("combiner_initialized",
                   combiner_id=combiner_id,
                   region=region,
                   max_clients=max_clients)
    
    def register_client(self, client_id: str, client_capabilities: Dict[str, Any]) -> bool:
        """
        Register a client with this combiner
        
        Args:
            client_id: Unique client identifier
            client_capabilities: Client capabilities and metadata
            
        Returns:
            True if registration successful
        """
        with self.lock:
            if len(self.registered_clients) >= self.max_clients:
                logger.warning("combiner_at_capacity",
                             combiner_id=self.combiner_id,
                             current_clients=len(self.registered_clients),
                             max_clients=self.max_clients)
                return False
            
            if client_id in self.registered_clients:
                logger.warning("client_already_registered",
                             combiner_id=self.combiner_id,
                             client_id=client_id)
                return False
            
            client_info = NodeInfo(
                node_id=client_id,
                node_type=NodeType.CLIENT,
                status=NodeStatus.ONLINE,
                region=self.region,
                capabilities=client_capabilities,
                parent_node=self.combiner_id
            )
            
            self.registered_clients[client_id] = client_info
            
            logger.info("client_registered_to_combiner",
                       combiner_id=self.combiner_id,
                       client_id=client_id,
                       total_clients=len(self.registered_clients))
            
            return True
    
    def start_regional_round(self, round_id: str, selected_clients: List[str]) -> Dict[str, Any]:
        """
        Start a federated learning round for this region
        
        Args:
            round_id: Global round identifier
            selected_clients: List of clients selected for this round
            
        Returns:
            Round configuration for clients
        """
        with self.lock:
            if self.current_round is not None:
                logger.warning("combiner_round_already_active",
                             combiner_id=self.combiner_id,
                             current_round=self.current_round)
                return {'success': False, 'error': 'Round already active'}
            
            # Filter selected clients to only those registered with this combiner
            valid_clients = [client_id for client_id in selected_clients 
                           if client_id in self.registered_clients]
            
            if not valid_clients:
                logger.warning("no_valid_clients_for_round",
                             combiner_id=self.combiner_id,
                             round_id=round_id)
                return {'success': False, 'error': 'No valid clients'}
            
            self.current_round = round_id
            self.round_state = {
                'round_id': round_id,
                'start_time': time.time(),
                'selected_clients': valid_clients,
                'completed_clients': set(),
                'failed_clients': set(),
                'status': 'active'
            }
            self.client_updates = {}
            self.active_clients = set(valid_clients)
            
            # Update client status
            for client_id in valid_clients:
                if client_id in self.registered_clients:
                    self.registered_clients[client_id].status = NodeStatus.BUSY
            
            logger.info("regional_round_started",
                       combiner_id=self.combiner_id,
                       round_id=round_id,
                       selected_clients=len(valid_clients))
            
            return {
                'success': True,
                'round_id': round_id,
                'combiner_id': self.combiner_id,
                'selected_clients': valid_clients,
                'region': self.region
            }
    
    def receive_client_update(self, client_id: str, model_update: Any, 
                            metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Receive and store a model update from a client
        
        Args:
            client_id: Client identifier
            model_update: Client's model update
            metadata: Additional metadata (accuracy, loss, etc.)
            
        Returns:
            True if update was accepted
        """
        with self.lock:
            if self.current_round is None:
                logger.warning("no_active_round_for_update",
                             combiner_id=self.combiner_id,
                             client_id=client_id)
                return False
            
            if client_id not in self.active_clients:
                logger.warning("update_from_non_participating_client",
                             combiner_id=self.combiner_id,
                             client_id=client_id)
                return False
            
            # Store the update
            self.client_updates[client_id] = {
                'model_update': model_update,
                'metadata': metadata or {},
                'timestamp': time.time()
            }
            
            self.round_state['completed_clients'].add(client_id)
            
            # Update client status
            if client_id in self.registered_clients:
                self.registered_clients[client_id].status = NodeStatus.ONLINE
            
            logger.info("client_update_received",
                       combiner_id=self.combiner_id,
                       client_id=client_id,
                       round_id=self.current_round,
                       completed_count=len(self.round_state['completed_clients']))
            
            return True
    
    def perform_regional_aggregation(self) -> Optional[Dict[str, Any]]:
        """
        Perform aggregation of client updates in this region
        
        Returns:
            Aggregated result or None if insufficient updates
        """
        with self.lock:
            if self.current_round is None:
                logger.error("no_active_round_for_aggregation",
                           combiner_id=self.combiner_id)
                return None
            
            completed_clients = self.round_state['completed_clients']
            if len(completed_clients) < 2:  # Need at least 2 clients
                logger.warning("insufficient_clients_for_aggregation",
                             combiner_id=self.combiner_id,
                             completed=len(completed_clients))
                return None
            
            start_time = time.time()
            
            # Extract model updates and weights
            model_updates = []
            client_weights = []
            
            for client_id in completed_clients:
                if client_id in self.client_updates:
                    update_data = self.client_updates[client_id]
                    model_updates.append(update_data['model_update'])
                    
                    # Use data size as weight, default to 1.0
                    weight = update_data['metadata'].get('num_samples', 1.0)
                    client_weights.append(weight)
            
            if not model_updates:
                logger.error("no_model_updates_for_aggregation",
                           combiner_id=self.combiner_id)
                return None
            
            # Perform weighted average aggregation
            try:
                aggregated_update = self._weighted_average_aggregation(model_updates, client_weights)
                
                aggregation_time = time.time() - start_time
                self.aggregation_times.append(aggregation_time)
                
                # Calculate regional statistics
                regional_stats = self._calculate_regional_statistics()
                
                result = {
                    'combiner_id': self.combiner_id,
                    'region': self.region,
                    'round_id': self.current_round,
                    'aggregated_update': aggregated_update,
                    'num_clients': len(completed_clients),
                    'client_weights': client_weights,
                    'aggregation_time': aggregation_time,
                    'regional_statistics': regional_stats,
                    'timestamp': time.time()
                }
                
                logger.info("regional_aggregation_completed",
                           combiner_id=self.combiner_id,
                           round_id=self.current_round,
                           num_clients=len(completed_clients),
                           aggregation_time=aggregation_time)
                
                return result
                
            except Exception as e:
                logger.exception("regional_aggregation_failed",
                               combiner_id=self.combiner_id,
                               error=str(e))
                return None
    
    def _weighted_average_aggregation(self, model_updates: List[Any], weights: List[float]) -> Any:
        """Perform weighted average aggregation of model updates"""
        if not model_updates:
            raise ValueError("No model updates to aggregate")
        
        total_weight = sum(weights)
        if total_weight == 0:
            raise ValueError("Total weight is zero")
        
        # Normalize weights
        normalized_weights = [w / total_weight for w in weights]
        
        # Handle different types of model updates
        if hasattr(model_updates[0], 'keys'):  # Dictionary-like (state dict)
            aggregated = {}
            for key in model_updates[0].keys():
                # Weighted average for each parameter
                weighted_sum = sum(w * update[key] for w, update in zip(normalized_weights, model_updates))
                aggregated[key] = weighted_sum
            return aggregated
        
        elif hasattr(model_updates[0], 'shape'):  # Tensor-like
            import torch
            # Weighted average for tensors
            weighted_sum = sum(w * update for w, update in zip(normalized_weights, model_updates))
            return weighted_sum
        
        else:
            # Fallback for other types
            return model_updates[0]  # Return first update if can't aggregate
    
    def _calculate_regional_statistics(self) -> Dict[str, Any]:
        """Calculate statistics for this region"""
        completed_count = len(self.round_state['completed_clients'])
        selected_count = len(self.round_state['selected_clients'])
        
        participation_rate = completed_count / selected_count if selected_count > 0 else 0
        
        # Calculate average metrics from client updates
        total_samples = 0
        accuracies = []
        
        for client_id in self.round_state['completed_clients']:
            if client_id in self.client_updates:
                metadata = self.client_updates[client_id]['metadata']
                total_samples += metadata.get('num_samples', 0)
                if 'accuracy' in metadata:
                    accuracies.append(metadata['accuracy'])
        
        avg_accuracy = sum(accuracies) / len(accuracies) if accuracies else 0.0
        
        return {
            'participation_rate': participation_rate,
            'total_samples': total_samples,
            'average_accuracy': avg_accuracy,
            'num_participating_clients': completed_count,
            'aggregation_count': len(self.aggregation_times)
        }
    
    def finalize_round(self) -> None:
        """Finalize the current round and clean up"""
        with self.lock:
            if self.current_round is None:
                return
            
            # Reset client status
            for client_id in self.registered_clients:
                if self.registered_clients[client_id].status == NodeStatus.BUSY:
                    self.registered_clients[client_id].status = NodeStatus.ONLINE
            
            # Clear round state
            self.current_round = None
            self.round_state = {}
            self.client_updates = {}
            self.active_clients = set()
            
            logger.info("round_finalized", combiner_id=self.combiner_id)
    
    def get_combiner_status(self) -> Dict[str, Any]:
        """Get current status and statistics for this combiner"""
        with self.lock:
            avg_aggregation_time = (sum(self.aggregation_times) / len(self.aggregation_times) 
                                  if self.aggregation_times else 0.0)
            
            return {
                'combiner_id': self.combiner_id,
                'region': self.region,
                'status': self.status.value,
                'registered_clients': len(self.registered_clients),
                'max_clients': self.max_clients,
                'capacity_utilization': len(self.registered_clients) / self.max_clients,
                'current_round': self.current_round,
                'active_clients': len(self.active_clients),
                'average_aggregation_time': avg_aggregation_time,
                'total_aggregations': len(self.aggregation_times),
                'last_update': time.time()
            }

class HierarchicalOrchestrator:
    """
    Central Orchestrator for Hierarchical Federated Learning
    Coordinates multiple combiners and performs final global aggregation
    """
    
    def __init__(self, orchestrator_id: str = "global_orchestrator"):
        """
        Initialize hierarchical orchestrator
        
        Args:
            orchestrator_id: Unique identifier for this orchestrator
        """
        self.orchestrator_id = orchestrator_id
        self.combiners: Dict[str, CombinerNode] = {}
        self.combiner_metadata: Dict[str, NodeInfo] = {}
        
        # Global round management
        self.current_global_round: Optional[str] = None
        self.global_round_state: Dict[str, Any] = {}
        self.combiner_results: Dict[str, Any] = {}
        
        # Performance tracking
        self.global_aggregation_times: List[float] = []
        self.round_statistics: List[Dict[str, Any]] = []
        
        # Synchronization
        self.lock = threading.RLock()
        
        logger.info("hierarchical_orchestrator_initialized",
                   orchestrator_id=orchestrator_id)
    
    def register_combiner(self, combiner: CombinerNode) -> bool:
        """
        Register a combiner with this orchestrator
        
        Args:
            combiner: Combiner node to register
            
        Returns:
            True if registration successful
        """
        with self.lock:
            if combiner.combiner_id in self.combiners:
                logger.warning("combiner_already_registered",
                             combiner_id=combiner.combiner_id)
                return False
            
            self.combiners[combiner.combiner_id] = combiner
            
            # Create metadata entry
            combiner_info = NodeInfo(
                node_id=combiner.combiner_id,
                node_type=NodeType.COMBINER,
                status=NodeStatus.ONLINE,
                region=combiner.region,
                capabilities={'max_clients': combiner.max_clients}
            )
            self.combiner_metadata[combiner.combiner_id] = combiner_info
            
            logger.info("combiner_registered",
                       orchestrator_id=self.orchestrator_id,
                       combiner_id=combiner.combiner_id,
                       region=combiner.region,
                       total_combiners=len(self.combiners))
            
            return True
    
    def start_global_round(self, round_config: HierarchicalRoundConfig) -> Dict[str, Any]:
        """
        Start a global federated learning round across all combiners
        
        Args:
            round_config: Configuration for this round
            
        Returns:
            Round start status and information
        """
        with self.lock:
            if self.current_global_round is not None:
                logger.warning("global_round_already_active",
                             current_round=self.current_global_round)
                return {'success': False, 'error': 'Global round already active'}
            
            if len(self.combiners) < round_config.min_combiners:
                logger.warning("insufficient_combiners",
                             available=len(self.combiners),
                             required=round_config.min_combiners)
                return {'success': False, 'error': 'Insufficient combiners'}
            
            self.current_global_round = round_config.round_id
            self.global_round_state = {
                'round_id': round_config.round_id,
                'start_time': time.time(),
                'config': round_config,
                'participating_combiners': list(self.combiners.keys()),
                'completed_combiners': set(),
                'failed_combiners': set(),
                'status': 'active'
            }
            self.combiner_results = {}
            
            # Start regional rounds on all combiners
            regional_results = {}
            for combiner_id, combiner in self.combiners.items():
                # For simplicity, select all clients from each combiner
                # In practice, you'd implement more sophisticated client selection
                selected_clients = list(combiner.registered_clients.keys())
                
                if len(selected_clients) >= round_config.min_clients_per_combiner:
                    result = combiner.start_regional_round(round_config.round_id, selected_clients)
                    regional_results[combiner_id] = result
                else:
                    logger.warning("combiner_insufficient_clients",
                                 combiner_id=combiner_id,
                                 available=len(selected_clients),
                                 required=round_config.min_clients_per_combiner)
                    self.global_round_state['failed_combiners'].add(combiner_id)
            
            logger.info("global_round_started",
                       round_id=round_config.round_id,
                       participating_combiners=len(regional_results),
                       total_combiners=len(self.combiners))
            
            return {
                'success': True,
                'round_id': round_config.round_id,
                'participating_combiners': len(regional_results),
                'regional_results': regional_results
            }
    
    def receive_combiner_result(self, combiner_id: str, aggregated_result: Dict[str, Any]) -> bool:
        """
        Receive aggregated result from a combiner
        
        Args:
            combiner_id: Combiner identifier
            aggregated_result: Aggregated result from the combiner
            
        Returns:
            True if result was accepted
        """
        with self.lock:
            if self.current_global_round is None:
                logger.warning("no_active_global_round",
                             combiner_id=combiner_id)
                return False
            
            if combiner_id not in self.combiners:
                logger.warning("unknown_combiner_result",
                             combiner_id=combiner_id)
                return False
            
            # Store the combiner result
            self.combiner_results[combiner_id] = aggregated_result
            self.global_round_state['completed_combiners'].add(combiner_id)
            
            logger.info("combiner_result_received",
                       round_id=self.current_global_round,
                       combiner_id=combiner_id,
                       num_clients=aggregated_result.get('num_clients', 0),
                       completed_combiners=len(self.global_round_state['completed_combiners']))
            
            return True
    
    def perform_global_aggregation(self) -> Optional[Dict[str, Any]]:
        """
        Perform global aggregation of combiner results
        
        Returns:
            Global aggregated result or None if insufficient results
        """
        with self.lock:
            if self.current_global_round is None:
                logger.error("no_active_global_round_for_aggregation")
                return None
            
            if len(self.combiner_results) < 2:  # Need at least 2 combiners
                logger.warning("insufficient_combiner_results",
                             available=len(self.combiner_results))
                return None
            
            start_time = time.time()
            
            # Extract combiner updates and weights
            combiner_updates = []
            combiner_weights = []
            
            total_clients = 0
            regional_stats = {}
            
            for combiner_id, result in self.combiner_results.items():
                combiner_updates.append(result['aggregated_update'])
                combiner_weights.append(result['num_clients'])  # Weight by number of clients
                total_clients += result['num_clients']
                regional_stats[combiner_id] = result['regional_statistics']
            
            try:
                # Perform weighted average aggregation
                global_update = self._global_weighted_aggregation(combiner_updates, combiner_weights)
                
                aggregation_time = time.time() - start_time
                self.global_aggregation_times.append(aggregation_time)
                
                # Calculate global statistics
                global_stats = self._calculate_global_statistics(regional_stats, total_clients)
                
                result = {
                    'round_id': self.current_global_round,
                    'global_model_update': global_update,
                    'total_clients': total_clients,
                    'participating_combiners': len(self.combiner_results),
                    'aggregation_time': aggregation_time,
                    'regional_statistics': regional_stats,
                    'global_statistics': global_stats,
                    'timestamp': time.time()
                }
                
                # Store round statistics
                self.round_statistics.append(global_stats)
                
                logger.info("global_aggregation_completed",
                           round_id=self.current_global_round,
                           total_clients=total_clients,
                           combiners=len(self.combiner_results),
                           aggregation_time=aggregation_time)
                
                return result
                
            except Exception as e:
                logger.exception("global_aggregation_failed",
                               round_id=self.current_global_round,
                               error=str(e))
                return None
    
    def _global_weighted_aggregation(self, combiner_updates: List[Any], weights: List[int]) -> Any:
        """Perform weighted average aggregation of combiner results"""
        if not combiner_updates:
            raise ValueError("No combiner updates to aggregate")
        
        total_weight = sum(weights)
        if total_weight == 0:
            raise ValueError("Total weight is zero")
        
        # Normalize weights
        normalized_weights = [w / total_weight for w in weights]
        
        # Handle different types of updates (same logic as combiner)
        if hasattr(combiner_updates[0], 'keys'):  # Dictionary-like
            aggregated = {}
            for key in combiner_updates[0].keys():
                weighted_sum = sum(w * update[key] for w, update in zip(normalized_weights, combiner_updates))
                aggregated[key] = weighted_sum
            return aggregated
        
        elif hasattr(combiner_updates[0], 'shape'):  # Tensor-like
            import torch
            weighted_sum = sum(w * update for w, update in zip(normalized_weights, combiner_updates))
            return weighted_sum
        
        else:
            return combiner_updates[0]
    
    def _calculate_global_statistics(self, regional_stats: Dict[str, Dict[str, Any]], 
                                   total_clients: int) -> Dict[str, Any]:
        """Calculate global statistics from regional statistics"""
        total_samples = sum(stats['total_samples'] for stats in regional_stats.values())
        
        # Weighted average accuracy
        weighted_accuracy = 0.0
        total_weight = 0.0
        
        for combiner_id, stats in regional_stats.items():
            weight = stats['total_samples']
            weighted_accuracy += weight * stats['average_accuracy']
            total_weight += weight
        
        global_accuracy = weighted_accuracy / total_weight if total_weight > 0 else 0.0
        
        # Calculate participation rates
        total_participation = sum(stats['participation_rate'] for stats in regional_stats.values())
        avg_participation_rate = total_participation / len(regional_stats) if regional_stats else 0.0
        
        return {
            'total_clients': total_clients,
            'total_samples': total_samples,
            'global_accuracy': global_accuracy,
            'average_participation_rate': avg_participation_rate,
            'num_regions': len(regional_stats),
            'round_timestamp': time.time()
        }
    
    def finalize_global_round(self) -> None:
        """Finalize the current global round"""
        with self.lock:
            if self.current_global_round is None:
                return
            
            # Finalize all combiner rounds
            for combiner in self.combiners.values():
                combiner.finalize_round()
            
            # Clear global round state
            self.current_global_round = None
            self.global_round_state = {}
            self.combiner_results = {}
            
            logger.info("global_round_finalized", orchestrator_id=self.orchestrator_id)
    
    def get_hierarchy_status(self) -> Dict[str, Any]:
        """Get status of the entire hierarchical federation"""
        with self.lock:
            combiner_statuses = {}
            total_clients = 0
            
            for combiner_id, combiner in self.combiners.items():
                status = combiner.get_combiner_status()
                combiner_statuses[combiner_id] = status
                total_clients += status['registered_clients']
            
            avg_global_aggregation_time = (sum(self.global_aggregation_times) / len(self.global_aggregation_times)
                                         if self.global_aggregation_times else 0.0)
            
            return {
                'orchestrator_id': self.orchestrator_id,
                'current_global_round': self.current_global_round,
                'total_combiners': len(self.combiners),
                'total_clients': total_clients,
                'combiner_statuses': combiner_statuses,
                'global_rounds_completed': len(self.round_statistics),
                'average_global_aggregation_time': avg_global_aggregation_time,
                'hierarchy_health': self._assess_hierarchy_health(),
                'last_update': time.time()
            }
    
    def _assess_hierarchy_health(self) -> str:
        """Assess the health of the hierarchical federation"""
        if not self.combiners:
            return "no_combiners"
        
        online_combiners = sum(1 for combiner in self.combiners.values() 
                             if combiner.status == NodeStatus.ONLINE)
        health_ratio = online_combiners / len(self.combiners)
        
        if health_ratio >= 0.9:
            return "excellent"
        elif health_ratio >= 0.7:
            return "good"
        elif health_ratio >= 0.5:
            return "fair"
        else:
            return "poor"

"""
Asynchronous Federated Learning Protocols
Implements fault-tolerant, asynchronous FL protocols that handle client dropouts,
network failures, and varying client capabilities.

This module provides the foundation for building resilient FL systems that can
operate in real-world conditions with unreliable clients and networks.
"""

import asyncio
import time
from typing import Dict, List, Set, Optional, Any, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
import threading
from concurrent.futures import ThreadPoolExecutor, Future
import structlog

logger = structlog.get_logger(__name__)

class ClientStatus(Enum):
    """Client status in the federated learning system"""
    IDLE = "idle"
    SELECTED = "selected"
    TRAINING = "training"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    DROPPED = "dropped"
    OFFLINE = "offline"

class AggregationStrategy(Enum):
    """Strategies for handling partial client participation"""
    QUORUM_BASED = "quorum_based"        # Wait for minimum number of clients
    TIMEOUT_BASED = "timeout_based"      # Wait for fixed time period
    HYBRID = "hybrid"                    # Combination of quorum and timeout
    ADAPTIVE = "adaptive"                # Dynamically adjust based on conditions

@dataclass
class ClientInfo:
    """Information about a federated learning client"""
    client_id: str
    status: ClientStatus = ClientStatus.IDLE
    last_seen: float = field(default_factory=time.time)
    training_start_time: Optional[float] = None
    completion_time: Optional[float] = None
    model_size: int = 0
    data_size: int = 0
    compute_capability: float = 1.0  # Relative compute power
    network_quality: float = 1.0     # Network reliability score
    participation_history: List[bool] = field(default_factory=list)
    failure_count: int = 0
    avg_training_time: float = 0.0
    reliability_score: float = 1.0

@dataclass
class RoundConfig:
    """Configuration for a federated learning round"""
    round_id: str
    min_clients: int = 2              # Minimum clients required
    max_clients: int = 100            # Maximum clients to select
    target_clients: int = 10          # Target number of clients
    timeout_seconds: float = 300.0    # Round timeout
    quorum_threshold: float = 0.6     # Minimum fraction of selected clients
    strategy: AggregationStrategy = AggregationStrategy.HYBRID
    max_stragglers: int = 2           # Maximum slow clients to tolerate
    backup_clients: int = 3           # Number of backup clients to select

class AsyncFLCoordinator:
    """
    Asynchronous Federated Learning Coordinator
    Manages client selection, round coordination, and fault tolerance
    """
    
    def __init__(self, config: RoundConfig):
        """
        Initialize async FL coordinator
        
        Args:
            config: Round configuration parameters
        """
        self.config = config
        self.clients: Dict[str, ClientInfo] = {}
        self.active_rounds: Dict[str, Dict[str, Any]] = {}
        self.round_results: Dict[str, Dict[str, Any]] = {}
        
        # Synchronization primitives
        self.client_lock = threading.RLock()
        self.round_lock = threading.RLock()
        
        # Background tasks
        self.executor = ThreadPoolExecutor(max_workers=10)
        self.background_tasks: List[Future] = []
        
        # Monitoring
        self.start_time = time.time()
        self.total_rounds = 0
        self.successful_rounds = 0
        
        logger.info("async_fl_coordinator_initialized", 
                   config=config.__dict__)
    
    def register_client(self, client_id: str, capabilities: Dict[str, Any]) -> bool:
        """
        Register a new client with the coordinator
        
        Args:
            client_id: Unique client identifier
            capabilities: Client capabilities (compute, network, data size)
            
        Returns:
            True if registration successful
        """
        with self.client_lock:
            if client_id in self.clients:
                logger.warning("client_already_registered", client_id=client_id)
                return False
            
            client_info = ClientInfo(
                client_id=client_id,
                status=ClientStatus.IDLE,
                compute_capability=capabilities.get('compute_power', 1.0),
                network_quality=capabilities.get('network_quality', 1.0),
                data_size=capabilities.get('data_size', 0)
            )
            
            self.clients[client_id] = client_info
            
            logger.info("client_registered",
                       client_id=client_id,
                       capabilities=capabilities,
                       total_clients=len(self.clients))
            
            return True
    
    def update_client_status(self, client_id: str, status: ClientStatus, 
                           metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update client status and metadata
        
        Args:
            client_id: Client identifier
            status: New client status
            metadata: Additional metadata
            
        Returns:
            True if update successful
        """
        with self.client_lock:
            if client_id not in self.clients:
                logger.warning("unknown_client_status_update", client_id=client_id)
                return False
            
            client = self.clients[client_id]
            old_status = client.status
            client.status = status
            client.last_seen = time.time()
            
            # Update timing information
            if status == ClientStatus.TRAINING:
                client.training_start_time = time.time()
            elif status == ClientStatus.COMPLETED:
                if client.training_start_time:
                    training_time = time.time() - client.training_start_time
                    client.avg_training_time = (client.avg_training_time + training_time) / 2
                client.completion_time = time.time()
            elif status == ClientStatus.FAILED:
                client.failure_count += 1
                client.reliability_score *= 0.9  # Decrease reliability
            
            # Update metadata
            if metadata:
                if 'model_size' in metadata:
                    client.model_size = metadata['model_size']
                if 'accuracy' in metadata:
                    # Could track client-specific metrics
                    pass
            
            logger.debug("client_status_updated",
                        client_id=client_id,
                        old_status=old_status.value,
                        new_status=status.value,
                        metadata=metadata)
            
            return True
    
    def select_clients_for_round(self, round_id: str) -> List[str]:
        """
        Intelligently select clients for a federated learning round
        
        Args:
            round_id: Round identifier
            
        Returns:
            List of selected client IDs
        """
        with self.client_lock:
            # Get available clients
            available_clients = [
                client_id for client_id, client in self.clients.items()
                if client.status == ClientStatus.IDLE and 
                time.time() - client.last_seen < 300  # Active within 5 minutes
            ]
            
            if len(available_clients) < self.config.min_clients:
                logger.warning("insufficient_clients_for_round",
                             round_id=round_id,
                             available=len(available_clients),
                             required=self.config.min_clients)
                return []
            
            # Score clients based on multiple factors
            client_scores = {}
            for client_id in available_clients:
                client = self.clients[client_id]
                score = self._calculate_client_score(client)
                client_scores[client_id] = score
            
            # Sort by score and select top clients
            sorted_clients = sorted(client_scores.items(), key=lambda x: x[1], reverse=True)
            
            # Select primary clients
            num_primary = min(self.config.target_clients, len(sorted_clients))
            selected_clients = [client_id for client_id, _ in sorted_clients[:num_primary]]
            
            # Select backup clients
            remaining_clients = sorted_clients[num_primary:]
            num_backup = min(self.config.backup_clients, len(remaining_clients))
            backup_clients = [client_id for client_id, _ in remaining_clients[:num_backup]]
            
            # Mark selected clients
            for client_id in selected_clients:
                self.clients[client_id].status = ClientStatus.SELECTED
            
            logger.info("clients_selected_for_round",
                       round_id=round_id,
                       primary_clients=len(selected_clients),
                       backup_clients=len(backup_clients),
                       total_available=len(available_clients))
            
            return selected_clients, backup_clients
    
    def _calculate_client_score(self, client: ClientInfo) -> float:
        """Calculate client selection score based on multiple factors"""
        # Base score from reliability
        score = client.reliability_score * 0.4
        
        # Network quality factor
        score += client.network_quality * 0.3
        
        # Compute capability factor
        score += client.compute_capability * 0.2
        
        # Participation history (prefer diverse participation)
        recent_participation = sum(client.participation_history[-5:]) if client.participation_history else 0
        participation_bonus = 0.1 * (1.0 - recent_participation / 5.0)
        score += participation_bonus
        
        # Penalty for recent failures
        failure_penalty = min(0.2, client.failure_count * 0.05)
        score -= failure_penalty
        
        return max(0.0, min(1.0, score))
    
    async def start_async_round(self, round_id: str, 
                               aggregation_callback: Callable[[List[Any]], Any]) -> Dict[str, Any]:
        """
        Start an asynchronous federated learning round
        
        Args:
            round_id: Unique round identifier
            aggregation_callback: Function to aggregate client updates
            
        Returns:
            Round results including aggregated model and statistics
        """
        with self.round_lock:
            if round_id in self.active_rounds:
                raise ValueError(f"Round {round_id} is already active")
            
            # Select clients for this round
            selected_clients, backup_clients = self.select_clients_for_round(round_id)
            
            if not selected_clients:
                return {'success': False, 'error': 'No clients available'}
            
            # Initialize round state
            round_state = {
                'round_id': round_id,
                'start_time': time.time(),
                'selected_clients': selected_clients,
                'backup_clients': backup_clients,
                'completed_clients': set(),
                'failed_clients': set(),
                'client_updates': {},
                'status': 'running',
                'aggregation_callback': aggregation_callback
            }
            
            self.active_rounds[round_id] = round_state
            
            logger.info("async_round_started",
                       round_id=round_id,
                       selected_clients=len(selected_clients),
                       backup_clients=len(backup_clients))
        
        # Start round monitoring task
        monitor_task = self.executor.submit(self._monitor_round, round_id)
        self.background_tasks.append(monitor_task)
        
        # Wait for round completion
        return await self._wait_for_round_completion(round_id)
    
    async def _wait_for_round_completion(self, round_id: str) -> Dict[str, Any]:
        """Wait for round completion using configured strategy"""
        round_state = self.active_rounds[round_id]
        start_time = round_state['start_time']
        
        while True:
            await asyncio.sleep(1.0)  # Check every second
            
            current_time = time.time()
            elapsed_time = current_time - start_time
            
            # Check if round should be completed
            should_complete, reason = self._should_complete_round(round_state, elapsed_time)
            
            if should_complete:
                return await self._finalize_round(round_id, reason)
            
            # Check for timeout
            if elapsed_time > self.config.timeout_seconds:
                return await self._finalize_round(round_id, "timeout")
    
    def _should_complete_round(self, round_state: Dict[str, Any], elapsed_time: float) -> Tuple[bool, str]:
        """Determine if round should be completed based on strategy"""
        completed_count = len(round_state['completed_clients'])
        selected_count = len(round_state['selected_clients'])
        failed_count = len(round_state['failed_clients'])
        
        strategy = self.config.strategy
        
        if strategy == AggregationStrategy.QUORUM_BASED:
            quorum_needed = max(self.config.min_clients, 
                              int(selected_count * self.config.quorum_threshold))
            if completed_count >= quorum_needed:
                return True, f"quorum_reached_{completed_count}_{quorum_needed}"
        
        elif strategy == AggregationStrategy.TIMEOUT_BASED:
            if elapsed_time >= self.config.timeout_seconds:
                return True, f"timeout_reached_{elapsed_time}"
        
        elif strategy == AggregationStrategy.HYBRID:
            # Complete if quorum reached OR timeout reached
            quorum_needed = max(self.config.min_clients,
                              int(selected_count * self.config.quorum_threshold))
            if completed_count >= quorum_needed:
                return True, f"quorum_reached_{completed_count}_{quorum_needed}"
            if elapsed_time >= self.config.timeout_seconds:
                return True, f"timeout_reached_{elapsed_time}"
        
        elif strategy == AggregationStrategy.ADAPTIVE:
            # Adaptive strategy based on current conditions
            completion_rate = completed_count / selected_count if selected_count > 0 else 0
            failure_rate = failed_count / selected_count if selected_count > 0 else 0
            
            # Complete early if we have good participation and low failures
            if completion_rate >= 0.8 and failure_rate <= 0.1:
                return True, f"adaptive_early_completion_{completion_rate:.2f}"
            
            # Complete if minimum requirements met and some time elapsed
            if completed_count >= self.config.min_clients and elapsed_time >= 60:
                return True, f"adaptive_minimum_met_{completed_count}"
        
        return False, ""
    
    async def _finalize_round(self, round_id: str, reason: str) -> Dict[str, Any]:
        """Finalize a federated learning round"""
        round_state = self.active_rounds[round_id]
        
        # Collect client updates
        client_updates = []
        for client_id in round_state['completed_clients']:
            if client_id in round_state['client_updates']:
                client_updates.append(round_state['client_updates'][client_id])
        
        # Perform aggregation
        aggregated_result = None
        if client_updates and round_state['aggregation_callback']:
            try:
                aggregated_result = round_state['aggregation_callback'](client_updates)
            except Exception as e:
                logger.exception("aggregation_failed", round_id=round_id, error=str(e))
        
        # Calculate round statistics
        end_time = time.time()
        round_duration = end_time - round_state['start_time']
        
        round_results = {
            'round_id': round_id,
            'success': len(client_updates) >= self.config.min_clients,
            'completion_reason': reason,
            'duration_seconds': round_duration,
            'selected_clients': len(round_state['selected_clients']),
            'completed_clients': len(round_state['completed_clients']),
            'failed_clients': len(round_state['failed_clients']),
            'aggregated_result': aggregated_result,
            'client_participation': list(round_state['completed_clients']),
            'statistics': self._calculate_round_statistics(round_state)
        }
        
        # Update client participation history
        self._update_participation_history(round_state)
        
        # Store results and clean up
        self.round_results[round_id] = round_results
        del self.active_rounds[round_id]
        
        # Update global statistics
        self.total_rounds += 1
        if round_results['success']:
            self.successful_rounds += 1
        
        logger.info("round_finalized",
                   round_id=round_id,
                   success=round_results['success'],
                   duration=round_duration,
                   completed_clients=len(round_state['completed_clients']),
                   reason=reason)
        
        return round_results
    
    def _monitor_round(self, round_id: str) -> None:
        """Background task to monitor round progress"""
        round_state = self.active_rounds.get(round_id)
        if not round_state:
            return
        
        while round_state.get('status') == 'running':
            time.sleep(5)  # Check every 5 seconds
            
            # Check for straggler clients
            current_time = time.time()
            for client_id in round_state['selected_clients']:
                if client_id in self.clients:
                    client = self.clients[client_id]
                    if (client.status == ClientStatus.TRAINING and 
                        client.training_start_time and
                        current_time - client.training_start_time > 180):  # 3 minutes
                        
                        # Mark as straggler and potentially replace
                        logger.warning("straggler_client_detected",
                                     round_id=round_id,
                                     client_id=client_id,
                                     training_time=current_time - client.training_start_time)
                        
                        # Could implement straggler mitigation here
            
            # Update round state if needed
            round_state = self.active_rounds.get(round_id)
            if not round_state:
                break
    
    def _calculate_round_statistics(self, round_state: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate detailed statistics for a round"""
        selected_clients = round_state['selected_clients']
        completed_clients = round_state['completed_clients']
        failed_clients = round_state['failed_clients']
        
        completion_rate = len(completed_clients) / len(selected_clients) if selected_clients else 0
        failure_rate = len(failed_clients) / len(selected_clients) if selected_clients else 0
        
        # Calculate average training times
        training_times = []
        for client_id in completed_clients:
            if client_id in self.clients:
                client = self.clients[client_id]
                if client.training_start_time and client.completion_time:
                    training_times.append(client.completion_time - client.training_start_time)
        
        avg_training_time = sum(training_times) / len(training_times) if training_times else 0
        
        return {
            'completion_rate': completion_rate,
            'failure_rate': failure_rate,
            'avg_training_time_seconds': avg_training_time,
            'min_training_time': min(training_times) if training_times else 0,
            'max_training_time': max(training_times) if training_times else 0,
            'total_model_updates': len(completed_clients)
        }
    
    def _update_participation_history(self, round_state: Dict[str, Any]) -> None:
        """Update client participation history"""
        for client_id in round_state['selected_clients']:
            if client_id in self.clients:
                client = self.clients[client_id]
                participated = client_id in round_state['completed_clients']
                client.participation_history.append(participated)
                
                # Keep only recent history (last 20 rounds)
                if len(client.participation_history) > 20:
                    client.participation_history = client.participation_history[-20:]
                
                # Update reliability score based on participation
                if participated:
                    client.reliability_score = min(1.0, client.reliability_score * 1.05)
                else:
                    client.reliability_score = max(0.1, client.reliability_score * 0.95)
    
    def submit_client_update(self, round_id: str, client_id: str, 
                           model_update: Any) -> bool:
        """
        Submit a model update from a client
        
        Args:
            round_id: Round identifier
            client_id: Client identifier
            model_update: Client's model update
            
        Returns:
            True if update was accepted
        """
        if round_id not in self.active_rounds:
            logger.warning("update_for_inactive_round", 
                         round_id=round_id, client_id=client_id)
            return False
        
        round_state = self.active_rounds[round_id]
        
        if client_id not in round_state['selected_clients']:
            logger.warning("update_from_unselected_client",
                         round_id=round_id, client_id=client_id)
            return False
        
        # Store the update
        round_state['client_updates'][client_id] = model_update
        round_state['completed_clients'].add(client_id)
        
        # Update client status
        self.update_client_status(client_id, ClientStatus.COMPLETED)
        
        logger.info("client_update_received",
                   round_id=round_id,
                   client_id=client_id,
                   completed_count=len(round_state['completed_clients']),
                   total_selected=len(round_state['selected_clients']))
        
        return True
    
    def get_system_statistics(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        current_time = time.time()
        uptime = current_time - self.start_time
        
        # Calculate success rate
        success_rate = self.successful_rounds / self.total_rounds if self.total_rounds > 0 else 0
        
        # Client statistics
        total_clients = len(self.clients)
        active_clients = sum(1 for client in self.clients.values() 
                           if current_time - client.last_seen < 300)
        
        avg_reliability = sum(client.reliability_score for client in self.clients.values()) / total_clients if total_clients > 0 else 0
        
        return {
            'uptime_seconds': uptime,
            'total_rounds': self.total_rounds,
            'successful_rounds': self.successful_rounds,
            'success_rate': success_rate,
            'total_clients': total_clients,
            'active_clients': active_clients,
            'average_client_reliability': avg_reliability,
            'active_rounds': len(self.active_rounds),
            'configuration': self.config.__dict__
        }
    
    def shutdown(self) -> None:
        """Gracefully shutdown the coordinator"""
        logger.info("shutting_down_async_coordinator")
        
        # Cancel background tasks
        for task in self.background_tasks:
            task.cancel()
        
        # Shutdown executor
        self.executor.shutdown(wait=True)
        
        # Clear active rounds
        self.active_rounds.clear()
        
        logger.info("async_coordinator_shutdown_complete")

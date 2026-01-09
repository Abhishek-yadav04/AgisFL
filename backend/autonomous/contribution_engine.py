"""
AgisFL Contribution Valuation Engine (CVE)
==========================================

The economic brain of AgisFL that quantifies the value of each client's contribution
to federated learning projects. This engine works alongside the AutoFL Engine to
create a transparent, fair, and autonomous incentive mechanism.

Key Features:
- Marginal accuracy gain calculation
- Data uniqueness scoring via cosine similarity
- Resource contribution tracking
- Integration with tokenomics and smart contracts
- Real-time contribution analytics
"""

import numpy as np
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict
import json
import threading
import time

logger = logging.getLogger(__name__)

@dataclass
class ContributionMetrics:
    """Comprehensive contribution metrics for a client."""
    client_id: str
    round_number: int
    timestamp: datetime
    
    # Accuracy Metrics
    marginal_accuracy_gain: float
    baseline_accuracy: float
    post_contribution_accuracy: float
    
    # Data Uniqueness Metrics
    update_vector_norm: float
    cosine_similarity_to_average: float
    uniqueness_score: float  # 1 - cosine_similarity
    
    # Resource Metrics
    computation_time: float
    data_quality_score: float
    participation_consistency: float
    uptime_percentage: float
    
    # Composite Scores
    raw_contribution_score: float
    normalized_contribution_score: float
    cumulative_contribution: float

@dataclass
class ProjectContribution:
    """Track contribution across an entire project."""
    project_id: str
    client_id: str
    total_rounds_participated: int
    total_contribution_score: float
    average_contribution_per_round: float
    total_tokens_earned: float
    participation_start: datetime
    last_contribution: datetime

class ContributionValuationEngine:
    """
    The Contribution Valuation Engine (CVE) - Economic Brain of AgisFL
    
    This engine quantifies the value of each client's contribution using:
    1. Marginal Accuracy Gain Analysis
    2. Data Uniqueness via Cosine Similarity
    3. Resource Contribution Tracking
    4. Consistency and Quality Metrics
    """
    
    def __init__(self):
        self.contribution_history: List[ContributionMetrics] = []
        self.project_contributions: Dict[str, Dict[str, ProjectContribution]] = defaultdict(dict)
        self.baseline_accuracies: Dict[str, float] = {}
        self.update_vectors: Dict[str, List[np.ndarray]] = defaultdict(list)
        self.client_uptime: Dict[str, Dict] = defaultdict(dict)
        self.valuation_weights = {
            "accuracy_weight": 0.4,      # 40% weight for accuracy improvement
            "uniqueness_weight": 0.3,    # 30% weight for data uniqueness
            "resource_weight": 0.2,      # 20% weight for resource contribution
            "consistency_weight": 0.1    # 10% weight for participation consistency
        }
        self.running = False
        self.monitor_thread = None
        
    async def initialize_project(self, project_id: str, baseline_accuracy: float):
        """Initialize contribution tracking for a new project."""
        self.baseline_accuracies[project_id] = baseline_accuracy
        logger.info(f"CVE: Initialized project {project_id} with baseline accuracy {baseline_accuracy:.4f}")
        
    async def record_client_contribution(
        self,
        project_id: str,
        client_id: str,
        round_number: int,
        update_vector: np.ndarray,
        post_accuracy: float,
        computation_time: float,
        data_quality: float = 1.0
    ) -> ContributionMetrics:
        """
        Record and evaluate a client's contribution for a specific round.
        
        This is the core function that calculates all contribution metrics.
        """
        try:
            baseline_acc = self.baseline_accuracies.get(project_id, 0.0)
            
            # 1. Calculate Marginal Accuracy Gain
            marginal_gain = max(0, post_accuracy - baseline_acc)
            
            # 2. Store update vector for uniqueness analysis
            self.update_vectors[project_id].append(update_vector)
            
            # 3. Calculate Data Uniqueness Score
            uniqueness_score = await self._calculate_uniqueness_score(
                project_id, update_vector
            )
            
            # 4. Get Resource Contribution Metrics
            consistency_score = await self._calculate_consistency_score(project_id, client_id)
            uptime_percentage = await self._get_uptime_percentage(client_id)
            
            # 5. Calculate Composite Scores
            raw_score = await self._calculate_raw_contribution_score(
                marginal_gain, uniqueness_score, computation_time, 
                data_quality, consistency_score
            )
            
            # 6. Create comprehensive metrics object
            metrics = ContributionMetrics(
                client_id=client_id,
                round_number=round_number,
                timestamp=datetime.now(),
                marginal_accuracy_gain=marginal_gain,
                baseline_accuracy=baseline_acc,
                post_contribution_accuracy=post_accuracy,
                update_vector_norm=float(np.linalg.norm(update_vector)),
                cosine_similarity_to_average=1.0 - uniqueness_score,
                uniqueness_score=uniqueness_score,
                computation_time=computation_time,
                data_quality_score=data_quality,
                participation_consistency=consistency_score,
                uptime_percentage=uptime_percentage,
                raw_contribution_score=raw_score,
                normalized_contribution_score=0.0,  # Will be calculated after normalization
                cumulative_contribution=0.0  # Will be updated
            )
            
            # 7. Store metrics and update project contribution
            self.contribution_history.append(metrics)
            await self._update_project_contribution(project_id, metrics)
            
            # 8. Normalize scores across current round participants
            await self._normalize_contribution_scores(project_id, round_number)
            
            logger.info(f"CVE: Recorded contribution for client {client_id} "
                       f"- Score: {raw_score:.4f}, Uniqueness: {uniqueness_score:.4f}")
            
            return metrics
            
        except Exception as e:
            logger.error(f"CVE: Error recording contribution for {client_id}: {e}")
            raise
    
    async def _calculate_uniqueness_score(
        self, 
        project_id: str, 
        update_vector: np.ndarray
    ) -> float:
        """
        Calculate how unique this client's update is compared to others.
        Uses cosine similarity - lower similarity = higher uniqueness.
        """
        project_vectors = self.update_vectors[project_id]
        
        if len(project_vectors) <= 1:
            return 1.0  # First contribution is perfectly unique
        
        # Calculate average update vector from all previous updates
        other_vectors = project_vectors[:-1]  # Exclude current vector
        if len(other_vectors) == 0:
            return 1.0
            
        avg_vector = np.mean(other_vectors, axis=0)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(
            update_vector.reshape(1, -1), 
            avg_vector.reshape(1, -1)
        )[0][0]
        
        # Convert to uniqueness score (1 - similarity)
        uniqueness = max(0.0, 1.0 - similarity)
        
        return uniqueness
    
    async def _calculate_consistency_score(self, project_id: str, client_id: str) -> float:
        """Calculate client's participation consistency in this project."""
        client_contributions = [
            m for m in self.contribution_history 
            if m.client_id == client_id
        ]
        
        if len(client_contributions) <= 1:
            return 1.0
        
        # Calculate participation rate over last 10 rounds
        recent_rounds = sorted([m.round_number for m in client_contributions[-10:]])
        if len(recent_rounds) < 2:
            return 1.0
        
        expected_rounds = recent_rounds[-1] - recent_rounds[0] + 1
        actual_participation = len(recent_rounds)
        
        consistency = min(1.0, actual_participation / expected_rounds)
        return consistency
    
    async def _get_uptime_percentage(self, client_id: str) -> float:
        """Calculate client's uptime percentage over last 24 hours."""
        # Simulate uptime calculation - in real implementation, 
        # this would query actual client monitoring data
        current_time = datetime.now()
        
        if client_id not in self.client_uptime:
            # Initialize with high uptime for new clients
            self.client_uptime[client_id] = {
                "last_seen": current_time,
                "total_uptime": 0.95  # Default 95% uptime
            }
        
        # Update last seen
        self.client_uptime[client_id]["last_seen"] = current_time
        
        # Return stored uptime with small random variation
        base_uptime = self.client_uptime[client_id]["total_uptime"]
        variation = np.random.normal(0, 0.02)  # 2% standard deviation
        
        return max(0.1, min(1.0, base_uptime + variation))
    
    async def _calculate_raw_contribution_score(
        self,
        marginal_gain: float,
        uniqueness_score: float,
        computation_time: float,
        data_quality: float,
        consistency_score: float
    ) -> float:
        """
        Calculate the raw contribution score using weighted formula.
        
        Score = w1*accuracy + w2*uniqueness + w3*resource + w4*consistency
        """
        weights = self.valuation_weights
        
        # Normalize accuracy gain (assume max possible gain is 0.1)
        normalized_accuracy = min(1.0, marginal_gain / 0.1)
        
        # Resource score based on computation time and data quality
        # Lower computation time = higher efficiency
        resource_score = data_quality * min(1.0, 60.0 / max(1.0, computation_time))
        
        # Calculate weighted score
        raw_score = (
            weights["accuracy_weight"] * normalized_accuracy +
            weights["uniqueness_weight"] * uniqueness_score +
            weights["resource_weight"] * resource_score +
            weights["consistency_weight"] * consistency_score
        )
        
        return max(0.0, min(1.0, raw_score))
    
    async def _update_project_contribution(
        self, 
        project_id: str, 
        metrics: ContributionMetrics
    ):
        """Update cumulative project contribution for the client."""
        client_id = metrics.client_id
        
        if client_id not in self.project_contributions[project_id]:
            self.project_contributions[project_id][client_id] = ProjectContribution(
                project_id=project_id,
                client_id=client_id,
                total_rounds_participated=0,
                total_contribution_score=0.0,
                average_contribution_per_round=0.0,
                total_tokens_earned=0.0,
                participation_start=metrics.timestamp,
                last_contribution=metrics.timestamp
            )
        
        contribution = self.project_contributions[project_id][client_id]
        contribution.total_rounds_participated += 1
        contribution.total_contribution_score += metrics.raw_contribution_score
        contribution.average_contribution_per_round = (
            contribution.total_contribution_score / contribution.total_rounds_participated
        )
        contribution.last_contribution = metrics.timestamp
        
        # Update cumulative contribution in metrics
        metrics.cumulative_contribution = contribution.total_contribution_score
    
    async def _normalize_contribution_scores(self, project_id: str, round_number: int):
        """Normalize contribution scores for fair comparison within a round."""
        round_contributions = [
            m for m in self.contribution_history 
            if m.round_number == round_number
        ]
        
        if len(round_contributions) <= 1:
            # If only one contributor, they get full score
            if round_contributions:
                round_contributions[0].normalized_contribution_score = 1.0
            return
        
        # Calculate total raw scores for this round
        total_raw_score = sum(m.raw_contribution_score for m in round_contributions)
        
        if total_raw_score == 0:
            # If all scores are zero, give equal normalized scores
            for metrics in round_contributions:
                metrics.normalized_contribution_score = 1.0 / len(round_contributions)
        else:
            # Normalize scores to sum to 1.0
            for metrics in round_contributions:
                metrics.normalized_contribution_score = (
                    metrics.raw_contribution_score / total_raw_score
                )
    
    async def get_contribution_analytics(
        self, 
        project_id: Optional[str] = None,
        client_id: Optional[str] = None,
        last_n_rounds: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get comprehensive contribution analytics."""
        
        # Filter contributions based on parameters
        filtered_contributions = self.contribution_history
        
        if project_id:
            filtered_contributions = [
                m for m in filtered_contributions 
                if hasattr(m, 'project_id') and m.project_id == project_id
            ]
        
        if client_id:
            filtered_contributions = [
                m for m in filtered_contributions if m.client_id == client_id
            ]
        
        if last_n_rounds:
            filtered_contributions = sorted(
                filtered_contributions, 
                key=lambda x: x.round_number, 
                reverse=True
            )[:last_n_rounds]
        
        if not filtered_contributions:
            return {"total_contributions": 0, "analytics": {}}
        
        # Calculate analytics
        total_contributions = len(filtered_contributions)
        avg_contribution_score = np.mean([m.raw_contribution_score for m in filtered_contributions])
        avg_uniqueness = np.mean([m.uniqueness_score for m in filtered_contributions])
        avg_consistency = np.mean([m.participation_consistency for m in filtered_contributions])
        
        # Top contributors
        client_scores = defaultdict(list)
        for m in filtered_contributions:
            client_scores[m.client_id].append(m.raw_contribution_score)
        
        top_contributors = sorted(
            [(client, np.mean(scores)) for client, scores in client_scores.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return {
            "total_contributions": total_contributions,
            "analytics": {
                "average_contribution_score": avg_contribution_score,
                "average_uniqueness_score": avg_uniqueness,
                "average_consistency_score": avg_consistency,
                "top_contributors": top_contributors,
                "score_distribution": {
                    "min": float(np.min([m.raw_contribution_score for m in filtered_contributions])),
                    "max": float(np.max([m.raw_contribution_score for m in filtered_contributions])),
                    "std": float(np.std([m.raw_contribution_score for m in filtered_contributions]))
                }
            },
            "recent_trends": await self._calculate_contribution_trends(filtered_contributions)
        }
    
    async def _calculate_contribution_trends(self, contributions: List[ContributionMetrics]) -> Dict[str, Any]:
        """Calculate trends in contribution metrics over time."""
        if len(contributions) < 2:
            return {"trend": "insufficient_data"}
        
        # Sort by round number
        sorted_contributions = sorted(contributions, key=lambda x: x.round_number)
        
        # Calculate trends for last 10 rounds
        recent_contributions = sorted_contributions[-10:]
        
        if len(recent_contributions) < 2:
            return {"trend": "insufficient_recent_data"}
        
        # Calculate trend in contribution scores
        scores = [m.raw_contribution_score for m in recent_contributions]
        rounds = [m.round_number for m in recent_contributions]
        
        # Simple linear trend calculation
        if len(scores) >= 2:
            trend_slope = (scores[-1] - scores[0]) / (rounds[-1] - rounds[0])
            trend_direction = "increasing" if trend_slope > 0.01 else "decreasing" if trend_slope < -0.01 else "stable"
        else:
            trend_direction = "stable"
        
        return {
            "trend_direction": trend_direction,
            "trend_slope": trend_slope if 'trend_slope' in locals() else 0,
            "recent_average": np.mean(scores),
            "trend_strength": abs(trend_slope) if 'trend_slope' in locals() else 0
        }
    
    async def generate_contribution_report(self, project_id: str) -> Dict[str, Any]:
        """Generate comprehensive contribution report for a project."""
        
        if project_id not in self.project_contributions:
            return {"error": "Project not found"}
        
        project_data = self.project_contributions[project_id]
        
        # Calculate project statistics
        total_participants = len(project_data)
        total_contribution_score = sum(c.total_contribution_score for c in project_data.values())
        
        # Rank participants
        ranked_participants = sorted(
            project_data.values(),
            key=lambda x: x.total_contribution_score,
            reverse=True
        )
        
        # Calculate distribution metrics
        scores = [c.total_contribution_score for c in project_data.values()]
        
        report = {
            "project_id": project_id,
            "generated_at": datetime.now().isoformat(),
            "project_summary": {
                "total_participants": total_participants,
                "total_contribution_score": total_contribution_score,
                "average_contribution_per_participant": total_contribution_score / total_participants if total_participants > 0 else 0
            },
            "participant_rankings": [
                {
                    "rank": i + 1,
                    "client_id": p.client_id,
                    "total_score": p.total_contribution_score,
                    "rounds_participated": p.total_rounds_participated,
                    "average_per_round": p.average_contribution_per_round,
                    "participation_duration": (p.last_contribution - p.participation_start).days
                }
                for i, p in enumerate(ranked_participants)
            ],
            "score_distribution": {
                "min": float(np.min(scores)) if scores else 0,
                "max": float(np.max(scores)) if scores else 0,
                "mean": float(np.mean(scores)) if scores else 0,
                "median": float(np.median(scores)) if scores else 0,
                "std": float(np.std(scores)) if scores else 0
            }
        }
        
        return report
    
    def start_monitoring(self):
        """Start background monitoring thread."""
        if not self.running:
            self.running = True
            self.monitor_thread = threading.Thread(target=self._monitoring_loop)
            self.monitor_thread.daemon = True
            self.monitor_thread.start()
            logger.info("CVE: Started contribution monitoring")
    
    def stop_monitoring(self):
        """Stop background monitoring."""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("CVE: Stopped contribution monitoring")
    
    def _monitoring_loop(self):
        """Background monitoring loop."""
        while self.running:
            try:
                # Periodic cleanup and maintenance
                self._cleanup_old_data()
                time.sleep(300)  # Run every 5 minutes
            except Exception as e:
                logger.error(f"CVE monitoring error: {e}")
                time.sleep(60)
    
    def _cleanup_old_data(self):
        """Clean up old contribution data to prevent memory issues."""
        cutoff_date = datetime.now() - timedelta(days=30)
        
        # Keep only recent contributions
        self.contribution_history = [
            m for m in self.contribution_history 
            if m.timestamp > cutoff_date
        ]
        
        # Clean up old update vectors
        for project_id in list(self.update_vectors.keys()):
            if len(self.update_vectors[project_id]) > 1000:
                # Keep only last 1000 vectors per project
                self.update_vectors[project_id] = self.update_vectors[project_id][-1000:]

# Global CVE instance
contribution_engine = ContributionValuationEngine()

# Add alias for backward compatibility
ContributionEngine = ContributionValuationEngine

# Export for use in other modules
__all__ = [
    'ContributionValuationEngine',
    'ContributionEngine',  # Alias added
    'ContributionMetrics', 
    'ProjectContribution',
    'contribution_engine'
]

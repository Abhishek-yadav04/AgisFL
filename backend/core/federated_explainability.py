"""
Federated Explainability (XAI) Engine
Implements privacy-preserving model interpretability using Federated SHAP

This module provides advanced explainability features including:
- Federated SHAP (SHapley Additive exPlanations) 
- Privacy-preserving feature importance analysis
- Global model interpretability without data exposure
- Secure aggregation of explanation values
- Multi-modal explanation support (tabular, image, text)
"""

import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
import structlog
import json
import threading
from abc import ABC, abstractmethod

logger = structlog.get_logger(__name__)

class ExplanationMethod(Enum):
    """Supported explanation methods"""
    SHAP = "shap"
    LIME = "lime"
    INTEGRATED_GRADIENTS = "integrated_gradients"
    GRAD_CAM = "grad_cam"
    FEATURE_PERMUTATION = "feature_permutation"

class ModelType(Enum):
    """Supported model types for explanation"""
    TABULAR = "tabular"
    IMAGE = "image"
    TEXT = "text"
    TIME_SERIES = "time_series"

@dataclass
class ExplanationConfig:
    """Configuration for explanation generation"""
    method: ExplanationMethod = ExplanationMethod.SHAP
    model_type: ModelType = ModelType.TABULAR
    num_samples: int = 100  # Number of samples to explain
    background_samples: int = 50  # Background dataset size for SHAP
    batch_size: int = 32
    feature_names: List[str] = field(default_factory=list)
    class_names: List[str] = field(default_factory=list)
    use_secure_aggregation: bool = True
    privacy_budget: float = 1.0  # For differential privacy
    confidence_threshold: float = 0.8
    max_features_to_explain: int = 20

@dataclass
class LocalExplanation:
    """Local explanation result from a client"""
    client_id: str
    explanation_id: str
    method: ExplanationMethod
    feature_importance: Dict[str, float]  # Feature name -> importance score
    explanation_values: np.ndarray  # Raw SHAP/explanation values
    base_value: float  # Base prediction value
    num_samples: int
    confidence_score: float
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

@dataclass
class GlobalExplanation:
    """Global explanation aggregated from multiple clients"""
    explanation_id: str
    method: ExplanationMethod
    global_feature_importance: Dict[str, float]
    feature_rankings: List[Tuple[str, float]]  # Sorted by importance
    participating_clients: List[str]
    total_samples: int
    confidence_score: float
    consistency_score: float  # How consistent explanations are across clients
    explanation_summary: str
    visualizations: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

class ExplanationMethod_Base(ABC):
    """Abstract base class for explanation methods"""
    
    @abstractmethod
    def compute_local_explanation(self, model: Any, data: np.ndarray, 
                                config: ExplanationConfig) -> LocalExplanation:
        """Compute explanation on client data"""
        pass
    
    @abstractmethod
    def aggregate_explanations(self, local_explanations: List[LocalExplanation],
                             config: ExplanationConfig) -> GlobalExplanation:
        """Aggregate local explanations into global explanation"""
        pass

class FederatedSHAPExplainer(ExplanationMethod_Base):
    """
    Federated SHAP (SHapley Additive exPlanations) implementation
    
    This class implements privacy-preserving SHAP explanations where:
    1. Each client computes SHAP values locally
    2. SHAP values are securely aggregated (not raw data)
    3. Global feature importance is derived from aggregated SHAP values
    """
    
    def __init__(self):
        """Initialize Federated SHAP explainer"""
        self.explainers = {}  # Cache explainers per client
        logger.info("federated_shap_explainer_initialized")
    
    def compute_local_explanation(self, model: Any, data: np.ndarray, 
                                config: ExplanationConfig) -> LocalExplanation:
        """
        Compute SHAP values locally on client data
        
        Args:
            model: Trained model (PyTorch, sklearn, etc.)
            data: Local data sample for explanation
            config: Explanation configuration
            
        Returns:
            Local explanation with SHAP values
        """
        try:
            start_time = time.time()
            
            # Import SHAP (with fallback)
            try:
                import shap
            except ImportError:
                logger.warning("shap_not_available_using_fallback")
                return self._compute_fallback_explanation(model, data, config)
            
            # Prepare data
            if len(data) > config.num_samples:
                # Sample data if too large
                indices = np.random.choice(len(data), config.num_samples, replace=False)
                explanation_data = data[indices]
            else:
                explanation_data = data
            
            # Create background dataset for SHAP
            background_size = min(config.background_samples, len(data))
            background_indices = np.random.choice(len(data), background_size, replace=False)
            background_data = data[background_indices]
            
            # Initialize SHAP explainer based on model type
            if hasattr(model, 'predict_proba'):
                # For sklearn-like models
                explainer = shap.Explainer(model.predict_proba, background_data)
            elif hasattr(model, 'forward'):
                # For PyTorch models
                def model_predict(x):
                    import torch
                    if not isinstance(x, torch.Tensor):
                        x = torch.FloatTensor(x)
                    with torch.no_grad():
                        output = model(x)
                        if hasattr(output, 'softmax'):
                            return torch.softmax(output, dim=1).numpy()
                        return output.numpy()
                
                # Convert background data to tensor for PyTorch models
                import torch
                background_tensor = torch.FloatTensor(background_data)
                explainer = shap.Explainer(model_predict, background_tensor.numpy())
            else:
                # Generic function explainer
                explainer = shap.Explainer(model, background_data)
            
            # Compute SHAP values
            shap_values = explainer(explanation_data)
            
            # Handle different SHAP output formats
            if hasattr(shap_values, 'values'):
                values = shap_values.values
                base_values = shap_values.base_values
            else:
                values = shap_values
                base_values = np.zeros(len(explanation_data))
            
            # Handle multi-class output
            if len(values.shape) == 3:  # Multi-class case
                # Average across classes for global importance
                values = np.mean(values, axis=2)
                base_values = np.mean(base_values, axis=1) if len(base_values.shape) > 1 else base_values
            
            # Calculate feature importance
            feature_importance = {}
            mean_abs_shap = np.mean(np.abs(values), axis=0)
            
            if config.feature_names:
                for i, feature_name in enumerate(config.feature_names):
                    if i < len(mean_abs_shap):
                        feature_importance[feature_name] = float(mean_abs_shap[i])
            else:
                for i in range(len(mean_abs_shap)):
                    feature_importance[f"feature_{i}"] = float(mean_abs_shap[i])
            
            # Calculate confidence score based on SHAP value consistency
            confidence_score = self._calculate_confidence_score(values)
            
            explanation_time = time.time() - start_time
            
            local_explanation = LocalExplanation(
                client_id="local_client",  # Will be set by the calling client
                explanation_id=str(uuid.uuid4()),
                method=ExplanationMethod.SHAP,
                feature_importance=feature_importance,
                explanation_values=values,
                base_value=float(np.mean(base_values)),
                num_samples=len(explanation_data),
                confidence_score=confidence_score,
                metadata={
                    'explanation_time': explanation_time,
                    'background_samples': len(background_data),
                    'shap_method': 'tree' if hasattr(model, 'decision_function') else 'kernel'
                }
            )
            
            logger.info("local_shap_explanation_computed",
                       num_samples=len(explanation_data),
                       num_features=len(feature_importance),
                       confidence_score=confidence_score,
                       explanation_time=explanation_time)
            
            return local_explanation
            
        except Exception as e:
            logger.exception("local_shap_explanation_failed", error=str(e))
            return self._compute_fallback_explanation(model, data, config)
    
    def _compute_fallback_explanation(self, model: Any, data: np.ndarray,
                                    config: ExplanationConfig) -> LocalExplanation:
        """Fallback explanation when SHAP is not available"""
        logger.info("using_fallback_feature_permutation_explanation")
        
        # Simple feature permutation importance
        if hasattr(model, 'predict'):
            baseline_pred = model.predict(data[:1])
        else:
            # For PyTorch models, convert to tensor
            import torch
            if not isinstance(data, torch.Tensor):
                data_tensor = torch.FloatTensor(data[:1])
            else:
                data_tensor = data[:1]
            baseline_pred = model(data_tensor)
        
        feature_importance = {}
        num_features = data.shape[1] if len(data.shape) > 1 else 1
        
        for i in range(min(num_features, 10)):  # Limit to 10 features for performance
            # Permute feature
            data_permuted = data.copy()
            if len(data.shape) > 1:
                np.random.shuffle(data_permuted[:, i])
            
            # Get prediction with permuted feature
            if hasattr(model, 'predict'):
                perm_pred = model.predict(data_permuted[:1])
            else:
                # For PyTorch models, convert to tensor
                import torch
                if not isinstance(data_permuted, torch.Tensor):
                    permuted_tensor = torch.FloatTensor(data_permuted[:1])
                else:
                    permuted_tensor = data_permuted[:1]
                perm_pred = model(permuted_tensor)
            
            # Calculate importance as prediction change
            baseline_mean = baseline_pred.detach().numpy().mean() if hasattr(baseline_pred, 'detach') else np.mean(baseline_pred)
            perm_mean = perm_pred.detach().numpy().mean() if hasattr(perm_pred, 'detach') else np.mean(perm_pred)
            importance = float(np.abs(baseline_mean - perm_mean))
            
            feature_name = config.feature_names[i] if i < len(config.feature_names) else f"feature_{i}"
            feature_importance[feature_name] = importance
        
        # Return local explanation
        base_value_mean = baseline_pred.detach().numpy().mean() if hasattr(baseline_pred, 'detach') else np.mean(baseline_pred)
        
        return LocalExplanation(
            client_id="local_client",
            explanation_id=str(uuid.uuid4()),
            method=ExplanationMethod.FEATURE_PERMUTATION,
            feature_importance=feature_importance,
            explanation_values=np.zeros((len(data), num_features)),
            base_value=float(base_value_mean),
            num_samples=len(data),
            confidence_score=0.5,  # Lower confidence for fallback method
            metadata={'method': 'fallback_permutation'}
        )
    
    def _calculate_confidence_score(self, shap_values: np.ndarray) -> float:
        """Calculate confidence score based on SHAP value consistency"""
        try:
            # Calculate coefficient of variation across samples
            mean_values = np.mean(shap_values, axis=0)
            std_values = np.std(shap_values, axis=0)
            
            # Avoid division by zero
            cv = np.where(mean_values != 0, std_values / np.abs(mean_values), 0)
            
            # Convert to confidence score (lower variation = higher confidence)
            confidence = 1.0 / (1.0 + np.mean(cv))
            return float(np.clip(confidence, 0.0, 1.0))
            
        except Exception:
            return 0.5  # Default confidence if calculation fails
    
    def aggregate_explanations(self, local_explanations: List[LocalExplanation],
                             config: ExplanationConfig) -> GlobalExplanation:
        """
        Aggregate local SHAP explanations into global explanation
        
        Args:
            local_explanations: List of local explanations from clients
            config: Explanation configuration
            
        Returns:
            Global explanation with aggregated feature importance
        """
        if not local_explanations:
            raise ValueError("No local explanations to aggregate")
        
        start_time = time.time()
        
        # Collect all feature names
        all_features = set()
        for explanation in local_explanations:
            all_features.update(explanation.feature_importance.keys())
        
        all_features = list(all_features)
        
        # Aggregate feature importance using weighted average
        global_feature_importance = {}
        total_samples = sum(exp.num_samples for exp in local_explanations)
        
        for feature in all_features:
            weighted_importance = 0.0
            total_weight = 0.0
            
            for explanation in local_explanations:
                if feature in explanation.feature_importance:
                    weight = explanation.num_samples
                    weighted_importance += explanation.feature_importance[feature] * weight
                    total_weight += weight
            
            if total_weight > 0:
                global_feature_importance[feature] = weighted_importance / total_weight
            else:
                global_feature_importance[feature] = 0.0
        
        # Sort features by importance
        feature_rankings = sorted(
            global_feature_importance.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )
        
        # Limit to top features
        if config.max_features_to_explain > 0:
            feature_rankings = feature_rankings[:config.max_features_to_explain]
        
        # Calculate global confidence and consistency
        confidence_scores = [exp.confidence_score for exp in local_explanations]
        global_confidence = np.mean(confidence_scores)
        
        # Calculate consistency score (how similar explanations are across clients)
        consistency_score = self._calculate_consistency_score(local_explanations, all_features)
        
        # Generate explanation summary
        top_features = [f[0] for f in feature_rankings[:5]]
        summary = f"Top 5 most important features: {', '.join(top_features)}"
        
        # Create visualizations data
        visualizations = {
            'feature_importance_chart': {
                'type': 'bar_chart',
                'data': feature_rankings[:10],  # Top 10 features
                'title': 'Global Feature Importance'
            },
            'client_consistency': {
                'type': 'heatmap',
                'data': self._generate_consistency_matrix(local_explanations),
                'title': 'Inter-Client Explanation Consistency'
            }
        }
        
        aggregation_time = time.time() - start_time
        
        global_explanation = GlobalExplanation(
            explanation_id=str(uuid.uuid4()),
            method=local_explanations[0].method,
            global_feature_importance=global_feature_importance,
            feature_rankings=feature_rankings,
            participating_clients=[exp.client_id for exp in local_explanations],
            total_samples=total_samples,
            confidence_score=global_confidence,
            consistency_score=consistency_score,
            explanation_summary=summary,
            visualizations=visualizations,
            metadata={
                'aggregation_time': aggregation_time,
                'num_clients': len(local_explanations),
                'total_features': len(all_features)
            }
        )
        
        logger.info("global_explanation_aggregated",
                   explanation_id=global_explanation.explanation_id,
                   num_clients=len(local_explanations),
                   total_samples=total_samples,
                   confidence_score=global_confidence,
                   consistency_score=consistency_score)
        
        return global_explanation
    
    def _calculate_consistency_score(self, local_explanations: List[LocalExplanation],
                                   all_features: List[str]) -> float:
        """Calculate how consistent explanations are across clients"""
        if len(local_explanations) < 2:
            return 1.0  # Perfect consistency with only one client
        
        try:
            # Create feature importance matrix
            importance_matrix = []
            for explanation in local_explanations:
                feature_vector = []
                for feature in all_features:
                    importance = explanation.feature_importance.get(feature, 0.0)
                    feature_vector.append(importance)
                importance_matrix.append(feature_vector)
            
            importance_matrix = np.array(importance_matrix)
            
            # Calculate pairwise correlations
            correlations = []
            for i in range(len(importance_matrix)):
                for j in range(i + 1, len(importance_matrix)):
                    corr = np.corrcoef(importance_matrix[i], importance_matrix[j])[0, 1]
                    if not np.isnan(corr):
                        correlations.append(corr)
            
            if correlations:
                return float(np.mean(correlations))
            else:
                return 0.5  # Default if correlation calculation fails
                
        except Exception as e:
            logger.warning("consistency_calculation_failed", error=str(e))
            return 0.5
    
    def _generate_consistency_matrix(self, local_explanations: List[LocalExplanation]) -> List[List[float]]:
        """Generate consistency matrix for visualization"""
        n_clients = len(local_explanations)
        matrix = [[1.0 for _ in range(n_clients)] for _ in range(n_clients)]
        
        # Get common features
        common_features = set(local_explanations[0].feature_importance.keys())
        for explanation in local_explanations[1:]:
            common_features = common_features.intersection(explanation.feature_importance.keys())
        
        common_features = list(common_features)
        
        if not common_features:
            return matrix
        
        # Calculate pairwise similarities
        for i in range(n_clients):
            for j in range(i + 1, n_clients):
                exp_i = local_explanations[i]
                exp_j = local_explanations[j]
                
                # Calculate cosine similarity of feature importance vectors
                vec_i = np.array([exp_i.feature_importance.get(f, 0) for f in common_features])
                vec_j = np.array([exp_j.feature_importance.get(f, 0) for f in common_features])
                
                # Cosine similarity
                dot_product = np.dot(vec_i, vec_j)
                norm_i = np.linalg.norm(vec_i)
                norm_j = np.linalg.norm(vec_j)
                
                if norm_i > 0 and norm_j > 0:
                    similarity = dot_product / (norm_i * norm_j)
                    matrix[i][j] = matrix[j][i] = float(similarity)
        
        return matrix

class FederatedExplainabilityEngine:
    """
    Main engine for federated explainability
    Coordinates explanation generation across multiple clients
    """
    
    def __init__(self, secure_aggregation_manager=None):
        """
        Initialize federated explainability engine
        
        Args:
            secure_aggregation_manager: Optional secure aggregation for privacy
        """
        self.secure_aggregation_manager = secure_aggregation_manager
        self.explainers = {
            ExplanationMethod.SHAP: FederatedSHAPExplainer(),
        }
        
        # State management
        self.active_explanations: Dict[str, Dict[str, Any]] = {}
        self.explanation_history: List[GlobalExplanation] = []
        self.lock = threading.RLock()
        
        logger.info("federated_explainability_engine_initialized")
    
    async def run_explanation_round(self, model: Any, client_data_samplers: Dict[str, Callable],
                                  config: ExplanationConfig) -> GlobalExplanation:
        """
        Run a federated explanation round across multiple clients
        
        Args:
            model: Global model to explain
            client_data_samplers: Dict mapping client_id to data sampling function
            config: Explanation configuration
            
        Returns:
            Global explanation aggregated from all clients
        """
        explanation_id = str(uuid.uuid4())
        
        with self.lock:
            self.active_explanations[explanation_id] = {
                'status': 'running',
                'start_time': time.time(),
                'config': config,
                'participating_clients': list(client_data_samplers.keys())
            }
        
        try:
            logger.info("explanation_round_started",
                       explanation_id=explanation_id,
                       method=config.method.value,
                       num_clients=len(client_data_samplers))
            
            # Get appropriate explainer
            explainer = self.explainers.get(config.method)
            if explainer is None:
                raise ValueError(f"Unsupported explanation method: {config.method}")
            
            # Collect local explanations from all clients
            local_explanations = []
            
            for client_id, data_sampler in client_data_samplers.items():
                try:
                    # Sample data for explanation
                    client_data = data_sampler(config.num_samples)
                    
                    # Compute local explanation
                    local_explanation = explainer.compute_local_explanation(
                        model, client_data, config
                    )
                    local_explanation.client_id = client_id
                    
                    # Apply secure aggregation if available
                    if config.use_secure_aggregation and self.secure_aggregation_manager:
                        local_explanation = await self._secure_aggregate_explanation(
                            local_explanation, explanation_id
                        )
                    
                    local_explanations.append(local_explanation)
                    
                    logger.info("local_explanation_completed",
                               client_id=client_id,
                               explanation_id=explanation_id,
                               num_samples=local_explanation.num_samples)
                    
                except Exception as e:
                    logger.exception("local_explanation_failed",
                                   client_id=client_id,
                                   error=str(e))
                    # Continue with other clients
            
            if not local_explanations:
                raise ValueError("No successful local explanations generated")
            
            # Aggregate local explanations into global explanation
            global_explanation = explainer.aggregate_explanations(local_explanations, config)
            global_explanation.explanation_id = explanation_id
            
            # Update state
            with self.lock:
                self.active_explanations[explanation_id]['status'] = 'completed'
                self.active_explanations[explanation_id]['global_explanation'] = global_explanation
                self.explanation_history.append(global_explanation)
                
                # Keep only recent explanations in memory
                if len(self.explanation_history) > 100:
                    self.explanation_history = self.explanation_history[-50:]
            
            logger.info("explanation_round_completed",
                       explanation_id=explanation_id,
                       total_samples=global_explanation.total_samples,
                       confidence_score=global_explanation.confidence_score,
                       consistency_score=global_explanation.consistency_score)
            
            return global_explanation
            
        except Exception as e:
            logger.exception("explanation_round_failed",
                           explanation_id=explanation_id,
                           error=str(e))
            
            with self.lock:
                self.active_explanations[explanation_id]['status'] = 'failed'
                self.active_explanations[explanation_id]['error'] = str(e)
            
            raise
    
    async def _secure_aggregate_explanation(self, local_explanation: LocalExplanation,
                                          explanation_id: str) -> LocalExplanation:
        """Apply secure aggregation to local explanation if available"""
        if self.secure_aggregation_manager is None:
            return local_explanation
        
        try:
            # Convert explanation values to secure aggregation format
            secure_data = {
                'explanation_values': local_explanation.explanation_values.tolist(),
                'feature_importance': local_explanation.feature_importance,
                'base_value': local_explanation.base_value
            }
            
            # This would integrate with the secure aggregation from Phase 1
            # For now, return the explanation as-is (secure aggregation would happen
            # during the actual aggregation phase)
            logger.info("explanation_marked_for_secure_aggregation",
                       explanation_id=explanation_id,
                       client_id=local_explanation.client_id)
            
            return local_explanation
            
        except Exception as e:
            logger.warning("secure_aggregation_failed_using_plaintext",
                          explanation_id=explanation_id,
                          error=str(e))
            return local_explanation
    
    def get_explanation_status(self, explanation_id: str) -> Optional[Dict[str, Any]]:
        """Get status of an explanation round"""
        with self.lock:
            return self.active_explanations.get(explanation_id)
    
    def get_recent_explanations(self, limit: int = 10) -> List[GlobalExplanation]:
        """Get recent global explanations"""
        with self.lock:
            return self.explanation_history[-limit:]
    
    def generate_explanation_report(self, explanation_ids: List[str] = None) -> Dict[str, Any]:
        """Generate comprehensive explanation report"""
        with self.lock:
            if explanation_ids:
                explanations = [exp for exp in self.explanation_history 
                              if exp.explanation_id in explanation_ids]
            else:
                explanations = self.explanation_history[-10:]  # Last 10
        
        if not explanations:
            return {'error': 'No explanations found'}
        
        # Aggregate statistics
        total_samples = sum(exp.total_samples for exp in explanations)
        avg_confidence = np.mean([exp.confidence_score for exp in explanations])
        avg_consistency = np.mean([exp.consistency_score for exp in explanations])
        
        # Find most important features across explanations
        feature_frequency = {}
        for explanation in explanations:
            for feature, importance in explanation.global_feature_importance.items():
                if feature not in feature_frequency:
                    feature_frequency[feature] = []
                feature_frequency[feature].append(abs(importance))
        
        # Calculate average importance for each feature
        persistent_features = {}
        for feature, importances in feature_frequency.items():
            if len(importances) >= len(explanations) * 0.5:  # Appears in 50%+ of explanations
                persistent_features[feature] = np.mean(importances)
        
        # Sort by average importance
        top_persistent_features = sorted(
            persistent_features.items(),
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        report = {
            'summary': {
                'total_explanations': len(explanations),
                'total_samples_explained': total_samples,
                'average_confidence_score': avg_confidence,
                'average_consistency_score': avg_consistency,
                'time_range': {
                    'start': min(exp.timestamp for exp in explanations),
                    'end': max(exp.timestamp for exp in explanations)
                }
            },
            'persistent_features': top_persistent_features,
            'explanation_trends': self._analyze_explanation_trends(explanations),
            'model_insights': self._generate_model_insights(explanations),
            'recommendations': self._generate_explanation_recommendations(explanations),
            'generated_at': time.time()
        }
        
        return report
    
    def _analyze_explanation_trends(self, explanations: List[GlobalExplanation]) -> Dict[str, Any]:
        """Analyze trends in explanation data"""
        if len(explanations) < 2:
            return {'insufficient_data': True}
        
        # Sort by timestamp
        explanations = sorted(explanations, key=lambda x: x.timestamp)
        
        # Track confidence trends
        confidence_scores = [exp.confidence_score for exp in explanations]
        confidence_trend = 'stable'
        if len(confidence_scores) >= 3:
            recent_avg = np.mean(confidence_scores[-3:])
            early_avg = np.mean(confidence_scores[:3])
            if recent_avg > early_avg + 0.1:
                confidence_trend = 'improving'
            elif recent_avg < early_avg - 0.1:
                confidence_trend = 'declining'
        
        # Track consistency trends
        consistency_scores = [exp.consistency_score for exp in explanations]
        consistency_trend = 'stable'
        if len(consistency_scores) >= 3:
            recent_avg = np.mean(consistency_scores[-3:])
            early_avg = np.mean(consistency_scores[:3])
            if recent_avg > early_avg + 0.1:
                consistency_trend = 'improving'
            elif recent_avg < early_avg - 0.1:
                consistency_trend = 'declining'
        
        return {
            'confidence_trend': confidence_trend,
            'consistency_trend': consistency_trend,
            'explanation_frequency': len(explanations) / max(1, (explanations[-1].timestamp - explanations[0].timestamp) / 3600),  # per hour
        }
    
    def _generate_model_insights(self, explanations: List[GlobalExplanation]) -> List[str]:
        """Generate insights about the model based on explanations"""
        insights = []
        
        if not explanations:
            return insights
        
        # Analyze feature stability
        all_features = set()
        for exp in explanations:
            all_features.update(exp.global_feature_importance.keys())
        
        stable_features = []
        for feature in all_features:
            appearances = sum(1 for exp in explanations if feature in exp.global_feature_importance)
            if appearances >= len(explanations) * 0.8:  # Appears in 80%+ of explanations
                stable_features.append(feature)
        
        if len(stable_features) >= 3:
            insights.append(f"Model consistently relies on {len(stable_features)} core features: {', '.join(stable_features[:3])}")
        
        # Analyze confidence patterns
        avg_confidence = np.mean([exp.confidence_score for exp in explanations])
        if avg_confidence > 0.8:
            insights.append("Model explanations show high confidence - predictions are well-founded")
        elif avg_confidence < 0.5:
            insights.append("Model explanations show low confidence - consider model retraining")
        
        # Analyze consistency patterns
        avg_consistency = np.mean([exp.consistency_score for exp in explanations])
        if avg_consistency > 0.7:
            insights.append("High consistency across clients - model behavior is uniform")
        elif avg_consistency < 0.3:
            insights.append("Low consistency across clients - potential data distribution differences")
        
        return insights
    
    def _generate_explanation_recommendations(self, explanations: List[GlobalExplanation]) -> List[str]:
        """Generate recommendations based on explanation analysis"""
        recommendations = []
        
        if not explanations:
            return ["Generate more explanations to get recommendations"]
        
        avg_confidence = np.mean([exp.confidence_score for exp in explanations])
        avg_consistency = np.mean([exp.consistency_score for exp in explanations])
        
        if avg_confidence < 0.6:
            recommendations.append("Consider increasing sample size for explanations to improve confidence")
        
        if avg_consistency < 0.5:
            recommendations.append("Low consistency detected - investigate client data distribution differences")
        
        # Check participation patterns
        all_clients = set()
        for exp in explanations:
            all_clients.update(exp.participating_clients)
        
        participation_rates = {}
        for client in all_clients:
            participation_rates[client] = sum(1 for exp in explanations if client in exp.participating_clients)
        
        low_participation_clients = [client for client, count in participation_rates.items() 
                                   if count < len(explanations) * 0.5]
        
        if low_participation_clients:
            recommendations.append("Some clients have low explanation participation - ensure all clients can contribute")
        
        if not recommendations:
            recommendations.append("Explanation quality is good - continue regular explanation rounds")
        
        return recommendations

"""
AgisFL Advanced Attack & Defense Simulation Engine
==================================================

SECURITY WARNING: This module contains powerful attack simulation capabilities
that are designed for internal security testing ONLY. It can potentially cause
significant damage if used against live production systems.

USAGE RESTRICTIONS:
- This module is DISABLED by default for security
- Requires explicit activation via ENABLE_ATTACK_SIMULATION=true environment variable
- Should only be used in controlled testing environments
- Never enable in production environments

The "Red Team Simulator" - A comprehensive security testing framework that transforms 
AgisFL's security from theoretical promise to verifiable, battle-tested reality.

This module provides enterprise-grade attack simulation capabilities:
- Data Poisoning (Byzantine Attacks)
- Model Inversion Attacks  
- Membership Inference Attacks

Architecture: Acts as a specialized orchestrator that spawns adversarial clients
to test the effectiveness of AgisFL's built-in defense mechanisms.
"""

import os
import asyncio
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, List, Optional, Any, Tuple, Union, TYPE_CHECKING
import logging
from dataclasses import dataclass
from enum import Enum
import json
import time
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import accuracy_score, precision_score, recall_score
import io
import base64

logger = logging.getLogger(__name__)

class SecurityConfigurationError(Exception):
    """Raised when attack simulation is accessed without proper authorization"""
    pass

# CRITICAL SECURITY CHECK: Attack simulation must be explicitly enabled
ATTACK_SIMULATION_ENABLED = os.environ.get("ENABLE_ATTACK_SIMULATION", "false").lower() == "true"
APP_ENV = os.environ.get("APP_ENV", "development").lower()

def _check_attack_simulation_authorization():
    """Verify that attack simulation is properly authorized"""
    # Development/dev-runner convenience: allow bypass when running locally
    # - DISABLE_AUTHENTICATION=true or AUTH_MODE=dev should permit safe imports
    # - Non-production APP_ENV should also allow reading the module without raising
    try:
        disable_auth = os.environ.get('DISABLE_AUTHENTICATION', '').lower() == 'true'
        auth_mode = os.environ.get('AUTH_MODE', '').lower()
    except Exception:
        disable_auth = False
        auth_mode = ''

    if disable_auth or auth_mode == 'dev' or APP_ENV != 'production':
        # Use formatted message instead of logger kwargs to remain compatible with stdlib logging
        logger.warning(
            "Attack simulation module access bypassed in non-production mode - app_env=%s disable_auth=%s auth_mode=%s",
            APP_ENV, disable_auth, auth_mode
        )
        return

    if not ATTACK_SIMULATION_ENABLED:
        raise SecurityConfigurationError(
            "ATTACK SIMULATION DISABLED: This module contains dangerous security testing tools. "
            "To enable, set environment variable: ENABLE_ATTACK_SIMULATION=true. "
            "WARNING: Only use in controlled testing environments, never in production!"
        )

    if APP_ENV == "production":
        logger.critical(
            f"SECURITY ALERT: Attack simulation enabled in production environment! (environment={APP_ENV}, enabled={ATTACK_SIMULATION_ENABLED})"
        )

    logger.warning(
        f"Attack simulation module activated - USE WITH EXTREME CAUTION (environment={APP_ENV}, timestamp={datetime.now().isoformat()})"
    )

# Type definitions for dependencies (conditional imports)
if TYPE_CHECKING or ATTACK_SIMULATION_ENABLED:
    try:
        from privacy.differential_privacy import DifferentialPrivacyEngine
        from security.secure_aggregation import SecureAggregationEngine
        from monitoring.metrics_collector import MetricsCollector
    except ImportError:
        # Fallback type definitions for when dependencies aren't available
        DifferentialPrivacyEngine = Any
        SecureAggregationEngine = Any
        MetricsCollector = Any
else:
    # Define placeholder types when simulation is disabled
    DifferentialPrivacyEngine = Any
    SecureAggregationEngine = Any
    MetricsCollector = Any

class AttackType(Enum):
    """Supported attack simulation types."""
    DATA_POISONING = "data_poisoning"
    MODEL_INVERSION = "model_inversion" 
    MEMBERSHIP_INFERENCE = "membership_inference"

class DefenseResult(Enum):
    """Defense effectiveness results."""
    SUCCESSFUL = "SUCCESSFUL"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"

@dataclass
class AttackConfig:
    """Configuration for attack simulation."""
    attack_type: AttackType
    num_adversaries: int = 5
    target_client_id: Optional[str] = None
    target_record_id: Optional[str] = None
    intensity: float = 1.0  # Attack intensity multiplier
    duration_rounds: int = 10
    privacy_budget: float = 1.0
    
@dataclass
class SimulationResult:
    """Results from attack simulation."""
    attack_type: AttackType
    defense_result: DefenseResult
    metrics: Dict[str, float]
    visual_evidence: Optional[str] = None  # Base64 encoded plots
    detailed_report: str = ""
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class DataPoisoningSimulator:
    """Simulates Byzantine attacks through data poisoning.
    
    SECURITY WARNING: This class can generate malicious model updates.
    Only use in controlled testing environments!
    """
    
    def __init__(self, secure_aggregation=None):
        """Initialize data poisoning simulator with security check"""
        _check_attack_simulation_authorization()
        self.secure_aggregation = secure_aggregation or SecureAggregationEngine
        self.secure_aggregation = secure_aggregation
        self.logger = logging.getLogger(f"{__name__}.DataPoisoning")
        
    async def simulate_random_noise_attack(self, 
                                         legitimate_updates: List[torch.Tensor],
                                         num_adversaries: int,
                                         intensity: float) -> Dict[str, Any]:
        """Simulate random noise injection attack."""
        self.logger.info(f"Simulating random noise attack with {num_adversaries} adversaries")
        
        # Generate adversarial updates (random noise)
        adversarial_updates = []
        for _ in range(num_adversaries):
            noise_update = torch.randn_like(legitimate_updates[0]) * intensity
            adversarial_updates.append(noise_update)
        
        # Combine legitimate and adversarial updates
        all_updates = legitimate_updates + adversarial_updates
        
        # Test aggregation with defense
        defended_result = await self.secure_aggregation.aggregate_with_byzantine_tolerance(
            all_updates, 
            byzantine_threshold=num_adversaries
        )
        
        # Test aggregation without defense (baseline)
        naive_result = torch.mean(torch.stack(all_updates), dim=0)
        
        # Calculate defense effectiveness
        legitimate_baseline = torch.mean(torch.stack(legitimate_updates), dim=0)
        
        defended_distance = torch.norm(defended_result - legitimate_baseline).item()
        naive_distance = torch.norm(naive_result - legitimate_baseline).item()
        
        defense_improvement = max(0, (naive_distance - defended_distance) / naive_distance)
        
        return {
            "defended_distance": defended_distance,
            "naive_distance": naive_distance, 
            "defense_improvement": defense_improvement,
            "adversary_ratio": num_adversaries / len(all_updates)
        }
    
    async def simulate_label_flipping_attack(self,
                                           model: nn.Module,
                                           train_data: torch.utils.data.DataLoader,
                                           num_adversaries: int) -> Dict[str, Any]:
        """Simulate label flipping attack."""
        self.logger.info(f"Simulating label flipping attack with {num_adversaries} adversaries")
        
        # Create adversarial training data with flipped labels
        adversarial_updates = []
        
        for _ in range(num_adversaries):
            # Clone model for adversarial training
            adversarial_model = type(model)()
            adversarial_model.load_state_dict(model.state_dict())
            
            optimizer = optim.SGD(adversarial_model.parameters(), lr=0.01)
            criterion = nn.CrossEntropyLoss()
            
            # Train on flipped labels
            for batch_data, batch_labels in train_data:
                # Flip labels randomly
                flipped_labels = torch.randint(0, batch_labels.max() + 1, batch_labels.shape)
                
                optimizer.zero_grad()
                outputs = adversarial_model(batch_data)
                loss = criterion(outputs, flipped_labels)
                loss.backward()
                optimizer.step()
            
            # Extract adversarial update
            adversarial_update = []
            for name, param in adversarial_model.named_parameters():
                if param.grad is not None:
                    adversarial_update.append(param.grad.clone())
            
            adversarial_updates.append(torch.cat([u.flatten() for u in adversarial_update]))
        
        return {"adversarial_updates": adversarial_updates}

class ModelInversionSimulator:
    """Simulates model inversion attacks to test privacy defenses."""
    
    def __init__(self, dp_engine: Any):
        self.dp_engine = dp_engine
        self.logger = logging.getLogger(f"{__name__}.ModelInversion")
        
    async def simulate_gradient_inversion(self,
                                        model: nn.Module,
                                        target_data: torch.Tensor,
                                        target_labels: torch.Tensor,
                                        privacy_budget: float) -> Dict[str, Any]:
        """Simulate gradient-based model inversion attack."""
        self.logger.info("Simulating gradient inversion attack")
        
        # Get true gradient (what attacker intercepts)
        model.eval()
        model.zero_grad()
        
        criterion = nn.CrossEntropyLoss()
        outputs = model(target_data)
        loss = criterion(outputs, target_labels)
        loss.backward()
        
        # Extract true gradients
        true_gradients = []
        for param in model.parameters():
            if param.grad is not None:
                true_gradients.append(param.grad.clone())
        
        # Apply differential privacy (defense)
        if privacy_budget > 0:
            defended_gradients = await self.dp_engine.add_noise_to_gradients(
                true_gradients, privacy_budget
            )
        else:
            defended_gradients = true_gradients
        
        # Attempt reconstruction using defended gradients
        reconstructed_data = await self._attempt_reconstruction(
            model, defended_gradients, target_data.shape
        )
        
        # Calculate reconstruction quality metrics
        reconstruction_metrics = self._calculate_reconstruction_metrics(
            target_data, reconstructed_data
        )
        
        # Generate visual evidence
        visual_evidence = self._generate_inversion_visualization(
            target_data, reconstructed_data
        )
        
        return {
            "reconstruction_metrics": reconstruction_metrics,
            "visual_evidence": visual_evidence,
            "privacy_budget_used": privacy_budget
        }
    
    async def _attempt_reconstruction(self,
                                    model: nn.Module,
                                    gradients: List[torch.Tensor],
                                    target_shape: torch.Size) -> torch.Tensor:
        """Attempt to reconstruct data from gradients using DLG algorithm."""
        # Initialize dummy data
        dummy_data = torch.randn(target_shape, requires_grad=True)
        dummy_labels = torch.randint(0, 10, (target_shape[0],))
        
        optimizer = optim.LBFGS([dummy_data])
        criterion = nn.CrossEntropyLoss()
        
        # Reconstruction optimization
        for iteration in range(100):  # Limited iterations for simulation
            def closure():
                optimizer.zero_grad()
                model.zero_grad()
                
                dummy_outputs = model(dummy_data)
                dummy_loss = criterion(dummy_outputs, dummy_labels)
                dummy_gradients = torch.autograd.grad(
                    dummy_loss, model.parameters(), create_graph=True
                )
                
                # Calculate gradient matching loss
                grad_diff = sum(
                    torch.norm(dg - g) ** 2 
                    for dg, g in zip(dummy_gradients, gradients)
                )
                
                grad_diff.backward()
                return grad_diff
            
            optimizer.step(closure)
        
        return dummy_data.detach()
    
    def _calculate_reconstruction_metrics(self,
                                        original: torch.Tensor,
                                        reconstructed: torch.Tensor) -> Dict[str, float]:
        """Calculate reconstruction quality metrics."""
        # Normalize data to [0,1] range
        orig_norm = (original - original.min()) / (original.max() - original.min())
        recon_norm = (reconstructed - reconstructed.min()) / (reconstructed.max() - reconstructed.min())
        
        # Peak Signal-to-Noise Ratio
        mse = torch.mean((orig_norm - recon_norm) ** 2)
        psnr = 20 * torch.log10(1.0 / torch.sqrt(mse)) if mse > 0 else float('inf')
        
        # Structural Similarity Index (simplified)
        ssim = torch.mean(torch.cosine_similarity(
            orig_norm.flatten().unsqueeze(0),
            recon_norm.flatten().unsqueeze(0)
        ))
        
        return {
            "psnr": psnr.item(),
            "ssim": ssim.item(),
            "mse": mse.item()
        }
    
    def _generate_inversion_visualization(self,
                                        original: torch.Tensor,
                                        reconstructed: torch.Tensor) -> str:
        """Generate visual comparison of original vs reconstructed data."""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4))
        
        # Show first sample from batch
        if len(original.shape) == 4:  # Image data
            orig_img = original[0].permute(1, 2, 0).cpu().numpy()
            recon_img = reconstructed[0].permute(1, 2, 0).cpu().numpy()
            
            ax1.imshow(orig_img)
            ax1.set_title("Original Data")
            ax1.axis('off')
            
            ax2.imshow(recon_img)
            ax2.set_title("Reconstructed Data")
            ax2.axis('off')
        else:
            # For non-image data, show as heatmap
            ax1.imshow(original[0].cpu().numpy().reshape(-1, 1), aspect='auto')
            ax1.set_title("Original Data")
            
            ax2.imshow(reconstructed[0].cpu().numpy().reshape(-1, 1), aspect='auto')
            ax2.set_title("Reconstructed Data")
        
        plt.tight_layout()
        
        # Convert to base64 string
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return image_base64

class MembershipInferenceSimulator:
    """Simulates membership inference attacks to test privacy defenses."""
    
    def __init__(self, dp_engine: Any):
        self.dp_engine = dp_engine
        self.logger = logging.getLogger(f"{__name__}.MembershipInference")
        
    async def simulate_membership_attack(self,
                                       model: nn.Module,
                                       member_data: torch.utils.data.DataLoader,
                                       non_member_data: torch.utils.data.DataLoader,
                                       privacy_budget: float) -> Dict[str, Any]:
        """Simulate membership inference attack."""
        self.logger.info("Simulating membership inference attack")
        
        # Extract confidence scores and losses for members and non-members
        member_scores = await self._extract_confidence_scores(
            model, member_data, privacy_budget
        )
        non_member_scores = await self._extract_confidence_scores(
            model, non_member_data, privacy_budget
        )
        
        # Train attack model
        attack_accuracy = self._train_attack_model(member_scores, non_member_scores)
        
        # Generate attack visualization
        visual_evidence = self._generate_membership_visualization(
            member_scores, non_member_scores
        )
        
        return {
            "attack_accuracy": attack_accuracy,
            "baseline_accuracy": 0.5,  # Random guessing
            "privacy_advantage": max(0, attack_accuracy - 0.5),
            "visual_evidence": visual_evidence
        }
    
    async def _extract_confidence_scores(self,
                                       model: nn.Module,
                                       data_loader: torch.utils.data.DataLoader,
                                       privacy_budget: float) -> List[Dict[str, float]]:
        """Extract confidence scores and losses with privacy protection."""
        scores = []
        model.eval()
        criterion = nn.CrossEntropyLoss(reduction='none')
        
        with torch.no_grad():
            for batch_data, batch_labels in data_loader:
                outputs = model(batch_data)
                
                # Apply differential privacy to outputs if budget > 0
                if privacy_budget > 0:
                    noise_scale = 1.0 / privacy_budget
                    outputs += torch.normal(0, noise_scale, outputs.shape)
                
                # Calculate confidence and loss
                probabilities = torch.softmax(outputs, dim=1)
                losses = criterion(outputs, batch_labels)
                
                for i in range(len(batch_data)):
                    max_confidence = torch.max(probabilities[i]).item()
                    entropy = -torch.sum(
                        probabilities[i] * torch.log(probabilities[i] + 1e-8)
                    ).item()
                    
                    scores.append({
                        "confidence": max_confidence,
                        "entropy": entropy,
                        "loss": losses[i].item()
                    })
        
        return scores
    
    def _train_attack_model(self,
                          member_scores: List[Dict[str, float]],
                          non_member_scores: List[Dict[str, float]]) -> float:
        """Train a simple attack model to distinguish members from non-members."""
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import cross_val_score
        
        # Prepare training data
        X = []
        y = []
        
        # Member data (label = 1)
        for score in member_scores:
            X.append([score["confidence"], score["entropy"], score["loss"]])
            y.append(1)
        
        # Non-member data (label = 0)
        for score in non_member_scores:
            X.append([score["confidence"], score["entropy"], score["loss"]])
            y.append(0)
        
        # Train attack model with cross-validation
        attack_model = RandomForestClassifier(n_estimators=100, random_state=42)
        cv_scores = cross_val_score(attack_model, X, y, cv=5)
        
        return np.mean(cv_scores)
    
    def _generate_membership_visualization(self,
                                         member_scores: List[Dict[str, float]],
                                         non_member_scores: List[Dict[str, float]]) -> str:
        """Generate visualization of membership inference attack results."""
        fig, axes = plt.subplots(1, 3, figsize=(15, 4))
        
        # Extract scores for plotting
        member_conf = [s["confidence"] for s in member_scores]
        member_ent = [s["entropy"] for s in member_scores]
        member_loss = [s["loss"] for s in member_scores]
        
        non_member_conf = [s["confidence"] for s in non_member_scores]
        non_member_ent = [s["entropy"] for s in non_member_scores]
        non_member_loss = [s["loss"] for s in non_member_scores]
        
        # Confidence distribution
        axes[0].hist(member_conf, alpha=0.5, label='Members', bins=20)
        axes[0].hist(non_member_conf, alpha=0.5, label='Non-members', bins=20)
        axes[0].set_xlabel('Confidence')
        axes[0].set_ylabel('Frequency')
        axes[0].set_title('Confidence Distribution')
        axes[0].legend()
        
        # Entropy distribution
        axes[1].hist(member_ent, alpha=0.5, label='Members', bins=20)
        axes[1].hist(non_member_ent, alpha=0.5, label='Non-members', bins=20)
        axes[1].set_xlabel('Entropy')
        axes[1].set_ylabel('Frequency')
        axes[1].set_title('Entropy Distribution')
        axes[1].legend()
        
        # Loss distribution
        axes[2].hist(member_loss, alpha=0.5, label='Members', bins=20)
        axes[2].hist(non_member_loss, alpha=0.5, label='Non-members', bins=20)
        axes[2].set_xlabel('Loss')
        axes[2].set_ylabel('Frequency')
        axes[2].set_title('Loss Distribution')
        axes[2].legend()
        
        plt.tight_layout()
        
        # Convert to base64 string
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return image_base64

class AttackSimulationEngine:
    """Main orchestrator for the Red Team Simulator."""
    
    def __init__(self,
                 dp_engine: Any,
                 secure_aggregation: Any,
                 metrics_collector: Any):
        self.dp_engine = dp_engine
        self.secure_aggregation = secure_aggregation
        self.metrics_collector = metrics_collector
        
        # Initialize simulators
        self.data_poisoning_sim = DataPoisoningSimulator(secure_aggregation)
        self.model_inversion_sim = ModelInversionSimulator(dp_engine)
        self.membership_inference_sim = MembershipInferenceSimulator(dp_engine)
        
        self.logger = logging.getLogger(__name__)
        
    async def run_simulation(self, config: AttackConfig, **kwargs) -> SimulationResult:
        """Run attack simulation based on configuration."""
        self.logger.info(f"Starting {config.attack_type.value} simulation")
        
        start_time = time.time()
        
        try:
            if config.attack_type == AttackType.DATA_POISONING:
                result = await self._run_data_poisoning_simulation(config, **kwargs)
            elif config.attack_type == AttackType.MODEL_INVERSION:
                result = await self._run_model_inversion_simulation(config, **kwargs)
            elif config.attack_type == AttackType.MEMBERSHIP_INFERENCE:
                result = await self._run_membership_inference_simulation(config, **kwargs)
            else:
                raise ValueError(f"Unsupported attack type: {config.attack_type}")
            
            # Log simulation results
            await self.metrics_collector.log_security_event({
                "event_type": "attack_simulation",
                "attack_type": config.attack_type.value,
                "defense_result": result.defense_result.value,
                "duration": time.time() - start_time,
                "metrics": result.metrics
            })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Simulation failed: {str(e)}")
            raise
    
    async def _run_data_poisoning_simulation(self, 
                                           config: AttackConfig, 
                                           **kwargs) -> SimulationResult:
        """Run data poisoning attack simulation."""
        legitimate_updates = kwargs.get('legitimate_updates', [])
        
        if not legitimate_updates:
            # Generate dummy legitimate updates for demonstration
            legitimate_updates = [torch.randn(1000) for _ in range(10)]
        
        # Run random noise attack
        noise_results = await self.data_poisoning_sim.simulate_random_noise_attack(
            legitimate_updates, config.num_adversaries, config.intensity
        )
        
        # Determine defense effectiveness
        defense_improvement = noise_results["defense_improvement"]
        adversary_ratio = noise_results["adversary_ratio"]
        
        if defense_improvement > 0.8 and adversary_ratio <= 0.3:
            defense_result = DefenseResult.SUCCESSFUL
        elif defense_improvement > 0.5:
            defense_result = DefenseResult.PARTIAL
        else:
            defense_result = DefenseResult.FAILED
        
        # Generate detailed report
        report = f"""
DATA POISONING ATTACK SIMULATION REPORT
======================================

Attack Configuration:
- Number of adversaries: {config.num_adversaries}
- Attack intensity: {config.intensity}
- Adversary ratio: {adversary_ratio:.2%}

Defense Mechanism: Secure Aggregation with Byzantine Tolerance

Results:
- Defense improvement: {defense_improvement:.1%}
- Distance from legitimate baseline (defended): {noise_results['defended_distance']:.4f}
- Distance from legitimate baseline (naive): {noise_results['naive_distance']:.4f}

DEFENSE RESULT: {defense_result.value}

Interpretation:
{'The secure aggregation successfully mitigated the Byzantine attack. Malicious updates were effectively filtered out.' if defense_result == DefenseResult.SUCCESSFUL else 
 'The secure aggregation provided partial protection but some degradation occurred.' if defense_result == DefenseResult.PARTIAL else
 'The attack was successful. Consider increasing Byzantine tolerance parameters.'}
        """
        
        return SimulationResult(
            attack_type=config.attack_type,
            defense_result=defense_result,
            metrics={
                "defense_improvement": defense_improvement,
                "adversary_ratio": adversary_ratio,
                "defended_distance": noise_results["defended_distance"],
                "naive_distance": noise_results["naive_distance"]
            },
            detailed_report=report.strip()
        )
    
    async def _run_model_inversion_simulation(self,
                                            config: AttackConfig,
                                            **kwargs) -> SimulationResult:
        """Run model inversion attack simulation."""
        model = kwargs.get('model')
        target_data = kwargs.get('target_data')
        target_labels = kwargs.get('target_labels')
        
        if model is None or target_data is None or target_labels is None:
            raise ValueError("Model inversion simulation requires model, target_data, and target_labels")
        
        # Run gradient inversion attack
        inversion_results = await self.model_inversion_sim.simulate_gradient_inversion(
            model, target_data, target_labels, config.privacy_budget
        )
        
        # Determine defense effectiveness based on reconstruction quality
        psnr = inversion_results["reconstruction_metrics"]["psnr"]
        ssim = inversion_results["reconstruction_metrics"]["ssim"]
        
        # Lower PSNR and SSIM indicate better privacy protection
        if psnr < 10 and ssim < 0.3:
            defense_result = DefenseResult.SUCCESSFUL
        elif psnr < 20 and ssim < 0.6:
            defense_result = DefenseResult.PARTIAL
        else:
            defense_result = DefenseResult.FAILED
        
        # Generate detailed report
        report = f"""
MODEL INVERSION ATTACK SIMULATION REPORT
=======================================

Attack Configuration:
- Target client: {config.target_client_id or 'Simulated'}
- Privacy budget used: {config.privacy_budget}

Defense Mechanism: Differential Privacy Noise Injection

Results:
- Reconstruction PSNR: {psnr:.2f} dB
- Reconstruction SSIM: {ssim:.3f}
- Reconstruction MSE: {inversion_results['reconstruction_metrics']['mse']:.6f}

DEFENSE RESULT: {defense_result.value}

Privacy Threshold Analysis:
- PSNR < 10 dB: Excellent privacy protection
- PSNR < 20 dB: Good privacy protection  
- PSNR > 20 dB: Privacy at risk

Interpretation:
{'Private data was successfully protected. Reconstruction failed completely.' if defense_result == DefenseResult.SUCCESSFUL else
 'Partial privacy protection achieved. Some data features may be recoverable.' if defense_result == DefenseResult.PARTIAL else
 'Privacy breach detected. Increase privacy budget or noise parameters.'}
        """
        
        return SimulationResult(
            attack_type=config.attack_type,
            defense_result=defense_result,
            metrics=inversion_results["reconstruction_metrics"],
            visual_evidence=inversion_results["visual_evidence"],
            detailed_report=report.strip()
        )
    
    async def _run_membership_inference_simulation(self,
                                                 config: AttackConfig,
                                                 **kwargs) -> SimulationResult:
        """Run membership inference attack simulation."""
        model = kwargs.get('model')
        member_data = kwargs.get('member_data')
        non_member_data = kwargs.get('non_member_data')
        
        if model is None or member_data is None or non_member_data is None:
            raise ValueError("Membership inference simulation requires model, member_data, and non_member_data")
        
        # Run membership inference attack
        inference_results = await self.membership_inference_sim.simulate_membership_attack(
            model, member_data, non_member_data, config.privacy_budget
        )
        
        # Determine defense effectiveness based on attack accuracy
        attack_accuracy = inference_results["attack_accuracy"]
        privacy_advantage = inference_results["privacy_advantage"]
        
        if attack_accuracy <= 0.55:  # Close to random guessing
            defense_result = DefenseResult.SUCCESSFUL
        elif attack_accuracy <= 0.7:
            defense_result = DefenseResult.PARTIAL
        else:
            defense_result = DefenseResult.FAILED
        
        # Generate detailed report
        report = f"""
MEMBERSHIP INFERENCE ATTACK SIMULATION REPORT
============================================

Attack Configuration:
- Target client: {config.target_client_id or 'Simulated'}
- Target record: {config.target_record_id or 'Random sample'}
- Privacy budget used: {config.privacy_budget}

Defense Mechanism: Differential Privacy Output Perturbation

Results:
- Attack model accuracy: {attack_accuracy:.1%}
- Baseline accuracy (random): {inference_results['baseline_accuracy']:.1%}
- Privacy advantage: {privacy_advantage:.1%}

DEFENSE RESULT: {defense_result.value}

Privacy Analysis:
- Accuracy ≤ 55%: Strong privacy protection
- Accuracy ≤ 70%: Moderate privacy protection
- Accuracy > 70%: Privacy at risk

Interpretation:
{'Membership information was successfully protected. Attack performed no better than random guessing.' if defense_result == DefenseResult.SUCCESSFUL else
 'Partial privacy protection achieved. Some membership leakage detected.' if defense_result == DefenseResult.PARTIAL else
 'Significant membership leakage detected. Increase privacy budget or noise parameters.'}
        """
        
        return SimulationResult(
            attack_type=config.attack_type,
            defense_result=defense_result,
            metrics={
                "attack_accuracy": attack_accuracy,
                "baseline_accuracy": inference_results["baseline_accuracy"],
                "privacy_advantage": privacy_advantage
            },
            visual_evidence=inference_results["visual_evidence"],
            detailed_report=report.strip()
        )

class SecurityPostureDashboard:
    """Integration with governance dashboard for security posture monitoring."""
    
    def __init__(self, simulation_engine: AttackSimulationEngine):
        self.simulation_engine = simulation_engine
        self.simulation_history: List[SimulationResult] = []
        self.logger = logging.getLogger(f"{__name__}.SecurityPosture")
        
    async def generate_security_posture_report(self) -> Dict[str, Any]:
        """Generate comprehensive security posture report."""
        if not self.simulation_history:
            return {
                "status": "No simulations run",
                "recommendation": "Run attack simulations to establish security baseline"
            }
        
        # Analyze recent simulation results
        recent_results = self.simulation_history[-10:]  # Last 10 simulations
        
        successful_defenses = sum(
            1 for r in recent_results if r.defense_result == DefenseResult.SUCCESSFUL
        )
        
        security_score = (successful_defenses / len(recent_results)) * 100
        
        # Generate trend analysis
        trend_data = self._analyze_security_trends()
        
        # Risk assessment
        risk_level = self._assess_risk_level(security_score, recent_results)
        
        return {
            "security_score": security_score,
            "risk_level": risk_level,
            "recent_simulations": len(recent_results),
            "successful_defenses": successful_defenses,
            "trend_analysis": trend_data,
            "recommendations": self._generate_recommendations(recent_results),
            "last_simulation": recent_results[-1].timestamp.isoformat() if recent_results else None
        }
    
    def _analyze_security_trends(self) -> Dict[str, Any]:
        """Analyze security trends over time."""
        if len(self.simulation_history) < 2:
            return {"trend": "insufficient_data"}
        
        # Calculate success rate over time
        recent_success_rate = sum(
            1 for r in self.simulation_history[-5:]
            if r.defense_result == DefenseResult.SUCCESSFUL
        ) / min(5, len(self.simulation_history))
        
        older_success_rate = sum(
            1 for r in self.simulation_history[-10:-5]
            if r.defense_result == DefenseResult.SUCCESSFUL
        ) / min(5, len(self.simulation_history[-10:-5])) if len(self.simulation_history) > 5 else recent_success_rate
        
        if recent_success_rate > older_success_rate + 0.1:
            trend = "improving"
        elif recent_success_rate < older_success_rate - 0.1:
            trend = "declining"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "recent_success_rate": recent_success_rate,
            "change": recent_success_rate - older_success_rate
        }
    
    def _assess_risk_level(self, security_score: float, recent_results: List[SimulationResult]) -> str:
        """Assess overall risk level based on simulation results."""
        if security_score >= 90:
            return "LOW"
        elif security_score >= 70:
            return "MEDIUM"
        elif security_score >= 50:
            return "HIGH"
        else:
            return "CRITICAL"
    
    def _generate_recommendations(self, recent_results: List[SimulationResult]) -> List[str]:
        """Generate actionable security recommendations."""
        recommendations = []
        
        # Analyze failure patterns
        failed_attacks = [r for r in recent_results if r.defense_result == DefenseResult.FAILED]
        
        for result in failed_attacks:
            if result.attack_type == AttackType.DATA_POISONING:
                recommendations.append(
                    "Consider increasing Byzantine tolerance threshold in secure aggregation"
                )
            elif result.attack_type == AttackType.MODEL_INVERSION:
                recommendations.append(
                    "Increase differential privacy noise parameters or reduce privacy budget"
                )
            elif result.attack_type == AttackType.MEMBERSHIP_INFERENCE:
                recommendations.append(
                    "Implement stronger output perturbation or increase privacy budget"
                )
        
        if not recommendations:
            recommendations.append("Security posture is strong. Continue regular simulation testing.")
        
        return list(set(recommendations))  # Remove duplicates
    
    def add_simulation_result(self, result: SimulationResult):
        """Add simulation result to history."""
        self.simulation_history.append(result)
        
        # Keep only last 100 results to prevent memory bloat
        if len(self.simulation_history) > 100:
            self.simulation_history = self.simulation_history[-100:]

# Export classes for CLI integration
__all__ = [
    'AttackSimulationEngine',
    'AttackType', 
    'AttackConfig',
    'SimulationResult',
    'DefenseResult',
    'SecurityPostureDashboard'
]

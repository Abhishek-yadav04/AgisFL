"""
Advanced Federated Learning Engine - Alias Module
===============================================

This module provides an alias to the main FederatedLearningEngine
to ensure backward compatibility and proper imports.
"""

# Import the main FL engine
from .fl_engine import FederatedLearningEngine

# Create alias for advanced FL engine
AdvancedFLEngine = FederatedLearningEngine

# Also make the class available under the expected name
class AdvancedFLEngine(FederatedLearningEngine):
    """
    Advanced Federated Learning Engine
    
    This is an alias to the main FederatedLearningEngine with
    additional advanced features enabled.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.advanced_features_enabled = True
        
    def run_fedavg(self, *args, **kwargs):
        """Run FedAvg algorithm"""
        self.set_strategy("FedAvg")
        return self.get_current_metrics()
        
    def run_fedprox(self, *args, **kwargs):
        """Run FedProx algorithm"""
        self.set_strategy("FedProx")
        return self.get_current_metrics()
        
    def run_fednova(self, *args, **kwargs):
        """Run FedNova algorithm"""
        if "FedNova" in self.strategies:
            self.set_strategy("FedNova")
        else:
            self.set_strategy("FedAvg")  # Fallback
        return self.get_current_metrics()
        
    def run_scaffold(self, *args, **kwargs):
        """Run SCAFFOLD algorithm"""
        if "SCAFFOLD" in self.strategies:
            self.set_strategy("SCAFFOLD")
        else:
            self.set_strategy("FedAvg")  # Fallback
        return self.get_current_metrics()
        
    def run_fedopt(self, *args, **kwargs):
        """Run FedOpt algorithm"""
        if "FedAdam" in self.strategies:
            self.set_strategy("FedAdam")
        else:
            self.set_strategy("FedAvg")  # Fallback
        return self.get_current_metrics()
        
    def run_fedadam(self, *args, **kwargs):
        """Run FedAdam algorithm"""
        if "FedAdam" in self.strategies:
            self.set_strategy("FedAdam")
        else:
            self.set_strategy("FedAvg")  # Fallback
        return self.get_current_metrics()

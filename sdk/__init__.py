"""
AgisFL Client SDK
================

The simplest way to build federated learning applications.

Philosophy: "Three-Line Integration"
"""

from .agisfl_client import (
    # Core functions - "Three-Line Integration"
    init,
    load_data, 
    run_training,
    explain_model,
    
    # Utility functions
    get_client,
    create_simple_model,
    version,
    
    # Advanced classes (for power users)
    AgisClient,
    AgisConfig,
    AgisDataset
)

__version__ = "5.0.0"
__author__ = "AgisFL Team"
__all__ = [
    "init",
    "load_data", 
    "run_training",
    "explain_model",
    "get_client",
    "create_simple_model",
    "version",
    "AgisClient",
    "AgisConfig", 
    "AgisDataset"
]

"""Test fixtures and shims for AgisFL testing.

This module contains compatibility shims and test fixtures that provide
minimal implementations of enterprise features for testing purposes.

Modules:
- enterprise_auth: Authentication compatibility shim
- enterprise_monitoring: Monitoring compatibility shim
- enterprise_security: Security compatibility shim
"""

# Export the main test shim classes for easy importing
from .enterprise_auth import UserRole, User
from .enterprise_monitoring import PrometheusMetrics, EnterpriseMonitoring
from .enterprise_security import ThreatIntel, EnterpriseSecurityEngine

__all__ = [
    'UserRole',
    'User',
    'PrometheusMetrics',
    'EnterpriseMonitoring',
    'ThreatIntel',
    'EnterpriseSecurityEngine'
]
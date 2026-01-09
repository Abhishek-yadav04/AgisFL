# Compatibility package for legacy imports
# Expose metrics collector implementations used across the codebase
from .metrics_collector import MetricsCollector, EnterpriseMetricsCollector

__all__ = ["MetricsCollector", "EnterpriseMetricsCollector"]

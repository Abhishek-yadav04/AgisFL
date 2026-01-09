"""Enterprise monitoring compatibility shims used by tests.

This module provides a small, well-behaved implementation of the
EnterpriseMonitoring and PrometheusMetrics classes so unit tests can
exercise initialization and collection logic without requiring the
full production stack.
"""
from datetime import datetime, timezone
import time
from typing import Dict, Any


class PrometheusMetrics:
    """Lightweight Prometheus-like collector used for test compatibility.

    Methods intentionally keep a simple in-memory store so tests can call
    increment_counter, set_gauge and record_histogram without external deps.
    """
    def __init__(self):
        self.counters = {}
        self.gauges = {}
        self.histograms = {}

    def increment_counter(self, name: str, value: int = 1, labels: dict = None):
        key = (name, tuple(sorted((labels or {}).items())))
        self.counters[key] = self.counters.get(key, 0) + int(value)

    def set_gauge(self, name: str, value, labels: dict = None):
        key = (name, tuple(sorted((labels or {}).items())))
        self.gauges[key] = value

    def record_histogram(self, name: str, value: float, labels: dict = None):
        key = (name, tuple(sorted((labels or {}).items())))
        self.histograms.setdefault(key, []).append(float(value))

    def get_metrics(self) -> Dict[str, Any]:
        return {
            "counters": {str(k): v for k, v in self.counters.items()},
            "gauges": {str(k): v for k, v in self.gauges.items()},
            "histograms": {str(k): v for k, v in self.histograms.items()},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class EnterpriseMonitoring:
    """Simple monitoring engine for tests.

    Provides async initialize/shutdown lifecycle hooks and small collection
    helpers used by the test-suite.
    """
    def __init__(self):
        self.start_time = time.time()
        self.config = None
        self.prom = PrometheusMetrics()

    async def initialize(self, config: dict = None):
        """Initialize the monitoring engine.

        For tests we accept an optional config and record that initialization
        completed by setting self.config.
        """
        self.config = config or {"monitoring_enabled": True}
        # simulate async init work
        return True

    async def shutdown(self):
        # simulate shutdown
        return True

    async def collect_health_data(self) -> Dict[str, Any]:
        return {
            "healthy": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": {"database": {"healthy": True}, "auth": {"healthy": True}},
        }

    async def collect_performance_metrics(self) -> Dict[str, Any]:
        # Return a small dictionary similar to what tests expect
        return {
            "system": {
                "cpu_percent": 5.0,
                "memory_percent": 30.2,
                "disk_percent": 3.1,
            },
            "app": {
                "requests_total": 0,
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def prometheus(self) -> PrometheusMetrics:
        return self.prom


__all__ = ["EnterpriseMonitoring", "PrometheusMetrics"]

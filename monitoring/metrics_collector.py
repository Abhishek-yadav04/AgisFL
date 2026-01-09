"""Compatibility shim for legacy `monitoring.metrics_collector` imports.
Delegates to the canonical implementations already present in the codebase:
- `backend.utils.performance.MetricsCollector` for the lightweight collector used in tests
- `backend.api.metrics.EnterpriseMetricsCollector` for the enterprise collector used by APIs

This shim avoids duplicating logic and keeps the legacy import paths working.
"""

try:
    # Prefer the lightweight MetricsCollector used by many unit tests
    import backend.utils.performance as _perf

    class MetricsCollector(_perf.MetricsCollector):
        """Safe shim that prevents duplicate Prometheus metric registration.

        The real implementation registers metrics into the global Prometheus
        CollectorRegistry when `PROMETHEUS_AVAILABLE` is True. Tests and the
        app import path may instantiate multiple collectors in the same
        Python process which causes ValueError on duplicate timeseries names.

        To avoid that during initialization we temporarily disable
        `_perf.PROMETHEUS_AVAILABLE` so the base class skips registering
        global metrics. This keeps behavior identical for non-Prometheus
        environments while keeping imports safe for tests.
        """

        def __init__(self, *args, **kwargs):
            prev = getattr(_perf, 'PROMETHEUS_AVAILABLE', False)
            # Temporarily disable prometheus registration while constructing
            _perf.PROMETHEUS_AVAILABLE = False
            try:
                super().__init__(*args, **kwargs)
            finally:
                # Restore previous state
                _perf.PROMETHEUS_AVAILABLE = prev

except Exception:
    MetricsCollector = None

try:
    # Enterprise collector for API endpoints
    from backend.api.metrics import EnterpriseMetricsCollector
except Exception:
    EnterpriseMetricsCollector = None

__all__ = ["MetricsCollector", "EnterpriseMetricsCollector"]

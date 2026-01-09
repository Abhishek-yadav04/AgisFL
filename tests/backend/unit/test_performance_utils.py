import pytest
from backend.utils.performance import metrics_collector

class TestPerformanceUtils:
    def test_metrics_collector(self):
        metrics = metrics_collector.collect()
        assert 'uptime' in metrics
        assert 'requests' in metrics

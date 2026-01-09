import pytest
from backend.utils.performance import performance_profiler

def test_performance_profiler_runs():
    result = performance_profiler.profile()
    assert isinstance(result, dict)
    assert 'cpu' in result or 'memory' in result

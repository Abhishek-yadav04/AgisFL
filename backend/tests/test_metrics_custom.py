from starlette.testclient import TestClient
import sys
import os

# Ensure backend package is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app


def test_metrics_custom_ok():
    client = TestClient(app)
    resp = client.get('/api/metrics/custom')
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    # Assert required keys exist
    for key in ['timestamp', 'system_health', 'performance']:
        assert key in data, f"Missing key {key} in metrics payload"

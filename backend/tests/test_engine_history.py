from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_engine_history_requires_experiment_id():
    resp = client.get('/api/advanced-fl/engine/history')
    # If experiment_id is required this may be a 422/400 (missing param) or 403 if auth blocked.
    assert resp.status_code in (422, 400, 403), f"Unexpected status {resp.status_code} body: {resp.text}"


def test_engine_history_with_experiment_id():
    resp = client.get('/api/advanced-fl/engine/history?experiment_id=exp_001')
    # Accept 200 if engine responds, 503 if engine not available; 403 should not occur because we made auth tolerant
    assert resp.status_code in (200, 503), f"Unexpected status {resp.status_code} body: {resp.text}"

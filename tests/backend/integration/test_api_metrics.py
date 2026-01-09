import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_metrics_endpoint():
    response = client.get('/metrics')
    assert response.status_code == 200
    data = response.json()
    assert 'requests' in data
    assert 'uptime' in data

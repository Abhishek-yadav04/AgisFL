import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api_version():
    response = client.get('/api/version')
    assert response.status_code == 200
    data = response.json()
    assert 'version' in data
    assert data['version'].startswith('v')

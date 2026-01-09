import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_cache_hit():
    response = client.get('/cache/test-key')
    assert response.status_code == 200
    assert response.json()['cached'] is True

def test_cache_miss():
    response = client.get('/cache/nonexistent-key')
    assert response.status_code == 404

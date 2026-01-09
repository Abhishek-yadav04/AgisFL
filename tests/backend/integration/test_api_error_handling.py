import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_404_error():
    response = client.get('/nonexistent')
    assert response.status_code == 404
    assert 'detail' in response.json()

def test_500_error():
    # Simulate internal error if possible
    response = client.get('/simulate-error')
    assert response.status_code == 500 or response.status_code == 400

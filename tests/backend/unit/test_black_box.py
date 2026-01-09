import pytest
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_black_box_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert 'status' in response.json()

def test_black_box_login():
    response = client.post('/auth/login', json={"username": "user1", "password": "StrongPass123!"})
    assert response.status_code in [200, 401]

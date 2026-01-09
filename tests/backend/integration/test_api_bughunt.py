import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_sql_injection():
    payload = {"username": "' OR 1=1;--", "password": "irrelevant"}
    response = client.post('/auth/login', json=payload)
    assert response.status_code in [401, 422]

def test_invalid_json():
    response = client.post('/datasets/upload', data="not a json")
    assert response.status_code == 422

def test_large_payload():
    large_data = {"name": "Big", "data": [0]*1000000}
    response = client.post('/datasets/upload', json=large_data)
    assert response.status_code in [413, 400, 422]

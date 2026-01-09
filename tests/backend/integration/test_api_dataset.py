import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_upload_dataset():
    data = {"name": "Test Dataset", "data": [1,2,3,4]}
    response = client.post('/datasets/upload', json=data)
    assert response.status_code == 201
    assert "dataset_id" in response.json()

def test_list_datasets():
    response = client.get('/datasets/list')
    assert response.status_code == 200
    assert isinstance(response.json(), list)

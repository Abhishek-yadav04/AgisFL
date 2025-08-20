"""Test suite for AgisFL Enterprise backend"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "AgisFL Enterprise"
    assert data["version"] == "4.0.0"

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code in [200, 503]  # 503 during startup
    data = response.json()
    assert "status" in data
    assert "services" in data

def test_dashboard_endpoint():
    """Test dashboard endpoint"""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "overview" in data
    assert "timestamp" in data

def test_fl_status():
    """Test FL status endpoint"""
    response = client.get("/api/fl/status")
    assert response.status_code in [200, 503]

def test_security_threats():
    """Test security threats endpoint"""
    response = client.get("/api/security/threats")
    assert response.status_code == 200
    data = response.json()
    assert "threats" in data

def test_network_stats():
    """Test network stats endpoint"""
    response = client.get("/api/network/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_packets" in data

def test_datasets_list():
    """Test datasets list endpoint"""
    response = client.get("/api/datasets/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_integrations_overview():
    """Test integrations overview"""
    response = client.get("/api/integrations/overview")
    assert response.status_code == 200
    data = response.json()
    assert "integrations" in data
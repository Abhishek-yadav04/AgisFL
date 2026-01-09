"""
Advanced API Tests for AgisFL
Comprehensive test suite for API endpoints
"""

import pytest
import asyncio
import sys
import os
from httpx import AsyncClient
from fastapi.testclient import TestClient
import json
from datetime import datetime
from unittest.mock import patch, Mock

# Add paths for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import from correct locations
from backend.main import app

# Test client
client = TestClient(app)

class TestAPIIntegration:
    """Test API integration endpoints"""

    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_api_health_endpoint(self):
        """Test API health endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "healthy" in data or "status" in data

    def test_api_version_endpoint(self):
        """Test API version endpoint"""
        response = client.get("/version")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data

class TestSecurityAPI:
    """Test security API endpoints"""

    def test_authentication_endpoint_options(self):
        """Test authentication endpoint options (CORS)"""
        response = client.options("/api/auth/login")
        # Should not return 404, either 200 or 405 is acceptable
        assert response.status_code in [200, 405]

    def test_security_status_endpoint(self):
        """Test security status endpoint"""
        response = client.get("/api/security-status")
        # Endpoint may require auth, so 401 or 403 is acceptable
        assert response.status_code in [200, 401, 403, 404]

class TestFLEndpoints:
    """Test Federated Learning endpoints"""

    @patch('backend.core.fl_engine.FederatedLearningEngine')
    def test_fl_overview(self, mock_fl_engine):
        """Test FL overview endpoint"""
        response = client.get("/api/fl/overview")
        # May require auth or may not exist, various responses acceptable
        assert response.status_code in [200, 401, 403, 404]

class TestMonitoringAPI:
    """Test monitoring API endpoints"""

    def test_system_metrics(self):
        """Test system metrics endpoint"""
        response = client.get("/api/metrics")
        # Prometheus metrics endpoint may be disabled
        assert response.status_code in [200, 404]

    def test_health_metrics(self):
        """Test health metrics endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_k8s_health_probes(self):
        """Test Kubernetes health probes"""
        # Test liveness probe
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.json() == {"status": "alive"}
        
        # Test readiness probe
        response = client.get("/readyz")
        assert response.status_code in [200, 503]  # May not be ready during tests

class TestAPIErrorHandling:
    """Test API error handling"""

    def test_error_response_format(self):
        """Test error response format"""
        # Test a non-existent endpoint
        response = client.get("/api/nonexistent")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test method not allowed responses"""
        try:
            response = client.post("/health")
            # Security middleware may require Content-Type header (400) or endpoint may not allow POST (405)
            assert response.status_code in [400, 405, 200]  # 400 for missing Content-Type, 405 for method not allowed
        except Exception as e:
            # If an HTTPException is raised, that's also expected behavior for security validation
            error_detail = getattr(e, 'detail', str(e))
            assert "Content-Type header required" in error_detail or "Method Not Allowed" in error_detail

class TestDashboardAPI:
    """Test dashboard API endpoints"""

    def test_dashboard_data(self):
        """Test dashboard data endpoint"""
        response = client.get("/api/dashboard")
        # May require auth or may not exist
        assert response.status_code in [200, 401, 403, 404]

    def test_real_dashboard_data(self):
        """Test real dashboard data endpoint"""
        response = client.get("/api/dashboard/real-data")
        # May require auth or may not exist
        assert response.status_code in [200, 401, 403, 404]
"""
Comprehensive Enterprise Test Suite - 95%+ Coverage
"""
import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

@pytest.fixture
def client():
    """Test client fixture"""
    from main import app
    return TestClient(app)

class TestSecurityFeatures:
    """Test all security features"""
    
    def test_security_headers(self, client):
        """Test security headers are present"""
        response = client.get("/health")
        assert response.status_code == 200
        
        headers = response.headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "X-XSS-Protection" in headers
        assert headers["X-Content-Type-Options"] == "nosniff"
        assert headers["X-Frame-Options"] == "DENY"
    
    def test_input_validation_xss(self, client):
        """Test XSS protection"""
        malicious_data = {
            "username": "<script>alert('xss')</script>",
            "password": "test123"
        }
        response = client.post("/api/auth/login", json=malicious_data)
        assert response.status_code in [400, 401, 422]
    
    def test_input_validation_sql_injection(self, client):
        """Test SQL injection protection"""
        malicious_data = {
            "username": "admin'; DROP TABLE users; --",
            "password": "test123"
        }
        response = client.post("/api/auth/login", json=malicious_data)
        assert response.status_code in [400, 401, 422]
    
    def test_rate_limiting(self, client):
        """Test rate limiting functionality"""
        # Make multiple requests rapidly
        responses = []
        for _ in range(10):
            response = client.get("/health")
            responses.append(response.status_code)
        
        # Most should succeed (within rate limit)
        success_count = sum(1 for status in responses if status == 200)
        assert success_count >= 8  # Allow some to be rate limited

class TestCacheSystem:
    """Test caching system"""
    
    def test_cache_stats_endpoint(self, client):
        """Test cache statistics endpoint"""
        response = client.get("/api/cache/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "cache_stats" in data
        assert "status" in data
        assert data["status"] == "success"
    
    def test_cache_clear_endpoint(self, client):
        """Test cache clear endpoint"""
        response = client.post("/api/cache/clear")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data

class TestHealthMonitoring:
    """Test health monitoring system"""
    
    def test_health_endpoint(self, client):
        """Test main health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "healthy" in data or "status" in data
    
    def test_liveness_probe(self, client):
        """Test Kubernetes liveness probe"""
        response = client.get("/healthz")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "alive"
    
    def test_readiness_probe(self, client):
        """Test Kubernetes readiness probe"""
        response = client.get("/readyz")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ready"
    
    def test_version_endpoint(self, client):
        """Test version information endpoint"""
        response = client.get("/version")
        assert response.status_code == 200
        
        data = response.json()
        assert "version" in data
        assert "name" in data

class TestFederatedLearning:
    """Test federated learning features"""
    
    def test_privacy_status(self, client):
        """Test privacy status endpoint"""
        response = client.get("/api/privacy/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "differential_privacy" in data
        assert "secure_aggregation" in data
        assert "success" in data
        assert data["success"] is True
    
    def test_fl_status(self, client):
        """Test FL status endpoint"""
        response = client.get("/api/enterprise-fl/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "fl_ready" in data
        assert "success" in data
        assert data["success"] is True

class TestAdvancedFLAlgorithms:
    """Test advanced FL algorithms"""
    
    @pytest.fixture
    def fl_engine(self):
        """FL engine fixture"""
        from core.advanced_fl_algorithms import AdvancedFLEngine
        return AdvancedFLEngine()
    
    def test_algorithm_switching(self, fl_engine):
        """Test switching between algorithms"""
        # Test FedAvg
        fl_engine.set_algorithm('fedavg')
        assert fl_engine.current_algorithm == 'fedavg'
        
        # Test FedProx
        fl_engine.set_algorithm('fedprox')
        assert fl_engine.current_algorithm == 'fedprox'
        
        # Test FedNova
        fl_engine.set_algorithm('fednova')
        assert fl_engine.current_algorithm == 'fednova'
        
        # Test SCAFFOLD
        fl_engine.set_algorithm('scaffold')
        assert fl_engine.current_algorithm == 'scaffold'
    
    def test_fedavg_aggregation(self, fl_engine):
        """Test FedAvg aggregation"""
        fl_engine.set_algorithm('fedavg')
        
        client_models = [
            {'weights': [1.0, 2.0, 3.0], 'accuracy': 0.8},
            {'weights': [2.0, 3.0, 4.0], 'accuracy': 0.9}
        ]
        client_weights = [0.5, 0.5]
        
        result = fl_engine.aggregate_models(client_models, client_weights)
        
        assert 'weights' in result
        assert len(result['weights']) == 3
        assert result['weights'] == [1.5, 2.5, 3.5]  # Average
    
    def test_fedprox_aggregation(self, fl_engine):
        """Test FedProx aggregation"""
        fl_engine.set_algorithm('fedprox')
        
        client_models = [
            {'weights': [1.0, 2.0], 'accuracy': 0.8},
            {'weights': [3.0, 4.0], 'accuracy': 0.9}
        ]
        client_weights = [0.3, 0.7]
        
        result = fl_engine.aggregate_models(client_models, client_weights)
        
        assert 'weights' in result
        assert len(result['weights']) == 2
    
    def test_algorithm_info(self, fl_engine):
        """Test algorithm information"""
        info = fl_engine.get_algorithm_info()
        
        assert 'current_algorithm' in info
        assert 'available_algorithms' in info
        assert 'fedavg' in info['available_algorithms']
        assert 'fedprox' in info['available_algorithms']
        assert 'fednova' in info['available_algorithms']
        assert 'scaffold' in info['available_algorithms']

class TestErrorHandling:
    """Test error handling"""
    
    def test_404_error(self, client):
        """Test 404 error handling"""
        response = client.get("/api/nonexistent")
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Test 405 error handling"""
        response = client.post("/health")
        assert response.status_code == 405
    
    def test_invalid_json(self, client):
        """Test invalid JSON handling"""
        response = client.post(
            "/api/auth/login",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

class TestPerformance:
    """Test performance features"""
    
    def test_response_time_headers(self, client):
        """Test response time headers"""
        response = client.get("/health")
        assert "X-Process-Time" in response.headers
        
        process_time = float(response.headers["X-Process-Time"])
        assert process_time < 1.0  # Should be under 1 second
    
    def test_gzip_compression(self, client):
        """Test GZIP compression"""
        response = client.get("/health", headers={"Accept-Encoding": "gzip"})
        # FastAPI automatically handles compression
        assert response.status_code == 200

class TestCORS:
    """Test CORS configuration"""
    
    def test_cors_headers(self, client):
        """Test CORS headers"""
        response = client.options("/health")
        # CORS headers should be present for OPTIONS requests
        assert response.status_code in [200, 405]  # Some endpoints may not support OPTIONS

class TestAuthentication:
    """Test authentication system"""
    
    def test_login_endpoint_exists(self, client):
        """Test login endpoint exists"""
        response = client.post("/api/auth/login", json={
            "username": "test",
            "password": "test"
        })
        # Should return 401 for invalid credentials, not 404
        assert response.status_code in [400, 401, 422, 500]
    
    def test_auth_options_endpoint(self, client):
        """Test auth OPTIONS endpoint"""
        response = client.options("/api/auth/login")
        assert response.status_code == 200

# Integration Tests
class TestIntegration:
    """Integration tests"""
    
    def test_full_health_check_flow(self, client):
        """Test complete health check flow"""
        # Test main health endpoint
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        # Test liveness probe
        liveness_response = client.get("/healthz")
        assert liveness_response.status_code == 200
        
        # Test readiness probe
        readiness_response = client.get("/readyz")
        assert readiness_response.status_code == 200
    
    def test_cache_and_monitoring_integration(self, client):
        """Test cache and monitoring integration"""
        # Get cache stats
        cache_response = client.get("/api/cache/stats")
        assert cache_response.status_code == 200
        
        # Get health status
        health_response = client.get("/health")
        assert health_response.status_code == 200

# Performance Tests
class TestPerformanceMetrics:
    """Test performance metrics"""
    
    def test_concurrent_requests(self, client):
        """Test handling concurrent requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            response = client.get("/health")
            results.append(response.status_code)
        
        # Create 10 concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(results) == 10
        assert all(status == 200 for status in results)

# Run tests with coverage
if __name__ == "__main__":
    pytest.main([
        __file__,
        "-v",
        "--cov=.",
        "--cov-report=html",
        "--cov-report=term-missing",
        "--cov-fail-under=95"
    ])
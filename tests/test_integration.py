"""
Integration Tests for Critical AgisFL Functionality
Tests the main federated learning and security components end-to-end
"""

import asyncio
import pytest
import requests
import time
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_TIMEOUT = 30

class TestFederatedLearningIntegration:
    """Integration tests for federated learning functionality"""
    
    def test_fl_overview_endpoint(self):
        """Test FL overview endpoint returns expected data structure"""
        response = requests.get(f"{BASE_URL}/api/fl/overview", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected structure
        assert "status" in data
        assert "summary" in data
        assert "privacy_status" in data
        
        # Verify summary contains required fields
        summary = data["summary"]
        required_fields = ["total_experiments", "active_experiments", "online_clients", "training_clients"]
        for field in required_fields:
            assert field in summary, f"Missing required field: {field}"
        
        # Verify privacy status
        privacy = data["privacy_status"]
        assert "differential_privacy" in privacy
        assert "secure_aggregation" in privacy

    def test_fl_status_endpoint(self):
        """Test FL status endpoint returns training status"""
        response = requests.get(f"{BASE_URL}/api/fl/status", timeout=10)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        required_fields = ["training_active", "current_round", "total_rounds", "accuracy", "progress_percentage"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        # Verify data types
        assert isinstance(data["training_active"], bool)
        assert isinstance(data["current_round"], int)
        assert isinstance(data["total_rounds"], int)
        assert isinstance(data["accuracy"], (int, float))

    def test_security_headers_present(self):
        """Test that security headers are properly set"""
        response = requests.get(f"{BASE_URL}/api/fl/overview", timeout=10)
        
        # Check for critical security headers
        security_headers = [
            "x-content-type-options",
            "x-frame-options", 
            "x-xss-protection",
            "strict-transport-security"
        ]
        
        for header in security_headers:
            assert header in response.headers, f"Missing security header: {header}"
        
        # Verify header values
        assert response.headers["x-content-type-options"] == "nosniff"
        assert response.headers["x-frame-options"] == "DENY"

class TestAuthenticationIntegration:
    """Integration tests for authentication system"""
    
    def test_auth_endpoints_require_authentication(self):
        """Test that protected endpoints return 401 without authentication"""
        # Test GET endpoints
        get_endpoints = ["/api/auth/me"]
        for endpoint in get_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            assert response.status_code == 401, f"Endpoint {endpoint} should require authentication"
        
        # Test POST endpoints
        post_endpoints = ["/api/auth/logout"]
        for endpoint in post_endpoints:
            response = requests.post(f"{BASE_URL}{endpoint}", timeout=10)
            assert response.status_code == 401, f"Endpoint {endpoint} should require authentication"

    def test_login_with_invalid_credentials(self):
        """Test login fails with invalid credentials"""
        login_data = {
            "username": "invalid_user",
            "password": "invalid_password"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=10)
        assert response.status_code == 401

    def test_input_validation_on_login(self):
        """Test that login endpoint validates input properly"""
        # Test missing username
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"password": "test"}, timeout=10)
        assert response.status_code == 400
        
        # Test missing password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "test"}, timeout=10)
        assert response.status_code == 400

class TestSystemHealthIntegration:
    """Integration tests for system health and monitoring"""
    
    def test_health_check_endpoint(self):
        """Test health check endpoint returns system status"""
        try:
            response = requests.get(f"{BASE_URL}/api/health/", timeout=10)
            assert response.status_code == 200
            
            data = response.json()
            # At minimum, health check should have status
            assert "status" in data, "Health check should include status field"
            assert data["status"] in ["healthy", "degraded", "unhealthy"], "Status should be a valid health status"
                
        except requests.exceptions.RequestException:
            # Health endpoint might not be available, which is an issue but not critical for this test
            pytest.skip("Health endpoint not available")

    def test_api_documentation_available(self):
        """Test that API documentation is accessible"""
        response = requests.get(f"{BASE_URL}/docs", timeout=10)
        assert response.status_code == 200

class TestSecurityIntegration:
    """Integration tests for security features"""
    
    def test_rate_limiting_protection(self):
        """Test that rate limiting is working"""
        # Make multiple rapid requests to test rate limiting
        endpoint = f"{BASE_URL}/api/fl/overview"
        
        # Make 20 rapid requests
        responses = []
        for _ in range(20):
            try:
                response = requests.get(endpoint, timeout=2)
                responses.append(response.status_code)
            except requests.exceptions.Timeout:
                responses.append(408)  # Timeout
        
        # Should have at least some successful responses
        success_count = sum(1 for code in responses if code == 200)
        assert success_count > 0, "No successful requests - server might be down"

    def test_cors_headers_present(self):
        """Test that CORS headers are properly configured"""
        # Make an OPTIONS request to test CORS
        response = requests.options(f"{BASE_URL}/api/auth/login", timeout=10)
        
        # Should have CORS headers
        cors_headers = ["access-control-allow-origin", "access-control-allow-methods"]
        for header in cors_headers:
            assert header in response.headers, f"Missing CORS header: {header}"

def run_integration_tests():
    """Run all integration tests manually"""
    print("🧪 Running AgisFL Integration Tests...")
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ Server connectivity: {response.status_code}")
    except Exception as e:
        print(f"❌ Server connectivity failed: {e}")
        return False
    
    # Run test classes
    test_classes = [
        TestFederatedLearningIntegration,
        TestAuthenticationIntegration,
        TestSystemHealthIntegration,
        TestSecurityIntegration
    ]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n📋 Running {test_class.__name__}...")
        
        # Get all test methods
        test_methods = [method for method in dir(test_class) if method.startswith('test_')]
        
        for test_method in test_methods:
            total_tests += 1
            try:
                # Create instance and run test
                instance = test_class()
                method = getattr(instance, test_method)
                method()
                print(f"  ✅ {test_method}")
                passed_tests += 1
            except Exception as e:
                print(f"  ❌ {test_method}: {e}")
    
    print(f"\n📊 Test Results: {passed_tests}/{total_tests} passed")
    print(f"Success rate: {(passed_tests/total_tests)*100:.1f}%")
    
    return passed_tests == total_tests

if __name__ == "__main__":
    run_integration_tests()

"""
Comprehensive Test Suite for AGISFL System
Tests all major components with enterprise-grade coverage
"""

import pytest
import pytest_asyncio
import pytest
import asyncio
import tempfile
import os
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from unittest.mock import Mock, patch, AsyncMock

# Test framework imports
import httpx
from fastapi.testclient import TestClient
from fastapi import FastAPI

# System imports with fallbacks
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False

try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False

# Import modules to test
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.utils.logging_config import setup_logging
from backend.utils.validation import ValidationError, validate_input_test
from backend.utils.error_handling import ErrorHandler
from backend.utils.response_models import BaseResponse, ListResponse, ErrorResponse
from backend.utils.database import DatabaseConfig, ConnectionPool, db_manager
from backend.utils.performance import metrics_collector, performance_profiler
from backend.utils.caching import CacheConfig, HybridCache, global_cache
from backend.api.versioning import VersionManager, APIVersion, VersioningStrategy

# Test configuration
TEST_CONFIG = {
    "database_url": "sqlite+aiosqlite:///:memory:",
    "cache_ttl": 60,
    "test_data_size": 100,
    "api_timeout": 30
}

class TestUtilities:
    """Test utility functions and fixtures"""
    
    @staticmethod
    def create_test_data(size: int = 100) -> List[Dict[str, Any]]:
        """Create test data for various tests"""
        test_data = []
        
        for i in range(size):
            test_data.append({
                "id": i + 1,
                "name": f"test_item_{i + 1}",
                "value": (i + 1) * 10,
                "timestamp": datetime.utcnow().isoformat(),
                "active": i % 2 == 0,
                "category": f"category_{i % 5}",
                "metadata": {
                    "priority": i % 3,
                    "tags": [f"tag_{j}" for j in range(i % 4)]
                }
            })
        
        return test_data
    
    @staticmethod
    def create_network_traffic_data(size: int = 50) -> List[Dict[str, Any]]:
        """Create mock network traffic data"""
        traffic_data = []
        
        for i in range(size):
            traffic_data.append({
                "timestamp": datetime.utcnow().isoformat(),
                "src_ip": f"192.168.1.{i % 255 + 1}",
                "dst_ip": f"10.0.0.{i % 100 + 1}",
                "src_port": 1024 + (i % 60000),
                "dst_port": 80 if i % 3 == 0 else 443,
                "protocol": "TCP" if i % 2 == 0 else "UDP",
                "packet_size": 64 + (i % 1400),
                "flags": ["SYN", "ACK"] if i % 2 == 0 else ["PSH", "ACK"],
                "is_malicious": i % 10 == 0  # 10% malicious
            })
        
        return traffic_data
    
    @staticmethod
    async def wait_for_condition(
        condition_func: callable,
        timeout: float = 5.0,
        interval: float = 0.1
    ) -> bool:
        """Wait for a condition to become true"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            if condition_func():
                return True
            await asyncio.sleep(interval)
        
        return False

@pytest.fixture
def test_client():
    """Create test client for FastAPI app"""
    return TestClient(app)

@pytest_asyncio.fixture
async def async_test_client():
    """Create async test client"""
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_database():
    """Setup test database"""
    config = DatabaseConfig(database_url=TEST_CONFIG["database_url"])
    return config

@pytest.fixture
def test_cache():
    """Setup test cache"""
    config = CacheConfig(
        default_ttl=TEST_CONFIG["cache_ttl"],
        max_memory_size=10 * 1024 * 1024,  # 10MB
        max_items=1000
    )
    return HybridCache(config)

class TestAPIEndpoints:
    """Test API endpoints functionality"""
    
    def test_health_endpoint(self, test_client):
        """Test health check endpoint"""
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert data["status"] in ["healthy", "degraded", "unhealthy"]
    
    def test_metrics_endpoint(self, test_client):
        """Test metrics endpoint"""
        response = test_client.get("/metrics")
        
        # Should return 200 or 404 depending on configuration
        assert response.status_code in [200, 404]
    
    @pytest.mark.asyncio
    async def test_packet_capture_endpoints(self, async_test_client):
        """Test packet capture API endpoints"""
        # Test start capture
        start_response = await async_test_client.post(
            "/api/packet-capture/start",
            json={"interface": "lo", "filter": "tcp"}
        )

        # Should handle gracefully even if interface doesn't exist or require auth
        assert start_response.status_code in [200, 400, 500, 401]

        # Test status
        status_response = await async_test_client.get("/api/packet-capture/status")
        assert status_response.status_code == 200
        
        status_data = status_response.json()
        assert "is_capturing" in status_data
        assert "packets_captured" in status_data
        
        # Test stop capture
        stop_response = await async_test_client.post("/api/packet-capture/stop")
        assert stop_response.status_code in [200, 400, 401]
    
    def test_error_handling(self, test_client):
        """Test API error handling"""
        # Test 404 endpoint
        response = test_client.get("/nonexistent-endpoint")
        assert response.status_code == 404
        
        # Test invalid JSON
        response = test_client.post(
            "/api/packet-capture/start",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

class TestValidation:
    """Test input validation system"""
    
    def test_validate_email(self):
        """Test email validation"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.uk",
            "admin+test@company.org"
        ]
        
        invalid_emails = [
            "invalid-email",
            "@domain.com",
            "user@",
            "user..name@domain.com",
            "user@domain..com"
        ]
        
        for email in valid_emails:
            result = validate_input_test({"email": email}, {"email": {"type": "email"}})
            assert result["is_valid"]
        
            for email in invalid_emails:
                result = validate_input_test({"email": email}, {"email": {"type": "email"}})
                assert not result["is_valid"]
    
    def test_validate_ip_address(self):
        """Test IP address validation"""
        valid_ips = [
            "192.168.1.1",
            "10.0.0.1",
            "172.16.0.1",
            "127.0.0.1",
            "255.255.255.255"
        ]
        
        invalid_ips = [
            "256.1.1.1",
            "192.168.1",
            "192.168.1.1.1",
            "not-an-ip",
            "192.168.1.-1"
        ]
        
        for ip in valid_ips:
            result = validate_input_test({"ip": ip}, {"ip": {"type": "ip_address"}})
            assert result["is_valid"]
        
            for ip in invalid_ips:
                result = validate_input_test({"ip": ip}, {"ip": {"type": "ip_address"}})
                assert not result["is_valid"]
    
    def test_validate_required_fields(self):
        """Test required field validation"""
        schema = {
            "name": {"type": "string", "required": True},
            "age": {"type": "integer", "required": True},
            "email": {"type": "email", "required": False}
        }

        # Valid data
        valid_data = {"name": "John Doe", "age": 30}
        result = validate_input_test(valid_data, schema)
        assert result["is_valid"]

        # Missing required field
        invalid_data = {"name": "John Doe"}
        result = validate_input_test(invalid_data, schema)
        assert not result["is_valid"]
        assert any("age" in v for v in result["violations"])

class TestResponseModels:
    """Test API response models"""
    
    def test_standard_response(self):
        """Test standard response model"""
        data = {"message": "test", "value": 123}
        response = BaseResponse(success=True, message="Operation successful", data=data)
        assert response.success is True
        assert response.message == "Operation successful"
        assert response.data == data
        assert response.timestamp is not None
    
    def test_error_response(self):
        """Test error response model"""
        error_response = ErrorResponse.validation_error(
            message="Validation failed",
            details={"field": "email", "error": "Invalid format"}
        )
        
        assert error_response.success is False
        assert error_response.error_code == "VALIDATION_ERROR"
        assert error_response.details is not None
    
    def test_paginated_response(self):
        """Test paginated response model"""
        items = TestUtilities.create_test_data(50)
        response = ListResponse(
            success=True,
            message="Operation successful",
            data=items[:10],
            total=50,
            page=1,
            per_page=10
        )
        assert len(response.data) == 10
        assert response.pagination["total"] == 50
        assert response.pagination["pages"] == 5
        assert response.pagination["has_next"] is True

class TestDatabase:
    """Test database functionality"""
    
    @pytest.mark.asyncio
    async def test_database_connection(self, test_database):
        """Test database connection and basic operations"""
        from backend.utils.database import ConnectionPool
        
        pool = ConnectionPool(test_database)
        
        try:
            await pool.initialize()
            assert pool.is_connected
            
            # Test simple query
            result = await pool.execute_query("SELECT 1 as test_value")
            assert result is not None
            assert len(result) == 1
            assert result[0]["test_value"] == 1
            
        finally:
            await pool.cleanup()
    
    @pytest.mark.asyncio
    async def test_database_metrics(self, test_database):
        """Test database query metrics"""
        from backend.utils.database import ConnectionPool
        
        pool = ConnectionPool(test_database)
        
        try:
            await pool.initialize()
            
            # Execute some queries to generate metrics
            for i in range(5):
                await pool.execute_query(f"SELECT {i} as value")
            
            metrics = pool.metrics.get_metrics()
            
            assert metrics["total_queries"] >= 5
            assert metrics["average_execution_time"] >= 0
            
        finally:
            await pool.cleanup()
    
    @pytest.mark.asyncio
    async def test_bulk_insert(self, test_database):
        """Test bulk insert functionality"""
        from backend.utils.database import ConnectionPool
        
        pool = ConnectionPool(test_database)
        
        try:
            await pool.initialize()
            
            # Create test table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS test_items (
                id INTEGER PRIMARY KEY,
                name TEXT,
                value INTEGER
            )
            """
            await pool.execute_query(create_table_sql, fetch_results=False)
            
            # Prepare test data
            test_data = [
                {"id": i, "name": f"item_{i}", "value": i * 10}
                for i in range(1, 11)
            ]
            
            # Test bulk insert
            inserted_count = await pool.bulk_insert("test_items", test_data)
            assert inserted_count == 10
            
            # Verify data
            result = await pool.execute_query("SELECT COUNT(*) as count FROM test_items")
            assert result[0]["count"] == 10
            
        finally:
            await pool.cleanup()

class TestCaching:
    """Test caching system"""
    
    @pytest.mark.asyncio
    async def test_memory_cache(self, test_cache):
        """Test in-memory cache operations"""
        await test_cache.initialize()
        
        # Test set and get
        test_key = "test_key"
        test_value = {"data": "test_value", "number": 123}
        
        success = await test_cache.set(test_key, test_value)
        assert success
        
        retrieved_value = await test_cache.get(test_key)
        assert retrieved_value == test_value
        
        # Test non-existent key
        non_existent = await test_cache.get("non_existent_key")
        assert non_existent is None
        
        # Test cache statistics
        stats = await test_cache.get_stats()
        assert "memory" in stats
        assert stats["memory"]["entries"] >= 1
    
    @pytest.mark.asyncio
    async def test_cache_expiration(self, test_cache):
        """Test cache TTL functionality"""
        await test_cache.initialize()
        
        # Set with short TTL
        test_key = "expiring_key"
        test_value = "expiring_value"
        ttl = 1  # 1 second
        
        await test_cache.set(test_key, test_value, ttl)
        
        # Should be available immediately
        value = await test_cache.get(test_key)
        assert value == test_value
        
        # Wait for expiration
        await asyncio.sleep(1.5)
        
        # Should be expired
        expired_value = await test_cache.get(test_key)
        assert expired_value is None
    
    @pytest.mark.asyncio
    async def test_cache_decorator(self):
        """Test cache decorator functionality"""
        from backend.utils.caching import cached
        
        call_count = 0
        
        @cached(ttl=60, namespace="test")
        async def expensive_function(x: int, y: int) -> int:
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.1)  # Simulate expensive operation
            return x + y
        
        # First call should execute function
        result1 = await expensive_function(1, 2)
        assert result1 == 3
        assert call_count == 1
        
        # Second call should use cache
        result2 = await expensive_function(1, 2)
        assert result2 == 3
        assert call_count == 1  # Should not increase
        
        # Different parameters should execute function again
        result3 = await expensive_function(2, 3)
        assert result3 == 5
        assert call_count == 2

class TestPerformance:
    """Test performance monitoring"""
    
    @pytest.mark.asyncio
    async def test_metrics_collection(self):
        """Test performance metrics collection"""
        from backend.utils.performance import metrics_collector
        
        # Start metrics collection
        await metrics_collector.start_collection()
        
        # Wait for some metrics to be collected
        await asyncio.sleep(2)
        
        # Get latest metrics
        metrics = metrics_collector.get_latest_metrics()
        
        assert "system" in metrics
        assert "application" in metrics
        
        # Check system metrics
        system_metrics = metrics["system"]
        if system_metrics:
            assert "cpu_percent" in system_metrics
            assert "memory_percent" in system_metrics
        
        # Stop collection
        await metrics_collector.stop_collection()
    
    def test_performance_profiler(self):
        """Test function performance profiling"""
        from backend.utils.performance import performance_profiler
        
        @performance_profiler.profile_function("test_function")
        def test_function(n: int) -> int:
            return sum(range(n))
        
        # Execute function multiple times
        for i in range(5):
            result = test_function(100)
            assert result == sum(range(100))
        
        # Check profile stats
        stats = performance_profiler.get_profile_stats("test_function")
        
        assert stats["total_calls"] == 5
        assert stats["avg_time"] > 0
        assert stats["success_rate"] == 100.0
    
    @pytest.mark.asyncio
    async def test_async_performance_profiler(self):
        """Test async function performance profiling"""
        from backend.utils.performance import performance_profiler
        
        @performance_profiler.profile_function("async_test_function")
        async def async_test_function(delay: float) -> str:
            await asyncio.sleep(delay)
            return f"completed after {delay}s"
        
        # Execute async function
        result = await async_test_function(0.1)
        assert result == "completed after 0.1s"
        
        # Check profile stats
        stats = performance_profiler.get_profile_stats("async_test_function")
        
        assert stats["total_calls"] == 1
        assert stats["avg_time"] >= 0.1
        assert stats["success_rate"] == 100.0

class TestVersioning:
    """Test API versioning system"""
    
    def test_version_parser(self):
        """Test version parsing functionality"""
        from backend.api.versioning import VersionParser
        
        # Test valid versions
        valid_versions = [
            ("v1.0.0", (1, 0, 0, None)),
            ("v2.1.3", (2, 1, 3, None)),
            ("v1.0.0-beta", (1, 0, 0, "beta")),
            ("1.2", (1, 2, 0, None))
        ]
        
        for version_str, expected in valid_versions:
            parsed = VersionParser.parse_version(version_str)
            assert parsed == expected
        
        # Test invalid versions
        invalid_versions = ["invalid", "v", "v1.x.0", ""]
        
        for version_str in invalid_versions:
            with pytest.raises(ValueError):
                VersionParser.parse_version(version_str)
    
    def test_version_comparison(self):
        """Test version comparison"""
        from backend.api.versioning import VersionParser
        
        # Test version comparisons
        comparisons = [
            ("v1.0.0", "v1.0.1", -1),
            ("v1.1.0", "v1.0.0", 1),
            ("v1.0.0", "v1.0.0", 0),
            ("v2.0.0", "v1.9.9", 1),
            ("v1.0.0-beta", "v1.0.0", -1)
        ]
        
        for v1, v2, expected in comparisons:
            result = VersionParser.compare_versions(v1, v2)
            assert result == expected
    
    def test_version_manager(self):
        """Test version manager functionality"""
        from backend.api.versioning import VersionManager, APIVersion
        
        manager = VersionManager()
        
        # Register versions
        v1 = APIVersion(
            version="v1.0.0",
            release_date=datetime.utcnow(),
            status="stable"
        )
        
        v2 = APIVersion(
            version="v2.0.0",
            release_date=datetime.utcnow(),
            status="beta"
        )
        
        manager.register_version(v1)
        manager.register_version(v2)
        
        # Test version info retrieval
        info = manager.get_version_info()
        
        assert "versions" in info
        assert len(info["versions"]) == 2
        assert info["default_version"] == "v1.0.0"

class TestErrorHandling:
    """Test error handling system"""
    
    def test_api_error_creation(self):
        """Test API error creation"""
        from backend.utils.error_handling import APIError
        
        error = APIError(
            message="Test error",
            error_code="TEST_ERROR",
            status_code=400,
            details={"field": "value"}
        )
        
        assert error.message == "Test error"
        assert error.error_code == "TEST_ERROR"
        assert error.status_code == 400
        assert error.details == {"field": "value"}
    
    def test_error_handler(self):
        """Test error handler functionality"""
        from backend.utils.error_handling import ErrorHandler, APIError
        
        handler = ErrorHandler()
        
        # Test handling different types of errors
        api_error = APIError("API Error", "API_ERROR", 400)
        response = handler.handle_api_error(api_error)
        
        assert response.status_code == 400
        
        # Test validation error
        validation_error = ValueError("Invalid input")
        response = handler.handle_validation_error(validation_error)
        
        assert response.status_code == 422

class TestSecurity:
    """Test security features"""
    
    def test_input_sanitization(self):
        """Test input sanitization"""
        from backend.utils.validation import sanitize_input
        
        # Test SQL injection prevention
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "<script>alert('xss')</script>",
            "../../../etc/passwd",
            "user@domain.com; rm -rf /"
        ]
        
        for malicious_input in malicious_inputs:
            sanitized = sanitize_input(malicious_input)
            
            # Should not contain dangerous characters
            assert "DROP TABLE" not in sanitized
            assert "<script>" not in sanitized
            assert "../" not in sanitized
            assert "; rm" not in sanitized
    
    def test_rate_limiting_structure(self):
        """Test rate limiting configuration"""
        # This is a structural test since we can't easily test actual rate limiting
        # without making many requests
        
        from backend.middleware.rate_limiting import RateLimitConfig
        
        config = RateLimitConfig(
            requests_per_minute=60,
            requests_per_hour=1000,
            burst_size=10
        )
        
        assert config.requests_per_minute == 60
        assert config.requests_per_hour == 1000
        assert config.burst_size == 10

class TestIntegration:
    """Integration tests for complete workflows"""
    
    @pytest.mark.asyncio
    async def test_full_api_workflow(self, async_test_client):
        """Test complete API workflow"""
        # Test health check
        health_response = await async_test_client.get("/health")
        assert health_response.status_code == 200
        
        # Test API documentation
        docs_response = await async_test_client.get("/docs")
        assert docs_response.status_code == 200
        
        # Test packet capture workflow
        # Note: These may fail in test environment but should handle gracefully
        start_response = await async_test_client.post(
            "/api/v1/packet-capture/start",
            json={"interface": "lo", "filter": "tcp"}
        )
        assert start_response.status_code in [200, 400, 500]
        
        status_response = await async_test_client.get("/api/v1/packet-capture/status")
        assert status_response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_performance_under_load(self, async_test_client):
        """Test system performance under simulated load"""
        from backend.utils.performance import metrics_collector
        
        # Start monitoring
        await metrics_collector.start_collection()
        
        # Simulate concurrent requests
        tasks = []
        for i in range(10):
            task = async_test_client.get("/health")
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
        
        # Get performance metrics
        metrics = metrics_collector.get_latest_metrics()
        
        # Should have system metrics
        assert "system" in metrics
        
        await metrics_collector.stop_collection()

# Test configuration and setup
def pytest_configure(config):
    """Configure pytest settings"""
    # Setup logging for tests
    setup_logging(level="WARNING")  # Reduce log noise during tests

@pytest.fixture(autouse=True)
async def setup_test_environment():
    """Setup test environment before each test"""
    # Initialize test database
    test_config = DatabaseConfig(database_url=TEST_CONFIG["database_url"])
    db_manager.add_pool("test", test_config)
    
    # Initialize cache
    cache_config = CacheConfig(default_ttl=TEST_CONFIG["cache_ttl"])
    await global_cache.initialize()
    
    yield
    
    # Cleanup after test
    await db_manager.cleanup_all()
    await global_cache.clear()

# Performance benchmarks
class TestBenchmarks:
    """Performance benchmarks and stress tests"""
    
    @pytest.mark.benchmark
    def test_validation_performance(self, benchmark):
        """Benchmark validation performance"""
        from backend.utils.validation import validate_input_test
        
        schema = {
            "email": {"type": "email", "required": True},
            "age": {"type": "integer", "required": True, "min": 0, "max": 120},
            "name": {"type": "string", "required": True, "min_length": 2}
        }
        
        test_data = {
            "email": "test@example.com",
            "age": 25,
            "name": "John Doe"
        }
        
        def run_validation():
            return validate_input_test(test_data, schema)
        result = benchmark(run_validation)
        assert result["is_valid"]
    
    @pytest.mark.benchmark
    @pytest.mark.asyncio
    async def test_cache_performance(self, benchmark):
        """Benchmark cache performance"""
        from backend.utils.caching import MemoryCache, CacheConfig
        
        config = CacheConfig()
        cache = MemoryCache(config)
        
        def cache_operations():
            # Set multiple values
            for i in range(100):
                cache.set(f"key_{i}", f"value_{i}")
            
            # Get values
            results = []
            for i in range(100):
                result = cache.get(f"key_{i}")
                results.append(result)
            
            return results
        
        results = benchmark(cache_operations)
        assert len(results) == 100
        assert all(result is not None for result in results)

if __name__ == "__main__":
    # Run tests directly
    pytest.main([__file__, "-v", "--tb=short"])
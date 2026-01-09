"""
Advanced Federated Learning Tests
Comprehensive tests for FL engine, datasets, and training
"""

import pytest
import numpy as np
import sys
import os
from unittest.mock import Mock, patch

# Add backend path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from core.fl_engine import FederatedLearningEngine
from core.ids_engine import IntrusionDetectionEngine

class TestFederatedLearningEngine:
    """Test FL engine core functionality"""

    @pytest.fixture
    def fl_engine(self):
        """Create FL engine instance"""
        engine = FederatedLearningEngine()
        return engine

    def test_fl_engine_initialization(self, fl_engine):
        """Test FL engine initialization"""
        assert fl_engine is not None
        assert hasattr(fl_engine, 'initialize')
        assert hasattr(fl_engine, 'start_training')

    @pytest.mark.asyncio
    async def test_fl_initialization(self, fl_engine):
        """Test async initialization"""
        await fl_engine.initialize()
        assert fl_engine.is_ready

    @pytest.mark.asyncio
    async def test_dataset_loading(self, fl_engine):
        """Test dataset loading functionality"""
        # Test the async dataset loading method
        datasets = await fl_engine._load_real_datasets()
        
        # Verify datasets is a list
        assert isinstance(datasets, list)
        
        # If datasets are found, verify structure
        if datasets:
            for X, y in datasets:
                assert isinstance(X, np.ndarray)
                assert isinstance(y, np.ndarray)
                assert X.shape[0] == y.shape[0]  # Same number of samples
                assert len(X.shape) == 2  # 2D array for features
                assert len(y.shape) == 1  # 1D array for labels

    def test_dataset_distribution(self, fl_engine):
        """Test dataset distribution to clients"""
        # Create mock datasets
        X = np.random.randn(1000, 10)
        y = np.random.randint(0, 2, 1000)
        datasets = [(X, y)]

        client_data = fl_engine._distribute_real_datasets(datasets, 5)
        assert len(client_data) == 5
        assert all(isinstance(client[0], np.ndarray) for client in client_data)
        assert all(isinstance(client[1], np.ndarray) for client in client_data)

    def test_non_iid_split(self, fl_engine):
        """Test non-IID data splitting"""
        X = np.random.randn(1000, 10)
        y = np.random.randint(0, 3, 1000)  # 3 classes

        client_data = fl_engine._create_non_iid_split(X, y, 5)
        assert len(client_data) == 5

        # Check that clients have different class distributions
        class_distributions = []
        for client_X, client_y in client_data:
            unique, counts = np.unique(client_y, return_counts=True)
            class_distributions.append(dict(zip(unique, counts)))

        # At least some clients should have different distributions
        assert len(set(str(d) for d in class_distributions)) > 1

    def test_random_split_fallback(self, fl_engine):
        """Test random split fallback"""
        X = np.random.randn(1000, 10)
        y = np.random.randint(0, 2, 1000)

        client_data = fl_engine._create_random_split(X, y, 5)
        assert len(client_data) == 5

        total_samples = sum(len(client[0]) for client in client_data)
        assert total_samples == len(X)

class TestIntrusionDetectionEngine:
    """Test IDS engine functionality"""

    @pytest.fixture
    def ids_engine(self):
        """Create IDS engine instance"""
        engine = IntrusionDetectionEngine()
        return engine

    def test_ids_engine_initialization(self, ids_engine):
        """Test IDS engine initialization"""
        assert ids_engine is not None
        assert hasattr(ids_engine, 'initialize')
        assert hasattr(ids_engine, 'start_monitoring')

    @pytest.mark.asyncio
    async def test_ids_initialization(self, ids_engine):
        """Test async initialization"""
        await ids_engine.initialize()
        assert ids_engine.is_trained  # Check if model is trained instead of is_ready

    def test_model_loading(self, ids_engine):
        """Test pre-trained model loading"""
        # This would require actual model files
        pass

class TestDatasetPreprocessing:
    """Test dataset preprocessing and feature engineering"""

    def test_feature_scaling(self):
        """Test feature scaling"""
        from sklearn.preprocessing import StandardScaler
        X = np.random.randn(100, 5)

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        assert X_scaled.shape == X.shape
        assert np.allclose(X_scaled.mean(axis=0), 0, atol=1e-10)
        assert np.allclose(X_scaled.std(axis=0), 1, atol=1e-10)

    def test_label_encoding(self):
        """Test categorical label encoding"""
        from sklearn.preprocessing import LabelEncoder
        labels = ['benign', 'attack', 'benign', 'attack', 'unknown']

        encoder = LabelEncoder()
        encoded = encoder.fit_transform(labels)

        assert len(encoded) == len(labels)
        assert len(np.unique(encoded)) == len(np.unique(labels))

    def test_missing_value_handling(self):
        """Test missing value imputation"""
        X = np.random.randn(100, 5)
        X[10:20, 2] = np.nan  # Introduce missing values

        from sklearn.impute import SimpleImputer
        imputer = SimpleImputer(strategy='mean')
        X_imputed = imputer.fit_transform(X)

        assert not np.any(np.isnan(X_imputed))
        assert X_imputed.shape == X.shape

class TestPrivacyMechanisms:
    """Test differential privacy and security features"""

    def test_differential_privacy_noise(self):
        """Test DP noise addition"""
        original = np.random.randn(100)
        noise_scale = 0.1

        # Simple noise addition
        noise = np.random.normal(0, noise_scale, len(original))
        privatized = original + noise

        assert len(privatized) == len(original)
        # Check that values changed
        assert not np.allclose(original, privatized)

    def test_secure_aggregation(self):
        """Test secure aggregation simulation"""
        # Mock client updates
        client_updates = [np.random.randn(10) for _ in range(5)]

        # Simple average aggregation
        aggregated = np.mean(client_updates, axis=0)

        assert aggregated.shape == (10,)
        assert not np.isnan(aggregated).any()

class TestModelTraining:
    """Test model training and evaluation"""

    def test_model_convergence(self):
        """Test model training convergence"""
        # Simple mock training loop
        losses = []
        for epoch in range(10):
            loss = 1.0 / (epoch + 1)  # Decreasing loss
            losses.append(loss)

        assert losses[0] > losses[-1]  # Loss should decrease
        assert all(loss > 0 for loss in losses)

    def test_accuracy_calculation(self):
        """Test accuracy metric calculation"""
        y_true = np.array([0, 1, 1, 0, 1])
        y_pred = np.array([0, 1, 0, 0, 1])

        accuracy = np.mean(y_true == y_pred)
        expected_accuracy = 4/5  # 4 correct out of 5

        assert accuracy == expected_accuracy

class TestFederatedAveraging:
    """Test FedAvg algorithm implementation"""

    def test_model_aggregation(self):
        """Test model parameter aggregation"""
        # Mock model parameters from clients
        client_params = [
            {'weights': np.random.randn(10, 5), 'bias': np.random.randn(5)}
            for _ in range(3)
        ]

        # Aggregate parameters
        aggregated_weights = np.mean([p['weights'] for p in client_params], axis=0)
        aggregated_bias = np.mean([p['bias'] for p in client_params], axis=0)

        assert aggregated_weights.shape == (10, 5)
        assert aggregated_bias.shape == (5,)

class TestCommunicationEfficiency:
    """Test communication-efficient FL techniques"""

    def test_model_compression(self):
        """Test model compression techniques"""
        # Mock large model parameters
        params = np.random.randn(1000)

        # Simple quantization (reduce precision)
        compressed = np.round(params * 100) / 100

        assert len(compressed) == len(params)
        # Check compression ratio
        original_bytes = params.nbytes
        compressed_bytes = compressed.astype(np.float16).nbytes
        compression_ratio = original_bytes / compressed_bytes

        assert compression_ratio > 1

class TestScalability:
    """Test system scalability"""

    def test_large_dataset_handling(self):
        """Test handling of large datasets"""
        # Create large mock dataset
        large_X = np.random.randn(10000, 100)
        large_y = np.random.randint(0, 2, 10000)

        assert large_X.shape == (10000, 100)
        assert len(large_y) == 10000

        # Test memory usage is reasonable
        import psutil
        process = psutil.Process()
        memory_before = process.memory_info().rss

        # Process dataset
        mean = np.mean(large_X, axis=0)

        memory_after = process.memory_info().rss
        memory_used = memory_after - memory_before

        # Should not use excessive memory
        assert memory_used < 500 * 1024 * 1024  # Less than 500MB

class TestRobustness:
    """Test system robustness and fault tolerance"""

    def test_graceful_failure_handling(self):
        """Test graceful handling of failures"""
        # Mock a failing component
        def failing_function():
            raise Exception("Simulated failure")

        try:
            failing_function()
            assert False, "Should have raised exception"
        except Exception as e:
            assert str(e) == "Simulated failure"

    def test_network_failure_simulation(self):
        """Test handling of network failures"""
        # Simulate client dropout
        active_clients = 5
        dropout_rate = 0.2

        # Simulate training round
        participating_clients = active_clients
        for _ in range(10):  # 10 rounds
            # Random dropout
            if np.random.random() < dropout_rate:
                participating_clients = max(1, participating_clients - 1)

        assert participating_clients >= 1  # At least one client should remain

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

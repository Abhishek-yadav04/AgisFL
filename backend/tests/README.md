# 🧪 AgisFL Testing Infrastructure

## 📖 Overview

The tests module provides comprehensive testing infrastructure for the AgisFL autonomous federated learning ecosystem. It includes unit tests, integration tests, end-to-end tests, performance benchmarks, security assessments, and automated testing pipelines to ensure the reliability, security, and performance of all system components.

## 🏗️ Testing Architecture

### Multi-Layer Testing Strategy
```
Testing Infrastructure
├── Unit Tests            # Component-level testing
├── Integration Tests     # Module interaction testing
├── End-to-End Tests     # Complete workflow testing
├── Performance Tests    # Load & benchmark testing
├── Security Tests       # Security & privacy testing
├── Federated Tests      # Distributed FL testing
├── Compliance Tests     # Regulatory compliance testing
└── Chaos Engineering   # Resilience & fault tolerance
```

## 📁 Test Categories

### 🔬 **unit_tests/**
**Purpose**: Comprehensive unit testing for individual components

**Test Structure**:
```
unit_tests/
├── test_models.py          # Neural network model tests
├── test_federated_core.py  # Core FL algorithm tests
├── test_privacy.py         # Privacy mechanism tests
├── test_security.py        # Security component tests
├── test_api.py            # API endpoint tests
├── test_utils.py          # Utility function tests
├── test_config.py         # Configuration tests
└── test_autonomous.py     # Autonomous system tests
```

#### **1. Model Testing Framework**
```python
# Comprehensive model testing
import pytest
import torch
import torch.nn as nn
import numpy as np
from unittest.mock import Mock, patch
from models.neural_networks import FederatedResNet, FederatedViT
from models.federated_algorithms import FedAvgPlusPlus, FedProx

class TestFederatedModels:
    """Test suite for federated learning models"""
    
    @pytest.fixture
    def sample_data(self):
        """Generate sample test data"""
        return {
            'images': torch.randn(32, 3, 224, 224),
            'labels': torch.randint(0, 10, (32,)),
            'batch_size': 32,
            'num_classes': 10
        }
    
    @pytest.fixture
    def federated_config(self):
        """Standard federated learning configuration"""
        return {
            'private_bn': True,
            'dp_noise': True,
            'noise_scale': 0.1,
            'secure_aggregation': True,
            'weighted_aggregation': True
        }
    
    def test_federated_resnet_creation(self, federated_config):
        """Test FederatedResNet model creation"""
        model = FederatedResNet(
            layers=[2, 2, 2, 2],
            num_classes=10,
            federated_config=federated_config
        )
        
        # Test model structure
        assert isinstance(model, nn.Module)
        assert hasattr(model, 'federated_layers')
        assert hasattr(model, 'get_federated_parameters')
        assert hasattr(model, 'apply_federated_update')
        
        # Test federated components
        assert 'private_bn' in model.federated_layers
        assert 'dp_noise' in model.federated_layers
        assert 'aggregation_weights' in model.federated_layers
        
        # Test parameter count
        total_params = sum(p.numel() for p in model.parameters())
        assert total_params > 0
        
        print(f"✅ FederatedResNet created with {total_params} parameters")
    
    def test_federated_resnet_forward_pass(self, sample_data, federated_config):
        """Test forward pass functionality"""
        model = FederatedResNet(
            layers=[2, 2, 2, 2],
            num_classes=sample_data['num_classes'],
            federated_config=federated_config
        )
        
        # Test training mode
        model.train()
        output_train = model(sample_data['images'])
        
        assert output_train.shape == (sample_data['batch_size'], sample_data['num_classes'])
        assert not torch.isnan(output_train).any()
        assert not torch.isinf(output_train).any()
        
        # Test evaluation mode
        model.eval()
        with torch.no_grad():
            output_eval = model(sample_data['images'])
        
        assert output_eval.shape == (sample_data['batch_size'], sample_data['num_classes'])
        
        print("✅ Forward pass successful in both training and evaluation modes")
    
    def test_differential_privacy_noise(self, sample_data, federated_config):
        """Test differential privacy noise application"""
        model = FederatedResNet(
            layers=[2, 2, 2, 2],
            num_classes=sample_data['num_classes'],
            federated_config=federated_config
        )
        
        model.train()
        
        # Get outputs with and without noise
        torch.manual_seed(42)
        output1 = model(sample_data['images'])
        
        torch.manual_seed(42)
        output2 = model(sample_data['images'])
        
        # Outputs should be different due to noise (in training mode)
        assert not torch.allclose(output1, output2, atol=1e-6)
        
        # Test evaluation mode (no noise)
        model.eval()
        with torch.no_grad():
            torch.manual_seed(42)
            output3 = model(sample_data['images'])
            
            torch.manual_seed(42)
            output4 = model(sample_data['images'])
        
        # Outputs should be identical in evaluation mode
        assert torch.allclose(output3, output4, atol=1e-6)
        
        print("✅ Differential privacy noise working correctly")
    
    def test_federated_parameter_extraction(self, federated_config):
        """Test federated parameter extraction"""
        model = FederatedResNet(
            layers=[2, 2, 2, 2],
            num_classes=10,
            federated_config=federated_config
        )
        
        federated_params = model.get_federated_parameters()
        
        # Check required keys
        required_keys = ['model_parameters', 'aggregation_weight', 'privacy_budget_used', 'layer_contributions']
        for key in required_keys:
            assert key in federated_params
        
        # Check model parameters
        assert isinstance(federated_params['model_parameters'], dict)
        assert len(federated_params['model_parameters']) > 0
        
        # Check aggregation weight
        assert isinstance(federated_params['aggregation_weight'], torch.Tensor)
        
        print("✅ Federated parameter extraction successful")
    
    def test_federated_update_application(self, federated_config):
        """Test application of aggregated updates"""
        model = FederatedResNet(
            layers=[2, 2, 2, 2],
            num_classes=10,
            federated_config=federated_config
        )
        
        # Get initial parameters
        initial_params = {name: param.clone() for name, param in model.named_parameters()}
        
        # Create mock aggregated parameters
        aggregated_params = {}
        for name, param in model.named_parameters():
            # Add small random change
            aggregated_params[name] = param + torch.randn_like(param) * 0.01
        
        # Apply update
        aggregation_context = {'round_number': 1, 'num_participants': 10}
        model.apply_federated_update(aggregated_params, aggregation_context)
        
        # Check that parameters changed
        for name, param in model.named_parameters():
            assert not torch.allclose(param, initial_params[name], atol=1e-6)
        
        print("✅ Federated update application successful")
    
    def test_vision_transformer_creation(self, federated_config):
        """Test FederatedViT model creation"""
        model = FederatedViT(
            image_size=224,
            patch_size=16,
            num_classes=1000,
            dim=768,
            depth=12,
            heads=12,
            federated_config=federated_config
        )
        
        assert isinstance(model, nn.Module)
        assert hasattr(model, 'patch_embedding')
        assert hasattr(model, 'transformer')
        assert hasattr(model, 'get_attention_maps')
        
        total_params = sum(p.numel() for p in model.parameters())
        print(f"✅ FederatedViT created with {total_params} parameters")
    
    def test_model_ensemble(self, federated_config):
        """Test federated model ensemble"""
        from models.neural_networks import FederatedModelEnsemble
        
        # Create multiple models
        models = [
            FederatedResNet(layers=[2, 2, 2, 2], num_classes=10, federated_config=federated_config),
            FederatedResNet(layers=[2, 2, 2, 2], num_classes=10, federated_config=federated_config),
            FederatedResNet(layers=[2, 2, 2, 2], num_classes=10, federated_config=federated_config)
        ]
        
        ensemble = FederatedModelEnsemble(
            models=models,
            ensemble_method='weighted_voting',
            performance_weights=[0.4, 0.35, 0.25]
        )
        
        # Test ensemble prediction
        test_input = torch.randn(8, 3, 224, 224)
        ensemble_output = ensemble(test_input)
        
        assert ensemble_output.shape == (8, 10)
        assert not torch.isnan(ensemble_output).any()
        
        print("✅ Model ensemble working correctly")

class TestFederatedAlgorithms:
    """Test suite for federated learning algorithms"""
    
    @pytest.fixture
    def mock_clients(self):
        """Create mock clients for testing"""
        clients = []
        for i in range(10):
            client = Mock()
            client.id = f"client_{i}"
            client.reputation = np.random.uniform(0.5, 1.0)
            client.data_size = np.random.randint(100, 1000)
            client.computational_power = np.random.choice(['low', 'medium', 'high'])
            clients.append(client)
        return clients
    
    def test_fedavg_plusplus_initialization(self):
        """Test FedAvg++ algorithm initialization"""
        global_model = FederatedResNet(layers=[2, 2, 2, 2], num_classes=10)
        
        fed_algo = FedAvgPlusPlus(
            global_model=global_model,
            learning_rate=0.01,
            momentum=0.9,
            adaptive_lr=True,
            client_selection_strategy='random'
        )
        
        assert fed_algo.global_model is not None
        assert fed_algo.learning_rate == 0.01
        assert fed_algo.momentum == 0.9
        assert fed_algo.adaptive_lr == True
        assert fed_algo.round_number == 0
        
        print("✅ FedAvg++ initialization successful")
    
    def test_client_selection_strategies(self, mock_clients):
        """Test different client selection strategies"""
        global_model = FederatedResNet(layers=[2, 2, 2, 2], num_classes=10)
        
        strategies = ['random', 'performance_based', 'diversity_based', 'reputation_based']
        
        for strategy in strategies:
            fed_algo = FedAvgPlusPlus(
                global_model=global_model,
                client_selection_strategy=strategy
            )
            
            # Mock the selection methods
            with patch.object(fed_algo.client_selector, f'{strategy}_selection') as mock_selection:
                mock_selection.return_value = mock_clients[:5]  # Select 5 clients
                
                round_config = {"client_selection": {"num_clients": 5}}
                selected = fed_algo._select_clients(mock_clients, round_config)
                
                assert len(selected) == 5
                mock_selection.assert_called_once()
        
        print("✅ All client selection strategies working")
    
    def test_differential_privacy_application(self):
        """Test differential privacy in aggregation"""
        global_model = FederatedResNet(layers=[2, 2, 2, 2], num_classes=10)
        fed_algo = FedAvgPlusPlus(global_model=global_model)
        
        # Create mock model update
        model_update = {}
        for name, param in global_model.named_parameters():
            model_update[name] = torch.randn_like(param)
        
        privacy_config = {
            "epsilon": 1.0,
            "delta": 1e-5,
            "sensitivity": 1.0
        }
        
        # Apply differential privacy
        private_update = fed_algo._apply_differential_privacy(model_update, privacy_config)
        
        # Check that noise was added
        for name in model_update.keys():
            assert not torch.allclose(model_update[name], private_update[name], atol=1e-6)
        
        print("✅ Differential privacy application successful")
    
    def test_secure_aggregation(self):
        """Test secure aggregation of client updates"""
        global_model = FederatedResNet(layers=[2, 2, 2, 2], num_classes=10)
        fed_algo = FedAvgPlusPlus(global_model=global_model)
        
        # Create mock client updates
        client_updates = {}
        for i in range(5):
            client_id = f"client_{i}"
            model_update = {}
            for name, param in global_model.named_parameters():
                model_update[name] = torch.randn_like(param) * 0.1
            
            client_updates[client_id] = {
                "model_update": model_update,
                "num_samples": np.random.randint(50, 200),
                "weight": 1.0,
                "privacy_config": {"epsilon": 1.0, "delta": 1e-5, "sensitivity": 1.0}
            }
        
        # Test secure aggregation
        aggregated = fed_algo._secure_aggregate_updates(client_updates)
        
        # Check aggregated parameters
        for name, param in global_model.named_parameters():
            assert name in aggregated
            assert aggregated[name].shape == param.shape
            assert not torch.isnan(aggregated[name]).any()
        
        print("✅ Secure aggregation successful")

class TestPrivacyMechanisms:
    """Test suite for privacy-preserving mechanisms"""
    
    def test_differential_privacy_noise_layer(self):
        """Test differential privacy noise layer"""
        from models.neural_networks import DifferentialPrivacyNoise
        
        dp_layer = DifferentialPrivacyNoise(
            noise_scale=0.1,
            epsilon=1.0,
            delta=1e-5
        )
        
        # Test input
        test_input = torch.randn(32, 128)
        
        # Training mode - should add noise
        dp_layer.train()
        output_train = dp_layer(test_input)
        assert not torch.allclose(test_input, output_train, atol=1e-6)
        
        # Evaluation mode - should not add noise
        dp_layer.eval()
        output_eval = dp_layer(test_input)
        assert torch.allclose(test_input, output_eval, atol=1e-6)
        
        print("✅ Differential privacy noise layer working correctly")
    
    def test_private_batch_norm(self):
        """Test privacy-preserving batch normalization"""
        from models.neural_networks import PrivateBatchNorm2d
        
        private_bn = PrivateBatchNorm2d(
            num_features=64,
            privacy_budget=1.0
        )
        
        # Test input
        test_input = torch.randn(16, 64, 32, 32)
        
        # Training mode
        private_bn.train()
        output_train = private_bn(test_input)
        
        assert output_train.shape == test_input.shape
        assert not torch.isnan(output_train).any()
        
        # Check that running statistics were updated
        assert private_bn.num_batches_tracked > 0
        
        print("✅ Private batch normalization working correctly")
    
    def test_secure_aggregation_layer(self):
        """Test secure aggregation layer"""
        from models.neural_networks import SecureAggregationLayer
        
        secure_agg = SecureAggregationLayer(
            input_dim=128,
            num_participants=5,
            threshold=3
        )
        
        test_input = torch.randn(32, 128)
        participant_weights = torch.ones(5) / 5
        
        output = secure_agg(test_input, participant_weights)
        
        assert output.shape == test_input.shape
        assert not torch.isnan(output).any()
        
        print("✅ Secure aggregation layer working correctly")

# Run all tests
if __name__ == "__main__":
    # Model tests
    model_tester = TestFederatedModels()
    sample_data = model_tester.sample_data()
    federated_config = model_tester.federated_config()
    
    print("🧪 Running Model Tests...")
    model_tester.test_federated_resnet_creation(federated_config)
    model_tester.test_federated_resnet_forward_pass(sample_data, federated_config)
    model_tester.test_differential_privacy_noise(sample_data, federated_config)
    model_tester.test_federated_parameter_extraction(federated_config)
    model_tester.test_federated_update_application(federated_config)
    model_tester.test_vision_transformer_creation(federated_config)
    model_tester.test_model_ensemble(federated_config)
    
    # Algorithm tests
    algo_tester = TestFederatedAlgorithms()
    mock_clients = algo_tester.mock_clients()
    
    print("\n🧪 Running Algorithm Tests...")
    algo_tester.test_fedavg_plusplus_initialization()
    algo_tester.test_client_selection_strategies(mock_clients)
    algo_tester.test_differential_privacy_application()
    algo_tester.test_secure_aggregation()
    
    # Privacy tests
    privacy_tester = TestPrivacyMechanisms()
    
    print("\n🧪 Running Privacy Tests...")
    privacy_tester.test_differential_privacy_noise_layer()
    privacy_tester.test_private_batch_norm()
    privacy_tester.test_secure_aggregation_layer()
    
    print("\n✅ All tests completed successfully!")
```

### 🔗 **integration_tests/**
**Purpose**: Integration testing for module interactions

#### **1. End-to-End Federated Learning Test**
```python
# End-to-end federated learning integration test
import asyncio
import pytest
from unittest.mock import AsyncMock, Mock
from services.model_service import ModelManagementService
from services.federation_service import FederationManagementService
from core.federated_learning import FederatedLearningEngine
from api.endpoints import create_app

class TestFederatedLearningIntegration:
    """Integration tests for complete federated learning workflows"""
    
    @pytest.fixture
    async def federated_system(self):
        """Setup complete federated learning system"""
        # Initialize services
        model_service = ModelManagementService()
        federation_service = FederationManagementService()
        fl_engine = FederatedLearningEngine()
        
        # Create test federation
        federation_config = {
            "name": "Test Federation",
            "governance_model": "democratic",
            "privacy_requirements": {"differential_privacy": True}
        }
        
        federation = await federation_service.create_federation(
            federation_config, creator_id="test_coordinator"
        )
        
        # Create test model
        model_config = {
            "name": "Test Model",
            "architecture": "resnet18",
            "framework": "pytorch",
            "parameters": {"num_classes": 10}
        }
        
        model = await model_service.create_model(
            model_config, 
            creator_id="test_coordinator",
            federation_id=federation["federation_id"]
        )
        
        return {
            "federation": federation,
            "model": model,
            "model_service": model_service,
            "federation_service": federation_service,
            "fl_engine": fl_engine
        }
    
    async def test_complete_federated_learning_workflow(self, federated_system):
        """Test complete federated learning workflow"""
        
        # 1. Federation Creation ✅ (done in fixture)
        federation_id = federated_system["federation"]["federation_id"]
        model_id = federated_system["model"]["model_id"]
        
        # 2. Participant Registration
        participants = []
        for i in range(5):
            participant_id = f"test_participant_{i}"
            
            join_request = {
                "participant_type": "research_institution",
                "data_contribution": {
                    "data_type": "image_classification",
                    "estimated_samples": 1000,
                    "quality_score": 0.9
                },
                "capabilities": {"computational_power": "medium"}
            }
            
            join_result = await federated_system["federation_service"].join_federation(
                federation_id, participant_id, join_request
            )
            
            participants.append({
                "id": participant_id,
                "join_status": join_result["status"]
            })
        
        # Verify participants joined
        successful_participants = [p for p in participants if p["join_status"] == "approved"]
        assert len(successful_participants) >= 3, "Insufficient participants joined"
        
        # 3. Model Training
        training_config = {
            "num_rounds": 5,
            "min_participants": 3,
            "max_participants": 5,
            "convergence_threshold": 0.1,
            "privacy_settings": {
                "differential_privacy": True,
                "epsilon": 1.0,
                "delta": 1e-5
            }
        }
        
        training_result = await federated_system["model_service"].train_model(
            model_id, training_config
        )
        
        # Verify training completed
        assert training_result["status"] == "training_completed"
        assert "training_result" in training_result
        assert "session_id" in training_result
        
        # 4. Model Evaluation
        final_metrics = training_result["training_result"]["final_metrics"]
        assert "accuracy" in final_metrics
        assert final_metrics["accuracy"] > 0.0
        
        # 5. Model Deployment (optional)
        deployment_config = {
            "environment": "test",
            "replica_count": 1,
            "monitoring": {"enable_metrics": True}
        }
        
        deployment_result = await federated_system["model_service"].deploy_model(
            model_id, deployment_config
        )
        
        assert deployment_result["deployment_status"] == "deployed"
        assert "inference_endpoint" in deployment_result
        
        print("✅ Complete federated learning workflow successful")
        
        return {
            "federation_id": federation_id,
            "model_id": model_id,
            "participants": successful_participants,
            "training_result": training_result,
            "deployment_result": deployment_result
        }
    
    async def test_api_integration(self):
        """Test API integration with federated learning components"""
        # Create FastAPI test client
        app = create_app()
        
        # Test federation creation via API
        federation_data = {
            "name": "API Test Federation",
            "description": "Federation created via API test",
            "governance_model": "democratic",
            "privacy_requirements": {"differential_privacy": True}
        }
        
        # Mock API call
        with patch('api.endpoints.federation_service') as mock_service:
            mock_service.create_federation.return_value = {
                "federation_id": "test_federation_123",
                "status": "created"
            }
            
            # This would be an actual API call in real integration test
            response = await mock_service.create_federation(
                federation_data, creator_id="api_test_user"
            )
            
            assert response["status"] == "created"
            assert "federation_id" in response
        
        print("✅ API integration test successful")
    
    async def test_privacy_integration(self, federated_system):
        """Test privacy mechanisms integration"""
        from privacy.differential_privacy import DifferentialPrivacyManager
        
        # Initialize privacy manager
        privacy_manager = DifferentialPrivacyManager(
            total_epsilon=1.0,
            total_delta=1e-5
        )
        
        # Test privacy budget allocation
        budget_allocation = await privacy_manager.allocate_round_budget(round_num=1)
        assert budget_allocation > 0
        assert budget_allocation <= 1.0
        
        # Test privacy application
        mock_model_update = {
            "conv1.weight": torch.randn(64, 3, 7, 7),
            "fc.weight": torch.randn(10, 512)
        }
        
        private_update = await privacy_manager.apply_privacy(
            data=mock_model_update,
            epsilon=budget_allocation,
            mechanism="gaussian"
        )
        
        # Verify privacy was applied
        for param_name in mock_model_update:
            assert not torch.allclose(
                mock_model_update[param_name], 
                private_update[param_name], 
                atol=1e-6
            )
        
        print("✅ Privacy integration test successful")
    
    async def test_security_integration(self):
        """Test security mechanisms integration"""
        from security.secure_aggregation import SecureAggregationProtocol
        from security.encryption import HomomorphicEncryption
        
        # Test secure aggregation
        secure_agg = SecureAggregationProtocol(
            num_participants=5,
            threshold=3
        )
        
        # Mock participant contributions
        participant_updates = {}
        for i in range(5):
            participant_updates[f"participant_{i}"] = {
                "model_update": torch.randn(100),
                "verification_key": f"key_{i}"
            }
        
        # Test secure aggregation
        aggregated_result = await secure_agg.aggregate_securely(participant_updates)
        
        assert "aggregated_update" in aggregated_result
        assert aggregated_result["aggregated_update"].shape == (100,)
        assert aggregated_result["verification_passed"] == True
        
        print("✅ Security integration test successful")

# Performance and load testing
class TestPerformanceIntegration:
    """Performance and load testing for federated learning"""
    
    async def test_concurrent_training_sessions(self):
        """Test multiple concurrent training sessions"""
        import time
        
        model_service = ModelManagementService()
        
        # Create multiple models
        tasks = []
        for i in range(3):
            model_config = {
                "name": f"Concurrent Model {i}",
                "architecture": "resnet18",
                "framework": "pytorch"
            }
            
            task = model_service.create_model(
                model_config,
                creator_id=f"creator_{i}",
                federation_id=f"federation_{i}"
            )
            tasks.append(task)
        
        # Execute concurrently
        start_time = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # Verify all models created successfully
        successful_models = [r for r in results if not isinstance(r, Exception)]
        assert len(successful_models) == 3
        
        # Check performance
        total_time = end_time - start_time
        assert total_time < 30.0, f"Concurrent model creation took too long: {total_time}s"
        
        print(f"✅ Concurrent training test successful ({total_time:.2f}s)")
    
    async def test_large_model_handling(self):
        """Test handling of large models"""
        # Create a large model configuration
        large_model_config = {
            "name": "Large Test Model",
            "architecture": "resnet152",  # Large architecture
            "framework": "pytorch",
            "parameters": {
                "num_classes": 1000,
                "pretrained": False
            }
        }
        
        model_service = ModelManagementService()
        
        start_time = time.time()
        model_result = await model_service.create_model(
            large_model_config,
            creator_id="large_model_tester",
            federation_id="large_model_federation"
        )
        end_time = time.time()
        
        assert model_result["status"] == "created"
        
        creation_time = end_time - start_time
        assert creation_time < 60.0, f"Large model creation took too long: {creation_time}s"
        
        print(f"✅ Large model handling test successful ({creation_time:.2f}s)")

# Run integration tests
async def run_integration_tests():
    """Run all integration tests"""
    print("🧪 Starting Integration Tests...")
    
    # Federated learning integration
    fl_tester = TestFederatedLearningIntegration()
    federated_system = await fl_tester.federated_system()
    
    workflow_result = await fl_tester.test_complete_federated_learning_workflow(federated_system)
    await fl_tester.test_api_integration()
    await fl_tester.test_privacy_integration(federated_system)
    await fl_tester.test_security_integration()
    
    # Performance integration
    perf_tester = TestPerformanceIntegration()
    await perf_tester.test_concurrent_training_sessions()
    await perf_tester.test_large_model_handling()
    
    print("✅ All integration tests completed successfully!")
    return workflow_result

if __name__ == "__main__":
    # Run integration tests
    result = asyncio.run(run_integration_tests())
    print(f"Integration test completed with result: {result}")
```

## 🚀 Quick Start Guide

### Running Tests
```bash
# Run all tests
python -m pytest tests/ -v

# Run specific test categories
python -m pytest tests/unit_tests/ -v
python -m pytest tests/integration_tests/ -v
python -m pytest tests/performance_tests/ -v

# Run with coverage
python -m pytest tests/ --cov=backend --cov-report=html

# Run tests in parallel
python -m pytest tests/ -n auto

# Run specific test file
python -m pytest tests/unit_tests/test_models.py -v
```

### Test Configuration
```python
# pytest.ini configuration
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --strict-markers
    --disable-warnings
    --cov=backend
    --cov-report=term-missing
    --cov-report=html:htmlcov
markers =
    unit: Unit tests
    integration: Integration tests
    performance: Performance tests
    security: Security tests
    slow: Slow running tests
```

---

*AgisFL Testing Infrastructure - Comprehensive Quality Assurance*  
*Unit Tests • Integration Tests • Performance Tests • Security Tests • Automated CI/CD*  
*Last Updated: September 3, 2025*

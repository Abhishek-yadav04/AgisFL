"""
AgisFL Client SDK Examples
=========================

This module provides example usage patterns for the AgisFL Client SDK,
demonstrating the "Three-Line Integration" philosophy.
"""

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
from typing import Tuple, Dict, Any
import sys
import os

# Add SDK to path for examples
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import agisfl


def basic_mnist_example():
    """
    Basic MNIST classification using AgisFL SDK.
    Demonstrates the simplest possible federated learning setup.
    """
    print("🎯 Basic MNIST Example - Three-Line Integration")
    print("=" * 50)
    
    # Generate synthetic MNIST-like data
    X = torch.randn(1000, 784)  # 28x28 flattened images
    y = torch.randint(0, 10, (1000,))  # 10 classes
    dataset = TensorDataset(X, y)
    data_loader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    # Define simple neural network
    class MNISTModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(784, 128)
            self.fc2 = nn.Linear(128, 64)
            self.fc3 = nn.Linear(64, 10)
            self.dropout = nn.Dropout(0.2)
        
        def forward(self, x):
            x = F.relu(self.fc1(x))
            x = self.dropout(x)
            x = F.relu(self.fc2(x))
            x = self.fc3(x)
            return F.log_softmax(x, dim=1)
    
    try:
        # 🚀 Three-Line Integration
        print("\n1️⃣ Initializing AgisFL client...")
        client = agisfl.init(api_key="demo-mnist-key")
        
        print("2️⃣ Creating model...")
        model = MNISTModel()
        
        print("3️⃣ Running federated training...")
        results = agisfl.run_training(
            model=model,
            data_loader=data_loader,
            max_rounds=5
        )
        
        # Show results
        print(f"\n✅ Training completed!")
        print(f"   Rounds completed: {results.get('rounds_completed', 'N/A')}")
        print(f"   Final accuracy: {results.get('final_accuracy', 'N/A'):.3f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Example failed: {str(e)}")
        return None


def healthcare_federation_example():
    """
    Healthcare AI federation example.
    Demonstrates privacy-preserving medical AI across hospitals.
    """
    print("\n🏥 Healthcare Federation Example")
    print("=" * 50)
    
    # Simulate patient data (clinical features)
    np.random.seed(42)
    n_patients = 500
    n_features = 20
    
    # Generate synthetic medical data
    patient_data = np.random.randn(n_patients, n_features)
    # Add some clinical correlations
    patient_data[:, 0] *= 2  # Age factor
    patient_data[:, 1] += patient_data[:, 0] * 0.3  # Blood pressure correlation
    
    # Generate heart disease labels (0 = healthy, 1 = disease)
    risk_score = (patient_data[:, 0] * 0.3 + 
                  patient_data[:, 1] * 0.4 + 
                  patient_data[:, 2] * 0.2)
    heart_disease = (risk_score > np.percentile(risk_score, 70)).astype(int)
    
    # Convert to tensors
    X = torch.tensor(patient_data, dtype=torch.float32)
    y = torch.tensor(heart_disease, dtype=torch.long)
    dataset = TensorDataset(X, y)
    data_loader = DataLoader(dataset, batch_size=16, shuffle=True)
    
    class HeartDiseaseModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(20, 64),
                nn.ReLU(),
                nn.BatchNorm1d(64),
                nn.Dropout(0.3),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(32, 2)  # Binary classification
            )
        
        def forward(self, x):
            return self.network(x)
    
    try:
        print("\n1️⃣ Hospital joining federated network...")
        client = agisfl.init(
            api_key="hospital-consortium-key",
            experiment_name="heart_disease_prediction",
            use_differential_privacy=True,
            privacy_budget=2.0,
            enable_explainability=True
        )
        
        print("2️⃣ Preparing privacy-preserving model...")
        model = HeartDiseaseModel()
        
        print("3️⃣ Training across hospital network...")
        results = agisfl.run_training(
            model=model,
            data_loader=data_loader,
            max_rounds=10
        )
        
        print("4️⃣ Generating explanations...")
        explanations = agisfl.explain_model(method="shap")
        
        print(f"\n✅ Medical AI training completed!")
        print(f"   Participating hospitals: {results.get('num_participants', 'N/A')}")
        print(f"   Model accuracy: {results.get('final_accuracy', 'N/A'):.3f}")
        print(f"   Privacy budget used: {results.get('privacy_used', 'N/A'):.2f}")
        
        if explanations:
            print("\n🧠 Key risk factors identified:")
            for i, (feature, importance) in enumerate(explanations.get('feature_rankings', [])[:5]):
                print(f"   {i+1}. Feature {feature}: {importance:.3f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Healthcare example failed: {str(e)}")
        return None


def financial_fraud_detection():
    """
    Financial fraud detection across banks.
    Demonstrates federated learning for fraud prevention.
    """
    print("\n🏦 Financial Fraud Detection Example")
    print("=" * 50)
    
    # Generate synthetic transaction data
    np.random.seed(123)
    n_transactions = 1000
    
    # Normal transactions
    normal_transactions = np.random.normal(0, 1, (n_transactions * 9 // 10, 15))
    normal_labels = np.zeros(n_transactions * 9 // 10)
    
    # Fraudulent transactions (outliers)
    fraud_transactions = np.random.normal(0, 3, (n_transactions // 10, 15))
    fraud_transactions[:, 0] += 5  # Unusual amount
    fraud_transactions[:, 1] += 3  # Unusual time
    fraud_labels = np.ones(n_transactions // 10)
    
    # Combine data
    all_transactions = np.vstack([normal_transactions, fraud_transactions])
    all_labels = np.hstack([normal_labels, fraud_labels])
    
    # Shuffle
    indices = np.random.permutation(len(all_transactions))
    X = torch.tensor(all_transactions[indices], dtype=torch.float32)
    y = torch.tensor(all_labels[indices], dtype=torch.long)
    
    dataset = TensorDataset(X, y)
    data_loader = DataLoader(dataset, batch_size=32, shuffle=True)
    
    class FraudDetectionModel(nn.Module):
        def __init__(self):
            super().__init__()
            self.feature_extractor = nn.Sequential(
                nn.Linear(15, 64),
                nn.ReLU(),
                nn.BatchNorm1d(64),
                nn.Dropout(0.3),
                nn.Linear(64, 32),
                nn.ReLU(),
                nn.Dropout(0.2)
            )
            self.classifier = nn.Linear(32, 2)
        
        def forward(self, x):
            features = self.feature_extractor(x)
            return self.classifier(features)
    
    try:
        print("\n1️⃣ Bank joining fraud prevention consortium...")
        client = agisfl.init(
            api_key="bank-consortium-fraud-key",
            experiment_name="fraud_detection_2024",
            use_differential_privacy=True,
            privacy_budget=1.5
        )
        
        print("2️⃣ Preparing fraud detection model...")
        model = FraudDetectionModel()
        
        print("3️⃣ Collaborative fraud pattern learning...")
        results = agisfl.run_training(
            model=model,
            data_loader=data_loader,
            max_rounds=15
        )
        
        print(f"\n✅ Fraud detection training completed!")
        print(f"   Banks in consortium: {results.get('num_participants', 'N/A')}")
        print(f"   Fraud detection accuracy: {results.get('final_accuracy', 'N/A'):.3f}")
        print(f"   False positive rate: {results.get('false_positive_rate', 'N/A'):.3f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Fraud detection example failed: {str(e)}")
        return None


def data_loading_examples():
    """
    Demonstrate various data loading patterns with AgisFL.
    """
    print("\n📊 Data Loading Examples")
    print("=" * 50)
    
    try:
        # Initialize client
        client = agisfl.init(api_key="data-loading-demo")
        
        print("\n1️⃣ Loading from NumPy arrays...")
        X = np.random.randn(100, 10)
        y = np.random.randint(0, 2, 100)
        data_loader = agisfl.load_data(features=X, labels=y, batch_size=16)
        print(f"   Created DataLoader with {len(data_loader)} batches")
        
        print("\n2️⃣ Creating synthetic CSV data...")
        # Create a temporary CSV file
        df = pd.DataFrame({
            'feature_1': np.random.randn(200),
            'feature_2': np.random.randn(200),
            'feature_3': np.random.randn(200),
            'label': np.random.randint(0, 3, 200)
        })
        csv_path = "temp_data.csv"
        df.to_csv(csv_path, index=False)
        
        data_loader = agisfl.load_data(csv_path, batch_size=32)
        print(f"   Loaded CSV with {len(data_loader)} batches")
        
        print("\n3️⃣ Using helper to create simple model...")
        model = agisfl.create_simple_model(input_size=3, num_classes=3)
        print(f"   Created model: {model}")
        
        # Clean up
        if os.path.exists(csv_path):
            os.remove(csv_path)
        
        return True
        
    except Exception as e:
        print(f"❌ Data loading examples failed: {str(e)}")
        return False


def real_time_monitoring_example():
    """
    Demonstrate real-time monitoring capabilities.
    """
    print("\n📈 Real-time Monitoring Example")
    print("=" * 50)
    
    # Simple data
    X = torch.randn(500, 20)
    y = torch.randint(0, 2, (500,))
    dataset = TensorDataset(X, y)
    data_loader = DataLoader(dataset, batch_size=32)
    
    model = agisfl.create_simple_model(input_size=20, num_classes=2)
    
    try:
        print("\n1️⃣ Enabling real-time monitoring...")
        client = agisfl.init(
            api_key="monitoring-demo",
            enable_real_time_updates=True
        )
        
        print("2️⃣ Starting training with live updates...")
        results = agisfl.run_training(
            model=model,
            data_loader=data_loader,
            max_rounds=8
        )
        
        if 'training_history' in results:
            print("\n📊 Training progression:")
            for round_num, round_data in enumerate(results['training_history'][:5]):
                print(f"   Round {round_num + 1}: "
                      f"Loss {round_data.get('loss', 0):.3f}, "
                      f"Accuracy {round_data.get('accuracy', 0):.3f}")
        
        return results
        
    except Exception as e:
        print(f"❌ Monitoring example failed: {str(e)}")
        return None


def main():
    """
    Run all examples to demonstrate AgisFL SDK capabilities.
    """
    print("🚀 AgisFL Client SDK Examples")
    print("=" * 70)
    print("Demonstrating 'Three-Line Integration' for Federated Learning")
    print("=" * 70)
    
    examples = [
        ("Basic MNIST", basic_mnist_example),
        ("Healthcare Federation", healthcare_federation_example),
        ("Financial Fraud Detection", financial_fraud_detection),
        ("Data Loading Patterns", data_loading_examples),
        ("Real-time Monitoring", real_time_monitoring_example)
    ]
    
    results = {}
    for name, example_func in examples:
        try:
            print(f"\n{'='*20} {name} {'='*20}")
            result = example_func()
            results[name] = result
            if result:
                print(f"✅ {name} completed successfully")
            else:
                print(f"⚠️ {name} completed with warnings")
        except Exception as e:
            print(f"❌ {name} failed: {str(e)}")
            results[name] = None
    
    # Summary
    print("\n" + "="*70)
    print("📋 EXAMPLES SUMMARY")
    print("="*70)
    for name, result in results.items():
        status = "✅ SUCCESS" if result else "❌ FAILED"
        print(f"{name:.<30} {status}")
    
    successful = sum(1 for r in results.values() if r is not None)
    print(f"\nCompleted: {successful}/{len(examples)} examples")
    
    if successful == len(examples):
        print("\n🎉 All examples completed successfully!")
        print("   AgisFL SDK is ready for production use.")
    else:
        print(f"\n⚠️  {len(examples) - successful} examples had issues.")
        print("   Check the error messages above for details.")


if __name__ == "__main__":
    main()

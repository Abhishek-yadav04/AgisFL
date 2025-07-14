#!/usr/bin/env python3
"""
Advanced FL-IDS Data Simulator and Testing Framework
Generates realistic network traffic data for comprehensive federated learning evaluation
"""

import numpy as np
import pandas as pd
import json
import time
import threading
import logging
from datetime import datetime, timedelta
import requests
import sys
import os

# Add parent directory to path to import fl_ids_core
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fl_ids_core import (
    FederatedLearningServer,
    FederatedLearningNode, 
    NetworkDataGenerator,
    DifferentialPrivacy,
    SecureAggregation,
    ByzantineFaultTolerance
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedNetworkSimulator:
    """Advanced network traffic simulator for FL-IDS testing"""

    def __init__(self):
        self.attack_patterns = {
            'ddos': {
                'duration': lambda: np.random.exponential(0.05),
                'src_bytes': lambda: np.random.lognormal(2, 3),
                'dst_bytes': lambda: np.random.lognormal(1, 2),
                'count': lambda: np.random.poisson(100),
                'serror_rate': lambda: np.random.beta(8, 2)
            },
            'port_scan': {
                'duration': lambda: np.random.exponential(2),
                'src_bytes': lambda: np.random.lognormal(3, 1),
                'dst_bytes': lambda: np.random.lognormal(2, 1),
                'count': lambda: np.random.poisson(50),
                'diff_srv_rate': lambda: np.random.beta(9, 1)
            },
            'malware': {
                'duration': lambda: np.random.exponential(15),
                'src_bytes': lambda: np.random.lognormal(8, 2),
                'dst_bytes': lambda: np.random.lognormal(7, 2),
                'num_compromised': lambda: np.random.poisson(5),
                'root_shell': lambda: np.random.binomial(1, 0.7)
            },
            'data_exfiltration': {
                'duration': lambda: np.random.exponential(300),
                'src_bytes': lambda: np.random.lognormal(9, 1),
                'dst_bytes': lambda: np.random.lognormal(8, 1),
                'num_file_creations': lambda: np.random.poisson(20),
                'num_access_files': lambda: np.random.poisson(50)
            }
        }

    def generate_attack_data(self, attack_type, num_samples):
        """Generate specific attack type data"""
        if attack_type not in self.attack_patterns:
            raise ValueError(f"Unknown attack type: {attack_type}")

        pattern = self.attack_patterns[attack_type]
        data = {}

        # Base features for all samples
        base_features = [
            'duration', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment',
            'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised',
            'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
            'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
            'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
            'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
            'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
            'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
            'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate',
            'dst_host_rerror_rate', 'dst_host_srv_rerror_rate'
        ]

        # Initialize with default values
        for feature in base_features:
            if feature in pattern:
                data[feature] = np.array([pattern[feature]() for _ in range(num_samples)])
            else:
                # Default values based on feature type
                if 'rate' in feature:
                    data[feature] = np.random.beta(1, 5, num_samples)
                elif 'count' in feature:
                    data[feature] = np.random.poisson(2, num_samples)
                elif feature in ['land', 'urgent', 'logged_in', 'root_shell', 'su_attempted']:
                    data[feature] = np.random.binomial(1, 0.1, num_samples)
                else:
                    data[feature] = np.random.exponential(1, num_samples)

        # Mark as attack
        data['label'] = np.ones(num_samples)
        data['attack_type'] = [attack_type] * num_samples
        data['timestamp'] = pd.date_range(start=datetime.now(), periods=num_samples, freq='1S')

        return pd.DataFrame(data)

    def generate_mixed_dataset(self, total_samples=10000, attack_ratio=0.15):
        """Generate a mixed dataset with multiple attack types"""
        normal_samples = int(total_samples * (1 - attack_ratio))
        attack_samples = total_samples - normal_samples

        # Generate normal traffic
        normal_data = NetworkDataGenerator.generate_kdd_like_data(normal_samples, 0)

        # Generate different types of attacks
        attack_types = ['ddos', 'port_scan', 'malware', 'data_exfiltration']
        attack_datasets = []

        samples_per_attack = attack_samples // len(attack_types)
        remaining_samples = attack_samples % len(attack_types)

        for i, attack_type in enumerate(attack_types):
            samples = samples_per_attack + (1 if i < remaining_samples else 0)
            if samples > 0:
                attack_data = self.generate_attack_data(attack_type, samples)
                attack_datasets.append(attack_data)

        # Combine all data
        all_data = [normal_data] + attack_datasets
        combined_data = pd.concat(all_data, ignore_index=True)

        # Shuffle the dataset
        combined_data = combined_data.sample(frac=1).reset_index(drop=True)

        return combined_data

class FLPerformanceTester:
    """Comprehensive FL performance testing framework"""

    def __init__(self):
        self.simulator = AdvancedNetworkSimulator()
        self.test_results = []

    def test_privacy_mechanisms(self):
        """Test differential privacy mechanisms"""
        logger.info("Testing differential privacy mechanisms...")

        # Test different privacy budgets
        privacy_budgets = [0.1, 0.5, 1.0, 2.0, 5.0]
        results = {}

        for epsilon in privacy_budgets:
            dp = DifferentialPrivacy(epsilon=epsilon)

            # Test on sample data
            original_data = np.random.normal(0, 1, 1000)
            noisy_data = dp.add_noise(original_data, sensitivity=1.0)

            # Measure privacy-utility tradeoff
            mse = np.mean((original_data - noisy_data) ** 2)
            results[epsilon] = {
                'mse': mse,
                'std_noise': np.std(noisy_data - original_data),
                'privacy_budget': epsilon
            }

        logger.info("Privacy mechanism test completed")
        return results

    def test_byzantine_tolerance(self):
        """Test Byzantine fault tolerance"""
        logger.info("Testing Byzantine fault tolerance...")

        bft = ByzantineFaultTolerance(byzantine_ratio=0.2)

        # Create test weights with some Byzantine nodes
        normal_weights = [
            {'feature_importances': np.random.normal(0.5, 0.1, 10), 'training_samples': 1000},
            {'feature_importances': np.random.normal(0.5, 0.1, 10), 'training_samples': 1200},
            {'feature_importances': np.random.normal(0.5, 0.1, 10), 'training_samples': 800}
        ]

        byzantine_weights = [
            {'feature_importances': np.random.normal(2.0, 0.5, 10), 'training_samples': 1000},  # Malicious
            {'feature_importances': np.random.normal(-1.0, 0.5, 10), 'training_samples': 1000}  # Malicious
        ]

        all_weights = normal_weights + byzantine_weights

        # Test detection
        byzantine_indices = bft.detect_byzantine_nodes(all_weights)

        # Test trimmed mean aggregation
        aggregated = bft.trim_mean_aggregation(all_weights, trim_ratio=0.3)

        logger.info(f"Detected Byzantine nodes: {byzantine_indices}")
        return {
            'detected_byzantine': byzantine_indices,
            'expected_byzantine': [3, 4],  # Last two are malicious
            'aggregated_weights': aggregated
        }

    def benchmark_algorithms(self):
        """Benchmark different FL algorithms"""
        logger.info("Benchmarking FL algorithms...")

        algorithms = ['random_forest', 'neural_network', 'svm', 'isolation_forest']
        results = {}

        # Generate test data
        test_data = self.simulator.generate_mixed_dataset(5000, 0.2)

        for algorithm in algorithms:
            logger.info(f"Testing {algorithm}...")

            # Create node with algorithm
            node = FederatedLearningNode(f"test_{algorithm}", algorithm)
            node.add_training_data(test_data)

            # Time training
            start_time = time.time()
            weights = node.local_train()
            training_time = time.time() - start_time

            # Test prediction if trained
            if weights and node.is_trained:
                predictions = node.predict(test_data.drop(['label', 'attack_type', 'timestamp'], axis=1))

                if predictions:
                    true_labels = test_data['label'].values
                    accuracy = np.mean(np.array(predictions) == true_labels[:len(predictions)])

                    results[algorithm] = {
                        'accuracy': accuracy,
                        'training_time': training_time,
                        'weights_generated': weights is not None,
                        'prediction_count': len(predictions)
                    }

        logger.info("Algorithm benchmarking completed")
        return results

    def run_comprehensive_test(self):
        """Run comprehensive FL-IDS testing"""
        logger.info("Starting comprehensive FL-IDS testing...")

        test_results = {
            'timestamp': datetime.now().isoformat(),
            'privacy_tests': self.test_privacy_mechanisms(),
            'byzantine_tests': self.test_byzantine_tolerance(),
            'algorithm_benchmarks': self.benchmark_algorithms()
        }

        # Save results
        with open('fl_test_results.json', 'w') as f:
            json.dump(test_results, f, indent=2, default=str)

        logger.info("Comprehensive testing completed. Results saved to fl_test_results.json")
        return test_results

def run_continuous_simulation():
    """Run continuous data simulation"""
    simulator = AdvancedNetworkSimulator()

    while True:
        try:
            # Generate new data batch
            data = simulator.generate_mixed_dataset(1000, 0.15)

            # Send to FL system (if running)
            try:
                response = requests.post(
                    'http://localhost:5001/api/fl-ids/data',
                    json=data.to_dict('records'),
                    timeout=5
                )
                if response.status_code == 200:
                    logger.info("Sent data batch to FL system")
            except requests.RequestException:
                logger.debug("FL system not available, continuing simulation")

            # Wait before next batch
            time.sleep(60)  # 1 minute intervals

        except Exception as e:
            logger.error(f"Simulation error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='FL-IDS Data Simulator and Tester')
    parser.add_argument('--mode', choices=['simulate', 'test', 'both'], default='both',
                       help='Run mode: simulate data, run tests, or both')
    parser.add_argument('--samples', type=int, default=10000,
                       help='Number of samples to generate')
    parser.add_argument('--attack-ratio', type=float, default=0.15,
                       help='Ratio of attack samples')

    args = parser.parse_args()

    if args.mode in ['test', 'both']:
        # Run comprehensive tests
        tester = FLPerformanceTester()
        results = tester.run_comprehensive_test()

        print("\n=== FL-IDS Test Results ===")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Privacy Tests: {len(results['privacy_tests'])} configurations tested")
        print(f"Byzantine Detection: {results['byzantine_tests']['detected_byzantine']}")
        print("Algorithm Benchmarks:")
        for alg, metrics in results['algorithm_benchmarks'].items():
            print(f"  {alg}: {metrics['accuracy']:.3f} accuracy, {metrics['training_time']:.2f}s training")

    if args.mode in ['simulate', 'both']:
        # Generate sample dataset
        simulator = AdvancedNetworkSimulator()
        data = simulator.generate_mixed_dataset(args.samples, args.attack_ratio)

        # Save dataset
        filename = f"network_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        data.to_csv(filename, index=False)
        print(f"\nGenerated {len(data)} samples and saved to {filename}")
        print(f"Attack ratio: {(data['label'].sum() / len(data)):.2%}")
        print("Attack type distribution:")
        if 'attack_type' in data.columns:
            attack_counts = data[data['label'] == 1]['attack_type'].value_counts()
            for attack_type, count in attack_counts.items():
                print(f"  {attack_type}: {count} samples")

        # Start continuous simulation if requested
        if input("\nStart continuous simulation? (y/N): ").lower() == 'y':
            print("Starting continuous simulation... Press Ctrl+C to stop")
            try:
                run_continuous_simulation()
            except KeyboardInterrupt:
                print("\nSimulation stopped")
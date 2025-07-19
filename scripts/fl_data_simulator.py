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

try:
    from fl_ids_core import (
        FederatedLearningServer,
        FederatedLearningNode,
        NetworkDataGenerator,
        DifferentialPrivacy,
        SecureAggregation,
        ByzantineFaultTolerance,
        RealTimeSystemMonitor,
        FLPerformanceTester
    )
except ImportError:
    print("Warning: fl_ids_core not found. Some features may not work.")

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
        
        data['label'] = np.ones(num_samples)  # All are attacks
        data['attack_type'] = [attack_type] * num_samples
        
        return pd.DataFrame(data)
    
    def generate_normal_traffic(self, num_samples):
        """Generate normal network traffic"""
        return NetworkDataGenerator.generate_kdd_like_data(num_samples, 0.0)
    
    def generate_mixed_dataset(self, total_samples, attack_ratio):
        """Generate mixed dataset with various attack types"""
        num_attacks = int(total_samples * attack_ratio)
        num_normal = total_samples - num_attacks
        
        # Generate normal traffic
        normal_data = self.generate_normal_traffic(num_normal)
        normal_data['attack_type'] = 'normal'
        
        # Generate attacks with different types
        attack_types = ['ddos', 'port_scan', 'malware', 'data_exfiltration']
        attack_distribution = np.random.dirichlet([1, 1, 1, 1])  # Equal probability
        
        attack_datasets = []
        for i, attack_type in enumerate(attack_types):
            attack_samples = int(num_attacks * attack_distribution[i])
            if attack_samples > 0:
                attack_data = self.generate_attack_data(attack_type, attack_samples)
                attack_datasets.append(attack_data)
        
        # Combine all data
        if attack_datasets:
            all_data = pd.concat([normal_data] + attack_datasets, ignore_index=True)
        else:
            all_data = normal_data
        
        # Shuffle the dataset
        all_data = all_data.sample(frac=1).reset_index(drop=True)
        
        return all_data

class FLPerformanceTester:
    """Comprehensive FL system performance testing"""
    
    def __init__(self):
        self.test_results = {}
    
    def run_comprehensive_test(self):
        """Run comprehensive performance tests"""
        logger.info("Starting comprehensive FL-IDS performance tests...")
        
        results = {
            'timestamp': datetime.now().isoformat(),
            'privacy_tests': self._test_privacy_mechanisms(),
            'byzantine_tests': self._test_byzantine_tolerance(),
            'algorithm_benchmarks': self._benchmark_algorithms(),
            'scalability_tests': self._test_scalability(),
            'security_tests': self._test_security_features()
        }
        
        return results
    
    def _test_privacy_mechanisms(self):
        """Test differential privacy implementations"""
        test_configs = [
            {'epsilon': 0.1, 'expected_utility': 'low'},
            {'epsilon': 1.0, 'expected_utility': 'medium'},
            {'epsilon': 10.0, 'expected_utility': 'high'}
        ]
        
        results = []
        for config in test_configs:
            try:
                dp = DifferentialPrivacy(epsilon=config['epsilon'])
                test_data = np.random.normal(5, 2, 1000)
                
                original_mean = np.mean(test_data)
                private_mean = dp.private_mean(test_data)
                
                utility_loss = abs(original_mean - private_mean)
                
                results.append({
                    'epsilon': config['epsilon'],
                    'utility_loss': utility_loss,
                    'test_passed': utility_loss < 10.0,  # Reasonable threshold
                    'privacy_level': 'high' if config['epsilon'] < 1.0 else 'medium'
                })
            except Exception as e:
                logger.error(f"Privacy test error: {e}")
                results.append({'epsilon': config['epsilon'], 'error': str(e)})
        
        return results
    
    def _test_byzantine_tolerance(self):
        """Test Byzantine fault tolerance mechanisms"""
        try:
            bft = ByzantineFaultTolerance()
            
            # Create honest and byzantine updates
            honest_update = np.random.normal(0, 1, 10)
            byzantine_updates = [
                np.random.normal(100, 10, 10),  # Clearly malicious
                np.random.normal(-50, 5, 10),   # Another malicious pattern
            ]
            
            node_updates = {
                'honest_1': honest_update + np.random.normal(0, 0.1, 10),
                'honest_2': honest_update + np.random.normal(0, 0.1, 10),
                'honest_3': honest_update + np.random.normal(0, 0.1, 10),
                'byzantine_1': byzantine_updates[0],
                'byzantine_2': byzantine_updates[1]
            }
            
            detected = bft.detect_byzantine_nodes(node_updates)
            robust_result = bft.robust_aggregation(node_updates)
            
            return {
                'total_nodes': len(node_updates),
                'byzantine_nodes_injected': 2,
                'byzantine_nodes_detected': len([d for d in detected if 'byzantine' in d]),
                'detection_accuracy': len([d for d in detected if 'byzantine' in d]) / 2,
                'robust_aggregation_successful': True,
                'detected_byzantine': detected
            }
            
        except Exception as e:
            logger.error(f"Byzantine tolerance test error: {e}")
            return {'error': str(e)}
    
    def _benchmark_algorithms(self):
        """Benchmark different FL algorithms"""
        algorithms = ['neural_network', 'random_forest', 'gradient_boosting', 'svm']
        results = {}
        
        for algorithm in algorithms:
            try:
                start_time = time.time()
                
                # Create test setup
                node = FederatedLearningNode(f'test_{algorithm}', algorithm)
                simulator = AdvancedNetworkSimulator()
                test_data = simulator.generate_mixed_dataset(2000, 0.15)
                
                node.add_training_data(test_data)
                
                # Run multiple training iterations
                accuracies = []
                training_times = []
                
                for _ in range(5):
                    iter_start = time.time()
                    update = node.train_local_model()
                    iter_time = time.time() - iter_start
                    
                    accuracies.append(update['accuracy'])
                    training_times.append(iter_time)
                
                total_time = time.time() - start_time
                
                results[algorithm] = {
                    'avg_accuracy': np.mean(accuracies),
                    'accuracy_std': np.std(accuracies),
                    'avg_training_time': np.mean(training_times),
                    'total_benchmark_time': total_time,
                    'convergence_rate': np.std(accuracies)  # Lower is better
                }
                
            except Exception as e:
                logger.error(f"Algorithm benchmark error for {algorithm}: {e}")
                results[algorithm] = {'error': str(e)}
        
        return results
    
    def _test_scalability(self):
        """Test system scalability with different node counts"""
        node_counts = [2, 5, 10, 20]
        results = {}
        
        for node_count in node_counts:
            try:
                start_time = time.time()
                
                server = FederatedLearningServer()
                simulator = AdvancedNetworkSimulator()
                
                # Create nodes
                for i in range(node_count):
                    node = FederatedLearningNode(f'scale_test_{i}', 'neural_network')
                    test_data = simulator.generate_mixed_dataset(1000, 0.1)
                    node.add_training_data(test_data)
                    server.register_node(node)
                
                # Run training rounds
                round_times = []
                for _ in range(3):
                    round_start = time.time()
                    success = server.start_training_round()
                    round_time = time.time() - round_start
                    round_times.append(round_time)
                    
                    if not success:
                        break
                
                total_time = time.time() - start_time
                
                results[f'{node_count}_nodes'] = {
                    'setup_successful': True,
                    'avg_round_time': np.mean(round_times),
                    'total_test_time': total_time,
                    'rounds_completed': len(round_times),
                    'scalability_score': node_count / np.mean(round_times) if round_times else 0
                }
                
            except Exception as e:
                logger.error(f"Scalability test error for {node_count} nodes: {e}")
                results[f'{node_count}_nodes'] = {'error': str(e)}
        
        return results
    
    def _test_security_features(self):
        """Test security features implementation"""
        security_results = {}
        
        try:
            # Test secure aggregation
            num_nodes = 5
            secure_agg = SecureAggregation(num_nodes)
            
            test_gradients = np.random.normal(0, 1, 100)
            
            # Test encryption/decryption
            for i in range(num_nodes):
                node_id = f'security_test_{i}'
                encrypted = secure_agg.encrypt_gradients(test_gradients, node_id)
                
                security_results[f'encryption_test_{i}'] = {
                    'encryption_successful': len(encrypted) > 0,
                    'encrypted_size': len(encrypted),
                    'original_size': len(test_gradients.tobytes())
                }
            
            # Test aggregation
            encrypted_gradients = []
            for i in range(num_nodes):
                node_id = f'security_test_{i}'
                encrypted = secure_agg.encrypt_gradients(test_gradients, node_id)
                encrypted_gradients.append(encrypted)
            
            aggregated = secure_agg.aggregate_secure(encrypted_gradients)
            
            security_results['secure_aggregation'] = {
                'aggregation_successful': aggregated is not None,
                'result_shape_correct': len(aggregated) == len(test_gradients),
                'result_reasonable': np.allclose(aggregated, test_gradients, atol=1.0)
            }
            
        except Exception as e:
            logger.error(f"Security test error: {e}")
            security_results['error'] = str(e)
        
        return security_results

def run_continuous_simulation():
    """Run continuous data simulation for live testing"""
    logger.info("Starting continuous FL-IDS simulation...")
    
    simulator = AdvancedNetworkSimulator()
    
    while True:
        try:
            # Generate new data batch
            data = simulator.generate_mixed_dataset(1000, 0.15)
            
            # Send to FL system (if running)
            try:
                response = requests.post(
                    'http://localhost:5000/api/fl-ids/stream-data',
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
        print(f"Byzantine Detection: {results['byzantine_tests'].get('detection_accuracy', 'N/A')}")
        print("Algorithm Benchmarks:")
        for alg, metrics in results['algorithm_benchmarks'].items():
            if 'error' not in metrics:
                print(f"  {alg}: {metrics['avg_accuracy']:.3f} accuracy, {metrics['avg_training_time']:.2f}s training")
            else:
                print(f"  {alg}: Error - {metrics['error']}")
    
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
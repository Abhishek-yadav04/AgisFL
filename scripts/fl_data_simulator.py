
#!/usr/bin/env python3
"""
Advanced Federated Learning Data Simulator
Generates realistic network traffic data with various attack patterns
for testing the FL-IDS system.
"""

import numpy as np
import pandas as pd
import json
import sqlite3
import time
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedNetworkDataGenerator:
    """Generate sophisticated network traffic data with realistic attack patterns"""
    
    def __init__(self):
        self.attack_patterns = {
            'dos': self._generate_dos_pattern,
            'ddos': self._generate_ddos_pattern,
            'port_scan': self._generate_port_scan_pattern,
            'brute_force': self._generate_brute_force_pattern,
            'apt': self._generate_apt_pattern,
            'insider_threat': self._generate_insider_threat_pattern,
            'zero_day': self._generate_zero_day_pattern,
            'malware_c2': self._generate_malware_c2_pattern
        }
        
        self.normal_patterns = {
            'web_traffic': self._generate_web_traffic,
            'email_traffic': self._generate_email_traffic,
            'file_transfer': self._generate_file_transfer,
            'database_access': self._generate_database_access,
            'api_calls': self._generate_api_calls
        }
    
    def generate_federated_dataset(self, total_samples=5000, anomaly_ratio=0.15, num_nodes=3):
        """Generate federated learning datasets for multiple nodes"""
        datasets = {}
        
        # Distribute samples across nodes with some overlap
        base_samples = total_samples // num_nodes
        overlap_ratio = 0.1  # 10% overlap between nodes
        
        for i in range(num_nodes):
            node_id = f"node_{i+1:03d}"
            
            # Calculate node-specific parameters
            node_samples = base_samples + random.randint(-100, 100)
            node_anomaly_ratio = anomaly_ratio + random.uniform(-0.03, 0.03)
            
            # Generate node-specific data
            dataset = self._generate_node_data(node_samples, node_anomaly_ratio, node_id)
            datasets[node_id] = dataset
            
            logger.info(f"Generated {len(dataset)} samples for {node_id}")
        
        return datasets
    
    def _generate_node_data(self, num_samples: int, anomaly_ratio: float, node_id: str) -> pd.DataFrame:
        """Generate data for a specific node with unique characteristics"""
        
        normal_samples = int(num_samples * (1 - anomaly_ratio))
        anomaly_samples = num_samples - normal_samples
        
        # Generate normal traffic
        normal_data = []
        for _ in range(normal_samples):
            pattern_type = random.choice(list(self.normal_patterns.keys()))
            sample = self.normal_patterns[pattern_type]()
            sample['label'] = 0  # Normal
            sample['pattern_type'] = pattern_type
            normal_data.append(sample)
        
        # Generate anomalous traffic
        anomaly_data = []
        for _ in range(anomaly_samples):
            attack_type = random.choice(list(self.attack_patterns.keys()))
            sample = self.attack_patterns[attack_type]()
            sample['label'] = 1  # Anomaly
            sample['pattern_type'] = attack_type
            anomaly_data.append(sample)
        
        # Combine and shuffle
        all_data = normal_data + anomaly_data
        random.shuffle(all_data)
        
        # Convert to DataFrame
        df = pd.DataFrame(all_data)
        
        # Add node-specific features
        df['node_id'] = node_id
        df['timestamp'] = pd.date_range(
            start=datetime.now() - timedelta(hours=24),
            periods=len(df),
            freq='30S'
        )
        
        # Add realistic noise based on node characteristics
        df = self._add_node_characteristics(df, node_id)
        
        return df
    
    def _add_node_characteristics(self, df: pd.DataFrame, node_id: str) -> pd.DataFrame:
        """Add node-specific characteristics and noise"""
        
        # Node-specific biases
        node_biases = {
            'node_001': {'src_bytes_bias': 1.2, 'connection_bias': 0.8},
            'node_002': {'src_bytes_bias': 0.9, 'connection_bias': 1.3},
            'node_003': {'src_bytes_bias': 1.1, 'connection_bias': 1.0}
        }
        
        bias = node_biases.get(node_id, {'src_bytes_bias': 1.0, 'connection_bias': 1.0})
        
        # Apply biases
        df['src_bytes'] *= bias['src_bytes_bias']
        df['count'] *= bias['connection_bias']
        
        # Add realistic correlation noise
        correlation_noise = np.random.normal(0, 0.1, len(df))
        df['duration'] += correlation_noise
        
        return df
    
    # Normal traffic patterns
    def _generate_web_traffic(self) -> Dict:
        """Generate normal web traffic pattern"""
        return {
            'duration': np.random.exponential(2),
            'protocol_type': 'tcp',
            'service': random.choice(['http', 'https']),
            'flag': 'SF',
            'src_bytes': np.random.lognormal(8, 1),
            'dst_bytes': np.random.lognormal(10, 1),
            'land': 0,
            'wrong_fragment': 0,
            'urgent': 0,
            'hot': np.random.poisson(0.1),
            'num_failed_logins': 0,
            'logged_in': 1,
            'num_compromised': 0,
            'root_shell': 0,
            'su_attempted': 0,
            'num_root': 0,
            'num_file_creations': np.random.poisson(0.5),
            'num_shells': 0,
            'num_access_files': np.random.poisson(1),
            'num_outbound_cmds': 0,
            'is_host_login': 0,
            'is_guest_login': 0,
            'count': np.random.poisson(3),
            'srv_count': np.random.poisson(2),
            'serror_rate': np.random.beta(1, 20),
            'srv_serror_rate': np.random.beta(1, 20),
            'rerror_rate': np.random.beta(1, 30),
            'srv_rerror_rate': np.random.beta(1, 30),
            'same_srv_rate': np.random.beta(8, 2),
            'diff_srv_rate': np.random.beta(1, 8),
            'srv_diff_host_rate': np.random.beta(1, 15),
            'dst_host_count': np.random.randint(1, 256),
            'dst_host_srv_count': np.random.poisson(5),
            'dst_host_same_srv_rate': np.random.beta(5, 2),
            'dst_host_diff_srv_rate': np.random.beta(1, 5),
            'dst_host_same_src_port_rate': np.random.beta(1, 8),
            'dst_host_srv_diff_host_rate': np.random.beta(1, 12),
            'dst_host_serror_rate': np.random.beta(1, 20),
            'dst_host_srv_serror_rate': np.random.beta(1, 20),
            'dst_host_rerror_rate': np.random.beta(1, 25),
            'dst_host_srv_rerror_rate': np.random.beta(1, 25)
        }
    
    def _generate_email_traffic(self) -> Dict:
        """Generate normal email traffic pattern"""
        base = self._generate_web_traffic()
        base.update({
            'service': random.choice(['smtp', 'pop_3', 'imap4']),
            'src_bytes': np.random.lognormal(6, 0.5),
            'dst_bytes': np.random.lognormal(7, 0.5),
            'duration': np.random.exponential(5)
        })
        return base
    
    def _generate_file_transfer(self) -> Dict:
        """Generate normal file transfer pattern"""
        base = self._generate_web_traffic()
        base.update({
            'service': random.choice(['ftp', 'ftp_data']),
            'src_bytes': np.random.lognormal(12, 2),
            'dst_bytes': np.random.lognormal(6, 1),
            'duration': np.random.exponential(30)
        })
        return base
    
    def _generate_database_access(self) -> Dict:
        """Generate normal database access pattern"""
        base = self._generate_web_traffic()
        base.update({
            'service': random.choice(['sql_net', 'mysql']),
            'src_bytes': np.random.lognormal(5, 0.5),
            'dst_bytes': np.random.lognormal(7, 1),
            'count': np.random.poisson(1),
            'srv_count': np.random.poisson(1)
        })
        return base
    
    def _generate_api_calls(self) -> Dict:
        """Generate normal API call pattern"""
        base = self._generate_web_traffic()
        base.update({
            'service': 'http',
            'src_bytes': np.random.lognormal(4, 0.5),
            'dst_bytes': np.random.lognormal(5, 0.5),
            'duration': np.random.exponential(1),
            'count': np.random.poisson(10),
            'srv_count': np.random.poisson(8)
        })
        return base
    
    # Attack patterns
    def _generate_dos_pattern(self) -> Dict:
        """Generate DoS attack pattern"""
        return {
            'duration': 0,
            'protocol_type': 'tcp',
            'service': random.choice(['http', 'ftp', 'smtp']),
            'flag': random.choice(['S0', 'REJ', 'RSTO']),
            'src_bytes': 0,
            'dst_bytes': 0,
            'land': 0,
            'wrong_fragment': 0,
            'urgent': 0,
            'hot': 0,
            'num_failed_logins': 0,
            'logged_in': 0,
            'num_compromised': 0,
            'root_shell': 0,
            'su_attempted': 0,
            'num_root': 0,
            'num_file_creations': 0,
            'num_shells': 0,
            'num_access_files': 0,
            'num_outbound_cmds': 0,
            'is_host_login': 0,
            'is_guest_login': 0,
            'count': np.random.randint(100, 1000),
            'srv_count': np.random.randint(100, 1000),
            'serror_rate': np.random.uniform(0.8, 1.0),
            'srv_serror_rate': np.random.uniform(0.8, 1.0),
            'rerror_rate': 0,
            'srv_rerror_rate': 0,
            'same_srv_rate': 1.0,
            'diff_srv_rate': 0,
            'srv_diff_host_rate': 0,
            'dst_host_count': 255,
            'dst_host_srv_count': np.random.randint(100, 255),
            'dst_host_same_srv_rate': 1.0,
            'dst_host_diff_srv_rate': 0,
            'dst_host_same_src_port_rate': 1.0,
            'dst_host_srv_diff_host_rate': 0,
            'dst_host_serror_rate': np.random.uniform(0.8, 1.0),
            'dst_host_srv_serror_rate': np.random.uniform(0.8, 1.0),
            'dst_host_rerror_rate': 0,
            'dst_host_srv_rerror_rate': 0
        }
    
    def _generate_ddos_pattern(self) -> Dict:
        """Generate DDoS attack pattern"""
        base = self._generate_dos_pattern()
        base.update({
            'count': np.random.randint(500, 2000),
            'srv_count': np.random.randint(500, 2000),
            'dst_host_count': 1,  # Single target
            'dst_host_srv_count': np.random.randint(500, 1000)
        })
        return base
    
    def _generate_port_scan_pattern(self) -> Dict:
        """Generate port scanning pattern"""
        return {
            'duration': 0,
            'protocol_type': 'tcp',
            'service': random.choice(['http', 'ftp', 'telnet', 'ssh']),
            'flag': random.choice(['S0', 'REJ']),
            'src_bytes': 0,
            'dst_bytes': 0,
            'land': 0,
            'wrong_fragment': 0,
            'urgent': 0,
            'hot': 0,
            'num_failed_logins': 0,
            'logged_in': 0,
            'num_compromised': 0,
            'root_shell': 0,
            'su_attempted': 0,
            'num_root': 0,
            'num_file_creations': 0,
            'num_shells': 0,
            'num_access_files': 0,
            'num_outbound_cmds': 0,
            'is_host_login': 0,
            'is_guest_login': 0,
            'count': np.random.randint(50, 200),
            'srv_count': np.random.randint(1, 5),
            'serror_rate': 0,
            'srv_serror_rate': 0,
            'rerror_rate': np.random.uniform(0.8, 1.0),
            'srv_rerror_rate': np.random.uniform(0.8, 1.0),
            'same_srv_rate': np.random.uniform(0, 0.2),
            'diff_srv_rate': np.random.uniform(0.8, 1.0),
            'srv_diff_host_rate': np.random.uniform(0.8, 1.0),
            'dst_host_count': np.random.randint(100, 255),
            'dst_host_srv_count': np.random.randint(1, 10),
            'dst_host_same_srv_rate': np.random.uniform(0, 0.2),
            'dst_host_diff_srv_rate': np.random.uniform(0.8, 1.0),
            'dst_host_same_src_port_rate': np.random.uniform(0, 0.2),
            'dst_host_srv_diff_host_rate': np.random.uniform(0.8, 1.0),
            'dst_host_serror_rate': 0,
            'dst_host_srv_serror_rate': 0,
            'dst_host_rerror_rate': np.random.uniform(0.8, 1.0),
            'dst_host_srv_rerror_rate': np.random.uniform(0.8, 1.0)
        }
    
    def _generate_brute_force_pattern(self) -> Dict:
        """Generate brute force attack pattern"""
        base = self._generate_web_traffic()
        base.update({
            'service': random.choice(['telnet', 'ssh', 'ftp']),
            'num_failed_logins': np.random.randint(3, 20),
            'logged_in': 0,
            'count': np.random.randint(20, 100),
            'srv_count': np.random.randint(1, 5),
            'same_srv_rate': np.random.uniform(0.8, 1.0)
        })
        return base
    
    def _generate_apt_pattern(self) -> Dict:
        """Generate Advanced Persistent Threat pattern"""
        base = self._generate_web_traffic()
        base.update({
            'duration': np.random.exponential(300),  # Long duration
            'src_bytes': np.random.lognormal(10, 2),
            'dst_bytes': np.random.lognormal(8, 1),
            'num_compromised': np.random.randint(1, 5),
            'root_shell': random.choice([0, 1]),
            'num_file_creations': np.random.randint(5, 20),
            'num_access_files': np.random.randint(10, 50),
            'num_outbound_cmds': np.random.randint(1, 10)
        })
        return base
    
    def _generate_insider_threat_pattern(self) -> Dict:
        """Generate insider threat pattern"""
        base = self._generate_web_traffic()
        base.update({
            'logged_in': 1,
            'num_file_creations': np.random.randint(10, 100),
            'num_access_files': np.random.randint(50, 200),
            'duration': np.random.exponential(1800),  # Very long sessions
            'src_bytes': np.random.lognormal(15, 3),  # Large data transfers
            'su_attempted': np.random.randint(0, 3),
            'num_root': np.random.randint(0, 5)
        })
        return base
    
    def _generate_zero_day_pattern(self) -> Dict:
        """Generate zero-day exploit pattern"""
        base = self._generate_web_traffic()
        base.update({
            'wrong_fragment': np.random.randint(1, 5),
            'urgent': np.random.randint(0, 2),
            'hot': np.random.randint(1, 10),
            'num_compromised': np.random.randint(1, 3),
            'root_shell': 1,
            'num_shells': np.random.randint(1, 5),
            'src_bytes': np.random.lognormal(6, 2),
            'dst_bytes': np.random.lognormal(4, 1)
        })
        return base
    
    def _generate_malware_c2_pattern(self) -> Dict:
        """Generate malware command & control pattern"""
        base = self._generate_web_traffic()
        base.update({
            'duration': np.random.exponential(60),
            'src_bytes': np.random.lognormal(4, 0.5),  # Small, regular communications
            'dst_bytes': np.random.lognormal(3, 0.5),
            'count': np.random.randint(1, 3),
            'srv_count': np.random.randint(1, 2),
            'same_srv_rate': 1.0,
            'diff_srv_rate': 0,
            'num_outbound_cmds': np.random.randint(1, 5)
        })
        return base

def main():
    """Generate and save federated learning datasets"""
    generator = AdvancedNetworkDataGenerator()
    
    # Generate datasets for multiple nodes
    datasets = generator.generate_federated_dataset(
        total_samples=10000,
        anomaly_ratio=0.12,
        num_nodes=3
    )
    
    # Save datasets
    for node_id, dataset in datasets.items():
        filename = f"fl_data_{node_id}.csv"
        dataset.to_csv(filename, index=False)
        logger.info(f"Saved {len(dataset)} samples to {filename}")
        
        # Print statistics
        print(f"\n{node_id} Statistics:")
        print(f"Total samples: {len(dataset)}")
        print(f"Normal: {len(dataset[dataset['label'] == 0])}")
        print(f"Anomalies: {len(dataset[dataset['label'] == 1])}")
        print(f"Anomaly rate: {dataset['label'].mean():.3f}")
        print(f"Attack types: {dataset[dataset['label'] == 1]['pattern_type'].value_counts().to_dict()}")

if __name__ == "__main__":
    main()

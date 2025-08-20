"""Intrusion Detection System Engine"""

import asyncio
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score
import joblib
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()

class IntrusionDetectionEngine:
    """Advanced IDS engine with ML-based detection"""
    
    def __init__(self):
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_running = False
        self.is_trained = False
        self.detection_stats = {
            'total_packets': 0,
            'threats_detected': 0,
            'false_positives': 0,
            'accuracy': 0.0
        }
        self.recent_threats = []
        
    async def initialize(self):
        """Initialize IDS engine"""
        try:
            # Load pre-trained model if exists
            model_path = "./models/ids_model.pkl"
            if os.path.exists(model_path):
                self.classifier = joblib.load(model_path)
                self.is_trained = True
                logger.info("Loaded pre-trained IDS model")
            else:
                # Train with synthetic data
                await self._train_initial_model()
            
            logger.info("IDS engine initialized")
            
        except Exception as e:
            logger.error("IDS initialization failed", error=str(e))
            raise
    
    async def _train_initial_model(self):
        """Train initial IDS model with synthetic data"""
        try:
            # Generate synthetic network traffic data
            X, y = self._generate_network_data(10000)
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train models
            self.classifier.fit(X_train_scaled, y_train)
            self.anomaly_detector.fit(X_train_scaled)
            
            # Evaluate
            y_pred = self.classifier.predict(X_test_scaled)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            
            self.detection_stats['accuracy'] = accuracy
            self.is_trained = True
            
            # Save model
            os.makedirs("models", exist_ok=True)
            joblib.dump(self.classifier, "./models/ids_model.pkl")
            joblib.dump(self.scaler, "./models/ids_scaler.pkl")
            
            logger.info("IDS model trained", 
                       accuracy=accuracy, 
                       precision=precision, 
                       recall=recall)
            
        except Exception as e:
            logger.error("IDS training failed", error=str(e))
            raise
    
    def _generate_network_data(self, num_samples: int):
        """Generate synthetic network traffic data"""
        np.random.seed(42)
        
        # Generate features similar to NSL-KDD dataset
        features = np.random.rand(num_samples, 41)
        labels = np.zeros(num_samples)
        
        # Create patterns for normal vs attack traffic
        normal_samples = int(0.7 * num_samples)
        
        # Normal traffic (lower values)
        features[:normal_samples, :10] = np.random.normal(0.3, 0.1, (normal_samples, 10))
        labels[:normal_samples] = 0
        
        # Attack traffic (higher values)
        features[normal_samples:, :10] = np.random.normal(0.8, 0.2, (num_samples - normal_samples, 10))
        labels[normal_samples:] = 1
        
        return features, labels.astype(int)
    
    async def start_monitoring(self):
        """Start real-time monitoring"""
        if not self.is_trained:
            await self._train_initial_model()
        
        self.is_running = True
        asyncio.create_task(self._monitoring_loop())
        logger.info("IDS monitoring started")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_running:
            try:
                # Simulate packet analysis
                packet_features = self._simulate_packet()
                threat_detected = await self._analyze_packet(packet_features)
                
                self.detection_stats['total_packets'] += 1
                
                if threat_detected:
                    self.detection_stats['threats_detected'] += 1
                    threat = {
                        'id': f"threat_{int(time.time())}",
                        'type': threat_detected['type'],
                        'severity': threat_detected['severity'],
                        'confidence': threat_detected['confidence'],
                        'source_ip': packet_features.get('src_ip', 'unknown'),
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                    self.recent_threats.append(threat)
                    
                    # Keep only recent threats
                    if len(self.recent_threats) > 100:
                        self.recent_threats = self.recent_threats[-50:]
                
                await asyncio.sleep(0.1)  # 10 packets per second
                
            except Exception as e:
                logger.error("IDS monitoring error", error=str(e))
                await asyncio.sleep(1)
    
    def _simulate_packet(self) -> Dict[str, Any]:
        """Simulate network packet for analysis"""
        return {
            'src_ip': f"192.168.1.{np.random.randint(1, 255)}",
            'dst_ip': f"10.0.0.{np.random.randint(1, 255)}",
            'src_port': np.random.randint(1024, 65535),
            'dst_port': np.random.choice([80, 443, 22, 21, 25, 53]),
            'protocol': np.random.choice(['TCP', 'UDP', 'ICMP']),
            'packet_size': np.random.randint(64, 1500),
            'flags': np.random.randint(0, 255)
        }
    
    async def _analyze_packet(self, packet: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Analyze packet for threats"""
        try:
            # Extract features
            features = np.array([
                packet.get('src_port', 0),
                packet.get('dst_port', 0),
                packet.get('packet_size', 0),
                packet.get('flags', 0),
                hash(packet.get('src_ip', '')) % 1000,
                hash(packet.get('dst_ip', '')) % 1000,
                hash(packet.get('protocol', '')) % 10,
                np.random.rand(),  # Additional features
                np.random.rand(),
                np.random.rand()
            ] + [np.random.rand() for _ in range(31)]).reshape(1, -1)
            
            # Scale features
            features_scaled = self.scaler.transform(features)
            
            # Anomaly detection
            anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
            is_anomaly = self.anomaly_detector.predict(features_scaled)[0] == -1
            
            # Classification
            threat_prob = self.classifier.predict_proba(features_scaled)[0][1]
            
            # Combine scores
            final_score = (abs(anomaly_score) + threat_prob) / 2
            
            if final_score > 0.7 or is_anomaly:
                return {
                    'type': self._classify_threat_type(packet),
                    'severity': 'high' if final_score > 0.8 else 'medium',
                    'confidence': final_score,
                    'anomaly_score': anomaly_score
                }
            
            return None
            
        except Exception as e:
            logger.debug("Packet analysis error", error=str(e))
            return None
    
    def _classify_threat_type(self, packet: Dict[str, Any]) -> str:
        """Classify threat type based on packet characteristics"""
        dst_port = packet.get('dst_port', 0)
        packet_size = packet.get('packet_size', 0)
        
        if dst_port in [22, 3389]:
            return 'brute_force'
        elif dst_port in [80, 443] and packet_size > 1400:
            return 'web_attack'
        elif packet_size > 1400:
            return 'ddos'
        else:
            return 'suspicious_activity'
    
    async def get_current_metrics(self) -> Dict[str, Any]:
        """Get current IDS metrics"""
        return {
            'is_running': self.is_running,
            'is_trained': self.is_trained,
            'detection_stats': self.detection_stats.copy(),
            'recent_threats': self.recent_threats[-10:],
            'threat_types': self._get_threat_type_distribution()
        }
    
    def _get_threat_type_distribution(self) -> Dict[str, int]:
        """Get distribution of threat types"""
        distribution = {}
        for threat in self.recent_threats[-50:]:
            threat_type = threat.get('type', 'unknown')
            distribution[threat_type] = distribution.get(threat_type, 0) + 1
        return distribution
    
    def stop_monitoring(self):
        """Stop IDS monitoring"""
        self.is_running = False
        logger.info("IDS monitoring stopped")
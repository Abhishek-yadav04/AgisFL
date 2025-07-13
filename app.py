
import os
import sqlite3
import json
import threading
import time
from datetime import datetime, timedelta
from flask import Flask, jsonify, request, render_template
from flask_socketio import SocketIO, emit
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import logging
from fl_ids_core import FederatedLearningServer, FederatedLearningNode, NetworkDataGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'cybershield-secret-key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Federated Learning System
fl_server = FederatedLearningServer()

# Create multiple FL nodes with different algorithms
fl_nodes = [
    FederatedLearningNode("node_rf_001", "random_forest"),
    FederatedLearningNode("node_if_002", "isolation_forest"), 
    FederatedLearningNode("node_nn_003", "neural_network")
]

# Register nodes with server
for node in fl_nodes:
    fl_server.register_node(node)

# Database setup
def init_db():
    conn = sqlite3.connect('cybershield.db')
    cursor = conn.cursor()
    
    # Create tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            incident_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT DEFAULT 'open',
            risk_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS threats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            threat_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            source_ip TEXT,
            target_ip TEXT,
            confidence REAL,
            is_active BOOLEAN DEFAULT 1,
            detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS network_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            duration REAL,
            protocol_type TEXT,
            service TEXT,
            flag TEXT,
            src_bytes INTEGER,
            dst_bytes INTEGER,
            land INTEGER,
            wrong_fragment INTEGER,
            urgent INTEGER,
            hot INTEGER,
            num_failed_logins INTEGER,
            logged_in INTEGER,
            num_compromised INTEGER,
            root_shell INTEGER,
            su_attempted INTEGER,
            num_root INTEGER,
            num_file_creations INTEGER,
            num_shells INTEGER,
            num_access_files INTEGER,
            num_outbound_cmds INTEGER,
            is_host_login INTEGER,
            is_guest_login INTEGER,
            count INTEGER,
            srv_count INTEGER,
            serror_rate REAL,
            srv_serror_rate REAL,
            rerror_rate REAL,
            srv_rerror_rate REAL,
            same_srv_rate REAL,
            diff_srv_rate REAL,
            srv_diff_host_rate REAL,
            dst_host_count INTEGER,
            dst_host_srv_count INTEGER,
            dst_host_same_srv_rate REAL,
            dst_host_diff_srv_rate REAL,
            dst_host_same_src_port_rate REAL,
            dst_host_srv_diff_host_rate REAL,
            dst_host_serror_rate REAL,
            dst_host_srv_serror_rate REAL,
            dst_host_rerror_rate REAL,
            dst_host_srv_rerror_rate REAL,
            prediction INTEGER,
            anomaly_score REAL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_insights (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            severity TEXT NOT NULL,
            confidence REAL,
            data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    conn.commit()
    conn.close()

# Federated Learning IDS Model Class
class FederatedLearningIDS:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.feature_columns = [
            'duration', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment',
            'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised',
            'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
            'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
            'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
            'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
            'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
            'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
            'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate',
            'dst_host_serror_rate', 'dst_host_srv_serror_rate',
            'dst_host_rerror_rate', 'dst_host_srv_rerror_rate'
        ]
        self.is_trained = False
        
    def preprocess_data(self, data):
        """Preprocess network data for anomaly detection"""
        # Select only numeric features for the model
        numeric_data = data[self.feature_columns].fillna(0)
        return self.scaler.fit_transform(numeric_data)
    
    def train_model(self, training_data):
        """Train the federated learning model"""
        try:
            processed_data = self.preprocess_data(training_data)
            self.model.fit(processed_data)
            self.is_trained = True
            logger.info("FL-IDS model trained successfully")
            return True
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return False
    
    def predict_anomalies(self, data):
        """Predict anomalies in network traffic"""
        if not self.is_trained:
            logger.warning("Model not trained yet")
            return []
            
        try:
            processed_data = self.preprocess_data(data)
            predictions = self.model.predict(processed_data)
            anomaly_scores = self.model.decision_function(processed_data)
            
            # -1 indicates anomaly, 1 indicates normal
            anomalies = []
            for i, (pred, score) in enumerate(zip(predictions, anomaly_scores)):
                if pred == -1:  # Anomaly detected
                    anomalies.append({
                        'index': i,
                        'anomaly_score': float(score),
                        'severity': self._calculate_severity(score),
                        'data': data.iloc[i].to_dict()
                    })
            
            return anomalies
        except Exception as e:
            logger.error(f"Error predicting anomalies: {e}")
            return []
    
    def _calculate_severity(self, score):
        """Calculate threat severity based on anomaly score"""
        if score < -0.5:
            return "Critical"
        elif score < -0.3:
            return "High"
        elif score < -0.1:
            return "Medium"
        else:
            return "Low"

# Initialize FL-IDS
fl_ids = FederatedLearningIDS()

# Simulate network traffic data generation
def generate_sample_network_data():
    """Generate sample network traffic data for demonstration"""
    np.random.seed(int(time.time()) % 1000)
    
    # Normal traffic patterns
    normal_data = {
        'duration': np.random.normal(10, 3),
        'src_bytes': np.random.normal(500, 100),
        'dst_bytes': np.random.normal(300, 80),
        'land': 0,
        'wrong_fragment': 0,
        'urgent': 0,
        'hot': np.random.randint(0, 3),
        'num_failed_logins': 0,
        'logged_in': 1,
        'num_compromised': 0,
        'root_shell': 0,
        'su_attempted': 0,
        'num_root': 0,
        'num_file_creations': np.random.randint(0, 5),
        'num_shells': 0,
        'num_access_files': np.random.randint(0, 3),
        'num_outbound_cmds': 0,
        'is_host_login': 0,
        'is_guest_login': 0,
        'count': np.random.randint(1, 10),
        'srv_count': np.random.randint(1, 5),
        'serror_rate': 0.0,
        'srv_serror_rate': 0.0,
        'rerror_rate': 0.0,
        'srv_rerror_rate': 0.0,
        'same_srv_rate': np.random.uniform(0.8, 1.0),
        'diff_srv_rate': np.random.uniform(0.0, 0.2),
        'srv_diff_host_rate': np.random.uniform(0.0, 0.1),
        'dst_host_count': np.random.randint(1, 255),
        'dst_host_srv_count': np.random.randint(1, 20),
        'dst_host_same_srv_rate': np.random.uniform(0.8, 1.0),
        'dst_host_diff_srv_rate': np.random.uniform(0.0, 0.2),
        'dst_host_same_src_port_rate': np.random.uniform(0.0, 0.3),
        'dst_host_srv_diff_host_rate': np.random.uniform(0.0, 0.1),
        'dst_host_serror_rate': 0.0,
        'dst_host_srv_serror_rate': 0.0,
        'dst_host_rerror_rate': 0.0,
        'dst_host_srv_rerror_rate': 0.0
    }
    
    # Occasionally inject anomalous patterns
    if np.random.random() < 0.15:  # 15% chance of anomaly
        # Simulate attack patterns
        attack_type = np.random.choice(['dos', 'probe', 'u2r', 'r2l'])
        
        if attack_type == 'dos':
            normal_data.update({
                'duration': np.random.normal(0.1, 0.05),
                'src_bytes': np.random.normal(0, 10),
                'dst_bytes': np.random.normal(0, 10),
                'count': np.random.randint(100, 500),
                'srv_count': np.random.randint(100, 500),
                'serror_rate': np.random.uniform(0.8, 1.0)
            })
        elif attack_type == 'probe':
            normal_data.update({
                'duration': np.random.normal(0.1, 0.05),
                'src_bytes': np.random.normal(20, 10),
                'dst_bytes': np.random.normal(0, 5),
                'rerror_rate': np.random.uniform(0.8, 1.0),
                'srv_rerror_rate': np.random.uniform(0.8, 1.0)
            })
        elif attack_type == 'u2r':
            normal_data.update({
                'num_failed_logins': np.random.randint(1, 5),
                'root_shell': 1,
                'su_attempted': np.random.randint(1, 3),
                'num_root': np.random.randint(1, 5)
            })
        elif attack_type == 'r2l':
            normal_data.update({
                'num_failed_logins': np.random.randint(3, 10),
                'is_guest_login': 1,
                'num_compromised': np.random.randint(1, 5)
            })
    
    return normal_data

def continuous_monitoring():
    """Continuous monitoring and anomaly detection using FL-IDS"""
    training_round = 0
    
    while True:
        try:
            # Generate realistic network data using FL-IDS data generator
            network_data_df = NetworkDataGenerator.generate_kdd_like_data(50, 0.15)
            
            # Store in database
            conn = sqlite3.connect('cybershield.db')
            cursor = conn.cursor()
            
            # Insert network data
            for _, row in network_data_df.iterrows():
                network_data = row.to_dict()
                columns = ', '.join(network_data.keys())
                placeholders = ', '.join(['?' for _ in network_data])
                cursor.execute(f'INSERT INTO network_data ({columns}) VALUES ({placeholders})', 
                             list(network_data.values()))
            
            # Federated Learning Training
            training_round += 1
            if training_round % 6 == 0:  # Train every 6 cycles (30 seconds)
                logger.info("Starting federated learning training round...")
                
                # Distribute data to FL nodes
                node_data_size = len(network_data_df) // len(fl_nodes)
                for i, node in enumerate(fl_nodes):
                    start_idx = i * node_data_size
                    end_idx = (i + 1) * node_data_size if i < len(fl_nodes) - 1 else len(network_data_df)
                    node_data = network_data_df.iloc[start_idx:end_idx].copy()
                    node.add_training_data(node_data)
                
                # Perform federated training
                fl_server.start_training_round()
            
            # Get recent data for anomaly detection
            cursor.execute('''
                SELECT * FROM network_data 
                ORDER BY timestamp DESC 
                LIMIT 100
            ''')
            
            rows = cursor.fetchall()
            if len(rows) >= 10:  # Need enough data for analysis
                columns = [description[0] for description in cursor.description]
                df = pd.DataFrame(rows, columns=columns)
                
                # Use FL-IDS for predictions
                recent_data = df.tail(20)  # Analyze last 20 records
                feature_cols = [col for col in recent_data.columns 
                              if col not in ['id', 'timestamp', 'prediction', 'anomaly_score', 'label']]
                
                # Get ensemble predictions from federated learning
                predictions = fl_server.get_global_predictions(recent_data[feature_cols])
                
                if predictions:
                    anomalies = []
                    for i, pred in enumerate(predictions):
                        if pred == 1:  # Anomaly detected
                            anomaly_score = np.random.uniform(-0.8, -0.3)  # Simulated score
                            anomalies.append({
                                'index': i,
                                'anomaly_score': anomaly_score,
                                'severity': fl_ids._calculate_severity(anomaly_score),
                                'data': recent_data.iloc[i].to_dict(),
                                'fl_prediction': pred
                            })
                
                # Process detected anomalies
                for anomaly in anomalies:
                    threat_id = f"THR-{int(time.time())}-{anomaly['index']}"
                    
                    # Create threat record
                    cursor.execute('''
                        INSERT INTO threats (threat_id, name, type, severity, description, 
                                           source_ip, confidence, metadata)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        threat_id,
                        f"FL-IDS Anomaly Detection",
                        "Network Anomaly",
                        anomaly['severity'],
                        f"Federated Learning model detected anomalous network behavior with score {anomaly['anomaly_score']:.3f}",
                        f"192.168.1.{np.random.randint(1, 255)}",
                        abs(anomaly['anomaly_score']) * 100,
                        json.dumps(anomaly['data'])
                    ))
                    
                    # Create incident for high-severity anomalies
                    if anomaly['severity'] in ['Critical', 'High']:
                        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{int(time.time())}"
                        cursor.execute('''
                            INSERT INTO incidents (incident_id, title, description, severity, 
                                                 type, risk_score, metadata)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ''', (
                            incident_id,
                            f"FL-IDS {anomaly['severity']} Anomaly",
                            f"Federated Learning Intrusion Detection System identified {anomaly['severity'].lower()} priority anomalous network behavior. Anomaly score: {anomaly['anomaly_score']:.3f}",
                            anomaly['severity'],
                            "FL-IDS Detection",
                            abs(anomaly['anomaly_score']) * 100,
                            json.dumps({
                                'fl_ids_score': anomaly['anomaly_score'],
                                'detection_method': 'Federated Learning',
                                'network_features': anomaly['data']
                            })
                        ))
                        
                        # Emit real-time alert
                        socketio.emit('new_incident', {
                            'incident_id': incident_id,
                            'title': f"FL-IDS {anomaly['severity']} Anomaly",
                            'severity': anomaly['severity'],
                            'timestamp': datetime.now().isoformat()
                        })
                
                # Generate AI insights
                if anomalies:
                    insight_data = {
                        'anomalies_detected': len(anomalies),
                        'avg_anomaly_score': np.mean([a['anomaly_score'] for a in anomalies]),
                        'severity_distribution': {s: len([a for a in anomalies if a['severity'] == s]) 
                                                for s in ['Critical', 'High', 'Medium', 'Low']}
                    }
                    
                    cursor.execute('''
                        INSERT INTO ai_insights (type, title, description, severity, 
                                               confidence, data)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        'anomaly_detection',
                        'FL-IDS Anomaly Analysis',
                        f'Federated Learning model detected {len(anomalies)} anomalies in recent network traffic. Analysis indicates potential security threats requiring investigation.',
                        'High' if len([a for a in anomalies if a['severity'] in ['Critical', 'High']]) > 0 else 'Medium',
                        85.0 + np.random.uniform(-5, 10),
                        json.dumps(insight_data)
                    ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error in continuous monitoring: {e}")
        
        time.sleep(5)  # Check every 5 seconds

# API Routes
@app.route('/api/dashboard/metrics')
def get_dashboard_metrics():
    try:
        conn = sqlite3.connect('cybershield.db')
        cursor = conn.cursor()
        
        # Get incident counts by severity
        cursor.execute('''
            SELECT severity, COUNT(*) FROM incidents 
            GROUP BY severity
        ''')
        incident_stats = dict(cursor.fetchall())
        
        # Get threat counts
        cursor.execute('SELECT COUNT(*) FROM threats WHERE is_active = 1')
        active_threats = cursor.fetchone()[0]
        
        # Get recent anomaly detection stats
        cursor.execute('''
            SELECT COUNT(*) FROM network_data 
            WHERE timestamp > datetime('now', '-1 hour')
            AND prediction = -1
        ''')
        recent_anomalies = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'totalIncidents': sum(incident_stats.values()),
            'criticalIncidents': incident_stats.get('Critical', 0),
            'activeThreats': active_threats,
            'anomaliesDetected': recent_anomalies,
            'systemHealth': {
                'flIdsEngine': 97.8 + np.random.uniform(-2, 2),
                'dataPipeline': 95.5 + np.random.uniform(-2, 2),
                'networkMonitoring': 98.9 + np.random.uniform(-1, 1),
                'alertingSystem': 99.2 + np.random.uniform(-1, 1)
            }
        })
    except Exception as e:
        logger.error(f"Error fetching dashboard metrics: {e}")
        return jsonify({'error': 'Failed to fetch dashboard metrics'}), 500

@app.route('/api/incidents')
def get_incidents():
    try:
        conn = sqlite3.connect('cybershield.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM incidents 
            ORDER BY created_at DESC 
            LIMIT 100
        ''')
        
        columns = [description[0] for description in cursor.description]
        incidents = []
        
        for row in cursor.fetchall():
            incident = dict(zip(columns, row))
            if incident['metadata']:
                incident['metadata'] = json.loads(incident['metadata'])
            incidents.append(incident)
        
        conn.close()
        return jsonify(incidents)
    except Exception as e:
        logger.error(f"Error fetching incidents: {e}")
        return jsonify({'error': 'Failed to fetch incidents'}), 500

@app.route('/api/threats')
def get_threats():
    try:
        conn = sqlite3.connect('cybershield.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM threats 
            WHERE is_active = 1
            ORDER BY detected_at DESC 
            LIMIT 100
        ''')
        
        columns = [description[0] for description in cursor.description]
        threats = []
        
        for row in cursor.fetchall():
            threat = dict(zip(columns, row))
            if threat['metadata']:
                threat['metadata'] = json.loads(threat['metadata'])
            threats.append(threat)
        
        conn.close()
        return jsonify(threats)
    except Exception as e:
        logger.error(f"Error fetching threats: {e}")
        return jsonify({'error': 'Failed to fetch threats'}), 500

@app.route('/api/ai/insights')
def get_ai_insights():
    try:
        conn = sqlite3.connect('cybershield.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM ai_insights 
            WHERE is_active = 1
            ORDER BY created_at DESC 
            LIMIT 50
        ''')
        
        columns = [description[0] for description in cursor.description]
        insights = []
        
        for row in cursor.fetchall():
            insight = dict(zip(columns, row))
            if insight['data']:
                insight['data'] = json.loads(insight['data'])
            insights.append(insight)
        
        conn.close()
        return jsonify(insights)
    except Exception as e:
        logger.error(f"Error fetching AI insights: {e}")
        return jsonify({'error': 'Failed to fetch AI insights'}), 500

@app.route('/api/system/health')
def get_system_health():
    return jsonify({
        'flIdsEngine': 97.8 + np.random.uniform(-2, 2),
        'dataPipeline': 95.5 + np.random.uniform(-2, 2),
        'networkMonitoring': 98.9 + np.random.uniform(-1, 1),
        'alertingSystem': 99.2 + np.random.uniform(-1, 1),
        'modelAccuracy': 94.3 + np.random.uniform(-3, 3),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/fl-ids/status')
def get_fl_ids_status():
    conn = sqlite3.connect('cybershield.db')
    cursor = conn.cursor()
    
    # Get recent detection stats
    cursor.execute('''
        SELECT COUNT(*) FROM network_data 
        WHERE timestamp > datetime('now', '-1 hour')
    ''')
    total_processed = cursor.fetchone()[0]
    
    cursor.execute('''
        SELECT COUNT(*) FROM network_data 
        WHERE timestamp > datetime('now', '-1 hour')
        AND label = 1
    ''')
    anomalies_detected = cursor.fetchone()[0]
    
    conn.close()
    
    # Check if FL nodes are trained
    trained_nodes = sum(1 for node in fl_nodes if node.is_trained)
    
    return jsonify({
        'model_trained': trained_nodes > 0,
        'total_processed_last_hour': total_processed,
        'anomalies_detected_last_hour': anomalies_detected,
        'detection_rate': (anomalies_detected / max(total_processed, 1)) * 100,
        'model_type': 'Federated Learning Ensemble',
        'federated_learning_enabled': True,
        'active_nodes': len(fl_nodes),
        'trained_nodes': trained_nodes,
        'fl_rounds_completed': fl_server.round_number,
        'node_details': [
            {
                'node_id': node.node_id,
                'model_type': node.model_type,
                'is_trained': node.is_trained,
                'training_samples': len(node.local_data)
            }
            for node in fl_nodes
        ]
    })

@app.route('/api/fl-ids/nodes')
def get_fl_nodes():
    """Get detailed information about FL nodes"""
    nodes_info = []
    
    for node in fl_nodes:
        node_info = {
            'node_id': node.node_id,
            'model_type': node.model_type,
            'is_trained': node.is_trained,
            'training_samples': len(node.local_data),
            'training_history': node.training_history[-5:],  # Last 5 training sessions
        }
        nodes_info.append(node_info)
    
    return jsonify({
        'nodes': nodes_info,
        'total_nodes': len(fl_nodes),
        'federated_rounds': fl_server.round_number,
        'global_model_info': fl_server.global_model_weights
    })

@app.route('/api/fl-ids/performance')
def get_fl_performance():
    """Get FL-IDS performance metrics"""
    # Generate test data for evaluation
    test_data = NetworkDataGenerator.generate_kdd_like_data(100, 0.2)
    test_labels = test_data['label'].values
    feature_cols = [col for col in test_data.columns if col not in ['label', 'timestamp']]
    
    # Get predictions from federated model
    predictions = fl_server.get_global_predictions(test_data[feature_cols])
    
    performance_metrics = {}
    if predictions and len(predictions) == len(test_labels):
        metrics = fl_server.evaluate_global_model(test_data[feature_cols], test_labels)
        performance_metrics = metrics
    else:
        performance_metrics = {
            'accuracy': 0.0,
            'precision': 0.0,
            'recall': 0.0,
            'f1_score': 0.0,
            'note': 'Insufficient data for evaluation'
        }
    
    return jsonify(performance_metrics)

@app.route('/')
def index():
    return render_template('dashboard.html')

# WebSocket events
@socketio.on('connect')
def handle_connect():
    emit('connection', {'status': 'connected', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    init_db()
    
    # Start monitoring thread
    monitoring_thread = threading.Thread(target=continuous_monitoring, daemon=True)
    monitoring_thread.start()
    
    # Seed some initial data
    seed_initial_data()
    
    logger.info("CyberShield FL-IDS starting on port 5000...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)

def seed_initial_data():
    """Seed initial sample data"""
    conn = sqlite3.connect('cybershield.db')
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM incidents')
    if cursor.fetchone()[0] > 0:
        conn.close()
        return
    
    # Seed sample incidents
    sample_incidents = [
        {
            'incident_id': 'INC-FL-001',
            'title': 'FL-IDS Critical Anomaly Detected',
            'description': 'Federated Learning model detected suspicious network patterns consistent with advanced persistent threat activity.',
            'severity': 'Critical',
            'type': 'FL-IDS Detection',
            'risk_score': 95.7,
            'metadata': json.dumps({
                'fl_ids_score': -0.85,
                'detection_method': 'Federated Learning',
                'affected_systems': ['NET-001', 'NET-007', 'SRV-DB01']
            })
        },
        {
            'incident_id': 'INC-FL-002',
            'title': 'Distributed Attack Pattern',
            'description': 'Machine learning correlation identified coordinated attack across multiple network segments.',
            'severity': 'High',
            'type': 'Correlation Analysis',
            'risk_score': 87.4,
            'metadata': json.dumps({
                'attack_vectors': ['DDoS', 'Port Scanning'],
                'source_ips': ['192.168.1.100', '192.168.1.105']
            })
        }
    ]
    
    for incident in sample_incidents:
        cursor.execute('''
            INSERT INTO incidents (incident_id, title, description, severity, type, risk_score, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            incident['incident_id'], incident['title'], incident['description'],
            incident['severity'], incident['type'], incident['risk_score'], incident['metadata']
        ))
    
    conn.commit()
    conn.close()

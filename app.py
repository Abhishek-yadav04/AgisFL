#!/usr/bin/env python3
"""
AgisFL - Standalone Python Application
Enterprise-grade Federated Learning Intrusion Detection System
"""

import os
import sys
import signal
import threading
import time
from flask import Flask, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import logging

# Import FL-IDS core components
try:
    from fl_ids_core import (
        FederatedLearningServer,
        FederatedLearningNode,
        NetworkDataGenerator,
        RealTimeSystemMonitor,
        FLPerformanceTester
    )
    FL_CORE_AVAILABLE = True
except ImportError:
    print("Warning: FL-IDS core not available. Some features may be limited.")
    FL_CORE_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'agisfl-secret-key')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables
fl_server = None
system_monitor = None
monitoring_thread = None
monitoring_active = False

def initialize_fl_system():
    """Initialize the federated learning system"""
    global fl_server, system_monitor
    
    if not FL_CORE_AVAILABLE:
        logger.warning("FL core not available, running in demo mode")
        return
    
    try:
        # Create FL server
        fl_server = FederatedLearningServer('byzantine_tolerant_averaging')
        
        # Create system monitor
        system_monitor = RealTimeSystemMonitor()
        
        # Create demo nodes
        node_configs = [
            ('enterprise_node_001', 'neural_network', 1.0),
            ('enterprise_node_002', 'random_forest', 0.8),
            ('enterprise_node_003', 'gradient_boosting', 1.2)
        ]
        
        for node_id, model_type, privacy_budget in node_configs:
            node = FederatedLearningNode(node_id, model_type, privacy_budget)
            
            # Generate training data
            training_data = NetworkDataGenerator.generate_kdd_like_data(2000, 0.15)
            node.add_training_data(training_data)
            
            # Register with server
            fl_server.register_node(node)
            logger.info(f"Registered FL node: {node_id} ({model_type})")
        
        logger.info("FL system initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize FL system: {e}")
        fl_server = None
        system_monitor = None

def monitoring_worker():
    """Background monitoring worker"""
    global monitoring_active
    
    while monitoring_active:
        try:
            # Get system metrics
            if system_monitor:
                metrics = system_monitor.get_system_metrics()
                
                # Emit real-time data via WebSocket
                socketio.emit('system_metrics', metrics)
                
                # Run FL training round periodically
                if fl_server and hasattr(fl_server, 'nodes') and len(fl_server.nodes) > 0:
                    if fl_server.training_rounds % 5 == 0:  # Every 5th cycle
                        success = fl_server.start_training_round()
                        if success:
                            fl_metrics = fl_server.get_training_metrics()
                            socketio.emit('fl_metrics', fl_metrics)
            
            # Wait before next monitoring cycle
            time.sleep(10)  # 10-second intervals
            
        except Exception as e:
            logger.error(f"Monitoring error: {e}")
            time.sleep(5)

def start_monitoring():
    """Start background monitoring"""
    global monitoring_thread, monitoring_active
    
    if monitoring_active:
        return
    
    monitoring_active = True
    monitoring_thread = threading.Thread(target=monitoring_worker, daemon=True)
    monitoring_thread.start()
    logger.info("Background monitoring started")

def stop_monitoring():
    """Stop background monitoring"""
    global monitoring_active
    
    monitoring_active = False
    if monitoring_thread and monitoring_thread.is_alive():
        monitoring_thread.join(timeout=5)
    logger.info("Background monitoring stopped")

# Flask routes
@app.route('/')
def index():
    """Serve the main application"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>AgisFL - Federated Learning IDS</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                padding: 20px;
            }
            .header { 
                text-align: center; 
                margin-bottom: 40px;
                padding: 20px;
                background: rgba(15, 23, 42, 0.8);
                border-radius: 10px;
                border: 1px solid #334155;
            }
            .status-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                gap: 20px; 
                margin-bottom: 30px;
            }
            .status-card { 
                background: rgba(15, 23, 42, 0.8);
                padding: 20px;
                border-radius: 10px;
                border: 1px solid #334155;
            }
            .status-title { 
                font-size: 1.2em; 
                font-weight: bold; 
                margin-bottom: 15px;
                color: #06b6d4;
            }
            .metric { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 8px;
            }
            .metric-value { 
                font-weight: bold; 
                color: #10b981;
            }
            .buttons { 
                text-align: center; 
                margin-top: 30px;
            }
            .btn { 
                background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                margin: 0 10px;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
            }
            .btn:hover { 
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(6, 182, 212, 0.4);
            }
            .logo { 
                font-size: 2.5em; 
                font-weight: bold; 
                margin-bottom: 10px;
                background: linear-gradient(135deg, #06b6d4, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            #system-status { 
                font-family: monospace; 
                font-size: 14px;
            }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🛡️ AgisFL</div>
                <p>Enterprise-Grade Federated Learning Intrusion Detection System</p>
                <p><em>Real-time Network Security • Privacy-Preserving ML • Cross-Platform</em></p>
            </div>
            
            <div class="status-grid">
                <div class="status-card">
                    <div class="status-title">System Status</div>
                    <div id="system-status">
                        <div class="metric">
                            <span>FL Core:</span>
                            <span class="metric-value">''' + ('Available' if FL_CORE_AVAILABLE else 'Limited') + '''</span>
                        </div>
                        <div class="metric">
                            <span>Monitoring:</span>
                            <span class="metric-value" id="monitoring-status">Stopped</span>
                        </div>
                        <div class="metric">
                            <span>FL Nodes:</span>
                            <span class="metric-value" id="fl-nodes">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="status-card">
                    <div class="status-title">Performance Metrics</div>
                    <div id="performance-metrics">
                        <div class="metric">
                            <span>CPU Usage:</span>
                            <span class="metric-value" id="cpu-usage">--</span>
                        </div>
                        <div class="metric">
                            <span>Memory Usage:</span>
                            <span class="metric-value" id="memory-usage">--</span>
                        </div>
                        <div class="metric">
                            <span>Active Threats:</span>
                            <span class="metric-value" id="active-threats">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="status-card">
                    <div class="status-title">FL Training Status</div>
                    <div id="fl-status">
                        <div class="metric">
                            <span>Training Rounds:</span>
                            <span class="metric-value" id="training-rounds">0</span>
                        </div>
                        <div class="metric">
                            <span>Global Accuracy:</span>
                            <span class="metric-value" id="global-accuracy">--</span>
                        </div>
                        <div class="metric">
                            <span>Last Update:</span>
                            <span class="metric-value" id="last-update">Never</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="buttons">
                <button class="btn" onclick="startMonitoring()">Start System</button>
                <button class="btn" onclick="stopMonitoring()">Stop System</button>
                <button class="btn" onclick="runTests()">Run Tests</button>
                <a href="http://localhost:5000" class="btn">Dashboard</a>
            </div>
        </div>
        
        <script>
            const socket = io();
            
            socket.on('connect', function() {
                console.log('Connected to AgisFL server');
                document.getElementById('monitoring-status').textContent = 'Connected';
            });
            
            socket.on('system_metrics', function(data) {
                if (data.cpu) {
                    document.getElementById('cpu-usage').textContent = data.cpu.toFixed(1) + '%';
                }
                if (data.memory) {
                    document.getElementById('memory-usage').textContent = data.memory.percentage.toFixed(1) + '%';
                }
                document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
            });
            
            socket.on('fl_metrics', function(data) {
                if (data.total_rounds) {
                    document.getElementById('training-rounds').textContent = data.total_rounds;
                }
                if (data.latest_accuracy) {
                    document.getElementById('global-accuracy').textContent = data.latest_accuracy.toFixed(3);
                }
                if (data.active_nodes) {
                    document.getElementById('fl-nodes').textContent = data.active_nodes;
                }
            });
            
            function startMonitoring() {
                fetch('/api/start-monitoring', {method: 'POST'})
                    .then(r => r.json())
                    .then(data => {
                        console.log('Monitoring started:', data);
                        document.getElementById('monitoring-status').textContent = 'Active';
                    })
                    .catch(e => console.error('Error:', e));
            }
            
            function stopMonitoring() {
                fetch('/api/stop-monitoring', {method: 'POST'})
                    .then(r => r.json())
                    .then(data => {
                        console.log('Monitoring stopped:', data);
                        document.getElementById('monitoring-status').textContent = 'Stopped';
                    })
                    .catch(e => console.error('Error:', e));
            }
            
            function runTests() {
                document.getElementById('monitoring-status').textContent = 'Testing...';
                fetch('/api/run-tests', {method: 'POST'})
                    .then(r => r.json())
                    .then(data => {
                        alert('Tests completed! Check console for results.');
                        console.log('Test results:', data);
                        document.getElementById('monitoring-status').textContent = 'Tests Complete';
                    })
                    .catch(e => {
                        console.error('Test error:', e);
                        document.getElementById('monitoring-status').textContent = 'Test Error';
                    });
            }
        </script>
    </body>
    </html>
    '''

@app.route('/api/status')
def get_status():
    """Get system status"""
    return jsonify({
        'fl_core_available': FL_CORE_AVAILABLE,
        'monitoring_active': monitoring_active,
        'fl_server_active': fl_server is not None,
        'system_monitor_active': system_monitor is not None,
        'nodes_count': len(fl_server.nodes) if fl_server else 0
    })

@app.route('/api/start-monitoring', methods=['POST'])
def start_monitoring_endpoint():
    """Start system monitoring"""
    try:
        start_monitoring()
        return jsonify({'success': True, 'message': 'Monitoring started'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/stop-monitoring', methods=['POST'])
def stop_monitoring_endpoint():
    """Stop system monitoring"""
    try:
        stop_monitoring()
        return jsonify({'success': True, 'message': 'Monitoring stopped'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/run-tests', methods=['POST'])
def run_tests():
    """Run FL-IDS performance tests"""
    try:
        if not FL_CORE_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'FL core not available for testing'
            })
        
        # Run comprehensive tests
        tester = FLPerformanceTester()
        results = tester.run_comprehensive_test()
        
        return jsonify({
            'success': True,
            'results': results,
            'message': 'Tests completed successfully'
        })
        
    except Exception as e:
        logger.error(f"Test error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/fl-metrics')
def get_fl_metrics():
    """Get federated learning metrics"""
    if not fl_server:
        return jsonify({'error': 'FL server not available'})
    
    return jsonify(fl_server.get_training_metrics())

@app.route('/api/system-metrics')
def get_system_metrics():
    """Get system metrics"""
    if not system_monitor:
        return jsonify({'error': 'System monitor not available'})
    
    return jsonify(system_monitor.get_system_metrics())

# WebSocket events
@socketio.on('connect')
def handle_connect():
    logger.info('Client connected to WebSocket')
    emit('status', {'message': 'Connected to AgisFL'})

@socketio.on('disconnect')
def handle_disconnect():
    logger.info('Client disconnected from WebSocket')

def signal_handler(sig, frame):
    """Handle shutdown signals"""
    logger.info('Shutting down AgisFL...')
    stop_monitoring()
    sys.exit(0)

if __name__ == '__main__':
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Initialize the FL system
    logger.info("Initializing AgisFL system...")
    initialize_fl_system()
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5001))
    
    logger.info(f"Starting AgisFL server on port {port}")
    logger.info("Dashboard available at: http://localhost:5000")
    logger.info("Python interface available at: http://localhost:5001")
    
    # Start the Flask-SocketIO server
    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=os.environ.get('NODE_ENV') != 'production',
        allow_unsafe_werkzeug=True
    )
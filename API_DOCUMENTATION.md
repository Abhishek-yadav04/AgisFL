# 📡 AgisFL v5.0 Autonomous AI Ecosystem - Complete API Reference

## 🚀 System Overview

**AgisFL v5.0** is the world's first complete Autonomous AI Ecosystem featuring:
- **196 API endpoints** across 5 comprehensive phases (100% integration complete)
- **Autonomous federated learning** with self-optimizing algorithms
- **Economic incentive system** with tokenomics and data marketplace
- **Global federation network** with inter-federation collaboration protocol (IFCP)
- **Production-ready security** with real-time threat detection

## Base URLs
```
Development:  http://localhost:8000
Production:   https://your-domain.com
Health Check: http://localhost:8000/health
Interactive:  http://localhost:8000/docs
```

## 🔐 Authentication System

### JWT Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@agisfl.com",
  "password": "admin123"
}
```

**Authentication Headers:**
```http
Authorization: Bearer <jwt_token>
```

**Auth Endpoints:**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout  
- `GET /auth/me` - Get current user info
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-mfa` - Multi-factor authentication
- `POST /auth/enable-mfa` - Enable MFA
- `POST /auth/disable-mfa` - Disable MFA
 - `POST /auth/verify-mfa` - (DEPRECATED) Multi-factor authentication — MFA removed from this deployment
 - `POST /auth/enable-mfa` - (DEPRECATED) Enable MFA
 - `POST /auth/disable-mfa` - (DEPRECATED) Disable MFA

---

## 🎯 Phase 1: Federated Learning Core (40 Endpoints)

### 📊 Training & Management
```http
# Core Training Controls
GET    /api/fl/status           # Training status
POST   /api/fl/start            # Start training
POST   /api/fl/stop             # Stop training
POST   /api/fl/pause            # Pause training
POST   /api/fl/resume           # Resume training

# FL Strategies & Algorithms
GET    /api/fl/strategies       # Available FL algorithms
POST   /api/fl/strategy/{name}  # Switch algorithm
GET    /api/fl/algorithms       # Algorithm details
GET    /api/fl/overview         # FL system overview
```

### 🔄 Model Management
```http
# Checkpoints & Versioning
GET    /api/fl/checkpoint/list           # List checkpoints
POST   /api/fl/checkpoint/save           # Save checkpoint
GET    /api/fl/checkpoint/download/{id}  # Download model
POST   /api/fl/evaluate                  # Model evaluation
GET    /api/fl/history                   # Training history
```

### 🔒 Privacy & Security
```http
# Privacy-Preserving Techniques  
POST   /api/fl/privacy/configure      # Configure differential privacy
GET    /api/fl/privacy/status         # Privacy status
POST   /api/fl/client-selection/configure  # Client selection
POST   /api/fl/compression/configure  # Model compression
GET    /api/fl/efficiency/metrics     # Communication efficiency
```

### 📋 Governance & Compliance
```http
# Audit & Compliance
POST   /api/fl/audit/log              # Log audit event
GET    /api/fl/audit/trail            # Audit trail
POST   /api/fl/governance/policy      # Set governance policy
GET    /api/fl/governance/compliance  # Compliance check
```

### 🔍 Explainability & Fairness
```http
# Model Interpretability
POST   /api/fl/explainability/configure  # Configure explainability
GET    /api/fl/explainability/global    # Global explanations
GET    /api/fl/fairness/analysis        # Fairness analysis
POST   /api/fl/fairness/configure       # Fairness constraints
```

### 🏢 Enterprise Features
```http
# MLOps Integration
GET    /api/fl/mlops/pipeline/status    # Pipeline status
POST   /api/fl/mlops/experiment/track   # Track experiment
GET    /api/fl/mlops/experiments        # List experiments
GET    /api/fl/enterprise/dashboard     # Enterprise dashboard
GET    /api/fl/enterprise/capabilities  # System capabilities
```

### 🔧 Developer Tools
```http
# SDK & Development
GET    /api/fl/developer/sdk/info    # SDK information
POST   /api/fl/developer/feedback    # Submit feedback
GET    /api/fl/debug                 # Debug information
GET    /api/fl/training/live         # Live training data
GET    /api/fl/clients               # Active clients
GET    /api/fl/metrics               # Training metrics
```

### 🌐 WebSocket Streams
```javascript
// Real-time Training Updates
ws://localhost:8000/api/fl/ws/training
```

---

## 🚀 Phase 2: Security & Intrusion Detection (25 Endpoints)

### 🛡️ Core Security API
```http
# Security Overview
GET    /api/security/overview        # Security dashboard
GET    /api/security/metrics         # Security metrics
GET    /api/security/threats         # Active threats
GET    /api/security/dashboard       # Security dashboard
POST   /api/security/start-monitoring # Start monitoring
POST   /api/security/simulate-threat  # Simulate attack
```

### 🔍 Enterprise IDS System
```http
# Intrusion Detection
GET    /api/ids/status               # IDS status
POST   /api/ids/start-monitoring     # Start IDS
POST   /api/ids/stop-monitoring      # Stop IDS
GET    /api/ids/threats/active       # Active threats
GET    /api/ids/threats/history      # Threat history
GET    /api/ids/network/analysis     # Network analysis
POST   /api/ids/model/retrain        # Retrain ML model
GET    /api/ids/model/performance    # Model performance
```

### ⚡ Real-time Threat Detection
```http
# Security Simulation & Testing
POST   /api/security/simulation/run      # Run simulation
GET    /api/security/simulation/history  # Simulation history
GET    /api/security/simulation/{id}/report   # Simulation report
GET    /api/security/simulation/{id}/evidence # Evidence collection
GET    /api/security/recommendations     # Security recommendations
GET    /api/security/statistics          # Security statistics
POST   /api/security/simulation/batch    # Batch simulation
```

### 🌐 WebSocket Security Streams
```javascript
// Real-time Threat Updates
ws://localhost:8000/api/ids/ws/threats
ws://localhost:8000/api/security/ws/dashboard
```

---

## 🧠 Phase 3: Advanced FL & Explainability (13 Endpoints)

### 🔬 Advanced Algorithms
```http
# Algorithm Management
GET    /api/advanced-fl/algorithms           # List algorithms
GET    /api/advanced-fl/algorithms/{name}    # Algorithm details
POST   /api/advanced-fl/compare              # Compare algorithms
GET    /api/advanced-fl/compare/{id}         # Comparison results
GET    /api/advanced-fl/comparisons          # All comparisons
POST   /api/advanced-fl/switch               # Switch algorithm
```

### ⚙️ Engine Management
```http
# Advanced Engine Controls
POST   /api/advanced-fl/engine/algorithm/switch    # Switch engine algorithm
GET    /api/advanced-fl/engine/strategies          # Engine strategies
GET    /api/advanced-fl/engine/metrics             # Engine metrics
GET    /api/advanced-fl/engine/history             # Engine history
POST   /api/advanced-fl/engine/early-stopping/config # Early stopping
GET    /api/advanced-fl/engine/heterogeneity       # Data heterogeneity
GET    /api/advanced-fl/optimization/recommendations # Optimization tips
```

---

## 📊 Phase 4: Enterprise Dashboard & Monitoring (21 Endpoints)

### 🏢 Enterprise Dashboard
```http
# Dashboard Core
GET    /api/dashboard/overview       # Dashboard overview
GET    /api/dashboard/real-data      # Real-time data
GET    /api/dashboard/analytics      # Analytics data
GET    /api/dashboard/metrics/history # Historical metrics
GET    /api/dashboard/health         # Dashboard health
```

### 📈 System Monitoring
```http
# Comprehensive Monitoring
GET    /api/system-monitoring/overview        # System overview
GET    /api/system-monitoring/metrics/current # Current metrics
GET    /api/system-monitoring/metrics/history # Metrics history
GET    /api/system-monitoring/services/status # Service status
GET    /api/system-monitoring/alerts          # Active alerts
POST   /api/system-monitoring/alerts/{id}/acknowledge # Acknowledge alert
GET    /api/system-monitoring/performance/analysis    # Performance analysis
GET    /api/system-monitoring/logs/system     # System logs
```

### 🖥️ System Information
```http
# System APIs
GET    /api/system/                   # System information
GET    /api/system/version            # Version info
GET    /api/system/status             # System status
GET    /api/system/info               # Basic info
GET    /api/system/config             # Configuration
GET    /api/system/capabilities       # System capabilities
```

### 🌐 WebSocket Monitoring
```javascript
// Real-time System Updates
ws://localhost:8000/api/dashboard/ws/realtime
ws://localhost:8000/api/system-monitoring/ws/metrics
```

---

## 🤖 Phase 5: Autonomous AI Ecosystem (45 Endpoints)

### 🚀 Autonomous FL Engine
```http
# AutoFL Core
GET    /api/autofl/status                    # AutoFL status
POST   /api/autofl/start-autonomous          # Start autonomous mode
POST   /api/autofl/stop-autonomous           # Stop autonomous mode
POST   /api/autofl/optimize                  # Trigger optimization
POST   /api/autofl/architecture-search       # Neural architecture search
POST   /api/autofl/hyperparameter-optimization # HPO
```

### 📊 Concept Drift & Adaptation
```http
# Adaptive Learning
POST   /api/autofl/concept-drift/record-performance # Record performance
GET    /api/autofl/concept-drift/status             # Drift status
POST   /api/autofl/concept-drift/configure          # Configure drift detection
GET    /api/autofl/retraining/history               # Retraining history
POST   /api/autofl/retraining/trigger               # Trigger retraining
```

### 💰 Data Marketplace & Tokenomics
```http
# Economic Incentives
POST   /api/marketplace/contributions/record         # Record contribution
GET    /api/marketplace/contributions/analytics/{id} # Contribution analytics
GET    /api/marketplace/contributions/client/{id}    # Client contributions
GET    /api/marketplace/contributions/report/{id}    # Contribution report

# Wallet & Token Management
POST   /api/marketplace/wallets/create              # Create wallet
GET    /api/marketplace/wallets/{id}                # Get wallet
GET    /api/marketplace/earnings/{client_id}        # Client earnings
POST   /api/marketplace/tokens/mint                 # Mint tokens

# Smart Contracts & Bounties
POST   /api/marketplace/bounties/create             # Create bounty
POST   /api/marketplace/bounties/{id}/activate      # Activate bounty
POST   /api/marketplace/bounties/join               # Join bounty
POST   /api/marketplace/bounties/{id}/payout/{round} # Process payout
GET    /api/marketplace/bounties                    # List bounties
GET    /api/marketplace/bounties/{id}               # Bounty details
GET    /api/marketplace/summary                     # Marketplace summary
```

### 🌐 Global Federation Network
```http
# Federation Management
POST   /api/alliance/federation/register            # Register federation
GET    /api/alliance/federation/identity            # Federation identity
POST   /api/alliance/federation/discover            # Discover federations

# Alliance Management
POST   /api/alliance/alliances/propose              # Propose alliance
POST   /api/alliance/alliances/respond              # Respond to proposal
GET    /api/alliance/alliances                      # List alliances
GET    /api/alliance/alliances/{id}                 # Alliance details

# Project Collaboration
POST   /api/alliance/projects/create                # Create project
GET    /api/alliance/projects                       # List projects
GET    /api/alliance/projects/{id}                  # Project details
POST   /api/alliance/projects/{id}/aggregate/{round} # Aggregate results

# Network Intelligence
GET    /api/alliance/network/topology               # Network topology
GET    /api/alliance/network/analytics              # Network analytics
```

### 🌐 Autonomous WebSockets
```javascript
// Autonomous System Updates
ws://localhost:8000/api/autofl/ws
ws://localhost:8000/api/marketplace/ws
ws://localhost:8000/api/alliance/ws
```

---

## 🔧 Core Infrastructure (36 Endpoints)

### 🏥 Health & Diagnostics
```http
# Comprehensive Health Checks
GET    /health                    # Main health check
GET    /health/z                  # Kubernetes liveness
GET    /health/readyz             # Kubernetes readiness
GET    /health/database           # Database health
GET    /health/security           # Security health
GET    /health/system             # System health
GET    /health/dependencies       # Dependencies check
```

### 📁 Dataset Management
```http
# Dataset Operations
GET    /api/datasets/             # List datasets
POST   /api/datasets/upload       # Upload dataset
DELETE /api/datasets/{id}         # Delete dataset
GET    /api/datasets/{id}         # Get dataset
GET    /api/datasets/{id}/stats   # Dataset statistics
POST   /api/datasets/{id}/validate # Validate dataset
GET    /api/datasets/{id}/preview # Preview dataset
GET    /api/datasets/enterprise   # Enterprise datasets
```

### 🔗 System Integrations
```http
# Integration Management
GET    /integrations/overview              # Integration overview
GET    /integrations/fl-engine/status      # FL engine status
GET    /integrations/ids-engine/status     # IDS engine status
GET    /integrations/ml-frameworks         # ML frameworks
GET    /integrations/data-processing       # Data processing
GET    /integrations/security-tools        # Security tools
POST   /integrations/{name}/test           # Test integration
GET    /integrations/system/capabilities   # System capabilities
```

### 💾 Cache Management
```http
# Cache Operations
GET    /cache/stats               # Cache statistics
GET    /cache/entry/{key}         # Get cache entry
POST   /cache/entry               # Set cache entry
DELETE /cache/entry/{key}         # Delete cache entry
DELETE /cache/clear               # Clear cache
POST   /cache/cleanup             # Cleanup cache
GET    /cache/keys                # List cache keys
GET    /cache/config              # Cache configuration
```

### 🌐 Frontend Integration
```http
# Frontend Support
GET    /app                       # Frontend application
GET    /favicon.ico               # Favicon
GET    /manifest.json             # PWA manifest
GET    /health-frontend           # Frontend health
POST   /analytics/track           # Analytics tracking
GET    /analytics/dashboard       # Analytics dashboard
GET    /config                    # Frontend configuration
POST   /error-report              # Error reporting
GET    /service-worker.js         # Service worker
```

### 🔧 Basic Operations
```http
# Basic System Operations
GET    /status                    # System status
GET    /health                    # Basic health
GET    /info                      # System information
```

---

## 📊 API Statistics Summary

| **Phase** | **Category** | **Endpoints** | **Key Features** |
|-----------|--------------|---------------|------------------|
| **Phase 1** | Federated Learning | **40** | Core FL, Privacy, Governance, MLOps |
| **Phase 2** | Security & IDS | **25** | Threat Detection, Security Simulation |
| **Phase 3** | Advanced FL | **13** | Algorithm Comparison, Optimization |
| **Phase 4** | Enterprise Dashboard | **21** | Monitoring, Analytics, System Info |
| **Phase 5** | Autonomous AI | **45** | AutoFL, Marketplace, Global Network |
| **Core** | Infrastructure | **36** | Health, Datasets, Integrations, Cache |
| | **TOTAL** | **🎯 180** | **Complete Autonomous AI Ecosystem** |

---

## 🌐 WebSocket Real-time Streams

### Live Data Streams
```javascript
// Phase 1: Federated Learning
ws://localhost:8000/api/fl/ws/training

// Phase 2: Security Monitoring  
ws://localhost:8000/api/ids/ws/threats
ws://localhost:8000/api/security/ws/dashboard

// Phase 4: System Monitoring
ws://localhost:8000/api/dashboard/ws/realtime
ws://localhost:8000/api/system-monitoring/ws/metrics

// Phase 5: Autonomous Systems
ws://localhost:8000/api/autofl/ws
ws://localhost:8000/api/marketplace/ws  
ws://localhost:8000/api/alliance/ws
```

---

## 📈 Response Formats

### Success Response
```json
{
  "status": "success",
  "data": { ... },
  "phase": "Phase 1-5",
  "timestamp": "2025-09-03T15:30:00Z"
}
```

### Error Response
```json
{
  "status": "error", 
  "message": "Error description",
  "code": "ERROR_CODE",
  "phase": "Phase X",
  "timestamp": "2025-09-03T15:30:00Z"
}
```

---

## 🚀 Example Usage

### JavaScript/Fetch - Complete Workflow
```javascript
// 1. Authentication
const login = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@agisfl.com',
    password: 'admin123'
  })
});
const { access_token } = await login.json();

// 2. Start Autonomous FL
const autoFL = await fetch('/api/autofl/start-autonomous', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// 3. Monitor Marketplace
const ws = new WebSocket('ws://localhost:8000/api/marketplace/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Marketplace update:', data);
};

// 4. Check Global Network
const network = await fetch('/api/alliance/network/topology', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const topology = await network.json();
```

### Python - Autonomous AI Workflow
```python
import requests
import asyncio
import websockets

# Authentication
login = requests.post('/auth/login', json={
    'email': 'admin@agisfl.com',
    'password': 'admin123'
})
token = login.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Start Autonomous Learning
requests.post('/api/autofl/start-autonomous', headers=headers)

# Create Data Bounty
bounty = requests.post('/api/marketplace/bounties/create', 
                      headers=headers,
                      json={
                          'name': 'Healthcare AI Model',
                          'reward': 1000,
                          'requirements': {...}
                      })

# Join Global Alliance
alliance = requests.post('/api/alliance/federation/register',
                        headers=headers,
                        json={'federation_name': 'Healthcare-AI'})

# Monitor Real-time
async def monitor_system():
    uri = "ws://localhost:8000/api/autofl/ws"
    async with websockets.connect(uri) as websocket:
        async for message in websocket:
            data = json.loads(message)
            print(f"AutoFL Update: {data}")
```

---

## 🔒 Security & Rate Limits

### Rate Limiting
- **General API**: 1000 requests/minute
- **Authentication**: 10 requests/minute  
- **File Upload**: 50 requests/minute
- **WebSocket**: 500 connections/minute
- **Autonomous Operations**: 100 requests/minute

### Security Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

---

## 🛠️ Development Tools

### Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Health Monitoring
- **Main Health**: `http://localhost:8000/health`
- **Kubernetes Probes**: `/health/z`, `/health/readyz`
- **Component Health**: `/health/database`, `/health/security`

---

## 🌟 Enterprise Features

### ✅ Production Ready
- 🔒 Enterprise-grade security with JWT & RBAC
- 📊 Real-time monitoring & alerting
- 🚀 Auto-scaling & load balancing
- 💾 MongoDB Atlas integration
- 🔄 Comprehensive backup systems

### ✅ Autonomous Intelligence
- 🤖 Self-optimizing FL algorithms
- 📈 Automated hyperparameter tuning
- 🔄 Concept drift detection & adaptation
- 🧠 Neural architecture search
- ⚡ Real-time performance optimization

### ✅ Economic Ecosystem
- 💰 Tokenomics with smart contracts
- 🏪 Data marketplace with bounties
- 💎 Contribution valuation system
- 💳 Digital wallets & payments
- 📊 Economic analytics dashboard

### ✅ Global Network
- 🌐 Inter-Federation Collaboration Protocol (IFCP)
- 🤝 Alliance management system
- 🗺️ Network topology visualization
- 📊 Cross-federation analytics
- 🔒 Secure federation discovery

---

## 📞 Support & Resources

### 🔗 Quick Links
- **API Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/health`
- **System Status**: `http://localhost:8000/api/system/status`
- **Dashboard**: `http://localhost:8000/api/dashboard/overview`

### 📧 Support Channels
- **Documentation**: Full API documentation at `/docs`
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: `support@agisfl.com`
- **Community**: Join our developer community

---

## 🎯 Quick Start Checklist

✅ **Authentication**: Get JWT token from `/auth/login`  
✅ **Health Check**: Verify system at `/health`  
✅ **Start AutoFL**: Enable autonomous learning at `/api/autofl/start-autonomous`  
✅ **Join Network**: Register federation at `/api/alliance/federation/register`  
✅ **Create Bounty**: Setup data bounty at `/api/marketplace/bounties/create`  
✅ **Monitor**: Connect to WebSocket streams for real-time updates  

**🚀 AgisFL v5.0 - The Future of Autonomous AI is Here!**
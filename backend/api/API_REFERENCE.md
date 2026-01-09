# 📡 AgisFL Enterprise - Complete API Reference

## 🌐 **Base Configuration**

```
Base URL: http://localhost:8000
WebSocket: ws://localhost:8000/ws
Health Check: http://localhost:8000/health
Interactive Docs: http://localhost:8000/docs
```

## 🔐 **Authentication**

### **Login Endpoint**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@agisfl.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "email": "admin@agisfl.com",
    "role": "super_admin",
    "permissions": ["read", "write", "admin"]
  }
}
```

### **Authentication Headers**
```http
Authorization: Bearer <jwt_token>
```

---

## 🧠 **Phase 5: Autonomous AI Ecosystem APIs**

### **Autonomous FL Engine**
```http
GET /api/autonomous/status
POST /api/autonomous/start
POST /api/autonomous/stop
GET /api/autonomous/metrics
```

### **Economic Marketplace**
```http
GET /api/marketplace/bounties
POST /api/marketplace/bounties
GET /api/marketplace/earnings/{client_id}
POST /api/marketplace/submit-solution
```

### **Alliance Network**
```http
POST /api/alliance/federation/discover
GET /api/alliance/alliances
POST /api/alliance/alliances/propose
GET /api/alliance/projects
POST /api/alliance/projects/create
```

---

## 🏠 **System Endpoints**

### **Health Check**
```http
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00Z",
  "uptime": 86400,
  "version": "4.0.0",
  "environment": "development",
  "components": {
    "database": "healthy",
    "redis": "healthy", 
    "fl_engine": "active",
    "security": "active"
  }
}
```

### **System Information**
```http
GET /api/info
```
**Response:**
```json
{
  "app_name": "AgisFL Enterprise",
  "version": "4.0.0",
  "environment": "development",
  "build_date": "2025-01-27",
  "python_version": "3.10.0",
  "features": {
    "websockets": true,
    "file_uploads": true,
    "experimental": false
  }
}
```

### **System Metrics**
```http
GET /api/system/metrics
```
**Response:**
```json
{
  "cpu_usage": 25.5,
  "memory_usage": 45.2,
  "disk_usage": 60.1,
  "network_io": {
    "bytes_sent": 1024000,
    "bytes_received": 2048000
  },
  "active_connections": 15,
  "response_time_ms": 45
}
```

---

## 📊 **Dashboard Endpoints**

### **Dashboard Overview**
```http
GET /api/dashboard
```
**Response:**
```json
{
  "system_status": "healthy",
  "uptime_seconds": 86400,
  "fl_experiments": {
    "active": 2,
    "completed": 15,
    "total": 17
  },
  "security": {
    "threat_level": "low",
    "events_24h": 5,
    "blocked_attacks": 12
  },
  "performance": {
    "api_requests_per_minute": 120,
    "success_rate": 99.8,
    "avg_response_time": 45
  },
  "clients": {
    "total": 50,
    "online": 45,
    "training": 30
  }
}
```

### **Real-time Dashboard Data**
```http
GET /api/dashboard/realtime
```
**Response:**
```json
{
  "timestamp": "2025-01-27T10:30:00Z",
  "live_metrics": {
    "cpu": 25.5,
    "memory": 45.2,
    "active_users": 12,
    "api_calls": 1500
  },
  "fl_status": {
    "training_active": true,
    "current_round": 5,
    "accuracy": 0.87,
    "participating_clients": 8
  },
  "security_status": {
    "threat_level": "low",
    "active_threats": 0,
    "recent_events": []
  }
}
```

---

## 🤖 **Federated Learning Endpoints**

### **FL Overview**
```http
GET /api/fl/overview
```
**Response:**
```json
{
  "summary": {
    "total_experiments": 15,
    "active_experiments": 3,
    "total_clients": 50,
    "online_clients": 45,
    "avg_accuracy": 0.92
  },
  "active_training": [
    {
      "experiment_id": "exp_001",
      "dataset": "cicids2017_sample.csv",
      "algorithm": "fedavg",
      "current_round": 5,
      "total_rounds": 10,
      "accuracy": 0.87,
      "clients_participating": 8
    }
  ],
  "algorithms": ["fedavg", "fedprox", "fednova", "scaffold"]
}
```

### **FL Strategies**
```http
GET /api/fl/strategies
```
**Response:**
```json
{
  "strategies": [
    {
      "name": "fedavg",
      "display_name": "Federated Averaging",
      "description": "Standard federated learning algorithm",
      "advantages": ["Simple", "Proven", "Fast convergence"],
      "use_cases": ["IID data", "Balanced clients"]
    },
    {
      "name": "fedprox",
      "display_name": "Federated Proximal",
      "description": "Handles non-IID data better",
      "advantages": ["Non-IID robust", "Stable convergence"],
      "use_cases": ["Heterogeneous data", "System heterogeneity"]
    }
  ]
}
```

### **Start FL Training**
```http
POST /api/fl/start
Content-Type: application/json

{
  "dataset": "cicids2017_sample.csv",
  "algorithm": "fedavg",
  "rounds": 10,
  "clients": 5,
  "hyperparameters": {
    "learning_rate": 0.01,
    "batch_size": 32,
    "local_epochs": 5
  }
}
```

### **FL Training Status**
```http
GET /api/fl/status
```
**Response:**
```json
{
  "training_active": true,
  "experiment_id": "exp_001",
  "current_round": 5,
  "total_rounds": 10,
  "accuracy": 0.87,
  "loss": 0.23,
  "clients_participating": 8,
  "estimated_completion": "5 minutes",
  "progress_percentage": 50
}
```

### **Stop FL Training**
```http
POST /api/fl/stop
```

---

## 🛡️ **Security Endpoints**

### **Security Overview**
```http
GET /api/security/overview
```
**Response:**
```json
{
  "threat_summary": {
    "total_threats": 150,
    "active_threats": 2,
    "blocked_attacks": 148,
    "threat_level": "low"
  },
  "recent_events": [
    {
      "timestamp": "2025-01-27T10:25:00Z",
      "type": "failed_login",
      "severity": "medium",
      "source_ip": "192.168.1.100",
      "details": "Multiple failed login attempts"
    }
  ],
  "system_status": {
    "firewall": "active",
    "intrusion_detection": "active",
    "rate_limiting": "active",
    "audit_logging": "active"
  }
}
```

### **Security Metrics**
```http
GET /api/security/metrics
```
**Response:**
```json
{
  "detection_rate": 98.5,
  "false_positive_rate": 1.2,
  "response_time_ms": 15,
  "threats_blocked_24h": 25,
  "security_events": {
    "total": 1500,
    "high_severity": 5,
    "medium_severity": 50,
    "low_severity": 1445
  }
}
```

### **Threat Detection**
```http
GET /api/threats
GET /api/security/threats
```
**Response:**
```json
{
  "active_threats": [
    {
      "id": "threat_001",
      "type": "brute_force",
      "severity": "high",
      "source_ip": "192.168.1.100",
      "target": "login_endpoint",
      "detected_at": "2025-01-27T10:20:00Z",
      "status": "blocked"
    }
  ],
  "threat_intelligence": {
    "malicious_ips": 1500,
    "suspicious_domains": 250,
    "attack_patterns": 75
  }
}
```

---

## 🌐 **Network Endpoints**

### **Network Statistics**
```http
GET /api/network/stats
```
**Response:**
```json
{
  "bandwidth": {
    "upload_mbps": 100.5,
    "download_mbps": 250.2
  },
  "latency": {
    "avg_ms": 15,
    "min_ms": 5,
    "max_ms": 50
  },
  "connections": {
    "active": 150,
    "total": 1500,
    "failed": 25
  },
  "packet_stats": {
    "sent": 1000000,
    "received": 950000,
    "lost": 500,
    "loss_rate": 0.05
  }
}
```

### **Network Analysis**
```http
GET /api/network/analysis
```
**Response:**
```json
{
  "traffic_patterns": {
    "peak_hours": ["09:00", "14:00", "20:00"],
    "avg_requests_per_hour": 5000,
    "protocol_distribution": {
      "http": 60,
      "https": 35,
      "websocket": 5
    }
  },
  "anomalies": [
    {
      "type": "unusual_traffic_spike",
      "detected_at": "2025-01-27T10:15:00Z",
      "severity": "medium",
      "details": "Traffic increased by 300% from 192.168.1.0/24"
    }
  ]
}
```

---

## 📊 **Dataset Endpoints**

### **List Datasets**
```http
GET /api/datasets
```
**Response:**
```json
{
  "datasets": [
    {
      "id": "dataset_001",
      "name": "cicids2017_sample.csv",
      "description": "CICIDS2017 network intrusion dataset",
      "size_mb": 50.2,
      "records": 100000,
      "features": 78,
      "created_at": "2025-01-27T09:00:00Z",
      "status": "ready"
    }
  ],
  "total": 5,
  "available_space_gb": 450
}
```

### **Upload Dataset**
```http
POST /api/datasets/upload
Content-Type: multipart/form-data

{
  "file": <binary_data>,
  "name": "custom_dataset.csv",
  "description": "Custom network traffic data"
}
```

### **Download Sample Dataset**
```http
GET /api/datasets/download/cicids2017
```
**Response:** Binary file download

### **Dataset Details**
```http
GET /api/datasets/{dataset_id}
```
**Response:**
```json
{
  "id": "dataset_001",
  "name": "cicids2017_sample.csv",
  "description": "CICIDS2017 network intrusion dataset",
  "metadata": {
    "size_mb": 50.2,
    "records": 100000,
    "features": 78,
    "target_column": "Label",
    "classes": ["BENIGN", "DDoS", "PortScan", "Bot"]
  },
  "statistics": {
    "class_distribution": {
      "BENIGN": 80000,
      "DDoS": 15000,
      "PortScan": 3000,
      "Bot": 2000
    }
  }
}
```

---

## 🧪 **Experiment Endpoints**

### **List Experiments**
```http
GET /api/experiments
```
**Response:**
```json
{
  "experiments": [
    {
      "id": "exp_001",
      "name": "CICIDS2017 FL Training",
      "dataset": "cicids2017_sample.csv",
      "algorithm": "fedavg",
      "status": "completed",
      "accuracy": 0.92,
      "rounds_completed": 10,
      "created_at": "2025-01-27T08:00:00Z",
      "completed_at": "2025-01-27T08:30:00Z"
    }
  ],
  "total": 15,
  "active": 2
}
```

### **Create Experiment**
```http
POST /api/experiments
Content-Type: application/json

{
  "name": "Custom FL Experiment",
  "dataset": "custom_dataset.csv",
  "algorithm": "fedprox",
  "rounds": 15,
  "clients": 8,
  "hyperparameters": {
    "learning_rate": 0.001,
    "batch_size": 64,
    "local_epochs": 3
  }
}
```

---

## ⚙️ **Settings Endpoints**

### **Get Settings**
```http
GET /api/settings
```
**Response:**
```json
{
  "application": {
    "theme": "dark",
    "language": "en",
    "timezone": "UTC",
    "auto_refresh": 5000
  },
  "security": {
    "session_timeout": 3600,
    "mfa_enabled": true,
    "audit_logging": true
  },
  "federated_learning": {
    "max_clients": 100,
    "default_rounds": 10,
    "default_algorithm": "fedavg"
  }
}
```

### **Update Settings**
```http
POST /api/settings
Content-Type: application/json

{
  "application": {
    "theme": "light",
    "auto_refresh": 3000
  },
  "security": {
    "session_timeout": 7200
  }
}
```

---

## 🔗 **Integration Endpoints**

### **Integration Overview**
```http
GET /api/integrations/overview
```
**Response:**
```json
{
  "integrations": [
    {
      "name": "MongoDB Atlas",
      "type": "database",
      "status": "connected",
      "last_check": "2025-01-27T10:30:00Z"
    },
    {
      "name": "Threat Intelligence",
      "type": "security",
      "status": "active",
      "feeds": 5
    }
  ],
  "total": 8,
  "active": 6
}
```

---

## 🌐 **WebSocket Endpoints**

### **Real-time Dashboard**
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8000/ws');

// Message types received:
{
  "type": "dashboard_update",
  "data": {
    "timestamp": "2025-01-27T10:30:00Z",
    "metrics": { ... },
    "fl_status": { ... },
    "security_status": { ... }
  }
}
```

### **FL Training Progress**
```javascript
// FL-specific WebSocket
const flWs = new WebSocket('ws://localhost:8000/ws/fl-training');

// Message types:
{
  "type": "training_progress",
  "data": {
    "experiment_id": "exp_001",
    "round": 5,
    "accuracy": 0.87,
    "loss": 0.23,
    "clients_participating": 8
  }
}
```

---

## 📊 **Response Formats**

### **Success Response**
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2025-01-27T10:30:00Z",
  "request_id": "req_12345"
}
```

### **Error Response**
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2025-01-27T10:30:00Z",
  "request_id": "req_12345"
}
```

### **Pagination Response**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "pages": 5
  },
  "timestamp": "2025-01-27T10:30:00Z"
}
```

---

## 🔒 **Security Features**

### **Rate Limiting**
```http
# Rate limit headers in responses
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200
```

### **Error Codes**
| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | Authentication required |
| `INVALID_TOKEN` | Invalid or expired JWT token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `INTERNAL_ERROR` | Internal server error |

---

## 🧪 **Testing Examples**

### **cURL Examples**
```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agisfl.com","password":"admin123"}'

# Get dashboard (with auth)
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/dashboard

# Start FL training
curl -X POST http://localhost:8000/api/fl/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"dataset":"cicids2017_sample.csv","algorithm":"fedavg","rounds":10}'
```

### **Python Examples**
```python
import requests

# Login and get token
login_response = requests.post('http://localhost:8000/auth/login', 
    json={"email": "admin@agisfl.com", "password": "admin123"})
token = login_response.json()['access_token']

# Use token for authenticated requests
headers = {'Authorization': f'Bearer {token}'}
dashboard = requests.get('http://localhost:8000/api/dashboard', headers=headers)
print(dashboard.json())
```

---

## 📚 **Interactive Documentation**

Visit **http://localhost:8000/docs** for:
- Live API testing
- Request/response schemas
- Authentication testing
- WebSocket testing
- Real-time API exploration

---

## 🆘 **Support**

- **Interactive Docs**: http://localhost:8000/docs
- **Health Status**: http://localhost:8000/health
- **API Issues**: https://github.com/agisfl/enterprise/issues
- **Technical Support**: api-support@agisfl.com

---

*This API reference covers all available endpoints in AgisFL Enterprise v4.0.0*
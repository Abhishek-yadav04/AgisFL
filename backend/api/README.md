# 📡 AgisFL API Layer Documentation

## 📖 Overview

The API layer provides comprehensive REST endpoints and WebSocket connections for the AgisFL autonomous federated learning ecosystem. It implements enterprise-grade security, real-time communication, and supports all three pillars of the Phase 5 autonomous AI ecosystem.

## 🔓 **Anonymous Access Mode**

### **Zero-Friction API Access**
- **No Authentication Required**: Set `DISABLE_AUTHENTICATION=true` to enable anonymous access
- **Instant API Usage**: All endpoints work without tokens or user accounts
- **Anonymous User**: Automatically returns "anonymous" user with admin privileges
- **Simplified Development**: Focus on AI development, not authentication
- **Production Ready**: Anonymous mode maintains all security and privacy features

### **Anonymous Configuration**
```bash
# Enable anonymous access
DISABLE_AUTHENTICATION=true

# All API endpoints now accessible without authentication
# User automatically set to "anonymous" with full admin rights
```

## 🏗️ Architecture

### Security Layers
- **Authentication Middleware**: JWT token validation and user authorization
- **Rate Limiting**: Intelligent request throttling with threat detection
- **Input Validation**: Comprehensive data sanitization and validation
- **CSRF Protection**: Cross-site request forgery prevention
- **Security Headers**: CORS, HSTS, and other security headers

## 📁 API Modules

### 🔐 **Authentication & Security**
| File | Purpose | Key Features |
|------|---------|--------------|
| `auth.py` | Authentication endpoints | JWT tokens, OAuth2, MFA support |
| `mfa.py` | Multi-factor authentication | TOTP, backup codes, QR generation |
| `security.py` | Security monitoring | Threat detection, audit logging |
| `rate_limiting.py` | Request throttling | Intelligent rate limiting, DDoS protection |

**Anonymous Mode**: When `DISABLE_AUTHENTICATION=true`, all endpoints bypass authentication and return anonymous user with admin privileges.

### 🧠 **Autonomous AI Ecosystem (Phase 5)**
| File | Purpose | Key Features |
|------|---------|--------------|
| `autofl_routes.py` | Autonomous FL engine | FedNAS, FedHPO, concept drift monitoring |
| `marketplace_routes.py` | Economic marketplace | Bounty system, contribution rewards |
| `alliance_routes.py` | Federation networking | Inter-federation communication, alliances |

### 🚀 **Core Federated Learning**
| File | Purpose | Key Features |
|------|---------|--------------|
| `federated_learning.py` | Main FL endpoints | Training, aggregation, client management |
| `advanced_fl.py` | Advanced algorithms | FedProx, FedNova, adaptive strategies |
| `privacy.py` | Privacy-preserving FL | Differential privacy, secure aggregation |

### 📊 **Data & Models**
| File | Purpose | Key Features |
|------|---------|--------------|
| `datasets.py` | Dataset management | Upload, validation, privacy analysis |
| `model_versions.py` | Model versioning | Version tracking, rollback, lineage |
| `metrics.py` | Performance metrics | Real-time monitoring, analytics |

### 🌐 **System & Infrastructure**
| File | Purpose | Key Features |
|------|---------|--------------|
| `system.py` | System management | Health checks, configuration |
| `dashboard.py` | Dashboard APIs | Enterprise analytics, visualizations |
| `websocket.py` | Real-time communication | Live updates, event streaming |
| `health.py` | Health monitoring | Service status, dependency checks |

### 🛡️ **Security & Monitoring**
| File | Purpose | Key Features |
|------|---------|--------------|
| `ids.py` | Intrusion detection | ML-based threat detection |
| `packet_capture.py` | Network monitoring | Traffic analysis, anomaly detection |
| `security_simulation.py` | Red team simulation | Attack simulation, defense testing |
| `system_monitoring.py` | Infrastructure monitoring | Resource usage, performance tracking |

## 🔌 WebSocket Endpoints

### Real-time Communication
```python
# Connection URLs
ws://localhost:8000/ws/dashboard          # Dashboard updates
ws://localhost:8000/ws/training           # Training progress
ws://localhost:8000/ws/security           # Security events
ws://localhost:8000/api/alliance/ws       # Alliance updates
ws://localhost:8000/api/marketplace/ws    # Economic updates
```

### Message Types
- **Training Events**: Round progress, accuracy updates, client status
- **Security Alerts**: Threat detection, intrusion attempts, system alerts
- **Economic Updates**: Contribution scores, reward distributions, bounty updates
- **Alliance Activity**: Federation discovery, alliance proposals, project updates

## 🛡️ Security Implementation

### Authentication Flow
1. **Login Request**: Email/password or OAuth2 provider (when authentication enabled)
2. **MFA Challenge**: TOTP token verification (if enabled)
3. **JWT Generation**: Signed token with user claims and permissions
4. **Token Validation**: Middleware validates tokens on protected routes

### Anonymous Mode Flow
1. **Anonymous Access**: When `DISABLE_AUTHENTICATION=true`
2. **User Injection**: Automatically returns "anonymous" user with admin privileges
3. **Full Access**: All endpoints accessible without authentication
4. **Security Maintained**: All other security features remain active

### Rate Limiting Strategy
```python
# Rate limit configuration
RATE_LIMITS = {
    "auth": "5/minute",           # Authentication attempts
    "training": "100/hour",       # Training operations
    "data_upload": "10/hour",     # Dataset uploads
    "admin": "1000/hour",         # Admin operations
}
```

### Input Validation
- **Pydantic Models**: Strong typing and validation for all inputs
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **XSS Protection**: Input sanitization and output encoding
- **File Upload Security**: Type validation, size limits, virus scanning

## 📈 Performance Optimizations

### Caching Strategy
- **Redis Cache**: Frequently accessed data with TTL
- **Application Cache**: In-memory caching for expensive operations
- **Database Optimization**: Query optimization and indexing
- **CDN Integration**: Static asset delivery optimization

### Async Operations
- **Background Tasks**: Non-blocking operations with Celery
- **Database Pooling**: Connection pooling for database efficiency
- **Streaming Responses**: Large data transfer optimization
- **WebSocket Management**: Efficient real-time communication

## 🔧 API Usage Examples

### Autonomous Training
```python
# Start autonomous federated learning
POST /api/autonomous/start
{
    "optimization_strategy": "fednas_and_fedhpo",
    "concept_drift_monitoring": true,
    "auto_retraining": true,
    "target_accuracy": 0.95
}
```

### Economic Marketplace
```python
# Create data bounty
POST /api/marketplace/bounties
{
    "title": "Medical Image Classification Dataset",
    "reward_amount": 1000,
    "requirements": {
        "data_type": "medical_images",
        "min_samples": 10000,
        "privacy_level": "differential_privacy"
    }
}
```

### Alliance Formation
```python
# Propose federation alliance
POST /api/alliance/alliances/propose
{
    "target_federation_id": "healthcare_consortium",
    "alliance_name": "Global Health AI Alliance",
    "governance_rules": {
        "decision_making": "consensus",
        "privacy_requirements": {"differential_privacy": true}
    }
}
```

## 📊 Monitoring & Analytics

### Metrics Collection
- **Request Metrics**: Response times, error rates, throughput
- **Business Metrics**: Training accuracy, client participation, economic activity
- **Security Metrics**: Threat detection, authentication failures, suspicious activity
- **System Metrics**: CPU usage, memory consumption, database performance

### Health Checks
```python
GET /health
{
    "status": "healthy",
    "timestamp": "2025-09-03T19:45:00Z",
    "services": {
        "database": "healthy",
        "redis": "healthy",
        "autonomous_engine": "healthy",
        "marketplace": "healthy",
        "alliance_network": "healthy"
    },
    "metrics": {
        "active_clients": 156,
        "training_rounds": 42,
        "alliances": 8,
        "bounties": 23
    }
}
```

## 🚀 Deployment Configuration

### Environment Variables
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# Security
JWT_SECRET_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
MFA_ISSUER=AgisFL

# Database
DATABASE_URL=sqlite:///agisfl.db
REDIS_URL=redis://localhost:6379

# Autonomous Features
AUTOFL_ENABLED=true
MARKETPLACE_ENABLED=true
ALLIANCE_ENABLED=true
```

### Production Considerations
- **Load Balancing**: Multiple API instances behind load balancer
- **SSL/TLS**: HTTPS termination with valid certificates
- **Database Scaling**: Read replicas and connection pooling
- **Monitoring**: Comprehensive logging and alerting
- **Backup Strategy**: Regular database and configuration backups

## 🔄 API Versioning

### Version Strategy
- **URL Versioning**: `/api/v1/`, `/api/v2/` for major changes
- **Header Versioning**: `API-Version: 1.0` for minor changes
- **Backward Compatibility**: Maintain compatibility for at least 2 versions
- **Deprecation Notice**: 6-month notice for deprecated endpoints

### Current Versions
- **v1.0**: Core federated learning APIs
- **v2.0**: Advanced FL algorithms and privacy features
- **v3.0**: Enterprise security and compliance features
- **v5.0**: Autonomous AI ecosystem (current)

---

*AgisFL API Layer - Part of the World's First Autonomous Federated Learning Ecosystem*  
*Last Updated: September 3, 2025*

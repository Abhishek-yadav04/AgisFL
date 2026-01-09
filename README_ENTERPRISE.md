# AgisFL Enterprise Platform v4.0.0

## 🚀 Enterprise-Grade Federated Learning & Security Intelligence Platform

AgisFL Enterprise is a world-class federated learning platform designed for enterprise environments with advanced security, monitoring, and compliance features.

## 🏗️ Architecture Overview

### Backend Structure (Enterprise-Organized)

```
backend/
├── api/                    # API endpoints (REST)
│   ├── enterprise_dashboard.py    # Dashboard metrics & analytics
│   ├── enterprise_security.py     # Security monitoring
│   ├── enterprise_fl.py           # Federated learning
│   └── enterprise_datasets.py     # Dataset management
├── services/               # Business logic layer
│   └── dashboard_service.py       # Dashboard business logic
├── core/                   # Core system components
│   ├── enterprise_database.py     # Database management
│   ├── enterprise_security.py     # Security engine
│   ├── enterprise_auth.py         # Authentication & RBAC
│   └── enterprise_monitoring.py   # Monitoring & observability
├── schemas/                # Pydantic models for validation
│   └── dashboard_schemas.py       # API request/response schemas
├── middleware/             # Custom middleware
├── repositories/           # Data access layer
├── exceptions/             # Custom exceptions
├── config/                 # Configuration management
└── utils/                  # Utility functions
```

### Frontend Structure (Modern React)

```
frontend/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── stores/            # State management (Zustand)
│   ├── services/          # API services
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── assets/            # Static assets
├── public/                # Public assets
└── dist/                  # Production build output
```

## 🌟 Enterprise Features

### 🔒 Security & Compliance
- **Multi-Factor Authentication (MFA)** with TOTP support
- **Role-Based Access Control (RBAC)** with granular permissions
- **Advanced Threat Detection** with real-time monitoring
- **Comprehensive Audit Logging** for compliance
- **Data Encryption** at rest and in transit
- **Security Headers** and CORS protection
- **Rate Limiting** with advanced algorithms

### 🔓 Anonymous Access Mode
- **Zero-Friction Deployment** - No authentication required when `DISABLE_AUTHENTICATION=true`
- **Instant Platform Access** - All endpoints work without login or user accounts
- **Anonymous User** - Automatically returns "anonymous" user with admin privileges
- **Simplified Operations** - Focus on AI development, not user management
- **Production Ready** - Anonymous mode maintains all security and privacy features

### 📊 Monitoring & Observability
- **Real-time Metrics** with WebSocket updates
- **Prometheus Integration** for metrics collection
- **Distributed Tracing** with Jaeger support
- **Health Checks** for Kubernetes deployment
- **Performance Monitoring** with detailed analytics
- **Alert Management** with notification system

### 🤖 Federated Learning
- **Multi-Algorithm Support** (FedAvg, FedProx, etc.)
- **Client Management** with capability tracking
- **Experiment Tracking** with versioning
- **Model Checkpointing** and rollback
- **Privacy-Preserving** techniques
- **Scalable Architecture** for enterprise workloads

### 💾 Data Management
- **Hybrid Database Support** (PostgreSQL + MongoDB)
- **Connection Pooling** for high performance
- **Data Validation** with Pydantic schemas
- **Backup & Recovery** mechanisms
- **Data Encryption** with key management

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 13+ (optional, SQLite fallback)
- Redis 6+ (optional, in-memory fallback)

### Development Setup

1. **Clone and Navigate**
   ```bash
   cd AgisFL-testing
   ```

2. **Start Development Environment**
   ```bash
   # Windows
   start_development.bat
   
   # Manual start
   # Terminal 1: Backend
   cd backend && python start.py
   
   # Terminal 2: Frontend
   cd frontend && npm install && npm run dev
   ```

3. **Access the Platform**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Deployment

1. **Build Frontend**
   ```bash
   # Windows
   build_frontend.bat
   
   # Manual
   cd frontend && npm install && npm run build
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your production settings
   ```

3. **Start Production Server**
   ```bash
   cd backend && python main.py
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Application
ENVIRONMENT=production
DEBUG=false
HOST=0.0.0.0
PORT=8000

# Database
DATABASE_URL=postgresql://user:pass@localhost/agisfl
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET_KEY=your-secret-key
JWT_EXPIRATION=3600
ENCRYPTION_KEY=your-encryption-key

# Monitoring
ENABLE_PROMETHEUS=true
ENABLE_JAEGER=true
LOG_LEVEL=info

# CORS
CORS_ORIGINS=["https://yourdomain.com"]
```

### Database Setup

```bash
# PostgreSQL (Recommended for production)
createdb agisfl_enterprise
psql agisfl_enterprise < schema.sql

# MongoDB (Optional for document storage)
mongosh --eval "db.createCollection('fl_experiments')"
```

## 📊 API Documentation

### Dashboard Endpoints

```http
GET /api/dashboard/overview          # Complete dashboard data
GET /api/dashboard/metrics           # Key metrics only
GET /api/dashboard/health            # System health status
GET /api/dashboard/realtime          # Real-time updates
GET /api/dashboard/charts/{type}     # Chart data
```

### Authentication Endpoints

```http
POST /api/auth/login                 # User login with MFA
POST /api/auth/logout                # User logout
GET  /api/auth/me                    # Current user info
POST /api/auth/refresh               # Token refresh
```

### Security Endpoints

```http
GET /api/security/status             # Security dashboard
GET /api/security/events             # Security events
GET /api/security/threats            # Threat analysis
```

## 🔐 Default Credentials

**Admin User:**
- Username: `admin`
- Password: `AgisFL@2024!`
- Role: `super_admin`

*Change these credentials immediately in production!*

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.enterprise.yml up -d

# Scale services
docker-compose -f docker-compose.enterprise.yml up -d --scale backend=3
```

## ☸️ Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods -n agisfl-enterprise
```

## 📈 Monitoring & Alerts

### Prometheus Metrics
- System resource usage (CPU, memory, disk)
- Application performance metrics
- Business metrics (users, experiments, etc.)
- Security event counters

### Health Checks
- `/health` - Comprehensive health check
- `/healthz` - Kubernetes liveness probe
- `/readyz` - Kubernetes readiness probe

### Logging
- Structured JSON logging
- Request/response tracing
- Security event logging
- Performance metrics

## 🛡️ Security Best Practices

1. **Change Default Credentials**
2. **Enable HTTPS** in production
3. **Configure Firewall** rules
4. **Regular Security Updates**
5. **Monitor Security Events**
6. **Backup Encryption Keys**
7. **Implement Network Segmentation**

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   systemctl status postgresql
   # Verify connection string in .env
   ```

2. **Frontend Build Errors**
   ```bash
   # Clear node modules and reinstall
   cd frontend && rm -rf node_modules && npm install
   ```

3. **WebSocket Connection Issues**
   ```bash
   # Check proxy configuration in vite.config.ts
   # Verify CORS settings in backend
   ```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX CONCURRENTLY idx_security_events_created_at 
   ON security_events(created_at);
   ```

2. **Redis Caching**
   ```bash
   # Enable Redis for better performance
   REDIS_URL=redis://localhost:6379
   ```

3. **Connection Pooling**
   ```python
   # Adjust pool settings in config
   DATABASE_POOL_SIZE=20
   DATABASE_MAX_OVERFLOW=30
   ```

## 📚 Additional Resources

- [API Documentation](http://localhost:8000/docs)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Security Guide](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Support

For enterprise support and consulting:
- Email: support@agisfl.com
- Documentation: https://docs.agisfl.com
- Issues: GitHub Issues

## 📄 License

AgisFL Enterprise License - See LICENSE file for details.

---

**AgisFL Enterprise v4.0.0** - Built for the future of federated learning.
# ⚙️ AgisFL Configuration Management

## 📖 Overview

The config module provides comprehensive configuration management for AgisFL's enterprise federated learning platform. It handles environment-specific settings, security configurations, database connections, and deployment parameters across different environments (development, staging, production).

## 🏗️ Configuration Architecture

### Configuration Hierarchy
```
Environment Variables (.env)
    ↓
Configuration Files (.yaml/.json)
    ↓
Python Configuration Classes
    ↓
Runtime Configuration Validation
    ↓
Application Configuration
```

### Multi-Environment Support
- **Development**: Local development with simplified security
- **Staging**: Production-like environment for testing
- **Production**: Full enterprise security and monitoring
- **Enterprise**: Advanced features with compliance requirements

## 📁 Configuration Files

### 🏢 **enterprise_config.py** (379 lines)
**Purpose**: Enterprise-grade configuration management with advanced features

**Key Components**:
- **DatabaseConfig**: Multi-database configuration with MongoDB Atlas and SQLite fallback
- **SecurityConfig**: Enterprise security settings with MFA and encryption
- **MonitoringConfig**: Comprehensive monitoring and alerting configuration
- **PerformanceConfig**: Optimization settings for enterprise workloads

**Enterprise Features**:
```python
# Enterprise configuration with MongoDB Atlas
enterprise_config = EnterpriseConfig(
    database=DatabaseConfig(
        mongodb_url="mongodb+srv://cluster.mongodb.net/agisfl_enterprise",
        max_pool_size=100,
        encryption_at_rest=True
    ),
    security=SecurityConfig(
        mfa_enabled=True,
        audit_logging="comprehensive",
        encryption_level="AES-256"
    ),
    monitoring=MonitoringConfig(
        metrics_retention="90d",
        alert_channels=["email", "slack", "webhook"],
        sla_monitoring=True
    )
)
```

### 🔒 **security_config.py**
**Purpose**: Comprehensive security configuration management

**Security Domains**:
- **Authentication**: JWT, OAuth2, MFA configuration
- **Encryption**: Data-at-rest and in-transit encryption settings
- **Privacy**: Differential privacy and secure aggregation parameters
- **Audit**: Logging and compliance configuration

### 🚀 **production_config.py**
**Purpose**: Production-optimized configuration settings

**Production Features**:
- **Performance Tuning**: Optimized for high-throughput operations
- **Resource Management**: Memory and CPU allocation strategies
- **Load Balancing**: Multi-instance deployment configuration
- **Backup & Recovery**: Automated backup and disaster recovery settings

### 🔄 **fallback_config.py**
**Purpose**: Fallback configuration for degraded operations

**Fallback Scenarios**:
- **Database Unavailable**: SQLite fallback when MongoDB is unreachable
- **Cache Unavailable**: In-memory caching when Redis is down
- **Security Service Down**: Basic authentication when advanced auth fails
- **Monitoring Unavailable**: Local logging when external monitoring fails

### 🧪 **simple_config.py**
**Purpose**: Simplified configuration for development and testing

## 📄 Configuration File Types

### 🔑 **Environment Files**

#### **.env** (Main environment configuration)
```bash
# Application Settings
APP_NAME=AgisFL Enterprise
APP_VERSION=5.0.0
DEBUG=false
LOG_LEVEL=INFO

# Database Configuration
DATABASE_URL=mongodb+srv://cluster.mongodb.net/agisfl_enterprise
REDIS_URL=redis://localhost:6379/0
SQLITE_PATH=./agisfl_enterprise.db

# Security Settings
JWT_SECRET_KEY=your-super-secret-jwt-key
ENCRYPTION_KEY=your-256-bit-encryption-key
MFA_ISSUER=AgisFL Enterprise
TOTP_SECRET_LENGTH=32

# Autonomous Features (Phase 5)
AUTOFL_ENABLED=true
MARKETPLACE_ENABLED=true
ALLIANCE_ENABLED=true
IFCP_ENABLED=true

# Economic Configuration
TOKENOMICS_ENABLED=true
INITIAL_TOKEN_SUPPLY=1000000
REWARD_DISTRIBUTION_FREQUENCY=hourly
CONTRIBUTION_ALGORITHM=marginal_accuracy

# Monitoring & Analytics
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true
METRICS_RETENTION=90d
ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# Enterprise Features
ENTERPRISE_MODE=true
COMPLIANCE_MODE=SOC2_TYPE2
AUDIT_RETENTION=7y
BACKUP_FREQUENCY=6h
```

#### **.env.example** (Template for environment setup)
```bash
# Copy this file to .env and update with your values

# Required: Database connection
DATABASE_URL=your-database-connection-string

# Required: Security keys (generate new ones for production)
JWT_SECRET_KEY=generate-a-strong-jwt-secret
ENCRYPTION_KEY=generate-a-256-bit-encryption-key

# Optional: External service integrations
SLACK_WEBHOOK_URL=your-slack-webhook-for-alerts
EMAIL_SMTP_URL=your-smtp-server-configuration
```

### 📋 **Requirements Files**

#### **requirements.txt** (Complete dependency list)
- Full production dependencies
- All optional features included
- Version pinning for reproducibility

#### **requirements-core.txt** (Core dependencies only)
- Minimal federated learning functionality
- Essential security features
- Basic monitoring capabilities

#### **requirements-minimal.txt** (Lightweight deployment)
- Absolute minimum dependencies
- Suitable for resource-constrained environments
- Core FL functionality only

#### **requirements-standalone.txt** (Self-contained deployment)
- Includes embedded database
- No external service dependencies
- Suitable for isolated environments

#### **requirements_enterprise.txt** (Enterprise features)
- Advanced monitoring and analytics
- Enterprise security features
- Compliance and audit capabilities

### 🛠️ **Build Configuration**

#### **pyproject.toml** (Modern Python packaging)
```toml
[project]
name = "agisfl-enterprise"
version = "5.0.0"
description = "World's First Autonomous Federated Learning Ecosystem"
authors = [
    {name = "AgisFL Team", email = "enterprise@agisfl.com"}
]
dependencies = [
    "fastapi>=0.104.0",
    "torch>=2.0.0",
    "numpy>=1.24.0",
    "pydantic>=2.4.0",
]

[project.optional-dependencies]
enterprise = [
    "prometheus-client",
    "grafana-api",
    "pymongo[srv]",
    "redis[hiredis]",
]
autonomous = [
    "optuna",
    "hyperopt",
    "scipy",
    "scikit-learn",
]
security = [
    "cryptography",
    "pyjwt[crypto]",
    "passlib[bcrypt]",
    "python-multipart",
]

[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"
```

## 🔧 Configuration Management

### Environment Detection
```python
# Automatic environment detection
def detect_environment():
    if os.getenv("KUBERNETES_SERVICE_HOST"):
        return "kubernetes"
    elif os.getenv("DOCKER_CONTAINER"):
        return "docker"
    elif os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        return "lambda"
    elif os.getenv("DEBUG") == "true":
        return "development"
    else:
        return "production"

# Load appropriate configuration
config = load_config_for_environment(detect_environment())
```

### Configuration Validation
```python
# Pydantic-based configuration validation
class AgisFlConfig(BaseSettings):
    app_name: str = Field(..., description="Application name")
    debug: bool = Field(False, description="Debug mode")
    jwt_secret_key: str = Field(..., min_length=32, description="JWT secret key")
    database_url: str = Field(..., description="Database connection URL")
    
    @field_validator('jwt_secret_key')
    def validate_jwt_secret(cls, v):
        if len(v) < 32:
            raise ValueError('JWT secret key must be at least 32 characters')
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
```

### Dynamic Configuration Updates
```python
# Runtime configuration updates
config_manager = ConfigurationManager()

# Update configuration without restart
await config_manager.update_config(
    section="security",
    updates={
        "rate_limit_requests": 1000,
        "authentication_timeout": 3600
    }
)

# Configuration change notifications
config_manager.on_change(
    callback=restart_affected_services,
    sections=["database", "security"]
)
```

## 🛡️ Security Configuration

### Encryption Settings
```python
# Comprehensive encryption configuration
encryption_config = {
    "data_at_rest": {
        "algorithm": "AES-256-GCM",
        "key_rotation_interval": "30d",
        "backup_encryption": True
    },
    "data_in_transit": {
        "tls_version": "1.3",
        "cipher_suites": ["TLS_AES_256_GCM_SHA384"],
        "certificate_validation": "strict"
    },
    "differential_privacy": {
        "default_epsilon": 1.0,
        "auto_budget_management": True,
        "privacy_accounting": "advanced"
    }
}
```

### Authentication Configuration
```python
# Multi-factor authentication setup
auth_config = {
    "jwt": {
        "algorithm": "HS256",
        "expiration": 3600,
        "refresh_enabled": True
    },
    "mfa": {
        "enabled": True,
        "issuer": "AgisFL Enterprise",
        "totp_window": 1,
        "backup_codes": 10
    },
    "oauth2": {
        "providers": ["google", "microsoft", "okta"],
        "scope_mapping": {
            "admin": ["read", "write", "admin"],
            "researcher": ["read", "experiment"],
            "client": ["read", "participate"]
        }
    }
}
```

## 📊 Monitoring Configuration

### Metrics and Alerting
```python
# Comprehensive monitoring setup
monitoring_config = {
    "metrics": {
        "collection_interval": 30,  # seconds
        "retention_period": "90d",
        "high_cardinality_limit": 10000
    },
    "alerts": {
        "accuracy_drop_threshold": 0.05,
        "client_failure_threshold": 0.1,
        "response_time_threshold": 1000,  # ms
        "error_rate_threshold": 0.01
    },
    "dashboards": {
        "refresh_interval": 30,
        "auto_refresh": True,
        "export_format": ["png", "pdf", "json"]
    }
}
```

### Performance Tuning
```python
# Performance optimization configuration
performance_config = {
    "database": {
        "connection_pool_size": 100,
        "query_timeout": 30,
        "cache_size": "1GB",
        "index_optimization": True
    },
    "caching": {
        "default_ttl": 3600,
        "max_memory": "2GB",
        "eviction_policy": "LRU",
        "compression": True
    },
    "networking": {
        "connection_timeout": 30,
        "read_timeout": 60,
        "max_connections": 1000,
        "keep_alive": True
    }
}
```

## 🚀 Deployment Configuration

### Container Configuration
```dockerfile
# Multi-stage production build
FROM python:3.11-slim as base
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Configure environment
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production
ENV LOG_LEVEL=INFO

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["python", "main.py"]
```

### Kubernetes Configuration
```yaml
# Production deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agisfl-enterprise
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agisfl-enterprise
  template:
    spec:
      containers:
      - name: agisfl
        image: agisfl/enterprise:5.0.0
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: agisfl-secrets
              key: database-url
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: agisfl-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## 🔄 Configuration Best Practices

### Security Best Practices
1. **Never commit secrets**: Use environment variables or secret management
2. **Rotate keys regularly**: Implement automated key rotation
3. **Principle of least privilege**: Grant minimal required permissions
4. **Encrypt sensitive data**: Use encryption for all sensitive configuration

### Performance Best Practices
1. **Environment-specific tuning**: Optimize for each deployment environment
2. **Resource monitoring**: Track resource usage and adjust accordingly
3. **Cache configuration**: Optimize caching strategies for workload patterns
4. **Connection pooling**: Configure appropriate pool sizes for databases

### Operational Best Practices
1. **Configuration validation**: Validate all configuration at startup
2. **Graceful degradation**: Implement fallback configurations
3. **Change management**: Version control all configuration changes
4. **Documentation**: Maintain comprehensive configuration documentation

---

*AgisFL Configuration Management - Enterprise-Grade • Secure • Scalable*  
*Supporting the World's First Autonomous Federated Learning Ecosystem*  
*Last Updated: September 3, 2025*

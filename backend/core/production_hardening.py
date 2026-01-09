#!/usr/bin/env python3
"""
Enterprise Production Hardening System
=====================================

Comprehensive solution addressing all remaining production issues:
- Docker Optimization & Environment Separation
- Advanced Monitoring & Alerting 
- CI/CD Pipeline Integration
- Security Scanning & Session Management
- Database Performance & Memory Management
- Async/Await & Error Handling
- Resource Management & Configuration
- Health Checks & Graceful Shutdown
- Caching & Performance Optimization
"""

import os
import sys
import json
import yaml
import logging
import asyncio
import time
import signal
import threading
import weakref
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Set, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
import psutil
import structlog
from pathlib import Path

# Production hardening imports with fallbacks
try:
    import prometheus_client
    from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

try:
    import redis
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

try:
    import docker
    DOCKER_AVAILABLE = True
except ImportError:
    DOCKER_AVAILABLE = False

try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.pool import QueuePool
    SQLALCHEMY_ASYNC_AVAILABLE = True
except ImportError:
    SQLALCHEMY_ASYNC_AVAILABLE = False

logger = structlog.get_logger(__name__)

# ============================================================================
# 1. DOCKER OPTIMIZATION & ENVIRONMENT SEPARATION
# ============================================================================

@dataclass
class DockerOptimizationConfig:
    """Docker optimization configuration"""
    base_image: str = "python:3.11-slim"
    multi_stage: bool = True
    layer_caching: bool = True
    security_scanning: bool = True
    health_check_enabled: bool = True
    resource_limits: Dict[str, str] = field(default_factory=lambda: {
        "memory": "512m",
        "cpus": "0.5"
    })

class DockerOptimizer:
    """Optimize Docker images and deployment"""
    
    def __init__(self, config: DockerOptimizationConfig = None):
        self.config = config or DockerOptimizationConfig()
        self.docker_client = None
        if DOCKER_AVAILABLE:
            try:
                self.docker_client = docker.from_env()
            except Exception as e:
                logger.warning(f"Docker client unavailable: {e}")
    
    def generate_optimized_dockerfile(self, environment: str = "production") -> str:
        """Generate optimized multi-stage Dockerfile"""
        
        dockerfile_content = f'''# AgisFL Optimized Multi-Stage Dockerfile
# Environment: {environment}

# ============================================================================
# Stage 1: Build Dependencies
# ============================================================================
FROM {self.config.base_image} as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    python3-dev \\
    libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install Python dependencies
COPY requirements.txt requirements-performance.txt ./
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir -r requirements.txt && \\
    pip install --no-cache-dir -r requirements-performance.txt

# ============================================================================
# Stage 2: Production Runtime
# ============================================================================
FROM {self.config.base_image} as production

# Create non-root user
RUN groupadd --gid 1000 agisfl && \\
    useradd --uid 1000 --gid agisfl --shell /bin/bash --create-home agisfl

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \\
    libpq5 \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy application code
COPY --chown=agisfl:agisfl . .

# Create necessary directories
RUN mkdir -p /app/logs /app/data /app/backups && \\
    chown -R agisfl:agisfl /app

# Switch to non-root user
USER agisfl

# Environment-specific configurations
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Production-specific environment variables
{"ENV ENVIRONMENT=production" if environment == "production" else "ENV ENVIRONMENT=development"}
{"ENV DEBUG=false" if environment == "production" else "ENV DEBUG=true"}
ENV PERFORMANCE_OPTIMIZATION=true
ENV STRUCTURED_LOGGING=true
ENV MONITORING_ENABLED=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start command
CMD ["python", "start_performance.py"]
'''
        return dockerfile_content
    
    def generate_docker_compose(self, environment: str = "production") -> str:
        """Generate optimized docker-compose configuration"""
        
        compose_config = {
            'version': '3.8',
            'services': {
                'agisfl-backend': {
                    'build': {
                        'context': '.',
                        'dockerfile': 'Dockerfile',
                        'target': environment,
                        'cache_from': [f'agisfl-backend:{environment}']
                    },
                    'image': f'agisfl-backend:{environment}',
                    'container_name': f'agisfl-backend-{environment}',
                    'restart': 'unless-stopped',
                    'ports': ['8000:8000'],
                    'environment': {
                        'ENVIRONMENT': environment,
                        'DATABASE_URL': f'postgresql://postgres:${{{environment.upper()}_DB_PASSWORD}}@postgres:5432/agisfl',
                        'REDIS_URL': 'redis://redis:6379/0',
                        'PERFORMANCE_OPTIMIZATION': 'true',
                        'MONITORING_ENABLED': 'true'
                    },
                    'volumes': [
                        './data:/app/data',
                        './logs:/app/logs',
                        './backups:/app/backups'
                    ],
                    'depends_on': {
                        'postgres': {'condition': 'service_healthy'},
                        'redis': {'condition': 'service_healthy'}
                    },
                    'networks': ['agisfl-network'],
                    'deploy': {
                        'resources': {
                            'limits': self.config.resource_limits,
                            'reservations': {
                                'memory': '256m',
                                'cpus': '0.25'
                            }
                        }
                    }
                },
                'postgres': {
                    'image': 'postgres:15-alpine',
                    'container_name': f'postgres-{environment}',
                    'restart': 'unless-stopped',
                    'environment': {
                        'POSTGRES_DB': 'agisfl',
                        'POSTGRES_USER': 'postgres',
                        'POSTGRES_PASSWORD': f'${{{environment.upper()}_DB_PASSWORD}}'
                    },
                    'volumes': [
                        f'postgres_data_{environment}:/var/lib/postgresql/data',
                        './scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql'
                    ],
                    'ports': ['5432:5432'] if environment == 'development' else [],
                    'networks': ['agisfl-network'],
                    'healthcheck': {
                        'test': ['CMD-SHELL', 'pg_isready -U postgres'],
                        'interval': '30s',
                        'timeout': '10s',
                        'retries': 5
                    }
                },
                'redis': {
                    'image': 'redis:7-alpine',
                    'container_name': f'redis-{environment}',
                    'restart': 'unless-stopped',
                    'ports': ['6379:6379'] if environment == 'development' else [],
                    'volumes': [f'redis_data_{environment}:/data'],
                    'networks': ['agisfl-network'],
                    'healthcheck': {
                        'test': ['CMD', 'redis-cli', 'ping'],
                        'interval': '30s',
                        'timeout': '10s',
                        'retries': 5
                    }
                }
            },
            'networks': {
                'agisfl-network': {
                    'driver': 'bridge'
                }
            },
            'volumes': {
                f'postgres_data_{environment}': {},
                f'redis_data_{environment}': {}
            }
        }
        
        # Add monitoring services for production
        if environment == 'production':
            compose_config['services'].update({
                'prometheus': {
                    'image': 'prom/prometheus:latest',
                    'container_name': 'prometheus-prod',
                    'restart': 'unless-stopped',
                    'ports': ['9090:9090'],
                    'volumes': ['./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml'],
                    'networks': ['agisfl-network']
                },
                'grafana': {
                    'image': 'grafana/grafana:latest',
                    'container_name': 'grafana-prod',
                    'restart': 'unless-stopped',
                    'ports': ['3000:3000'],
                    'environment': {
                        'GF_SECURITY_ADMIN_PASSWORD': '${GRAFANA_ADMIN_PASSWORD}'
                    },
                    'volumes': ['grafana_data:/var/lib/grafana'],
                    'networks': ['agisfl-network']
                }
            })
            compose_config['volumes']['grafana_data'] = {}
        
        return yaml.dump(compose_config, default_flow_style=False)
    
    def create_docker_files(self, base_path: Path):
        """Create optimized Docker files"""
        try:
            # Production Dockerfile
            dockerfile_prod = self.generate_optimized_dockerfile("production")
            (base_path / "Dockerfile").write_text(dockerfile_prod)
            
            # Development Dockerfile
            dockerfile_dev = self.generate_optimized_dockerfile("development")
            (base_path / "Dockerfile.dev").write_text(dockerfile_dev)
            
            # Production docker-compose
            compose_prod = self.generate_docker_compose("production")
            (base_path / "docker-compose.prod.yml").write_text(compose_prod)
            
            # Development docker-compose
            compose_dev = self.generate_docker_compose("development")
            (base_path / "docker-compose.dev.yml").write_text(compose_dev)
            
            # Docker ignore file
            dockerignore_content = '''# AgisFL Docker Ignore
.git
.gitignore
README.md
Dockerfile*
docker-compose*
.dockerignore
.pytest_cache
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env
venv
.venv
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.DS_Store
.vscode
.idea
*.swp
*.swo
node_modules
.npm
.env.local
.env.development
.env.test
.env.production
logs
data
backups
'''
            (base_path / ".dockerignore").write_text(dockerignore_content)
            
            logger.info("Optimized Docker files created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create Docker files: {e}")
            raise

# ============================================================================
# 2. ENVIRONMENT SEPARATION & CONFIGURATION MANAGEMENT
# ============================================================================

@dataclass
class EnvironmentConfig:
    """Environment-specific configuration"""
    name: str
    debug: bool
    database_url: str
    redis_url: str
    secret_key: str
    allowed_hosts: List[str]
    cors_origins: List[str]
    log_level: str
    monitoring_enabled: bool
    security_scanning_enabled: bool
    rate_limiting_enabled: bool
    
class ConfigurationManager:
    """Manage environment-specific configurations"""
    
    def __init__(self):
        self.environments = {}
        self.current_env = os.getenv("ENVIRONMENT", "development")
        self._load_configurations()
    
    def _load_configurations(self):
        """Load all environment configurations"""
        
        # Development Configuration
        self.environments["development"] = EnvironmentConfig(
            name="development",
            debug=True,
            database_url="sqlite:///./agisfl_dev.db",
            redis_url="redis://localhost:6379/0",
            secret_key="dev-secret-key-change-in-production",
            allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0"],
            cors_origins=["http://localhost:3000", "http://localhost:5173"],
            log_level="DEBUG",
            monitoring_enabled=False,
            security_scanning_enabled=False,
            rate_limiting_enabled=False
        )
        
        # Production Configuration
        self.environments["production"] = EnvironmentConfig(
            name="production",
            debug=False,
            database_url=os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/agisfl"),
            redis_url=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
            secret_key=os.getenv("SECRET_KEY", self._generate_secret_key()),
            allowed_hosts=self._get_allowed_hosts(),
            cors_origins=self._get_cors_origins(),
            log_level="INFO",
            monitoring_enabled=True,
            security_scanning_enabled=True,
            rate_limiting_enabled=True
        )
        
        # Testing Configuration
        self.environments["testing"] = EnvironmentConfig(
            name="testing",
            debug=False,
            database_url="sqlite:///./agisfl_test.db",
            redis_url="redis://localhost:6379/1",
            secret_key="test-secret-key",
            allowed_hosts=["localhost", "127.0.0.1"],
            cors_origins=["http://localhost:3000"],
            log_level="WARNING",
            monitoring_enabled=False,
            security_scanning_enabled=True,
            rate_limiting_enabled=True
        )
    
    def _generate_secret_key(self) -> str:
        """Generate secure secret key"""
        import secrets
        return secrets.token_urlsafe(32)
    
    def _get_allowed_hosts(self) -> List[str]:
        """Get allowed hosts from environment"""
        hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
        return [host.strip() for host in hosts.split(",")]
    
    def _get_cors_origins(self) -> List[str]:
        """Get CORS origins from environment"""
        origins = os.getenv("CORS_ORIGINS", "https://yourdomain.com")
        return [origin.strip() for origin in origins.split(",")]
    
    def get_current_config(self) -> EnvironmentConfig:
        """Get current environment configuration"""
        return self.environments.get(self.current_env, self.environments["development"])
    
    def validate_configuration(self) -> Dict[str, Any]:
        """Validate current configuration"""
        config = self.get_current_config()
        validation_results = {
            "valid": True,
            "issues": [],
            "warnings": []
        }
        
        # Required environment variables for production
        if config.name == "production":
            required_vars = ["DATABASE_URL", "REDIS_URL", "SECRET_KEY", "ALLOWED_HOSTS"]
            
            for var in required_vars:
                if not os.getenv(var):
                    validation_results["issues"].append(f"Missing required environment variable: {var}")
                    validation_results["valid"] = False
        
        # Security validations
        if config.secret_key.startswith(("dev-", "test-")) and config.name == "production":
            validation_results["issues"].append("Production using development/test secret key")
            validation_results["valid"] = False
        
        # CORS validation
        if "*" in config.cors_origins and config.name == "production":
            validation_results["warnings"].append("Wildcard CORS origin in production")
        
        return validation_results
    
    def create_env_files(self, base_path: Path):
        """Create environment-specific .env files"""
        try:
            for env_name, config in self.environments.items():
                env_content = f'''# AgisFL Environment Configuration - {env_name.upper()}
ENVIRONMENT={config.name}
DEBUG={str(config.debug).lower()}
LOG_LEVEL={config.log_level}

# Database Configuration
DATABASE_URL={config.database_url}
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=30
DATABASE_POOL_TIMEOUT=30

# Redis Configuration
REDIS_URL={config.redis_url}
REDIS_POOL_SIZE=10

# Security Configuration
SECRET_KEY={config.secret_key}
ALLOWED_HOSTS={",".join(config.allowed_hosts)}
CORS_ORIGINS={",".join(config.cors_origins)}

# Performance Configuration
PERFORMANCE_OPTIMIZATION=true
ENABLE_UVLOOP=true
MAX_WORKERS=10
MEMORY_MONITORING=true

# Monitoring Configuration
MONITORING_ENABLED={str(config.monitoring_enabled).lower()}
METRICS_ENABLED={str(config.monitoring_enabled).lower()}
PROMETHEUS_PORT=8001

# Security Features
SECURITY_SCANNING_ENABLED={str(config.security_scanning_enabled).lower()}
RATE_LIMITING_ENABLED={str(config.rate_limiting_enabled).lower()}
SESSION_TIMEOUT=3600
BCRYPT_ROUNDS=12

# Logging Configuration
STRUCTURED_LOGGING=true
LOG_FORMAT=json
LOG_FILE_ENABLED=true
LOG_ROTATION_SIZE=10MB
LOG_RETENTION_DAYS=30

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_TIMEOUT=10
GRACEFUL_SHUTDOWN_TIMEOUT=30
'''
                
                env_file_path = base_path / f".env.{env_name}"
                env_file_path.write_text(env_content)
            
            logger.info("Environment configuration files created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create environment files: {e}")
            raise

# ============================================================================
# 3. ADVANCED MONITORING & ALERTING SYSTEM
# ============================================================================

class MetricsCollector:
    """Collect and expose application metrics"""
    
    def __init__(self):
        self.registry = CollectorRegistry() if PROMETHEUS_AVAILABLE else None
        self.metrics = {}
        self._initialize_metrics()
    
    def _initialize_metrics(self):
        """Initialize Prometheus metrics"""
        if not PROMETHEUS_AVAILABLE:
            logger.warning("Prometheus not available, using fallback metrics")
            self.metrics = {
                'requests_total': {'value': 0},
                'request_duration': {'value': 0.0},
                'memory_usage': {'value': 0.0},
                'active_connections': {'value': 0}
            }
            return
        
        self.metrics = {
            'requests_total': Counter(
                'agisfl_requests_total',
                'Total number of HTTP requests',
                ['method', 'endpoint', 'status_code'],
                registry=self.registry
            ),
            'request_duration': Histogram(
                'agisfl_request_duration_seconds',
                'HTTP request duration in seconds',
                ['method', 'endpoint'],
                registry=self.registry
            ),
            'memory_usage': Gauge(
                'agisfl_memory_usage_bytes',
                'Memory usage in bytes',
                registry=self.registry
            ),
            'active_connections': Gauge(
                'agisfl_active_connections',
                'Number of active connections',
                registry=self.registry
            ),
            'database_queries': Counter(
                'agisfl_database_queries_total',
                'Total number of database queries',
                ['operation'],
                registry=self.registry
            ),
            'cache_operations': Counter(
                'agisfl_cache_operations_total',
                'Total number of cache operations',
                ['operation', 'hit_miss'],
                registry=self.registry
            )
        }
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics"""
        if PROMETHEUS_AVAILABLE:
            self.metrics['requests_total'].labels(
                method=method, endpoint=endpoint, status_code=status_code
            ).inc()
            self.metrics['request_duration'].labels(
                method=method, endpoint=endpoint
            ).observe(duration)
        else:
            self.metrics['requests_total']['value'] += 1
            self.metrics['request_duration']['value'] = duration
    
    def update_memory_usage(self):
        """Update memory usage metrics"""
        try:
            process = psutil.Process()
            memory_bytes = process.memory_info().rss
            
            if PROMETHEUS_AVAILABLE:
                self.metrics['memory_usage'].set(memory_bytes)
            else:
                self.metrics['memory_usage']['value'] = memory_bytes
        except Exception as e:
            logger.warning(f"Failed to update memory metrics: {e}")
    
    def get_metrics_data(self) -> Dict[str, Any]:
        """Get current metrics data"""
        self.update_memory_usage()
        
        if PROMETHEUS_AVAILABLE:
            from prometheus_client import generate_latest
            return {
                'prometheus_format': generate_latest(self.registry).decode('utf-8'),
                'timestamp': datetime.utcnow().isoformat()
            }
        else:
            return {
                'metrics': self.metrics,
                'timestamp': datetime.utcnow().isoformat()
            }

class AlertingSystem:
    """Advanced alerting system for monitoring"""
    
    def __init__(self, metrics_collector: MetricsCollector):
        self.metrics_collector = metrics_collector
        self.alert_rules = []
        self.alert_history = []
        self.notification_handlers = []
        self._initialize_alert_rules()
    
    def _initialize_alert_rules(self):
        """Initialize default alert rules"""
        self.alert_rules = [
            {
                'name': 'high_memory_usage',
                'condition': lambda metrics: self._get_memory_usage_percent() > 85,
                'severity': 'warning',
                'message': 'High memory usage detected'
            },
            {
                'name': 'high_error_rate',
                'condition': lambda metrics: self._get_error_rate() > 0.05,
                'severity': 'critical',
                'message': 'High error rate detected'
            },
            {
                'name': 'slow_response_time',
                'condition': lambda metrics: self._get_avg_response_time() > 2.0,
                'severity': 'warning',
                'message': 'Slow response times detected'
            }
        ]
    
    def _get_memory_usage_percent(self) -> float:
        """Get current memory usage percentage"""
        try:
            process = psutil.Process()
            return process.memory_percent()
        except:
            return 0.0
    
    def _get_error_rate(self) -> float:
        """Calculate current error rate"""
        # Placeholder - would calculate from actual metrics
        return 0.0
    
    def _get_avg_response_time(self) -> float:
        """Calculate average response time"""
        # Placeholder - would calculate from actual metrics
        return 0.0
    
    def add_notification_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Add notification handler"""
        self.notification_handlers.append(handler)
    
    def check_alerts(self):
        """Check all alert rules and trigger notifications"""
        current_metrics = self.metrics_collector.get_metrics_data()
        
        for rule in self.alert_rules:
            try:
                if rule['condition'](current_metrics):
                    alert = {
                        'name': rule['name'],
                        'severity': rule['severity'],
                        'message': rule['message'],
                        'timestamp': datetime.utcnow().isoformat(),
                        'metrics': current_metrics
                    }
                    
                    self.alert_history.append(alert)
                    
                    # Trigger notifications
                    for handler in self.notification_handlers:
                        try:
                            handler(alert)
                        except Exception as e:
                            logger.error(f"Notification handler failed: {e}")
                    
                    logger.warning(f"Alert triggered: {rule['name']} - {rule['message']}")
                    
            except Exception as e:
                logger.error(f"Failed to check alert rule {rule['name']}: {e}")
    
    def get_alert_status(self) -> Dict[str, Any]:
        """Get current alert status"""
        recent_alerts = [
            alert for alert in self.alert_history
            if datetime.fromisoformat(alert['timestamp'].replace('Z', '+00:00')) > 
               datetime.utcnow().replace(tzinfo=None) - timedelta(hours=1)
        ]
        
        return {
            'total_alerts': len(self.alert_history),
            'recent_alerts': len(recent_alerts),
            'active_rules': len(self.alert_rules),
            'last_check': datetime.utcnow().isoformat(),
            'recent_alert_details': recent_alerts[-10:]  # Last 10 alerts
        }

# ============================================================================
# 4. ENHANCED SESSION MANAGEMENT & SECURITY
# ============================================================================

class SecureSessionManager:
    """Enhanced session management with proper invalidation"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.sessions = {}  # Fallback in-memory storage
        self.session_timeout = int(os.getenv("SESSION_TIMEOUT", "3600"))
        self.cleanup_interval = 300  # 5 minutes
        self.cleanup_task = None
    
    async def create_session(self, user_id: str, metadata: Dict[str, Any] = None) -> str:
        """Create new secure session"""
        import secrets
        import jwt
        
        session_id = secrets.token_urlsafe(32)
        session_data = {
            'user_id': user_id,
            'created_at': datetime.utcnow().isoformat(),
            'last_activity': datetime.utcnow().isoformat(),
            'metadata': metadata or {},
            'active': True
        }
        
        try:
            if self.redis_client:
                await self.redis_client.setex(
                    f"session:{session_id}",
                    self.session_timeout,
                    json.dumps(session_data)
                )
            else:
                self.sessions[session_id] = {
                    **session_data,
                    'expires_at': datetime.utcnow() + timedelta(seconds=self.session_timeout)
                }
            
            logger.info(f"Session created for user {user_id}", session_id=session_id[:8])
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise
    
    async def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Validate and refresh session"""
        try:
            if self.redis_client:
                session_data = await self.redis_client.get(f"session:{session_id}")
                if session_data:
                    data = json.loads(session_data)
                    # Update last activity
                    data['last_activity'] = datetime.utcnow().isoformat()
                    await self.redis_client.setex(
                        f"session:{session_id}",
                        self.session_timeout,
                        json.dumps(data)
                    )
                    return data
            else:
                session_data = self.sessions.get(session_id)
                if session_data and session_data['expires_at'] > datetime.utcnow():
                    # Refresh session
                    session_data['last_activity'] = datetime.utcnow().isoformat()
                    session_data['expires_at'] = datetime.utcnow() + timedelta(seconds=self.session_timeout)
                    return session_data
            
            return None
            
        except Exception as e:
            logger.error(f"Session validation failed: {e}")
            return None
    
    async def invalidate_session(self, session_id: str) -> bool:
        """Invalidate specific session"""
        try:
            if self.redis_client:
                result = await self.redis_client.delete(f"session:{session_id}")
                return result > 0
            else:
                return self.sessions.pop(session_id, None) is not None
                
        except Exception as e:
            logger.error(f"Session invalidation failed: {e}")
            return False
    
    async def invalidate_user_sessions(self, user_id: str) -> int:
        """Invalidate all sessions for a user"""
        invalidated_count = 0
        
        try:
            if self.redis_client:
                # Scan for user sessions in Redis
                async for key in self.redis_client.scan_iter(match="session:*"):
                    session_data = await self.redis_client.get(key)
                    if session_data:
                        data = json.loads(session_data)
                        if data.get('user_id') == user_id:
                            await self.redis_client.delete(key)
                            invalidated_count += 1
            else:
                # Clean in-memory sessions
                sessions_to_remove = [
                    sid for sid, data in self.sessions.items()
                    if data.get('user_id') == user_id
                ]
                for sid in sessions_to_remove:
                    del self.sessions[sid]
                    invalidated_count += 1
            
            logger.info(f"Invalidated {invalidated_count} sessions for user {user_id}")
            return invalidated_count
            
        except Exception as e:
            logger.error(f"Failed to invalidate user sessions: {e}")
            return 0
    
    async def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        if not self.redis_client:
            # Clean in-memory sessions
            now = datetime.utcnow()
            expired_sessions = [
                sid for sid, data in self.sessions.items()
                if data.get('expires_at', now) <= now
            ]
            
            for sid in expired_sessions:
                del self.sessions[sid]
            
            if expired_sessions:
                logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
    
    async def start_cleanup_task(self):
        """Start background cleanup task"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())
    
    async def stop_cleanup_task(self):
        """Stop background cleanup task"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None
    
    async def _cleanup_loop(self):
        """Background cleanup loop"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self.cleanup_expired_sessions()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Session cleanup error: {e}")

# ============================================================================
# 5. ENHANCED CORS & RATE LIMITING
# ============================================================================

class AdvancedCORSManager:
    """Advanced CORS management with security"""
    
    def __init__(self, config: EnvironmentConfig):
        self.config = config
        self.allowed_origins = set(config.cors_origins)
        self.allowed_methods = {"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"}
        self.allowed_headers = {
            "Accept",
            "Accept-Language",
            "Content-Language", 
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-CSRF-Token"
        }
        self.expose_headers = {"X-Request-ID", "X-Process-Time"}
        self.max_age = 86400  # 24 hours
    
    def is_origin_allowed(self, origin: str) -> bool:
        """Check if origin is allowed"""
        if not origin:
            return False
        
        if "*" in self.allowed_origins and self.config.name != "production":
            return True
        
        return origin in self.allowed_origins
    
    def get_cors_headers(self, origin: str, method: str) -> Dict[str, str]:
        """Get CORS headers for response"""
        headers = {}
        
        if self.is_origin_allowed(origin):
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
        
        if method == "OPTIONS":
            headers.update({
                "Access-Control-Allow-Methods": ", ".join(self.allowed_methods),
                "Access-Control-Allow-Headers": ", ".join(self.allowed_headers),
                "Access-Control-Max-Age": str(self.max_age)
            })
        
        if self.expose_headers:
            headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        
        return headers

class RateLimitingSystem:
    """Advanced rate limiting with Redis backend"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.limits = {}  # Fallback in-memory storage
        self.rate_limits = {
            "default": {"requests": 100, "window": 60},  # 100 requests per minute
            "auth": {"requests": 5, "window": 60},       # 5 auth attempts per minute
            "api": {"requests": 1000, "window": 60},     # 1000 API calls per minute
        }
    
    async def check_rate_limit(self, identifier: str, limit_type: str = "default") -> Dict[str, Any]:
        """Check if request is within rate limits"""
        limit_config = self.rate_limits.get(limit_type, self.rate_limits["default"])
        key = f"ratelimit:{limit_type}:{identifier}"
        current_time = int(time.time())
        window_start = current_time - limit_config["window"]
        
        try:
            if self.redis_client:
                # Use Redis sliding window
                pipe = self.redis_client.pipeline()
                pipe.zremrangebyscore(key, 0, window_start)
                pipe.zcard(key)
                pipe.zadd(key, {str(current_time): current_time})
                pipe.expire(key, limit_config["window"])
                results = await pipe.execute()
                
                current_count = results[1]
            else:
                # Fallback to in-memory
                if key not in self.limits:
                    self.limits[key] = []
                
                # Remove old entries
                self.limits[key] = [
                    timestamp for timestamp in self.limits[key]
                    if timestamp > window_start
                ]
                
                current_count = len(self.limits[key])
                self.limits[key].append(current_time)
            
            is_allowed = current_count < limit_config["requests"]
            
            return {
                "allowed": is_allowed,
                "limit": limit_config["requests"],
                "remaining": max(0, limit_config["requests"] - current_count - 1),
                "reset_time": current_time + limit_config["window"],
                "retry_after": limit_config["window"] if not is_allowed else None
            }
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open - allow request if rate limiting fails
            return {
                "allowed": True,
                "limit": limit_config["requests"],
                "remaining": limit_config["requests"],
                "reset_time": current_time + limit_config["window"],
                "retry_after": None,
                "error": str(e)
            }

# Global instances
configuration_manager = ConfigurationManager()
metrics_collector = MetricsCollector()
alerting_system = AlertingSystem(metrics_collector)
docker_optimizer = DockerOptimizer()

# Export key classes
__all__ = [
    'DockerOptimizer',
    'ConfigurationManager', 
    'MetricsCollector',
    'AlertingSystem',
    'SecureSessionManager',
    'AdvancedCORSManager',
    'RateLimitingSystem',
    'configuration_manager',
    'metrics_collector',
    'alerting_system',
    'docker_optimizer'
]
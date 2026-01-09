#!/usr/bin/env python3
"""
AgisFL Unified Data Manager
Multi-tier data storage system with Redis, PostgreSQL, and SQLite
"""

import asyncio
import json
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timezone, timedelta
from enum import Enum
import sqlite3
import psycopg2
from psycopg2 import pool
import redis
import os
import sys

# Robust config import with fallback
try:
    from ..config.enterprise_config import get_redis_config, get_database_config
except ImportError:
    try:
        from config.enterprise_config import get_redis_config, get_database_config
    except ImportError:
        try:
            # Direct file import as fallback
            import importlib.util
            current_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(os.path.dirname(current_dir), "config", "enterprise_config.py")
            
            if os.path.exists(config_path):
                spec = importlib.util.spec_from_file_location("enterprise_config", config_path)
                config_module = importlib.util.module_from_spec(spec)
                sys.modules["enterprise_config"] = config_module
                spec.loader.exec_module(config_module)
                get_redis_config = getattr(config_module, 'get_redis_config', lambda: {})
                get_database_config = getattr(config_module, 'get_database_config', lambda: {})
            else:
                # Final fallback with default configs
                def get_redis_config():
                    return {
                        "host": "localhost",
                        "port": 6379,
                        "password": "agisfl_redis_secure_password_2024",
                        "db": 0,
                        "decode_responses": True,
                        "socket_timeout": 5,
                        "socket_connect_timeout": 5
                    }
                
                def get_database_config():
                    return {
                        "postgresql": {
                            "host": "localhost",
                            "port": 5432,
                            "database": "agisfl",
                            "user": "postgres",
                            "password": "admin"
                        },
                        "sqlite": {
                            "database": "agisfl.db"
                        }
                    }
        except Exception:
            # Final fallback with default configs
            def get_redis_config():
                return {
                    "host": "localhost",
                    "port": 6379,
                    "password": "agisfl_redis_secure_password_2024",
                    "db": 0,
                    "decode_responses": True,
                    "socket_timeout": 5,
                    "socket_connect_timeout": 5
                }
            
            def get_database_config():
                return {
                    "postgresql": {
                        "host": "localhost",
                        "port": 5432,
                        "database": "agisfl",
                        "user": "postgres",
                        "password": "admin"
                    },
                    "sqlite": {
                        "database": "agisfl.db"
                    }
                }

logger = logging.getLogger(__name__)

class StorageTier(Enum):
    """Storage tiers for different data types"""
    REDIS = "redis"      # Fast, volatile data (cache, sessions, real-time)
    POSTGRESQL = "postgresql"  # Persistent, relational data (users, models, history)
    SQLITE = "sqlite"    # Fallback storage (local backup, offline mode)

class DataPriority(Enum):
    """Data access priority levels"""
    CRITICAL = "critical"    # Must be fast, always available
    HIGH = "high"           # Important, fast access preferred
    MEDIUM = "medium"       # Standard access patterns
    LOW = "low"            # Can be slower, batch processed

class UnifiedDataManager:
    # Event hooks and audit trail
    def _emit_event(self, event_type: str, details: Dict[str, Any]):
        logger.info(f"UnifiedDataManager event: {event_type}", extra={"details": details})
        # Extend here to integrate with external event bus or audit system

    def _log_audit(self, action: str, details: Dict[str, Any]):
        logger.info(f"AUDIT: {action}", extra={"details": details})
        # Extend here to write to audit trail file or external system

    async def transactional_store(self, tier: StorageTier, key: str, value: Any, audit_action: str = None) -> bool:
        """Transactional store operation with audit and event hooks"""
        try:
            # Begin transaction (simulated for Redis, real for SQL)
            if tier == StorageTier.REDIS:
                result = await self._store_redis(key, value)
            elif tier == StorageTier.POSTGRESQL:
                # Real transaction for PostgreSQL
                conn = self.postgresql_pool.getconn()
                try:
                    with conn:
                        with conn.cursor() as cur:
                            # Example: upsert logic
                            cur.execute("INSERT INTO data_store (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", (key, json.dumps(value)))
                    result = True
                finally:
                    self.postgresql_pool.putconn(conn)
            elif tier == StorageTier.SQLITE:
                # Real transaction for SQLite
                cur = self.sqlite_conn.cursor()
                try:
                    cur.execute("BEGIN TRANSACTION;")
                    cur.execute("INSERT OR REPLACE INTO data_store (key, value) VALUES (?, ?)", (key, json.dumps(value)))
                    self.sqlite_conn.commit()
                    result = True
                except Exception as e:
                    self.sqlite_conn.rollback()
                    logger.error(f"SQLite transaction failed: {e}")
                    result = False
            else:
                result = False

            self._emit_event("transactional_store", {"tier": tier.value, "key": key, "result": result})
            if audit_action:
                self._log_audit(audit_action, {"tier": tier.value, "key": key, "result": result})
            return result
        except Exception as e:
            logger.error(f"Transactional store failed: {e}")
            self._emit_event("transactional_store_failed", {"tier": tier.value, "key": key, "exception": str(e)})
            if audit_action:
                self._log_audit(f"{audit_action}_failed", {"tier": tier.value, "key": key, "exception": str(e)})
            return False
    """Unified data manager for multi-tier storage"""

    def __init__(self):
        self.redis_config = get_redis_config()
        self.db_config = get_database_config()

        # Storage connections
        self.redis_client = None
        self.postgresql_pool = None
        self.sqlite_conn = None

        # Storage status
        self.redis_available = False
        self.postgresql_available = False
        self.sqlite_available = False

        # Data routing rules
        self.data_routing = {
            # User data
            'user_profile': StorageTier.POSTGRESQL,
            'user_session': StorageTier.REDIS,
            'user_permissions': StorageTier.REDIS,

            # FL data
            'global_model': StorageTier.POSTGRESQL,
            'model_checkpoint': StorageTier.POSTGRESQL,
            'training_metrics': StorageTier.POSTGRESQL,
            'fl_client': StorageTier.POSTGRESQL,
            'fl_run': StorageTier.POSTGRESQL,

            # Real-time data
            'active_sessions': StorageTier.REDIS,
            'online_clients': StorageTier.REDIS,
            'system_metrics': StorageTier.REDIS,
            'api_cache': StorageTier.REDIS,

            # Security data
            'security_events': StorageTier.POSTGRESQL,
            'audit_log': StorageTier.POSTGRESQL,
            'rate_limits': StorageTier.REDIS,

            # Task management
            'task_queue': StorageTier.REDIS,
            'task_status': StorageTier.REDIS,
            'task_history': StorageTier.POSTGRESQL,

            # Configuration
            'app_config': StorageTier.REDIS,
            'feature_flags': StorageTier.REDIS,
            'system_settings': StorageTier.POSTGRESQL
        }

        # Priority mapping
        self.data_priority = {
            'user_session': DataPriority.CRITICAL,
            'active_sessions': DataPriority.CRITICAL,
            'online_clients': DataPriority.CRITICAL,
            'system_metrics': DataPriority.HIGH,
            'api_cache': DataPriority.HIGH,
            'rate_limits': DataPriority.HIGH,
            'task_queue': DataPriority.HIGH,
            'user_profile': DataPriority.MEDIUM,
            'global_model': DataPriority.MEDIUM,
            'security_events': DataPriority.MEDIUM,
            'training_metrics': DataPriority.LOW,
            'audit_log': DataPriority.LOW
        }

    async def initialize(self):
        """Initialize all storage tiers"""
        logger.info("Initializing Unified Data Manager")
        logger.info("=" * 50)

        # Initialize Redis (Tier 1)
        await self._init_redis()

        # Initialize PostgreSQL (Tier 2)
        await self._init_postgresql()

        # Initialize SQLite (Tier 3 - Fallback)
        await self._init_sqlite()

        # Create database schemas
        await self._create_schemas()

        logger.info("Unified Data Manager initialized successfully")
        logger.info(f"   Redis: {'available' if self.redis_available else 'unavailable'}")
        logger.info(f"   PostgreSQL: {'available' if self.postgresql_available else 'unavailable'}")
        logger.info(f"   SQLite: {'available' if self.sqlite_available else 'unavailable'}")

    async def _init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host=self.redis_config.host,
                port=self.redis_config.port,
                db=self.redis_config.db,
                password=self.redis_config.password,
                socket_timeout=self.redis_config.socket_timeout,
                socket_connect_timeout=self.redis_config.socket_connect_timeout,
                decode_responses=True,
                retry_on_timeout=True,
                max_connections=20
            )

            # Test connection
            pong = self.redis_client.ping()
            self.redis_available = True
            logger.info(f"   Redis connected: {pong}")

        except Exception as e:
            self.redis_available = False
            logger.error(f"   Redis connection failed: {e}")

    async def _init_postgresql(self):
        """Initialize PostgreSQL connection pool"""
        try:
            db_config = get_database_config()
            # Use Supabase if available, else fallback to standard PostgreSQL
            if isinstance(db_config, dict) and 'supabase_url' in db_config and db_config['supabase_url']:
                # Example: parse Supabase connection string (not implemented, fallback)
                logger.warning("Supabase integration not implemented, using standard PostgreSQL config.")
            pg_cfg = db_config.get('postgresql', {})
            self.postgresql_pool = psycopg2.pool.SimpleConnectionPool(
                minconn=1,
                maxconn=10,
                host=pg_cfg.get('host', 'localhost'),
                port=pg_cfg.get('port', 5432),
                database=pg_cfg.get('database', 'agisfl'),
                user=pg_cfg.get('user', 'postgres'),
                password=pg_cfg.get('password', 'admin')
            )
            # Test connection
            conn = self.postgresql_pool.getconn()
            cursor = conn.cursor()
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            cursor.close()
            self.postgresql_pool.putconn(conn)
            self.postgresql_available = True
            logger.info(f"   PostgreSQL connected: {version[0][:50]}...")
        except Exception as e:
            self.postgresql_available = False
            logger.error(f"   PostgreSQL connection failed: {e}")
            logger.warning("   Continuing with Redis and SQLite only")

    async def _init_sqlite(self):
        """Initialize SQLite connection"""
        try:
            self.sqlite_conn = sqlite3.connect('agisfl_fallback.db')
            self.sqlite_conn.execute('PRAGMA journal_mode=WAL')
            self.sqlite_conn.execute('PRAGMA synchronous=NORMAL')
            self.sqlite_conn.execute('PRAGMA cache_size=1000')
            self.sqlite_conn.execute('PRAGMA foreign_keys=ON')

            self.sqlite_available = True
            logger.info("   SQLite initialized successfully")

        except Exception as e:
            self.sqlite_available = False
            logger.error(f"   SQLite initialization failed: {e}")

    async def _create_schemas(self):
        """Create database schemas for all tiers"""
        if self.postgresql_available:
            await self._create_postgresql_schema()
        if self.sqlite_available:
            await self._create_sqlite_schema()

    async def _create_postgresql_schema(self):
        """Create PostgreSQL schema"""
        try:
            conn = self.postgresql_pool.getconn()
            cursor = conn.cursor()

            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(255) PRIMARY KEY,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash TEXT,
                    role VARCHAR(50) DEFAULT 'user',
                    permissions JSONB DEFAULT '[]',
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                );
            """)

            # FL Models table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fl_models (
                    model_id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    version VARCHAR(50),
                    algorithm VARCHAR(100),
                    accuracy FLOAT,
                    loss FLOAT,
                    training_rounds INTEGER,
                    total_clients INTEGER,
                    status VARCHAR(50) DEFAULT 'active',
                    model_data JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Training metrics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS training_metrics (
                    id SERIAL PRIMARY KEY,
                    run_id VARCHAR(255) NOT NULL,
                    round_num INTEGER NOT NULL,
                    metrics JSONB NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # FL Clients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fl_clients (
                    client_id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255),
                    organization VARCHAR(255),
                    type VARCHAR(50),
                    dataset_size INTEGER,
                    contribution_score FLOAT,
                    status VARCHAR(20) DEFAULT 'offline',
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    client_info JSONB
                );
            """)

            # Security events table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS security_events (
                    event_id VARCHAR(255) PRIMARY KEY,
                    event_type VARCHAR(100) NOT NULL,
                    severity VARCHAR(20) DEFAULT 'medium',
                    user_id VARCHAR(255),
                    ip_address VARCHAR(45),
                    details JSONB,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Audit log table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(255),
                    action VARCHAR(100),
                    resource VARCHAR(255),
                    details JSONB,
                    ip_address VARCHAR(45),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)

            conn.commit()
            cursor.close()
            self.postgresql_pool.putconn(conn)

            logger.info("   PostgreSQL schema created successfully")

        except Exception as e:
            logger.error(f"   PostgreSQL schema creation failed: {e}")

    async def _create_sqlite_schema(self):
        """Create SQLite schema"""
        try:
            # Users table
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    username TEXT,
                    email TEXT,
                    password_hash TEXT,
                    role TEXT DEFAULT 'user',
                    permissions TEXT DEFAULT '[]',
                    status TEXT DEFAULT 'active',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    last_login TEXT
                );
            """)

            # FL Models table
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS fl_models (
                    model_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    version TEXT,
                    algorithm TEXT,
                    accuracy REAL,
                    loss REAL,
                    training_rounds INTEGER,
                    total_clients INTEGER,
                    status TEXT DEFAULT 'active',
                    model_data TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Training metrics table
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS training_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_id TEXT NOT NULL,
                    round_num INTEGER NOT NULL,
                    metrics TEXT NOT NULL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # FL Clients table
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS fl_clients (
                    client_id TEXT PRIMARY KEY,
                    name TEXT,
                    organization TEXT,
                    type TEXT,
                    dataset_size INTEGER,
                    contribution_score REAL,
                    status TEXT DEFAULT 'offline',
                    registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
                    client_info TEXT
                );
            """)

            # Security events table
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS security_events (
                    event_id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    severity TEXT DEFAULT 'medium',
                    user_id TEXT,
                    ip_address TEXT,
                    details TEXT,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """)

            # Fallback data table for Redis data
            self.sqlite_conn.execute("""
                CREATE TABLE IF NOT EXISTS redis_fallback (
                    key TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    data_type TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    expires_at TEXT
                );
            """)

            self.sqlite_conn.commit()
            logger.info("   SQLite schema created successfully")

        except Exception as e:
            logger.error(f"   SQLite schema creation failed: {e}")

    # ==========================================
    # UNIFIED DATA ACCESS METHODS
    # ==========================================

    async def store_data(self, data_type: str, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Store data using appropriate storage tier"""
        storage_tier = self.data_routing.get(data_type, StorageTier.POSTGRESQL)
        priority = self.data_priority.get(data_type, DataPriority.MEDIUM)

        # Try primary storage first
        if storage_tier == StorageTier.REDIS and self.redis_available:
            return await self._store_redis(data_type, key, data, ttl)
        elif storage_tier == StorageTier.POSTGRESQL and self.postgresql_available:
            return await self._store_postgresql(data_type, key, data)
        elif storage_tier == StorageTier.SQLITE and self.sqlite_available:
            return await self._store_sqlite(data_type, key, data)

        # Fallback strategy
        return await self._fallback_store(data_type, key, data, ttl)

    async def get_data(self, data_type: str, key: str) -> Optional[Dict[str, Any]]:
        """Retrieve data from appropriate storage tier"""
        storage_tier = self.data_routing.get(data_type, StorageTier.POSTGRESQL)

        # Try primary storage first
        if storage_tier == StorageTier.REDIS and self.redis_available:
            data = await self._get_redis(data_type, key)
            if data:
                return data
        elif storage_tier == StorageTier.POSTGRESQL and self.postgresql_available:
            data = await self._get_postgresql(data_type, key)
            if data:
                return data
        elif storage_tier == StorageTier.SQLITE and self.sqlite_available:
            data = await self._get_sqlite(data_type, key)
            if data:
                return data

        # Fallback strategy
        return await self._fallback_get(data_type, key)

    async def _store_redis(self, data_type: str, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Store data in Redis"""
        try:
            redis_key = f"{data_type}:{key}"

            # Convert all values to strings for Redis storage
            redis_data = {}
            for k, v in data.items():
                if isinstance(v, (list, dict)):
                    redis_data[k] = json.dumps(v)
                else:
                    redis_data[k] = str(v)

            if redis_data:
                # Use hmset for multiple fields
                self.redis_client.hmset(redis_key, redis_data)
                if ttl:
                    self.redis_client.expire(redis_key, ttl)

            return True
        except Exception as e:
            logger.error(f"Redis store failed for {data_type}:{key}: {e}")
            return False

    async def _get_redis(self, data_type: str, key: str) -> Optional[Dict[str, Any]]:
        """Get data from Redis"""
        try:
            redis_key = f"{data_type}:{key}"
            data = self.redis_client.hgetall(redis_key)

            if not data:
                return None

            # Convert back from Redis strings
            result = {}
            for k, v in data.items():
                try:
                    # Try to parse as JSON first
                    result[k] = json.loads(v)
                except (json.JSONDecodeError, TypeError):
                    # If not JSON, keep as string
                    result[k] = v

            return result
        except Exception as e:
            logger.error(f"Redis get failed for {data_type}:{key}: {e}")
            return None

    async def _store_postgresql(self, data_type: str, key: str, data: Dict[str, Any]) -> bool:
        """Store data in PostgreSQL"""
        try:
            conn = self.postgresql_pool.getconn()
            cursor = conn.cursor()

            if data_type == 'user_profile':
                cursor.execute("""
                    INSERT INTO users (id, username, email, password_hash, full_name, role, is_verified, is_locked, mfa_enabled, preferences, created_at, updated_at, last_login)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (username) DO UPDATE SET
                        email = EXCLUDED.email,
                        password_hash = EXCLUDED.password_hash,
                        full_name = EXCLUDED.full_name,
                        role = EXCLUDED.role,
                        is_verified = EXCLUDED.is_verified,
                        is_locked = EXCLUDED.is_locked,
                        mfa_enabled = EXCLUDED.mfa_enabled,
                        preferences = EXCLUDED.preferences,
                        updated_at = CURRENT_TIMESTAMP,
                        last_login = EXCLUDED.last_login
                """, (
                    key, data.get('username'), data.get('email'), data.get('password_hash'),
                    data.get('full_name'), data.get('role'), data.get('is_verified', False),
                    data.get('is_locked', False), data.get('mfa_enabled', False),
                    json.dumps(data.get('preferences', {})), data.get('created_at'), data.get('updated_at'), data.get('last_login')
                ))

            elif data_type == 'global_model':
                cursor.execute("""
                    INSERT INTO fl_models (model_id, name, version, algorithm, accuracy, loss, training_rounds, total_clients, status, model_data, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (model_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        version = EXCLUDED.version,
                        algorithm = EXCLUDED.algorithm,
                        accuracy = EXCLUDED.accuracy,
                        loss = EXCLUDED.loss,
                        training_rounds = EXCLUDED.training_rounds,
                        total_clients = EXCLUDED.total_clients,
                        status = EXCLUDED.status,
                        model_data = EXCLUDED.model_data,
                        updated_at = CURRENT_TIMESTAMP
                """, (
                    key, data.get('name'), data.get('version'), data.get('algorithm'),
                    data.get('accuracy'), data.get('loss'), data.get('training_rounds'),
                    data.get('total_clients'), data.get('status'), json.dumps(data.get('model_data', {})),
                    data.get('created_at'), data.get('updated_at')
                ))

            elif data_type == 'fl_client':
                cursor.execute("""
                    INSERT INTO fl_clients (client_id, name, organization, description, location, contact_email, status, last_seen, capabilities, configuration, performance_metrics, security_info)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (client_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        organization = EXCLUDED.organization,
                        description = EXCLUDED.description,
                        location = EXCLUDED.location,
                        contact_email = EXCLUDED.contact_email,
                        status = EXCLUDED.status,
                        last_seen = CURRENT_TIMESTAMP,
                        capabilities = EXCLUDED.capabilities,
                        configuration = EXCLUDED.configuration,
                        performance_metrics = EXCLUDED.performance_metrics,
                        security_info = EXCLUDED.security_info
                """, (
                    key, data.get('name'), data.get('organization'), data.get('description', ''),
                    data.get('location', ''), data.get('contact_email', ''), data.get('status', 'offline'),
                    data.get('last_seen'), json.dumps(data.get('capabilities', {})),
                    json.dumps(data.get('configuration', {})), json.dumps(data.get('performance_metrics', {})),
                    json.dumps(data.get('security_info', {}))
                ))

            conn.commit()
            cursor.close()
            self.postgresql_pool.putconn(conn)

            return True
        except Exception as e:
            logger.error(f"PostgreSQL store failed for {data_type}:{key}: {e}")
            return False

    async def _get_postgresql(self, data_type: str, key: str) -> Optional[Dict[str, Any]]:
        """Get data from PostgreSQL"""
        try:
            conn = self.postgresql_pool.getconn()
            cursor = conn.cursor()

            if data_type == 'user_profile':
                cursor.execute("SELECT * FROM users WHERE username = %s", (key,))
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    data = dict(zip(columns, row))
                    # Handle JSON fields
                    json_fields = ['preferences', 'login_history', 'metadata_json']
                    for field in json_fields:
                        if field in data and data[field]:
                            if isinstance(data[field], str):
                                data[field] = json.loads(data[field])
                            elif isinstance(data[field], dict):
                                # Already a dict, keep as is
                                pass
                            else:
                                data[field] = {}
                        else:
                            data[field] = []
                    return data

            elif data_type == 'global_model':
                cursor.execute("SELECT * FROM fl_models WHERE model_id = %s", (key,))
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    data = dict(zip(columns, row))
                    data['model_data'] = json.loads(data['model_data']) if data['model_data'] else {}
                    return data

            elif data_type == 'fl_client':
                cursor.execute("SELECT * FROM fl_clients WHERE client_id = %s", (key,))
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    data = dict(zip(columns, row))
                    # Handle JSON fields
                    json_fields = ['capabilities', 'configuration', 'performance_metrics', 'security_info', 'metadata_json']
                    for field in json_fields:
                        if field in data and data[field]:
                            if isinstance(data[field], str):
                                data[field] = json.loads(data[field])
                            elif isinstance(data[field], dict):
                                # Already a dict, keep as is
                                pass
                            else:
                                data[field] = {}
                        else:
                            data[field] = {}
                    return data

            cursor.close()
            self.postgresql_pool.putconn(conn)

            return None
        except Exception as e:
            logger.error(f"PostgreSQL get failed for {data_type}:{key}: {e}")
            return None

    async def _store_sqlite(self, data_type: str, key: str, data: Dict[str, Any]) -> bool:
        """Store data in SQLite"""
        try:
            if data_type == 'user_profile':
                self.sqlite_conn.execute("""
                    INSERT OR REPLACE INTO users
                    (user_id, username, email, password_hash, role, permissions, status, created_at, updated_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    key, data.get('username', f'user_{key}'), data.get('email', f'{key}@example.com'), data.get('password_hash'),
                    data.get('role'), json.dumps(data.get('permissions', [])),
                    data.get('status'), data.get('created_at'), data.get('updated_at'), data.get('last_login')
                ))

            elif data_type == 'global_model':
                self.sqlite_conn.execute("""
                    INSERT OR REPLACE INTO fl_models
                    (model_id, name, version, algorithm, accuracy, loss, training_rounds, total_clients, status, model_data, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    key, data.get('name'), data.get('version'), data.get('algorithm'),
                    data.get('accuracy'), data.get('loss'), data.get('training_rounds'),
                    data.get('total_clients'), data.get('status'), json.dumps(data.get('model_data', {})),
                    data.get('created_at'), data.get('updated_at')
                ))

            self.sqlite_conn.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite store failed for {data_type}:{key}: {e}")
            return False

    async def _get_sqlite(self, data_type: str, key: str) -> Optional[Dict[str, Any]]:
        """Get data from SQLite"""
        try:
            if data_type == 'user_profile':
                cursor = self.sqlite_conn.execute("SELECT * FROM users WHERE user_id = ?", (key,))
                row = cursor.fetchone()
                if row:
                    columns = ['user_id', 'username', 'email', 'password_hash', 'role', 'permissions', 'status', 'created_at', 'updated_at', 'last_login']
                    data = dict(zip(columns, row))
                    data['permissions'] = json.loads(data['permissions']) if data['permissions'] else []
                    return data

            elif data_type == 'global_model':
                cursor = self.sqlite_conn.execute("SELECT * FROM fl_models WHERE model_id = ?", (key,))
                row = cursor.fetchone()
                if row:
                    columns = ['model_id', 'name', 'version', 'algorithm', 'accuracy', 'loss', 'training_rounds', 'total_clients', 'status', 'model_data', 'created_at', 'updated_at']
                    data = dict(zip(columns, row))
                    data['model_data'] = json.loads(data['model_data']) if data['model_data'] else {}
                    return data

            return None
        except Exception as e:
            logger.error(f"SQLite get failed for {data_type}:{key}: {e}")
            return None

    async def _fallback_store(self, data_type: str, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Fallback storage strategy"""
        # Try Redis first if available
        if self.redis_available:
            return await self._store_redis(data_type, key, data, ttl)

        # Try PostgreSQL if available
        if self.postgresql_available:
            return await self._store_postgresql(data_type, key, data)

        # Try SQLite if available
        if self.sqlite_available:
            return await self._store_sqlite(data_type, key, data)

        # Store in SQLite as last resort (even if not initialized)
        try:
            if not self.sqlite_conn:
                self.sqlite_conn = sqlite3.connect('agisfl_fallback.db')

            self.sqlite_conn.execute("""
                INSERT OR REPLACE INTO redis_fallback (key, data, data_type, updated_at, expires_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                f"{data_type}:{key}",
                json.dumps(data),
                data_type,
                datetime.now(timezone.utc).isoformat(),
                (datetime.now(timezone.utc) + timedelta(seconds=ttl)).isoformat() if ttl else None
            ))
            self.sqlite_conn.commit()
            return True
        except Exception as e:
            logger.error(f"Fallback storage failed for {data_type}:{key}: {e}")
            return False

    async def _fallback_get(self, data_type: str, key: str) -> Optional[Dict[str, Any]]:
        """Fallback retrieval strategy"""
        # Try all available storages in order
        storages = [
            (self.redis_available, self._get_redis),
            (self.postgresql_available, self._get_postgresql),
            (self.sqlite_available, self._get_sqlite)
        ]

        for available, getter in storages:
            if available:
                data = await getter(data_type, key)
                if data:
                    return data

        # Try SQLite fallback table
        try:
            if self.sqlite_conn:
                cursor = self.sqlite_conn.execute(
                    "SELECT data FROM redis_fallback WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)",
                    (f"{data_type}:{key}", datetime.now(timezone.utc).isoformat())
                )
                row = cursor.fetchone()
                if row:
                    return json.loads(row[0])
        except Exception as e:
            logger.error(f"Fallback retrieval failed for {data_type}:{key}: {e}")

        return None

    # ==========================================
    # HIGH-LEVEL DATA OPERATIONS
    # ==========================================

    async def store_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> bool:
        """Store user profile with PostgreSQL primary, Redis cache"""
        # Store in PostgreSQL
        pg_success = await self._store_postgresql('user_profile', user_id, profile_data)

        # Cache in Redis for fast access
        if self.redis_available:
            cache_data = profile_data.copy()
            cache_data['cached_from'] = 'postgresql'
            await self._store_redis('user_profile', user_id, cache_data, ttl=3600)

        return pg_success

    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user profile by username"""
        try:
            conn = self.postgresql_pool.getconn()
            cursor = conn.cursor()

            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                data = dict(zip(columns, row))
                # Handle JSON fields
                if data.get('permissions'):
                    if isinstance(data['permissions'], str):
                        data['permissions'] = json.loads(data['permissions'])
                    elif isinstance(data['permissions'], list):
                        # Already a list, keep as is
                        pass
                    else:
                        data['permissions'] = []
                else:
                    data['permissions'] = []

                cursor.close()
                self.postgresql_pool.putconn(conn)
                return data

            cursor.close()
            self.postgresql_pool.putconn(conn)
            return None
        except Exception as e:
            logger.error(f"PostgreSQL get user by username failed for {username}: {e}")
            return None

    async def store_session(self, session_id: str, user_id: str, session_data: Dict[str, Any]) -> bool:
        """Store session in Redis (fast access required)"""
        return await self.store_data('user_session', session_id, {
            'user_id': user_id,
            **session_data
        }, ttl=3600)

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session from Redis"""
        return await self.get_data('user_session', session_id)

    async def store_global_model(self, model_id: str, model_data: Dict[str, Any]) -> bool:
        """Store global model in PostgreSQL with Redis cache"""
        # Store in PostgreSQL
        pg_success = await self._store_postgresql('global_model', model_id, model_data)

        # Cache metadata in Redis
        if self.redis_available:
            cache_data = {
                'model_id': model_id,
                'name': model_data.get('name'),
                'version': model_data.get('version'),
                'accuracy': model_data.get('accuracy'),
                'status': model_data.get('status'),
                'cached_from': 'postgresql'
            }
            await self._store_redis('global_model', model_id, cache_data, ttl=1800)

        return pg_success

    async def get_global_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get global model with Redis cache"""
        # Try Redis cache first
        if self.redis_available:
            cached_data = await self._get_redis('global_model', model_id)
            if cached_data and cached_data.get('cached_from') == 'postgresql':
                    self._emit_event("get_global_model", {"model_id": model_id, "found": True, "source": "redis"})
                    self._log_audit("get_global_model", {"model_id": model_id, "found": True, "source": "redis"})
            return {k: v for k, v in cached_data.items() if k != 'cached_from'}

        # Fallback to PostgreSQL
            data = await self._get_postgresql('global_model', model_id)
            self._emit_event("get_global_model", {"model_id": model_id, "found": bool(data), "source": "postgresql"})
            self._log_audit("get_global_model", {"model_id": model_id, "found": bool(data), "source": "postgresql"})
            return data

    async def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        return {
            'redis': {
                'available': self.redis_available,
                'status': 'healthy' if self.redis_available else 'unhealthy'
            },
            'postgresql': {
                'available': self.postgresql_available,
                'status': 'healthy' if self.postgresql_available else 'unhealthy'
            },
            'sqlite': {
                'available': self.sqlite_available,
                'status': 'healthy' if self.sqlite_available else 'unhealthy'
            },
            'overall_status': 'healthy' if (self.redis_available or self.postgresql_available or self.sqlite_available) else 'critical',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    async def shutdown(self):
        """Shutdown all storage connections"""
        try:
            if self.redis_client:
                self.redis_client.close()

            if self.postgresql_pool:
                self.postgresql_pool.closeall()

            if self.sqlite_conn:
                self.sqlite_conn.close()

            logger.info("Unified Data Manager shutdown complete")

        except Exception as e:
            logger.error(f"Error during shutdown: {e}")

# Global instance
unified_data_manager = UnifiedDataManager()

async def get_unified_data_manager() -> UnifiedDataManager:
    """Get the global unified data manager instance"""
    if not hasattr(unified_data_manager, '_initialized'):
        await unified_data_manager.initialize()
        unified_data_manager._initialized = True
    return unified_data_manager

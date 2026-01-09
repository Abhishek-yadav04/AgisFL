"""
SQLite Database Manager - Unified Implementation
===============================================

Provides enterprise-grade SQLite database management integrated with
the unified data management system.

UPGRADED: Enhanced with real business logic and unified data manager integration.
"""

import asyncio
import sqlite3
import aiosqlite
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone
from pathlib import Path
import json
import structlog

# Import from unified data management system
from .unified_data_manager import UnifiedDataManager, StorageTier

logger = structlog.get_logger(__name__)

class SQLiteManager:
    """
    Enterprise SQLite Database Manager
    
    Provides robust local SQLite database management with integration
    to the unified data management system for enterprise features.
    """
    
    def __init__(self, unified_manager: UnifiedDataManager = None):
        self.db_path: str = "agisfl_enterprise.db"
        self.connection: Optional[aiosqlite.Connection] = None
        self.is_connected: bool = False
        self.unified_manager = unified_manager
        self.schema_version = "1.0.0"
        self.connection_pool = {}
        logger.info("Enterprise SQLite Manager initialized")
        
    async def initialize(self, db_path: str = "agisfl_enterprise.db"):
        """Initialize enterprise SQLite database with schema"""
        try:
            self.db_path = db_path
            
            logger.info("initializing_enterprise_sqlite", path=db_path)
            
            # Create database directory if it doesn't exist
            db_dir = Path(db_path).parent
            db_dir.mkdir(parents=True, exist_ok=True)
            
            # Connect to SQLite database
            self.connection = await aiosqlite.connect(db_path)
            await self.connection.execute("PRAGMA foreign_keys = ON")
            await self.connection.execute("PRAGMA journal_mode = WAL")
            
            # Create enterprise schema
            await self._create_enterprise_schema()
            
            self.is_connected = True
            logger.info("enterprise_sqlite_initialized", version=self.schema_version)
            
            # Integrate with unified manager if available
            if self.unified_manager:
                await self._sync_with_unified_manager()
                
        except Exception as e:
            logger.error("sqlite_initialization_failed", error=str(e))
            raise e
    
    async def _create_enterprise_schema(self):
        """Create enterprise database schema"""
        schema_sql = [
            # Users table with enterprise features
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                role TEXT DEFAULT 'user',
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                failed_login_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                metadata TEXT
            )
            """,
            
            # FL Experiments table
            """
            CREATE TABLE IF NOT EXISTS fl_experiments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                config TEXT NOT NULL,
                status TEXT DEFAULT 'created',
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                results TEXT,
                metadata TEXT,
                FOREIGN KEY (created_by) REFERENCES users (id)
            )
            """,
            
            # Datasets table
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                path TEXT,
                size INTEGER DEFAULT 0,
                format TEXT,
                owner INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tags TEXT,
                metadata TEXT,
                FOREIGN KEY (owner) REFERENCES users (id)
            )
            """,
            
            # System metrics table
            """
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT DEFAULT 'count',
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tags TEXT,
                metadata TEXT
            )
            """,
            
            # Audit log table
            """
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                table_name TEXT NOT NULL,
                record_id TEXT,
                user_id INTEGER,
                old_values TEXT,
                new_values TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
            """
        ]
        
        for sql in schema_sql:
            await self.connection.execute(sql)
        await self.connection.commit()
        
        # Create indexes for performance
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            "CREATE INDEX IF NOT EXISTS idx_experiments_status ON fl_experiments(status)",
            "CREATE INDEX IF NOT EXISTS idx_datasets_owner ON datasets(owner)",
            "CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON system_metrics(metric_name, timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)"
        ]
        
        for index_sql in indexes:
            await self.connection.execute(index_sql)
        await self.connection.commit()
        
        logger.info("enterprise_schema_created", tables=6, indexes=6)
    
    async def _sync_with_unified_manager(self):
        """Sync with unified data manager for multi-tier storage"""
        if not self.unified_manager:
            return
            
        try:
            # Sync key data to unified manager
            users = await self.get_all_users()
            for user in users:
                await self.unified_manager.store_data(
                    f"user:{user['username']}", 
                    user, 
                    StorageTier.SQLITE
                )
            
            logger.info("sqlite_unified_sync_completed", users_synced=len(users))
            
        except Exception as e:
            logger.error("sqlite_unified_sync_failed", error=str(e))
    
    async def create_user(self, username: str, email: str, password_hash: str, **kwargs) -> int:
        """Create a new user with enterprise features"""
        try:
            metadata = json.dumps(kwargs.get("metadata", {}))
            
            sql = """
            INSERT INTO users (username, email, password_hash, full_name, role, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
            """
            
            cursor = await self.connection.execute(
                sql, 
                (
                    username, 
                    email, 
                    password_hash,
                    kwargs.get("full_name"),
                    kwargs.get("role", "user"),
                    metadata
                )
            )
            await self.connection.commit()
            
            user_id = cursor.lastrowid
            logger.info("user_created", user_id=user_id, username=username)
            
            # Sync to unified manager
            if self.unified_manager:
                user_data = await self.get_user_by_id(user_id)
                await self.unified_manager.store_data(f"user:{username}", user_data, StorageTier.SQLITE)
            
            return user_id
            
        except Exception as e:
            logger.error("user_creation_failed", username=username, error=str(e))
            raise e
    
    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user by username with caching support"""
        try:
            # Try unified manager first if available
            if self.unified_manager:
                cached_user = await self.unified_manager.get_data(f"user:{username}", "all")
                if cached_user:
                    return cached_user
            
            # Query SQLite
            sql = "SELECT * FROM users WHERE username = ? AND is_active = 1"
            cursor = await self.connection.execute(sql, (username,))
            row = await cursor.fetchone()
            
            if row:
                user = dict(row)
                user["metadata"] = json.loads(user["metadata"]) if user["metadata"] else {}
                return user
            
            return None
            
        except Exception as e:
            logger.error("user_query_failed", username=username, error=str(e))
            return None
    
    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            sql = "SELECT * FROM users WHERE id = ? AND is_active = 1"
            cursor = await self.connection.execute(sql, (user_id,))
            row = await cursor.fetchone()
            
            if row:
                user = dict(row)
                user["metadata"] = json.loads(user["metadata"]) if user["metadata"] else {}
                return user
            
            return None
            
        except Exception as e:
            logger.error("user_query_by_id_failed", user_id=user_id, error=str(e))
            return None
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all active users"""
        try:
            sql = "SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC"
            cursor = await self.connection.execute(sql)
            rows = await cursor.fetchall()
            
            users = []
            for row in rows:
                user = dict(row)
                user["metadata"] = json.loads(user["metadata"]) if user["metadata"] else {}
                users.append(user)
            
            return users
            
        except Exception as e:
            logger.error("users_query_failed", error=str(e))
            return []
    
    async def update_user_login(self, username: str):
        """Update user last login timestamp"""
        try:
            sql = """
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0, locked_until = NULL
            WHERE username = ?
            """
            await self.connection.execute(sql, (username,))
            await self.connection.commit()
            
            logger.info("user_login_updated", username=username)
            
        except Exception as e:
            logger.error("user_login_update_failed", username=username, error=str(e))
    
    async def record_failed_login(self, username: str):
        """Record failed login attempt"""
        try:
            sql = """
            UPDATE users 
            SET failed_login_attempts = failed_login_attempts + 1,
                locked_until = CASE 
                    WHEN failed_login_attempts >= 4 THEN datetime('now', '+30 minutes')
                    ELSE locked_until 
                END
            WHERE username = ?
            """
            await self.connection.execute(sql, (username,))
            await self.connection.commit()
            
            logger.info("failed_login_recorded", username=username)
            
        except Exception as e:
            logger.error("failed_login_record_failed", username=username, error=str(e))
    
    async def create_experiment(self, name: str, config: Dict[str, Any], created_by: int, **kwargs) -> int:
        """Create a new FL experiment"""
        try:
            sql = """
            INSERT INTO fl_experiments (name, description, config, created_by, metadata)
            VALUES (?, ?, ?, ?, ?)
            """
            
            cursor = await self.connection.execute(
                sql,
                (
                    name,
                    kwargs.get("description"),
                    json.dumps(config),
                    created_by,
                    json.dumps(kwargs.get("metadata", {}))
                )
            )
            await self.connection.commit()
            
            experiment_id = cursor.lastrowid
            logger.info("experiment_created", experiment_id=experiment_id, name=name)
            
            return experiment_id
            
        except Exception as e:
            logger.error("experiment_creation_failed", name=name, error=str(e))
            raise e
    
    async def get_experiments(self, user_id: int = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get FL experiments with optional user filter"""
        try:
            if user_id:
                sql = "SELECT * FROM fl_experiments WHERE created_by = ? ORDER BY created_at DESC LIMIT ?"
                cursor = await self.connection.execute(sql, (user_id, limit))
            else:
                sql = "SELECT * FROM fl_experiments ORDER BY created_at DESC LIMIT ?"
                cursor = await self.connection.execute(sql, (limit,))
            
            rows = await cursor.fetchall()
            
            experiments = []
            for row in rows:
                exp = dict(row)
                exp["config"] = json.loads(exp["config"]) if exp["config"] else {}
                exp["results"] = json.loads(exp["results"]) if exp["results"] else {}
                exp["metadata"] = json.loads(exp["metadata"]) if exp["metadata"] else {}
                experiments.append(exp)
            
            return experiments
            
        except Exception as e:
            logger.error("experiments_query_failed", error=str(e))
            return []
    
    async def record_metric(self, metric_name: str, value: Union[int, float], **kwargs):
        """Record a system metric"""
        try:
            sql = """
            INSERT INTO system_metrics (metric_name, value, unit, tags, metadata)
            VALUES (?, ?, ?, ?, ?)
            """
            
            await self.connection.execute(
                sql,
                (
                    metric_name,
                    value,
                    kwargs.get("unit", "count"),
                    json.dumps(kwargs.get("tags", {})),
                    json.dumps(kwargs.get("metadata", {}))
                )
            )
            await self.connection.commit()
            
        except Exception as e:
            logger.error("metric_record_failed", metric=metric_name, error=str(e))
    
    async def get_metrics(self, metric_name: str = None, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get system metrics"""
        try:
            if metric_name:
                sql = "SELECT * FROM system_metrics WHERE metric_name = ? ORDER BY timestamp DESC LIMIT ?"
                cursor = await self.connection.execute(sql, (metric_name, limit))
            else:
                sql = "SELECT * FROM system_metrics ORDER BY timestamp DESC LIMIT ?"
                cursor = await self.connection.execute(sql, (limit,))
            
            rows = await cursor.fetchall()
            
            metrics = []
            for row in rows:
                metric = dict(row)
                metric["tags"] = json.loads(metric["tags"]) if metric["tags"] else {}
                metric["metadata"] = json.loads(metric["metadata"]) if metric["metadata"] else {}
                metrics.append(metric)
            
            return metrics
            
        except Exception as e:
            logger.error("metrics_query_failed", error=str(e))
            return []
    
    async def close(self):
        """Close database connection"""
        if self.connection:
            await self.connection.close()
            self.is_connected = False
            logger.info("sqlite_connection_closed")

# Create global SQLite manager instance
sqlite_manager = SQLiteManager()

# Export for use in other modules
__all__ = ['SQLiteManager', 'sqlite_manager']

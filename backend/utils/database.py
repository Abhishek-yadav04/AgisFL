"""
Database Optimization and Management Utilities
Provides connection pooling, query optimization, and database health monitoring
"""

import asyncio
import logging
import time
from typing import Any, Dict, List, Optional, Union, AsyncGenerator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import json
import hashlib

# Import database dependencies with fallbacks
try:
    import sqlalchemy
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.pool import StaticPool, QueuePool
    from sqlalchemy.orm import declarative_base
    from sqlalchemy import text, inspect
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False

try:
    import aiosqlite
    AIOSQLITE_AVAILABLE = True
except ImportError:
    AIOSQLITE_AVAILABLE = False

logger = logging.getLogger("utils.database")

class DatabaseConfig:
    """Database configuration with optimization settings"""
    
    def __init__(
        self,
        database_url: str = "sqlite+aiosqlite:///./agisfl.db",
        pool_size: int = 10,
        max_overflow: int = 20,
        pool_timeout: int = 30,
        pool_recycle: int = 3600,
        echo: bool = False,
        enable_query_logging: bool = True,
        slow_query_threshold: float = 1.0,
        connection_retry_attempts: int = 3,
        connection_retry_delay: float = 1.0
    ):
        self.database_url = database_url
        self.pool_size = pool_size
        self.max_overflow = max_overflow
        self.pool_timeout = pool_timeout
        self.pool_recycle = pool_recycle
        self.echo = echo
        self.enable_query_logging = enable_query_logging
        self.slow_query_threshold = slow_query_threshold
        self.connection_retry_attempts = connection_retry_attempts
        self.connection_retry_delay = connection_retry_delay
    
    def get_engine_kwargs(self) -> Dict[str, Any]:
        """Get SQLAlchemy engine configuration"""
        kwargs = {
            "echo": self.echo,
            "pool_recycle": self.pool_recycle,
        }
        
        if "sqlite" in self.database_url:
            kwargs.update({
                "poolclass": StaticPool,
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 20
                }
            })
        else:
            kwargs.update({
                "poolclass": QueuePool,
                "pool_size": self.pool_size,
                "max_overflow": self.max_overflow,
                "pool_timeout": self.pool_timeout,
            })
        
        return kwargs

class QueryMetrics:
    """Track database query performance metrics"""
    
    def __init__(self):
        self.query_count = 0
        self.slow_query_count = 0
        self.total_execution_time = 0.0
        self.query_history = []
        self.max_history = 1000
    
    def record_query(
        self,
        query: str,
        execution_time: float,
        parameters: Dict[str, Any] = None,
        result_count: int = None
    ):
        """Record query execution metrics"""
        self.query_count += 1
        self.total_execution_time += execution_time
        
        # Hash query for privacy using secure algorithm
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:8]
        
        query_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "query_hash": query_hash,
            "execution_time": execution_time,
            "result_count": result_count,
            "is_slow": execution_time > 1.0
        }
        
        if execution_time > 1.0:
            self.slow_query_count += 1
            logger.warning(
                f"Slow query detected",
                extra={
                    "query_hash": query_hash,
                    "execution_time": execution_time,
                    "result_count": result_count
                }
            )
        
        self.query_history.append(query_record)
        
        # Limit history size
        if len(self.query_history) > self.max_history:
            self.query_history = self.query_history[-self.max_history:]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get query performance metrics"""
        avg_execution_time = (
            self.total_execution_time / self.query_count
            if self.query_count > 0 else 0.0
        )
        
        recent_queries = [
            q for q in self.query_history
            if (datetime.utcnow() - datetime.fromisoformat(q["timestamp"])).seconds < 3600
        ]
        
        return {
            "total_queries": self.query_count,
            "slow_queries": self.slow_query_count,
            "average_execution_time": avg_execution_time,
            "total_execution_time": self.total_execution_time,
            "queries_per_hour": len(recent_queries),
            "slow_query_percentage": (
                self.slow_query_count / self.query_count * 100
                if self.query_count > 0 else 0.0
            )
        }

class ConnectionPool:
    """Advanced database connection pool manager"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine = None
        self.session_factory = None
        self.metrics = QueryMetrics()
        self.is_connected = False
        self.connection_errors = 0
        self.last_connection_error = None
    
    async def initialize(self):
        """Initialize database connection pool"""
        if not SQLALCHEMY_AVAILABLE:
            logger.error("SQLAlchemy not available - database functionality disabled")
            return
        
        try:
            engine_kwargs = self.config.get_engine_kwargs()
            self.engine = create_async_engine(
                self.config.database_url,
                **engine_kwargs
            )
            
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Test connection
            await self.test_connection()
            self.is_connected = True
            
            logger.info(
                "Database connection pool initialized",
                extra={
                    "database_url": self.config.database_url.split("://")[0] + "://***",
                    "pool_size": self.config.pool_size,
                    "max_overflow": self.config.max_overflow
                }
            )
            
        except Exception as e:
            self.connection_errors += 1
            self.last_connection_error = str(e)
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def test_connection(self):
        """Test database connection"""
        if not self.engine:
            raise Exception("Database engine not initialized")
        
        async with self.engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session with automatic cleanup"""
        if not self.session_factory:
            raise Exception("Database not initialized")
        
        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    async def execute_query(
        self,
        query: str,
        parameters: Dict[str, Any] = None,
        fetch_results: bool = True
    ) -> Optional[List[Dict[str, Any]]]:
        """Execute query with metrics tracking"""
        start_time = time.time()
        
        try:
            async with self.get_session() as session:
                result = await session.execute(text(query), parameters or {})
                
                if fetch_results:
                    rows = result.fetchall()
                    # Convert to dict format
                    results = [dict(row._mapping) for row in rows]
                    result_count = len(results)
                else:
                    results = None
                    result_count = result.rowcount
                
                execution_time = time.time() - start_time
                
                # Record metrics
                if self.config.enable_query_logging:
                    self.metrics.record_query(
                        query=query,
                        execution_time=execution_time,
                        parameters=parameters,
                        result_count=result_count
                    )
                
                return results
                
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                "Query execution failed",
                extra={
                    "execution_time": execution_time
                },
                exc_info=True
            )
            raise
    
    async def bulk_insert(
        self,
        table_name: str,
        records: List[Dict[str, Any]],
        batch_size: int = 1000
    ) -> int:
        """Perform bulk insert with batching"""
        if not records:
            return 0
        
        total_inserted = 0
        
        async with self.get_session() as session:
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                
                # Build insert query
                columns = list(batch[0].keys())
                placeholders = ", ".join([f":{col}" for col in columns])
                query = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                
                try:
                    result = await session.execute(text(query), batch)
                    total_inserted += result.rowcount
                    
                    if i % (batch_size * 10) == 0:  # Commit every 10 batches
                        await session.commit()
                        
                except Exception as e:
                    logger.error(f"Bulk insert batch failed: {e}")
                    await session.rollback()
                    raise
        
        logger.info(f"Bulk inserted {total_inserted} records into {table_name}")
        return total_inserted
    
    async def optimize_database(self):
        """Run database optimization tasks"""
        if not self.engine:
            return
        
        try:
            if "sqlite" in self.config.database_url:
                await self._optimize_sqlite()
            elif "postgresql" in self.config.database_url:
                await self._optimize_postgresql()
            
        except Exception as e:
            logger.error(f"Database optimization failed: {e}")
    
    async def _optimize_sqlite(self):
        """SQLite-specific optimizations"""
        optimizations = [
            "PRAGMA optimize",
            "PRAGMA wal_checkpoint(TRUNCATE)",
            "VACUUM"
        ]
        
        for optimization in optimizations:
            try:
                await self.execute_query(optimization, fetch_results=False)
                logger.info(f"Applied SQLite optimization: {optimization}")
            except Exception as e:
                logger.warning(f"SQLite optimization failed ({optimization}): {e}")
    
    async def _optimize_postgresql(self):
        """PostgreSQL-specific optimizations"""
        try:
            # Get table statistics
            stats_query = """
            SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
            FROM pg_stat_user_tables
            ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC
            """
            
            stats = await self.execute_query(stats_query)
            
            if stats:
                logger.info(f"PostgreSQL table statistics: {len(stats)} tables analyzed")
            
        except Exception as e:
            logger.warning(f"PostgreSQL optimization failed: {e}")
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get database health status"""
        status = {
            "connected": self.is_connected,
            "connection_errors": self.connection_errors,
            "last_error": self.last_connection_error,
            "metrics": self.metrics.get_metrics()
        }
        
        try:
            # Test connection
            start_time = time.time()
            await self.test_connection()
            connection_time = time.time() - start_time
            
            status.update({
                "connection_test": "passed",
                "connection_time": connection_time
            })
            
        except Exception as e:
            status.update({
                "connection_test": "failed",
                "connection_error": str(e)
            })
        
        return status
    
    async def cleanup(self):
        """Cleanup database connections"""
        if self.engine:
            await self.engine.dispose()
            self.is_connected = False
            logger.info("Database connection pool disposed")

class DatabaseMigrationManager:
    """Manage database schema migrations"""
    
    def __init__(self, connection_pool: ConnectionPool):
        self.pool = connection_pool
        self.migration_table = "schema_migrations"
    
    async def initialize_migration_table(self):
        """Create migration tracking table"""
        create_table_query = f"""
        CREATE TABLE IF NOT EXISTS {self.migration_table} (
            id INTEGER PRIMARY KEY,
            version VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        
        await self.pool.execute_query(create_table_query, fetch_results=False)
    
    async def apply_migration(self, version: str, name: str, sql: str):
        """Apply a database migration"""
        # Check if migration already applied
        check_query = f"SELECT version FROM {self.migration_table} WHERE version = :version"
        result = await self.pool.execute_query(check_query, {"version": version})
        
        if result:
            logger.info(f"Migration {version} already applied")
            return
        
        try:
            # Apply migration
            await self.pool.execute_query(sql, fetch_results=False)
            
            # Record migration
            record_query = f"""
            INSERT INTO {self.migration_table} (version, name)
            VALUES (:version, :name)
            """
            await self.pool.execute_query(
                record_query,
                {"version": version, "name": name},
                fetch_results=False
            )
            
            logger.info(f"Applied migration {version}: {name}")
            
        except Exception as e:
            logger.error(f"Migration {version} failed: {e}")
            raise
    
    async def get_applied_migrations(self) -> List[Dict[str, Any]]:
        """Get list of applied migrations"""
        query = f"SELECT * FROM {self.migration_table} ORDER BY applied_at"
        return await self.pool.execute_query(query)

class DatabaseCache:
    """Simple in-memory database query cache"""
    
    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000):
        self.cache = {}
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
    
    def _generate_cache_key(self, query: str, parameters: Dict[str, Any] = None) -> str:
        """Generate cache key for query"""
        key_data = f"{query}:{json.dumps(parameters or {}, sort_keys=True)}"
        return hashlib.sha256(key_data.encode()).hexdigest()
    
    def get(self, query: str, parameters: Dict[str, Any] = None) -> Optional[List[Dict[str, Any]]]:
        """Get cached query result"""
        cache_key = self._generate_cache_key(query, parameters)
        
        if cache_key in self.cache:
            cached_data = self.cache[cache_key]
            
            # Check if expired
            if time.time() - cached_data["timestamp"] < self.ttl_seconds:
                self.hits += 1
                return cached_data["result"]
            else:
                del self.cache[cache_key]
        
        self.misses += 1
        return None
    
    def set(self, query: str, result: List[Dict[str, Any]], parameters: Dict[str, Any] = None):
        """Cache query result"""
        cache_key = self._generate_cache_key(query, parameters)
        
        # Remove oldest entry if cache is full
        if len(self.cache) >= self.max_size:
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        
        self.cache[cache_key] = {
            "result": result,
            "timestamp": time.time()
        }
    
    def clear(self):
        """Clear cache"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = self.hits / total_requests if total_requests > 0 else 0.0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "cache_size": len(self.cache),
            "max_size": self.max_size
        }

# Global database manager
class DatabaseManager:
    """Global database manager with connection pooling and caching"""
    
    def __init__(self):
        self.pools = {}
        self.cache = DatabaseCache()
        self.default_pool_name = "default"
    
    def add_pool(self, name: str, config: DatabaseConfig):
        """Add a database connection pool"""
        self.pools[name] = ConnectionPool(config)
    
    async def initialize_all(self):
        """Initialize all database pools"""
        for name, pool in self.pools.items():
            try:
                await pool.initialize()
                logger.info(f"Database pool '{name}' initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize database pool '{name}': {e}")
    
    def get_pool(self, name: str = None) -> ConnectionPool:
        """Get database connection pool"""
        pool_name = name or self.default_pool_name
        
        if pool_name not in self.pools:
            raise ValueError(f"Database pool '{pool_name}' not found")
        
        return self.pools[pool_name]
    
    async def execute_cached_query(
        self,
        query: str,
        parameters: Dict[str, Any] = None,
        cache_ttl: int = 300,
        pool_name: str = None
    ) -> List[Dict[str, Any]]:
        """Execute query with caching"""
        # Check cache first
        if cache_ttl > 0:
            cached_result = self.cache.get(query, parameters)
            if cached_result is not None:
                return cached_result
        
        # Execute query
        pool = self.get_pool(pool_name)
        result = await pool.execute_query(query, parameters)
        
        # Cache result
        if cache_ttl > 0 and result:
            self.cache.set(query, result, parameters)
        
        return result or []
    
    async def cleanup_all(self):
        """Cleanup all database pools"""
        for name, pool in self.pools.items():
            try:
                await pool.cleanup()
                logger.info(f"Database pool '{name}' cleaned up")
            except Exception as e:
                logger.error(f"Failed to cleanup database pool '{name}': {e}")

# Global database manager instance
db_manager = DatabaseManager()

# Utility functions
async def ensure_database_schema():
    """Ensure database schema is up to date"""
    try:
        # Add default pool if none exists
        if not db_manager.pools:
            config = DatabaseConfig()
            db_manager.add_pool("default", config)
            await db_manager.initialize_all()
        
        # Run basic schema setup
        pool = db_manager.get_pool()
        
        # Create basic tables for audit logging
        audit_table_sql = """
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id VARCHAR(50),
            action VARCHAR(100),
            resource VARCHAR(100),
            details TEXT,
            ip_address VARCHAR(45),
            success BOOLEAN DEFAULT TRUE
        )
        """
        
        await pool.execute_query(audit_table_sql, fetch_results=False)
        
        # Create index for performance
        index_sql = "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)"
        await pool.execute_query(index_sql, fetch_results=False)
        
        logger.info("Database schema ensured")
        
    except Exception as e:
        logger.error(f"Failed to ensure database schema: {e}")

# Export key classes and functions
__all__ = [
    'DatabaseConfig',
    'ConnectionPool',
    'QueryMetrics',
    'DatabaseMigrationManager',
    'DatabaseCache',
    'DatabaseManager',
    'db_manager',
    'ensure_database_schema'
]

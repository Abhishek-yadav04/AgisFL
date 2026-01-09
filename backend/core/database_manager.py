"""
Enterprise Database Manager - Production-Grade Database Operations
Robust database connection management, query optimization, and data integrity
"""

import asyncio
import logging
import time
import json
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager
import structlog

# Database drivers
try:
    import motor.motor_asyncio
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False

try:
    import aiosqlite
    import sqlite3
    SQLITE_AVAILABLE = True
except ImportError:
    SQLITE_AVAILABLE = False

try:
    import asyncpg
    POSTGRESQL_AVAILABLE = True
except ImportError:
    POSTGRESQL_AVAILABLE = False

logger = structlog.get_logger(__name__)

@dataclass
class DatabaseConfig:
    """Database configuration"""
    db_type: str  # mongodb, sqlite, postgresql
    connection_string: str
    database_name: str
    max_connections: int = 10
    connection_timeout: int = 30
    query_timeout: int = 60
    retry_attempts: int = 3
    retry_delay: float = 1.0
    enable_ssl: bool = True
    enable_compression: bool = True

@dataclass
class QueryResult:
    """Query result wrapper"""
    success: bool
    data: Any = None
    error: str = None
    execution_time: float = 0.0
    rows_affected: int = 0
    query_id: str = None

class DatabaseConnectionPool:
    """Database connection pool manager"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.connections = {}
        self.connection_stats = {
            "total_connections": 0,
            "active_connections": 0,
            "failed_connections": 0,
            "total_queries": 0,
            "successful_queries": 0,
            "failed_queries": 0,
            "avg_query_time": 0.0
        }
        self.is_initialized = False
        self.health_status = "unknown"
        
    async def initialize(self) -> bool:
        """Initialize database connection pool"""
        try:
            logger.info("Initializing database connection pool", db_type=self.config.db_type)
            
            if self.config.db_type == "mongodb" and MONGODB_AVAILABLE:
                await self._initialize_mongodb()
            elif self.config.db_type == "sqlite" and SQLITE_AVAILABLE:
                await self._initialize_sqlite()
            elif self.config.db_type == "postgresql" and POSTGRESQL_AVAILABLE:
                await self._initialize_postgresql()
            else:
                raise ValueError(f"Unsupported database type: {self.config.db_type}")
            
            self.is_initialized = True
            self.health_status = "healthy"
            logger.info("Database connection pool initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize database connection pool", error=str(e))
            self.health_status = "unhealthy"
            return False
    
    async def _initialize_mongodb(self):
        """Initialize MongoDB connection"""
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(
                self.config.connection_string,
                maxPoolSize=self.config.max_connections,
                serverSelectionTimeoutMS=self.config.connection_timeout * 1000,
                connectTimeoutMS=self.config.connection_timeout * 1000,
                socketTimeoutMS=self.config.query_timeout * 1000,
                ssl=self.config.enable_ssl,
                compressors="zlib" if self.config.enable_compression else None
            )
            
            # Test connection
            await client.admin.command('ping')
            
            self.connections["client"] = client
            self.connections["database"] = client[self.config.database_name]
            
            logger.info("MongoDB connection established")
            
        except Exception as e:
            logger.error("MongoDB connection failed", error=str(e))
            raise
    
    async def _initialize_sqlite(self):
        """Initialize SQLite connection"""
        try:
            # Create connection pool for SQLite
            self.connections["database_path"] = self.config.connection_string
            
            # Test connection
            async with aiosqlite.connect(self.config.connection_string) as db:
                await db.execute("SELECT 1")
            
            logger.info("SQLite connection established")
            
        except Exception as e:
            logger.error("SQLite connection failed", error=str(e))
            raise
    
    async def _initialize_postgresql(self):
        """Initialize PostgreSQL connection"""
        try:
            # Create connection pool
            pool = await asyncpg.create_pool(
                self.config.connection_string,
                min_size=1,
                max_size=self.config.max_connections,
                command_timeout=self.config.query_timeout,
                server_settings={
                    'application_name': 'AgisFL Enterprise',
                }
            )
            
            self.connections["pool"] = pool
            
            logger.info("PostgreSQL connection pool established")
            
        except Exception as e:
            logger.error("PostgreSQL connection failed", error=str(e))
            raise
    
    async def execute_query(self, query: str, params: Dict[str, Any] = None, collection: str = None) -> QueryResult:
        """Execute database query with error handling and retries"""
        query_id = hashlib.md5(f"{query}{time.time()}".encode()).hexdigest()[:8]
        start_time = time.time()
        
        for attempt in range(self.config.retry_attempts):
            try:
                if self.config.db_type == "mongodb":
                    result = await self._execute_mongodb_query(query, params, collection)
                elif self.config.db_type == "sqlite":
                    result = await self._execute_sqlite_query(query, params)
                elif self.config.db_type == "postgresql":
                    result = await self._execute_postgresql_query(query, params)
                else:
                    raise ValueError(f"Unsupported database type: {self.config.db_type}")
                
                execution_time = time.time() - start_time
                self._update_query_stats(True, execution_time)
                
                return QueryResult(
                    success=True,
                    data=result,
                    execution_time=execution_time,
                    query_id=query_id
                )
                
            except Exception as e:
                logger.warning(f"Query attempt {attempt + 1} failed", 
                             query_id=query_id, error=str(e))
                
                if attempt < self.config.retry_attempts - 1:
                    await asyncio.sleep(self.config.retry_delay * (attempt + 1))
                else:
                    execution_time = time.time() - start_time
                    self._update_query_stats(False, execution_time)
                    
                    return QueryResult(
                        success=False,
                        error=str(e),
                        execution_time=execution_time,
                        query_id=query_id
                    )
    
    async def _execute_mongodb_query(self, operation: str, params: Dict[str, Any] = None, collection: str = None) -> Any:
        """Execute MongoDB operation"""
        if not collection:
            raise ValueError("Collection name required for MongoDB operations")
        
        db = self.connections["database"]
        coll = db[collection]
        
        params = params or {}
        
        if operation == "find":
            cursor = coll.find(params.get("filter", {}), params.get("projection"))
            if params.get("limit"):
                cursor = cursor.limit(params["limit"])
            if params.get("sort"):
                cursor = cursor.sort(params["sort"])
            return await cursor.to_list(length=None)
        
        elif operation == "find_one":
            return await coll.find_one(params.get("filter", {}), params.get("projection"))
        
        elif operation == "insert_one":
            result = await coll.insert_one(params["document"])
            return {"inserted_id": str(result.inserted_id)}
        
        elif operation == "insert_many":
            result = await coll.insert_many(params["documents"])
            return {"inserted_ids": [str(id) for id in result.inserted_ids]}
        
        elif operation == "update_one":
            result = await coll.update_one(params["filter"], params["update"])
            return {"matched_count": result.matched_count, "modified_count": result.modified_count}
        
        elif operation == "update_many":
            result = await coll.update_many(params["filter"], params["update"])
            return {"matched_count": result.matched_count, "modified_count": result.modified_count}
        
        elif operation == "delete_one":
            result = await coll.delete_one(params["filter"])
            return {"deleted_count": result.deleted_count}
        
        elif operation == "delete_many":
            result = await coll.delete_many(params["filter"])
            return {"deleted_count": result.deleted_count}
        
        elif operation == "count_documents":
            return await coll.count_documents(params.get("filter", {}))
        
        elif operation == "aggregate":
            cursor = coll.aggregate(params["pipeline"])
            return await cursor.to_list(length=None)
        
        else:
            raise ValueError(f"Unsupported MongoDB operation: {operation}")
    
    async def _execute_sqlite_query(self, query: str, params: Dict[str, Any] = None) -> Any:
        """Execute SQLite query"""
        async with aiosqlite.connect(self.connections["database_path"]) as db:
            db.row_factory = aiosqlite.Row
            
            if query.strip().upper().startswith("SELECT"):
                async with db.execute(query, params or {}) as cursor:
                    rows = await cursor.fetchall()
                    return [dict(row) for row in rows]
            else:
                await db.execute(query, params or {})
                await db.commit()
                return {"rows_affected": db.total_changes}
    
    async def _execute_postgresql_query(self, query: str, params: Dict[str, Any] = None) -> Any:
        """Execute PostgreSQL query"""
        pool = self.connections["pool"]
        
        async with pool.acquire() as connection:
            if query.strip().upper().startswith("SELECT"):
                rows = await connection.fetch(query, *(params.values() if params else []))
                return [dict(row) for row in rows]
            else:
                result = await connection.execute(query, *(params.values() if params else []))
                return {"rows_affected": int(result.split()[-1]) if result.split()[-1].isdigit() else 0}
    
    def _update_query_stats(self, success: bool, execution_time: float):
        """Update query statistics"""
        self.connection_stats["total_queries"] += 1
        
        if success:
            self.connection_stats["successful_queries"] += 1
        else:
            self.connection_stats["failed_queries"] += 1
        
        # Update average query time
        total_time = self.connection_stats["avg_query_time"] * (self.connection_stats["total_queries"] - 1)
        self.connection_stats["avg_query_time"] = (total_time + execution_time) / self.connection_stats["total_queries"]
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get database health status"""
        try:
            # Test connection
            if self.config.db_type == "mongodb":
                await self.connections["client"].admin.command('ping')
            elif self.config.db_type == "sqlite":
                async with aiosqlite.connect(self.connections["database_path"]) as db:
                    await db.execute("SELECT 1")
            elif self.config.db_type == "postgresql":
                async with self.connections["pool"].acquire() as connection:
                    await connection.fetchval("SELECT 1")
            
            self.health_status = "healthy"
            
        except Exception as e:
            logger.error("Database health check failed", error=str(e))
            self.health_status = "unhealthy"
        
        return {
            "status": self.health_status,
            "database_type": self.config.db_type,
            "is_initialized": self.is_initialized,
            "statistics": self.connection_stats,
            "last_check": datetime.now(timezone.utc).isoformat()
        }
    
    async def close(self):
        """Close database connections"""
        try:
            if self.config.db_type == "mongodb" and "client" in self.connections:
                self.connections["client"].close()
            elif self.config.db_type == "postgresql" and "pool" in self.connections:
                await self.connections["pool"].close()
            
            self.is_initialized = False
            logger.info("Database connections closed")
            
        except Exception as e:
            logger.error("Error closing database connections", error=str(e))

class EnterpriseDataManager:
    """Enterprise data manager with multiple database support"""
    
    def __init__(self):
        self.connection_pools = {}
        self.default_pool = None
        self.data_cache = {}
        self.cache_ttl = 300  # 5 minutes
        self.is_initialized = False
        
    async def initialize(self, configs: List[DatabaseConfig]) -> bool:
        """Initialize data manager with multiple database configurations"""
        try:
            logger.info("Initializing enterprise data manager")
            
            for config in configs:
                pool = DatabaseConnectionPool(config)
                if await pool.initialize():
                    self.connection_pools[config.database_name] = pool
                    if not self.default_pool:
                        self.default_pool = pool
                    logger.info(f"Database pool initialized: {config.database_name}")
                else:
                    logger.error(f"Failed to initialize database pool: {config.database_name}")
            
            if not self.connection_pools:
                raise Exception("No database connections could be established")
            
            self.is_initialized = True
            logger.info("Enterprise data manager initialized successfully")
            return True
            
        except Exception as e:
            logger.error("Failed to initialize enterprise data manager", error=str(e))
            return False
    
    async def execute_query(self, query: str, params: Dict[str, Any] = None, 
                          database: str = None, collection: str = None, 
                          use_cache: bool = False, cache_ttl: int = None) -> QueryResult:
        """Execute query with caching and error handling"""
        
        # Select database pool
        pool = self.connection_pools.get(database) if database else self.default_pool
        if not pool:
            return QueryResult(success=False, error="Database pool not found")
        
        # Check cache if enabled
        if use_cache:
            cache_key = self._generate_cache_key(query, params, collection)
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return QueryResult(success=True, data=cached_result, execution_time=0.0)
        
        # Execute query
        result = await pool.execute_query(query, params, collection)
        
        # Cache result if successful and caching enabled
        if result.success and use_cache:
            cache_key = self._generate_cache_key(query, params, collection)
            self._set_cache(cache_key, result.data, cache_ttl or self.cache_ttl)
        
        return result
    
    def _generate_cache_key(self, query: str, params: Dict[str, Any] = None, collection: str = None) -> str:
        """Generate cache key for query"""
        key_data = f"{query}:{params}:{collection}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _get_from_cache(self, key: str) -> Any:
        """Get data from cache"""
        if key in self.data_cache:
            cached_item = self.data_cache[key]
            if time.time() < cached_item["expires_at"]:
                return cached_item["data"]
            else:
                del self.data_cache[key]
        return None
    
    def _set_cache(self, key: str, data: Any, ttl: int):
        """Set data in cache"""
        self.data_cache[key] = {
            "data": data,
            "expires_at": time.time() + ttl,
            "created_at": time.time()
        }
    
    async def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health"""
        health_status = {
            "overall_status": "healthy",
            "databases": {},
            "cache_stats": {
                "cached_items": len(self.data_cache),
                "cache_hit_rate": 0.0
            },
            "is_initialized": self.is_initialized
        }
        
        unhealthy_count = 0
        for name, pool in self.connection_pools.items():
            db_health = await pool.get_health_status()
            health_status["databases"][name] = db_health
            if db_health["status"] != "healthy":
                unhealthy_count += 1
        
        if unhealthy_count > 0:
            if unhealthy_count == len(self.connection_pools):
                health_status["overall_status"] = "critical"
            else:
                health_status["overall_status"] = "degraded"
        
        return health_status
    
    async def cleanup_cache(self):
        """Clean up expired cache entries"""
        current_time = time.time()
        expired_keys = [
            key for key, item in self.data_cache.items()
            if current_time >= item["expires_at"]
        ]
        
        for key in expired_keys:
            del self.data_cache[key]
        
        logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
    
    async def close(self):
        """Close all database connections"""
        for pool in self.connection_pools.values():
            await pool.close()
        
        self.connection_pools.clear()
        self.default_pool = None
        self.is_initialized = False
        logger.info("Enterprise data manager closed")

# Specialized data access objects

class SecurityDataManager:
    """Specialized data manager for security-related data"""
    
    def __init__(self, data_manager: EnterpriseDataManager):
        self.data_manager = data_manager
        self.collection_name = "security_events"
    
    async def store_security_event(self, event_data: Dict[str, Any]) -> QueryResult:
        """Store security event"""
        event_data["timestamp"] = datetime.now(timezone.utc).isoformat()
        event_data["event_id"] = hashlib.sha256(f"{event_data['timestamp']}{json.dumps(event_data, sort_keys=True)}".encode()).hexdigest()[:16]
        
        return await self.data_manager.execute_query(
            "insert_one",
            {"document": event_data},
            collection=self.collection_name
        )
    
    async def get_security_events(self, filter_params: Dict[str, Any] = None, limit: int = 100) -> QueryResult:
        """Get security events with filtering"""
        return await self.data_manager.execute_query(
            "find",
            {
                "filter": filter_params or {},
                "limit": limit,
                "sort": [("timestamp", -1)]
            },
            collection=self.collection_name,
            use_cache=True,
            cache_ttl=60
        )
    
    async def get_threat_statistics(self) -> QueryResult:
        """Get threat statistics"""
        pipeline = [
            {"$group": {
                "_id": "$threat_type",
                "count": {"$sum": 1},
                "avg_severity": {"$avg": "$severity_score"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        return await self.data_manager.execute_query(
            "aggregate",
            {"pipeline": pipeline},
            collection=self.collection_name,
            use_cache=True,
            cache_ttl=300
        )

class FederatedLearningDataManager:
    """Specialized data manager for federated learning data"""
    
    def __init__(self, data_manager: EnterpriseDataManager):
        self.data_manager = data_manager
        self.experiments_collection = "fl_experiments"
        self.models_collection = "fl_models"
        self.metrics_collection = "fl_metrics"
    
    async def store_experiment(self, experiment_data: Dict[str, Any]) -> QueryResult:
        """Store federated learning experiment"""
        experiment_data["created_at"] = datetime.now(timezone.utc).isoformat()
        experiment_data["experiment_id"] = hashlib.sha256(f"{experiment_data['created_at']}{experiment_data['name']}".encode()).hexdigest()[:16]
        
        return await self.data_manager.execute_query(
            "insert_one",
            {"document": experiment_data},
            collection=self.experiments_collection
        )
    
    async def get_experiments(self, status: str = None, limit: int = 50) -> QueryResult:
        """Get federated learning experiments"""
        filter_params = {"status": status} if status else {}
        
        return await self.data_manager.execute_query(
            "find",
            {
                "filter": filter_params,
                "limit": limit,
                "sort": [("created_at", -1)]
            },
            collection=self.experiments_collection,
            use_cache=True,
            cache_ttl=120
        )
    
    async def store_model_metrics(self, metrics_data: Dict[str, Any]) -> QueryResult:
        """Store model training metrics"""
        metrics_data["timestamp"] = datetime.now(timezone.utc).isoformat()
        metrics_data["metrics_id"] = hashlib.sha256(f"{metrics_data['timestamp']}{metrics_data['experiment_id']}".encode()).hexdigest()[:16]
        
        return await self.data_manager.execute_query(
            "insert_one",
            {"document": metrics_data},
            collection=self.metrics_collection
        )
    
    async def get_experiment_metrics(self, experiment_id: str) -> QueryResult:
        """Get metrics for specific experiment"""
        return await self.data_manager.execute_query(
            "find",
            {
                "filter": {"experiment_id": experiment_id},
                "sort": [("timestamp", 1)]
            },
            collection=self.metrics_collection,
            use_cache=True,
            cache_ttl=60
        )

# Global data manager instance
enterprise_data_manager = EnterpriseDataManager()

async def initialize_database_system() -> bool:
    """Initialize the database system with fallback configurations"""
    configs = []
    
    # Try MongoDB first
    if MONGODB_AVAILABLE:
        mongodb_config = DatabaseConfig(
            db_type="mongodb",
            connection_string=os.getenv("MONGODB_URL", "mongodb://localhost:27017"),
            database_name="agisfl_enterprise",
            max_connections=20,
            connection_timeout=10,
            enable_ssl=False  # Disable SSL for local development
        )
        configs.append(mongodb_config)
    
    # Fallback to SQLite
    if SQLITE_AVAILABLE:
        sqlite_config = DatabaseConfig(
            db_type="sqlite",
            connection_string="./data/agisfl_enterprise.db",
            database_name="agisfl_sqlite",
            max_connections=5
        )
        configs.append(sqlite_config)
    
    if not configs:
        logger.error("No database drivers available")
        return False
    
    return await enterprise_data_manager.initialize(configs)

# Export key components
__all__ = [
    'DatabaseConfig',
    'QueryResult',
    'DatabaseConnectionPool',
    'EnterpriseDataManager',
    'SecurityDataManager',
    'FederatedLearningDataManager',
    'enterprise_data_manager',
    'initialize_database_system'
]
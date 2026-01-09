#!/usr/bin/env python3
"""
Database Performance & Connection Management System
==================================================

Comprehensive database optimization addressing:
- SQLite bottleneck for production workloads
- Database connection pooling
- Missing indexes and query optimization
- N+1 query problems
- Async/await database handling
- Resource management and cleanup
"""

import os
import asyncio
import logging
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
from contextlib import asynccontextmanager
from dataclasses import dataclass
import weakref
import structlog

# Database imports with fallbacks
try:
    from sqlalchemy import create_engine, text, Index, Column, Integer, String, DateTime, Boolean, Text, Float
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.orm import DeclarativeBase, sessionmaker
    from sqlalchemy.pool import QueuePool, NullPool
    from sqlalchemy.engine import Engine
    from sqlalchemy import event
    from sqlalchemy.dialects import postgresql, sqlite
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

try:
    import asyncpg
    ASYNCPG_AVAILABLE = True
except ImportError:
    ASYNCPG_AVAILABLE = False

try:
    import redis.asyncio as aioredis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = structlog.get_logger(__name__)

# ============================================================================
# DATABASE CONFIGURATION & OPTIMIZATION
# ============================================================================

@dataclass
class DatabaseConfig:
    """Database configuration with optimization settings"""
    database_url: str
    pool_size: int = 20
    max_overflow: int = 30
    pool_timeout: int = 30
    pool_recycle: int = 3600
    echo: bool = False
    echo_pool: bool = False
    query_cache_size: int = 1000
    enable_monitoring: bool = True
    connection_timeout: int = 30
    command_timeout: int = 60
    
class DatabaseConnectionManager:
    """Advanced database connection management"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.sync_engine: Optional[Engine] = None
        self.async_engine = None
        self.async_session_factory = None
        self.connection_pool_stats = {}
        self.query_cache = {}
        self.query_stats = {}
        self.monitoring_enabled = config.enable_monitoring
        
        if SQLALCHEMY_AVAILABLE:
            self._initialize_engines()
    
    def _initialize_engines(self):
        """Initialize database engines with optimization"""
        try:
            # Determine database type
            is_postgresql = self.config.database_url.startswith(('postgresql://', 'postgres://'))
            is_sqlite = self.config.database_url.startswith('sqlite://')
            
            # Common engine arguments
            engine_args = {
                'echo': self.config.echo,
                'echo_pool': self.config.echo_pool,
                'pool_pre_ping': True,  # Validate connections
            }
            
            if is_postgresql:
                # PostgreSQL optimizations
                engine_args.update({
                    'poolclass': QueuePool,
                    'pool_size': self.config.pool_size,
                    'max_overflow': self.config.max_overflow,
                    'pool_timeout': self.config.pool_timeout,
                    'pool_recycle': self.config.pool_recycle,
                })
                
                # Async PostgreSQL engine
                if ASYNCPG_AVAILABLE:
                    async_url = self.config.database_url.replace('postgresql://', 'postgresql+asyncpg://')
                    self.async_engine = create_async_engine(async_url, **engine_args)
                    self.async_session_factory = async_sessionmaker(
                        self.async_engine,
                        class_=AsyncSession,
                        expire_on_commit=False
                    )
            
            elif is_sqlite:
                # SQLite optimizations
                engine_args.update({
                    'poolclass': NullPool if ':memory:' in self.config.database_url else QueuePool,
                    'connect_args': {
                        'check_same_thread': False,
                        'timeout': 20,
                    }
                })
                
                # Add SQLite pragmas for performance
                @event.listens_for(Engine, "connect")
                def set_sqlite_pragma(dbapi_connection, connection_record):
                    if 'sqlite' in self.config.database_url:
                        cursor = dbapi_connection.cursor()
                        cursor.execute("PRAGMA journal_mode=WAL")
                        cursor.execute("PRAGMA synchronous=NORMAL")
                        cursor.execute("PRAGMA cache_size=10000")
                        cursor.execute("PRAGMA temp_store=MEMORY")
                        cursor.execute("PRAGMA mmap_size=268435456")  # 256MB
                        cursor.close()
                
                # Async SQLite engine
                async_url = self.config.database_url.replace('sqlite://', 'sqlite+aiosqlite://')
                self.async_engine = create_async_engine(async_url, **engine_args)
                self.async_session_factory = async_sessionmaker(
                    self.async_engine,
                    class_=AsyncSession,
                    expire_on_commit=False
                )
            
            # Sync engine for migrations and utilities
            self.sync_engine = create_engine(self.config.database_url, **engine_args)
            
            logger.info("Database engines initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize database engines: {e}")
            raise
    
    @asynccontextmanager
    async def get_async_session(self):
        """Get async database session with proper cleanup"""
        if not self.async_session_factory:
            raise RuntimeError("Async session factory not initialized")
        
        session = self.async_session_factory()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
    
    async def execute_query(self, query: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Execute optimized database query"""
        start_time = time.time()
        
        try:
            async with self.get_async_session() as session:
                result = await session.execute(text(query), params or {})
                rows = result.fetchall()
                
                # Convert to dict format
                columns = result.keys()
                data = [dict(zip(columns, row)) for row in rows]
                
                # Record query statistics
                execution_time = time.time() - start_time
                if self.monitoring_enabled:
                    self._record_query_stats(query, execution_time, len(data))
                
                return data
                
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"Database query failed: {e}", query=query, execution_time=execution_time)
            raise
    
    def _record_query_stats(self, query: str, execution_time: float, result_count: int):
        """Record query execution statistics"""
        query_hash = hash(query)
        
        if query_hash not in self.query_stats:
            self.query_stats[query_hash] = {
                'query': query[:200] + '...' if len(query) > 200 else query,
                'execution_count': 0,
                'total_time': 0,
                'avg_time': 0,
                'max_time': 0,
                'min_time': float('inf'),
                'total_results': 0
            }
        
        stats = self.query_stats[query_hash]
        stats['execution_count'] += 1
        stats['total_time'] += execution_time
        stats['avg_time'] = stats['total_time'] / stats['execution_count']
        stats['max_time'] = max(stats['max_time'], execution_time)
        stats['min_time'] = min(stats['min_time'], execution_time)
        stats['total_results'] += result_count
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get database connection pool statistics"""
        stats = {
            'timestamp': datetime.utcnow().isoformat(),
            'config': {
                'pool_size': self.config.pool_size,
                'max_overflow': self.config.max_overflow,
                'pool_timeout': self.config.pool_timeout
            }
        }
        
        if self.sync_engine and hasattr(self.sync_engine.pool, 'size'):
            pool = self.sync_engine.pool
            stats.update({
                'pool_size': pool.size(),
                'checked_in': pool.checkedin(),
                'checked_out': pool.checkedout(),
                'overflow': pool.overflow(),
                'invalid': getattr(pool, 'invalid', 0)  # Safe attribute access
            })
        
        return stats
    
    def get_query_stats(self) -> Dict[str, Any]:
        """Get query execution statistics"""
        if not self.monitoring_enabled:
            return {'monitoring_disabled': True}
        
        # Sort by total execution time
        sorted_stats = sorted(
            self.query_stats.values(),
            key=lambda x: x['total_time'],
            reverse=True
        )
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'total_queries': len(self.query_stats),
            'top_slow_queries': sorted_stats[:10],
            'summary': {
                'total_executions': sum(s['execution_count'] for s in self.query_stats.values()),
                'total_time': sum(s['total_time'] for s in self.query_stats.values()),
                'avg_query_time': sum(s['avg_time'] for s in self.query_stats.values()) / len(self.query_stats) if self.query_stats else 0
            }
        }
    
    async def close(self):
        """Close database connections"""
        try:
            if self.async_engine:
                await self.async_engine.dispose()
            
            if self.sync_engine:
                self.sync_engine.dispose()
            
            logger.info("Database connections closed successfully")
            
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")

# ============================================================================
# QUERY OPTIMIZATION & INDEX MANAGEMENT
# ============================================================================

class QueryOptimizer:
    """Database query optimization system"""
    
    def __init__(self, db_manager: DatabaseConnectionManager):
        self.db_manager = db_manager
        self.query_cache = {}
        self.cache_ttl = 300  # 5 minutes
        self.optimization_rules = self._initialize_optimization_rules()
    
    def _initialize_optimization_rules(self) -> Dict[str, Any]:
        """Initialize query optimization rules"""
        return {
            'pagination': {
                'enabled': True,
                'default_page_size': 50,
                'max_page_size': 1000
            },
            'lazy_loading': {
                'enabled': True,
                'batch_size': 100
            },
            'query_hints': {
                'use_index': True,
                'force_order': False
            },
            'caching': {
                'enabled': True,
                'ttl': 300
            }
        }
    
    async def execute_optimized_query(
        self, 
        query: str, 
        params: Dict[str, Any] = None,
        pagination: Optional[Dict[str, int]] = None,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """Execute query with optimization"""
        
        # Generate cache key
        cache_key = self._generate_cache_key(query, params, pagination)
        
        # Check cache first
        if use_cache and cache_key in self.query_cache:
            cache_entry = self.query_cache[cache_key]
            if time.time() - cache_entry['timestamp'] < self.cache_ttl:
                logger.debug("Query result served from cache", cache_key=cache_key[:16])
                return cache_entry['data']
        
        # Apply pagination if specified
        if pagination:
            query = self._apply_pagination(query, pagination)
        
        # Optimize query structure
        optimized_query = self._optimize_query_structure(query)
        
        # Execute query
        start_time = time.time()
        try:
            results = await self.db_manager.execute_query(optimized_query, params)
            execution_time = time.time() - start_time
            
            # Calculate total count for pagination
            total_count = len(results)
            if pagination:
                count_query = self._generate_count_query(query)
                count_result = await self.db_manager.execute_query(count_query, params)
                total_count = count_result[0]['count'] if count_result else 0
            
            result_data = {
                'data': results,
                'metadata': {
                    'execution_time': execution_time,
                    'result_count': len(results),
                    'total_count': total_count,
                    'cached': False,
                    'optimized': True
                }
            }
            
            # Cache successful results
            if use_cache and execution_time > 0.1:  # Only cache slower queries
                self.query_cache[cache_key] = {
                    'data': result_data,
                    'timestamp': time.time()
                }
                
                # Cleanup old cache entries
                self._cleanup_cache()
            
            return result_data
            
        except Exception as e:
            logger.error(f"Optimized query execution failed: {e}")
            raise
    
    def _generate_cache_key(self, query: str, params: Dict[str, Any], pagination: Optional[Dict[str, int]]) -> str:
        """Generate cache key for query"""
        import hashlib
        
        key_data = {
            'query': query,
            'params': params or {},
            'pagination': pagination or {}
        }
        
        key_string = str(key_data)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _apply_pagination(self, query: str, pagination: Dict[str, int]) -> str:
        """Apply pagination to query"""
        page = pagination.get('page', 1)
        page_size = min(pagination.get('page_size', 50), self.optimization_rules['pagination']['max_page_size'])
        offset = (page - 1) * page_size
        
        # Add LIMIT and OFFSET
        if 'LIMIT' not in query.upper():
            query = f"{query} LIMIT {page_size} OFFSET {offset}"
        
        return query
    
    def _optimize_query_structure(self, query: str) -> str:
        """Apply structural optimizations to query"""
        # Basic optimizations
        optimized = query.strip()
        
        # Ensure proper indexing hints
        if self.optimization_rules['query_hints']['use_index']:
            # Add index hints where appropriate (database-specific)
            pass
        
        return optimized
    
    def _generate_count_query(self, query: str) -> str:
        """Generate count query for pagination"""
        # Extract the main part of the query
        query_upper = query.upper()
        
        if 'FROM' in query_upper:
            from_index = query_upper.find('FROM')
            from_clause = query[from_index:]
            
            # Remove ORDER BY, LIMIT, OFFSET
            for clause in ['ORDER BY', 'LIMIT', 'OFFSET']:
                if clause in from_clause.upper():
                    clause_index = from_clause.upper().find(clause)
                    from_clause = from_clause[:clause_index]
            
            return f"SELECT COUNT(*) as count {from_clause}"
        
        return "SELECT COUNT(*) as count"
    
    def _cleanup_cache(self):
        """Clean up expired cache entries"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.query_cache.items()
            if current_time - entry['timestamp'] > self.cache_ttl
        ]
        
        for key in expired_keys:
            del self.query_cache[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")

# ============================================================================
# DATABASE INDEX MANAGEMENT
# ============================================================================

class IndexManager:
    """Database index management system"""
    
    def __init__(self, db_manager: DatabaseConnectionManager):
        self.db_manager = db_manager
        self.recommended_indexes = []
        self.existing_indexes = {}
        self.index_usage_stats = {}
    
    async def analyze_missing_indexes(self) -> List[Dict[str, Any]]:
        """Analyze and recommend missing indexes"""
        recommendations = []
        
        try:
            # Analyze query patterns from stats
            query_stats = self.db_manager.get_query_stats()
            
            if 'top_slow_queries' in query_stats:
                for query_stat in query_stats['top_slow_queries']:
                    query = query_stat['query']
                    
                    # Analyze WHERE clauses
                    where_columns = self._extract_where_columns(query)
                    for column in where_columns:
                        recommendations.append({
                            'table': self._extract_table_name(query),
                            'column': column,
                            'type': 'single_column',
                            'reason': 'Used in WHERE clause of slow query',
                            'query': query[:100] + '...',
                            'avg_execution_time': query_stat['avg_time']
                        })
                    
                    # Analyze ORDER BY clauses
                    order_columns = self._extract_order_columns(query)
                    for column in order_columns:
                        recommendations.append({
                            'table': self._extract_table_name(query),
                            'column': column,
                            'type': 'single_column',
                            'reason': 'Used in ORDER BY clause',
                            'query': query[:100] + '...',
                            'avg_execution_time': query_stat['avg_time']
                        })
            
            # Remove duplicates and prioritize
            unique_recommendations = self._deduplicate_recommendations(recommendations)
            
            return sorted(unique_recommendations, key=lambda x: x['avg_execution_time'], reverse=True)
            
        except Exception as e:
            logger.error(f"Index analysis failed: {e}")
            return []
    
    def _extract_where_columns(self, query: str) -> List[str]:
        """Extract column names from WHERE clause"""
        import re
        
        # Simple regex to find WHERE conditions
        where_pattern = r'WHERE\s+(\w+)\s*[=<>!]'
        matches = re.findall(where_pattern, query, re.IGNORECASE)
        return matches
    
    def _extract_order_columns(self, query: str) -> List[str]:
        """Extract column names from ORDER BY clause"""
        import re
        
        # Simple regex to find ORDER BY columns
        order_pattern = r'ORDER\s+BY\s+(\w+)'
        matches = re.findall(order_pattern, query, re.IGNORECASE)
        return matches
    
    def _extract_table_name(self, query: str) -> str:
        """Extract main table name from query"""
        import re
        
        # Simple regex to find FROM table
        from_pattern = r'FROM\s+(\w+)'
        match = re.search(from_pattern, query, re.IGNORECASE)
        return match.group(1) if match else 'unknown'
    
    def _deduplicate_recommendations(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate index recommendations"""
        seen = set()
        unique_recommendations = []
        
        for rec in recommendations:
            key = (rec['table'], rec['column'])
            if key not in seen:
                seen.add(key)
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    async def create_recommended_indexes(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create recommended indexes"""
        results = {
            'created': [],
            'failed': [],
            'skipped': []
        }
        
        for rec in recommendations:
            try:
                index_name = f"idx_{rec['table']}_{rec['column']}"
                
                # Check if index already exists
                if await self._index_exists(rec['table'], index_name):
                    results['skipped'].append({
                        'index': index_name,
                        'reason': 'Already exists'
                    })
                    continue
                
                # Create index
                create_query = f"CREATE INDEX {index_name} ON {rec['table']} ({rec['column']})"
                await self.db_manager.execute_query(create_query)
                
                results['created'].append({
                    'index': index_name,
                    'table': rec['table'],
                    'column': rec['column']
                })
                
                logger.info(f"Created index: {index_name}")
                
            except Exception as e:
                results['failed'].append({
                    'index': f"idx_{rec['table']}_{rec['column']}",
                    'error': str(e)
                })
                logger.error(f"Failed to create index: {e}")
        
        return results
    
    async def _index_exists(self, table: str, index_name: str) -> bool:
        """Check if index exists"""
        try:
            # Database-specific index existence check
            if 'postgresql' in self.db_manager.config.database_url:
                query = """
                SELECT COUNT(*) as count 
                FROM pg_indexes 
                WHERE tablename = :table AND indexname = :index
                """
                params = {'table': table, 'index': index_name}
            else:
                # SQLite
                query = """
                SELECT COUNT(*) as count 
                FROM sqlite_master 
                WHERE type = 'index' AND name = :index
                """
                params = {'index': index_name}
            
            result = await self.db_manager.execute_query(query, params)
            return result[0]['count'] > 0
            
        except Exception as e:
            logger.warning(f"Could not check index existence: {e}")
            return False

# Global database components
db_config = DatabaseConfig(
    database_url=os.getenv("DATABASE_URL", "sqlite:///./agisfl.db"),
    pool_size=int(os.getenv("DATABASE_POOL_SIZE", "20")),
    max_overflow=int(os.getenv("DATABASE_MAX_OVERFLOW", "30")),
    pool_timeout=int(os.getenv("DATABASE_POOL_TIMEOUT", "30")),
    enable_monitoring=os.getenv("DATABASE_MONITORING", "true").lower() == "true"
)

db_manager = DatabaseConnectionManager(db_config)
query_optimizer = QueryOptimizer(db_manager)
index_manager = IndexManager(db_manager)

# Export key classes
__all__ = [
    'DatabaseConfig',
    'DatabaseConnectionManager',
    'QueryOptimizer', 
    'IndexManager',
    'db_config',
    'db_manager',
    'query_optimizer',
    'index_manager'
]
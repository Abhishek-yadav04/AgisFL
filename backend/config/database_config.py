"""
Database Configuration - PostgreSQL Primary with SQLite Fallback
"""
import os
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, JSON
import asyncio

logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

class DatabaseManager:
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.is_postgresql = False
        
    async def initialize(self):
        """Initialize database connection - PostgreSQL first, SQLite fallback"""
        # Try PostgreSQL first
        try:
            postgresql_url = "postgresql+asyncpg://postgres:admin@localhost:5432/agisfl_db"
            self.engine = create_async_engine(postgresql_url, echo=False)
            
            # Test connection
            async with self.engine.begin() as conn:
                from sqlalchemy import text
                await conn.execute(text("SELECT 1"))
            
            self.is_postgresql = True
            logger.info("Connected to PostgreSQL database: agisfl_db")
            
        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}")
            logger.info("🔄 Falling back to SQLite database")
            
            # Fallback to SQLite
            sqlite_path = os.path.join(os.getcwd(), "agisfl.db")
            sqlite_url = f"sqlite+aiosqlite:///{sqlite_path}"
            self.engine = create_async_engine(sqlite_url, echo=False)
            self.is_postgresql = False
            logger.info(f"Connected to SQLite database: {sqlite_path}")
        
        # Create session factory
        self.session_factory = async_sessionmaker(
            self.engine, 
            class_=AsyncSession, 
            expire_on_commit=False
        )
        
        # Create tables
        await self.create_tables()
    
    async def create_tables(self):
        """Create database tables"""
        try:
            async with self.engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created/verified")
        except Exception as e:
            logger.error(f"Failed to create tables: {e}")
    
    async def get_session(self):
        """Get database session"""
        if not self.session_factory:
            await self.initialize()
        return self.session_factory()
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")

# Global database manager
db_manager = DatabaseManager()

async def get_db():
    """Dependency to get database session"""
    async with db_manager.get_session() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_database():
    """Initialize database on startup"""
    await db_manager.initialize()

async def close_database():
    """Close database on shutdown"""
    await db_manager.close()
"""
Database Test API - Test PostgreSQL/SQLite operations
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from backend.config.database_config import get_db, db_manager
from backend.models.database_models import User, FLExperiment
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/test-connection")
async def test_database_connection():
    """Test database connection"""
    try:
        async with db_manager.get_session() as session:
            # Test basic query
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            
            return {
                "status": "success",
                "database_type": "PostgreSQL" if db_manager.is_postgresql else "SQLite",
                "connection": "active",
                "test_query": test_value == 1
            }
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return {
            "status": "error",
            "database_type": "PostgreSQL" if db_manager.is_postgresql else "SQLite",
            "connection": "failed",
            "error": str(e)
        }

@router.get("/tables")
async def list_tables():
    """List all database tables"""
    try:
        async with db_manager.get_session() as session:
            if db_manager.is_postgresql:
                query = text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
            else:
                query = text("SELECT name FROM sqlite_master WHERE type='table'")
            
            result = await session.execute(query)
            tables = [row[0] for row in result.fetchall()]
            
            return {
                "status": "success",
                "database_type": "PostgreSQL" if db_manager.is_postgresql else "SQLite",
                "tables": tables,
                "count": len(tables)
            }
    except Exception as e:
        logger.error(f"Failed to list tables: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

@router.post("/create-test-data")
async def create_test_data():
    """Create test data in database"""
    try:
        async with db_manager.get_session() as session:
            # Create test user
            test_user = User(
                username="test_user",
                email="test@agisfl.com",
                full_name="Test User",
                password_hash="test_hash",
                role="user"
            )
            session.add(test_user)
            
            # Create test experiment
            test_experiment = FLExperiment(
                name="Test Experiment",
                description="Test federated learning experiment",
                algorithm="fedavg",
                status="created"
            )
            session.add(test_experiment)
            
            await session.commit()
            
            return {
                "status": "success",
                "message": "Test data created successfully",
                "created": ["test_user", "test_experiment"]
            }
    except Exception as e:
        logger.error(f"Failed to create test data: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

@router.get("/users")
async def get_users():
    """Get all users from database"""
    try:
        async with db_manager.get_session() as session:
            result = await session.execute(text("SELECT username, email, role FROM users"))
            users = [{"username": row[0], "email": row[1], "role": row[2]} for row in result.fetchall()]
            
            return {
                "status": "success",
                "users": users,
                "count": len(users)
            }
    except Exception as e:
        logger.error(f"Failed to get users: {e}")
        return {
            "status": "error",
            "error": str(e)
        }
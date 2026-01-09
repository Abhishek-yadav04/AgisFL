import pytest
from backend.utils.database import db_manager

class TestDatabaseUtils:
    def test_connection_pool(self):
        pool = db_manager.get_pool()
        assert pool is not None

    def test_query_execution(self):
        result = db_manager.execute('SELECT 1')
        assert result == 1 or result is not None

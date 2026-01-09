import pytest
from backend.utils.logging_config import setup_logging

def test_setup_logging_runs():
    logger = setup_logging()
    assert logger is not None
    assert hasattr(logger, 'info')

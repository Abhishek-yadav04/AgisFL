import pytest
from backend.utils.security_utils import hash_sensitive_data

class TestAuthUtils:
    def test_hash_sensitive_data_uniqueness(self):
        val1 = hash_sensitive_data('password1')
        val2 = hash_sensitive_data('password2')
        assert val1 != val2

    def test_hash_sensitive_data_consistency(self):
        val1 = hash_sensitive_data('password1')
        val2 = hash_sensitive_data('password1')
        assert val1 == val2

import pytest
from backend.utils.security_utils import hash_sensitive_data, secure_log

class TestSecurityUtils:
    def test_hash_sensitive_data(self):
        value = 'secret'
        hashed = hash_sensitive_data(value)
        assert isinstance(hashed, str)
        assert hashed != value

    def test_secure_log(self):
        log = secure_log('Sensitive info')
        assert 'Sensitive info' in log

import pytest
from backend.utils.security_utils import hash_sensitive_data
from backend.utils.error_handling_secure import sanitize_log_input

class TestWhiteBox:
    def test_hash_sensitive_data_internal(self):
        # Directly test internal logic
        assert hash_sensitive_data('test') != 'test'

    def test_sanitize_log_input_internal(self):
        # Directly test sanitization logic
        assert sanitize_log_input('<script>bad</script>') == '[REDACTED]'

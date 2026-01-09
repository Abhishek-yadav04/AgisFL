import pytest
from backend.utils.error_handling_secure import sanitize_log_input

class TestErrorHandling:
    def test_sanitize_log_input_removes_script(self):
        log = "<script>alert('xss')</script>"
        sanitized = sanitize_log_input(log)
        assert "<script>" not in sanitized

    def test_sanitize_log_input_allows_safe(self):
        log = "Normal log entry"
        sanitized = sanitize_log_input(log)
        assert sanitized == log

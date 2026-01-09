import pytest
from backend.core.input_validation import validate_input

class TestInputValidation:
    def test_valid_input(self):
        valid_data = {"username": "user1", "password": "StrongPass123!"}
        result = validate_input(valid_data)
        assert result is True

    def test_missing_fields(self):
        invalid_data = {"username": "user1"}
        with pytest.raises(Exception):
            validate_input(invalid_data)

    def test_xss_attack(self):
        malicious_data = {"username": "<script>alert('xss')</script>", "password": "test123"}
        with pytest.raises(Exception):
            validate_input(malicious_data)

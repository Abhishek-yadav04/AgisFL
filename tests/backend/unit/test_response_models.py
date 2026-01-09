import pytest
from backend.utils.response_models import BaseResponse, ErrorResponse

def test_base_response():
    resp = BaseResponse(success=True, message='Operation successful')
    assert resp.success is True
    assert resp.message == 'Operation successful'

def test_error_response():
    resp = ErrorResponse(success=False, message='Something went wrong', error_code='TEST_ERROR')
    assert resp.success is False
    assert resp.message == 'Something went wrong'
    assert resp.error_code == 'TEST_ERROR'

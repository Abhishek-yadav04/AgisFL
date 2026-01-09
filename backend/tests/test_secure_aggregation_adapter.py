import pytest

from backend.core import secure_aggregation_adapter as adapter


def test_get_secure_aggregation_impl_returns_object():
    impl = adapter.get_secure_aggregation_impl()
    assert impl is not None
    # Implementation should expose aggregate_encrypted
    assert hasattr(impl, 'aggregate_encrypted')


def test_xor_placeholder_behavior():
    # Force fallback by temporarily monkeypatching loader
    orig_loader = adapter.load_secure_aggregation

    def broken_loader():
        raise ImportError("force fallback")

    adapter.load_secure_aggregation = broken_loader
    try:
        # Reset internal impl
        adapter._secure_aggregation_impl = None
        impl = adapter.get_secure_aggregation_impl()
        assert getattr(impl, 'name', None) == 'xor_placeholder'
        data1 = b'hello----12'
        data2 = b'world----34'
        agg = impl.aggregate_encrypted([data1, data2])
        assert isinstance(agg, (bytes, bytearray))
    finally:
        adapter.load_secure_aggregation = orig_loader

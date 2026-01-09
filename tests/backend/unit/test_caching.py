import pytest
from backend.utils.caching import HybridCache, CacheConfig

class TestCaching:
    def test_cache_set_get(self):
        config = CacheConfig(default_ttl=10, max_memory_size=1024*1024, max_items=100)
        cache = HybridCache(config)
        cache.set('key', 'value')
        assert cache.get('key') == 'value'

    def test_cache_expiry(self):
        config = CacheConfig(default_ttl=1, max_memory_size=1024*1024, max_items=100)
        cache = HybridCache(config)
        cache.set('key', 'value')
        import time; time.sleep(2)
        assert cache.get('key') is None

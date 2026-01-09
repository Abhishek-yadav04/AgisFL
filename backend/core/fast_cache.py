import time
from typing import Dict, Any, Optional

class FastCache:
    def __init__(self, max_size=1000):
        self.cache = {}
        self.max_size = max_size
        
    def get(self, key):
        if key in self.cache:
            entry = self.cache[key]
            if entry["expires"] > time.time():
                return entry["value"]
            else:
                del self.cache[key]
        return None
    
    def set(self, key, value, ttl=30):
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["created"])
            del self.cache[oldest_key]
        
        self.cache[key] = {
            "value": value,
            "expires": time.time() + ttl,
            "created": time.time()
        }

# Global cache instance
fast_cache = FastCache()

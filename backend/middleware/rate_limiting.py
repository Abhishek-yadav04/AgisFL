# Stub for RateLimitConfig for test compatibility
class RateLimitConfig:
    def __init__(self, requests_per_minute=60, requests_per_hour=1000, burst_size=10):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_size = burst_size

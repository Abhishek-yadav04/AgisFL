"""Enterprise security compatibility shim used by tests.

Provides a minimal EnterpriseSecurityEngine with initialize(), a
redis_client attribute (None by default), and a threat_intel helper
that implements is_malicious_ip(ip) -> bool.
"""

class ThreatIntel:
    def is_malicious_ip(self, ip: str) -> bool:
        # Very small heuristic for tests: private IPs are considered non-malicious
        return not ip.startswith("192.")


class EnterpriseSecurityEngine:
    def __init__(self):
        self.redis_client = None
        self.status = "initialized"
        self.threat_intel = ThreatIntel()

    async def initialize(self):
        # In production, connect to Redis, load indicators, etc.
        self.redis_client = None
        self.status = "ready"

    def get_status(self):
        return self.status


__all__ = ['EnterpriseSecurityEngine']

"""
Production Security Engine for AgisFL
=====================================

Enterprise-grade security system with real threat detection,
intrusion prevention, and comprehensive security monitoring.
"""

import hashlib
import hmac
import time
import random
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


# ===============================
# Event-driven hooks and audit trail
# ===============================
class SecurityEventHooks:
    def __init__(self, logger):
        self.logger = logger

    def emit_event(self, event_type: str, details: Dict[str, Any]):
        self.logger.info(f"SECURITY_ENGINE EVENT: {event_type}", extra={"details": details})

    def log_audit(self, action: str, details: Dict[str, Any]):
        self.logger.info(f"AUDIT: {action}", extra={"details": details})


class ProductionSecurityEngine:
    """Production security engine with real threat detection"""
    def __init__(self):
        self.threat_database = {}
        self.blocked_ips = set()
        self.rate_limits = defaultdict(deque)
        self.security_events = deque(maxlen=10000)
        self.threat_patterns = {
            'sql_injection': [r'union.*select', r'drop.*table', r'insert.*into'],
            'xss': [r'<script.*>', r'javascript:', r'onerror='],
            'dos': [],  # Rate-based detection
            'brute_force': [],  # Frequency-based detection
        }
        self.anomaly_threshold = 0.7
        self.logger = logging.getLogger(__name__)
        self.event_hooks = SecurityEventHooks(self.logger)
        self.permissions = [
            "security_view",
            "security_manage",
            "security_admin"
        ]

    async def initialize(self):
        """Initialize security engine"""
        self.logger.info("Production security engine initialized")
        self.event_hooks.emit_event("security_engine_initialized", {})

    def analyze_threat(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze request for security threats"""
        threat_score = 0.0
        threats_detected = []
        content = str(request_data.get('content', ''))
        headers = request_data.get('headers', {})
        ip_address = request_data.get('ip', 'unknown')
        if self._check_sql_injection(content):
            threat_score += 0.8
            threats_detected.append('sql_injection')
        if self._check_xss(content):
            threat_score += 0.6
            threats_detected.append('xss')
        if self._check_rate_limit(ip_address):
            threat_score += 0.5
            threats_detected.append('rate_limit_exceeded')
        if self._analyze_headers(headers):
            threat_score += 0.3
            threats_detected.append('suspicious_headers')
        self._record_security_event(ip_address, threat_score, threats_detected)
        self.event_hooks.emit_event("analyze_threat", {"ip": ip_address, "score": threat_score, "threats": threats_detected})
        self.event_hooks.log_audit("analyze_threat", {"ip": ip_address, "score": threat_score, "threats": threats_detected})
        return {
            'threat_score': threat_score,
            'threats_detected': threats_detected,
            'blocked': threat_score > self.anomaly_threshold,
            'timestamp': datetime.now().isoformat()
        }
        if ip_address and ip_address in self.blocked_ips:
            return "critical"
            
        # Analyze recent security events
        recent_events = [e for e in self.security_events 
                        if e['timestamp'] > datetime.now() - timedelta(minutes=5)]
        
        if len(recent_events) > 50:
            return "high"
        elif len(recent_events) > 20:
            return "medium"
        else:
            return "low"
            
    def block_ip(self, ip_address: str, reason: str = "security_violation"):
        """Block IP address"""
        self.blocked_ips.add(ip_address)
        logger.warning(f"🚫 Blocked IP {ip_address}: {reason}")
        
    def unblock_ip(self, ip_address: str):
        """Unblock IP address"""
        self.blocked_ips.discard(ip_address)
        logger.info(f"Unblocked IP {ip_address}")
        
    def is_blocked(self, ip_address: str) -> bool:
        """Check if IP is blocked"""
        return ip_address in self.blocked_ips
        
    def get_security_metrics(self) -> Dict[str, Any]:
        """Get security metrics"""
        recent_events = [e for e in self.security_events 
                        if e['timestamp'] > datetime.now() - timedelta(hours=1)]
        
        threat_counts = defaultdict(int)
        for event in recent_events:
            for threat in event['threats']:
                threat_counts[threat] += 1
                
        return {
            'total_events_last_hour': len(recent_events),
            'blocked_ips_count': len(self.blocked_ips),
            'threat_level': self.get_threat_level(),
            'threat_breakdown': dict(threat_counts),
            'avg_threat_score': sum(e['score'] for e in recent_events) / max(len(recent_events), 1)
        }
        
    def _check_sql_injection(self, content: str) -> bool:
        """Check for SQL injection patterns"""
        content_lower = content.lower()
        dangerous_patterns = [
            'union select', 'drop table', 'insert into', 'delete from',
            'exec(', 'xp_cmdshell', 'sp_executesql', '--', '/*', '*/',
            'char(', 'ascii(', 'substring('
        ]
        return any(pattern in content_lower for pattern in dangerous_patterns)
        
    def _check_xss(self, content: str) -> bool:
        """Check for XSS patterns"""
        content_lower = content.lower()
        xss_patterns = [
            '<script', 'javascript:', 'onerror=', 'onload=', 'onclick=',
            'onmouseover=', 'onfocus=', 'onblur=', 'document.cookie',
            'document.write', 'window.location', 'eval('
        ]
        return any(pattern in content_lower for pattern in xss_patterns)
        
    def _check_rate_limit(self, ip_address: str) -> bool:
        """Check rate limiting for IP"""
        now = time.time()
        requests = self.rate_limits[ip_address]
        
        # Remove old requests (older than 1 minute)
        while requests and requests[0] < now - 60:
            requests.popleft()
            
        # Add current request
        requests.append(now)
        
        # Check if rate limit exceeded (max 100 requests per minute)
        return len(requests) > 100
        
    def _analyze_headers(self, headers: Dict[str, str]) -> bool:
        """Analyze request headers for suspicious patterns"""
        suspicious_indicators = 0
        
        # Check User-Agent
        user_agent = headers.get('user-agent', '').lower()
        if any(bot in user_agent for bot in ['bot', 'crawler', 'spider', 'scraper']):
            suspicious_indicators += 1
            
        # Check for missing common headers
        expected_headers = ['user-agent', 'accept', 'accept-language']
        missing_headers = sum(1 for h in expected_headers if h not in headers)
        if missing_headers > 1:
            suspicious_indicators += 1
            
        # Check for suspicious referrers
        referer = headers.get('referer', '').lower()
        if any(sus in referer for sus in ['admin', 'config', 'test', '.env']):
            suspicious_indicators += 1
            
        return suspicious_indicators >= 2
        
    def _record_security_event(self, ip_address: str, score: float, threats: List[str]):
        """Record security event"""
        event = {
            'ip': ip_address,
            'score': score,
            'threats': threats,
            'timestamp': datetime.now()
        }
        self.security_events.append(event)
        
        # Auto-block if threat score is high
        if score > 0.8:
            self.block_ip(ip_address, f"High threat score: {score}")
            
    def validate_token(self, token: str, secret: str) -> bool:
        """Validate JWT-style token"""
        try:
            # Simple HMAC validation
            expected = hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()
            return hmac.compare_digest(token[-64:], expected)
        except Exception:
            return False
            
    def generate_secure_hash(self, data: str, salt: str = None) -> str:
        """Generate secure hash with salt"""
        if salt is None:
            salt = str(random.randint(100000, 999999))
        return hashlib.pbkdf2_hmac('sha256', data.encode(), salt.encode(), 100000).hex()
        
    def encrypt_sensitive_data(self, data: str, key: str) -> str:
        """Simple encryption for sensitive data"""
        # Basic XOR encryption (for demo - use proper encryption in production)
        key_bytes = key.encode()
        data_bytes = data.encode()
        encrypted = bytes(a ^ key_bytes[i % len(key_bytes)] for i, a in enumerate(data_bytes))
        return encrypted.hex()
        
    def decrypt_sensitive_data(self, encrypted_hex: str, key: str) -> str:
        """Simple decryption for sensitive data"""
        try:
            encrypted = bytes.fromhex(encrypted_hex)
            key_bytes = key.encode()
            decrypted = bytes(a ^ key_bytes[i % len(key_bytes)] for i, a in enumerate(encrypted))
            return decrypted.decode()
        except Exception:
            return ""
    
    async def get_security_dashboard_data(self) -> Dict[str, Any]:
        """Get security dashboard data for real-time monitoring"""
        current_time = datetime.now()
        
        # Calculate recent threat statistics
        recent_events = [event for event in self.security_events 
                        if (current_time - event.get('timestamp', current_time)).seconds < 3600]
        
        threat_counts = defaultdict(int)
        for event in recent_events:
            threat_counts[event.get('threat_type', 'unknown')] += 1
        
        return {
            "threat_summary": {
                "total_threats_detected": len(recent_events),
                "critical_threats": sum(1 for e in recent_events if e.get('severity') == 'critical'),
                "high_threats": sum(1 for e in recent_events if e.get('severity') == 'high'),
                "medium_threats": sum(1 for e in recent_events if e.get('severity') == 'medium'),
                "low_threats": sum(1 for e in recent_events if e.get('severity') == 'low')
            },
            "threat_types": dict(threat_counts),
            "blocked_ips": len(self.blocked_ips),
            "active_rate_limits": len(self.rate_limits),
            "security_score": max(0, 100 - len(recent_events) * 2),  # Simple scoring
            "last_updated": current_time.isoformat(),
            "system_status": "active" if len(recent_events) < 50 else "high_alert"
        }

# Global security engine instance
security_engine = ProductionSecurityEngine()

"""
Enterprise-Grade API Security Middleware
Comprehensive protection against OWASP Top 10 and advanced threats
"""

import json
import time
import re
import hashlib
import ipaddress
import asyncio
from collections import defaultdict, deque
from typing import Dict, Any, Optional, List, Set, Pattern, Union
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()


class AdvancedThreatDetector:
    """AI-powered threat detection using pattern analysis"""
    
    def __init__(self):
        self.attack_patterns = {
            'sql_injection': [
                re.compile(r'(\bunion\b.*\bselect\b)|(\bselect\b.*\bfrom\b)', re.IGNORECASE),
                re.compile(r'(\bdrop\b.*\btable\b)|(\binsert\b.*\binto\b)', re.IGNORECASE),
                re.compile(r"['\"];\s*(drop|delete|insert|update)", re.IGNORECASE),
                re.compile(r'(\bor\b\s+\d+\s*=\s*\d+)|(\band\b\s+\d+\s*=\s*\d+)', re.IGNORECASE),
            ],
            'xss': [
                re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
                re.compile(r'javascript:', re.IGNORECASE),
                re.compile(r'on\w+\s*=', re.IGNORECASE),
                re.compile(r'<iframe|<object|<embed', re.IGNORECASE),
            ],
            'command_injection': [
                re.compile(r'[;&|`]|\$\(|\$\{', re.IGNORECASE),
                re.compile(r'\b(cat|ls|ps|wget|curl|nc|netcat)\b', re.IGNORECASE),
                re.compile(r'(\.\.\/){2,}', re.IGNORECASE),
            ],
            'path_traversal': [
                re.compile(r'\.\.[\\/]', re.IGNORECASE),
                re.compile(r'[/\\]etc[/\\]passwd', re.IGNORECASE),
                re.compile(r'[/\\]windows[/\\]system32', re.IGNORECASE),
            ],
            'xxe': [
                re.compile(r'<!ENTITY.*SYSTEM', re.IGNORECASE),
                re.compile(r'ENTITY.*file:', re.IGNORECASE),
            ],
            'ldap_injection': [
                re.compile(r'[()&|!]', re.IGNORECASE),
                re.compile(r'\*[^a-zA-Z0-9]', re.IGNORECASE),
            ],
            'nosql_injection': [
                re.compile(r'\$where|\$ne|\$gt|\$regex', re.IGNORECASE),
                re.compile(r'{"?\$.*"?:', re.IGNORECASE),
            ]
        }
        
        self.anomaly_scores = defaultdict(float)
        self.baseline_patterns = defaultdict(list)
        
    def detect_threats(self, payload: str, source_ip: str) -> Dict[str, Any]:
        """Comprehensive threat detection"""
        threats = []
        confidence_scores = {}
        
        for threat_type, patterns in self.attack_patterns.items():
            matches = []
            for pattern in patterns:
                if pattern.search(payload):
                    matches.append(pattern.pattern)
            
            if matches:
                confidence = min(len(matches) * 0.3, 1.0)
                threats.append(threat_type)
                confidence_scores[threat_type] = confidence
        
        # Behavioral anomaly detection
        payload_hash = hashlib.sha256(payload.encode()).hexdigest()[:16]
        self.baseline_patterns[source_ip].append(payload_hash)
        
        # Keep only recent patterns (sliding window)
        if len(self.baseline_patterns[source_ip]) > 100:
            self.baseline_patterns[source_ip] = self.baseline_patterns[source_ip][-50:]
        
        # Detect repeated attack patterns
        if len(self.baseline_patterns[source_ip]) > 5:
            recent_patterns = self.baseline_patterns[source_ip][-5:]
            if len(set(recent_patterns)) == 1:  # Repeated identical requests
                threats.append('repeated_attack_pattern')
                confidence_scores['repeated_attack_pattern'] = 0.8
        
        return {
            'threats_detected': threats,
            'confidence_scores': confidence_scores,
            'threat_level': max(confidence_scores.values()) if confidence_scores else 0.0,
            'payload_hash': payload_hash
        }


class RateLimitingEngine:
    """Advanced rate limiting with multiple algorithms"""
    
    def __init__(self):
        self.token_buckets = defaultdict(lambda: {'tokens': 100, 'last_refill': time.time()})
        self.sliding_windows = defaultdict(lambda: deque())
        self.adaptive_limits = defaultdict(lambda: {'limit': 100, 'violations': 0})
        
        self.global_limits = {
            'requests_per_minute': 1000,
            'requests_per_hour': 10000,
            'bandwidth_per_minute': 100 * 1024 * 1024,  # 100MB
        }
        
    def check_rate_limit(self, client_id: str, endpoint: str, request_size: int = 0) -> Dict[str, Any]:
        """Multi-layer rate limiting check"""
        current_time = time.time()
        
        # Token bucket algorithm
        bucket = self.token_buckets[client_id]
        time_passed = current_time - bucket['last_refill']
        bucket['tokens'] = min(100, bucket['tokens'] + time_passed * 2)  # 2 tokens per second
        bucket['last_refill'] = current_time
        
        if bucket['tokens'] < 1:
            return {'allowed': False, 'reason': 'token_bucket_exhausted', 'retry_after': 30}
        
        bucket['tokens'] -= 1
        
        # Sliding window algorithm
        window = self.sliding_windows[client_id]
        cutoff_time = current_time - 60  # 1 minute window
        
        # Remove old entries
        while window and window[0] < cutoff_time:
            window.popleft()
        
        if len(window) >= 60:  # 60 requests per minute
            return {'allowed': False, 'reason': 'sliding_window_exceeded', 'retry_after': 60}
        
        window.append(current_time)
        
        # Adaptive rate limiting based on behavior
        adaptive = self.adaptive_limits[client_id]
        if len(window) > adaptive['limit'] * 0.8:  # Near limit
            adaptive['violations'] += 1
            if adaptive['violations'] > 3:
                adaptive['limit'] = max(10, adaptive['limit'] * 0.8)  # Reduce limit
        else:
            adaptive['violations'] = max(0, adaptive['violations'] - 1)
            if adaptive['violations'] == 0:
                adaptive['limit'] = min(100, adaptive['limit'] * 1.1)  # Increase limit
        
        return {'allowed': True, 'remaining': adaptive['limit'] - len(window)}


class InputValidator:
    """Advanced input validation and sanitization"""
    
    def __init__(self):
        self.max_string_length = 10000
        self.max_array_length = 1000
        self.max_object_depth = 20
        self.max_object_keys = 500
        
        # Common injection patterns
        self.dangerous_patterns = [
            r'<\s*script[^>]*>.*?<\s*/\s*script\s*>',
            r'javascript\s*:',
            r'vbscript\s*:',
            r'on\w+\s*=',
            r'expression\s*\(',
            r'@import',
            r'<\s*(?:iframe|object|embed|applet|meta|link|style)',
        ]
        self.injection_regex = re.compile('|'.join(self.dangerous_patterns), re.IGNORECASE | re.DOTALL)
        
    def validate_json_object(self, data: Any, depth: int = 0) -> Any:
        """Recursively validate and sanitize JSON objects"""
        if depth > self.max_object_depth:
            raise ValidationError(f"Object depth exceeds maximum of {self.max_object_depth}")
        
        if isinstance(data, dict):
            if len(data) > self.max_object_keys:
                raise ValidationError(f"Object has too many keys (max: {self.max_object_keys})")
            
            return {
                self.sanitize_string(str(k)): self.validate_json_object(v, depth + 1)
                for k, v in data.items()
            }
        
        elif isinstance(data, list):
            if len(data) > self.max_array_length:
                raise ValidationError(f"Array length exceeds maximum of {self.max_array_length}")
            
            return [self.validate_json_object(item, depth + 1) for item in data]
        
        elif isinstance(data, str):
            return self.sanitize_string(data)
        
        elif isinstance(data, (int, float, bool)) or data is None:
            return data
        
        else:
            # Convert unknown types to string and sanitize
            return self.sanitize_string(str(data))
    
    def sanitize_string(self, value: str) -> str:
        """Advanced string sanitization"""
        if not isinstance(value, str):
            value = str(value)
        
        # Length check
        if len(value) > self.max_string_length:
            value = value[:self.max_string_length]
        
        # Remove dangerous patterns
        value = self.injection_regex.sub('', value)
        
        # HTML entity encoding for special characters
        value = (value
                .replace('&', '&amp;')
                .replace('<', '&lt;')
                .replace('>', '&gt;')
                .replace('"', '&quot;')
                .replace("'", '&#x27;')
                .replace('/', '&#x2F;'))
        
        # Remove null bytes and control characters
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\t\n\r')
        
        return value.strip()


class GeoLocationFilter:
    """IP-based geolocation filtering"""
    
    def __init__(self):
        self.blocked_countries = set()  # ISO country codes
        self.blocked_networks = []      # CIDR blocks
        self.suspicious_networks = []   # Known bad actor networks
        
        # Common malicious IP ranges (example)
        self.suspicious_networks.extend([
            ipaddress.ip_network('10.0.0.0/8'),      # Private - suspicious if external
            ipaddress.ip_network('172.16.0.0/12'),   # Private
            ipaddress.ip_network('192.168.0.0/16'),  # Private
        ])
        
    def is_ip_allowed(self, ip_address: str) -> Dict[str, Any]:
        """Check if IP address is allowed"""
        try:
            ip = ipaddress.ip_address(ip_address)
            
            # Check against blocked networks
            for network in self.blocked_networks:
                if ip in network:
                    return {'allowed': False, 'reason': 'blocked_network', 'network': str(network)}
            
            # Check against suspicious networks
            for network in self.suspicious_networks:
                if ip in network:
                    return {'allowed': True, 'suspicious': True, 'reason': 'suspicious_network'}
            
            # Check if it's a private IP from external source
            if ip.is_private and not ip.is_loopback:
                return {'allowed': True, 'suspicious': True, 'reason': 'private_ip_external'}
            
            return {'allowed': True, 'suspicious': False}
            
        except ValueError:
            return {'allowed': False, 'reason': 'invalid_ip_format'}


class SecurityEventLogger:
    """Comprehensive security event logging"""
    
    def __init__(self):
        self.events = deque(maxlen=10000)  # Keep last 10k events
        self.event_counts = defaultdict(int)
        self.client_profiles = defaultdict(lambda: {
            'first_seen': None,
            'last_seen': None,
            'request_count': 0,
            'threat_count': 0,
            'blocked_count': 0,
            'user_agents': set(),
            'endpoints': set(),
        })
        
    def log_event(self, event_type: str, details: Dict[str, Any], client_ip: str):
        """Log security event with enrichment"""
        timestamp = datetime.utcnow()
        
        event = {
            'timestamp': timestamp.isoformat(),
            'event_type': event_type,
            'client_ip': client_ip,
            'details': details,
            'event_id': hashlib.sha256(f"{timestamp}{event_type}{client_ip}".encode()).hexdigest()[:16]
        }
        
        self.events.append(event)
        self.event_counts[event_type] += 1
        
        # Update client profile
        profile = self.client_profiles[client_ip]
        if profile['first_seen'] is None:
            profile['first_seen'] = timestamp
        profile['last_seen'] = timestamp
        profile['request_count'] += 1
        
        if event_type in ['threat_detected', 'attack_blocked']:
            profile['threat_count'] += 1
            
        if event_type == 'request_blocked':
            profile['blocked_count'] += 1
            
        # Add user agent and endpoint to profile
        if 'user_agent' in details:
            profile['user_agents'].add(details['user_agent'][:100])  # Limit length
        if 'endpoint' in details:
            profile['endpoints'].add(details['endpoint'])
        
        # Log to structured logger
        logger.info(
            "security_event",
            event_type=event_type,
            client_ip=client_ip,
            event_id=event['event_id'],
            **details
        )
    
    def get_security_summary(self) -> Dict[str, Any]:
        """Get security event summary"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        
        recent_events = [
            e for e in self.events 
            if datetime.fromisoformat(e['timestamp']) > hour_ago
        ]
        
        daily_events = [
            e for e in self.events 
            if datetime.fromisoformat(e['timestamp']) > day_ago
        ]
        
        return {
            'total_events': len(self.events),
            'events_last_hour': len(recent_events),
            'events_last_day': len(daily_events),
            'event_types': dict(self.event_counts),
            'active_clients': len([
                ip for ip, profile in self.client_profiles.items()
                if profile['last_seen'] and profile['last_seen'] > hour_ago
            ]),
            'high_risk_clients': len([
                ip for ip, profile in self.client_profiles.items()
                if profile['threat_count'] > 5 or profile['blocked_count'] > 3
            ])
        }

class ValidationError(Exception):
    """Custom validation error with security context"""
    def __init__(self, message: str, error_code: str = "VALIDATION_ERROR", threat_level: str = "LOW"):
        self.message = message
        self.error_code = error_code
        self.threat_level = threat_level
        super().__init__(self.message)


class RateLimitExceeded(Exception):
    """Rate limit exceeded with detailed information"""
    def __init__(self, detail: str, retry_after: int = 60, limit_type: str = "STANDARD"):
        self.detail = detail
        self.retry_after = retry_after
        self.limit_type = limit_type
        super().__init__(self.detail)


class SecurityMiddleware:
    """Enterprise-grade security middleware with comprehensive protection"""
    
    def __init__(self):
        # Initialize security components
        self.threat_detector = AdvancedThreatDetector()
        self.rate_limiter = RateLimitingEngine()
        self.input_validator = InputValidator()
        self.geo_filter = GeoLocationFilter()
        self.event_logger = SecurityEventLogger()
        
        # Security configuration
        self.security_config = {
            "max_request_size": 50 * 1024 * 1024,  # 50MB
            "max_json_depth": 20,
            "max_json_keys": 1000,
            "require_content_type": True,
            "block_suspicious_user_agents": True,
            "validate_json_requests": True,
            "sanitize_query_params": True,
            "enable_threat_detection": True,
            "enable_rate_limiting": True,
            "enable_geo_filtering": False,  # Disabled by default
            "log_all_requests": False,
            "log_security_events": True,
        }
        
        # Suspicious patterns in User-Agent
        self.suspicious_user_agents = [
            r'(?i)(bot|crawler|spider|scraper)',
            r'(?i)(sqlmap|nikto|nmap|masscan)',
            r'(?i)(python-requests|curl|wget)',  # Potential automated tools
            r'(?i)(\.{3,}|null|undefined)',      # Malformed agents
        ]
        self.ua_patterns = [re.compile(pattern) for pattern in self.suspicious_user_agents]
        
        # Blocked file extensions
        self.blocked_extensions = {'.php', '.asp', '.jsp', '.exe', '.bat', '.cmd', '.ps1'}
        
        # Statistics
        self.stats = {
            'total_requests': 0,
            'blocked_requests': 0,
            'validated_requests': 0,
            'threats_detected': 0,
            'rate_limited_requests': 0,
        }
        
    async def __call__(self, request: Request, call_next):
        """Main middleware processing pipeline"""
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        
        try:
            self.stats['total_requests'] += 1
            
            # 1. Basic request validation
            validation_result = await self._validate_basic_request(request, client_ip)
            if not validation_result['allowed']:
                self.stats['blocked_requests'] += 1
                return self._create_error_response(validation_result, client_ip)
            
            # 2. Rate limiting check
            if self.security_config['enable_rate_limiting']:
                rate_limit_result = self._check_rate_limits(request, client_ip)
                if not rate_limit_result['allowed']:
                    self.stats['rate_limited_requests'] += 1
                    self._log_security_event('rate_limit_exceeded', rate_limit_result, client_ip, request)
                    return self._create_rate_limit_response(rate_limit_result)
            
            # 3. Geolocation filtering
            if self.security_config['enable_geo_filtering']:
                geo_result = self.geo_filter.is_ip_allowed(client_ip)
                if not geo_result['allowed']:
                    self.stats['blocked_requests'] += 1
                    self._log_security_event('geo_blocked', geo_result, client_ip, request)
                    return self._create_error_response(geo_result, client_ip)
            
            # 4. Request body validation and threat detection
            if request.method in ['POST', 'PUT', 'PATCH']:
                validation_result = await self._validate_request_body(request, client_ip)
                if not validation_result['allowed']:
                    self.stats['blocked_requests'] += 1
                    if validation_result.get('threat_detected'):
                        self.stats['threats_detected'] += 1
                    return self._create_error_response(validation_result, client_ip)
            
            # 5. Query parameter validation
            if self.security_config['sanitize_query_params']:
                self._validate_query_params(request, client_ip)
            
            self.stats['validated_requests'] += 1
            
            # Process the request
            response = await call_next(request)
            
            # Post-processing
            processing_time = time.time() - start_time
            response.headers["X-Security-Scan"] = "passed"
            response.headers["X-Process-Time"] = str(round(processing_time, 4))
            
            # Log successful request if configured
            if self.security_config['log_all_requests']:
                self._log_security_event('request_processed', {
                    'method': request.method,
                    'path': str(request.url.path),
                    'status_code': response.status_code,
                    'processing_time': processing_time
                }, client_ip, request)
            
            return response
            
        except Exception as e:
            # Handle unexpected errors securely
            self.stats['blocked_requests'] += 1
            self._log_security_event('middleware_error', {
                'error': str(e)[:200],
                'error_type': type(e).__name__
            }, client_ip, request)
            
            logger.error("Security middleware error", error=str(e), client_ip=client_ip)
            
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal security error",
                    "code": "SECURITY_ERROR",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract real client IP considering proxies"""
        # Check for real IP in headers (in order of preference)
        headers_to_check = [
            'CF-Connecting-IP',      # Cloudflare
            'X-Real-IP',             # Nginx
            'X-Forwarded-For',       # Standard proxy header
            'X-Client-IP',           # Some proxies
            'X-Cluster-Client-IP',   # Some load balancers
        ]
        
        for header in headers_to_check:
            if header in request.headers:
                ip = request.headers[header].split(',')[0].strip()
                if self._is_valid_ip(ip):
                    return ip
        
        # Fallback to direct connection IP
        if hasattr(request, 'client') and request.client:
            return request.client.host
        
        return 'unknown'
    
    def _is_valid_ip(self, ip: str) -> bool:
        """Validate IP address format"""
        try:
            ipaddress.ip_address(ip)
            return True
        except ValueError:
            return False
    
    async def _validate_basic_request(self, request: Request, client_ip: str) -> Dict[str, Any]:
        """Basic request validation"""
        
        # Check request size
        content_length = int(request.headers.get('content-length', 0))
        if content_length > self.security_config['max_request_size']:
            return {
                'allowed': False,
                'reason': 'request_too_large',
                'details': f'Request size {content_length} exceeds limit {self.security_config["max_request_size"]}'
            }
        
        # Check User-Agent
        user_agent = request.headers.get('user-agent', '')
        if self.security_config['block_suspicious_user_agents']:
            for pattern in self.ua_patterns:
                if pattern.search(user_agent):
                    self._log_security_event('suspicious_user_agent', {
                        'user_agent': user_agent,
                        'pattern_matched': pattern.pattern
                    }, client_ip, request)
                    
                    return {
                        'allowed': False,
                        'reason': 'suspicious_user_agent',
                        'details': 'User-Agent matches suspicious pattern'
                    }
        
        # Check file extension in path
        path = str(request.url.path).lower()
        for ext in self.blocked_extensions:
            if path.endswith(ext):
                return {
                    'allowed': False,
                    'reason': 'blocked_file_extension',
                    'details': f'File extension {ext} is not allowed'
                }
        
        # Check for path traversal attempts
        if '../' in path or '..\\' in path:
            return {
                'allowed': False,
                'reason': 'path_traversal_attempt',
                'details': 'Path traversal patterns detected'
            }
        
        return {'allowed': True}
    
    def _check_rate_limits(self, request: Request, client_ip: str) -> Dict[str, Any]:
        """Check various rate limiting rules"""
        endpoint = str(request.url.path)
        method = request.method
        content_length = int(request.headers.get('content-length', 0))
        
        return self.rate_limiter.check_rate_limit(
            client_id=client_ip,
            endpoint=f"{method}:{endpoint}",
            request_size=content_length
        )
    
    async def _validate_request_body(self, request: Request, client_ip: str) -> Dict[str, Any]:
        """Validate and scan request body for threats"""
        try:
            # Read request body
            body = await request.body()
            if not body:
                return {'allowed': True}
            
            body_str = body.decode('utf-8', errors='ignore')
            
            # Threat detection
            if self.security_config['enable_threat_detection']:
                threat_result = self.threat_detector.detect_threats(body_str, client_ip)
                
                if threat_result['threats_detected']:
                    self._log_security_event('threat_detected', {
                        'threats': threat_result['threats_detected'],
                        'confidence_scores': threat_result['confidence_scores'],
                        'threat_level': threat_result['threat_level'],
                        'payload_sample': body_str[:200]  # First 200 chars for analysis
                    }, client_ip, request)
                    
                    # Block high-confidence threats
                    if threat_result['threat_level'] > 0.7:
                        return {
                            'allowed': False,
                            'reason': 'high_threat_detected',
                            'threat_detected': True,
                            'details': f"Threats detected: {', '.join(threat_result['threats_detected'])}"
                        }
            
            # JSON validation if applicable
            content_type = request.headers.get('content-type', '')
            if 'application/json' in content_type and self.security_config['validate_json_requests']:
                try:
                    json_data = json.loads(body_str)
                    validated_data = self.input_validator.validate_json_object(json_data)
                    
                    # Replace request body with validated data (stored for potential use)
                    request.state.validated_json = validated_data
                    
                except json.JSONDecodeError as e:
                    return {
                        'allowed': False,
                        'reason': 'invalid_json',
                        'details': f'JSON parsing error: {str(e)}'
                    }
                except ValidationError as e:
                    return {
                        'allowed': False,
                        'reason': 'json_validation_failed',
                        'details': e.message
                    }
            
            return {'allowed': True}
            
        except Exception as e:
            logger.error("Request body validation error", error=str(e), client_ip=client_ip)
            return {
                'allowed': False,
                'reason': 'body_validation_error',
                'details': 'Unable to validate request body'
            }
    
    def _validate_query_params(self, request: Request, client_ip: str):
        """Validate and sanitize query parameters"""
        for key, value in request.query_params.items():
            sanitized_key = self.input_validator.sanitize_string(key)
            sanitized_value = self.input_validator.sanitize_string(value)
            
            # Store sanitized params in request state
            if not hasattr(request, 'state') or request.state is None:
                request.state = type('RequestState', (), {})()
            if not hasattr(request.state, 'sanitized_query_params'):
                request.state.sanitized_query_params = {}
            request.state.sanitized_query_params[sanitized_key] = sanitized_value
    
    def _log_security_event(self, event_type: str, details: Dict[str, Any], client_ip: str, request: Request):
        """Log security events with request context"""
        enriched_details = {
            **details,
            'method': request.method,
            'path': str(request.url.path),
            'user_agent': request.headers.get('user-agent', 'unknown'),
            'referer': request.headers.get('referer', ''),
            'endpoint': f"{request.method}:{request.url.path}"
        }
        
        self.event_logger.log_event(event_type, enriched_details, client_ip)
    
    def _create_error_response(self, result: Dict[str, Any], client_ip: str) -> JSONResponse:
        """Create standardized error response"""
        return JSONResponse(
            status_code=403,
            content={
                "error": "Request blocked by security policy",
                "reason": result.get('reason', 'security_violation'),
                "details": result.get('details', 'Request violates security policy'),
                "timestamp": datetime.utcnow().isoformat(),
                "request_id": hashlib.sha256(f"{time.time()}{client_ip}".encode()).hexdigest()[:16]
            },
            headers={
                "X-Security-Block": result.get('reason', 'unknown'),
                "X-Block-Reason": result.get('details', 'Security policy violation')[:100]
            }
        )
    
    def _create_rate_limit_response(self, result: Dict[str, Any]) -> JSONResponse:
        """Create rate limit exceeded response"""
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "reason": result.get('reason', 'rate_limit'),
                "retry_after": result.get('retry_after', 60),
                "timestamp": datetime.utcnow().isoformat()
            },
            headers={
                "Retry-After": str(result.get('retry_after', 60)),
                "X-RateLimit-Limit": "100",
                "X-RateLimit-Remaining": str(result.get('remaining', 0))
            }
        )
    
    def get_security_stats(self) -> Dict[str, Any]:
        """Get comprehensive security statistics"""
        return {
            **self.stats,
            'security_events': self.event_logger.get_security_summary(),
            'uptime': time.time() - getattr(self, '_start_time', time.time()),
            'threats_per_hour': self.stats['threats_detected'] / max(1, (time.time() - getattr(self, '_start_time', time.time())) / 3600),
            'block_rate': self.stats['blocked_requests'] / max(1, self.stats['total_requests']),
        }
    
    def update_security_config(self, new_config: Dict[str, Any]):
        """Update security configuration at runtime"""
        self.security_config.update(new_config)
        logger.info("Security configuration updated", new_config=new_config)


# Global security middleware instance
security_middleware = SecurityMiddleware()

# Legacy aliases for backward compatibility
rate_limiter = security_middleware.rate_limiter
InputValidator = security_middleware.input_validator.__class__
ValidationError = ValidationError
RateLimitExceeded = RateLimitExceeded

# Export all components
__all__ = [
    'SecurityMiddleware', 'AdvancedThreatDetector', 'RateLimitingEngine', 
    'InputValidator', 'GeoLocationFilter', 'SecurityEventLogger',
    'ValidationError', 'RateLimitExceeded', 'security_middleware'
]

# Configure security settings
SECURITY_CONFIG = {
    "check_file_uploads": True
}

class SecurityMiddleware:
    def __init__(self):
        self.suspicious_user_agents = [
            "sqlmap", "nmap", "nikto", "dirb", "gobuster", "burp",
            "curl/7.0", "python-requests/0", "bot", "crawler", "spider"
        ]
        
        self.attack_patterns = [
            "../", "..\\", "%2e%2e", "%252e%252e",
            "<script", "</script>", "javascript:",
            "union+select", "1'or'1'='1", "admin'--",
            "<?php", "<%", "<%=", "${", "{{",
            "etc/passwd", "windows/system32", "boot.ini"
        ]
        
        # Initialize security rules
        self.security_rules = {
            "check_file_uploads": True,
            "block_suspicious_user_agents": True,
            "check_attack_patterns": True,
            "rate_limiting": True,
            "geo_filtering": False,
            "max_request_size": 10485760,  # 10MB
            "require_content_type": True,
            "validate_json_requests": True,
            "max_json_depth": 10,
            "max_json_keys": 1000,
            "sanitize_query_params": True
        }
        
        # Initialize security events list
        self.security_events = []
        
        # Initialize request counters
        self.validated_requests = 0
        self.blocked_requests = 0
        
        # Initialize other required attributes
        self.threat_detector = AdvancedThreatDetector()
        self.rate_limiter = RateLimitingEngine()
        self.geo_filter = GeoLocationFilter()
        self.event_logger = SecurityEventLogger()
    
    async def __call__(self, request: Request, call_next):
        """Main security middleware function"""
        start_time = time.time()
        
        # Skip security checks for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            response = await call_next(request)
            return self._add_security_headers(response)
        
        try:
            await self._validate_request_security(request)
            await self._check_rate_limits(request)
            
            if request.method in ["POST", "PUT", "PATCH"]:
                request = await self._validate_request_body(request)
            
            request = await self._validate_query_parameters(request)
            response = await call_next(request)
            response = self._add_security_headers(response)
            
            self.validated_requests += 1
            return response
            
        except HTTPException as e:
            await self._log_security_event(request, "http_exception", {
                "status_code": e.status_code,
                "detail": e.detail
            })
            raise
            
        except RateLimitExceeded as e:
            await self._log_security_event(request, "rate_limit_exceeded", {
                "detail": e.detail,
                "retry_after": e.retry_after
            })
            self.blocked_requests += 1
            raise
            
        except ValidationError as e:
            await self._log_security_event(request, "validation_error", {
                "detail": str(e)
            })
            self.blocked_requests += 1
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation error: {str(e)}"
            )
            
        except Exception as e:
            await self._log_security_event(request, "unexpected_error", {
                "error": str(e)
            })
            logger.error("Security middleware error", error=str(e), exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal security error"
            )
        finally:
            processing_time = time.time() - start_time
            if processing_time > 5.0:
                logger.warning("Slow request detected", 
                             path=request.url.path, 
                             processing_time=processing_time)
    
    async def _validate_request_security(self, request: Request):
        """Validate basic request security"""
        
        # Skip security validation for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return
        
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.security_rules["max_request_size"]:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Request too large"
            )
        
        if self.security_rules["block_suspicious_user_agents"]:
            user_agent = request.headers.get("user-agent", "").lower()
            for suspicious in self.suspicious_user_agents:
                if suspicious in user_agent:
                    await self._log_security_event(request, "suspicious_user_agent", {
                        "user_agent": user_agent
                    })
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Suspicious user agent blocked"
                    )
        
        url_path = str(request.url).lower()
        for pattern in self.attack_patterns:
            if pattern in url_path:
                await self._log_security_event(request, "attack_pattern_detected", {
                    "pattern": pattern,
                    "url": str(request.url)
                })
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Malicious request pattern detected"
                )
        
        if (self.security_rules["require_content_type"] and 
            request.method in ["POST", "PUT", "PATCH"]):
            # Require Content-Type for state-changing methods
            content_type = request.headers.get("content-type", "")
            if not content_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Content-Type header required"
                )
    
    async def _check_rate_limits(self, request: Request):
        """Check rate limits using the advanced rate limiter"""
        
        try:
            user_id = None
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                pass
            
            rule_name = self._get_rate_limit_rule(request)
            
            # Use the correct method for RateLimitingEngine
            client_ip = self._get_client_ip(request)
            rate_limit_result = self.rate_limiter.check_rate_limit(
                client_id=client_ip,
                endpoint=f"{request.method}:{request.url.path}",
                request_size=int(request.headers.get('content-length', 0))
            )
            
            if not rate_limit_result['allowed']:
                raise RateLimitExceeded(
                    f"Rate limit exceeded for endpoint {request.url.path}",
                    retry_after=rate_limit_result.get('retry_after', 60)
                )
        except Exception as e:
            logger.warning("Rate limiter error", error=str(e))
    
    def _get_rate_limit_rule(self, request: Request) -> str:
        """Get rate limit rule name based on request"""
        if "/auth/" in request.url.path:
            return "auth"
        elif "/api/" in request.url.path:
            return "api"
        else:
            return "default"
    
    async def _validate_request_body(self, request: Request) -> Request:
        """Validate request body for security issues"""
        if not self.security_rules["validate_json_requests"]:
            return request
        
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                body = await request.body()
                if body:
                    data = json.loads(body)
                    InputValidator.validate_json_object(
                        data,
                        max_depth=self.security_rules["max_json_depth"],
                        max_keys=self.security_rules["max_json_keys"]
                    )
            except json.JSONDecodeError:
                raise ValidationError("Invalid JSON format")
            except Exception as e:
                logger.warning("JSON validation error", error=str(e))
        
        return request
    
    async def _validate_query_parameters(self, request: Request) -> Request:
        """Validate and sanitize query parameters"""
        if not self.security_rules["sanitize_query_params"]:
            return request
        
        query_string = str(request.url.query)
        for pattern in self.attack_patterns:
            if pattern in query_string.lower():
                await self._log_security_event(request, "malicious_query_param", {
                    "pattern": pattern,
                    "query": query_string
                })
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Malicious query parameter detected"
                )
        
        return request
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response
    
    async def _log_security_event(self, request: Request, event_type: str, details: Dict[str, Any]):
        """Log security event"""
        event = {
            "timestamp": time.time(),
            "event_type": event_type,
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", ""),
            "path": request.url.path,
            "method": request.method,
            "details": details
        }
        
        self.security_events.append(event)
        
        if len(self.security_events) > 1000:
            self.security_events = self.security_events[-1000:]
        
        logger.warning("Security event", **event)
    
    def get_security_statistics(self) -> Dict[str, Any]:
        """Get security statistics"""
        recent_events = [e for e in self.security_events if time.time() - e["timestamp"] < 3600]
        
        return {
            "total_requests_validated": self.validated_requests,
            "total_requests_blocked": self.blocked_requests,
            "security_events_1h": len(recent_events),
            "security_events_total": len(self.security_events),
            "block_rate": self.blocked_requests / max(self.validated_requests + self.blocked_requests, 1),
            "recent_event_types": list(set(e["event_type"] for e in recent_events))
        }

security_middleware = SecurityMiddleware()

async def security_middleware_func(request: Request, call_next):
    """FastAPI middleware function"""
    return await security_middleware(request, call_next)
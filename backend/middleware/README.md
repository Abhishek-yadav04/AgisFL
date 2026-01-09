# ⚡ AgisFL Middleware Infrastructure

## 📖 Overview

The middleware module provides the essential communication, security, and orchestration layer for the AgisFL autonomous federated learning ecosystem. It implements advanced middleware patterns including authentication, authorization, rate limiting, caching, request/response transformation, and distributed communication protocols.

## 🏗️ Middleware Architecture

### Multi-Layer Middleware Stack
```
Middleware Infrastructure
├── Authentication Layer    # Identity verification & JWT management
├── Authorization Engine    # RBAC & permission management
├── Rate Limiting System   # Intelligent traffic control
├── Caching Middleware     # Multi-level caching strategy
├── Security Middleware    # Security headers & threat protection
├── Request Transformation # Data validation & transformation
├── Communication Layer    # WebSocket & HTTP protocols
└── Orchestration Engine   # Request routing & load balancing
```

## 📁 Middleware Components

### 🔐 **auth_middleware.py**
**Purpose**: Comprehensive authentication and authorization middleware for federated learning operations

**Key Components**:
- **JWTAuthenticationMiddleware**: Advanced JWT token management
- **FederatedAuthProvider**: Multi-federation authentication
- **ParticipantVerification**: Participant identity verification
- **PermissionManager**: Role-based access control

**Authentication Implementation**:

#### **1. Advanced JWT Authentication**
```python
# Comprehensive JWT authentication middleware
class JWTAuthenticationMiddleware:
    def __init__(self, secret_key, algorithm="HS256", expiration_hours=24):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.expiration_hours = expiration_hours
        self.token_blacklist = TokenBlacklist()
        self.refresh_token_manager = RefreshTokenManager()
    
    async def __call__(self, request, call_next):
        """Process authentication for incoming requests"""
        # Skip authentication for public endpoints
        if self._is_public_endpoint(request.url.path):
            return await call_next(request)
        
        try:
            # Extract token from request
            token = await self._extract_token(request)
            
            if not token:
                return self._create_unauthorized_response("Missing authentication token")
            
            # Verify token
            payload = await self._verify_token(token)
            
            # Check token blacklist
            if await self.token_blacklist.is_blacklisted(token):
                return self._create_unauthorized_response("Token has been revoked")
            
            # Enrich request with user context
            request.state.user = await self._create_user_context(payload)
            request.state.token = token
            request.state.permissions = payload.get("permissions", [])
            
            # Process request
            response = await call_next(request)
            
            # Handle token refresh if needed
            await self._handle_token_refresh(request, response)
            
            return response
            
        except ExpiredTokenError:
            return self._create_unauthorized_response("Token has expired")
        except InvalidTokenError:
            return self._create_unauthorized_response("Invalid token")
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return self._create_server_error_response("Authentication failed")
    
    async def _verify_token(self, token):
        """Verify JWT token and extract payload"""
        try:
            # Decode token
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                options={"verify_exp": True}
            )
            
            # Validate required claims
            required_claims = ["sub", "exp", "iat", "federation_id", "participant_type"]
            for claim in required_claims:
                if claim not in payload:
                    raise InvalidTokenError(f"Missing required claim: {claim}")
            
            # Validate federation membership
            await self._validate_federation_membership(payload)
            
            return payload
            
        except jwt.ExpiredSignatureError:
            raise ExpiredTokenError("Token has expired")
        except jwt.InvalidTokenError:
            raise InvalidTokenError("Invalid token format")
    
    async def _validate_federation_membership(self, payload):
        """Validate that the participant belongs to the federation"""
        federation_id = payload.get("federation_id")
        participant_id = payload.get("sub")
        
        # Check federation registry
        federation_registry = await get_federation_registry()
        
        if not await federation_registry.is_member(federation_id, participant_id):
            raise UnauthorizedAccessError("Participant not authorized for this federation")
    
    async def create_token(self, user_data, permissions=None):
        """Create a new JWT token for a user"""
        now = datetime.utcnow()
        expiration = now + timedelta(hours=self.expiration_hours)
        
        payload = {
            "sub": user_data["participant_id"],
            "federation_id": user_data["federation_id"],
            "participant_type": user_data["participant_type"],
            "permissions": permissions or [],
            "iat": now,
            "exp": expiration,
            "jti": str(uuid.uuid4()),  # Unique token ID
            "device_id": user_data.get("device_id"),
            "security_level": user_data.get("security_level", "standard")
        }
        
        # Add additional claims for enterprise users
        if user_data.get("enterprise_features", False):
            payload.update({
                "enterprise_id": user_data.get("enterprise_id"),
                "compliance_level": user_data.get("compliance_level", "basic"),
                "data_residency": user_data.get("data_residency")
            })
        
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        
        # Create refresh token
        refresh_token = await self.refresh_token_manager.create_refresh_token(
            user_id=user_data["participant_id"],
            token_id=payload["jti"]
        )
        
        return {
            "access_token": token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": self.expiration_hours * 3600,
            "permissions": permissions or []
        }

# Federated participant authentication
class FederatedParticipantAuth:
    def __init__(self):
        self.participant_registry = ParticipantRegistry()
        self.certificate_validator = CertificateValidator()
        self.reputation_manager = ReputationManager()
    
    async def authenticate_participant(self, participant_credentials):
        """Authenticate a federated learning participant"""
        # Validate participant certificate
        cert_validation = await self.certificate_validator.validate_certificate(
            participant_credentials["certificate"]
        )
        
        if not cert_validation["valid"]:
            raise AuthenticationError(f"Invalid certificate: {cert_validation['reason']}")
        
        # Check participant registration
        participant_info = await self.participant_registry.get_participant(
            participant_credentials["participant_id"]
        )
        
        if not participant_info:
            raise AuthenticationError("Participant not registered")
        
        # Verify participant reputation
        reputation_score = await self.reputation_manager.get_reputation_score(
            participant_credentials["participant_id"]
        )
        
        if reputation_score < 0.3:  # Minimum reputation threshold
            raise AuthenticationError("Participant reputation too low")
        
        # Create participant context
        participant_context = {
            "participant_id": participant_info["id"],
            "federation_id": participant_info["federation_id"],
            "participant_type": participant_info["type"],
            "reputation_score": reputation_score,
            "capabilities": participant_info["capabilities"],
            "security_level": participant_info["security_level"],
            "enterprise_features": participant_info.get("enterprise", False)
        }
        
        return participant_context

# Example authentication usage
auth_middleware = JWTAuthenticationMiddleware(
    secret_key=os.getenv("JWT_SECRET_KEY"),
    algorithm="HS256",
    expiration_hours=24
)

participant_auth = FederatedParticipantAuth()

# Authenticate participant and create token
participant_context = await participant_auth.authenticate_participant({
    "participant_id": "participant_001",
    "certificate": participant_certificate,
    "federation_id": "agisfl_main"
})

# Create JWT token
auth_tokens = await auth_middleware.create_token(
    user_data=participant_context,
    permissions=["model.train", "model.aggregate", "data.contribute"]
)

print(f"Access Token: {auth_tokens['access_token']}")
print(f"Refresh Token: {auth_tokens['refresh_token']}")
```

#### **2. Role-Based Access Control (RBAC)**
```python
# Advanced RBAC system for federated learning
class FederatedRBACMiddleware:
    def __init__(self):
        self.role_manager = RoleManager()
        self.permission_engine = PermissionEngine()
        self.policy_evaluator = PolicyEvaluator()
    
    async def __call__(self, request, call_next):
        """Enforce role-based access control"""
        # Skip RBAC for public endpoints
        if self._is_public_endpoint(request.url.path):
            return await call_next(request)
        
        try:
            # Get user context from authentication middleware
            user_context = getattr(request.state, "user", None)
            
            if not user_context:
                return self._create_forbidden_response("Authentication required")
            
            # Determine required permissions for the endpoint
            required_permissions = await self._get_endpoint_permissions(
                request.method, 
                request.url.path
            )
            
            # Evaluate permissions
            permission_result = await self.permission_engine.evaluate_permissions(
                user_context=user_context,
                required_permissions=required_permissions,
                resource_context=await self._extract_resource_context(request)
            )
            
            if not permission_result["authorized"]:
                return self._create_forbidden_response(
                    f"Insufficient permissions: {permission_result['missing_permissions']}"
                )
            
            # Add permission context to request
            request.state.permission_result = permission_result
            
            # Process request
            response = await call_next(request)
            
            # Log access for audit
            await self._log_access_event(user_context, request, permission_result)
            
            return response
            
        except Exception as e:
            logger.error(f"RBAC error: {str(e)}")
            return self._create_server_error_response("Authorization failed")
    
    async def _get_endpoint_permissions(self, method, path):
        """Get required permissions for an endpoint"""
        endpoint_permissions = {
            # Model management endpoints
            "POST /api/v1/models/train": ["model.train"],
            "GET /api/v1/models/{model_id}": ["model.read"],
            "PUT /api/v1/models/{model_id}": ["model.update"],
            "DELETE /api/v1/models/{model_id}": ["model.delete"],
            
            # Federation management
            "POST /api/v1/federations": ["federation.create"],
            "GET /api/v1/federations/{federation_id}": ["federation.read"],
            "PUT /api/v1/federations/{federation_id}": ["federation.admin"],
            
            # Data operations
            "POST /api/v1/data/contribute": ["data.contribute"],
            "GET /api/v1/data/statistics": ["data.read"],
            
            # Autonomous operations
            "POST /api/v1/autonomous/optimize": ["autonomous.execute"],
            "GET /api/v1/autonomous/insights": ["autonomous.read"],
            
            # Administrative operations
            "GET /api/v1/admin/participants": ["admin.read"],
            "POST /api/v1/admin/participants": ["admin.write"],
            "DELETE /api/v1/admin/participants/{participant_id}": ["admin.delete"]
        }
        
        # Build endpoint key
        endpoint_key = f"{method} {path}"
        
        # Handle parameterized paths
        for pattern, permissions in endpoint_permissions.items():
            if self._match_path_pattern(pattern, endpoint_key):
                return permissions
        
        # Default permissions for unmatched endpoints
        return ["basic.access"]
    
    async def _evaluate_dynamic_permissions(self, user_context, resource_context):
        """Evaluate dynamic permissions based on context"""
        dynamic_rules = []
        
        # Resource ownership rule
        if resource_context.get("owner_id") == user_context.get("participant_id"):
            dynamic_rules.append("resource.owner")
        
        # Federation membership rule
        if resource_context.get("federation_id") == user_context.get("federation_id"):
            dynamic_rules.append("federation.member")
        
        # Reputation-based permissions
        reputation_score = user_context.get("reputation_score", 0)
        if reputation_score > 0.8:
            dynamic_rules.append("high_reputation.access")
        
        # Time-based permissions
        current_hour = datetime.utcnow().hour
        if 9 <= current_hour <= 17:  # Business hours
            dynamic_rules.append("business_hours.access")
        
        return dynamic_rules

# RBAC role definitions
federated_roles = {
    "participant": {
        "description": "Basic federated learning participant",
        "permissions": [
            "model.train",
            "data.contribute",
            "federation.read",
            "basic.access"
        ]
    },
    
    "coordinator": {
        "description": "Federation coordinator",
        "permissions": [
            "model.train",
            "model.read",
            "model.aggregate",
            "data.contribute",
            "data.read",
            "federation.read",
            "federation.manage",
            "participant.invite",
            "basic.access"
        ]
    },
    
    "admin": {
        "description": "Federation administrator",
        "permissions": [
            "model.*",
            "data.*",
            "federation.*",
            "participant.*",
            "admin.*",
            "autonomous.*",
            "basic.access"
        ]
    },
    
    "autonomous_agent": {
        "description": "Autonomous AI agent",
        "permissions": [
            "autonomous.execute",
            "autonomous.read",
            "model.optimize",
            "federation.analyze",
            "basic.access"
        ]
    },
    
    "enterprise_client": {
        "description": "Enterprise federated learning client",
        "permissions": [
            "model.train",
            "model.read",
            "data.contribute",
            "data.analytics",
            "federation.read",
            "enterprise.features",
            "compliance.audit",
            "basic.access"
        ]
    }
}

# Setup RBAC middleware
rbac_middleware = FederatedRBACMiddleware()

# Example permission evaluation
permission_result = await rbac_middleware.permission_engine.evaluate_permissions(
    user_context={
        "participant_id": "participant_001",
        "roles": ["participant", "coordinator"],
        "federation_id": "agisfl_main",
        "reputation_score": 0.95
    },
    required_permissions=["model.train", "data.contribute"],
    resource_context={
        "federation_id": "agisfl_main",
        "model_id": "model_001",
        "owner_id": "participant_001"
    }
)

print(f"Authorized: {permission_result['authorized']}")
print(f"Applied permissions: {permission_result['applied_permissions']}")
```

### 🚦 **rate_limiting.py**
**Purpose**: Intelligent rate limiting and traffic control for federated operations

**Rate Limiting Implementation**:

#### **1. Advanced Rate Limiting Strategies**
```python
# Intelligent rate limiting middleware
class IntelligentRateLimitingMiddleware:
    def __init__(self):
        self.rate_limiters = {}
        self.adaptive_limiter = AdaptiveRateLimiter()
        self.participant_profiler = ParticipantProfiler()
        self.load_balancer = LoadBalancer()
    
    async def __call__(self, request, call_next):
        """Apply intelligent rate limiting"""
        try:
            # Get client identifier
            client_id = await self._get_client_identifier(request)
            
            # Get participant profile for adaptive limiting
            participant_profile = await self.participant_profiler.get_profile(client_id)
            
            # Determine rate limiting strategy
            rate_limit_config = await self._determine_rate_limit_config(
                request, participant_profile
            )
            
            # Check rate limits
            rate_limit_result = await self._check_rate_limits(
                client_id, request, rate_limit_config
            )
            
            if not rate_limit_result["allowed"]:
                return self._create_rate_limit_response(rate_limit_result)
            
            # Apply adaptive rate limiting
            await self.adaptive_limiter.update_participant_behavior(
                client_id, request
            )
            
            # Process request
            start_time = time.time()
            response = await call_next(request)
            processing_time = time.time() - start_time
            
            # Update rate limiting metrics
            await self._update_rate_limiting_metrics(
                client_id, request, response, processing_time
            )
            
            # Add rate limiting headers
            response.headers.update(rate_limit_result["headers"])
            
            return response
            
        except Exception as e:
            logger.error(f"Rate limiting error: {str(e)}")
            return await call_next(request)  # Fail open for availability
    
    async def _determine_rate_limit_config(self, request, participant_profile):
        """Determine appropriate rate limiting configuration"""
        base_config = {
            "requests_per_minute": 60,
            "requests_per_hour": 1000,
            "concurrent_requests": 10,
            "burst_allowance": 20
        }
        
        # Adjust based on participant type
        participant_type = participant_profile.get("type", "basic")
        
        if participant_type == "enterprise":
            base_config.update({
                "requests_per_minute": 300,
                "requests_per_hour": 10000,
                "concurrent_requests": 50,
                "burst_allowance": 100
            })
        elif participant_type == "coordinator":
            base_config.update({
                "requests_per_minute": 180,
                "requests_per_hour": 5000,
                "concurrent_requests": 30,
                "burst_allowance": 60
            })
        elif participant_type == "autonomous_agent":
            base_config.update({
                "requests_per_minute": 120,
                "requests_per_hour": 3000,
                "concurrent_requests": 20,
                "burst_allowance": 40
            })
        
        # Adjust based on reputation
        reputation_score = participant_profile.get("reputation_score", 0.5)
        reputation_multiplier = min(2.0, max(0.1, reputation_score * 2))
        
        for key in ["requests_per_minute", "requests_per_hour", "concurrent_requests"]:
            base_config[key] = int(base_config[key] * reputation_multiplier)
        
        # Adjust based on endpoint type
        endpoint_multipliers = {
            "/api/v1/models/train": 0.5,     # Training is resource intensive
            "/api/v1/models/aggregate": 0.3,  # Aggregation is very intensive
            "/api/v1/data/contribute": 0.7,   # Data contribution is moderate
            "/api/v1/autonomous/optimize": 0.2, # Autonomous operations are intensive
            "/api/v1/health": 10.0,          # Health checks are lightweight
            "/api/v1/status": 5.0            # Status checks are lightweight
        }
        
        path = request.url.path
        for endpoint_pattern, multiplier in endpoint_multipliers.items():
            if path.startswith(endpoint_pattern):
                for key in ["requests_per_minute", "requests_per_hour"]:
                    base_config[key] = int(base_config[key] * multiplier)
                break
        
        return base_config
    
    async def _check_rate_limits(self, client_id, request, config):
        """Check various rate limiting conditions"""
        current_time = time.time()
        
        # Get or create rate limiter for client
        if client_id not in self.rate_limiters:
            self.rate_limiters[client_id] = TokenBucketRateLimiter(
                tokens_per_minute=config["requests_per_minute"],
                tokens_per_hour=config["requests_per_hour"],
                burst_capacity=config["burst_allowance"]
            )
        
        rate_limiter = self.rate_limiters[client_id]
        
        # Check token bucket rate limit
        token_result = await rate_limiter.consume_token()
        
        if not token_result["allowed"]:
            return {
                "allowed": False,
                "reason": "rate_limit_exceeded",
                "retry_after": token_result["retry_after"],
                "headers": {
                    "X-RateLimit-Limit": str(config["requests_per_minute"]),
                    "X-RateLimit-Remaining": str(token_result["remaining"]),
                    "X-RateLimit-Reset": str(token_result["reset_time"]),
                    "Retry-After": str(token_result["retry_after"])
                }
            }
        
        # Check concurrent request limit
        concurrent_requests = await self._get_concurrent_requests(client_id)
        
        if concurrent_requests >= config["concurrent_requests"]:
            return {
                "allowed": False,
                "reason": "concurrent_limit_exceeded",
                "retry_after": 60,  # Try again in 1 minute
                "headers": {
                    "X-RateLimit-Concurrent-Limit": str(config["concurrent_requests"]),
                    "X-RateLimit-Concurrent-Current": str(concurrent_requests),
                    "Retry-After": "60"
                }
            }
        
        # All checks passed
        return {
            "allowed": True,
            "headers": {
                "X-RateLimit-Limit": str(config["requests_per_minute"]),
                "X-RateLimit-Remaining": str(token_result["remaining"]),
                "X-RateLimit-Reset": str(token_result["reset_time"])
            }
        }

# Token bucket rate limiter implementation
class TokenBucketRateLimiter:
    def __init__(self, tokens_per_minute, tokens_per_hour, burst_capacity):
        self.tokens_per_minute = tokens_per_minute
        self.tokens_per_hour = tokens_per_hour
        self.burst_capacity = burst_capacity
        
        # Initialize buckets
        self.minute_bucket = {
            "tokens": burst_capacity,
            "last_refill": time.time(),
            "capacity": burst_capacity
        }
        
        self.hour_bucket = {
            "tokens": tokens_per_hour,
            "last_refill": time.time(),
            "capacity": tokens_per_hour
        }
    
    async def consume_token(self):
        """Attempt to consume a token from the rate limiter"""
        current_time = time.time()
        
        # Refill buckets
        await self._refill_buckets(current_time)
        
        # Check if tokens available in both buckets
        if self.minute_bucket["tokens"] >= 1 and self.hour_bucket["tokens"] >= 1:
            # Consume tokens
            self.minute_bucket["tokens"] -= 1
            self.hour_bucket["tokens"] -= 1
            
            return {
                "allowed": True,
                "remaining": min(
                    self.minute_bucket["tokens"], 
                    self.hour_bucket["tokens"]
                ),
                "reset_time": current_time + 60  # Next minute
            }
        
        # Determine which bucket is limiting
        if self.minute_bucket["tokens"] < 1:
            retry_after = 60 - (current_time - self.minute_bucket["last_refill"])
            limiting_bucket = "minute"
        else:
            retry_after = 3600 - (current_time - self.hour_bucket["last_refill"])
            limiting_bucket = "hour"
        
        return {
            "allowed": False,
            "remaining": 0,
            "retry_after": max(1, int(retry_after)),
            "reset_time": current_time + retry_after,
            "limiting_bucket": limiting_bucket
        }
    
    async def _refill_buckets(self, current_time):
        """Refill token buckets based on elapsed time"""
        # Refill minute bucket
        minute_elapsed = current_time - self.minute_bucket["last_refill"]
        if minute_elapsed >= 60:  # Refill every minute
            tokens_to_add = int(minute_elapsed / 60) * self.tokens_per_minute
            self.minute_bucket["tokens"] = min(
                self.minute_bucket["capacity"],
                self.minute_bucket["tokens"] + tokens_to_add
            )
            self.minute_bucket["last_refill"] = current_time
        
        # Refill hour bucket
        hour_elapsed = current_time - self.hour_bucket["last_refill"]
        if hour_elapsed >= 3600:  # Refill every hour
            tokens_to_add = int(hour_elapsed / 3600) * self.tokens_per_hour
            self.hour_bucket["tokens"] = min(
                self.hour_bucket["capacity"],
                self.hour_bucket["tokens"] + tokens_to_add
            )
            self.hour_bucket["last_refill"] = current_time

# Adaptive rate limiting based on system load
class AdaptiveRateLimiter:
    def __init__(self):
        self.system_monitor = SystemLoadMonitor()
        self.base_limits = {}
        self.adaptive_multipliers = {}
    
    async def get_adaptive_multiplier(self, current_load):
        """Calculate adaptive rate limiting multiplier based on system load"""
        if current_load < 0.3:  # Low load
            return 1.5  # Allow 50% more requests
        elif current_load < 0.6:  # Medium load
            return 1.0  # Normal rate limits
        elif current_load < 0.8:  # High load
            return 0.7  # Reduce by 30%
        else:  # Very high load
            return 0.3  # Aggressive reduction

# Example rate limiting configuration
rate_limiting_config = {
    "participant_types": {
        "basic": {
            "requests_per_minute": 60,
            "requests_per_hour": 1000,
            "concurrent_requests": 10
        },
        "enterprise": {
            "requests_per_minute": 300,
            "requests_per_hour": 10000,
            "concurrent_requests": 50
        },
        "coordinator": {
            "requests_per_minute": 180,
            "requests_per_hour": 5000,
            "concurrent_requests": 30
        }
    },
    
    "endpoint_multipliers": {
        "/api/v1/models/train": 0.5,
        "/api/v1/models/aggregate": 0.3,
        "/api/v1/data/contribute": 0.7,
        "/api/v1/health": 10.0
    },
    
    "adaptive_settings": {
        "enable_adaptive_limiting": True,
        "load_threshold_high": 0.8,
        "load_threshold_critical": 0.95,
        "emergency_rate_reduction": 0.1
    }
}

# Setup intelligent rate limiting
rate_limiting_middleware = IntelligentRateLimitingMiddleware()
```

## 🚀 Quick Start Guide

### Basic Middleware Setup
```python
# Initialize middleware stack
from middleware import (
    JWTAuthenticationMiddleware,
    FederatedRBACMiddleware,
    IntelligentRateLimitingMiddleware
)

# Configure middleware
app = FastAPI()

# Add authentication middleware
app.add_middleware(
    JWTAuthenticationMiddleware,
    secret_key=os.getenv("JWT_SECRET_KEY"),
    algorithm="HS256",
    expiration_hours=24
)

# Add RBAC middleware
app.add_middleware(FederatedRBACMiddleware)

# Add rate limiting middleware
app.add_middleware(IntelligentRateLimitingMiddleware)

# Add security headers middleware
app.add_middleware(
    SecurityHeadersMiddleware,
    security_headers={
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
    }
)

# Add CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://agisfl.com", "https://app.agisfl.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"]
)

# Start federated learning server with comprehensive middleware
if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="certs/private.key",
        ssl_certfile="certs/certificate.crt"
    )
```

---

*AgisFL Middleware Infrastructure - Secure & Scalable Communication Layer*  
*Authentication • Authorization • Rate Limiting • Security • Performance*  
*Last Updated: September 3, 2025*

"""
AgisFL Enterprise v5.0 - Advanced Error Handling Framework
Comprehensive error tracking, categorization, and security monitoring with enterprise-grade features
"""
import logging
import traceback
import time
import json
import re
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple, Union
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError, BaseModel
from pathlib import Path
import structlog

# Enhanced structured logging for v5.0
logger = structlog.get_logger("agisfl.error_handler")

# Version information
ERROR_FRAMEWORK_VERSION = "5.0.0"
FRAMEWORK_BUILD_DATE = "2025-09-11"

# Enhanced security utility functions
def sanitize_log_input(text: str, max_length: int = 500) -> str:
    """Sanitize input for safe logging"""
    if not isinstance(text, str):
        text = str(text)
    
    # Remove potential sensitive patterns
    sensitive_patterns = [
        r'password["\s]*[:=]["\s]*[^"\s]+',
        r'token["\s]*[:=]["\s]*[^"\s]+',
        r'api[_-]?key["\s]*[:=]["\s]*[^"\s]+',
        r'secret["\s]*[:=]["\s]*[^"\s]+',
        r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card numbers
        r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
    ]
    
    for pattern in sensitive_patterns:
        text = re.sub(pattern, '[REDACTED]', text, flags=re.IGNORECASE)
    
    # Truncate if too long
    if len(text) > max_length:
        text = text[:max_length] + "..."
    
    return text

# Error categories for v5.0
class ErrorCategory:
    """Comprehensive v5.0 error categorization system"""
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    VALIDATION = "validation"
    DATABASE = "database"
    NETWORK = "network"
    PRIVACY = "privacy"
    SECURITY = "security"
    FEDERATED_LEARNING = "federated_learning"
    HOMOMORPHIC_ENCRYPTION = "homomorphic_encryption"
    AUTONOMOUS_AI = "autonomous_ai"
    SYSTEM = "system"
    UNKNOWN = "unknown"
    
    # v5.0: Enhanced ML/AI specific categories
    MODEL_INFERENCE = "model_inference"
    DIFFERENTIAL_PRIVACY = "differential_privacy"
    SECURE_AGGREGATION = "secure_aggregation"
    GRADIENT_CLIPPING = "gradient_clipping"
    PRIVACY_BUDGET = "privacy_budget"
    AUDIT_COMPLIANCE = "audit_compliance"
    BUSINESS_LOGIC = "business_logic"
    INTEGRATION = "integration"
    CONFIGURATION = "configuration"
    RATE_LIMITING = "rate_limiting"
    RESOURCE_EXHAUSTION = "resource_exhaustion"
    MODEL_TRAINING = "model_training"
    DATA_PROCESSING = "data_processing"
    COMPLIANCE = "compliance"

class ErrorSeverity:
    """Enhanced error severity levels with v5.0 impact classification"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"
    
    # v5.0: Security and compliance specific levels
    SECURITY_CRITICAL = "security_critical"
    COMPLIANCE_VIOLATION = "compliance_violation"
    PRIVACY_BREACH = "privacy_breach"
    
    # v5.0: Business impact classification
    BUSINESS_CRITICAL = "business_critical"
    SERVICE_DEGRADATION = "service_degradation"
    USER_EXPERIENCE = "user_experience"
    MINIMAL_IMPACT = "minimal_impact"

class SecureHTTPException(HTTPException):
    """Enhanced Secure HTTP exception for v5.0 with comprehensive tracking"""
    
    def __init__(
        self, 
        status_code: int, 
        detail: str, 
        internal_detail: Optional[str] = None,
        category: str = ErrorCategory.UNKNOWN,
        severity: str = ErrorSeverity.MEDIUM,
        error_code: Optional[str] = None,
        user_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        compliance_impact: bool = False,
        security_impact: bool = False,
        privacy_impact: bool = False
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.internal_detail = internal_detail
        self.category = category
        self.severity = severity
        self.error_code = error_code or f"ERR_{uuid.uuid4().hex[:8].upper()}"
        self.user_id = user_id
        self.context = context or {}
        self.compliance_impact = compliance_impact
        self.security_impact = security_impact
        self.privacy_impact = privacy_impact
        self.timestamp = datetime.now(timezone.utc)
        self.error_id = str(uuid.uuid4())
        
        # Enhanced logging for v5.0
        self._log_error()
    
    def _log_error(self):
        """Enhanced error logging with structured data"""
        log_data = {
            "error_id": self.error_id,
            "error_code": self.error_code,
            "status_code": self.status_code,
            "category": self.category,
            "severity": self.severity,
            "detail": sanitize_log_input(self.detail),
            "internal_detail": sanitize_log_input(self.internal_detail or ""),
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "compliance_impact": self.compliance_impact,
            "security_impact": self.security_impact,
            "privacy_impact": self.privacy_impact,
            "context": self.context
        }
        
        if self.severity in [ErrorSeverity.CRITICAL, ErrorSeverity.SECURITY_CRITICAL]:
            logger.critical("Critical error occurred", **log_data)
        elif self.severity == ErrorSeverity.HIGH:
            logger.error("High severity error", **log_data)
        else:
            logger.warning("Error occurred", **log_data)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        return {
            "error_id": self.error_id,
            "error_code": self.error_code,
            "status_code": self.status_code,
            "detail": self.detail,
            "category": self.category,
            "severity": self.severity,
            "timestamp": self.timestamp.isoformat(),
            "framework_version": ERROR_FRAMEWORK_VERSION
        }

def _classify_error(exc: Exception) -> Tuple[str, str]:
    """Enhanced error classification for v5.0"""
    
    if isinstance(exc, ValidationError):
        return ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM
    elif isinstance(exc, PermissionError):
        return ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH
    elif isinstance(exc, ConnectionError):
        return ErrorCategory.NETWORK, ErrorSeverity.HIGH
    elif isinstance(exc, ValueError):
        return ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM
    elif isinstance(exc, KeyError):
        return ErrorCategory.CONFIGURATION, ErrorSeverity.MEDIUM
    elif isinstance(exc, FileNotFoundError):
        return ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM
    elif isinstance(exc, TimeoutError):
        return ErrorCategory.NETWORK, ErrorSeverity.HIGH
    elif "privacy" in str(exc).lower():
        return ErrorCategory.PRIVACY, ErrorSeverity.HIGH
    elif "security" in str(exc).lower():
        return ErrorCategory.SECURITY, ErrorSeverity.SECURITY_CRITICAL
    elif "authentication" in str(exc).lower():
        return ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH
    elif "authorization" in str(exc).lower():
        return ErrorCategory.AUTHORIZATION, ErrorSeverity.HIGH
    elif "database" in str(exc).lower():
        return ErrorCategory.DATABASE, ErrorSeverity.HIGH
    elif "federated" in str(exc).lower():
        return ErrorCategory.FEDERATED_LEARNING, ErrorSeverity.MEDIUM
    else:
        return ErrorCategory.UNKNOWN, ErrorSeverity.MEDIUM

def _analyze_security_indicators(exc: Exception, request: Request) -> Dict[str, Any]:
    """Analyze request and exception for security indicators"""
    
    indicators = {
        "is_suspicious": False,
        "threat_level": "low",
        "indicators": []
    }
    
    # Check for common attack patterns
    exc_str = str(exc).lower()
    suspicious_patterns = [
        "sql injection", "xss", "script", "union select",
        "drop table", "exec", "eval", "javascript:",
        "../", "../../", "..\\", "..\\\\",
        "<script", "onerror", "onload"
    ]
    
    for pattern in suspicious_patterns:
        if pattern in exc_str:
            indicators["is_suspicious"] = True
            indicators["threat_level"] = "high"
            indicators["indicators"].append(f"Suspicious pattern: {pattern}")
    
    # Check user agent for bot patterns
    user_agent = request.headers.get("user-agent", "").lower()
    bot_patterns = ["bot", "crawler", "spider", "scraper", "scanner"]
    
    for pattern in bot_patterns:
        if pattern in user_agent:
            indicators["indicators"].append(f"Bot detected: {pattern}")
    
    # Check for rapid requests (if session tracking available)
    # This would need integration with rate limiting middleware
    
    return indicators

def _get_client_ip(request: Request) -> str:
    """Safely extract client IP address"""
    
    # Check forwarded headers (but sanitize them)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Take first IP and sanitize
        ip = forwarded_for.split(",")[0].strip()
        return sanitize_log_input(ip, 45)  # IPv6 max length
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return sanitize_log_input(real_ip, 45)
    
    if request.client:
        return sanitize_log_input(request.client.host, 45)
    
    return "unknown"

def _determine_error_response(exc: Exception, category: str) -> Tuple[int, str]:
    """Determine appropriate HTTP status code and user message"""
    
    if isinstance(exc, HTTPException):
        return exc.status_code, exc.detail
    elif isinstance(exc, ValidationError):
        return 422, "Invalid input data provided"
    elif isinstance(exc, PermissionError):
        return 403, "Access denied"
    elif isinstance(exc, FileNotFoundError):
        return 404, "Requested resource not found"
    elif isinstance(exc, ConnectionError):
        return 503, "Service temporarily unavailable"
    elif isinstance(exc, TimeoutError):
        return 504, "Request timeout"
    elif category == ErrorCategory.AUTHENTICATION:
        return 401, "Authentication required"
    elif category == ErrorCategory.AUTHORIZATION:
        return 403, "Insufficient permissions"
    elif category == ErrorCategory.PRIVACY:
        return 400, "Privacy constraint violation"
    elif category == ErrorCategory.SECURITY:
        return 400, "Security policy violation"
    elif category == ErrorCategory.RATE_LIMITING:
        return 429, "Too many requests"
    else:
        return 500, "Internal server error"

async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Enhanced global exception handler with comprehensive security logging and monitoring"""
    
    error_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc)
    
    # Enhanced error classification
    if isinstance(exc, SecureHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict()
        )
    
    # Determine error category and severity
    category, severity = _classify_error(exc)
    
    # Security analysis
    security_indicators = _analyze_security_indicators(exc, request)
    
    # Extract safe request context
    request_context = {
        "method": request.method,
        "path": request.url.path,
        "user_agent": sanitize_log_input(request.headers.get("user-agent", "unknown"), 100),
        "client_ip": request.client.host if request.client else "unknown",
        "timestamp": timestamp.isoformat(),
        "error_id": error_id
    }
    
    # Enhanced structured logging
    log_data = {
        "error_id": error_id,
        "error_type": type(exc).__name__,
        "category": category,
        "severity": severity,
        "message": sanitize_log_input(str(exc)),
        "request_context": request_context,
        "security_indicators": security_indicators,
        "framework_version": ERROR_FRAMEWORK_VERSION
    }
    
    # Log with appropriate severity
    if severity in [ErrorSeverity.CRITICAL, ErrorSeverity.SECURITY_CRITICAL]:
        logger.critical("Critical system error detected", **log_data)
    elif severity == ErrorSeverity.HIGH:
        logger.error("High severity error", **log_data)
    elif security_indicators.get("is_suspicious", False):
        logger.warning("Potentially suspicious activity", **log_data)
    else:
        logger.info("Standard error handled", **log_data)
    
    # Determine response based on error type
    status_code, user_message = _determine_error_response(exc, category)
    
    # Enhanced error response for v5.0
    error_response = {
        "error_id": error_id,
        "error_code": f"ERR_{uuid.uuid4().hex[:8].upper()}",
        "status_code": status_code,
        "message": user_message,
        "category": category,
        "timestamp": timestamp.isoformat(),
        "framework_version": ERROR_FRAMEWORK_VERSION,
        "support_reference": f"REF-{error_id[:8]}"
    }
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )

async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle validation errors securely"""
    
    logger.warning(
        f"Validation error: {sanitize_log_input(str(exc))}",
        extra={"path": request.url.path, "method": request.method}
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation failed",
            "message": "Invalid input data",
            "details": "Please check your input and try again"
        }
    )

def handle_database_error(error: Exception) -> HTTPException:
    """Handle database errors securely"""
    
    logger.error(f"Database error: {sanitize_log_input(str(error))}")
    
    # Don't expose database details
    return HTTPException(
        status_code=500,
        detail="Database operation failed"
    )

def handle_authentication_error(error: Exception) -> HTTPException:
    """Handle authentication errors"""
    
    logger.warning(f"Authentication error: {sanitize_log_input(str(error))}")
    
    return HTTPException(
        status_code=401,
        detail="Authentication failed"
    )

def handle_authorization_error(error: Exception) -> HTTPException:
    """Handle authorization errors"""
    
    logger.warning(f"Authorization error: {sanitize_log_input(str(error))}")
    
    return HTTPException(
        status_code=403,
        detail="Access denied"
    )

class ErrorTracker:
    """Enhanced error tracking and analytics for v5.0"""
    
    def __init__(self):
        self.error_counts = {}
        self.error_patterns = {}
        self.security_incidents = {}
        self.compliance_violations = {}
        self.performance_impacts = {}
    
    def track_error(self, error_type: str, client_ip: str, category: str = None, severity: str = None) -> Dict[str, Any]:
        """Enhanced error tracking with pattern analysis"""
        key = f"{error_type}:{client_ip}"
        timestamp = time.time()
        
        # Track basic counts
        if key not in self.error_counts:
            self.error_counts[key] = {"count": 0, "first_seen": timestamp, "last_seen": timestamp}
        
        self.error_counts[key]["count"] += 1
        self.error_counts[key]["last_seen"] = timestamp
        
        # Track patterns for v5.0 analytics
        pattern_key = f"{category}:{error_type}"
        if pattern_key not in self.error_patterns:
            self.error_patterns[pattern_key] = {
                "frequency": 0,
                "severity_distribution": {},
                "client_distribution": {},
                "trend": []
            }
        
        pattern = self.error_patterns[pattern_key]
        pattern["frequency"] += 1
        pattern["severity_distribution"][severity] = pattern["severity_distribution"].get(severity, 0) + 1
        pattern["client_distribution"][client_ip] = pattern["client_distribution"].get(client_ip, 0) + 1
        pattern["trend"].append({"timestamp": timestamp, "severity": severity})
        
        # Keep only recent trend data (last 100 entries)
        if len(pattern["trend"]) > 100:
            pattern["trend"] = pattern["trend"][-100:]
        
        # Track security incidents
        if category in [ErrorCategory.SECURITY, ErrorCategory.PRIVACY, ErrorCategory.AUTHENTICATION]:
            self._track_security_incident(client_ip, error_type, category, severity, timestamp)
        
        # Track compliance violations
        if severity in [ErrorSeverity.COMPLIANCE_VIOLATION, ErrorSeverity.PRIVACY_BREACH]:
            self._track_compliance_violation(client_ip, error_type, category, timestamp)
        
        # Analyze rate limiting
        rate_limit_exceeded = self._check_rate_limits(key, timestamp)
        
        # Generate insights
        insights = self._generate_insights(key, pattern_key, client_ip)
        
        return {
            "rate_limit_exceeded": rate_limit_exceeded,
            "pattern_analysis": insights,
            "security_risk_level": self._assess_security_risk(client_ip),
            "recommended_actions": self._get_recommendations(insights, category, severity)
        }
    
    def _track_security_incident(self, client_ip: str, error_type: str, category: str, severity: str, timestamp: float):
        """Track security-related incidents"""
        if client_ip not in self.security_incidents:
            self.security_incidents[client_ip] = {
                "incident_count": 0,
                "categories": {},
                "severity_levels": {},
                "first_incident": timestamp,
                "last_incident": timestamp,
                "risk_score": 0
            }
        
        incident = self.security_incidents[client_ip]
        incident["incident_count"] += 1
        incident["categories"][category] = incident["categories"].get(category, 0) + 1
        incident["severity_levels"][severity] = incident["severity_levels"].get(severity, 0) + 1
        incident["last_incident"] = timestamp
        
        # Calculate risk score
        incident["risk_score"] = self._calculate_risk_score(incident)
    
    def _track_compliance_violation(self, client_ip: str, error_type: str, category: str, timestamp: float):
        """Track compliance violations for audit purposes"""
        violation_key = f"{client_ip}:{category}"
        if violation_key not in self.compliance_violations:
            self.compliance_violations[violation_key] = {
                "violation_count": 0,
                "error_types": {},
                "timestamps": [],
                "audit_required": False
            }
        
        violation = self.compliance_violations[violation_key]
        violation["violation_count"] += 1
        violation["error_types"][error_type] = violation["error_types"].get(error_type, 0) + 1
        violation["timestamps"].append(timestamp)
        
        # Flag for audit if multiple violations
        if violation["violation_count"] >= 3:
            violation["audit_required"] = True
    
    def _check_rate_limits(self, key: str, current_time: float) -> bool:
        """Enhanced rate limiting with adaptive thresholds"""
        # Base rate limit: 10 errors per minute
        minute_window = 60
        base_limit = 10
        
        # Get recent errors within the window
        recent_errors = [
            entry for entry in self.error_counts.get(key, {}).get("timestamps", [])
            if current_time - entry < minute_window
        ]
        
        return len(recent_errors) > base_limit
    
    def _assess_security_risk(self, client_ip: str) -> str:
        """Assess security risk level for a client"""
        if client_ip not in self.security_incidents:
            return "low"
        
        incident = self.security_incidents[client_ip]
        risk_score = incident["risk_score"]
        
        if risk_score >= 80:
            return "critical"
        elif risk_score >= 60:
            return "high"
        elif risk_score >= 40:
            return "medium"
        else:
            return "low"
    
    def _calculate_risk_score(self, incident: Dict[str, Any]) -> int:
        """Calculate risk score based on incident patterns"""
        score = 0
        
        # Base score from incident count
        score += min(incident["incident_count"] * 5, 50)
        
        # Category multipliers
        category_weights = {
            ErrorCategory.SECURITY: 20,
            ErrorCategory.PRIVACY: 15,
            ErrorCategory.AUTHENTICATION: 10,
            ErrorCategory.AUTHORIZATION: 8
        }
        
        for category, count in incident["categories"].items():
            weight = category_weights.get(category, 5)
            score += count * weight
        
        # Severity multipliers
        severity_weights = {
            ErrorSeverity.SECURITY_CRITICAL: 25,
            ErrorSeverity.PRIVACY_BREACH: 20,
            ErrorSeverity.CRITICAL: 15,
            ErrorSeverity.HIGH: 10
        }
        
        for severity, count in incident["severity_levels"].items():
            weight = severity_weights.get(severity, 5)
            score += count * weight
        
        # Time factor (recent incidents are worse)
        time_since_last = time.time() - incident["last_incident"]
        if time_since_last < 300:  # 5 minutes
            score += 10
        elif time_since_last < 3600:  # 1 hour
            score += 5
        
        return min(score, 100)  # Cap at 100
    
    def _generate_insights(self, error_key: str, pattern_key: str, client_ip: str) -> Dict[str, Any]:
        """Generate actionable insights from error patterns"""
        insights = {
            "error_frequency": "normal",
            "pattern_deviation": False,
            "client_behavior": "normal",
            "trend_analysis": "stable"
        }
        
        # Analyze error frequency
        if error_key in self.error_counts:
            count = self.error_counts[error_key]["count"]
            if count > 50:
                insights["error_frequency"] = "very_high"
            elif count > 20:
                insights["error_frequency"] = "high"
            elif count > 10:
                insights["error_frequency"] = "elevated"
        
        # Analyze pattern deviation
        if pattern_key in self.error_patterns:
            pattern = self.error_patterns[pattern_key]
            if pattern["frequency"] > 100:
                insights["pattern_deviation"] = True
        
        # Analyze client behavior
        if client_ip in self.security_incidents:
            risk_level = self._assess_security_risk(client_ip)
            if risk_level in ["high", "critical"]:
                insights["client_behavior"] = "suspicious"
        
        return insights
    
    def _get_recommendations(self, insights: Dict[str, Any], category: str, severity: str) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        if insights["error_frequency"] in ["high", "very_high"]:
            recommendations.append("Implement additional rate limiting")
            recommendations.append("Review client authentication")
        
        if insights["pattern_deviation"]:
            recommendations.append("Investigate unusual error patterns")
            recommendations.append("Consider system health check")
        
        if insights["client_behavior"] == "suspicious":
            recommendations.append("Review client access logs")
            recommendations.append("Consider temporary access restriction")
            recommendations.append("Escalate to security team")
        
        if category == ErrorCategory.PRIVACY:
            recommendations.append("Review privacy protection mechanisms")
            recommendations.append("Audit data access patterns")
        
        if severity in [ErrorSeverity.CRITICAL, ErrorSeverity.SECURITY_CRITICAL]:
            recommendations.append("Immediate investigation required")
            recommendations.append("Notify operations team")
        
        return recommendations
    
    def get_analytics_summary(self) -> Dict[str, Any]:
        """Get comprehensive analytics summary for v5.0 monitoring"""
        current_time = time.time()
        
        return {
            "total_errors": sum(data["count"] for data in self.error_counts.values()),
            "unique_error_types": len(self.error_patterns),
            "security_incidents": len(self.security_incidents),
            "compliance_violations": len(self.compliance_violations),
            "high_risk_clients": len([
                ip for ip, data in self.security_incidents.items()
                if data["risk_score"] >= 60
            ]),
            "top_error_patterns": sorted(
                self.error_patterns.items(),
                key=lambda x: x[1]["frequency"],
                reverse=True
            )[:10],
            "recent_activity": {
                "last_hour": len([
                    data for data in self.error_counts.values()
                    if current_time - data["last_seen"] < 3600
                ]),
                "last_day": len([
                    data for data in self.error_counts.values()
                    if current_time - data["last_seen"] < 86400
                ])
            },
            "framework_version": ERROR_FRAMEWORK_VERSION,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

# Enhanced global error tracker instance
error_tracker = ErrorTracker()

# v5.0: Advanced error analysis functions
async def analyze_error_trends() -> Dict[str, Any]:
    """Analyze error trends for proactive monitoring"""
    return error_tracker.get_analytics_summary()

async def get_security_insights() -> Dict[str, Any]:
    """Get security-focused error insights"""
    insights = error_tracker.get_analytics_summary()
    
    return {
        "security_incidents": insights["security_incidents"],
        "high_risk_clients": insights["high_risk_clients"],
        "compliance_violations": insights["compliance_violations"],
        "recommendations": [
            "Monitor high-risk clients closely",
            "Review authentication mechanisms",
            "Implement additional security controls",
            "Conduct security audit if violations detected"
        ]
    }

async def generate_compliance_report() -> Dict[str, Any]:
    """Generate compliance report for audit purposes"""
    violations = error_tracker.compliance_violations
    
    return {
        "total_violations": len(violations),
        "audit_required_cases": len([
            v for v in violations.values() if v["audit_required"]
        ]),
        "violation_summary": {
            violation_key: {
                "count": data["violation_count"],
                "types": list(data["error_types"].keys()),
                "audit_required": data["audit_required"]
            }
            for violation_key, data in violations.items()
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "framework_version": ERROR_FRAMEWORK_VERSION
    }
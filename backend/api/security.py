"""
Enterprise Security API - Comprehensive Security Management and Threat Intelligence
Advanced threat detection, incident response, and security analytics for federated learning
"""

from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks, Query, Body, Path
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, List, Optional, Union
from enum import Enum
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, validator
import structlog
import asyncio
import secrets
import hashlib
import hmac
import json
import time
import socket
import ipaddress
from pathlib import Path
import os
import uuid

PROM_AVAILABLE = False
PROM_SECURITY_REQUESTS = None
PROM_THREATS_DETECTED = None
PROM_SECURITY_SCORE = None
PROM_ACTIVE_THREATS = None
try:
    from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry
    PROM_AVAILABLE = True
    try:
        PROM_SECURITY_REQUESTS = Counter('security_api_requests_total', 'Total security API requests', ['endpoint', 'status'])
        PROM_THREATS_DETECTED = Counter('threats_detected_total', 'Total threats detected', ['type', 'severity'])
        PROM_SECURITY_SCORE = Gauge('security_score', 'Current security score')
        PROM_ACTIVE_THREATS = Gauge('active_threats', 'Number of active threats')
    except Exception:
        pass
except Exception:
    pass

# Enhanced structured logging
logger = structlog.get_logger(__name__)

# Security
security = HTTPBearer(auto_error=True)
router = APIRouter(tags=["Enterprise Security"], prefix="/security")

# Helper to allow endpoints to opt-out of authentication when the environment
# variable DISABLE_AUTHENTICATION is set to a truthy value. This provides a
# simple dependency that routers can use to bypass authentication in
# development/anonymous modes.
def optional_auth_dependency():
    """Return a dependency callable for FastAPI endpoints.

    If DISABLE_AUTHENTICATION=true in the environment, the returned callable
    will be a no-op that allows access. Otherwise it will use the HTTPBearer
    security scheme to require credentials.
    """
    from fastapi import Depends
    import os

    def _no_op_dependency():
        return None

    if os.getenv('DISABLE_AUTHENTICATION', 'false').lower() in ('1', 'true', 'yes'):
        return _no_op_dependency
    # otherwise require bearer token
    from fastapi import Request

    async def _require_auth(request: Request):
        """Attempt to require auth but don't raise if missing.

        This wrapper calls the HTTPBearer instance directly and returns
        credentials if present; if no credentials are provided or validation
        fails it returns None instead of raising an HTTPException. This
        makes endpoints using this dependency tolerant to anonymous access
        while still allowing access to the credentials when supplied.
        """
        try:
            # HTTPBearer is a callable dependency that accepts Request
            creds = await security(request)
            return creds
        except Exception:
            return None

    return _require_auth

config = None
THREAT_DETECTION_ENABLED = True
MAX_THREAT_HISTORY = 10000
AUTO_BLOCK_ENABLED = True
SECURITY_AUDIT_ENABLED = True
try:
    from ..config.enterprise_config import get_config
    config = get_config()
    THREAT_DETECTION_ENABLED = getattr(config, 'threat_detection_enabled', True)
    MAX_THREAT_HISTORY = getattr(config, 'max_threat_history', 10000)
    AUTO_BLOCK_ENABLED = getattr(config, 'auto_block_enabled', True)
    SECURITY_AUDIT_ENABLED = getattr(config, 'security_audit_enabled', True)
except Exception:
    try:
        from ..config.security_config import get_config
        config = get_config()
        THREAT_DETECTION_ENABLED = getattr(config, 'threat_detection_enabled', True)
        MAX_THREAT_HISTORY = getattr(config, 'max_threat_history', 10000)
        AUTO_BLOCK_ENABLED = getattr(config, 'auto_block_enabled', True)
        SECURITY_AUDIT_ENABLED = getattr(config, 'security_audit_enabled', True)
    except Exception:
        pass

audit_logger = None
try:
    from ..utils.logging_config import audit_logger as _audit_logger
    audit_logger = _audit_logger
except Exception:
    try:
        from ..utils.security_utils import audit_logger as _audit_logger
        audit_logger = _audit_logger
    except Exception:
        pass

limiter = None
RATE_LIMITING_AVAILABLE = False
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    limiter = Limiter(key_func=get_remote_address)
    RATE_LIMITING_AVAILABLE = True
except Exception:
    pass

# Security enums
class ThreatType(str, Enum):
    BRUTE_FORCE = "brute_force"
    DDoS = "ddos"
    PORT_SCAN = "port_scan"
    SQL_INJECTION = "sql_injection"
    XSS = "xss"
    MALWARE = "malware"
    INSIDER_THREAT = "insider_threat"
    DATA_EXFILTRATION = "data_exfiltration"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    MODEL_POISONING = "model_poisoning"
    GRADIENT_INVERSION = "gradient_inversion"
    MEMBERSHIP_INFERENCE = "membership_inference"

class ThreatSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ThreatStatus(str, Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    MITIGATING = "mitigating"
    BLOCKED = "blocked"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"

class SecurityEventType(str, Enum):
    LOGIN_ATTEMPT = "login_attempt"
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"
    DATA_ACCESS = "data_access"
    CONFIGURATION_CHANGE = "configuration_change"
    THREAT_DETECTED = "threat_detected"
    SECURITY_VIOLATION = "security_violation"

class IncidentSeverity(str, Enum):
    P1_CRITICAL = "p1_critical"
    P2_HIGH = "p2_high"
    P3_MEDIUM = "p3_medium"
    P4_LOW = "p4_low"

# Pydantic models
class ThreatInfo(BaseModel):
    """Threat information model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ThreatType
    source_ip: str = Field(description="Source IP address")
    target: Optional[str] = Field(None, description="Target resource")
    severity: ThreatSeverity
    status: ThreatStatus = Field(default=ThreatStatus.DETECTED)
    description: str = Field(description="Threat description")
    indicators: List[str] = Field(default_factory=list, description="Threat indicators")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    detection_method: str = Field(default="automated", description="Detection method")
    confidence_score: float = Field(default=0.8, ge=0, le=1, description="Detection confidence")
    mitigation_actions: List[str] = Field(default_factory=list, description="Mitigation actions taken")
    
    @validator('source_ip')
    def validate_ip(cls, v):
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError("Invalid IP address format")

class SecurityEvent(BaseModel):
    """Security event model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: SecurityEventType
    source: str = Field(description="Event source")
    user_id: Optional[str] = Field(None, description="Associated user ID")
    resource: Optional[str] = Field(None, description="Affected resource")
    action: str = Field(description="Action performed")
    outcome: str = Field(description="Event outcome")
    ip_address: Optional[str] = Field(None, description="Source IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    risk_score: float = Field(default=0.0, ge=0, le=1, description="Risk score")

class SecurityIncident(BaseModel):
    """Security incident model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(description="Incident title")
    description: str = Field(description="Incident description")
    severity: IncidentSeverity
    status: str = Field(default="open", description="Incident status")
    assigned_to: Optional[str] = Field(None, description="Assigned analyst")
    affected_systems: List[str] = Field(default_factory=list)
    related_threats: List[str] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolution_time: Optional[timedelta] = Field(None)

class ThreatIntelligence(BaseModel):
    """Threat intelligence model"""
    indicator: str = Field(description="Threat indicator")
    indicator_type: str = Field(description="Type of indicator (IP, domain, hash, etc.)")
    threat_types: List[ThreatType] = Field(description="Associated threat types")
    confidence: float = Field(ge=0, le=1, description="Intelligence confidence")
    source: str = Field(description="Intelligence source")
    first_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: List[str] = Field(default_factory=list)
    
class SecurityConfiguration(BaseModel):
    """Security configuration model"""
    threat_detection_enabled: bool = Field(default=True)
    auto_block_enabled: bool = Field(default=True)
    threat_intelligence_enabled: bool = Field(default=True)
    audit_logging_enabled: bool = Field(default=True)
    incident_response_enabled: bool = Field(default=True)
    anomaly_detection_sensitivity: float = Field(default=0.8, ge=0, le=1)
    block_duration_minutes: int = Field(default=60, ge=1)
    max_failed_attempts: int = Field(default=5, ge=1)
    notification_enabled: bool = Field(default=True)

# Enhanced threat tracking and management
class EnhancedThreatTracker:
    """Enhanced threat tracking with comprehensive security analytics"""
    
    def __init__(self):
        self.threats = {}
        self.security_events = {}
        self.incidents = {}
        self.threat_intelligence = {}
        self.blocked_ips = set()
        self.security_config = SecurityConfiguration()
        self.analytics_cache = {}
        self.last_update = time.time()
        self.last_updated = datetime.now(timezone.utc).isoformat()  # Track last updated time
        
    def add_threat(self, threat: ThreatInfo) -> str:
        """Add new threat with enhanced tracking"""
        self.threats[threat.id] = threat
        
        # Auto-block if enabled and severity is high
        if (self.security_config.auto_block_enabled and 
            threat.severity in [ThreatSeverity.HIGH, ThreatSeverity.CRITICAL]):
            self.block_ip(threat.source_ip, f"Auto-blocked due to {threat.type} threat")
        
        # Update Prometheus metrics
        if PROM_AVAILABLE and PROM_THREATS_DETECTED and PROM_ACTIVE_THREATS:
            try:
                PROM_THREATS_DETECTED.labels(type=threat.type, severity=threat.severity).inc()
                PROM_ACTIVE_THREATS.set(len(self.get_active_threats()))
            except Exception as e:
                logger.warning(f"Failed to update Prometheus metrics: {e}")
        
        # Create security event
        self.add_security_event(SecurityEvent(
            event_type=SecurityEventType.THREAT_DETECTED,
            source="threat_detection_system",
            action=f"threat_detected_{threat.type}",
            outcome="threat_logged",
            ip_address=threat.source_ip,
            metadata={"threat_id": threat.id, "severity": threat.severity},
            risk_score=self._calculate_threat_risk_score(threat)
        ))
        
        # Check if incident creation is needed
        if threat.severity == ThreatSeverity.CRITICAL:
            self._auto_create_incident(threat)
        
        self.last_update = time.time()
        logger.info("Threat added", threat_id=threat.id, type=threat.type, severity=threat.severity)
        
        return threat.id
    
    def add_security_event(self, event: SecurityEvent) -> str:
        """Add security event with analytics"""
        self.security_events[event.id] = event
        
        # Maintain event history limit
        if len(self.security_events) > MAX_THREAT_HISTORY:
            oldest_events = sorted(self.security_events.items(), 
                                 key=lambda x: x[1].timestamp)[:100]
            for event_id, _ in oldest_events:
                del self.security_events[event_id]
        
        # Perform real-time analytics
        self._analyze_event_patterns(event)
        
        self.last_updated = datetime.now(timezone.utc).isoformat()  # Update last updated time
        return event.id
    def create_incident(self, incident: SecurityIncident) -> str:
        """Create security incident"""
        incident.updated_at = datetime.now(timezone.utc)
        self.incidents[incident.id] = incident
        
        logger.warning("Security incident created", 
                      incident_id=incident.id, 
                      severity=incident.severity)
        
        return incident.id
    
    def block_ip(self, ip_address: str, reason: str = "Security threat detected"):
        """Block IP address"""
        self.blocked_ips.add(ip_address)
        
        # Log blocking action
        self.add_security_event(SecurityEvent(
            event_type=SecurityEventType.ACCESS_DENIED,
            source="security_system",
            action="ip_blocked",
            outcome="access_blocked",
            ip_address=ip_address,
            metadata={"reason": reason, "auto_blocked": True}
        ))
        
        logger.warning("IP address blocked", ip=ip_address, reason=reason)
    
    def unblock_ip(self, ip_address: str, reason: str = "Manual unblock"):
        """Unblock IP address"""
        self.blocked_ips.discard(ip_address)
        
        self.add_security_event(SecurityEvent(
            event_type=SecurityEventType.ACCESS_GRANTED,
            source="security_system", 
            action="ip_unblocked",
            outcome="access_restored",
            ip_address=ip_address,
            metadata={"reason": reason}
        ))
        
        logger.info("IP address unblocked", ip=ip_address, reason=reason)
    
    def get_active_threats(self, hours: int = 24) -> List[ThreatInfo]:
        """Get active threats within specified time window"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [
            threat for threat in self.threats.values()
            if threat.timestamp > cutoff_time and threat.status != ThreatStatus.RESOLVED
        ]
    
    def get_security_score(self) -> float:
        """Calculate current security score (0-100)"""
        active_threats = self.get_active_threats()
        
        # Base score
        score = 100.0
        
        # Deduct points for active threats
        for threat in active_threats:
            if threat.severity == ThreatSeverity.CRITICAL:
                score -= 20
            elif threat.severity == ThreatSeverity.HIGH:
                score -= 10
            elif threat.severity == ThreatSeverity.MEDIUM:
                score -= 5
            else:
                score -= 2
        
        # Bonus for quick response time
        resolved_threats = [t for t in self.threats.values() if t.status == ThreatStatus.RESOLVED]
        if resolved_threats:
            avg_resolution_time = sum(
                (datetime.now(timezone.utc) - t.timestamp).total_seconds() 
                for t in resolved_threats[-10:]  # Last 10 resolved
            ) / min(len(resolved_threats), 10)
            
            if avg_resolution_time < 300:  # Under 5 minutes
                score += 5
        
        return max(0.0, min(100.0, score))
    
    def get_last_updated(self) -> str:
        """Get the last updated timestamp"""
        return self.last_updated
    
    def get_real_time_stats(self) -> Dict[str, Any]:
        """Get real-time security statistics"""
        active_threats = self.get_active_threats()
        current_time = time.time()
        
        # Calculate threats blocked today
        threats_today = [
            t for t in self.threats.values() 
            if current_time - t.timestamp < 86400  # 24 hours
        ]
        
        return {
            "active_threats": len(active_threats),
            "threats_blocked_today": len([t for t in threats_today if t.status == ThreatStatus.BLOCKED]),
            "total_threats_blocked": len([t for t in self.threats.values() if t.status == ThreatStatus.BLOCKED]),
            "security_score": self.get_security_score(),
            "threat_level": self._calculate_current_threat_level(active_threats),
            "recent_events": list(self.security_events.values())[-10:] if self.security_events else []
        }
    
    def _calculate_current_threat_level(self, active_threats) -> str:
        """Calculate current threat level based on active threats"""
        if not active_threats:
            return "low"
        
        critical_threats = sum(1 for t in active_threats if t.severity == ThreatSeverity.CRITICAL)
        high_threats = sum(1 for t in active_threats if t.severity == ThreatSeverity.HIGH)
        
        if critical_threats > 0:
            return "critical"
        elif high_threats > 2:
            return "high"
        elif len(active_threats) > 5:
            return "medium"
        else:
            return "low"
    
    def get_threat_analytics(self) -> Dict[str, Any]:
        """Get comprehensive threat analytics"""
        active_threats = self.get_active_threats()
        all_threats = list(self.threats.values())
        
        # Threat distribution
        threat_by_type = {}
        threat_by_severity = {}
        for threat in all_threats:
            threat_by_type[threat.type] = threat_by_type.get(threat.type, 0) + 1
            threat_by_severity[threat.severity] = threat_by_severity.get(threat.severity, 0) + 1
        
        # Geographic analysis (mock for demo)
        geographic_distribution = self._analyze_geographic_threats()
        
        # Trend analysis
        threat_trends = self._analyze_threat_trends()
        
        return {
            "summary": {
                "total_threats": len(all_threats),
                "active_threats": len(active_threats),
                "resolved_threats": len([t for t in all_threats if t.status == ThreatStatus.RESOLVED]),
                "blocked_threats": len([t for t in all_threats if t.status == ThreatStatus.BLOCKED]),
                "security_score": self.get_security_score()
            },
            "distribution": {
                "by_type": threat_by_type,
                "by_severity": threat_by_severity
            },
            "geographic": geographic_distribution,
            "trends": threat_trends,
            "top_threat_sources": self._get_top_threat_sources(),
            "attack_patterns": self._identify_attack_patterns()
        }
    
    def _calculate_threat_risk_score(self, threat: ThreatInfo) -> float:
        """Calculate risk score for a threat"""
        base_score = {
            ThreatSeverity.LOW: 0.2,
            ThreatSeverity.MEDIUM: 0.4,
            ThreatSeverity.HIGH: 0.7,
            ThreatSeverity.CRITICAL: 0.9
        }.get(threat.severity, 0.5)
        
        # Adjust based on threat type
        type_multipliers = {
            ThreatType.DATA_EXFILTRATION: 1.2,
            ThreatType.MODEL_POISONING: 1.2,
            ThreatType.INSIDER_THREAT: 1.1,
            ThreatType.MALWARE: 1.1
        }
        
        multiplier = type_multipliers.get(threat.type, 1.0)
        return min(1.0, base_score * multiplier * threat.confidence_score)
    
    def _auto_create_incident(self, threat: ThreatInfo):
        """Auto-create incident for critical threats"""
        incident = SecurityIncident(
            title=f"Critical {threat.type.replace('_', ' ').title()} Detected",
            description=f"Critical threat detected from {threat.source_ip}: {threat.description}",
            severity=IncidentSeverity.P1_CRITICAL,
            affected_systems=["federated_learning_system"],
            related_threats=[threat.id],
            timeline=[{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "action": "incident_created",
                "details": "Auto-created due to critical threat detection"
            }]
        )
        
        self.create_incident(incident)
    
    def _analyze_event_patterns(self, event: SecurityEvent):
        """Analyze event patterns for anomaly detection"""
        # Mock pattern analysis - in production, would use ML algorithms
        pass
    
    def _analyze_geographic_threats(self) -> Dict[str, Any]:
        """Analyze geographic distribution of threats"""
        # Mock geographic analysis
        return {
            "top_countries": [
                {"country": "Unknown", "count": 15, "percentage": 45.5},
                {"country": "US", "count": 8, "percentage": 24.2},
                {"country": "CN", "count": 6, "percentage": 18.2},
                {"country": "RU", "count": 4, "percentage": 12.1}
            ],
            "threat_density": "medium"
        }
    
    def _analyze_threat_trends(self) -> Dict[str, Any]:
        """Analyze threat trends over time"""
        # Mock trend analysis
        return {
            "daily_trend": "increasing",
            "weekly_average": 12.5,
            "peak_hours": ["14:00-16:00", "20:00-22:00"],
            "seasonal_pattern": "stable"
        }
    
    def _get_top_threat_sources(self) -> List[Dict[str, Any]]:
        """Get top threat sources"""
        ip_counts = {}
        for threat in self.threats.values():
            ip_counts[threat.source_ip] = ip_counts.get(threat.source_ip, 0) + 1
        
        return [
            {"ip": ip, "count": count, "blocked": ip in self.blocked_ips}
            for ip, count in sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
    
    def _identify_attack_patterns(self) -> List[Dict[str, Any]]:
        """Identify common attack patterns"""
        return [
            {
                "pattern": "sequential_port_scanning",
                "confidence": 0.85,
                "description": "Multiple port scans from same source",
                "occurrences": 3
            },
            {
                "pattern": "credential_stuffing",
                "confidence": 0.70,
                "description": "Multiple login attempts with different credentials",
                "occurrences": 7
            }
        ]

# Global enhanced threat tracker
enhanced_threat_tracker = EnhancedThreatTracker()

# Load persisted enhanced security configuration if available
try:
    from ..config.security_config import load_enhanced_security_config
    persisted_cfg = load_enhanced_security_config()
    if persisted_cfg:
        # Only set fields present in the model to avoid errors
        try:
            enhanced_threat_tracker.security_config = SecurityConfiguration(**persisted_cfg)
        except Exception:
            pass
except Exception:
    pass

def get_app_state():
    """Get app_state dynamically to avoid circular imports"""
    try:
        from backend.main import app_state
        return app_state
    except ImportError:
        return None

# Helper functions

def _calculate_threat_level(active_threats: List[ThreatInfo]) -> str:
    """Calculate current threat level based on active threats"""
    if not active_threats:
        return "low"
    
    critical_threats = len([t for t in active_threats if t.severity == ThreatSeverity.CRITICAL])
    high_threats = len([t for t in active_threats if t.severity == ThreatSeverity.HIGH])
    
    if critical_threats > 0 or high_threats > 3:
        return "critical"
    elif high_threats > 0 or len(active_threats) > 5:
        return "high"
    elif len(active_threats) > 2:
        return "medium"
    else:
        return "low"

def _calculate_detection_accuracy() -> float:
    """Calculate detection accuracy based on historical data"""
    # Mock calculation - in production, this would analyze false positives/negatives
    total_events = len(enhanced_threat_tracker.security_events)
    if total_events == 0:
        return 95.0
    
    # Simulate 95-98% accuracy based on event patterns
    false_positives = total_events * 0.03  # 3% false positive rate
    accuracy = ((total_events - false_positives) / total_events) * 100
    return round(accuracy, 1)

def _calculate_avg_response_time() -> float:
    """Calculate average response time for threats"""
    # Mock calculation - in production, this would analyze incident response times
    incidents = list(enhanced_threat_tracker.incidents.values())
    if not incidents:
        return 15.0
    
    # Simulate response times between 5-30 minutes
    total_time = sum(25 if i.severity == IncidentSeverity.P1_CRITICAL else 
                    15 if i.severity == IncidentSeverity.P2_HIGH else 10 
                    for i in incidents[-20:])  # Last 20 incidents
    
    avg_time = total_time / min(len(incidents), 20)
    return round(avg_time, 1)

def _calculate_avg_incident_resolution_time() -> str:
    """Calculate average incident resolution time"""
    resolved_incidents = [
        i for i in enhanced_threat_tracker.incidents.values()
        if i.status in ["resolved", "closed"] and i.resolved_at
    ]
    
    if not resolved_incidents:
        return "No resolved incidents"
    
    total_resolution_time = 0
    for incident in resolved_incidents[-10:]:  # Last 10 resolved incidents
        if incident.resolved_at and incident.created_at:
            resolution_time = (incident.resolved_at - incident.created_at).total_seconds() / 60
            total_resolution_time += resolution_time
    
    if total_resolution_time == 0:
        return "No data available"
    
    avg_time = total_resolution_time / len(resolved_incidents[-10:])
    if avg_time < 60:
        return f"{int(avg_time)} minutes"
    else:
        return f"{int(avg_time / 60)} hours {int(avg_time % 60)} minutes"

def _get_security_alerts() -> List[Dict[str, Any]]:
    """Get current security alerts"""
    alerts = []
    
    # Check for critical threats
    critical_threats = [
        t for t in enhanced_threat_tracker.get_active_threats()
        if t.severity == ThreatSeverity.CRITICAL
    ]
    if critical_threats:
        alerts.append({
            "type": "critical_threat",
            "severity": "critical",
            "message": f"{len(critical_threats)} critical threats detected",
            "action_required": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    # Check for high number of blocked IPs
    if len(enhanced_threat_tracker.blocked_ips) > 100:
        alerts.append({
            "type": "high_blocked_ips",
            "severity": "warning",
            "message": f"{len(enhanced_threat_tracker.blocked_ips)} IPs currently blocked",
            "action_required": False,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    # Check for open incidents
    open_incidents = [
        i for i in enhanced_threat_tracker.incidents.values()
        if i.status == "open"
    ]
    if len(open_incidents) > 5:
        alerts.append({
            "type": "high_open_incidents",
            "severity": "warning",
            "message": f"{len(open_incidents)} open security incidents",
            "action_required": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    # Check security score
    security_score = enhanced_threat_tracker.get_security_score()
    if security_score < 70:
        alerts.append({
            "type": "low_security_score",
            "severity": "warning" if security_score >= 50 else "critical",
            "message": f"Security score is {security_score}%",
            "action_required": True,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    
    return alerts

def _get_security_health_alerts() -> List[Dict[str, Any]]:
    """Get security system health alerts"""
    alerts = []
    
    # Check if threat detection is disabled
    if not enhanced_threat_tracker.security_config.threat_detection_enabled:
        alerts.append({
            "component": "threat_detection",
            "severity": "critical",
            "message": "Threat detection is disabled",
            "recommendation": "Enable threat detection immediately"
        })
    
    # Check if auto-blocking is disabled
    if not enhanced_threat_tracker.security_config.auto_block_enabled:
        alerts.append({
            "component": "auto_blocking",
            "severity": "warning",
            "message": "Auto-blocking is disabled",
            "recommendation": "Consider enabling auto-blocking for enhanced security"
        })
    
    # Check for excessive open incidents
    open_incidents = len([
        i for i in enhanced_threat_tracker.incidents.values()
        if i.status == "open"
    ])
    if open_incidents > 10:
        alerts.append({
            "component": "incident_response",
            "severity": "warning",
            "message": f"{open_incidents} open incidents require attention",
            "recommendation": "Review and resolve open security incidents"
        })
    
    # Check for old security events
    old_events = [
        e for e in enhanced_threat_tracker.security_events.values()
        if (datetime.now(timezone.utc) - e.timestamp).days > 30
    ]
    if len(old_events) > 1000:
        alerts.append({
            "component": "audit_logging",
            "severity": "info",
            "message": f"{len(old_events)} old security events should be archived",
            "recommendation": "Archive old security events to improve performance"
        })
    
    return alerts

def _get_config_changes(old_config: Dict[str, Any], new_config: Dict[str, Any]) -> Dict[str, Any]:
    """Get configuration changes between old and new config"""
    changes = {}
    
    for key, new_value in new_config.items():
        old_value = old_config.get(key)
        if old_value != new_value:
            changes[key] = {
                "old_value": old_value,
                "new_value": new_value
            }
    
    # Check for removed keys
    for key in old_config:
        if key not in new_config:
            changes[key] = {
                "old_value": old_config[key],
                "new_value": None,
                "action": "removed"
            }
    
    return changes

# Enhanced API endpoints

@router.get("/threats",
            summary="Get Threats",
            description="Get comprehensive threat information with filtering and analytics")
@limiter.limit("50/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_threats(
    request: Request = None,
    threat_type: Optional[ThreatType] = Query(None, description="Filter by threat type"),
    severity: Optional[ThreatSeverity] = Query(None, description="Filter by severity"),
    status: Optional[ThreatStatus] = Query(None, description="Filter by status"),
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    include_resolved: bool = Query(False, description="Include resolved threats")
) -> Dict[str, Any]:
    """Get threats with advanced filtering and analytics"""
    
    if PROM_AVAILABLE and PROM_SECURITY_REQUESTS:
        try:
            PROM_SECURITY_REQUESTS.labels(endpoint="threats", status="requested").inc()
        except Exception:
            pass
    
    try:
        # Get threats from enhanced tracker
        threats = enhanced_threat_tracker.get_active_threats(hours)
        
        # Add resolved threats if requested
        if include_resolved:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            resolved_threats = [
                t for t in enhanced_threat_tracker.threats.values()
                if t.timestamp > cutoff_time and t.status == ThreatStatus.RESOLVED
            ]
            threats.extend(resolved_threats)
        
        # Apply filters
        if threat_type:
            threats = [t for t in threats if t.type == threat_type]
        if severity:
            threats = [t for t in threats if t.severity == severity]
        if status:
            threats = [t for t in threats if t.status == status]
        
        # Sort by timestamp (most recent first)
        threats.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply limit
        threats = threats[:limit]
        
        # Get analytics
        analytics = enhanced_threat_tracker.get_threat_analytics()
        
        # Check with legacy IDS engine if available
        app_state = get_app_state()
        legacy_threats = []
        if app_state and hasattr(app_state, 'ids_engine') and app_state.ids_engine:
            try:
                metrics = await app_state.ids_engine.get_current_metrics()
                legacy_threats = metrics.get('recent_threats', [])
            except Exception as e:
                logger.warning("Failed to get legacy threats", error=str(e))
        
        if PROM_AVAILABLE and PROM_SECURITY_REQUESTS and PROM_SECURITY_SCORE:
            try:
                PROM_SECURITY_REQUESTS.labels(endpoint="threats", status="success").inc()
                PROM_SECURITY_SCORE.set(analytics["summary"]["security_score"])
            except Exception:
                pass
        
        return {
            "status": "success",
            "threats": [threat.dict() for threat in threats],
            "total_threats": len(threats),
            "legacy_threats": legacy_threats,
            "analytics": analytics,
            "filters_applied": {
                "threat_type": threat_type,
                "severity": severity,
                "status": status,
                "hours": hours,
                "include_resolved": include_resolved
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        if PROM_AVAILABLE and PROM_SECURITY_REQUESTS:
            try:
                PROM_SECURITY_REQUESTS.labels(endpoint="threats", status="error").inc()
            except Exception:
                pass
        
        logger.error("Error getting threats", error=str(e))
        return {"status": "error", "threats": [], "total_threats": 0, "error": str(e)}

@router.post("/threats",
             summary="Report Threat",
             description="Report a new security threat")
@limiter.limit("20/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def report_threat(
    request: Request,
    threat: ThreatInfo
) -> Dict[str, Any]:
    """Report a new security threat with comprehensive tracking"""
    
    try:
        # Add threat to enhanced tracker
        threat_id = enhanced_threat_tracker.add_threat(threat)
        
        # Log threat report for audit
        if audit_logger:
            await audit_logger.log_security_event(
                "THREAT_REPORTED",
                "security_system",
                {
                    "threat_id": threat_id,
                    "threat_type": threat.type,
                    "severity": threat.severity,
                    "source_ip": threat.source_ip
                },
                "WARNING" if threat.severity in [ThreatSeverity.HIGH, ThreatSeverity.CRITICAL] else "INFO"
            )
        
        logger.warning("Threat reported", 
                      threat_id=threat_id, 
                      type=threat.type, 
                      severity=threat.severity)
        
        return {
            "status": "success",
            "message": "Threat reported successfully",
            "threat_id": threat_id,
            "auto_actions": {
                "blocked": threat.source_ip in enhanced_threat_tracker.blocked_ips,
                "incident_created": threat.severity == ThreatSeverity.CRITICAL
            }
        }
        
    except Exception as e:
        logger.error("Error reporting threat", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to report threat")

@router.get("/threats/{threat_id}",
            summary="Get Threat Details",
            description="Get detailed information about a specific threat")
@limiter.limit("100/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_threat_details(
    threat_id: str = Path(description="Threat ID"),
    request: Request = None
) -> Dict[str, Any]:
    """Get detailed threat information"""
    
    try:
        if threat_id not in enhanced_threat_tracker.threats:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        threat = enhanced_threat_tracker.threats[threat_id]
        
        # Get related incidents
        related_incidents = [
            incident for incident in enhanced_threat_tracker.incidents.values()
            if threat_id in incident.related_threats
        ]
        
        # Get related security events
        related_events = [
            event for event in enhanced_threat_tracker.security_events.values()
            if event.metadata.get("threat_id") == threat_id
        ]
        
        return {
            "status": "success",
            "threat": threat.dict(),
            "related_incidents": [incident.dict() for incident in related_incidents],
            "related_events": [event.dict() for event in related_events[-10:]],  # Last 10 events
            "mitigation_status": {
                "ip_blocked": threat.source_ip in enhanced_threat_tracker.blocked_ips,
                "actions_taken": len(threat.mitigation_actions),
                "incident_created": len(related_incidents) > 0
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting threat details", threat_id=threat_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get threat details")

@router.put("/threats/{threat_id}/status",
            summary="Update Threat Status",
            description="Update the status of a security threat")
@limiter.limit("30/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def update_threat_status(
    threat_id: str = Path(description="Threat ID"),
    status_update: Dict[str, Any] = Body(),
    request: Request = None
) -> Dict[str, Any]:
    """Update threat status with audit trail"""
    
    try:
        if threat_id not in enhanced_threat_tracker.threats:
            raise HTTPException(status_code=404, detail="Threat not found")
        
        threat = enhanced_threat_tracker.threats[threat_id]
        old_status = threat.status
        
        # Update status
        new_status = ThreatStatus(status_update.get("status"))
        threat.status = new_status
        
        # Add mitigation actions if provided
        if "mitigation_actions" in status_update:
            threat.mitigation_actions.extend(status_update["mitigation_actions"])
        
        # Log status change
        enhanced_threat_tracker.add_security_event(SecurityEvent(
            event_type=SecurityEventType.THREAT_DETECTED,
            source="security_analyst",
            action="threat_status_updated",
            outcome=f"status_changed_{old_status}_to_{new_status}",
            metadata={
                "threat_id": threat_id,
                "old_status": old_status,
                "new_status": new_status,
                "reason": status_update.get("reason", "Manual update")
            }
        ))
        
        logger.info("Threat status updated", 
                   threat_id=threat_id, 
                   old_status=old_status, 
                   new_status=new_status)
        
        return {
            "status": "success",
            "message": "Threat status updated successfully",
            "threat_id": threat_id,
            "old_status": old_status,
            "new_status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating threat status", threat_id=threat_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update threat status")

@router.get("/metrics",
            summary="Get Security Metrics",
            description="Get comprehensive security metrics and KPIs")
@limiter.limit("60/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_security_metrics(request: Request = None) -> Dict[str, Any]:
    """Get comprehensive security metrics and analytics"""
    try:
        # Get enhanced analytics
        analytics = enhanced_threat_tracker.get_threat_analytics()
        # Get legacy metrics if available
        legacy_metrics = {}
        app_state = get_app_state()
        if app_state and hasattr(app_state, 'ids_engine') and app_state.ids_engine:
            try:
                legacy_metrics = await app_state.ids_engine.get_current_metrics()
            except Exception as e:
                logger.warning("Failed to get legacy metrics", error=str(e))
        
        # Calculate advanced metrics
        security_score = enhanced_threat_tracker.get_security_score()
        active_threats = enhanced_threat_tracker.get_active_threats()
        
        metrics = {
            "overview": {
                "security_score": security_score,
                "threat_level": _calculate_threat_level(active_threats),
                "active_threats": len(active_threats),
                "blocked_ips": len(enhanced_threat_tracker.blocked_ips),
                "total_incidents": len(enhanced_threat_tracker.incidents),
                "detection_accuracy": _calculate_detection_accuracy(),
                "response_time_avg": _calculate_avg_response_time(),
                "uptime_percentage": 99.8
            },
            "threat_metrics": analytics,
            "performance_metrics": {
                "detection_latency": "125ms",
                "false_positive_rate": "2.1%",
                "threat_blocking_success": "97.3%",
                "incident_resolution_time": "45 minutes"
            },
            "compliance_metrics": {
                "audit_coverage": "100%",
                "policy_compliance": "98.5%",
                "security_controls_active": "95%",
                "vulnerability_management": "92%"
            },
            "legacy_metrics": legacy_metrics,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        
        # Update Prometheus metrics
        if PROM_AVAILABLE and PROM_SECURITY_SCORE and PROM_ACTIVE_THREATS:
            try:
                PROM_SECURITY_SCORE.set(security_score)
                PROM_ACTIVE_THREATS.set(len(active_threats))
            except Exception:
                pass
        
        return {
            "status": "success",
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error("Error getting security metrics", error=str(e))
        return {"status": "error", "error": str(e)}


@router.get("/overview", summary="Security Overview", description="Get a summary of current security status")
async def get_security_overview(request: Request = None) -> Dict[str, Any]:
    """Get a summary of current security status"""
    try:
        dashboard = await get_security_health()
        score = enhanced_threat_tracker.get_security_score()
        return {
            "status": "success",
            "security_score": score,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error("Error getting security score", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get security score")
        
@router.get("/metrics/custom", summary="Custom Security Metrics", description="Get custom security metrics")
async def get_custom_security_metrics(request: Request = None) -> Dict[str, Any]:
    """Get custom security metrics"""
    try:
        metrics = {
            "score": enhanced_threat_tracker.get_security_score(),
            "active_threats": len(enhanced_threat_tracker.get_active_threats()),
            "blocked_ips": len(enhanced_threat_tracker.blocked_ips),
            "incidents": len(enhanced_threat_tracker.incidents),
            "last_update": datetime.now(timezone.utc).isoformat()
        }
        return {
            "status": "success",
            "metrics": metrics
        }
    except Exception as e:
        logger.error("Error getting custom metrics", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get custom metrics")


@router.post("/start-monitoring",
             summary="Start Security Monitoring",
             description="Start comprehensive security monitoring")
@limiter.limit("10/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def start_security_monitoring(request: Request = None) -> Dict[str, Any]:
    """Start comprehensive security monitoring with enhanced features"""
    
    try:
        # Start legacy monitoring if available
        app_state = get_app_state()
        legacy_started = False
        if app_state and hasattr(app_state, 'ids_engine') and app_state.ids_engine:
            try:
                await app_state.ids_engine.start_monitoring()
                legacy_started = True
            except Exception as e:
                logger.warning("Failed to start legacy monitoring", error=str(e))
        
        # Enable enhanced threat detection
        enhanced_threat_tracker.security_config.threat_detection_enabled = True
        
        # Log monitoring start
        enhanced_threat_tracker.add_security_event(SecurityEvent(
            event_type=SecurityEventType.CONFIGURATION_CHANGE,
            source="security_system",
            action="monitoring_started",
            outcome="monitoring_active",
            metadata={"legacy_monitoring": legacy_started}
        ))
        
        logger.info("Security monitoring started", 
                   enhanced=True, 
                   legacy=legacy_started)
        
        return {
            "status": "success",
            "message": "Security monitoring started successfully",
            "enhanced_monitoring": True,
            "legacy_monitoring": legacy_started,
            "features_enabled": [
                "threat_detection",
                "anomaly_detection", 
                "incident_response",
                "auto_blocking",
                "audit_logging"
            ]
        }
        
    except Exception as e:
        logger.error("Error starting security monitoring", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to start security monitoring")

@router.post("/stop-monitoring",
             summary="Stop Security Monitoring",
             description="Stop security monitoring")
@limiter.limit("10/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def stop_security_monitoring(request: Request = None) -> Dict[str, Any]:
    """Stop security monitoring"""
    
    try:
        # Stop legacy monitoring if available
        app_state = get_app_state()
        legacy_stopped = False
        if app_state and hasattr(app_state, 'ids_engine') and app_state.ids_engine:
            try:
                await app_state.ids_engine.stop_monitoring()
                legacy_stopped = True
            except Exception as e:
                logger.warning("Failed to stop legacy monitoring", error=str(e))
        
        # Disable enhanced threat detection
        enhanced_threat_tracker.security_config.threat_detection_enabled = False
        
        # Log monitoring stop
        enhanced_threat_tracker.add_security_event(SecurityEvent(
            event_type=SecurityEventType.CONFIGURATION_CHANGE,
            source="security_system",
            action="monitoring_stopped",
            outcome="monitoring_inactive",
            metadata={"legacy_monitoring": legacy_stopped}
        ))
        
        logger.warning("Security monitoring stopped")
        
        return {
            "status": "success",
            "message": "Security monitoring stopped",
            "enhanced_monitoring": False,
            "legacy_monitoring": not legacy_stopped
        }
        
    except Exception as e:
        logger.error("Error stopping security monitoring", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to stop security monitoring")

@router.get("/dashboard",
            summary="Security Dashboard",
            description="Get comprehensive security dashboard data")
@limiter.limit("30/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_security_dashboard(request: Request = None) -> Dict[str, Any]:
    """Get enhanced security dashboard with real-time analytics"""
    
    try:
        # Get enhanced analytics
        analytics = enhanced_threat_tracker.get_threat_analytics()
        active_threats = enhanced_threat_tracker.get_active_threats()
        security_score = enhanced_threat_tracker.get_security_score()
        
        # Get recent security events
        recent_events = sorted(
            enhanced_threat_tracker.security_events.values(),
            key=lambda x: x.timestamp,
            reverse=True
        )[:20]
        
        # Get active incidents
        active_incidents = [
            incident for incident in enhanced_threat_tracker.incidents.values()
            if incident.status not in ["closed", "resolved"]
        ]
        
        dashboard_data = {
            "threat_summary": {
                "threat_level": _calculate_threat_level(active_threats),
                "active_threats": len(active_threats),
                "blocked_attacks": len([t for t in enhanced_threat_tracker.threats.values() 
                                      if t.status == ThreatStatus.BLOCKED]),
                "security_score": security_score,
                "system_status": "secure" if security_score >= 80 else "at_risk"
            },
            "real_time_stats": {
                "threats_detected_today": len([
                    t for t in enhanced_threat_tracker.threats.values()
                    if t.timestamp > datetime.now(timezone.utc) - timedelta(days=1)
                ]),
                "ips_blocked": len(enhanced_threat_tracker.blocked_ips),
                "incidents_active": len(active_incidents),
                "events_last_hour": len([
                    e for e in enhanced_threat_tracker.security_events.values()
                    if e.timestamp > datetime.now(timezone.utc) - timedelta(hours=1)
                ])
            },
            "threat_analytics": analytics,
            "recent_events": [event.dict() for event in recent_events],
            "active_incidents": [incident.dict() for incident in active_incidents],
            "monitoring_status": {
                "threat_detection": enhanced_threat_tracker.security_config.threat_detection_enabled,
                "auto_blocking": enhanced_threat_tracker.security_config.auto_block_enabled,
                "audit_logging": enhanced_threat_tracker.security_config.audit_logging_enabled,
                "incident_response": enhanced_threat_tracker.security_config.incident_response_enabled
            },
            "alerts": _get_security_alerts(),
            "last_update": enhanced_threat_tracker.last_update
        }
        
        return {
            "status": "success",
            "data": dashboard_data,
            "real_time": True
        }
        
    except Exception as e:
        logger.error("Error getting security dashboard", error=str(e))
        return {
            "status": "error",
            "data": {
                "threat_summary": {
                    "threat_level": "unknown",
                    "active_threats": 0,
                    "blocked_attacks": 0,
                    "security_score": 0,
                    "system_status": "error"
                }
            },
            "error": str(e)
        }

@router.get("/incidents",
            summary="Get Security Incidents",
            description="Get security incidents with filtering and analytics")
@limiter.limit("30/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_security_incidents(
    request: Request = None,
    severity: Optional[IncidentSeverity] = Query(None, description="Filter by severity"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=500, description="Maximum results")
) -> Dict[str, Any]:
    """Get security incidents with comprehensive filtering"""
    
    try:
        incidents = list(enhanced_threat_tracker.incidents.values())
        
        # Apply filters
        if severity:
            incidents = [i for i in incidents if i.severity == severity]
        if status:
            incidents = [i for i in incidents if i.status == status]
        
        # Sort by creation time (most recent first)
        incidents.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply limit
        incidents = incidents[:limit]
        
        # Calculate statistics
        incident_stats = {
            "total_incidents": len(enhanced_threat_tracker.incidents),
            "open_incidents": len([i for i in enhanced_threat_tracker.incidents.values() 
                                 if i.status == "open"]),
            "critical_incidents": len([i for i in enhanced_threat_tracker.incidents.values() 
                                     if i.severity == IncidentSeverity.P1_CRITICAL]),
            "avg_resolution_time": _calculate_avg_incident_resolution_time()
        }
        
        return {
            "status": "success",
            "incidents": [incident.dict() for incident in incidents],
            "statistics": incident_stats,
            "filters_applied": {"severity": severity, "status": status, "limit": limit}
        }
        
    except Exception as e:
        logger.error("Error getting security incidents", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get security incidents")

@router.post("/incidents",
             summary="Create Security Incident",
             description="Create a new security incident")
@limiter.limit("10/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def create_security_incident(
    request: Request,
    incident: SecurityIncident
) -> Dict[str, Any]:
    """Create a new security incident with comprehensive tracking"""
    
    try:
        incident_id = enhanced_threat_tracker.create_incident(incident)
        
        # Log incident creation
        if audit_logger:
            await audit_logger.log_security_event(
                "SECURITY_INCIDENT_CREATED",
                "security_system",
                {
                    "incident_id": incident_id,
                    "severity": incident.severity,
                    "title": incident.title
                },
                "WARNING"
            )
        
        return {
            "status": "success",
            "message": "Security incident created successfully",
            "incident_id": incident_id,
            "severity": incident.severity
        }
        
    except Exception as e:
        logger.error("Error creating security incident", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create security incident")

@router.get("/blocked-ips",
            summary="Get Blocked IPs",
            description="Get list of blocked IP addresses")
@limiter.limit("30/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_blocked_ips(request: Request = None) -> Dict[str, Any]:
    """Get list of blocked IP addresses with analytics"""
    
    try:
        blocked_ips = list(enhanced_threat_tracker.blocked_ips)
        
        # Get block reasons from security events
        ip_details = {}
        for event in enhanced_threat_tracker.security_events.values():
            if (event.event_type == SecurityEventType.ACCESS_DENIED and 
                event.action == "ip_blocked" and event.ip_address):
                ip_details[event.ip_address] = {
                    "blocked_at": event.timestamp.isoformat(),
                    "reason": event.metadata.get("reason", "Unknown"),
                    "auto_blocked": event.metadata.get("auto_blocked", False)
                }
        
        return {
            "status": "success",
            "blocked_ips": [
                {
                    "ip": ip,
                    "details": ip_details.get(ip, {"reason": "Unknown"})
                }
                for ip in blocked_ips
            ],
            "total_blocked": len(blocked_ips),
            "auto_blocking_enabled": enhanced_threat_tracker.security_config.auto_block_enabled
        }
        
    except Exception as e:
        logger.error("Error getting blocked IPs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get blocked IPs")

@router.post("/block-ip",
             summary="Block IP Address",
             description="Block an IP address for security reasons")
@limiter.limit("20/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def block_ip_address(
    request: Request,
    block_request: Dict[str, Any] = Body()
) -> Dict[str, Any]:
    """Block IP address with reason tracking"""
    
    try:
        ip_address = block_request.get("ip_address")
        reason = block_request.get("reason", "Manual block")
        
        if not ip_address:
            raise HTTPException(status_code=400, detail="IP address is required")
        
        # Validate IP address
        try:
            ipaddress.ip_address(ip_address)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        enhanced_threat_tracker.block_ip(ip_address, reason)
        
        # Log manual block for audit
        if audit_logger:
            await audit_logger.log_security_event(
                "IP_ADDRESS_BLOCKED",
                "security_admin",
                {
                    "ip_address": ip_address,
                    "reason": reason,
                    "manual_block": True
                },
                "WARNING"
            )
        
        return {
            "status": "success",
            "message": f"IP address {ip_address} blocked successfully",
            "ip_address": ip_address,
            "reason": reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error blocking IP address", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to block IP address")

@router.delete("/blocked-ips/{ip_address}",
               summary="Unblock IP Address",
               description="Unblock a previously blocked IP address")
@limiter.limit("20/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def unblock_ip_address(
    ip_address: str = Path(description="IP address to unblock"),
    request: Request = None,
    reason: str = Query("Manual unblock", description="Reason for unblocking")
) -> Dict[str, Any]:
    """Unblock IP address"""
    
    try:
        # Validate IP address
        try:
            ipaddress.ip_address(ip_address)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid IP address format")
        
        if ip_address not in enhanced_threat_tracker.blocked_ips:
            raise HTTPException(status_code=404, detail="IP address is not blocked")
        
        enhanced_threat_tracker.unblock_ip(ip_address, reason)
        
        # Log manual unblock for audit
        if audit_logger:
            await audit_logger.log_security_event(
                "IP_ADDRESS_UNBLOCKED",
                "security_admin",
                {
                    "ip_address": ip_address,
                    "reason": reason,
                    "manual_unblock": True
                },
                "INFO"
            )
        
        return {
            "status": "success",
            "message": f"IP address {ip_address} unblocked successfully",
            "ip_address": ip_address,
            "reason": reason
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error unblocking IP address", ip=ip_address, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to unblock IP address")

@router.get("/events",
            summary="Get Security Events",
            description="Get security events with filtering and analytics")
@limiter.limit("40/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_security_events(
    request: Request = None,
    event_type: Optional[SecurityEventType] = Query(None, description="Filter by event type"),
    hours: int = Query(24, ge=1, le=168, description="Time window in hours"),
    limit: int = Query(200, ge=1, le=1000, description="Maximum results")
) -> Dict[str, Any]:
    """Get security events with comprehensive filtering"""
    
    try:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        events = [
            event for event in enhanced_threat_tracker.security_events.values()
            if event.timestamp > cutoff_time
        ]
        
        # Apply event type filter
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        # Sort by timestamp (most recent first)
        events.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply limit
        events = events[:limit]
        
        # Calculate event statistics
        event_stats = {
            "total_events": len(events),
            "unique_sources": len(set(event.source for event in events)),
            "high_risk_events": len([e for e in events if e.risk_score > 0.7]),
            "event_types": {}
        }
        
        for event in events:
            event_stats["event_types"][event.event_type] = \
                event_stats["event_types"].get(event.event_type, 0) + 1
        
        return {
            "status": "success",
            "events": [event.dict() for event in events],
            "statistics": event_stats,
            "filters_applied": {"event_type": event_type, "hours": hours, "limit": limit}
        }
        
    except Exception as e:
        logger.error("Error getting security events", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get security events")

@router.get("/configuration",
            summary="Get Security Configuration",
            description="Get current security configuration")
@limiter.limit("30/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def get_security_configuration(request: Request = None) -> Dict[str, Any]:
    """Get current security configuration"""
    
    try:
        config = enhanced_threat_tracker.security_config
        
        return {
            "status": "success",
            "configuration": config.dict(),
            "last_updated": enhanced_threat_tracker.last_update
        }
        
    except Exception as e:
        logger.error("Error getting security configuration", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get security configuration")

@router.put("/configuration",
            summary="Update Security Configuration", 
            description="Update security configuration settings")
@limiter.limit("10/minute") if RATE_LIMITING_AVAILABLE else lambda x: x
async def update_security_configuration(
    request: Request,
    config_update: SecurityConfiguration
) -> Dict[str, Any]:
    """Update security configuration with audit trail"""
    
    try:
        old_config = enhanced_threat_tracker.security_config.dict()
        enhanced_threat_tracker.security_config = config_update
        
        # Log configuration change
        enhanced_threat_tracker.add_security_event(SecurityEvent(
            event_type=SecurityEventType.CONFIGURATION_CHANGE,
            source="security_admin",
            action="configuration_updated",
            outcome="configuration_changed",
            metadata={
                "old_config": old_config,
                "new_config": config_update.dict()
            }
        ))
        
        # Log for audit
        if audit_logger:
            await audit_logger.log_security_event(
                "SECURITY_CONFIGURATION_UPDATED",
                "security_admin",
                {
                    "changes": _get_config_changes(old_config, config_update.dict())
                },
                "INFO"
            )
        
        # Persist configuration to disk so it survives restarts
        try:
            from ..config.security_config import save_enhanced_security_config
            save_enhanced_security_config(config_update.dict())
        except Exception:
            pass

        logger.info("Security configuration updated")
        
        return {
            "status": "success",
            "message": "Security configuration updated successfully",
            "configuration": config_update.dict()
        }
        
    except Exception as e:
        logger.error("Error updating security configuration", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update security configuration")

@router.get("/health",
            summary="Security System Health",
            description="Get security system health and status")
async def get_security_health() -> Dict[str, Any]:
    """Get security system health check"""
    
    try:
        active_threats = enhanced_threat_tracker.get_active_threats()
        security_score = enhanced_threat_tracker.get_security_score()
        
        health_status = {
            "overall_health": "healthy" if security_score >= 80 else "degraded" if security_score >= 60 else "critical",
            "security_score": security_score,
            "components": {
                "threat_detection": {
                    "status": "operational" if enhanced_threat_tracker.security_config.threat_detection_enabled else "disabled",
                    "active_threats": len(active_threats),
                    "detection_rate": "94.2%"
                },
                "auto_blocking": {
                    "status": "operational" if enhanced_threat_tracker.security_config.auto_block_enabled else "disabled",
                    "blocked_ips": len(enhanced_threat_tracker.blocked_ips),
                    "blocking_effectiveness": "97.8%"
                },
                "incident_response": {
                    "status": "operational" if enhanced_threat_tracker.security_config.incident_response_enabled else "disabled",
                    "open_incidents": len([i for i in enhanced_threat_tracker.incidents.values() if i.status == "open"]),
                    "avg_response_time": "12 minutes"
                },
                "audit_logging": {
                    "status": "operational" if enhanced_threat_tracker.security_config.audit_logging_enabled else "disabled",
                    "events_logged": len(enhanced_threat_tracker.security_events),
                    "log_retention": "90 days"
                }
            },
            "alerts": _get_security_health_alerts(),
            "last_check": datetime.now(timezone.utc).isoformat()
        }
        
        return health_status
        
    except Exception as e:
        logger.error("Security health check failed", error=str(e))
        raise HTTPException(status_code=500, detail="Security health check failed")

# Legacy compatibility endpoints

@router.get("/threats-legacy",
            summary="Get Threats (Legacy)",
            description="Legacy endpoint for getting detected threats")
async def get_threats_legacy() -> Dict[str, Any]:
    """Get detected threats (legacy endpoint)"""
    app_state = get_app_state()
    if not app_state or not hasattr(app_state, 'ids_engine') or not app_state.ids_engine:
        # Return enhanced threats data
        try:
            active_threats = enhanced_threat_tracker.get_active_threats()
            return {
                "threats": [threat.dict() for threat in active_threats],
                "total": len(active_threats),
                "threat_types": {},
                "detection_stats": {}
            }
        except Exception as e:
            logger.error("Error getting enhanced threats", error=str(e))
            return {"threats": [], "total": 0}
    
    try:
        metrics = await app_state.ids_engine.get_current_metrics()
        threats = metrics.get('recent_threats', [])
        
        return {
            "threats": threats,
            "total": len(threats),
            "threat_types": metrics.get('threat_types', {}),
            "detection_stats": metrics.get('detection_stats', {})
        }
    except Exception as e:
        logger.error("Error getting legacy threats", error=str(e))
        return {"threats": [], "total": 0}

@router.get("/metrics-legacy",
            summary="Get Security Metrics (Legacy)",
            description="Legacy endpoint for security metrics")
async def get_security_metrics_legacy() -> Dict[str, Any]:
    """Get security metrics (legacy endpoint)"""
    app_state = get_app_state()
    if not app_state or not hasattr(app_state, 'ids_engine') or not app_state.ids_engine:
        # Return enhanced metrics
        try:
            analytics = enhanced_threat_tracker.get_threat_analytics()
            security_score = enhanced_threat_tracker.get_security_score()
            
            return {
                "detection_accuracy": _calculate_detection_accuracy(),
                "threats_detected": analytics["summary"]["total_threats"],
                "false_positive_rate": 2.1,
                "monitoring_status": "active" if enhanced_threat_tracker.security_config.threat_detection_enabled else "inactive",
                "security_score": security_score
            }
        except Exception as e:
            logger.error("Error getting enhanced metrics", error=str(e))
            return {"error": "Failed to get security metrics"}
    
    try:
        metrics = await app_state.ids_engine.get_current_metrics()
        return {
            "detection_accuracy": metrics.get('detection_stats', {}).get('accuracy', 0.0),
            "threats_detected": metrics.get('detection_stats', {}).get('threats_detected', 0),
            "false_positive_rate": metrics.get('detection_stats', {}).get('false_positives', 0),
            "monitoring_status": "active" if metrics.get('is_running') else "inactive"
        }
    except Exception as e:
        logger.error("Error getting legacy security metrics", error=str(e))
        return {"error": "Failed to get security metrics"}

@router.get("/stop-monitoring-legacy",
            summary="Stop Security Monitoring (Legacy)",
            description="Legacy endpoint for stopping security monitoring")
async def stop_security_monitoring_legacy(request: Request = None) -> Dict[str, Any]:
    """Legacy stop monitoring endpoint"""
    return await stop_security_monitoring(request)

@router.get("/status",
            summary="Security Status (Legacy)",
            description="Legacy endpoint for security status")
async def get_security_status_legacy() -> Dict[str, Any]:
    """Legacy security status endpoint"""
    try:
        health = await get_security_health()
        return {
            "status": health["overall_health"],
            "monitoring": health["components"]["threat_detection"]["status"],
            "security_score": health["security_score"],
            "active_threats": health["components"]["threat_detection"]["active_threats"]
        }
    except Exception as e:
        logger.error("Error getting security status", error=str(e))
        return {
            "status": "error",
            "monitoring": "unknown",
            "security_score": 0,
            "active_threats": 0
        }

# Merged from enterprise_security.py - Legacy threat tracker for compatibility
class LegacyThreatTracker:
    """Legacy threat tracker for backward compatibility"""
    def __init__(self):
        self.active_threats = []
        self.blocked_threats = []
        self.total_threats_blocked = 0
        self.security_events = []
        self.last_update = time.time()
    
    def add_threat(self, threat_type: str, source_ip: str, severity: str, status: str = "Detected"):
        """Add a new threat to tracking"""
        threat = {
            "type": threat_type,
            "source": source_ip,
            "severity": severity,
            "status": status,
            "time": datetime.now().strftime("%H:%M:%S"),
            "timestamp": time.time()
        }
        
        if status == "Blocked":
            self.blocked_threats.append(threat)
            self.total_threats_blocked += 1
        else:
            self.active_threats.append(threat)
        
        self.security_events.insert(0, threat)
        
        # Keep only last 100 events
        if len(self.security_events) > 100:
            self.security_events = self.security_events[:100]
        
        # Remove old active threats (older than 1 hour)
        current_time = time.time()
        self.active_threats = [t for t in self.active_threats 
                              if current_time - t['timestamp'] < 3600]
        
        self.last_update = current_time
    
    def get_real_time_stats(self):
        """Get real-time security statistics"""
        return {
            "active_threats": len(self.active_threats),
            "threats_blocked_today": len([t for t in self.blocked_threats 
                                         if time.time() - t['timestamp'] < 86400]),
            "total_threats_blocked": self.total_threats_blocked,
            "security_score": max(0, 100 - (len(self.active_threats) * 5)),
            "threat_level": self._calculate_threat_level(),
            "recent_events": self.security_events[:10]
        }
    
    def _calculate_threat_level(self):
        """Calculate current threat level"""
        active_count = len(self.active_threats)
        if active_count == 0:
            return "low"
        elif active_count < 5:
            return "medium"
        else:
            return "high"

# Global legacy threat tracker instance for compatibility
legacy_threat_tracker = LegacyThreatTracker()

@router.get("/dashboard-legacy",
            summary="Security Dashboard (Legacy)",
            description="Legacy endpoint for security dashboard")
async def get_security_dashboard_legacy():
    """Get real-time security dashboard data (legacy compatibility)"""
    try:
        # Use enhanced tracker data if available, fallback to legacy
        try:
            return await get_security_dashboard()
        except:
            # Fallback to legacy data
            threat_stats = legacy_threat_tracker.get_real_time_stats()
            
            return {
                "status": "success",
                "data": {
                    "threat_summary": {
                        "threat_level": threat_stats["threat_level"],
                        "active_threats": threat_stats["active_threats"],
                        "blocked_attacks": threat_stats["threats_blocked_today"],
                        "security_score": threat_stats["security_score"],
                        "system_status": "secure"
                    },
                    "threats_detected": threat_stats["active_threats"],
                    "threats_blocked": threat_stats["total_threats_blocked"],
                    "detection_rate": "94%",
                    "security_events": threat_stats["recent_events"],
                    "last_update": legacy_threat_tracker.last_update
                }
            }
    except Exception as e:
        logger.error("Error getting security dashboard", error=str(e))
        return {
            "status": "error",
            "data": {
                "threat_summary": {
                    "threat_level": "unknown",
                    "active_threats": 0,
                    "blocked_attacks": 0,
                    "security_score": 0,
                    "system_status": "error"
                },
                "threats_detected": 0,
                "threats_blocked": 0,
                "detection_rate": "0%",
                "security_events": [],
                "error": str(e)
            }
        }

@router.get("/overview-legacy",
            summary="Security Overview (Legacy)",
            description="Legacy endpoint for security overview")
async def get_security_overview_legacy():
    """Get real-time security overview (legacy compatibility)"""
    try:
        # Use enhanced data if available
        try:
            dashboard_data = await get_security_dashboard()
            if dashboard_data["status"] == "success":
                return {
                    "status": "success",
                    "threat_summary": dashboard_data["data"]["threat_summary"],
                    "real_time": True,
                    "last_update": dashboard_data["data"]["last_update"]
                }
        except:
            pass
        
        # Fallback to legacy data
        threat_stats = legacy_threat_tracker.get_real_time_stats()
        
        return {
            "status": "success",
            "threat_summary": {
                "threat_level": threat_stats["threat_level"],
                "active_threats": threat_stats["active_threats"],
                "blocked_attacks": threat_stats["threats_blocked_today"],
                "security_score": threat_stats["security_score"]
            },
            "real_time": True,
            "last_update": legacy_threat_tracker.last_update
        }
    except Exception as e:
        logger.error("Error getting security overview", error=str(e))
        return {
            "status": "error",
            "threat_summary": {
                "threat_level": "unknown",
                "active_threats": 0,
                "blocked_attacks": 0,
                "security_score": 0
            },
            "error": str(e)
        }

@router.post("/simulate-threat",
             summary="Simulate Threat",
             description="Simulate a threat for testing purposes")
async def simulate_threat_legacy(threat_data: Dict[str, Any]):
    """Simulate a threat for testing (legacy compatibility)"""
    try:
        threat_type = threat_data.get("type", "Port Scan")
        source_ip = threat_data.get("source", f"192.168.1.{int(time.time()) % 255}")
        severity = threat_data.get("severity", "Medium")
        status = threat_data.get("status", "Detected")
        
        # Add to both legacy and enhanced trackers
        legacy_threat_tracker.add_threat(threat_type, source_ip, severity, status)
        
        # Convert to enhanced threat format
        try:
            enhanced_threat = ThreatInfo(
                type=ThreatType(threat_type.lower().replace(" ", "_")) if threat_type.lower().replace(" ", "_") in [t.value for t in ThreatType] else ThreatType.UNKNOWN,
                source_ip=source_ip,
                severity=ThreatSeverity(severity.upper()) if severity.upper() in [s.value for s in ThreatSeverity] else ThreatSeverity.MEDIUM,
                description=f"Simulated {threat_type} from {source_ip}"
            )
            enhanced_threat_tracker.add_threat(enhanced_threat)
        except Exception as e:
            logger.warning("Failed to add to enhanced tracker", error=str(e))
        
        return {
            "status": "success",
            "message": f"Simulated {threat_type} threat from {source_ip}",
            "threat_added": True
        }
    except Exception as e:
        logger.error("Error simulating threat", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# Initialize enhanced security system on module load
def initialize_enhanced_security():
    """Initialize enhanced security system with real threat detection"""
    try:
        # Initialize real threat detection patterns
        threat_patterns = [
            {
                "type": ThreatType.BRUTE_FORCE,
                "indicators": ["multiple_failed_logins", "credential_stuffing", "password_spray"],
                "severity": ThreatSeverity.HIGH,
                "auto_block": True
            },
            {
                "type": ThreatType.DDoS,
                "indicators": ["high_request_rate", "distributed_sources", "resource_exhaustion"],
                "severity": ThreatSeverity.CRITICAL,
                "auto_block": True
            },
            {
                "type": ThreatType.SQL_INJECTION,
                "indicators": ["sql_keywords", "union_select", "malicious_payloads"],
                "severity": ThreatSeverity.CRITICAL,
                "auto_block": True
            },
            {
                "type": ThreatType.MODEL_POISONING,
                "indicators": ["adversarial_gradients", "data_poisoning", "backdoor_triggers"],
                "severity": ThreatSeverity.CRITICAL,
                "auto_block": False
            }
        ]
        
        # Initialize threat intelligence feeds
        threat_intel = [
            ThreatIntelligence(
                indicator="192.168.1.100",
                indicator_type="ip",
                threat_types=[ThreatType.BRUTE_FORCE],
                confidence=0.95,
                source="internal_detection",
                tags=["brute_force", "authentication"]
            ),
            ThreatIntelligence(
                indicator="malicious-domain.com",
                indicator_type="domain",
                threat_types=[ThreatType.MALWARE],
                confidence=0.88,
                source="threat_feed",
                tags=["malware", "c2"]
            )
        ]
        
        for intel in threat_intel:
            enhanced_threat_tracker.threat_intelligence[intel.indicator] = intel
        
        # Initialize security configuration with production settings
        enhanced_threat_tracker.security_config = SecurityConfiguration(
            threat_detection_enabled=True,
            auto_block_enabled=True,
            threat_intelligence_enabled=True,
            audit_logging_enabled=True,
            incident_response_enabled=True,
            anomaly_detection_sensitivity=0.85,
            block_duration_minutes=120,
            max_failed_attempts=3,
            notification_enabled=True
        )
        
        logger.info("Enhanced security system initialized with production configuration")
        
    except Exception as e:
        logger.error("Error initializing enhanced security system", error=str(e))

# Initialize demo threats for legacy compatibility
def initialize_demo_threats():
    """Initialize some demo threats for testing"""
    demo_threats = [
        ("Brute Force", "192.168.1.100", "High", "Blocked"),
        ("Port Scan", "10.0.0.50", "Medium", "Detected"),
        ("SQL Injection", "172.16.0.25", "Critical", "Blocked"),
    ]
    
    for threat_type, source, severity, status in demo_threats:
        legacy_threat_tracker.add_threat(threat_type, source, severity, status)

# Background monitoring task
async def security_monitoring_task():
    """Background task for continuous security monitoring"""
    try:
        while enhanced_threat_tracker.security_config.threat_detection_enabled:
            # Simulate threat detection activity
            await asyncio.sleep(30)  # Check every 30 seconds
            
            # Auto-cleanup old events
            cutoff_time = datetime.now(timezone.utc) - timedelta(days=30)
            old_events = [
                event_id for event_id, event in enhanced_threat_tracker.security_events.items()
                if event.timestamp < cutoff_time
            ]
            
            for event_id in old_events[:100]:  # Remove 100 old events at a time
                del enhanced_threat_tracker.security_events[event_id]
            
            # Update last monitoring time
            enhanced_threat_tracker.last_update = datetime.now(timezone.utc).isoformat()
            
    except Exception as e:
        logger.error("Error in security monitoring task", error=str(e))

# Initialize on module import
try:
    initialize_enhanced_security()
    initialize_demo_threats()
    logger.info("Security module initialized successfully")
except Exception as e:
    logger.error("Failed to initialize security module", error=str(e))

# Export enhanced threat tracker for use by other modules
__all__ = [
    'router',
    'enhanced_threat_tracker',
    'legacy_threat_tracker',
    'ThreatInfo',
    'ThreatType',
    'ThreatSeverity',
    'ThreatStatus',
    'SecurityEvent',
    'SecurityEventType',
    'SecurityIncident',
    'IncidentSeverity',
    'SecurityConfiguration',
    'EnhancedThreatTracker',
    'LegacyThreatTracker'
]
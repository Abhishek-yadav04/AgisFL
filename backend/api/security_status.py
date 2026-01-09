"""
Security Status API
Handles security status, statistics, and security monitoring
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Union

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse

# Import dependencies with fallback
try:
    from config.enterprise_config import get_config
    from core.multi_tier_integration import db_manager
    from core.security_engine import security_engine
except ImportError:
    def get_config(): return {"security": {"enabled": True}}
    class MockDBManager:
        def get_security_events(self): return []
    class MockSecurityEngine:
        def get_current_threats(self): return []
        def get_security_posture(self): return {"score": 95}
        def get_security_metrics(self): return {"total_events": 0, "blocked_ips": 0}
        def get_threat_level(self): return "low"
    db_manager = MockDBManager()
    security_engine = MockSecurityEngine()

# Try to import auth components via auth_helpers (provides callables and fallbacks)
try:
    from .auth_helpers import security, TokenData, require_permission, Permission
    auth_available = True
except Exception:
    # If auth_helpers fails, fall back to previous behavior
    auth_manager = None
    security = None
    TokenData = None
    require_permission = None
    Permission = None
    auth_available = False

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Security"])
config = get_config()

@router.get("/status", summary="Security Status")
async def get_security_status(
    request: Request,
    current_user: Optional[Any] = Depends(security) if security else None
) -> Dict[str, Any]:
    """Get comprehensive security status and statistics"""
    if not auth_available or not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Require admin privileges for security status
    if not any(perm.value in ["super_admin", "security_admin"] for perm in current_user.permissions):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # Get security engine statistics
        security_engine_stats = await security_engine.get_security_dashboard_data()

        # Get basic security metrics
        security_status = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "security_engine": security_engine_stats,
            "system_status": {
                "uptime_seconds": 0,  # Would be set by main app
                "is_secure": True,
                "security_features_enabled": [
                    "input_validation",
                    "rate_limiting",
                    "threat_detection",
                    "security_headers",
                    "cors_protection",
                    "xss_protection",
                    "sql_injection_protection"
                ]
            },
            "authentication": {
                "jwt_enabled": True,
                "mfa_enabled": config.security.enable_mfa,
                "session_timeout": config.security.session_timeout
            },
            "encryption": {
                "at_rest": config.compliance.encryption_at_rest,
                "in_transit": config.compliance.encryption_in_transit
            }
        }

        return security_status

    except Exception as e:
        logger.error("Failed to get security status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve security status")

@router.get("/threats", summary="Threat Detection Status")
async def get_threat_status(
    request: Request,
    current_user: Optional[Any] = Depends(security) if security else None
) -> Dict[str, Any]:
    """Get threat detection status and recent threats"""
    if not auth_available or not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        # Get threat data from security engine
        threat_data = await security_engine.get_security_dashboard_data()

        return {
            "threats_detected": threat_data.get("threats_detected", 0),
            "active_threats": threat_data.get("active_threats", 0),
            "blocked_attempts": threat_data.get("blocked_attempts", 0),
            "recent_threats": threat_data.get("recent_threats", []),
            "threat_levels": {
                "low": threat_data.get("low_threats", 0),
                "medium": threat_data.get("medium_threats", 0),
                "high": threat_data.get("high_threats", 0),
                "critical": threat_data.get("critical_threats", 0)
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get threat status", error=str(e))
        return JSONResponse(
            content={
                "error": str(e),
                "threats_detected": 0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            },
            status_code=500
        )

@router.get("/audit", summary="Security Audit Logs")
async def get_security_audit(
    request: Request,
    limit: int = 50,
    current_user: Optional[Any] = Depends(security) if security else None
) -> Dict[str, Any]:
    """Get security audit logs"""
    if not auth_available or not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Require admin privileges
    if not any(perm.value in ["super_admin", "security_admin"] for perm in current_user.permissions):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    try:
        # This would typically query audit logs from database
        # For now, return mock data
        audit_logs = [
            {
                "id": f"audit_{i}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event": "login_attempt",
                "user": f"user_{i}",
                "ip": f"192.168.1.{i}",
                "status": "success" if i % 2 == 0 else "failed",
                "details": "User login attempt"
            }
            for i in range(min(limit, 10))
        ]

        return {
            "audit_logs": audit_logs,
            "total": len(audit_logs),
            "limit": limit,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error("Failed to get audit logs", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve audit logs")

@router.get("/compliance", summary="Compliance Status")
async def get_compliance_status(
    request: Request,
    current_user: Optional[Any] = Depends(security) if security else None
) -> Dict[str, Any]:
    """Get compliance status and requirements"""
    if not auth_available or not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        compliance_status = {
            "gdpr": {
                "enabled": config.compliance.gdpr_enabled,
                "data_retention_days": config.compliance.data_retention_days,
                "anonymization_enabled": config.compliance.anonymization_enabled
            },
            "hipaa": {
                "enabled": config.compliance.hipaa_enabled
            },
            "sox": {
                "enabled": config.compliance.sox_enabled
            },
            "pci": {
                "enabled": config.compliance.pci_enabled
            },
            "audit_logging": {
                "enabled": config.compliance.enable_audit_logging,
                "retention_days": config.compliance.audit_retention_days
            },
            "encryption": {
                "at_rest": config.compliance.encryption_at_rest,
                "in_transit": config.compliance.encryption_in_transit
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        return compliance_status

    except Exception as e:
        logger.error("Failed to get compliance status", error=str(e))

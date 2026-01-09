"""
Security Data Provider
Provides mock security data for frontend
"""

from datetime import datetime, timezone, timedelta
import random

def get_security_threats():
    """Get mock security threats data"""
    threats = [
        {
            "id": "threat_001",
            "type": "brute_force",
            "severity": "high",
            "source_ip": "192.168.1.100",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "blocked",
            "description": "Multiple failed login attempts detected",
            "attempts": 15,
            "blocked_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "threat_002", 
            "type": "suspicious_activity",
            "severity": "medium",
            "source_ip": "10.0.0.50",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat(),
            "status": "monitoring",
            "description": "Unusual API access pattern detected",
            "requests_per_minute": 150,
            "normal_baseline": 20
        },
        {
            "id": "threat_003",
            "type": "malware_detection", 
            "severity": "critical",
            "source_ip": "203.0.113.45",
            "timestamp": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "status": "quarantined",
            "description": "Malicious payload detected in upload",
            "file_hash": "a1b2c3d4e5f6",
            "quarantine_location": "/security/quarantine/"
        }
    ]
    return threats

def get_security_metrics():
    """Get security metrics"""
    return {
        "security_score": 95,
        "threats_detected_24h": 12,
        "threats_blocked_24h": 11,
        "active_threats": 1,
        "blocked_ips": 8,
        "failed_logins_24h": 45,
        "successful_logins_24h": 234,
        "last_scan": datetime.now(timezone.utc).isoformat(),
        "vulnerability_score": 2,
        "compliance_score": 98
    }

def get_security_events():
    """Get recent security events"""
    events = []
    for i in range(10):
        events.append({
            "id": f"event_{i+1:03d}",
            "type": random.choice(["login_success", "login_failed", "api_access", "file_upload", "admin_action"]),
            "severity": random.choice(["low", "medium", "high"]),
            "timestamp": (datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 1440))).isoformat(),
            "user": f"user_{random.randint(1, 50)}",
            "ip_address": f"192.168.1.{random.randint(1, 254)}",
            "description": f"Security event {i+1} description"
        })
    return events
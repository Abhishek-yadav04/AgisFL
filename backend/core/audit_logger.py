"""
Comprehensive Audit Logger for Security Events
"""
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pathlib import Path

class AuditLogger:
    def __init__(self, log_file: str = "audit.log"):
        self.log_file = Path(log_file)
        self.log_file.parent.mkdir(exist_ok=True)
        
        # Configure audit logger
        self.logger = logging.getLogger("audit")
        self.logger.setLevel(logging.INFO)
        
        # File handler for audit logs
        handler = logging.FileHandler(self.log_file)
        formatter = logging.Formatter(
            '%(asctime)s - AUDIT - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
    
    def log_security_event(self, event_type: str, user_id: str, 
                          details: Dict[str, Any], severity: str = "INFO"):
        """Log security-related events"""
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "severity": severity,
            "details": details
        }
        
        self.logger.info(json.dumps(audit_entry))
    
    def log_access_attempt(self, user_id: str, resource: str, 
                          success: bool, ip_address: str):
        """Log access attempts"""
        self.log_security_event(
            "ACCESS_ATTEMPT",
            user_id,
            {
                "resource": resource,
                "success": success,
                "ip_address": ip_address
            },
            "WARNING" if not success else "INFO"
        )
    
    def log_data_access(self, user_id: str, data_type: str, action: str):
        """Log data access events"""
        self.log_security_event(
            "DATA_ACCESS",
            user_id,
            {
                "data_type": data_type,
                "action": action
            }
        )
    
    def log_configuration_change(self, user_id: str, component: str, 
                                old_value: Any, new_value: Any):
        """Log configuration changes"""
        self.log_security_event(
            "CONFIG_CHANGE",
            user_id,
            {
                "component": component,
                "old_value": str(old_value)[:100],  # Truncate for security
                "new_value": str(new_value)[:100]
            },
            "WARNING"
        )

# Global audit logger instance
audit_logger = AuditLogger()
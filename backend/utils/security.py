"""
Security utilities for input validation and sanitization
"""

import re
import html
import json
import hashlib
from pathlib import Path
from typing import Any, Dict, Optional, Union
import structlog

logger = structlog.get_logger(__name__)

from utils.error_handling_secure import sanitize_log_input

def sanitize_html_input(input_str: str) -> str:
    """Sanitize HTML input to prevent XSS"""
    if not isinstance(input_str, str):
        input_str = str(input_str)
    
    return html.escape(input_str)

def validate_path_traversal(file_path: str, base_dir: str) -> str:
    """Validate and sanitize file path to prevent path traversal"""
    if not isinstance(file_path, str):
        raise ValueError("File path must be a string")
    
    # Remove path traversal sequences
    clean_path = file_path.replace('..', '').replace('//', '/').replace('\\\\', '\\')
    
    # Resolve absolute paths
    base_path = Path(base_dir).resolve()
    target_path = (base_path / clean_path).resolve()
    
    # Ensure target is within base directory
    if not str(target_path).startswith(str(base_path)):
        raise ValueError("Path traversal attempt detected")
    
    return str(target_path)

def sanitize_json_input(json_str: str) -> Optional[Dict[str, Any]]:
    """Safely parse JSON input"""
    try:
        if not isinstance(json_str, str):
            return None
        
        # Parse and re-stringify to remove potential malicious content
        parsed = json.loads(json_str)
        return json.loads(json.dumps(parsed))
    except (json.JSONDecodeError, TypeError):
        return None

def validate_ip_address(ip: str) -> bool:
    """Validate IP address format"""
    if not isinstance(ip, str):
        return False
    
    # IPv4 validation
    ipv4_pattern = r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'
    if re.match(ipv4_pattern, ip):
        return True
    
    # IPv6 validation (basic)
    ipv6_pattern = r'^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$'
    if re.match(ipv6_pattern, ip):
        return True
    
    return False

def validate_username(username: str) -> bool:
    """Validate username format"""
    if not isinstance(username, str):
        return False
    
    # Allow alphanumeric, underscore, hyphen, 3-30 characters
    pattern = r'^[a-zA-Z0-9_-]{3,30}$'
    return bool(re.match(pattern, username))

def validate_email(email: str) -> bool:
    """Validate email format"""
    if not isinstance(email, str):
        return False
    
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return bool(re.match(pattern, email))

from utils.security_utils import hash_sensitive_data

def validate_jwt_secret(secret: str) -> bool:
    """Validate JWT secret strength"""
    if not isinstance(secret, str):
        return False
    
    # Minimum 32 characters, contains letters and numbers
    if len(secret) < 32:
        return False
    
    has_letter = any(c.isalpha() for c in secret)
    has_digit = any(c.isdigit() for c in secret)
    
    return has_letter and has_digit

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal"""
    if not isinstance(filename, str):
        filename = str(filename)
    
    # Remove path separators and dangerous characters
    sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', filename)
    sanitized = sanitized.replace('..', '')
    
    return sanitized.strip()[:255]  # Limit length
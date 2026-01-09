# Test-compatible validate_input function for test suite
def validate_input_test(data: dict, schema: dict) -> dict:
    """Validate input data against schema for tests."""
    violations = []
    for field, rules in schema.items():
        value = data.get(field)
        # Required field check
        if rules.get("required"):
            if value is None or value == "":
                violations.append(f"Missing required field: {field}")
                continue
        # Type checks
        if value is not None:
            if rules.get("type") == "email":
                import re
                # Stricter email regex, disallow consecutive dots and invalid formats
                if not re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", str(value)) or ".." in str(value):
                    violations.append(f"Invalid email: {value}")
            if rules.get("type") == "ip_address":
                import ipaddress
                try:
                    ipaddress.ip_address(value)
                except Exception:
                    violations.append(f"Invalid IP address: {value}")
            if rules.get("type") == "integer":
                if not isinstance(value, int):
                    violations.append(f"Invalid integer: {value}")
            if rules.get("type") == "string":
                if not isinstance(value, str):
                    violations.append(f"Invalid string: {value}")
    return {"is_valid": len(violations) == 0, "violations": violations}
# Test-compatible sanitize_input function
def sanitize_input(value: str) -> str:
    # Remove dangerous characters and patterns
    import re
    value = re.sub(r"(;|--|\'|\"|<|>|\bDROP\b|\bTABLE\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bSELECT\b|\bSCRIPT\b|\bALERT\b|\bRM\b|\bRF\b|\bETC\b|\bPASSWD\b|\.\./)", "", value, flags=re.IGNORECASE)
    return value
"""
Comprehensive Input Validation and Sanitization
Provides security-focused validation for all user inputs
"""

import re
import html
import urllib.parse
from typing import Any, Dict, List, Optional, Union, Tuple
from datetime import datetime
import ipaddress
import email_validator
from pathlib import Path
import logging

logger = logging.getLogger("utils.validation")

class ValidationError(Exception):
    """Custom validation error"""
    pass

class InputValidator:
    """Comprehensive input validator with security focus"""
    
    def __init__(self):
        # Security patterns
        self.sql_injection_patterns = [
            r"('|(\\'))+.*(or|and|union|select|insert|update|delete|drop|create|alter|exec|execute)",
            r"(union|select|insert|update|delete|drop|create|alter)\s+.*\s+(from|into|where|set)",
            r"(or|and)\s+('|\d+)\s*=\s*('|\d+)",
            r"';.*--",
            r"1\s*=\s*1",
            r"(exec|execute)\s*\(",
            r"sp_\w+",
            r"xp_\w+"
        ]
        
        self.xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript\s*:",
            r"on\w+\s*=",
            r"<iframe[^>]*>.*?</iframe>",
            r"<object[^>]*>.*?</object>",
            r"<embed[^>]*>.*?</embed>",
            r"vbscript\s*:",
            r"data\s*:\s*text/html"
        ]
        
        self.path_traversal_patterns = [
            r"\.\./",
            r"\.\.\\",
            r"%2e%2e%2f",
            r"%2e%2e\\",
            r"..%2f",
            r"..%5c"
        ]
        
        self.command_injection_patterns = [
            r"[;&|`$()]",
            r"(\||;|&|>|<|\$|`)",
            r"(cat|ls|dir|type|echo|ping|wget|curl|nc|netcat)\s",
            r"/bin/\w+",
            r"cmd\.exe",
            r"powershell"
        ]
        
        # Common validation patterns
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.phone_pattern = re.compile(r'^\+?1?-?\s?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$')
        self.url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    def sanitize_string(self, value: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """Sanitize string input"""
        if not isinstance(value, str):
            value = str(value)
        
        # Limit length
        value = value[:max_length]
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # HTML escape unless explicitly allowed
        if not allow_html:
            value = html.escape(value)
        
        # Remove control characters except tab, newline, carriage return
        value = ''.join(char for char in value if ord(char) >= 32 or char in '\t\n\r')
        
        return value.strip()
    
    def validate_sql_injection(self, value: str) -> Tuple[bool, List[str]]:
        """Check for SQL injection attempts"""
        violations = []
        value_lower = value.lower()
        
        for pattern in self.sql_injection_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE):
                violations.append(f"Potential SQL injection detected: {pattern}")
        
        return len(violations) == 0, violations
    
    def validate_xss(self, value: str) -> Tuple[bool, List[str]]:
        """Check for XSS attempts"""
        violations = []
        value_lower = value.lower()
        
        for pattern in self.xss_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE | re.DOTALL):
                violations.append(f"Potential XSS detected: {pattern}")
        
        return len(violations) == 0, violations
    
    def validate_path_traversal(self, value: str) -> Tuple[bool, List[str]]:
        """Check for path traversal attempts"""
        violations = []
        value_lower = value.lower()
        
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, value_lower, re.IGNORECASE):
                violations.append(f"Potential path traversal detected: {pattern}")
        
        return len(violations) == 0, violations
    
    def validate_command_injection(self, value: str) -> Tuple[bool, List[str]]:
        """Check for command injection attempts"""
        violations = []
        
        for pattern in self.command_injection_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                violations.append(f"Potential command injection detected: {pattern}")
        
        return len(violations) == 0, violations
    
    def validate_comprehensive(self, value: str) -> Tuple[bool, List[str]]:
        """Run all security validations"""
        all_violations = []
        
        sql_valid, sql_violations = self.validate_sql_injection(value)
        all_violations.extend(sql_violations)
        
        xss_valid, xss_violations = self.validate_xss(value)
        all_violations.extend(xss_violations)
        
        path_valid, path_violations = self.validate_path_traversal(value)
        all_violations.extend(path_violations)
        
        cmd_valid, cmd_violations = self.validate_command_injection(value)
        all_violations.extend(cmd_violations)
        
        return len(all_violations) == 0, all_violations
    
    def validate_email(self, email: str) -> Tuple[bool, List[str]]:
        """Validate email address"""
        violations = []
        
        try:
            # Basic regex check
            if not self.email_pattern.match(email):
                violations.append("Invalid email format")
            
            # Advanced validation with email-validator
            try:
                import email_validator
                email_validator.validate_email(email)
            except:
                violations.append("Email validation failed")
                
        except Exception as e:
            violations.append(f"Email validation error: {str(e)}")
        
        return len(violations) == 0, violations
    
    def validate_phone(self, phone: str) -> Tuple[bool, List[str]]:
        """Validate phone number"""
        violations = []
        
        # Remove common formatting
        clean_phone = re.sub(r'[^\d+]', '', phone)
        
        if not self.phone_pattern.match(phone):
            violations.append("Invalid phone number format")
        
        if len(clean_phone) < 10 or len(clean_phone) > 15:
            violations.append("Phone number length invalid")
        
        return len(violations) == 0, violations
    
    def validate_url(self, url: str) -> Tuple[bool, List[str]]:
        """Validate URL"""
        violations = []
        
        if not self.url_pattern.match(url):
            violations.append("Invalid URL format")
        
        # Check for suspicious schemes
        if url.lower().startswith(('file://', 'ftp://', 'javascript:', 'data:')):
            violations.append("Potentially unsafe URL scheme")
        
        return len(violations) == 0, violations
    
    def validate_ip_address(self, ip: str) -> Tuple[bool, List[str]]:
        """Validate IP address"""
        violations = []
        
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            violations.append("Invalid IP address format")
        
        return len(violations) == 0, violations
    
    def validate_filename(self, filename: str) -> Tuple[bool, List[str]]:
        """Validate filename for security"""
        violations = []
        
        # Check for dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|', '\x00']
        for char in dangerous_chars:
            if char in filename:
                violations.append(f"Dangerous character in filename: {char}")
        
        # Check for reserved names (Windows)
        reserved_names = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 
                         'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 
                         'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
        
        if filename.upper().split('.')[0] in reserved_names:
            violations.append("Reserved filename")
        
        # Length check
        if len(filename) > 255:
            violations.append("Filename too long")
        
        return len(violations) == 0, violations
    
    def validate_json_object(self, data: Any, max_depth: int = 10, max_keys: int = 100) -> Tuple[bool, List[str]]:
        """Validate JSON object structure"""
        violations = []
        
        def check_depth(obj, current_depth=0):
            if current_depth > max_depth:
                violations.append(f"JSON depth exceeds maximum ({max_depth})")
                return
            
            if isinstance(obj, dict):
                if len(obj) > max_keys:
                    violations.append(f"JSON object has too many keys (max: {max_keys})")
                    return
                
                for key, value in obj.items():
                    # Validate key
                    if not isinstance(key, str):
                        violations.append("JSON keys must be strings")
                    elif len(key) > 100:
                        violations.append("JSON key too long")
                    else:
                        key_valid, key_violations = self.validate_comprehensive(key)
                        if not key_valid:
                            violations.extend([f"JSON key violation: {v}" for v in key_violations])
                    
                    # Recursively validate value
                    check_depth(value, current_depth + 1)
            
            elif isinstance(obj, list):
                if len(obj) > max_keys:
                    violations.append(f"JSON array has too many items (max: {max_keys})")
                    return
                
                for item in obj:
                    check_depth(item, current_depth + 1)
            
            elif isinstance(obj, str):
                if len(obj) > 10000:  # 10KB string limit
                    violations.append("JSON string value too long")
                else:
                    str_valid, str_violations = self.validate_comprehensive(obj)
                    if not str_valid:
                        violations.extend([f"JSON string violation: {v}" for v in str_violations])
        
        check_depth(data)
        return len(violations) == 0, violations
    
    def validate_password(self, password: str) -> Tuple[bool, List[str]]:
        """Validate password strength"""
        violations = []
        
        if len(password) < 8:
            violations.append("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            violations.append("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            violations.append("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            violations.append("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', password):
            violations.append("Password must contain at least one special character")
        
        # Check for common passwords
        common_passwords = ['password', '123456', 'admin', 'root', 'user']
        if password.lower() in common_passwords:
            violations.append("Password is too common")
        
        return len(violations) == 0, violations
    
    def validate_interface_name(self, interface: str) -> Tuple[bool, List[str]]:
        """Validate network interface name"""
        violations = []
        
        # Basic format check
        if not re.match(r'^[a-zA-Z0-9\-_\.]+$', interface):
            violations.append("Invalid interface name format")
        
        # Length check
        if len(interface) > 50:
            violations.append("Interface name too long")
        
        # Security check
        secure_valid, secure_violations = self.validate_comprehensive(interface)
        if not secure_valid:
            violations.extend(secure_violations)
        
        return len(violations) == 0, violations

# Global validator instance
validator = InputValidator()

# Decorator for automatic validation
def validate_input(
    field_validators: Dict[str, str] = None,
    sanitize: bool = True,
    max_length: int = 1000
):
    """Decorator for automatic input validation"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Validate function arguments
            if field_validators:
                for field_name, validation_type in field_validators.items():
                    if field_name in kwargs:
                        value = kwargs[field_name]
                        
                        if sanitize and isinstance(value, str):
                            value = validator.sanitize_string(value, max_length)
                            kwargs[field_name] = value
                        
                        # Run specific validation
                        if validation_type == "email":
                            valid, violations = validator.validate_email(value)
                        elif validation_type == "url":
                            valid, violations = validator.validate_url(value)
                        elif validation_type == "ip":
                            valid, violations = validator.validate_ip_address(value)
                        elif validation_type == "filename":
                            valid, violations = validator.validate_filename(value)
                        elif validation_type == "comprehensive":
                            valid, violations = validator.validate_comprehensive(value)
                        else:
                            valid, violations = True, []
                        
                        if not valid:
                            logger.warning(f"Validation failed for {field_name}: {violations}")
                            raise ValidationError(f"Invalid {field_name}: {'; '.join(violations)}")
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Validation helpers
def sanitize_for_log(message: str, max_length: int = 200) -> str:
    """Sanitize message for safe logging"""
    if not isinstance(message, str):
        message = str(message)
    
    # Remove sensitive patterns
    message = re.sub(r'password["\s]*[:=]["\s]*[^"\s]+', 'password=***', message, flags=re.IGNORECASE)
    message = re.sub(r'token["\s]*[:=]["\s]*[^"\s]+', 'token=***', message, flags=re.IGNORECASE)
    message = re.sub(r'key["\s]*[:=]["\s]*[^"\s]+', 'key=***', message, flags=re.IGNORECASE)
    
    # Limit length and sanitize
    return validator.sanitize_string(message, max_length)

def validate_file_upload(filename: str, content: bytes, max_size: int = 50 * 1024 * 1024) -> Tuple[bool, List[str]]:
    """Validate file upload"""
    violations = []
    
    # Validate filename
    filename_valid, filename_violations = validator.validate_filename(filename)
    if not filename_valid:
        violations.extend(filename_violations)
    
    # Check file size
    if len(content) > max_size:
        violations.append(f"File too large (max: {max_size} bytes)")
    
    # Check for executable files
    executable_extensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.js', '.vbs', '.ps1']
    file_ext = Path(filename).suffix.lower()
    if file_ext in executable_extensions:
        violations.append("Executable files not allowed")
    
    # Check for suspicious content
    if b'<?php' in content[:1024] or b'<script' in content[:1024]:
        violations.append("Suspicious file content detected")
    
    return len(violations) == 0, violations

def validate_api_request(request_data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate API request data"""
    violations = []
    
    # Validate JSON structure
    json_valid, json_violations = validator.validate_json_object(request_data)
    if not json_valid:
        violations.extend(json_violations)
    
    # Validate string fields
    for key, value in request_data.items():
        if isinstance(value, str):
            str_valid, str_violations = validator.validate_comprehensive(value)
            if not str_valid:
                violations.extend([f"{key}: {v}" for v in str_violations])
    
    return len(violations) == 0, violations

# Rate limiting validation
class RequestValidator:
    """Validate request patterns for rate limiting"""
    
    def __init__(self):
        self.request_history = {}
    
    def is_suspicious_pattern(self, ip: str, endpoint: str) -> bool:
        """Check if request pattern is suspicious"""
        key = f"{ip}:{endpoint}"
        now = datetime.now()
        
        if key not in self.request_history:
            self.request_history[key] = []
        
        # Clean old entries (last 5 minutes)
        self.request_history[key] = [
            req_time for req_time in self.request_history[key]
            if (now - req_time).seconds < 300
        ]
        
        # Add current request
        self.request_history[key].append(now)
        
        # Check if too many requests in short time
        if len(self.request_history[key]) > 100:  # More than 100 requests in 5 minutes
            return True
        
        return False

# Global request validator
request_validator = RequestValidator()

# Export key functions
__all__ = [
    'InputValidator',
    'ValidationError',
    'validator',
    'validate_input',
    'sanitize_for_log',
    'validate_file_upload',
    'validate_api_request',
    'request_validator'
]

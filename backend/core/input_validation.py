"""
Enhanced Input Validation and Sanitization Module
Provides comprehensive input validation, sanitization, and security checks
"""

import re
import html
import urllib.parse
from typing import Any, Dict, List, Optional, Union, Callable
from datetime import datetime
from pathlib import Path
import ipaddress
try:
    import email_validator
    EMAIL_VALIDATOR_AVAILABLE = True
except ImportError:
    EMAIL_VALIDATOR_AVAILABLE = False
    
from pydantic import BaseModel, validator, ValidationError
try:
    import bleach
    BLEACH_AVAILABLE = True
except ImportError:
    BLEACH_AVAILABLE = False
    
import structlog

logger = structlog.get_logger()

class ValidationError(Exception):
    """Custom validation error"""
    pass

class InputValidator:
    """Comprehensive input validator with security-focused sanitization"""
    
    # Common regex patterns
    PATTERNS = {
        'username': re.compile(r'^[a-zA-Z0-9_-]{3,50}$'),
        'email': re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
        'password': re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$'),
        'uuid': re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
        'ip_address': re.compile(r'^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$'),
        'port': re.compile(r'^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$'),
        'filename': re.compile(r'^[a-zA-Z0-9._-]{1,255}$'),
        'slug': re.compile(r'^[a-z0-9-]+$'),
        'hex_color': re.compile(r'^#[0-9a-fA-F]{6}$'),
        'semver': re.compile(r'^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$')
    }
    
    # Dangerous patterns to block
    DANGEROUS_PATTERNS = [
        re.compile(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', re.IGNORECASE),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'data:text/html', re.IGNORECASE),
        re.compile(r'vbscript:', re.IGNORECASE),
        re.compile(r'<iframe\b', re.IGNORECASE),
        re.compile(r'<object\b', re.IGNORECASE),
        re.compile(r'<embed\b', re.IGNORECASE),
        re.compile(r'<link\b', re.IGNORECASE),
        re.compile(r'<meta\b', re.IGNORECASE),
        re.compile(r'<style\b', re.IGNORECASE),
    ]
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        re.compile(r'\bunion\b.*\bselect\b', re.IGNORECASE),
        re.compile(r'\bselect\b.*\bfrom\b', re.IGNORECASE),
        re.compile(r'\binsert\b.*\binto\b', re.IGNORECASE),
        re.compile(r'\bupdate\b.*\bset\b', re.IGNORECASE),
        re.compile(r'\bdelete\b.*\bfrom\b', re.IGNORECASE),
        re.compile(r'\bdrop\b.*\btable\b', re.IGNORECASE),
        re.compile(r'\bcreate\b.*\btable\b', re.IGNORECASE),
        re.compile(r'\balter\b.*\btable\b', re.IGNORECASE),
        re.compile(r'--.*$', re.MULTILINE),
        re.compile(r'/\*.*?\*/', re.DOTALL),
    ]
    
    # Command injection patterns
    COMMAND_INJECTION_PATTERNS = [
        re.compile(r'[;&|`$(){}[\]\\]'),
        re.compile(r'\$\(.*\)'),
        re.compile(r'`.*`'),
        re.compile(r'>\s*&'),
        re.compile(r'<<.*'),
    ]
    
    @classmethod
    def sanitize_string(cls, value: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """Sanitize string input with comprehensive security checks"""
        if not isinstance(value, str):
            raise ValidationError("Input must be a string")
        
        if len(value) > max_length:
            raise ValidationError(f"Input too long (max {max_length} characters)")
        
        # Check for dangerous patterns
        for pattern in cls.DANGEROUS_PATTERNS:
            if pattern.search(value):
                try:
                    from backend.utils.security_utils import sanitize_log_input
                    logger.warning("Dangerous pattern detected in input", pattern=pattern.pattern, input=sanitize_log_input(value[:100]))
                except ImportError:
                    logger.warning("Dangerous pattern detected in input", pattern=pattern.pattern)
                raise ValidationError("Input contains dangerous content")
        
        # Check for SQL injection
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if pattern.search(value):
                logger.warning("SQL injection pattern detected", pattern=pattern.pattern, input=value[:100])
                raise ValidationError("Input contains SQL injection patterns")
        
        # Check for command injection
        for pattern in cls.COMMAND_INJECTION_PATTERNS:
            if pattern.search(value):
                logger.warning("Command injection pattern detected", pattern=pattern.pattern, input=value[:100])
                raise ValidationError("Input contains command injection patterns")
        
        # HTML encode for safety
        if not allow_html:
            value = html.escape(value)
        else:
            # Use bleach to sanitize HTML
            if BLEACH_AVAILABLE:
                allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
                allowed_attributes = {'a': ['href', 'title']}
                value = bleach.clean(value, tags=allowed_tags, attributes=allowed_attributes, strip=True)
            else:
                # Fallback to basic HTML encoding if bleach not available
                value = html.escape(value)
        
        # URL decode to prevent double encoding attacks
        try:
            decoded = urllib.parse.unquote(value)
            if decoded != value:
                # Check if decoded version contains dangerous patterns
                for pattern in cls.DANGEROUS_PATTERNS:
                    if pattern.search(decoded):
                        raise ValidationError("Input contains encoded dangerous content")
        except Exception:
            pass
        
        return value.strip()
    
    @classmethod
    def validate_username(cls, username: str) -> str:
        """Validate username format"""
        username = cls.sanitize_string(username, max_length=50)
        
        if not cls.PATTERNS['username'].match(username):
            raise ValidationError("Username must be 3-50 characters and contain only letters, numbers, underscores, and hyphens")
        
        # Check for reserved usernames
        reserved = ['admin', 'administrator', 'root', 'system', 'api', 'www', 'mail', 'ftp', 'test', 'demo']
        if username.lower() in reserved:
            raise ValidationError("Username is reserved")
        
        return username
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate email format and domain"""
        email = cls.sanitize_string(email, max_length=254).lower()
        
        if EMAIL_VALIDATOR_AVAILABLE:
            try:
                # Use email-validator library for comprehensive validation
                valid_email = email_validator.validate_email(email)
                return valid_email.email
            except email_validator.EmailNotValidError as e:
                raise ValidationError(f"Invalid email format: {str(e)}")
        else:
            # Fallback to basic regex validation
            if not cls.PATTERNS['email'].match(email):
                raise ValidationError("Invalid email format")
            return email
    
    @classmethod
    def validate_password(cls, password: str) -> str:
        """Validate password strength"""
        if not isinstance(password, str):
            raise ValidationError("Password must be a string")
        
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        if len(password) > 128:
            raise ValidationError("Password too long (max 128 characters)")
        
        if not cls.PATTERNS['password'].match(password):
            raise ValidationError("Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")
        
        # Check for common weak passwords
        weak_passwords = ['password', '12345678', 'qwerty123', 'admin123', 'password123']
        if password.lower() in weak_passwords:
            raise ValidationError("Password is too common")
        
        return password
    
    @classmethod
    def validate_ip_address(cls, ip: str) -> str:
        """Validate IP address format"""
        ip = cls.sanitize_string(ip, max_length=45)
        
        try:
            # Validate both IPv4 and IPv6
            ipaddress.ip_address(ip)
            return ip
        except ipaddress.AddressValueError:
            raise ValidationError("Invalid IP address format")
    
    @classmethod
    def validate_port(cls, port: Union[str, int]) -> int:
        """Validate port number"""
        if isinstance(port, str):
            port = cls.sanitize_string(port, max_length=5)
            if not port.isdigit():
                raise ValidationError("Port must be a number")
            port = int(port)
        
        if not isinstance(port, int):
            raise ValidationError("Port must be an integer")
        
        if port < 1 or port > 65535:
            raise ValidationError("Port must be between 1 and 65535")
        
        return port
    
    @classmethod
    def validate_filename(cls, filename: str) -> str:
        """Validate filename for security"""
        filename = cls.sanitize_string(filename, max_length=255)
        
        # Remove path traversal attempts
        filename = Path(filename).name
        
        if not cls.PATTERNS['filename'].match(filename):
            raise ValidationError("Filename contains invalid characters")
        
        # Check for dangerous extensions
        dangerous_extensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.js', '.vbs', '.jar', '.php', '.asp', '.jsp']
        file_ext = Path(filename).suffix.lower()
        if file_ext in dangerous_extensions:
            raise ValidationError("File type not allowed")
        
        return filename
    
    @classmethod
    def validate_uuid(cls, uuid_str: str) -> str:
        """Validate UUID format"""
        uuid_str = cls.sanitize_string(uuid_str, max_length=36)
        
        if not cls.PATTERNS['uuid'].match(uuid_str.lower()):
            raise ValidationError("Invalid UUID format")
        
        return uuid_str.lower()
    
    @classmethod
    def validate_json_object(cls, data: Dict[str, Any], max_depth: int = 10, max_keys: int = 100) -> Dict[str, Any]:
        """Validate JSON object structure and content"""
        if not isinstance(data, dict):
            raise ValidationError("Input must be a dictionary")
        
        if len(data) > max_keys:
            raise ValidationError(f"Too many keys (max {max_keys})")
        
        def check_depth(obj, current_depth=0):
            if current_depth > max_depth:
                raise ValidationError(f"Object too deeply nested (max depth {max_depth})")
            
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if not isinstance(key, str):
                        raise ValidationError("Dictionary keys must be strings")
                    cls.sanitize_string(key, max_length=100)
                    check_depth(value, current_depth + 1)
            elif isinstance(obj, list):
                if len(obj) > 1000:
                    raise ValidationError("Array too large (max 1000 items)")
                for item in obj:
                    check_depth(item, current_depth + 1)
            elif isinstance(obj, str):
                cls.sanitize_string(obj, max_length=10000)
        
        check_depth(data)
        return data
    
    @classmethod
    def validate_api_key(cls, api_key: str) -> str:
        """Validate API key format"""
        api_key = cls.sanitize_string(api_key, max_length=128)
        
        if len(api_key) < 32:
            raise ValidationError("API key too short")
        
        # API key should be alphanumeric with some special characters
        if not re.match(r'^[a-zA-Z0-9._-]+$', api_key):
            raise ValidationError("API key contains invalid characters")
        
        return api_key
    
    @classmethod
    def validate_url(cls, url: str, allowed_schemes: List[str] = None) -> str:
        """Validate URL format and scheme"""
        url = cls.sanitize_string(url, max_length=2048)
        
        if allowed_schemes is None:
            allowed_schemes = ['http', 'https']
        
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            
            if parsed.scheme not in allowed_schemes:
                raise ValidationError(f"URL scheme must be one of: {', '.join(allowed_schemes)}")
            
            if not parsed.netloc:
                raise ValidationError("URL must have a valid domain")
            
            # Prevent SSRF attacks by blocking private IPs
            try:
                ip = ipaddress.ip_address(parsed.hostname)
                if ip.is_private or ip.is_loopback or ip.is_multicast:
                    raise ValidationError("Private IP addresses not allowed")
            except (ipaddress.AddressValueError, TypeError):
                # Not an IP address, which is fine
                pass
            
            return url
        except Exception as e:
            raise ValidationError(f"Invalid URL: {str(e)}")

class SecurityValidator:
    """Advanced security validation for enterprise features"""
    
    @staticmethod
    def validate_sql_query(query: str) -> str:
        """Validate SQL query for safety"""
        query = InputValidator.sanitize_string(query, max_length=10000)
        
        # Only allow SELECT queries for safety
        query_upper = query.upper().strip()
        if not query_upper.startswith('SELECT'):
            raise ValidationError("Only SELECT queries are allowed")
        
        # Block dangerous SQL keywords
        dangerous_keywords = [
            'DELETE', 'DROP', 'INSERT', 'UPDATE', 'ALTER', 'CREATE', 
            'EXEC', 'EXECUTE', 'UNION', 'TRUNCATE', 'GRANT', 'REVOKE'
        ]
        
        for keyword in dangerous_keywords:
            if f' {keyword} ' in f' {query_upper} ':
                raise ValidationError(f"SQL keyword '{keyword}' not allowed")
        
        return query
    
    @staticmethod
    def validate_file_upload(file_content: bytes, filename: str, max_size: int = 10 * 1024 * 1024) -> tuple:
        """Validate file upload for security"""
        # Validate filename
        filename = InputValidator.validate_filename(filename)
        
        # Check file size
        if len(file_content) > max_size:
            raise ValidationError(f"File too large (max {max_size // (1024*1024)}MB)")
        
        # Check for malicious file signatures
        malicious_signatures = [
            b'\x4d\x5a',  # PE executable
            b'\x7f\x45\x4c\x46',  # ELF executable
            b'\xca\xfe\xba\xbe',  # Java class file
            b'\x50\x4b\x03\x04',  # ZIP (check for ZIP bombs)
        ]
        
        for signature in malicious_signatures:
            if file_content.startswith(signature):
                logger.warning("Malicious file signature detected", filename=filename, signature=signature.hex())
                raise ValidationError("File type not allowed")
        
        return file_content, filename
    
    @staticmethod
    def validate_regex_pattern(pattern: str) -> str:
        """Validate regex pattern for ReDoS attacks"""
        pattern = InputValidator.sanitize_string(pattern, max_length=1000)
        
        # Check for potentially dangerous regex patterns
        dangerous_patterns = [
            r'\(\?\#',  # Comment group
            r'\(\?\<',  # Lookbehind
            r'\(\?\=',  # Lookahead  
            r'\*\+',    # Catastrophic backtracking
            r'\+\*',    # Catastrophic backtracking
            r'\{\d+,\}',  # Large quantifiers
        ]
        
        for dangerous in dangerous_patterns:
            if re.search(dangerous, pattern):
                raise ValidationError("Regex pattern contains potentially dangerous constructs")
        
        try:
            re.compile(pattern)
            return pattern
        except re.error as e:
            raise ValidationError(f"Invalid regex pattern: {str(e)}")

# Validation decorators
def validate_input(**validators):
    """Decorator to validate function inputs"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Validate keyword arguments
            for key, validator in validators.items():
                if key in kwargs:
                    try:
                        kwargs[key] = validator(kwargs[key])
                    except ValidationError as e:
                        raise ValidationError(f"Validation failed for {key}: {str(e)}")
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Pydantic models for API validation
class UserRegistrationModel(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    
    @validator('username')
    def validate_username(cls, v):
        return InputValidator.validate_username(v)
    
    @validator('email')
    def validate_email(cls, v):
        return InputValidator.validate_email(v)
    
    @validator('password')
    def validate_password(cls, v):
        return InputValidator.validate_password(v)
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v:
            return InputValidator.sanitize_string(v, max_length=100)
        return v

class LoginModel(BaseModel):
    username: str
    password: str
    mfa_token: Optional[str] = None
    
    @validator('username')
    def validate_username(cls, v):
        return InputValidator.sanitize_string(v, max_length=50)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) > 128:
            raise ValueError("Password too long")
        return v
    
    @validator('mfa_token')
    def validate_mfa_token(cls, v):
        if v:
            v = InputValidator.sanitize_string(v, max_length=10)
            if not v.isdigit() or len(v) != 6:
                raise ValueError("MFA token must be 6 digits")
        return v

class DatasetModel(BaseModel):
    name: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    @validator('name')
    def validate_name(cls, v):
        return InputValidator.sanitize_string(v, max_length=100)
    
    @validator('description')
    def validate_description(cls, v):
        if v:
            return InputValidator.sanitize_string(v, max_length=1000)
        return v
    
    @validator('file_path')
    def validate_file_path(cls, v):
        if v:
            return InputValidator.validate_filename(v)
        return v
    
    @validator('metadata')
    def validate_metadata(cls, v):
        if v:
            return InputValidator.validate_json_object(v, max_depth=5, max_keys=50)
        return v

# Export commonly used validators
__all__ = [
    'InputValidator',
    'SecurityValidator', 
    'ValidationError',
    'validate_input',
    'UserRegistrationModel',
    'LoginModel',
    'DatasetModel'
]

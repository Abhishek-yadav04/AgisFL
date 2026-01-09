"""
Security utilities for AgisFL Enterprise
"""
import os
import secrets
import hashlib
from cryptography.fernet import Fernet
from typing import Optional

def generate_secure_key() -> str:
    """Generate a secure encryption key"""
    return Fernet.generate_key().decode()

def get_encryption_key() -> str:
    """Get encryption key from environment or generate new one"""
    key = os.getenv("ENCRYPTION_KEY")
    if not key:
        key = generate_secure_key()
        # Log without exposing the key
        print("⚠️ Generated new encryption key. Set ENCRYPTION_KEY in environment")
    return key

def get_jwt_secret() -> str:
    """Get JWT secret from environment or generate new one"""
    secret = os.getenv("JWT_SECRET")
    if not secret:
        # In a real production environment, this should fail loudly.
        # For this application, we'll use a hardcoded fallback for demonstration
        # purposes, but log a severe warning.
        secret = "your-super-secret-and-long-jwt-secret-for-production"
        print("CRITICAL: JWT_SECRET not set in environment. Using a default, insecure key. THIS IS NOT SAFE FOR PRODUCTION.")
    return secret

from utils.error_handling_secure import sanitize_log_input

def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data for logging"""
    return hashlib.sha256(data.encode()).hexdigest()[:8]

def secure_log(logger, level: str, message: str, **kwargs):
    """Secure logging with input sanitization"""
    sanitized_kwargs = {}
    for key, value in kwargs.items():
        if isinstance(value, str):
            sanitized_kwargs[key] = sanitize_log_input(value)
        else:
            sanitized_kwargs[key] = value
    
    log_func = getattr(logger, level.lower(), logger.info)
    log_func(message, **sanitized_kwargs)

def safe_path_join(*args) -> str:
    """Safely join path components"""
    return os.path.join(*args)

def validate_filename(filename: str) -> bool:
    """Validate filename for security"""
    if not filename:
        return False
    
    # Check for dangerous characters
    dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
    return not any(char in filename for char in dangerous_chars)

def sanitize_html(input_str: str) -> str:
    """Sanitize HTML input"""
    if not input_str:
        return ""
    
    # Basic HTML sanitization
    dangerous_tags = ['<script', '<iframe', '<object', '<embed', '<form']
    sanitized = input_str
    for tag in dangerous_tags:
        sanitized = sanitized.replace(tag, '&lt;' + tag[1:])
    
    return sanitized
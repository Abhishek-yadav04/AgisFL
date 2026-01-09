"""
Comprehensive Logging Configuration
Provides structured logging, security logging, and performance monitoring
"""

import logging
import logging.config
import os
import sys
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
import structlog
from functools import wraps

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Log levels mapping
LOG_LEVELS = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL
}

class SecurityLogFilter(logging.Filter):
    """Filter for security-related log messages"""
    
    def filter(self, record):
        # Mark security-related logs
        security_keywords = [
            "authentication", "authorization", "login", "logout",
            "permission", "access", "denied", "forbidden",
            "attack", "threat", "malicious", "suspicious",
            "injection", "xss", "csrf", "security"
        ]
        
        message = str(record.getMessage()).lower()
        record.is_security = any(keyword in message for keyword in security_keywords)
        return True

class PerformanceLogFilter(logging.Filter):
    """Filter for performance-related log messages"""
    
    def filter(self, record):
        # Mark performance-related logs
        performance_keywords = [
            "slow", "timeout", "performance", "latency",
            "memory", "cpu", "disk", "network",
            "cache", "database", "query"
        ]
        
        message = str(record.getMessage()).lower()
        record.is_performance = any(keyword in message for keyword in performance_keywords)
        return True

class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add custom fields
        if hasattr(record, "user_id"):
            log_entry["user_id"] = record.user_id
        
        if hasattr(record, "request_id"):
            log_entry["request_id"] = record.request_id
        
        if hasattr(record, "ip_address"):
            log_entry["ip_address"] = record.ip_address
        
        if hasattr(record, "endpoint"):
            log_entry["endpoint"] = record.endpoint
        
        if hasattr(record, "method"):
            log_entry["method"] = record.method
        
        if hasattr(record, "status_code"):
            log_entry["status_code"] = record.status_code
        
        if hasattr(record, "processing_time"):
            log_entry["processing_time"] = record.processing_time
        
        if hasattr(record, "is_security"):
            log_entry["security_event"] = record.is_security
        
        if hasattr(record, "is_performance"):
            log_entry["performance_event"] = record.is_performance
        
        return json.dumps(log_entry)

class DetailedFormatter(logging.Formatter):
    """Detailed formatter for human-readable logs"""
    
    def __init__(self):
        super().__init__(
            fmt="%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-15s:%(lineno)-3d | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

def setup_logging(
    log_level: str = "INFO",
    enable_file_logging: bool = True,
    enable_json_logging: bool = True,
    enable_security_logging: bool = True,
    enable_performance_logging: bool = True,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> None:
    """Setup comprehensive logging configuration"""
    
    # Clear any existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    
    # Set root log level
    root_logger.setLevel(LOG_LEVELS.get(log_level.upper(), logging.INFO))
    
    # Console handler with detailed formatting
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(DetailedFormatter())
    root_logger.addHandler(console_handler)
    
    if enable_file_logging:
        from logging.handlers import RotatingFileHandler
        
        # Main application log
        app_handler = RotatingFileHandler(
            LOGS_DIR / "agisfl.log",
            maxBytes=max_file_size,
            backupCount=backup_count
        )
        app_handler.setLevel(LOG_LEVELS.get(log_level.upper(), logging.INFO))
        app_handler.setFormatter(DetailedFormatter())
        root_logger.addHandler(app_handler)
        
        # JSON structured log
        if enable_json_logging:
            json_handler = RotatingFileHandler(
                LOGS_DIR / "agisfl.json.log",
                maxBytes=max_file_size,
                backupCount=backup_count
            )
            json_handler.setLevel(logging.DEBUG)
            json_handler.setFormatter(JsonFormatter())
            root_logger.addHandler(json_handler)
        
        # Security log
        if enable_security_logging:
            security_handler = RotatingFileHandler(
                LOGS_DIR / "security.log",
                maxBytes=max_file_size,
                backupCount=backup_count
            )
            security_handler.setLevel(logging.WARNING)
            security_handler.addFilter(SecurityLogFilter())
            security_handler.setFormatter(DetailedFormatter())
            root_logger.addHandler(security_handler)
        
        # Performance log
        if enable_performance_logging:
            performance_handler = RotatingFileHandler(
                LOGS_DIR / "performance.log",
                maxBytes=max_file_size,
                backupCount=backup_count
            )
            performance_handler.setLevel(logging.INFO)
            performance_handler.addFilter(PerformanceLogFilter())
            performance_handler.setFormatter(DetailedFormatter())
            root_logger.addHandler(performance_handler)
    
    # Error log (always enabled)
    from logging.handlers import RotatingFileHandler
    error_handler = RotatingFileHandler(
        LOGS_DIR / "errors.log",
        maxBytes=max_file_size,
        backupCount=backup_count
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(DetailedFormatter())
    root_logger.addHandler(error_handler)
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="ISO"),
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.ConsoleRenderer() if not enable_json_logging else structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

# Performance monitoring decorator
def log_performance(logger_name: str = None):
    """Decorator to log function performance"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger = logging.getLogger(logger_name or func.__module__)
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                logger.info(
                    f"Function {func.__name__} completed",
                    extra={
                        "function": func.__name__,
                        "processing_time": processing_time,
                        "success": True
                    }
                )
                
                if processing_time > 5.0:  # Log slow operations
                    logger.warning(
                        f"Slow operation detected: {func.__name__}",
                        extra={
                            "function": func.__name__,
                            "processing_time": processing_time,
                            "is_performance": True
                        }
                    )
                
                return result
                
            except Exception as e:
                processing_time = time.time() - start_time
                logger.error(
                    f"Function {func.__name__} failed",
                    extra={
                        "function": func.__name__,
                        "processing_time": processing_time,
                        "error": str(e),
                        "success": False
                    },
                    exc_info=True
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger = logging.getLogger(logger_name or func.__module__)
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                logger.info(
                    f"Function {func.__name__} completed",
                    extra={
                        "function": func.__name__,
                        "processing_time": processing_time,
                        "success": True
                    }
                )
                
                if processing_time > 5.0:  # Log slow operations
                    logger.warning(
                        f"Slow operation detected: {func.__name__}",
                        extra={
                            "function": func.__name__,
                            "processing_time": processing_time,
                            "is_performance": True
                        }
                    )
                
                return result
                
            except Exception as e:
                processing_time = time.time() - start_time
                logger.error(
                    f"Function {func.__name__} failed",
                    extra={
                        "function": func.__name__,
                        "processing_time": processing_time,
                        "error": str(e),
                        "success": False
                    },
                    exc_info=True
                )
                raise
        
        import asyncio
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator

# Security logging utilities
def log_security_event(
    event_type: str,
    message: str,
    user_id: str = None,
    ip_address: str = None,
    details: Dict[str, Any] = None
) -> None:
    """Log security events"""
    logger = logging.getLogger("security")
    
    extra = {
        "event_type": event_type,
        "is_security": True
    }
    
    if user_id:
        extra["user_id"] = user_id
    
    if ip_address:
        extra["ip_address"] = ip_address
    
    if details:
        extra.update(details)
    
    logger.warning(message, extra=extra)

def log_audit_event(
    action: str,
    resource: str,
    user_id: str,
    ip_address: str = None,
    success: bool = True,
    details: Dict[str, Any] = None
) -> None:
    """Log audit events"""
    logger = logging.getLogger("audit")
    
    message = f"Audit: {action} on {resource} by user {user_id}"
    
    extra = {
        "action": action,
        "resource": resource,
        "user_id": user_id,
        "success": success,
        "is_security": True
    }
    
    if ip_address:
        extra["ip_address"] = ip_address
    
    if details:
        extra.update(details)
    
    if success:
        logger.info(message, extra=extra)
    else:
        logger.warning(message, extra=extra)

# Request logging middleware
class RequestLoggingMiddleware:
    """Middleware to log HTTP requests"""
    
    def __init__(self, app):
        self.app = app
        self.logger = logging.getLogger("http")
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        start_time = time.time()
        request_id = f"req_{int(time.time() * 1000)}"
        
        # Extract request info
        method = scope["method"]
        path = scope["path"]
        client_ip = scope.get("client", ["unknown", 0])[0]
        
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                processing_time = time.time() - start_time
                status_code = message["status"]
                
                # Log request
                self.logger.info(
                    f"{method} {path} - {status_code}",
                    extra={
                        "request_id": request_id,
                        "method": method,
                        "endpoint": path,
                        "status_code": status_code,
                        "ip_address": client_ip,
                        "processing_time": processing_time
                    }
                )
                
                # Log slow requests
                if processing_time > 2.0:
                    self.logger.warning(
                        f"Slow request: {method} {path}",
                        extra={
                            "request_id": request_id,
                            "method": method,
                            "endpoint": path,
                            "processing_time": processing_time,
                            "is_performance": True
                        }
                    )
            
            await send(message)
        
        await self.app(scope, receive, send_wrapper)

# Log rotation and cleanup
def cleanup_old_logs(days_to_keep: int = 30) -> None:
    """Clean up old log files"""
    logger = logging.getLogger("maintenance")
    
    try:
        import glob
        from datetime import timedelta
        
        cutoff_time = time.time() - (days_to_keep * 24 * 60 * 60)
        
        for log_file in glob.glob(str(LOGS_DIR / "*.log*")):
            if os.path.getmtime(log_file) < cutoff_time:
                os.remove(log_file)
                logger.info(f"Removed old log file: {log_file}")
                
    except Exception as e:
        logger.error(f"Failed to cleanup old logs: {e}")

# Context managers for logging
class LogContext:
    """Context manager for adding context to logs"""
    
    def __init__(self, **context):
        self.context = context
        self.old_context = {}
    
    def __enter__(self):
        # Store old context and set new context
        for key, value in self.context.items():
            logger = logging.getLogger()
            if hasattr(logger, key):
                self.old_context[key] = getattr(logger, key)
            setattr(logger, key, value)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore old context
        logger = logging.getLogger()
        for key in self.context:
            if key in self.old_context:
                setattr(logger, key, self.old_context[key])
            else:
                delattr(logger, key)

# Application-specific loggers
def get_logger(name: str, level: str = None) -> logging.Logger:
    """Get a configured logger for a specific component"""
    logger = logging.getLogger(name)
    
    if level:
        logger.setLevel(LOG_LEVELS.get(level.upper(), logging.INFO))
    
    return logger

# Metrics collection for logs
class LogMetrics:
    """Collect metrics from logs"""
    
    def __init__(self):
        self.error_count = 0
        self.warning_count = 0
        self.security_events = 0
        self.performance_issues = 0
    
    def record_error(self):
        self.error_count += 1
    
    def record_warning(self):
        self.warning_count += 1
    
    def record_security_event(self):
        self.security_events += 1
    
    def record_performance_issue(self):
        self.performance_issues += 1
    
    def get_metrics(self) -> Dict[str, int]:
        return {
            "errors": self.error_count,
            "warnings": self.warning_count,
            "security_events": self.security_events,
            "performance_issues": self.performance_issues
        }
    
    def reset(self):
        self.error_count = 0
        self.warning_count = 0
        self.security_events = 0
        self.performance_issues = 0

# Global metrics instance
log_metrics = LogMetrics()

# Initialize logging on import
def initialize_logging():
    """Initialize logging with environment-based configuration"""
    log_level = os.getenv("LOG_LEVEL", "INFO")
    enable_json = os.getenv("LOG_JSON", "true").lower() == "true"
    enable_file = os.getenv("LOG_FILE", "true").lower() == "true"
    
    setup_logging(
        log_level=log_level,
        enable_file_logging=enable_file,
        enable_json_logging=enable_json
    )
    
    logger = logging.getLogger("core.logging")
    logger.info("Logging system initialized", extra={
        "log_level": log_level,
        "json_logging": enable_json,
        "file_logging": enable_file
    })

# Auto-initialize if not in test environment
if "pytest" not in sys.modules:
    initialize_logging()

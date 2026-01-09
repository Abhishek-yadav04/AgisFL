# Legacy APIError for test compatibility
class APIError(Exception):
    def __init__(self, message: str, error_code: str = None, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or "API_ERROR"
        self.status_code = status_code
        self.details = details or {}
"""
Comprehensive Error Handling and Exception Management
Provides standardized error handling across the application
"""

import traceback
import sys
import logging
from typing import Any, Dict, List, Optional, Type, Union, Callable
from datetime import datetime
from functools import wraps
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import asyncio

logger = logging.getLogger("utils.error_handling")

class AgisFlBaseException(Exception):
    """Base exception for AgisFL application"""
    
    def __init__(
        self,
        message: str,
        error_code: str = None,
        details: Dict[str, Any] = None,
        status_code: int = 500
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.status_code = status_code
        self.timestamp = datetime.utcnow()

class ValidationException(AgisFlBaseException):
    """Exception for validation errors"""
    
    def __init__(self, message: str, validation_errors: List[str] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details={"validation_errors": validation_errors or []},
            status_code=422
        )

class AuthenticationException(AgisFlBaseException):
    """Exception for authentication errors"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=401
        )

class AuthorizationException(AgisFlBaseException):
    """Exception for authorization errors"""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=403
        )

class ResourceNotFoundException(AgisFlBaseException):
    """Exception for resource not found errors"""
    
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            message=f"{resource} not found",
            error_code="RESOURCE_NOT_FOUND",
            status_code=404
        )

class BusinessLogicException(AgisFlBaseException):
    """Exception for business logic errors"""
    
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(
            message=message,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details,
            status_code=400
        )

class ExternalServiceException(AgisFlBaseException):
    """Exception for external service errors"""
    
    def __init__(self, service: str, message: str = None):
        super().__init__(
            message=message or f"External service {service} is unavailable",
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service},
            status_code=503
        )

class DatabaseException(AgisFlBaseException):
    """Exception for database errors"""
    
    def __init__(self, message: str = "Database operation failed", operation: str = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details={"operation": operation} if operation else {},
            status_code=500
        )

class NetworkException(AgisFlBaseException):
    """Exception for network-related errors"""
    
    def __init__(self, message: str = "Network operation failed", operation: str = None):
        super().__init__(
            message=message,
            error_code="NETWORK_ERROR",
            details={"operation": operation} if operation else {},
            status_code=500
        )

class PacketCaptureException(AgisFlBaseException):
    """Exception for packet capture errors"""
    
    def __init__(self, message: str, interface: str = None):
        super().__init__(
            message=message,
            error_code="PACKET_CAPTURE_ERROR",
            details={"interface": interface} if interface else {},
            status_code=500
        )

class FederatedLearningException(AgisFlBaseException):
    """Exception for federated learning errors"""
    
    def __init__(self, message: str, phase: str = None):
        super().__init__(
            message=message,
            error_code="FEDERATED_LEARNING_ERROR",
            details={"phase": phase} if phase else {},
            status_code=500
        )

class SecurityException(AgisFlBaseException):
    """Exception for security-related errors"""
    
    def __init__(self, message: str, threat_type: str = None):
        super().__init__(
            message=message,
            error_code="SECURITY_ERROR",
            details={"threat_type": threat_type} if threat_type else {},
            status_code=403
        )

class RateLimitException(AgisFlBaseException):
    """Exception for rate limiting errors"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after},
            status_code=429
        )

class ConfigurationException(AgisFlBaseException):
    """Exception for configuration errors"""
    
    def __init__(self, message: str, config_key: str = None):
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            details={"config_key": config_key} if config_key else {},
            status_code=500
        )

# Error Handler Class
class ErrorHandler:
    def handle_validation_error(self, error):
        return self._handle_validation_error(error)
    def handle_api_error(self, error):
        # Stub for test compatibility
            # Return a response-like object with status_code
            class DummyResponse:
                def __init__(self, error):
                    self.status_code = getattr(error, 'status_code', 500)
                    self.error = str(error)
            return DummyResponse(error)
    """Centralized error handler for the application"""
    
    def __init__(self):
        self.error_count = 0
        self.error_history = []
        self.max_history = 1000
    
    def handle_exception(
        self,
        exception: Exception,
        request: Request = None,
        include_traceback: bool = False
    ) -> JSONResponse:
        """Handle any exception and return appropriate response"""
        
        self.error_count += 1
        
        # Log the error
        self._log_error(exception, request)
        
        # Add to error history
        self._add_to_history(exception, request)
        
        # Handle different exception types
        if isinstance(exception, AgisFlBaseException):
            return self._handle_agisfl_exception(exception, include_traceback)
        elif isinstance(exception, HTTPException):
            return self._handle_http_exception(exception)
        elif isinstance(exception, ValidationError):
            return self._handle_validation_error(exception)
        else:
            return self._handle_generic_exception(exception, include_traceback)
    
    def _log_error(self, exception: Exception, request: Request = None):
        """Log error with appropriate level and context"""
        
        error_context = {
            "exception_type": type(exception).__name__,
            "message": str(exception)
        }
        
        if request:
            error_context.update({
                "method": request.method,
                "url": str(request.url),
                "client_ip": getattr(request.client, 'host', 'unknown'),
                "user_agent": request.headers.get("user-agent", "unknown")
            })
        
        if isinstance(exception, AgisFlBaseException):
            error_context.update({
                "error_code": exception.error_code,
                "status_code": exception.status_code,
                "details": exception.details
            })
        
        # Determine log level
        if isinstance(exception, (ValidationException, AuthenticationException, AuthorizationException)):
            logger.warning("Application error", extra=error_context)
        elif isinstance(exception, SecurityException):
            logger.error("Security error", extra=error_context)
        else:
            logger.error("Application error", extra=error_context, exc_info=True)
    
    def _add_to_history(self, exception: Exception, request: Request = None):
        """Add error to history for monitoring"""
        
        error_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "exception_type": type(exception).__name__,
            "message": str(exception),
            "request_info": {}
        }
        
        if request:
            error_entry["request_info"] = {
                "method": request.method,
                "path": request.url.path,
                "client_ip": getattr(request.client, 'host', 'unknown')
            }
        
        self.error_history.append(error_entry)
        
        # Limit history size
        if len(self.error_history) > self.max_history:
            self.error_history = self.error_history[-self.max_history:]
    
    def _handle_agisfl_exception(
        self,
        exception: AgisFlBaseException,
        include_traceback: bool = False
    ) -> JSONResponse:
        """Handle AgisFL custom exceptions"""
        
        response_data = {
            "success": False,
            "message": exception.message,
            "error_code": exception.error_code,
            "timestamp": exception.timestamp.isoformat()
        }
        
        if exception.details:
            response_data["details"] = exception.details
        
        if include_traceback:
            response_data["traceback"] = traceback.format_exc()
        
        return JSONResponse(
            content=response_data,
            status_code=exception.status_code
        )
    
    def _handle_http_exception(self, exception: HTTPException) -> JSONResponse:
        """Handle FastAPI HTTP exceptions"""
        
        response_data = {
            "success": False,
            "message": exception.detail,
            "error_code": f"HTTP_{exception.status_code}",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return JSONResponse(
            content=response_data,
            status_code=exception.status_code
        )
    
    def _handle_validation_error(self, exception: Exception) -> JSONResponse:
        """Handle validation errors (e.g., from Pydantic)"""
        
        response_data = {
            "success": False,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "details": {"validation_errors": [str(exception)]},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return JSONResponse(
            content=response_data,
            status_code=422
        )
    
    def _handle_generic_exception(
        self,
        exception: Exception,
        include_traceback: bool = False
    ) -> JSONResponse:
        """Handle generic exceptions"""
        
        response_data = {
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if include_traceback:
            response_data["traceback"] = traceback.format_exc()
            response_data["exception_details"] = str(exception)
        
        return JSONResponse(
            content=response_data,
            status_code=500
        )
    
    def get_error_statistics(self) -> Dict[str, Any]:
        """Get error statistics"""
        
        if not self.error_history:
            return {
                "total_errors": self.error_count,
                "recent_errors": 0,
                "error_types": {},
                "error_rate": 0.0
            }
        
        # Count recent errors (last hour)
        recent_errors = [
            error for error in self.error_history
            if (datetime.utcnow() - datetime.fromisoformat(error["timestamp"])).seconds < 3600
        ]
        
        # Count error types
        error_types = {}
        for error in self.error_history:
            error_type = error["exception_type"]
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        return {
            "total_errors": self.error_count,
            "recent_errors": len(recent_errors),
            "error_types": error_types,
            "error_rate": len(recent_errors) / 60.0,  # errors per minute
            "last_error": self.error_history[-1] if self.error_history else None
        }

# Global error handler instance
error_handler = ErrorHandler()

# Exception handling decorators
def handle_exceptions(
    include_traceback: bool = False,
    reraise: bool = False,
    default_return: Any = None
):
    """Decorator to handle exceptions in functions"""
    
    def decorator(func: Callable) -> Callable:
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    logger.exception(f"Error in {func.__name__}: {str(e)}")
                    
                    if reraise:
                        raise
                    
                    return default_return
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logger.exception(f"Error in {func.__name__}: {str(e)}")
                    
                    if reraise:
                        raise
                    
                    return default_return
            return sync_wrapper
    
    return decorator

def safe_execute(
    func: Callable,
    *args,
    default_return: Any = None,
    log_errors: bool = True,
    **kwargs
) -> Any:
    """Safely execute a function with error handling"""
    
    try:
        if asyncio.iscoroutinefunction(func):
            return asyncio.create_task(func(*args, **kwargs))
        else:
            return func(*args, **kwargs)
    except Exception as e:
        if log_errors:
            logger.exception(f"Error executing {func.__name__}: {str(e)}")
        return default_return

def retry_on_exception(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff_factor: float = 2.0,
    exception_types: tuple = (Exception,)
):
    """Decorator to retry function on specific exceptions"""
    
    def decorator(func: Callable) -> Callable:
        if asyncio.iscoroutinefunction(func):
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                last_exception = None
                
                for attempt in range(max_retries + 1):
                    try:
                        return await func(*args, **kwargs)
                    except exception_types as e:
                        last_exception = e
                        
                        if attempt < max_retries:
                            sleep_time = delay * (backoff_factor ** attempt)
                            logger.warning(
                                f"Attempt {attempt + 1} failed for {func.__name__}, retrying in {sleep_time}s: {str(e)}"
                            )
                            await asyncio.sleep(sleep_time)
                        else:
                            logger.error(f"All {max_retries + 1} attempts failed for {func.__name__}")
                            raise last_exception
                
                raise last_exception
            return async_wrapper
        else:
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                import time
                last_exception = None
                
                for attempt in range(max_retries + 1):
                    try:
                        return func(*args, **kwargs)
                    except exception_types as e:
                        last_exception = e
                        
                        if attempt < max_retries:
                            sleep_time = delay * (backoff_factor ** attempt)
                            logger.warning(
                                f"Attempt {attempt + 1} failed for {func.__name__}, retrying in {sleep_time}s: {str(e)}"
                            )
                            time.sleep(sleep_time)
                        else:
                            logger.error(f"All {max_retries + 1} attempts failed for {func.__name__}")
                            raise last_exception
                
                raise last_exception
            return sync_wrapper
    
    return decorator

# Context managers for error handling
class ErrorContext:
    """Context manager for error handling"""
    
    def __init__(
        self,
        operation_name: str,
        log_errors: bool = True,
        reraise: bool = True,
        default_return: Any = None
    ):
        self.operation_name = operation_name
        self.log_errors = log_errors
        self.reraise = reraise
        self.default_return = default_return
        self.exception = None
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.exception = exc_val
            
            if self.log_errors:
                logger.exception(f"Error in {self.operation_name}: {str(exc_val)}")
            
            if not self.reraise:
                return True  # Suppress the exception
        
        return False

# Utility functions for error handling
def format_exception(exception: Exception) -> Dict[str, Any]:
    """Format exception for logging or API response"""
    
    return {
        "type": type(exception).__name__,
        "message": str(exception),
        "traceback": traceback.format_exc(),
        "timestamp": datetime.utcnow().isoformat()
    }

def is_client_error(exception: Exception) -> bool:
    """Check if exception is a client error (4xx)"""
    
    if isinstance(exception, AgisFlBaseException):
        return 400 <= exception.status_code < 500
    elif isinstance(exception, HTTPException):
        return 400 <= exception.status_code < 500
    
    return False

def is_server_error(exception: Exception) -> bool:
    """Check if exception is a server error (5xx)"""
    
    if isinstance(exception, AgisFlBaseException):
        return exception.status_code >= 500
    elif isinstance(exception, HTTPException):
        return exception.status_code >= 500
    
    return True  # Default to server error for unknown exceptions

def create_error_response(
    message: str,
    error_code: str = None,
    status_code: int = 500,
    details: Dict[str, Any] = None
) -> JSONResponse:
    """Create standardized error response"""
    
    response_data = {
        "success": False,
        "message": message,
        "error_code": error_code or "UNKNOWN_ERROR",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if details:
        response_data["details"] = details
    
    return JSONResponse(content=response_data, status_code=status_code)

# Global exception handler middleware
async def global_exception_handler(request: Request, call_next):
    """Global exception handling middleware"""
    
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return error_handler.handle_exception(e, request)

# Error reporting utilities
class ErrorReporter:
    """Report errors to external monitoring systems"""
    
    def __init__(self):
        self.enabled = False
        self.endpoints = []
    
    def report_error(self, exception: Exception, context: Dict[str, Any] = None):
        """Report error to external systems"""
        
        if not self.enabled:
            return
        
        error_data = {
            "exception": format_exception(exception),
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Here you would implement reporting to external services
        # like Sentry, Rollbar, etc.
        logger.info(f"Error reported: {error_data}")

# Global error reporter
error_reporter = ErrorReporter()

# Export key classes and functions
__all__ = [
    'AgisFlBaseException',
    'ValidationException',
    'AuthenticationException',
    'AuthorizationException',
    'ResourceNotFoundException',
    'BusinessLogicException',
    'ExternalServiceException',
    'DatabaseException',
    'NetworkException',
    'PacketCaptureException',
    'FederatedLearningException',
    'SecurityException',
    'RateLimitException',
    'ConfigurationException',
    'ErrorHandler',
    'error_handler',
    'handle_exceptions',
    'safe_execute',
    'retry_on_exception',
    'ErrorContext',
    'format_exception',
    'create_error_response',
    'global_exception_handler',
    'ErrorReporter',
    'error_reporter'
]

"""
Standardized API Response Models
Provides consistent response structures across all API endpoints
"""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi.responses import JSONResponse
from fastapi import status
import logging
import time

logger = logging.getLogger("utils.response_models")

class BaseResponse(BaseModel):
    """Base response model for all API endpoints"""
    success: bool = Field(description="Whether the operation was successful")
    message: str = Field(description="Human-readable message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    data: Any = Field(default=None, description="Response data")
    
class DataResponse(BaseResponse):
    """Response model with data payload"""
    data: Any = Field(description="Response data")
    
class ListResponse(BaseResponse):
    """Response model for list endpoints"""
    data: List[Any] = Field(description="List of items")
    total: int = Field(description="Total number of items")
    page: Optional[int] = Field(None, description="Current page number")
    per_page: Optional[int] = Field(None, description="Number of items per page")

    @property
    def pagination(self):
        pages = 1
        if self.per_page and self.per_page > 0:
            pages = (self.total + self.per_page - 1) // self.per_page
        else:
            if self.data:
                pages = len(self.data)
        has_next = False
        if self.page and self.per_page:
            has_next = self.page < pages
        return {
            "total": self.total,
            "page": self.page,
            "per_page": self.per_page,
            "pages": pages,
            "has_next": has_next
        }
    
class ErrorResponse(BaseResponse):
    @classmethod
    def validation_error(cls, message: str, details: dict = None):
        return cls(
            success=False,
            message=message,
            error_code="VALIDATION_ERROR",
            details=details
        )
    """Response model for errors"""
    error_code: str = Field(description="Error code for programmatic handling")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
class HealthResponse(BaseResponse):
    """Response model for health checks"""
    status: str = Field(description="Health status")
    components: Dict[str, Any] = Field(description="Component health details")
    uptime_seconds: int = Field(description="System uptime in seconds")
    
class AuthResponse(BaseResponse):
    """Response model for authentication"""
    access_token: Optional[str] = Field(None, description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: Optional[int] = Field(None, description="Token expiration in seconds")
    user: Optional[Dict[str, Any]] = Field(None, description="User information")

class PacketCaptureResponse(BaseResponse):
    """Response model for packet capture operations"""
    interface: Optional[str] = Field(None, description="Network interface used")
    is_capturing: bool = Field(description="Whether capture is active")
    packets_captured: int = Field(0, description="Number of packets captured")
    malicious_detected: int = Field(0, description="Number of malicious packets")
    
class FederatedLearningResponse(BaseResponse):
    """Response model for federated learning operations"""
    fl_ready: bool = Field(description="Whether FL system is ready")
    clients_online: int = Field(0, description="Number of connected clients")
    current_round: int = Field(0, description="Current training round")
    model_accuracy: float = Field(0.0, description="Current model accuracy")
    training_active: bool = Field(False, description="Whether training is active")

class SecurityResponse(BaseResponse):
    """Response model for security operations"""
    security_level: str = Field(description="Current security level")
    threats_detected: int = Field(0, description="Number of threats detected")
    last_scan: Optional[datetime] = Field(None, description="Last security scan timestamp")
    
class ValidationResponse(BaseResponse):
    """Response model for validation operations"""
    valid: bool = Field(description="Whether validation passed")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")

# Response Factory Functions
def success_response(
    message: str = "Operation completed successfully",
    data: Any = None,
    status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """Create a successful response"""
    response_data = {
        "success": True,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response_data["data"] = data
    
    return JSONResponse(content=response_data, status_code=status_code)

def error_response(
    message: str,
    error_code: str = "OPERATION_FAILED",
    details: Optional[Dict[str, Any]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> JSONResponse:
    """Create an error response"""
    response_data = {
        "success": False,
        "message": message,
        "error_code": error_code,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if details:
        response_data["details"] = details
    
    logger.warning(f"Error response: {message}", extra={"error_code": error_code, "details": details})
    
    return JSONResponse(content=response_data, status_code=status_code)

def validation_error_response(
    errors: List[str],
    message: str = "Validation failed"
) -> JSONResponse:
    """Create a validation error response"""
    return error_response(
        message=message,
        error_code="VALIDATION_ERROR",
        details={"validation_errors": errors},
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY
    )

def not_found_response(
    resource: str = "Resource"
) -> JSONResponse:
    """Create a not found response"""
    return error_response(
        message=f"{resource} not found",
        error_code="NOT_FOUND",
        status_code=status.HTTP_404_NOT_FOUND
    )

def unauthorized_response(
    message: str = "Authentication required"
) -> JSONResponse:
    """Create an unauthorized response"""
    return error_response(
        message=message,
        error_code="UNAUTHORIZED",
        status_code=status.HTTP_401_UNAUTHORIZED
    )

def forbidden_response(
    message: str = "Insufficient permissions"
) -> JSONResponse:
    """Create a forbidden response"""
    return error_response(
        message=message,
        error_code="FORBIDDEN",
        status_code=status.HTTP_403_FORBIDDEN
    )

def rate_limit_response(
    message: str = "Rate limit exceeded",
    retry_after: int = 60
) -> JSONResponse:
    """Create a rate limit exceeded response"""
    response = error_response(
        message=message,
        error_code="RATE_LIMIT_EXCEEDED",
        details={"retry_after": retry_after},
        status_code=status.HTTP_429_TOO_MANY_REQUESTS
    )
    response.headers["Retry-After"] = str(retry_after)
    return response

def server_error_response(
    message: str = "Internal server error",
    error_code: str = "INTERNAL_ERROR"
) -> JSONResponse:
    """Create a server error response"""
    logger.error(f"Server error: {message}", extra={"error_code": error_code})
    
    return error_response(
        message=message,
        error_code=error_code,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

def paginated_response(
    data: List[Any],
    total: int,
    page: int = 1,
    page_size: int = 20,
    message: str = "Data retrieved successfully"
) -> JSONResponse:
    """Create a paginated response"""
    response_data = {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size,
            "has_next": page * page_size < total,
            "has_prev": page > 1
        },
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return JSONResponse(content=response_data)

def health_response(
    healthy: bool,
    components: Dict[str, Any],
    uptime_seconds: int,
    message: str = None
) -> JSONResponse:
    """Create a health check response"""
    if message is None:
        message = "System healthy" if healthy else "System unhealthy"
    
    response_data = {
        "success": healthy,
        "message": message,
        "status": "healthy" if healthy else "unhealthy",
        "components": components,
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    status_code = status.HTTP_200_OK if healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(content=response_data, status_code=status_code)

# Decorator for standardizing endpoint responses
def standardize_response(func):
    """Decorator to standardize API responses"""
    async def wrapper(*args, **kwargs):
        try:
            result = await func(*args, **kwargs)
            
            # If result is already a JSONResponse, return as-is
            if isinstance(result, JSONResponse):
                return result
            
            # If result is a dict with success field, wrap it
            if isinstance(result, dict):
                if "success" not in result:
                    result["success"] = True
                if "timestamp" not in result:
                    result["timestamp"] = datetime.utcnow().isoformat()
                return JSONResponse(content=result)
            
            # For other types, wrap in success response
            return success_response(data=result)
            
        except Exception as e:
            logger.exception(f"Error in {func.__name__}: {str(e)}")
            return server_error_response(f"Error in {func.__name__}: {str(e)}")
    
    return wrapper

# Response validation utilities
def validate_response_model(response_data: Dict[str, Any], model: BaseModel) -> bool:
    """Validate response data against a Pydantic model"""
    try:
        model(**response_data)
        return True
    except Exception as e:
        logger.warning(f"Response validation failed: {e}")
        return False

def add_response_metadata(
    response_data: Dict[str, Any],
    request_id: str = None,
    processing_time: float = None,
    api_version: str = "5.0.0"
) -> Dict[str, Any]:
    """Add metadata to response"""
    metadata = {
        "api_version": api_version,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if request_id:
        metadata["request_id"] = request_id
    
    if processing_time:
        metadata["processing_time_ms"] = round(processing_time * 1000, 2)
    
    response_data.update(metadata)
    return response_data

# Response caching utilities
class ResponseCache:
    """Simple in-memory response cache"""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
    
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached response"""
        if key in self.cache:
            cache_entry = self.cache[key]
            if time.time() - cache_entry["timestamp"] < self.ttl_seconds:
                return cache_entry["data"]
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, data: Dict[str, Any]) -> None:
        """Cache response"""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        
        self.cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
    
    def clear(self) -> None:
        """Clear cache"""
        self.cache.clear()

# Global response cache instance
response_cache = ResponseCache()

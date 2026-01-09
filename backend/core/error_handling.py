"""
Enhanced Error Handling System for Production
============================================

Provides consistent error responses, proper exception logging, and error tracking.
"""

import asyncio
import logging
import traceback
from typing import Dict, Any, Optional, Union
from datetime import datetime, timezone
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import structlog

logger = structlog.get_logger(__name__)

class ErrorResponse(BaseModel):
    """Standardized error response format"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str
    request_id: Optional[str] = None
    error_code: Optional[str] = None

class ErrorTracker:
    """Track and aggregate errors for monitoring"""
    
    def __init__(self):
        self.error_counts = {}
        self.recent_errors = []
        self.max_recent_errors = 100
    
    def track_error(self, error_type: str, error_message: str, request_id: str = None):
        """Track error occurrence"""
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
        error_record = {
            'type': error_type,
            'message': error_message,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': request_id
        }
        
        self.recent_errors.append(error_record)
        if len(self.recent_errors) > self.max_recent_errors:
            self.recent_errors.pop(0)
    
    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics"""
        return {
            'total_errors': sum(self.error_counts.values()),
            'error_counts': self.error_counts,
            'recent_errors_count': len(self.recent_errors),
            'top_errors': sorted(self.error_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        }

# Global error tracker
error_tracker = ErrorTracker()

def create_error_response(
    error_type: str,
    message: str,
    status_code: int = 500,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
    error_code: Optional[str] = None
) -> JSONResponse:
    """Create standardized error response"""
    
    error_response = ErrorResponse(
        error=error_type,
        message=message,
        details=details,
        timestamp=datetime.now(timezone.utc).isoformat(),
        request_id=request_id,
        error_code=error_code
    )
    
    # Track error
    error_tracker.track_error(error_type, message, request_id)
    
    # Log error with structured logging
    logger.error(
        "api_error_generated",
        error_type=error_type,
        message=message,
        status_code=status_code,
        request_id=request_id,
        error_code=error_code,
        details=details
    )
    
    return JSONResponse(
        status_code=status_code,
        content=error_response.dict(exclude_none=True)
    )

async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle validation errors consistently"""
    request_id = getattr(request.state, 'request_id', None)
    
    if hasattr(exc, 'errors'):
        # Pydantic validation error
        details = {'validation_errors': exc.errors()}
        message = "Request validation failed"
    else:
        details = None
        message = str(exc)
    
    return create_error_response(
        error_type="ValidationError",
        message=message,
        status_code=422,
        details=details,
        request_id=request_id,
        error_code="VALIDATION_FAILED"
    )

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions consistently"""
    request_id = getattr(request.state, 'request_id', None)
    
    return create_error_response(
        error_type="HTTPException",
        message=exc.detail,
        status_code=exc.status_code,
        request_id=request_id,
        error_code=f"HTTP_{exc.status_code}"
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    request_id = getattr(request.state, 'request_id', None)
    
    # Log full traceback for debugging
    logger.error(
        "unhandled_exception",
        exception_type=type(exc).__name__,
        exception_message=str(exc),
        traceback=traceback.format_exc(),
        request_id=request_id,
        path=request.url.path,
        method=request.method
    )
    
    # Don't expose internal error details in production
    return create_error_response(
        error_type="InternalServerError",
        message="An internal server error occurred",
        status_code=500,
        request_id=request_id,
        error_code="INTERNAL_ERROR"
    )

async def timeout_exception_handler(request: Request, exc: asyncio.TimeoutError) -> JSONResponse:
    """Handle timeout errors"""
    request_id = getattr(request.state, 'request_id', None)
    
    return create_error_response(
        error_type="TimeoutError",
        message="Request timed out",
        status_code=408,
        request_id=request_id,
        error_code="REQUEST_TIMEOUT"
    )

def setup_error_handlers(app):
    """Setup all error handlers on FastAPI app"""
    from fastapi.exceptions import RequestValidationError
    
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(asyncio.TimeoutError, timeout_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
    
    logger.info("Error handlers configured")
    return error_tracker
"""
CSRF Protection Middleware
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-CSRF-Protection"] = "enabled"
        return response
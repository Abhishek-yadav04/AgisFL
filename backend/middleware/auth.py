"""
Mock Authentication for Red Team Simulator Testing
==================================================

This is a simplified mock implementation to support the Red Team Simulator
API testing without requiring the full authentication infrastructure.
"""

from typing import Dict, Any


async def get_current_user() -> Dict[str, Any]:
    """Mock regular user for testing."""
    return {
        "user_id": "user_001",
        "username": "user",
        "role": "user", 
        "permissions": ["dashboard_access", "fl_participation"],
        "authenticated": True
    }


async def get_current_admin_user() -> Dict[str, Any]:
    """Mock admin user for testing."""
    return {
        "user_id": "admin_001",
        "username": "admin",
        "role": "administrator", 
        "permissions": ["security_simulation", "dashboard_access", "system_admin"],
        "authenticated": True
    }


def verify_admin_permissions(user: Dict[str, Any], required_permission: str) -> bool:
    """Verify admin has required permissions."""
    return required_permission in user.get("permissions", [])

"""
Rules Management API
Simple rules management for development
"""

from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(tags=["Rules Management"])

@router.get("/overview")
async def get_rules_overview():
    """Get rules overview"""
    return {
        "status": "active",
        "total_rules": 25,
        "active_rules": 23,
        "disabled_rules": 2,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "categories": {
            "security": 15,
            "validation": 8,
            "compliance": 2
        }
    }

@router.get("/")
async def get_rules():
    """Get all rules"""
    return {
        "rules": [
            {
                "id": "rule_001",
                "name": "Input Validation",
                "category": "security",
                "status": "active",
                "description": "Validate all user inputs"
            },
            {
                "id": "rule_002", 
                "name": "Rate Limiting",
                "category": "security",
                "status": "active",
                "description": "Limit API request rates"
            }
        ],
        "total": 25
    }
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

router = APIRouter(tags=["Protected"], prefix="/protected")

@router.get("/resource")
async def get_protected_resource():
    """Get protected resource"""
    return {"status": "success", "message": "Protected resource accessed"}

@router.get("/admin") 
async def get_admin_resource():
    """Get admin resource"""
    return {"status": "success", "message": "Admin resource accessed"}

@router.get("/health")
async def get_protected_health():
    """Get protected health"""
    return {"status": "healthy", "message": "Protected health check"}

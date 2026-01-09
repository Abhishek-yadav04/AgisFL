"""
Quick fix script to add missing security endpoints
"""

from fastapi import FastAPI
from datetime import datetime, timezone, timedelta

def add_security_endpoints(app: FastAPI):
    """Add missing security endpoints"""
    
    @app.get("/api/security/dashboard")
    async def security_dashboard():
        from api.security_data import get_security_threats, get_security_metrics, get_security_events
        return {
            "status": "success",
            "threats": get_security_threats()[:5],  # Latest 5 threats
            "metrics": get_security_metrics(),
            "events": get_security_events()[:10],  # Latest 10 events
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    @app.get("/api/security/events")
    async def security_events():
        from api.security_data import get_security_events
        return {
            "status": "success", 
            "events": get_security_events(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    @app.get("/api/security/metrics")
    async def security_metrics():
        from api.security_data import get_security_metrics
        return {
            "status": "success",
            "metrics": get_security_metrics(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

if __name__ == "__main__":
    print("Security endpoints fix script ready")
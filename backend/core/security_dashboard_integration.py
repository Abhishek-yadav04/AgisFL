"""
AgisFL Security Posture Integration for Governance Dashboard
===========================================================

This module integrates the Red Team Simulator results with the governance
dashboard, providing administrators with real-time security monitoring
and historical trend analysis.
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from dataclasses import asdict

from .attack_simulation import (
    AttackSimulationEngine, SecurityPostureDashboard, 
    SimulationResult, DefenseResult, AttackType
)

logger = logging.getLogger(__name__)

class SecurityPostureAPI:
    """API integration for security posture data in governance dashboard."""
    
    def __init__(self, simulation_engine: AttackSimulationEngine):
        self.simulation_engine = simulation_engine
        self.dashboard = SecurityPostureDashboard(simulation_engine)
        self.logger = logging.getLogger(f"{__name__}.SecurityPostureAPI")
        
    async def get_security_overview(self) -> Dict[str, Any]:
        """Get high-level security overview for dashboard."""
        report = await self.dashboard.generate_security_posture_report()
        
        return {
            "security_score": report.get("security_score", 0),
            "risk_level": report.get("risk_level", "UNKNOWN"),
            "trend": report.get("trend_analysis", {}).get("trend", "stable"),
            "last_simulation": report.get("last_simulation"),
            "status": "active" if report.get("recent_simulations", 0) > 0 else "inactive"
        }
    
    async def get_simulation_history(self, 
                                   days: int = 30,
                                   attack_type: Optional[AttackType] = None) -> List[Dict[str, Any]]:
        """Get simulation history for specified period."""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        history = [
            result for result in self.dashboard.simulation_history
            if result.timestamp >= cutoff_date
        ]
        
        if attack_type:
            history = [r for r in history if r.attack_type == attack_type]
        
        return [
            {
                "timestamp": result.timestamp.isoformat(),
                "attack_type": result.attack_type.value,
                "defense_result": result.defense_result.value,
                "metrics": result.metrics,
                "has_visual_evidence": result.visual_evidence is not None
            }
            for result in history
        ]
    
    async def get_attack_statistics(self) -> Dict[str, Any]:
        """Get detailed attack statistics for dashboard charts."""
        history = self.dashboard.simulation_history
        
        if not history:
            return {
                "total_simulations": 0,
                "by_attack_type": {},
                "by_result": {},
                "success_rate_trend": []
            }
        
        # Statistics by attack type
        by_attack_type = {}
        for result in history:
            attack_name = result.attack_type.value
            if attack_name not in by_attack_type:
                by_attack_type[attack_name] = {
                    "total": 0,
                    "successful": 0,
                    "partial": 0,
                    "failed": 0
                }
            
            by_attack_type[attack_name]["total"] += 1
            by_attack_type[attack_name][result.defense_result.value.lower()] += 1
        
        # Statistics by result
        by_result = {
            "successful": sum(1 for r in history if r.defense_result == DefenseResult.SUCCESSFUL),
            "partial": sum(1 for r in history if r.defense_result == DefenseResult.PARTIAL),
            "failed": sum(1 for r in history if r.defense_result == DefenseResult.FAILED)
        }
        
        # Success rate trend (weekly)
        success_rate_trend = self._calculate_success_rate_trend(history)
        
        return {
            "total_simulations": len(history),
            "by_attack_type": by_attack_type,
            "by_result": by_result,
            "success_rate_trend": success_rate_trend
        }
    
    def _calculate_success_rate_trend(self, history: List[SimulationResult]) -> List[Dict[str, Any]]:
        """Calculate weekly success rate trend."""
        if not history:
            return []
        
        # Group by week
        weekly_data = {}
        for result in history:
            week_start = result.timestamp - timedelta(days=result.timestamp.weekday())
            week_key = week_start.strftime("%Y-%m-%d")
            
            if week_key not in weekly_data:
                weekly_data[week_key] = {"total": 0, "successful": 0}
            
            weekly_data[week_key]["total"] += 1
            if result.defense_result == DefenseResult.SUCCESSFUL:
                weekly_data[week_key]["successful"] += 1
        
        # Calculate success rates
        trend = []
        for week, data in sorted(weekly_data.items()):
            success_rate = data["successful"] / data["total"] * 100
            trend.append({
                "week": week,
                "success_rate": success_rate,
                "total_simulations": data["total"]
            })
        
        return trend
    
    async def get_security_recommendations(self) -> List[Dict[str, Any]]:
        """Get actionable security recommendations."""
        report = await self.dashboard.generate_security_posture_report()
        recommendations = report.get("recommendations", [])
        
        # Enhanced recommendations with priorities and actions
        enhanced_recommendations = []
        for i, rec in enumerate(recommendations):
            priority = "high" if i == 0 else "medium" if i < 3 else "low"
            
            enhanced_recommendations.append({
                "id": f"rec_{i+1}",
                "title": rec,
                "priority": priority,
                "category": self._categorize_recommendation(rec),
                "estimated_impact": "high" if "increase" in rec.lower() else "medium"
            })
        
        return enhanced_recommendations
    
    def _categorize_recommendation(self, recommendation: str) -> str:
        """Categorize recommendation for better UI organization."""
        rec_lower = recommendation.lower()
        
        if "byzantine" in rec_lower or "aggregation" in rec_lower:
            return "Data Integrity"
        elif "privacy" in rec_lower or "differential" in rec_lower:
            return "Privacy Protection"
        elif "noise" in rec_lower or "budget" in rec_lower:
            return "Privacy Parameters"
        elif "simulation" in rec_lower or "testing" in rec_lower:
            return "Security Testing"
        else:
            return "General Security"
    
    async def get_latest_simulation_details(self) -> Optional[Dict[str, Any]]:
        """Get details of the most recent simulation."""
        if not self.dashboard.simulation_history:
            return None
        
        latest = self.dashboard.simulation_history[-1]
        
        return {
            "timestamp": latest.timestamp.isoformat(),
            "attack_type": latest.attack_type.value,
            "defense_result": latest.defense_result.value,
            "metrics": latest.metrics,
            "detailed_report": latest.detailed_report,
            "has_visual_evidence": latest.visual_evidence is not None,
            "visual_evidence_size": len(latest.visual_evidence) if latest.visual_evidence else 0
        }

class SecurityDashboardWebSocket:
    """WebSocket handler for real-time security updates."""
    
    def __init__(self, security_api: SecurityPostureAPI):
        self.security_api = security_api
        self.connected_clients = set()
        self.logger = logging.getLogger(f"{__name__}.SecurityWebSocket")
        
    async def register_client(self, websocket):
        """Register a new WebSocket client."""
        self.connected_clients.add(websocket)
        self.logger.info(f"Security dashboard client connected. Total: {len(self.connected_clients)}")
        
        # Send initial security data
        await self.send_security_update(websocket)
    
    async def unregister_client(self, websocket):
        """Unregister a WebSocket client."""
        self.connected_clients.discard(websocket)
        self.logger.info(f"Security dashboard client disconnected. Total: {len(self.connected_clients)}")
    
    async def send_security_update(self, websocket=None):
        """Send security update to client(s)."""
        update_data = {
            "type": "security_update",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "overview": await self.security_api.get_security_overview(),
                "latest_simulation": await self.security_api.get_latest_simulation_details(),
                "recommendations": await self.security_api.get_security_recommendations()
            }
        }
        
        if websocket:
            # Send to specific client
            try:
                await websocket.send(json.dumps(update_data))
            except Exception as e:
                self.logger.error(f"Failed to send update to client: {e}")
        else:
            # Broadcast to all connected clients
            if self.connected_clients:
                message = json.dumps(update_data)
                disconnected = set()
                
                for client in self.connected_clients:
                    try:
                        await client.send(message)
                    except Exception as e:
                        self.logger.error(f"Failed to send broadcast: {e}")
                        disconnected.add(client)
                
                # Remove disconnected clients
                self.connected_clients -= disconnected
    
    async def notify_simulation_complete(self, result: SimulationResult):
        """Notify all clients when a simulation completes."""
        notification = {
            "type": "simulation_complete",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "attack_type": result.attack_type.value,
                "defense_result": result.defense_result.value,
                "metrics": result.metrics,
                "summary": f"{result.attack_type.value} simulation completed with {result.defense_result.value} defense"
            }
        }
        
        if self.connected_clients:
            message = json.dumps(notification)
            disconnected = set()
            
            for client in self.connected_clients:
                try:
                    await client.send(message)
                except Exception as e:
                    self.logger.error(f"Failed to send notification: {e}")
                    disconnected.add(client)
            
            # Remove disconnected clients
            self.connected_clients -= disconnected

class SecurityMetricsCollector:
    """Collector for security-related metrics and analytics."""
    
    def __init__(self):
        self.metrics_buffer = []
        self.logger = logging.getLogger(f"{__name__}.SecurityMetrics")
        
    async def collect_simulation_metrics(self, result: SimulationResult):
        """Collect metrics from completed simulation."""
        metrics_entry = {
            "timestamp": result.timestamp.isoformat(),
            "attack_type": result.attack_type.value,
            "defense_result": result.defense_result.value,
            "metrics": result.metrics,
            "has_visual_evidence": result.visual_evidence is not None
        }
        
        self.metrics_buffer.append(metrics_entry)
        
        # Keep only last 1000 metrics to prevent memory issues
        if len(self.metrics_buffer) > 1000:
            self.metrics_buffer = self.metrics_buffer[-1000:]
        
        self.logger.info(f"Collected metrics for {result.attack_type.value} simulation")
    
    async def get_aggregated_metrics(self, 
                                   time_window: timedelta = timedelta(days=7)) -> Dict[str, Any]:
        """Get aggregated metrics for specified time window."""
        cutoff_time = datetime.now() - time_window
        
        recent_metrics = [
            m for m in self.metrics_buffer
            if datetime.fromisoformat(m["timestamp"]) >= cutoff_time
        ]
        
        if not recent_metrics:
            return {"total_simulations": 0, "metrics": {}}
        
        # Calculate aggregations
        total_simulations = len(recent_metrics)
        success_rate = sum(
            1 for m in recent_metrics 
            if m["defense_result"] == "SUCCESSFUL"
        ) / total_simulations
        
        # Average metrics by attack type
        attack_type_metrics = {}
        for metric in recent_metrics:
            attack_type = metric["attack_type"]
            if attack_type not in attack_type_metrics:
                attack_type_metrics[attack_type] = {
                    "count": 0,
                    "success_rate": 0,
                    "avg_metrics": {}
                }
            
            attack_type_metrics[attack_type]["count"] += 1
            if metric["defense_result"] == "SUCCESSFUL":
                attack_type_metrics[attack_type]["success_rate"] += 1
        
        # Calculate final success rates
        for attack_type in attack_type_metrics:
            count = attack_type_metrics[attack_type]["count"]
            attack_type_metrics[attack_type]["success_rate"] /= count
        
        return {
            "total_simulations": total_simulations,
            "overall_success_rate": success_rate,
            "time_window_days": time_window.days,
            "by_attack_type": attack_type_metrics
        }

# Integration classes for FastAPI routes
class SecurityRoutes:
    """FastAPI route handlers for security dashboard."""
    
    def __init__(self, security_api: SecurityPostureAPI):
        self.security_api = security_api
        
    async def get_dashboard_data(self):
        """Get complete dashboard data."""
        return {
            "overview": await self.security_api.get_security_overview(),
            "statistics": await self.security_api.get_attack_statistics(),
            "recommendations": await self.security_api.get_security_recommendations(),
            "latest_simulation": await self.security_api.get_latest_simulation_details()
        }
    
    async def get_simulation_history(self, days: int = 30, attack_type: str = None):
        """Get simulation history with optional filtering."""
        attack_type_enum = None
        if attack_type:
            try:
                attack_type_enum = AttackType(attack_type)
            except ValueError:
                pass
        
        return await self.security_api.get_simulation_history(days, attack_type_enum)

# Export classes
__all__ = [
    'SecurityPostureAPI',
    'SecurityDashboardWebSocket', 
    'SecurityMetricsCollector',
    'SecurityRoutes'
]

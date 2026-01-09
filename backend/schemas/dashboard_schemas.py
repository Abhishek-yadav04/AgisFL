"""
Dashboard API Schemas
Pydantic models for request/response validation
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class SystemMetrics(BaseModel):
    """System metrics schema"""
    cpu_usage: float = Field(ge=0, le=100, description="CPU usage percentage")
    memory_usage: float = Field(ge=0, le=100, description="Memory usage percentage")
    memory_total_gb: float = Field(ge=0, description="Total memory in GB")
    memory_used_gb: float = Field(ge=0, description="Used memory in GB")
    disk_usage: float = Field(ge=0, le=100, description="Disk usage percentage")
    disk_total_gb: float = Field(ge=0, description="Total disk space in GB")
    disk_free_gb: float = Field(ge=0, description="Free disk space in GB")
    network_bytes_sent: int = Field(ge=0, description="Network bytes sent")
    network_bytes_recv: int = Field(ge=0, description="Network bytes received")
    processes_count: int = Field(ge=0, description="Number of running processes")
    uptime_seconds: float = Field(ge=0, description="System uptime in seconds")

class DatabaseStats(BaseModel):
    """Database statistics schema"""
    total_users: int = Field(ge=0, description="Total number of users")
    total_datasets: int = Field(ge=0, description="Total number of datasets")
    total_experiments: int = Field(ge=0, description="Total FL experiments")
    security_events: int = Field(ge=0, description="Number of security events")
    audit_logs: int = Field(ge=0, description="Number of audit log entries")
    active_clients: int = Field(ge=0, description="Number of active FL clients")

class FLMetrics(BaseModel):
    """Federated Learning metrics schema"""
    active_experiments: int = Field(ge=0, description="Number of active experiments")
    total_experiments: int = Field(ge=0, description="Total number of experiments")
    global_accuracy: float = Field(ge=0, le=1, description="Global model accuracy")
    active_clients: int = Field(ge=0, description="Number of active clients")
    current_round: int = Field(ge=0, description="Current training round")
    total_rounds: int = Field(ge=0, description="Total training rounds")
    convergence_rate: float = Field(ge=0, le=1, description="Model convergence rate")
    data_samples: int = Field(ge=0, description="Total data samples")
    training_status: str = Field(description="Current training status")

class SecurityMetrics(BaseModel):
    """Security metrics schema"""
    security_score: int = Field(ge=0, le=100, description="Overall security score")
    threats_detected_24h: int = Field(ge=0, description="Threats detected in last 24h")
    threats_blocked_24h: int = Field(ge=0, description="Threats blocked in last 24h")
    failed_logins_24h: int = Field(ge=0, description="Failed logins in last 24h")
    active_sessions: int = Field(ge=0, description="Number of active user sessions")
    last_scan: str = Field(description="Last security scan timestamp")
    vulnerability_count: int = Field(ge=0, description="Number of vulnerabilities")
    compliance_score: int = Field(ge=0, le=100, description="Compliance score")

class PerformanceMetrics(BaseModel):
    """Performance metrics schema"""
    avg_response_time_ms: float = Field(ge=0, description="Average response time in ms")
    requests_per_second: float = Field(ge=0, description="Requests per second")
    error_rate_percent: float = Field(ge=0, le=100, description="Error rate percentage")
    throughput_mbps: float = Field(ge=0, description="Throughput in Mbps")
    cache_hit_rate: float = Field(ge=0, le=100, description="Cache hit rate percentage")
    database_connections: int = Field(ge=0, description="Active database connections")

class Alert(BaseModel):
    """Alert schema"""
    id: str = Field(description="Unique alert identifier")
    type: str = Field(description="Alert type (info, warning, error, critical)")
    title: str = Field(description="Alert title")
    message: str = Field(description="Alert message")
    timestamp: str = Field(description="Alert timestamp")

class DashboardOverview(BaseModel):
    """Complete dashboard overview schema"""
    timestamp: str = Field(description="Data timestamp")
    system: SystemMetrics
    database: DatabaseStats
    federated_learning: FLMetrics
    security: SecurityMetrics
    performance: PerformanceMetrics
    alerts: List[Alert] = Field(default_factory=list, description="Active alerts")

class RealtimeData(BaseModel):
    """Real-time data schema for WebSocket updates"""
    timestamp: str = Field(description="Data timestamp")
    system: Dict[str, Any] = Field(description="System metrics")
    fl_metrics: Dict[str, Any] = Field(description="FL metrics")
    security: Dict[str, Any] = Field(description="Security metrics")

class ChartDataPoint(BaseModel):
    """Chart data point schema"""
    timestamp: str = Field(description="Data point timestamp")
    value: float = Field(description="Data point value")
    label: Optional[str] = Field(None, description="Data point label")

class ChartData(BaseModel):
    """Chart data schema"""
    title: str = Field(description="Chart title")
    labels: List[str] = Field(description="Chart labels")
    datasets: List[Dict[str, Any]] = Field(description="Chart datasets")
    options: Optional[Dict[str, Any]] = Field(None, description="Chart options")

class HealthStatus(BaseModel):
    """Health status schema"""
    status: str = Field(description="Overall health status")
    components: Dict[str, Dict[str, Any]] = Field(description="Component health status")
    timestamp: str = Field(description="Health check timestamp")

class MetricsFilter(BaseModel):
    """Metrics filter schema"""
    start_time: Optional[datetime] = Field(None, description="Start time for metrics")
    end_time: Optional[datetime] = Field(None, description="End time for metrics")
    metric_types: Optional[List[str]] = Field(None, description="Types of metrics to include")
    granularity: Optional[str] = Field("1m", description="Data granularity (1m, 5m, 1h, 1d)")
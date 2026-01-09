"""
Model Lineage and Auditing System for Federated Learning
Implements comprehensive governance, compliance, and audit trails

This module provides enterprise-grade model lineage tracking including:
- Immutable audit trails with blockchain-inspired verification
- Complete model provenance and data lineage tracking
- Compliance reporting for regulatory requirements (GDPR, CCPA, etc.)
- Automated governance policies and risk assessment
- Real-time monitoring and alerting for governance violations
"""

import hashlib
import json
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple, Set, TYPE_CHECKING
from dataclasses import dataclass, field, asdict
from enum import Enum
from datetime import datetime, timezone
import structlog
from pathlib import Path
import sqlite3
import threading
from abc import ABC, abstractmethod
from functools import lru_cache

if TYPE_CHECKING:
    import numpy as np

@lru_cache(maxsize=1)
def _get_numpy():
    """Lazy import numpy to avoid loading at import time"""
    try:
        import numpy as np
        return np
    except ImportError:
        return None

logger = structlog.get_logger(__name__)

class AuditEventType(Enum):
    """Types of audit events"""
    MODEL_TRAINING_STARTED = "model_training_started"
    MODEL_TRAINING_COMPLETED = "model_training_completed"
    CLIENT_JOINED = "client_joined"
    CLIENT_LEFT = "client_left"
    MODEL_UPDATE_RECEIVED = "model_update_received"
    MODEL_AGGREGATED = "model_aggregated"
    MODEL_DEPLOYED = "model_deployed"
    DATA_ACCESSED = "data_accessed"
    PRIVACY_VIOLATION = "privacy_violation"
    SECURITY_INCIDENT = "security_incident"
    COMPLIANCE_CHECK = "compliance_check"
    GOVERNANCE_POLICY_APPLIED = "governance_policy_applied"
    MODEL_PERFORMANCE_DEGRADED = "model_performance_degraded"

class RiskLevel(Enum):
    """Risk levels for governance"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ComplianceFramework(Enum):
    """Supported compliance frameworks"""
    GDPR = "gdpr"
    CCPA = "ccpa"
    HIPAA = "hipaa"
    SOX = "sox"
    ISO27001 = "iso27001"
    NIST = "nist"

@dataclass
class AuditEvent:
    """Immutable audit event record"""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float = field(default_factory=time.time)
    event_type: AuditEventType = AuditEventType.MODEL_TRAINING_STARTED
    actor: str = ""  # Who performed the action
    resource: str = ""  # What was affected
    action: str = ""  # What was done
    details: Dict[str, Any] = field(default_factory=dict)
    risk_level: RiskLevel = RiskLevel.LOW
    compliance_frameworks: List[ComplianceFramework] = field(default_factory=list)
    hash_value: str = ""  # For integrity verification
    previous_hash: str = ""  # For blockchain-like verification
    signature: str = ""  # Digital signature if available
    
    def __post_init__(self):
        """Calculate hash after initialization"""
        if not self.hash_value:
            self.hash_value = self.calculate_hash()
    
    def calculate_hash(self) -> str:
        """Calculate SHA-256 hash of the event for integrity"""
        # Create deterministic string representation
        data = {
            'event_id': self.event_id,
            'timestamp': self.timestamp,
            'event_type': self.event_type.value,
            'actor': self.actor,
            'resource': self.resource,
            'action': self.action,
            'details': json.dumps(self.details, sort_keys=True),
            'risk_level': self.risk_level.value,
            'compliance_frameworks': [f.value for f in self.compliance_frameworks],
            'previous_hash': self.previous_hash
        }
        
        data_string = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_string.encode()).hexdigest()
    
    def verify_integrity(self) -> bool:
        """Verify the integrity of this audit event"""
        calculated_hash = self.calculate_hash()
        return calculated_hash == self.hash_value

@dataclass
class ModelLineageRecord:
    """Complete lineage record for a model"""
    model_id: str
    model_version: str
    creation_timestamp: float = field(default_factory=time.time)
    parent_models: List[str] = field(default_factory=list)
    training_data_sources: List[Dict[str, Any]] = field(default_factory=list)
    algorithm_config: Dict[str, Any] = field(default_factory=dict)
    training_participants: List[str] = field(default_factory=list)
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    privacy_parameters: Dict[str, Any] = field(default_factory=dict)
    security_measures: List[str] = field(default_factory=list)
    compliance_status: Dict[ComplianceFramework, bool] = field(default_factory=dict)
    deployment_history: List[Dict[str, Any]] = field(default_factory=list)
    audit_events: List[str] = field(default_factory=list)  # Event IDs
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class GovernancePolicy:
    """Governance policy definition"""
    policy_id: str
    name: str
    description: str
    policy_type: str  # "privacy", "security", "compliance", "performance"
    conditions: Dict[str, Any]  # Conditions that trigger the policy
    actions: List[str]  # Actions to take when policy is triggered
    severity: RiskLevel = RiskLevel.MEDIUM
    compliance_frameworks: List[ComplianceFramework] = field(default_factory=list)
    enabled: bool = True
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)

class AuditTrail:
    """
    Immutable audit trail with blockchain-inspired integrity verification
    """
    
    def __init__(self, storage_path: str = "audit_trail.db"):
        """
        Initialize audit trail
        
        Args:
            storage_path: Path to SQLite database for audit storage
        """
        self.storage_path = storage_path
        self.lock = threading.RLock()
        self._init_database()
        
        # In-memory cache for recent events
        self.recent_events: List[AuditEvent] = []
        self.max_cache_size = 1000
        
        logger.info("audit_trail_initialized", storage_path=storage_path)
    
    def _init_database(self):
        """Initialize SQLite database for audit storage"""
        with sqlite3.connect(self.storage_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS audit_events (
                    event_id TEXT PRIMARY KEY,
                    timestamp REAL,
                    event_type TEXT,
                    actor TEXT,
                    resource TEXT,
                    action TEXT,
                    details TEXT,
                    risk_level TEXT,
                    compliance_frameworks TEXT,
                    hash_value TEXT,
                    previous_hash TEXT,
                    signature TEXT
                )
            ''')
            
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp ON audit_events(timestamp)
            ''')
            
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_event_type ON audit_events(event_type)
            ''')
            
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_actor ON audit_events(actor)
            ''')
    
    def add_event(self, event: AuditEvent) -> bool:
        """
        Add an audit event to the trail
        
        Args:
            event: Audit event to add
            
        Returns:
            True if event was successfully added
        """
        with self.lock:
            try:
                # Get the previous hash for blockchain-like linking
                previous_hash = self._get_last_hash()
                event.previous_hash = previous_hash
                
                # Recalculate hash with previous hash
                event.hash_value = event.calculate_hash()
                
                # Store in database
                with sqlite3.connect(self.storage_path) as conn:
                    conn.execute('''
                        INSERT INTO audit_events 
                        (event_id, timestamp, event_type, actor, resource, action, 
                         details, risk_level, compliance_frameworks, hash_value, 
                         previous_hash, signature)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        event.event_id,
                        event.timestamp,
                        event.event_type.value,
                        event.actor,
                        event.resource,
                        event.action,
                        json.dumps(event.details),
                        event.risk_level.value,
                        json.dumps([f.value for f in event.compliance_frameworks]),
                        event.hash_value,
                        event.previous_hash,
                        event.signature
                    ))
                
                # Add to cache
                self.recent_events.append(event)
                if len(self.recent_events) > self.max_cache_size:
                    self.recent_events = self.recent_events[-self.max_cache_size//2:]
                
                logger.info("audit_event_added",
                           event_id=event.event_id,
                           event_type=event.event_type.value,
                           actor=event.actor,
                           resource=event.resource)
                
                return True
                
            except Exception as e:
                logger.exception("failed_to_add_audit_event",
                               event_id=event.event_id,
                               error=str(e))
                return False
    
    def _get_last_hash(self) -> str:
        """Get the hash of the last audit event"""
        try:
            with sqlite3.connect(self.storage_path) as conn:
                cursor = conn.execute('''
                    SELECT hash_value FROM audit_events 
                    ORDER BY timestamp DESC, event_id DESC 
                    LIMIT 1
                ''')
                result = cursor.fetchone()
                return result[0] if result else ""
        except Exception:
            return ""
    
    def get_events(self, 
                   start_time: Optional[float] = None,
                   end_time: Optional[float] = None,
                   event_types: Optional[List[AuditEventType]] = None,
                   actors: Optional[List[str]] = None,
                   risk_levels: Optional[List[RiskLevel]] = None,
                   limit: int = 1000) -> List[AuditEvent]:
        """
        Query audit events with filters
        
        Args:
            start_time: Start timestamp filter
            end_time: End timestamp filter
            event_types: Event type filters
            actors: Actor filters
            risk_levels: Risk level filters
            limit: Maximum number of events to return
            
        Returns:
            List of matching audit events
        """
        query = "SELECT * FROM audit_events WHERE 1=1"
        params = []
        
        if start_time is not None:
            query += " AND timestamp >= ?"
            params.append(start_time)
        
        if end_time is not None:
            query += " AND timestamp <= ?"
            params.append(end_time)
        
        if event_types:
            placeholders = ",".join("?" * len(event_types))
            query += f" AND event_type IN ({placeholders})"
            params.extend([et.value for et in event_types])
        
        if actors:
            placeholders = ",".join("?" * len(actors))
            query += f" AND actor IN ({placeholders})"
            params.extend(actors)
        
        if risk_levels:
            placeholders = ",".join("?" * len(risk_levels))
            query += f" AND risk_level IN ({placeholders})"
            params.extend([rl.value for rl in risk_levels])
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        events = []
        try:
            with sqlite3.connect(self.storage_path) as conn:
                cursor = conn.execute(query, params)
                for row in cursor.fetchall():
                    event = self._row_to_event(row)
                    events.append(event)
        except Exception as e:
            logger.exception("failed_to_query_audit_events", error=str(e))
        
        return events
    
    def _row_to_event(self, row) -> AuditEvent:
        """Convert database row to AuditEvent"""
        return AuditEvent(
            event_id=row[0],
            timestamp=row[1],
            event_type=AuditEventType(row[2]),
            actor=row[3],
            resource=row[4],
            action=row[5],
            details=json.loads(row[6]),
            risk_level=RiskLevel(row[7]),
            compliance_frameworks=[ComplianceFramework(f) for f in json.loads(row[8])],
            hash_value=row[9],
            previous_hash=row[10],
            signature=row[11]
        )
    
    def verify_trail_integrity(self) -> Dict[str, Any]:
        """
        Verify the integrity of the entire audit trail
        
        Returns:
            Verification results
        """
        start_time = time.time()
        
        try:
            with sqlite3.connect(self.storage_path) as conn:
                cursor = conn.execute('''
                    SELECT * FROM audit_events ORDER BY timestamp ASC, event_id ASC
                ''')
                
                events = [self._row_to_event(row) for row in cursor.fetchall()]
            
            if not events:
                return {'verified': True, 'total_events': 0, 'verification_time': time.time() - start_time}
            
            # Verify each event's hash
            hash_verification_failures = []
            for event in events:
                if not event.verify_integrity():
                    hash_verification_failures.append(event.event_id)
            
            # Verify chain integrity
            chain_verification_failures = []
            for i in range(1, len(events)):
                if events[i].previous_hash != events[i-1].hash_value:
                    chain_verification_failures.append(events[i].event_id)
            
            verification_time = time.time() - start_time
            
            result = {
                'verified': len(hash_verification_failures) == 0 and len(chain_verification_failures) == 0,
                'total_events': len(events),
                'hash_verification_failures': hash_verification_failures,
                'chain_verification_failures': chain_verification_failures,
                'verification_time': verification_time
            }
            
            logger.info("audit_trail_verification_completed",
                       verified=result['verified'],
                       total_events=result['total_events'],
                       verification_time=verification_time)
            
            return result
            
        except Exception as e:
            logger.exception("audit_trail_verification_failed", error=str(e))
            return {'verified': False, 'error': str(e)}

class ModelLineageTracker:
    """
    Comprehensive model lineage tracking system
    """
    
    def __init__(self, storage_path: str = "model_lineage.db"):
        """Initialize model lineage tracker"""
        self.storage_path = storage_path
        self.lock = threading.RLock()
        self._init_database()
        
        # In-memory cache
        self.lineage_cache: Dict[str, ModelLineageRecord] = {}
        
        logger.info("model_lineage_tracker_initialized", storage_path=storage_path)
    
    def _init_database(self):
        """Initialize database for lineage storage"""
        with sqlite3.connect(self.storage_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS model_lineage (
                    model_id TEXT,
                    model_version TEXT,
                    creation_timestamp REAL,
                    lineage_data TEXT,
                    PRIMARY KEY (model_id, model_version)
                )
            ''')
    
    def create_lineage_record(self, model_id: str, model_version: str, 
                            initial_data: Optional[Dict[str, Any]] = None) -> ModelLineageRecord:
        """
        Create a new model lineage record
        
        Args:
            model_id: Unique model identifier
            model_version: Model version
            initial_data: Initial lineage data
            
        Returns:
            Created lineage record
        """
        with self.lock:
            record = ModelLineageRecord(
                model_id=model_id,
                model_version=model_version
            )
            
            if initial_data:
                record.algorithm_config = initial_data.get('algorithm_config', {})
                record.privacy_parameters = initial_data.get('privacy_parameters', {})
                record.security_measures = initial_data.get('security_measures', [])
                record.metadata = initial_data.get('metadata', {})
            
            # Store in database
            self._save_lineage_record(record)
            
            # Cache
            cache_key = f"{model_id}:{model_version}"
            self.lineage_cache[cache_key] = record
            
            logger.info("model_lineage_record_created",
                       model_id=model_id,
                       model_version=model_version)
            
            return record
    
    def update_lineage_record(self, model_id: str, model_version: str, 
                            updates: Dict[str, Any]) -> bool:
        """
        Update an existing lineage record
        
        Args:
            model_id: Model identifier
            model_version: Model version
            updates: Updates to apply
            
        Returns:
            True if update was successful
        """
        with self.lock:
            cache_key = f"{model_id}:{model_version}"
            
            # Get existing record
            record = self.lineage_cache.get(cache_key) or self._load_lineage_record(model_id, model_version)
            
            if record is None:
                logger.warning("lineage_record_not_found",
                             model_id=model_id,
                             model_version=model_version)
                return False
            
            # Apply updates
            for key, value in updates.items():
                if hasattr(record, key):
                    if key in ['training_data_sources', 'training_participants', 'audit_events']:
                        # For lists, extend rather than replace
                        current_list = getattr(record, key)
                        if isinstance(value, list):
                            current_list.extend(value)
                        else:
                            current_list.append(value)
                    elif key in ['performance_metrics', 'metadata', 'algorithm_config']:
                        # For dicts, update rather than replace
                        current_dict = getattr(record, key)
                        if isinstance(value, dict):
                            current_dict.update(value)
                    else:
                        setattr(record, key, value)
            
            # Save updates
            self._save_lineage_record(record)
            self.lineage_cache[cache_key] = record
            
            logger.info("model_lineage_record_updated",
                       model_id=model_id,
                       model_version=model_version,
                       updates=list(updates.keys()))
            
            return True
    
    def _save_lineage_record(self, record: ModelLineageRecord):
        """Save lineage record to database"""
        lineage_data = json.dumps({
            'parent_models': record.parent_models,
            'training_data_sources': record.training_data_sources,
            'algorithm_config': record.algorithm_config,
            'training_participants': record.training_participants,
            'performance_metrics': record.performance_metrics,
            'privacy_parameters': record.privacy_parameters,
            'security_measures': record.security_measures,
            'compliance_status': {k.value: v for k, v in record.compliance_status.items()},
            'deployment_history': record.deployment_history,
            'audit_events': record.audit_events,
            'metadata': record.metadata
        })
        
        with sqlite3.connect(self.storage_path) as conn:
            conn.execute('''
                INSERT OR REPLACE INTO model_lineage 
                (model_id, model_version, creation_timestamp, lineage_data)
                VALUES (?, ?, ?, ?)
            ''', (record.model_id, record.model_version, record.creation_timestamp, lineage_data))
    
    def _load_lineage_record(self, model_id: str, model_version: str) -> Optional[ModelLineageRecord]:
        """Load lineage record from database"""
        try:
            with sqlite3.connect(self.storage_path) as conn:
                cursor = conn.execute('''
                    SELECT * FROM model_lineage WHERE model_id = ? AND model_version = ?
                ''', (model_id, model_version))
                
                row = cursor.fetchone()
                if row is None:
                    return None
                
                lineage_data = json.loads(row[3])
                
                record = ModelLineageRecord(
                    model_id=row[0],
                    model_version=row[1],
                    creation_timestamp=row[2]
                )
                
                # Restore data
                record.parent_models = lineage_data.get('parent_models', [])
                record.training_data_sources = lineage_data.get('training_data_sources', [])
                record.algorithm_config = lineage_data.get('algorithm_config', {})
                record.training_participants = lineage_data.get('training_participants', [])
                record.performance_metrics = lineage_data.get('performance_metrics', {})
                record.privacy_parameters = lineage_data.get('privacy_parameters', {})
                record.security_measures = lineage_data.get('security_measures', [])
                
                # Handle compliance status
                compliance_data = lineage_data.get('compliance_status', {})
                record.compliance_status = {
                    ComplianceFramework(k): v for k, v in compliance_data.items()
                }
                
                record.deployment_history = lineage_data.get('deployment_history', [])
                record.audit_events = lineage_data.get('audit_events', [])
                record.metadata = lineage_data.get('metadata', {})
                
                return record
                
        except Exception as e:
            logger.exception("failed_to_load_lineage_record",
                           model_id=model_id,
                           model_version=model_version,
                           error=str(e))
            return None
    
    def get_complete_lineage(self, model_id: str, model_version: str) -> Dict[str, Any]:
        """Get complete lineage information including parent lineages"""
        record = self._load_lineage_record(model_id, model_version)
        if record is None:
            return {}
        
        # Build complete lineage tree
        lineage_tree = {
            'model': record,
            'parents': []
        }
        
        # Recursively get parent lineages
        for parent_model in record.parent_models:
            if ':' in parent_model:
                parent_id, parent_version = parent_model.split(':', 1)
                parent_lineage = self.get_complete_lineage(parent_id, parent_version)
                if parent_lineage:
                    lineage_tree['parents'].append(parent_lineage)
        
        return lineage_tree

class GovernanceEngine:
    """
    Automated governance engine that enforces policies and monitors compliance
    """
    
    def __init__(self, audit_trail: AuditTrail, lineage_tracker: ModelLineageTracker):
        """
        Initialize governance engine
        
        Args:
            audit_trail: Audit trail system
            lineage_tracker: Model lineage tracker
        """
        self.audit_trail = audit_trail
        self.lineage_tracker = lineage_tracker
        self.policies: Dict[str, GovernancePolicy] = {}
        self.lock = threading.RLock()
        
        # Default policies
        self._init_default_policies()
        
        logger.info("governance_engine_initialized")
    
    def _init_default_policies(self):
        """Initialize default governance policies"""
        # Privacy policy
        privacy_policy = GovernancePolicy(
            policy_id="privacy_001",
            name="Differential Privacy Enforcement",
            description="Ensure differential privacy is applied to all model updates",
            policy_type="privacy",
            conditions={
                "event_type": AuditEventType.MODEL_UPDATE_RECEIVED.value,
                "privacy_budget_required": True
            },
            actions=["verify_differential_privacy", "alert_if_violation"],
            severity=RiskLevel.HIGH,
            compliance_frameworks=[ComplianceFramework.GDPR, ComplianceFramework.CCPA]
        )
        self.policies[privacy_policy.policy_id] = privacy_policy
        
        # Security policy
        security_policy = GovernancePolicy(
            policy_id="security_001",
            name="Secure Aggregation Enforcement",
            description="Ensure secure aggregation is used for sensitive models",
            policy_type="security",
            conditions={
                "event_type": AuditEventType.MODEL_AGGREGATED.value,
                "secure_aggregation_required": True
            },
            actions=["verify_secure_aggregation", "block_if_violation"],
            severity=RiskLevel.CRITICAL,
            compliance_frameworks=[ComplianceFramework.ISO27001, ComplianceFramework.NIST]
        )
        self.policies[security_policy.policy_id] = security_policy
        
        # Performance policy
        performance_policy = GovernancePolicy(
            policy_id="performance_001",
            name="Model Performance Monitoring",
            description="Monitor for model performance degradation",
            policy_type="performance",
            conditions={
                "event_type": AuditEventType.MODEL_TRAINING_COMPLETED.value,
                "accuracy_threshold": 0.8
            },
            actions=["check_performance", "alert_if_degradation"],
            severity=RiskLevel.MEDIUM,
            compliance_frameworks=[]
        )
        self.policies[performance_policy.policy_id] = performance_policy
    
    def evaluate_event(self, event: AuditEvent) -> List[Dict[str, Any]]:
        """
        Evaluate an audit event against all policies
        
        Args:
            event: Audit event to evaluate
            
        Returns:
            List of policy evaluation results
        """
        with self.lock:
            results = []
            
            for policy_id, policy in self.policies.items():
                if not policy.enabled:
                    continue
                
                # Check if policy conditions match the event
                if self._policy_matches_event(policy, event):
                    evaluation_result = self._execute_policy_actions(policy, event)
                    results.append({
                        'policy_id': policy_id,
                        'policy_name': policy.name,
                        'matched': True,
                        'actions_executed': evaluation_result['actions_executed'],
                        'violations': evaluation_result['violations'],
                        'risk_level': policy.severity.value
                    })
                    
                    # Create governance audit event
                    governance_event = AuditEvent(
                        event_type=AuditEventType.GOVERNANCE_POLICY_APPLIED,
                        actor="governance_engine",
                        resource=f"policy:{policy_id}",
                        action="policy_evaluation",
                        details={
                            'original_event_id': event.event_id,
                            'policy_name': policy.name,
                            'violations': evaluation_result['violations'],
                            'actions_taken': evaluation_result['actions_executed']
                        },
                        risk_level=policy.severity,
                        compliance_frameworks=policy.compliance_frameworks
                    )
                    
                    self.audit_trail.add_event(governance_event)
            
            return results
    
    def _policy_matches_event(self, policy: GovernancePolicy, event: AuditEvent) -> bool:
        """Check if a policy's conditions match an event"""
        conditions = policy.conditions
        
        # Check event type
        if 'event_type' in conditions:
            if conditions['event_type'] != event.event_type.value:
                return False
        
        # Check other conditions based on event details
        for condition_key, condition_value in conditions.items():
            if condition_key == 'event_type':
                continue  # Already checked
            
            if condition_key in event.details:
                event_value = event.details[condition_key]
                if event_value != condition_value:
                    return False
        
        return True
    
    def _execute_policy_actions(self, policy: GovernancePolicy, event: AuditEvent) -> Dict[str, Any]:
        """Execute actions specified by a policy"""
        actions_executed = []
        violations = []
        
        for action in policy.actions:
            try:
                if action == "verify_differential_privacy":
                    violation = self._check_differential_privacy(event)
                    if violation:
                        violations.append(violation)
                
                elif action == "verify_secure_aggregation":
                    violation = self._check_secure_aggregation(event)
                    if violation:
                        violations.append(violation)
                
                elif action == "check_performance":
                    violation = self._check_performance_degradation(event)
                    if violation:
                        violations.append(violation)
                
                elif action == "alert_if_violation":
                    if violations:
                        self._send_alert(policy, event, violations)
                
                elif action == "block_if_violation":
                    if violations:
                        self._block_operation(policy, event, violations)
                
                actions_executed.append(action)
                
            except Exception as e:
                logger.exception("policy_action_failed",
                               policy_id=policy.policy_id,
                               action=action,
                               error=str(e))
        
        return {
            'actions_executed': actions_executed,
            'violations': violations
        }
    
    def _check_differential_privacy(self, event: AuditEvent) -> Optional[str]:
        """Check if differential privacy requirements are met"""
        privacy_budget = event.details.get('privacy_budget_consumed')
        if privacy_budget is None:
            return "No privacy budget information provided"
        
        if privacy_budget <= 0:
            return "Invalid privacy budget value"
        
        # Check if budget exceeds safe thresholds
        if privacy_budget > 10.0:  # Configurable threshold
            return f"Privacy budget exceeds safe threshold: {privacy_budget}"
        
        return None
    
    def _check_secure_aggregation(self, event: AuditEvent) -> Optional[str]:
        """Check if secure aggregation requirements are met"""
        secure_aggregation_used = event.details.get('secure_aggregation_enabled', False)
        if not secure_aggregation_used:
            return "Secure aggregation not enabled for sensitive model"
        
        return None
    
    def _check_performance_degradation(self, event: AuditEvent) -> Optional[str]:
        """Check for model performance degradation"""
        accuracy = event.details.get('accuracy')
        if accuracy is None:
            return None
        
        threshold = 0.8  # Configurable threshold
        if accuracy < threshold:
            return f"Model accuracy below threshold: {accuracy} < {threshold}"
        
        return None
    
    def _send_alert(self, policy: GovernancePolicy, event: AuditEvent, violations: List[str]):
        """Send alert for policy violations"""
        logger.warning("governance_policy_violation",
                      policy_id=policy.policy_id,
                      policy_name=policy.name,
                      event_id=event.event_id,
                      violations=violations)
        
        # In a real implementation, this would send notifications
        # to administrators, compliance officers, etc.
    
    def _block_operation(self, policy: GovernancePolicy, event: AuditEvent, violations: List[str]):
        """Block operation due to policy violations"""
        logger.error("operation_blocked_by_governance",
                    policy_id=policy.policy_id,
                    policy_name=policy.name,
                    event_id=event.event_id,
                    violations=violations)
        
        # In a real implementation, this would take concrete action
        # to stop the violating operation
    
    def generate_compliance_report(self, 
                                 framework: ComplianceFramework,
                                 start_time: Optional[float] = None,
                                 end_time: Optional[float] = None) -> Dict[str, Any]:
        """
        Generate compliance report for a specific framework
        
        Args:
            framework: Compliance framework to report on
            start_time: Report start time
            end_time: Report end time
            
        Returns:
            Comprehensive compliance report
        """
        if end_time is None:
            end_time = time.time()
        if start_time is None:
            start_time = end_time - (30 * 24 * 3600)  # 30 days
        
        # Get relevant audit events
        events = self.audit_trail.get_events(
            start_time=start_time,
            end_time=end_time,
            limit=10000
        )
        
        # Filter events relevant to this framework
        relevant_events = [
            event for event in events 
            if framework in event.compliance_frameworks
        ]
        
        # Analyze compliance status
        total_events = len(relevant_events)
        violation_events = [event for event in relevant_events if event.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
        
        # Group by event type
        event_type_counts = {}
        for event in relevant_events:
            event_type = event.event_type.value
            event_type_counts[event_type] = event_type_counts.get(event_type, 0) + 1
        
        # Calculate compliance score
        compliance_score = max(0, 100 - (len(violation_events) / max(1, total_events)) * 100)
        
        report = {
            'framework': framework.value,
            'report_period': {
                'start_time': start_time,
                'end_time': end_time,
                'duration_days': (end_time - start_time) / (24 * 3600)
            },
            'compliance_score': compliance_score,
            'total_events': total_events,
            'violation_count': len(violation_events),
            'event_type_distribution': event_type_counts,
            'high_risk_events': [
                {
                    'event_id': event.event_id,
                    'timestamp': event.timestamp,
                    'event_type': event.event_type.value,
                    'risk_level': event.risk_level.value,
                    'description': event.action
                }
                for event in violation_events[:10]  # Top 10 violations
            ],
            'recommendations': self._generate_compliance_recommendations(framework, relevant_events),
            'generated_at': time.time()
        }
        
        logger.info("compliance_report_generated",
                   framework=framework.value,
                   compliance_score=compliance_score,
                   total_events=total_events,
                   violations=len(violation_events))
        
        return report
    
    def _generate_compliance_recommendations(self, framework: ComplianceFramework, 
                                           events: List[AuditEvent]) -> List[str]:
        """Generate compliance recommendations based on event analysis"""
        recommendations = []
        
        violation_events = [event for event in events if event.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
        
        if len(violation_events) > len(events) * 0.1:  # >10% violations
            recommendations.append("High violation rate detected - review governance policies")
        
        # Framework-specific recommendations
        if framework == ComplianceFramework.GDPR:
            privacy_events = [e for e in events if e.event_type == AuditEventType.DATA_ACCESSED]
            if privacy_events:
                recommendations.append("Ensure all data access events have proper consent documentation")
        
        elif framework == ComplianceFramework.HIPAA:
            recommendations.append("Verify all medical data processing meets HIPAA security requirements")
        
        elif framework == ComplianceFramework.SOX:
            recommendations.append("Maintain detailed audit trails for all financial model operations")
        
        if not recommendations:
            recommendations.append("Compliance status is satisfactory")
        
        return recommendations

class ComprehensiveGovernanceSystem:
    """
    Complete governance system integrating all components
    """
    
    def __init__(self, base_path: str = "."):
        """Initialize comprehensive governance system"""
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        
        # Initialize components
        self.audit_trail = AuditTrail(str(self.base_path / "audit_trail.db"))
        self.lineage_tracker = ModelLineageTracker(str(self.base_path / "model_lineage.db"))
        self.governance_engine = GovernanceEngine(self.audit_trail, self.lineage_tracker)
        
        logger.info("comprehensive_governance_system_initialized", base_path=str(self.base_path))
    
    def log_federated_learning_event(self, event_type: AuditEventType, 
                                   actor: str, resource: str, action: str,
                                   details: Dict[str, Any],
                                   risk_level: RiskLevel = RiskLevel.LOW,
                                   compliance_frameworks: List[ComplianceFramework] = None) -> str:
        """
        Log a federated learning event and evaluate governance policies
        
        Returns:
            Event ID of the logged event
        """
        if compliance_frameworks is None:
            compliance_frameworks = []
        
        # Create audit event
        event = AuditEvent(
            event_type=event_type,
            actor=actor,
            resource=resource,
            action=action,
            details=details,
            risk_level=risk_level,
            compliance_frameworks=compliance_frameworks
        )
        
        # Add to audit trail
        self.audit_trail.add_event(event)
        
        # Evaluate against governance policies
        policy_results = self.governance_engine.evaluate_event(event)
        
        # Log policy evaluation results
        if policy_results:
            logger.info("governance_policies_evaluated",
                       event_id=event.event_id,
                       policies_matched=len(policy_results),
                       violations=[r for r in policy_results if r['violations']])
        
        return event.event_id
    
    def track_model_lifecycle(self, model_id: str, model_version: str, 
                            lifecycle_stage: str, metadata: Dict[str, Any]) -> bool:
        """
        Track model through its lifecycle stages
        
        Args:
            model_id: Model identifier
            model_version: Model version
            lifecycle_stage: Stage in lifecycle (training, validation, deployment, etc.)
            metadata: Additional metadata
            
        Returns:
            True if tracking was successful
        """
        # Update lineage record
        lineage_updated = self.lineage_tracker.update_lineage_record(
            model_id, model_version, metadata
        )
        
        if not lineage_updated:
            # Create new lineage record if it doesn't exist
            self.lineage_tracker.create_lineage_record(model_id, model_version, metadata)
        
        # Log audit event
        event_id = self.log_federated_learning_event(
            event_type=AuditEventType.MODEL_TRAINING_COMPLETED if lifecycle_stage == 'training' else AuditEventType.MODEL_DEPLOYED,
            actor="fl_system",
            resource=f"model:{model_id}:{model_version}",
            action=f"lifecycle_stage_{lifecycle_stage}",
            details={
                'model_id': model_id,
                'model_version': model_version,
                'lifecycle_stage': lifecycle_stage,
                **metadata
            },
            risk_level=RiskLevel.LOW,
            compliance_frameworks=[ComplianceFramework.ISO27001]
        )
        
        # Update lineage with audit event
        self.lineage_tracker.update_lineage_record(
            model_id, model_version, {'audit_events': [event_id]}
        )
        
        return True
    
    def generate_governance_dashboard(self) -> Dict[str, Any]:
        """Generate comprehensive governance dashboard data"""
        current_time = time.time()
        past_24h = current_time - (24 * 3600)
        past_7d = current_time - (7 * 24 * 3600)
        
        # Get recent events
        recent_events = self.audit_trail.get_events(start_time=past_24h, limit=1000)
        weekly_events = self.audit_trail.get_events(start_time=past_7d, limit=5000)
        
        # Verify audit trail integrity
        integrity_check = self.audit_trail.verify_trail_integrity()
        
        # Generate compliance reports
        compliance_reports = {}
        for framework in [ComplianceFramework.GDPR, ComplianceFramework.ISO27001]:
            compliance_reports[framework.value] = self.governance_engine.generate_compliance_report(
                framework, start_time=past_7d
            )
        
        # Calculate risk metrics
        high_risk_events = [e for e in recent_events if e.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
        
        # Event type distribution
        event_type_dist = {}
        for event in weekly_events:
            event_type = event.event_type.value
            event_type_dist[event_type] = event_type_dist.get(event_type, 0) + 1
        
        dashboard = {
            'governance_overview': {
                'total_events_24h': len(recent_events),
                'total_events_7d': len(weekly_events),
                'high_risk_events_24h': len(high_risk_events),
                'audit_trail_integrity': integrity_check['verified'],
                'active_policies': len([p for p in self.governance_engine.policies.values() if p.enabled])
            },
            'risk_assessment': {
                'current_risk_level': 'high' if len(high_risk_events) > 5 else 'medium' if len(high_risk_events) > 0 else 'low',
                'high_risk_events': [
                    {
                        'event_id': e.event_id,
                        'event_type': e.event_type.value,
                        'timestamp': e.timestamp,
                        'risk_level': e.risk_level.value
                    }
                    for e in high_risk_events[:5]
                ]
            },
            'compliance_status': compliance_reports,
            'audit_trail_status': {
                'total_events': integrity_check.get('total_events', 0),
                'integrity_verified': integrity_check['verified'],
                'verification_time': integrity_check.get('verification_time', 0)
            },
            'event_analytics': {
                'event_type_distribution': event_type_dist,
                'events_per_day': len(weekly_events) / 7,
                'peak_activity_hours': self._analyze_peak_hours(weekly_events)
            },
            'recommendations': self._generate_dashboard_recommendations(recent_events, compliance_reports),
            'generated_at': current_time
        }
        
        return dashboard
    
    def _analyze_peak_hours(self, events: List[AuditEvent]) -> List[int]:
        """Analyze peak activity hours"""
        hour_counts = [0] * 24
        
        for event in events:
            hour = int((event.timestamp % (24 * 3600)) // 3600)
            hour_counts[hour] += 1
        
        # Return top 3 peak hours
        peak_hours = sorted(range(24), key=lambda h: hour_counts[h], reverse=True)[:3]
        return peak_hours
    
    def _generate_dashboard_recommendations(self, recent_events: List[AuditEvent], 
                                          compliance_reports: Dict[str, Any]) -> List[str]:
        """Generate recommendations for the governance dashboard"""
        recommendations = []
        
        # Analyze recent activity
        high_risk_count = len([e for e in recent_events if e.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]])
        
        if high_risk_count > 5:
            recommendations.append("High number of risk events detected - review security policies")
        
        # Analyze compliance scores
        if compliance_reports:
            avg_compliance_score = sum(r['compliance_score'] for r in compliance_reports.values()) / len(compliance_reports)
        else:
            avg_compliance_score = 100.0
        
        if avg_compliance_score < 90:
            recommendations.append("Compliance scores below 90% - strengthen governance controls")
        
        if not recent_events:
            recommendations.append("No recent activity - verify monitoring systems are operational")
        
        if not recommendations:
            recommendations.append("Governance systems operating within normal parameters")
        
        return recommendations

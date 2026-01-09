"""
AgisFL Inter-Federation Communication Protocol (IFCP)
====================================================

The IFCP enables secure, peer-to-peer communication between independent
AgisFL deployments, creating a "federation of federations" to tackle
global-scale federated learning problems.

Key Features:
- Secure P2P federation discovery
- Cross-federation communication protocol
- Alliance management and governance
- Multi-hop secure aggregation
- Hierarchical federation architecture
"""

import asyncio
import json
import logging
import ssl
import time
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
import hashlib
import hmac
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

def serialize_for_json(obj):
    """Convert dataclass objects to JSON-serializable format."""
    data = asdict(obj)
    # Convert datetime objects to ISO format strings
    for key, value in data.items():
        if isinstance(value, datetime):
            data[key] = value.isoformat()
    return data

logger = logging.getLogger(__name__)

class AllianceStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"

class MessageType(Enum):
    DISCOVERY = "discovery"
    ALLIANCE_REQUEST = "alliance_request"
    ALLIANCE_RESPONSE = "alliance_response"
    HEARTBEAT = "heartbeat"
    PROJECT_INVITATION = "project_invitation"
    AGGREGATION_REQUEST = "aggregation_request"
    AGGREGATION_RESPONSE = "aggregation_response"
    GOVERNANCE_UPDATE = "governance_update"

@dataclass
class FederationIdentity:
    """Identity information for a federation."""
    federation_id: str
    name: str
    organization: str
    description: str
    public_key: str
    endpoint_url: str
    capabilities: List[str]
    regions: List[str]
    created_at: datetime
    last_seen: datetime
    
@dataclass
class Alliance:
    """Alliance between two or more federations."""
    alliance_id: str
    alliance_name: str
    federation_ids: List[str]
    status: AllianceStatus
    governance_rules: Dict[str, Any]
    shared_projects: List[str]
    communication_keys: Dict[str, str]  # federation_id -> shared_key
    created_at: datetime
    last_activity: datetime
    
@dataclass
class IFCPMessage:
    """Inter-Federation Communication Protocol message."""
    message_id: str
    message_type: MessageType
    sender_federation_id: str
    recipient_federation_id: Optional[str]  # None for broadcast
    timestamp: datetime
    payload: Dict[str, Any]
    signature: Optional[str] = None
    encryption_key_id: Optional[str] = None

@dataclass
class CrossFederationProject:
    """Project spanning multiple federations."""
    project_id: str
    project_name: str
    coordinator_federation_id: str
    participating_federations: List[str]
    alliance_id: str
    governance_model: Dict[str, Any]
    aggregation_strategy: str
    privacy_requirements: Dict[str, Any]
    created_at: datetime
    status: str

class InterFederationProtocol:
    """
    Inter-Federation Communication Protocol (IFCP)
    
    Core protocol for enabling communication between AgisFL federations,
    creating a mesh network of federated learning collaborations.
    """
    
    def __init__(self, federation_id: str, federation_name: str, organization: str):
        self.federation_id = federation_id
        self.federation_name = federation_name
        self.organization = organization
        
        # Cryptographic setup
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048
        )
        self.public_key = self.private_key.public_key()
        
        # Initialize identity placeholder
        self.identity = None
        
        # Network state
        self.known_federations: Dict[str, FederationIdentity] = {}
        self.active_alliances: Dict[str, Alliance] = {}
        self.cross_federation_projects: Dict[str, CrossFederationProject] = {}
        self.message_history: List[IFCPMessage] = []
        
        # Communication
        self.endpoint_url = None
        self.discovery_registry_url = "https://discovery.agisfl.network"  # Global registry
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Protocol state
        self.running = False
        self.heartbeat_interval = 300  # 5 minutes
        self.discovery_interval = 600  # 10 minutes
        
    async def initialize_protocol(self, endpoint_url: str):
        """Initialize the IFCP with federation endpoint."""
        self.endpoint_url = endpoint_url
        self.session = aiohttp.ClientSession()
        
        # Create federation identity
        self.identity = FederationIdentity(
            federation_id=self.federation_id,
            name=self.federation_name,
            organization=self.organization,
            description=f"AgisFL Federation operated by {self.organization}",
            public_key=self._encode_public_key(),
            endpoint_url=endpoint_url,
            capabilities=["fedavg", "fedprox", "differential_privacy", "secure_aggregation"],
            regions=["global"],  # Can be configured
            created_at=datetime.now(),
            last_seen=datetime.now()
        )
        
        logger.info(f"IFCP: Initialized federation {self.federation_id} at {endpoint_url}")
    
    async def start_protocol(self):
        """Start the IFCP background services."""
        if self.running:
            return
        
        self.running = True
        
        # Start background tasks
        asyncio.create_task(self._heartbeat_loop())
        asyncio.create_task(self._discovery_loop())
        asyncio.create_task(self._message_processor())
        
        # Register with global discovery service
        await self._register_with_discovery_service()
        
        logger.info(f"IFCP: Started protocol services for federation {self.federation_id}")
    
    async def stop_protocol(self):
        """Stop the IFCP services."""
        self.running = False
        
        if self.session:
            await self.session.close()
        
        logger.info(f"IFCP: Stopped protocol services for federation {self.federation_id}")
    
    async def discover_federations(self, query_params: Optional[Dict[str, Any]] = None) -> List[FederationIdentity]:
        """Discover other federations through the global registry."""
        try:
            if not self.session:
                raise RuntimeError("IFCP not initialized")
            
            # Query discovery service
            params = query_params or {}
            params["requester_id"] = self.federation_id
            
            async with self.session.get(
                f"{self.discovery_registry_url}/federations/discover",
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    discovered_federations = []
                    for fed_data in data.get("federations", []):
                        federation = FederationIdentity(**fed_data)
                        self.known_federations[federation.federation_id] = federation
                        discovered_federations.append(federation)
                    
                    logger.info(f"IFCP: Discovered {len(discovered_federations)} federations")
                    return discovered_federations
                
                else:
                    logger.warning(f"IFCP: Discovery service returned {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"IFCP: Federation discovery failed: {e}")
            return []
    
    async def propose_alliance(
        self, 
        target_federation_id: str, 
        alliance_name: str,
        governance_rules: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Propose an alliance with another federation."""
        try:
            if target_federation_id not in self.known_federations:
                # Try to discover the federation first
                await self.discover_federations({"federation_id": target_federation_id})
            
            if target_federation_id not in self.known_federations:
                raise ValueError(f"Target federation {target_federation_id} not found")
            
            target_federation = self.known_federations[target_federation_id]
            
            # Generate alliance proposal
            alliance_id = f"alliance_{uuid.uuid4().hex[:12]}"
            proposal_payload = {
                "alliance_id": alliance_id,
                "alliance_name": alliance_name,
                "proposer_federation": serialize_for_json(self.identity),
                "governance_rules": governance_rules or self._default_governance_rules(),
                "proposed_at": datetime.now().isoformat()
            }
            
            # Send alliance request
            message = IFCPMessage(
                message_id=f"msg_{uuid.uuid4().hex[:16]}",
                message_type=MessageType.ALLIANCE_REQUEST,
                sender_federation_id=self.federation_id,
                recipient_federation_id=target_federation_id,
                timestamp=datetime.now(),
                payload=proposal_payload
            )
            
            success = await self._send_message(target_federation, message)
            
            if success:
                logger.info(f"IFCP: Sent alliance proposal to {target_federation_id}")
                return True
            else:
                logger.error(f"IFCP: Failed to send alliance proposal to {target_federation_id}")
                return False
                
        except Exception as e:
            logger.error(f"IFCP: Alliance proposal failed: {e}")
            return False
    
    async def accept_alliance(self, alliance_id: str, requester_federation_id: str) -> bool:
        """Accept an alliance proposal."""
        try:
            # Generate shared communication keys
            shared_key = Fernet.generate_key().decode()
            
            # Create alliance
            alliance = Alliance(
                alliance_id=alliance_id,
                alliance_name=f"Alliance {alliance_id[:8]}",
                federation_ids=[self.federation_id, requester_federation_id],
                status=AllianceStatus.ACTIVE,
                governance_rules=self._default_governance_rules(),
                shared_projects=[],
                communication_keys={
                    self.federation_id: shared_key,
                    requester_federation_id: shared_key
                },
                created_at=datetime.now(),
                last_activity=datetime.now()
            )
            
            self.active_alliances[alliance_id] = alliance
            
            # Send acceptance response
            response_payload = {
                "alliance_id": alliance_id,
                "status": "accepted",
                "alliance_details": serialize_for_json(alliance),
                "accepted_at": datetime.now().isoformat()
            }
            
            target_federation = self.known_federations[requester_federation_id]
            message = IFCPMessage(
                message_id=f"msg_{uuid.uuid4().hex[:16]}",
                message_type=MessageType.ALLIANCE_RESPONSE,
                sender_federation_id=self.federation_id,
                recipient_federation_id=requester_federation_id,
                timestamp=datetime.now(),
                payload=response_payload
            )
            
            await self._send_message(target_federation, message)
            
            logger.info(f"IFCP: Accepted alliance {alliance_id} with {requester_federation_id}")
            return True
            
        except Exception as e:
            logger.error(f"IFCP: Alliance acceptance failed: {e}")
            return False
    
    async def create_cross_federation_project(
        self,
        project_name: str,
        alliance_id: str,
        participating_federations: List[str],
        aggregation_strategy: str = "hierarchical_fedavg",
        privacy_requirements: Optional[Dict[str, Any]] = None
    ) -> CrossFederationProject:
        """Create a project spanning multiple federations."""
        try:
            if alliance_id not in self.active_alliances:
                raise ValueError(f"Alliance {alliance_id} not found or not active")
            
            alliance = self.active_alliances[alliance_id]
            
            # Validate participating federations are in the alliance
            for fed_id in participating_federations:
                if fed_id not in alliance.federation_ids:
                    raise ValueError(f"Federation {fed_id} not in alliance {alliance_id}")
            
            project_id = f"xfed_project_{uuid.uuid4().hex[:12]}"
            
            project = CrossFederationProject(
                project_id=project_id,
                project_name=project_name,
                coordinator_federation_id=self.federation_id,
                participating_federations=participating_federations,
                alliance_id=alliance_id,
                governance_model=alliance.governance_rules,
                aggregation_strategy=aggregation_strategy,
                privacy_requirements=privacy_requirements or {
                    "differential_privacy": True,
                    "secure_aggregation": True,
                    "epsilon": 1.0
                },
                created_at=datetime.now(),
                status="initializing"
            )
            
            self.cross_federation_projects[project_id] = project
            
            # Notify participating federations
            await self._broadcast_project_invitation(project)
            
            logger.info(f"IFCP: Created cross-federation project {project_id}")
            return project
            
        except Exception as e:
            logger.error(f"IFCP: Cross-federation project creation failed: {e}")
            raise
    
    async def execute_cross_federation_aggregation(
        self,
        project_id: str,
        local_model_update: Dict[str, Any],
        round_number: int
    ) -> Dict[str, Any]:
        """Execute multi-hop secure aggregation across federations."""
        try:
            if project_id not in self.cross_federation_projects:
                raise ValueError(f"Cross-federation project {project_id} not found")
            
            project = self.cross_federation_projects[project_id]
            
            # Step 1: Collect updates from participating federations
            federation_updates = {self.federation_id: local_model_update}
            
            for fed_id in project.participating_federations:
                if fed_id != self.federation_id:
                    update = await self._request_federation_update(
                        fed_id, project_id, round_number
                    )
                    if update:
                        federation_updates[fed_id] = update
            
            # Step 2: Perform hierarchical aggregation
            if project.aggregation_strategy == "hierarchical_fedavg":
                aggregated_update = await self._hierarchical_fedavg_aggregation(
                    federation_updates, project.privacy_requirements
                )
            else:
                raise ValueError(f"Unsupported aggregation strategy: {project.aggregation_strategy}")
            
            # Step 3: Distribute aggregated update to all federations
            await self._distribute_aggregated_update(project, aggregated_update, round_number)
            
            logger.info(f"IFCP: Completed cross-federation aggregation for project {project_id}, round {round_number}")
            return aggregated_update
            
        except Exception as e:
            logger.error(f"IFCP: Cross-federation aggregation failed: {e}")
            raise
    
    async def get_alliance_status(self) -> Dict[str, Any]:
        """Get status of all alliances."""
        alliance_summary = []
        
        for alliance in self.active_alliances.values():
            summary = {
                "alliance_id": alliance.alliance_id,
                "alliance_name": alliance.alliance_name,
                "status": alliance.status.value,
                "federation_count": len(alliance.federation_ids),
                "active_projects": len(alliance.shared_projects),
                "created_at": alliance.created_at.isoformat(),
                "last_activity": alliance.last_activity.isoformat()
            }
            alliance_summary.append(summary)
        
        return {
            "federation_id": self.federation_id,
            "total_alliances": len(self.active_alliances),
            "known_federations": len(self.known_federations),
            "cross_federation_projects": len(self.cross_federation_projects),
            "alliances": alliance_summary
        }
    
    # Private methods
    
    async def _register_with_discovery_service(self):
        """Register this federation with the global discovery service."""
        try:
            if not self.session:
                return
            
            registration_data = serialize_for_json(self.identity)
            
            async with self.session.post(
                f"{self.discovery_registry_url}/federations/register",
                json=registration_data
            ) as response:
                if response.status == 200:
                    logger.info(f"IFCP: Registered with discovery service")
                else:
                    logger.warning(f"IFCP: Discovery registration failed: {response.status}")
                    
        except Exception as e:
            logger.error(f"IFCP: Discovery registration error: {e}")
    
    async def _heartbeat_loop(self):
        """Send periodic heartbeats to maintain alliance connections."""
        while self.running:
            try:
                for alliance in self.active_alliances.values():
                    await self._send_alliance_heartbeat(alliance)
                
                await asyncio.sleep(self.heartbeat_interval)
                
            except Exception as e:
                logger.error(f"IFCP: Heartbeat loop error: {e}")
                await asyncio.sleep(60)
    
    async def _discovery_loop(self):
        """Periodic federation discovery updates."""
        while self.running:
            try:
                await self.discover_federations()
                await asyncio.sleep(self.discovery_interval)
                
            except Exception as e:
                logger.error(f"IFCP: Discovery loop error: {e}")
                await asyncio.sleep(300)
    
    async def _message_processor(self):
        """Process incoming IFCP messages."""
        while self.running:
            try:
                # In a real implementation, this would listen on a network port
                # For now, we simulate message processing
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"IFCP: Message processor error: {e}")
                await asyncio.sleep(60)
    
    async def _send_message(self, target_federation: FederationIdentity, message: IFCPMessage) -> bool:
        """Send an IFCP message to another federation."""
        try:
            # Sign the message
            message.signature = self._sign_message(message)
            
            # Send via HTTP
            message_data = {
                "message_id": message.message_id,
                "message_type": message.message_type.value,
                "sender_federation_id": message.sender_federation_id,
                "recipient_federation_id": message.recipient_federation_id,
                "timestamp": message.timestamp.isoformat(),
                "payload": message.payload,
                "signature": message.signature
            }
            
            async with self.session.post(
                f"{target_federation.endpoint_url}/ifcp/receive",
                json=message_data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                return response.status == 200
                
        except Exception as e:
            logger.error(f"IFCP: Failed to send message: {e}")
            return False
    
    def _sign_message(self, message: IFCPMessage) -> str:
        """Sign a message with the federation's private key."""
        message_hash = hashlib.sha256(
            f"{message.message_id}{message.timestamp.isoformat()}{json.dumps(message.payload)}".encode()
        ).digest()
        
        signature = self.private_key.sign(
            message_hash,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return base64.b64encode(signature).decode()
    
    def _encode_public_key(self) -> str:
        """Encode public key for transmission."""
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return base64.b64encode(pem).decode()
    
    def _default_governance_rules(self) -> Dict[str, Any]:
        """Default governance rules for alliances."""
        return {
            "decision_making": "consensus",
            "data_sharing_policy": "encrypted_aggregation_only",
            "privacy_requirements": {
                "differential_privacy": True,
                "minimum_epsilon": 1.0,
                "secure_aggregation": True
            },
            "resource_sharing": {
                "compute_sharing": False,
                "storage_sharing": False,
                "bandwidth_sharing": True
            },
            "project_approval": "majority_vote",
            "dispute_resolution": "arbitration"
        }
    
    async def _broadcast_project_invitation(self, project: CrossFederationProject):
        """Broadcast project invitation to participating federations."""
        invitation_payload = {
            "project_id": project.project_id,
            "project_name": project.project_name,
            "coordinator_federation": self.federation_id,
            "aggregation_strategy": project.aggregation_strategy,
            "privacy_requirements": project.privacy_requirements,
            "governance_model": project.governance_model
        }
        
        for fed_id in project.participating_federations:
            if fed_id != self.federation_id and fed_id in self.known_federations:
                target_federation = self.known_federations[fed_id]
                
                message = IFCPMessage(
                    message_id=f"msg_{uuid.uuid4().hex[:16]}",
                    message_type=MessageType.PROJECT_INVITATION,
                    sender_federation_id=self.federation_id,
                    recipient_federation_id=fed_id,
                    timestamp=datetime.now(),
                    payload=invitation_payload
                )
                
                await self._send_message(target_federation, message)
    
    async def _request_federation_update(
        self, 
        federation_id: str, 
        project_id: str, 
        round_number: int
    ) -> Optional[Dict[str, Any]]:
        """Request model update from a participating federation."""
        try:
            if federation_id not in self.known_federations:
                return None
            
            target_federation = self.known_federations[federation_id]
            
            request_payload = {
                "project_id": project_id,
                "round_number": round_number,
                "requested_by": self.federation_id,
                "request_timestamp": datetime.now().isoformat()
            }
            
            message = IFCPMessage(
                message_id=f"msg_{uuid.uuid4().hex[:16]}",
                message_type=MessageType.AGGREGATION_REQUEST,
                sender_federation_id=self.federation_id,
                recipient_federation_id=federation_id,
                timestamp=datetime.now(),
                payload=request_payload
            )
            
            # In a real implementation, this would wait for the response
            # For now, we simulate a response
            return {
                "federation_id": federation_id,
                "model_update": [0.1, 0.2, 0.3],  # Simulated model parameters
                "num_samples": 100,
                "round_number": round_number
            }
            
        except Exception as e:
            logger.error(f"IFCP: Failed to request update from {federation_id}: {e}")
            return None
    
    async def _hierarchical_fedavg_aggregation(
        self, 
        federation_updates: Dict[str, Dict[str, Any]],
        privacy_requirements: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Perform hierarchical FedAvg aggregation across federations."""
        
        # Simulate federated averaging across federations
        total_samples = sum(update.get("num_samples", 0) for update in federation_updates.values())
        
        if total_samples == 0:
            raise ValueError("No samples available for aggregation")
        
        # Weighted average of model updates
        aggregated_params = []
        param_length = len(list(federation_updates.values())[0].get("model_update", []))
        
        for i in range(param_length):
            weighted_sum = 0
            for update in federation_updates.values():
                weight = update.get("num_samples", 0) / total_samples
                param_value = update.get("model_update", [])[i] if i < len(update.get("model_update", [])) else 0
                weighted_sum += weight * param_value
            
            aggregated_params.append(weighted_sum)
        
        # Apply differential privacy if required
        if privacy_requirements.get("differential_privacy", False):
            epsilon = privacy_requirements.get("epsilon", 1.0)
            # Add noise for DP (simplified)
            import numpy as np
            noise_scale = 1.0 / epsilon
            aggregated_params = [
                param + np.random.laplace(0, noise_scale) 
                for param in aggregated_params
            ]
        
        return {
            "aggregated_parameters": aggregated_params,
            "total_federations": len(federation_updates),
            "total_samples": total_samples,
            "privacy_applied": privacy_requirements.get("differential_privacy", False),
            "aggregation_timestamp": datetime.now().isoformat()
        }
    
    async def _distribute_aggregated_update(
        self, 
        project: CrossFederationProject, 
        aggregated_update: Dict[str, Any], 
        round_number: int
    ):
        """Distribute the aggregated update to all participating federations."""
        distribution_payload = {
            "project_id": project.project_id,
            "round_number": round_number,
            "aggregated_update": aggregated_update,
            "distribution_timestamp": datetime.now().isoformat()
        }
        
        for fed_id in project.participating_federations:
            if fed_id != self.federation_id and fed_id in self.known_federations:
                target_federation = self.known_federations[fed_id]
                
                message = IFCPMessage(
                    message_id=f"msg_{uuid.uuid4().hex[:16]}",
                    message_type=MessageType.AGGREGATION_RESPONSE,
                    sender_federation_id=self.federation_id,
                    recipient_federation_id=fed_id,
                    timestamp=datetime.now(),
                    payload=distribution_payload
                )
                
                await self._send_message(target_federation, message)
    
    async def _send_alliance_heartbeat(self, alliance: Alliance):
        """Send heartbeat to maintain alliance connection."""
        heartbeat_payload = {
            "alliance_id": alliance.alliance_id,
            "sender_status": "active",
            "heartbeat_timestamp": datetime.now().isoformat(),
            "active_projects": len(alliance.shared_projects)
        }
        
        for fed_id in alliance.federation_ids:
            if fed_id != self.federation_id and fed_id in self.known_federations:
                target_federation = self.known_federations[fed_id]
                
                message = IFCPMessage(
                    message_id=f"msg_{uuid.uuid4().hex[:16]}",
                    message_type=MessageType.HEARTBEAT,
                    sender_federation_id=self.federation_id,
                    recipient_federation_id=fed_id,
                    timestamp=datetime.now(),
                    payload=heartbeat_payload
                )
                
                await self._send_message(target_federation, message)

# Global IFCP instance
ifcp_protocol = InterFederationProtocol(
    federation_id="agisfl_main",
    federation_name="AgisFL Main Federation",
    organization="AgisFL Network"
)

# Add alias for backward compatibility
IFCPProtocol = InterFederationProtocol

# Export for use in other modules
__all__ = [
    'InterFederationProtocol',
    'IFCPProtocol',  # Alias added
    'FederationIdentity',
    'Alliance',
    'CrossFederationProject',
    'IFCPMessage',
    'AllianceStatus',
    'MessageType',
    'ifcp_protocol'
]

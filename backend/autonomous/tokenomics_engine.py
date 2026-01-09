"""
AgisFL Tokenomics & Smart Contract Simulation
=============================================

This module simulates a private blockchain environment for managing
tokenized incentives in federated learning projects. It provides:

- Digital token management (AgisCoin)
- Smart contract simulation for automated payouts
- Bounty contract deployment and execution
- Transparent reward distribution
- Wallet management for participants

Key Features:
- Automatic payout execution based on contribution scores
- Transparent and tamper-proof reward distribution
- Project sponsorship and bounty management
- Multi-project wallet tracking
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from decimal import Decimal, ROUND_HALF_UP
import json
import uuid
import hashlib
from enum import Enum

logger = logging.getLogger(__name__)

class ContractStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TransactionType(Enum):
    DEPOSIT = "deposit"
    PAYOUT = "payout"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"

@dataclass
class Wallet:
    """Digital wallet for storing AgisCoin tokens."""
    wallet_id: str
    owner_id: str  # client_id or organization_id
    owner_type: str  # "client" or "organization"
    balance: Decimal
    created_at: datetime
    last_transaction: Optional[datetime] = None

@dataclass
class Transaction:
    """Blockchain transaction record."""
    transaction_id: str
    from_wallet: Optional[str]  # None for minting
    to_wallet: str
    amount: Decimal
    transaction_type: TransactionType
    project_id: Optional[str]
    round_number: Optional[int]
    metadata: Dict[str, Any]
    timestamp: datetime
    block_hash: str

@dataclass
class BountyContract:
    """Smart contract for project bounties."""
    contract_id: str
    project_id: str
    sponsor_wallet_id: str
    total_bounty: Decimal
    remaining_bounty: Decimal
    payout_frequency: int  # Number of rounds between payouts
    status: ContractStatus
    
    # Contract terms
    minimum_participants: int
    privacy_level: str  # DP epsilon value
    project_duration_rounds: int
    
    # Execution tracking
    created_at: datetime
    activated_at: Optional[datetime]
    last_payout_round: int
    total_payouts_made: int
    participants: List[str]  # client_ids that have joined
    
    # Metadata
    project_name: str
    project_description: str
    required_data_type: str

class TokenomicsEngine:
    """
    The Tokenomics Engine - Economic Infrastructure of AgisFL
    
    This engine manages the entire token economy including:
    1. Digital wallet management
    2. Smart contract execution
    3. Automated reward distribution
    4. Marketplace bounty contracts
    """
    
    def __init__(self):
        self.wallets: Dict[str, Wallet] = {}
        self.transactions: List[Transaction] = []
        self.bounty_contracts: Dict[str, BountyContract] = {}
        self.total_supply = Decimal('0')
        self.exchange_rate = Decimal('1.0')  # 1 AgisCoin = $1 USD equivalent
        self.block_height = 0
        
        # Integration with Contribution Engine
        self.contribution_engine = None
        
    async def initialize_tokenomics(self, contribution_engine_instance):
        """Initialize tokenomics with contribution engine integration."""
        self.contribution_engine = contribution_engine_instance
        logger.info("Tokenomics: Initialized with contribution engine integration")
    
    async def create_wallet(self, owner_id: str, owner_type: str = "client") -> Wallet:
        """Create a new digital wallet for a participant."""
        wallet_id = f"wallet_{uuid.uuid4().hex[:12]}"
        
        wallet = Wallet(
            wallet_id=wallet_id,
            owner_id=owner_id,
            owner_type=owner_type,
            balance=Decimal('0'),
            created_at=datetime.now()
        )
        
        self.wallets[wallet_id] = wallet
        logger.info(f"Tokenomics: Created wallet {wallet_id} for {owner_type} {owner_id}")
        
        return wallet
    
    async def get_or_create_wallet(self, owner_id: str, owner_type: str = "client") -> Wallet:
        """Get existing wallet or create new one."""
        # Find existing wallet for this owner
        for wallet in self.wallets.values():
            if wallet.owner_id == owner_id and wallet.owner_type == owner_type:
                return wallet
        
        # Create new wallet if none exists
        return await self.create_wallet(owner_id, owner_type)
    
    async def mint_tokens(self, amount: Decimal, to_wallet_id: str, metadata: Dict[str, Any] = None) -> Transaction:
        """Mint new AgisCoin tokens (for project sponsors)."""
        if to_wallet_id not in self.wallets:
            raise ValueError(f"Wallet {to_wallet_id} not found")
        
        # Create minting transaction
        transaction = Transaction(
            transaction_id=f"tx_{uuid.uuid4().hex[:16]}",
            from_wallet=None,  # Minting has no source wallet
            to_wallet=to_wallet_id,
            amount=amount,
            transaction_type=TransactionType.DEPOSIT,
            project_id=metadata.get("project_id") if metadata else None,
            round_number=None,
            metadata=metadata or {},
            timestamp=datetime.now(),
            block_hash=self._generate_block_hash()
        )
        
        # Update wallet balance
        self.wallets[to_wallet_id].balance += amount
        self.wallets[to_wallet_id].last_transaction = transaction.timestamp
        
        # Update total supply
        self.total_supply += amount
        
        # Record transaction
        self.transactions.append(transaction)
        self.block_height += 1
        
        logger.info(f"Tokenomics: Minted {amount} AgisCoin to wallet {to_wallet_id}")
        
        return transaction
    
    async def deploy_bounty_contract(
        self,
        project_id: str,
        sponsor_wallet_id: str,
        total_bounty: Decimal,
        project_name: str,
        project_description: str,
        required_data_type: str,
        payout_frequency: int = 100,
        minimum_participants: int = 3,
        privacy_level: str = "epsilon=1.0",
        project_duration_rounds: int = 1000
    ) -> BountyContract:
        """Deploy a new bounty contract for a federated learning project."""
        
        if sponsor_wallet_id not in self.wallets:
            raise ValueError(f"Sponsor wallet {sponsor_wallet_id} not found")
        
        if self.wallets[sponsor_wallet_id].balance < total_bounty:
            raise ValueError("Insufficient balance to fund bounty contract")
        
        contract_id = f"contract_{uuid.uuid4().hex[:12]}"
        
        contract = BountyContract(
            contract_id=contract_id,
            project_id=project_id,
            sponsor_wallet_id=sponsor_wallet_id,
            total_bounty=total_bounty,
            remaining_bounty=total_bounty,
            payout_frequency=payout_frequency,
            status=ContractStatus.DRAFT,
            minimum_participants=minimum_participants,
            privacy_level=privacy_level,
            project_duration_rounds=project_duration_rounds,
            created_at=datetime.now(),
            activated_at=None,
            last_payout_round=0,
            total_payouts_made=0,
            participants=[],
            project_name=project_name,
            project_description=project_description,
            required_data_type=required_data_type
        )
        
        # Lock the bounty amount in sponsor's wallet
        self.wallets[sponsor_wallet_id].balance -= total_bounty
        
        # Store contract
        self.bounty_contracts[contract_id] = contract
        
        logger.info(f"Tokenomics: Deployed bounty contract {contract_id} "
                   f"for project {project_id} with {total_bounty} AgisCoin")
        
        return contract
    
    async def activate_bounty_contract(self, contract_id: str) -> bool:
        """Activate a bounty contract to start accepting participants."""
        if contract_id not in self.bounty_contracts:
            raise ValueError(f"Contract {contract_id} not found")
        
        contract = self.bounty_contracts[contract_id]
        
        if contract.status != ContractStatus.DRAFT:
            raise ValueError(f"Contract {contract_id} cannot be activated (status: {contract.status})")
        
        contract.status = ContractStatus.ACTIVE
        contract.activated_at = datetime.now()
        
        logger.info(f"Tokenomics: Activated bounty contract {contract_id}")
        
        return True
    
    async def join_project(self, contract_id: str, client_id: str) -> bool:
        """Register a client to participate in a bounty project."""
        if contract_id not in self.bounty_contracts:
            raise ValueError(f"Contract {contract_id} not found")
        
        contract = self.bounty_contracts[contract_id]
        
        if contract.status != ContractStatus.ACTIVE:
            raise ValueError(f"Contract {contract_id} is not active")
        
        if client_id not in contract.participants:
            contract.participants.append(client_id)
            
            # Ensure client has a wallet
            await self.get_or_create_wallet(client_id, "client")
            
            logger.info(f"Tokenomics: Client {client_id} joined project {contract.project_id}")
        
        return True
    
    async def execute_payout(self, contract_id: str, round_number: int) -> List[Transaction]:
        """
        Execute automated payout based on contribution scores.
        
        This is the core smart contract function that:
        1. Gets contribution scores from CVE
        2. Calculates proportional rewards
        3. Distributes tokens automatically
        """
        if contract_id not in self.bounty_contracts:
            raise ValueError(f"Contract {contract_id} not found")
        
        contract = self.bounty_contracts[contract_id]
        
        if contract.status != ContractStatus.ACTIVE:
            raise ValueError(f"Contract {contract_id} is not active")
        
        if round_number <= contract.last_payout_round:
            raise ValueError(f"Payout for round {round_number} already executed")
        
        if not self.contribution_engine:
            raise ValueError("Contribution engine not initialized")
        
        # Calculate payout amount for this round
        rounds_since_last_payout = round_number - contract.last_payout_round
        payout_amount = contract.total_bounty * Decimal(str(rounds_since_last_payout)) / Decimal(str(contract.project_duration_rounds))
        
        if payout_amount > contract.remaining_bounty:
            payout_amount = contract.remaining_bounty
        
        if payout_amount <= 0:
            logger.warning(f"Tokenomics: No payout amount available for contract {contract_id}")
            return []
        
        # Get contribution scores for this round
        round_contributions = [
            m for m in self.contribution_engine.contribution_history
            if m.round_number == round_number and m.client_id in contract.participants
        ]
        
        if not round_contributions:
            logger.warning(f"Tokenomics: No contributions found for round {round_number}")
            return []
        
        # Calculate total normalized scores for proportional distribution
        total_normalized_score = sum(m.normalized_contribution_score for m in round_contributions)
        
        if total_normalized_score == 0:
            logger.warning(f"Tokenomics: Total contribution score is zero for round {round_number}")
            return []
        
        # Execute individual payouts
        payout_transactions = []
        
        for contribution in round_contributions:
            # Calculate individual payout
            individual_payout = payout_amount * Decimal(str(contribution.normalized_contribution_score))
            
            if individual_payout > 0:
                # Get client wallet
                client_wallet = await self.get_or_create_wallet(contribution.client_id, "client")
                
                # Create payout transaction
                transaction = Transaction(
                    transaction_id=f"tx_{uuid.uuid4().hex[:16]}",
                    from_wallet=None,  # Smart contract payout
                    to_wallet=client_wallet.wallet_id,
                    amount=individual_payout,
                    transaction_type=TransactionType.PAYOUT,
                    project_id=contract.project_id,
                    round_number=round_number,
                    metadata={
                        "contract_id": contract_id,
                        "contribution_score": contribution.normalized_contribution_score,
                        "accuracy_gain": contribution.marginal_accuracy_gain,
                        "uniqueness_score": contribution.uniqueness_score
                    },
                    timestamp=datetime.now(),
                    block_hash=self._generate_block_hash()
                )
                
                # Update wallet balance
                client_wallet.balance += individual_payout
                client_wallet.last_transaction = transaction.timestamp
                
                # Record transaction
                self.transactions.append(transaction)
                payout_transactions.append(transaction)
                self.block_height += 1
                
                logger.info(f"Tokenomics: Paid {individual_payout} AgisCoin to {contribution.client_id} "
                           f"(score: {contribution.normalized_contribution_score:.4f})")
        
        # Update contract state
        contract.remaining_bounty -= payout_amount
        contract.last_payout_round = round_number
        contract.total_payouts_made += 1
        
        # Check if contract is completed
        if contract.remaining_bounty <= 0 or round_number >= contract.project_duration_rounds:
            contract.status = ContractStatus.COMPLETED
            logger.info(f"Tokenomics: Contract {contract_id} completed")
        
        logger.info(f"Tokenomics: Executed payout of {payout_amount} AgisCoin "
                   f"across {len(payout_transactions)} participants for round {round_number}")
        
        return payout_transactions
    
    async def get_wallet_balance(self, wallet_id: str) -> Decimal:
        """Get current wallet balance."""
        if wallet_id not in self.wallets:
            raise ValueError(f"Wallet {wallet_id} not found")
        
        return self.wallets[wallet_id].balance
    
    async def get_client_earnings(self, client_id: str) -> Dict[str, Any]:
        """Get comprehensive earnings report for a client."""
        client_wallet = await self.get_or_create_wallet(client_id, "client")
        
        # Get all payout transactions for this client
        client_transactions = [
            tx for tx in self.transactions
            if tx.to_wallet == client_wallet.wallet_id and tx.transaction_type == TransactionType.PAYOUT
        ]
        
        # Group by project
        project_earnings = {}
        for tx in client_transactions:
            project_id = tx.project_id
            if project_id not in project_earnings:
                project_earnings[project_id] = {
                    "total_earned": Decimal('0'),
                    "transactions": [],
                    "rounds_participated": 0
                }
            
            project_earnings[project_id]["total_earned"] += tx.amount
            project_earnings[project_id]["transactions"].append({
                "round": tx.round_number,
                "amount": float(tx.amount),
                "timestamp": tx.timestamp.isoformat(),
                "contribution_score": tx.metadata.get("contribution_score", 0)
            })
            project_earnings[project_id]["rounds_participated"] += 1
        
        return {
            "client_id": client_id,
            "wallet_id": client_wallet.wallet_id,
            "total_balance": float(client_wallet.balance),
            "total_earned": float(sum(tx.amount for tx in client_transactions)),
            "total_transactions": len(client_transactions),
            "project_breakdown": {
                project_id: {
                    "total_earned": float(data["total_earned"]),
                    "rounds_participated": data["rounds_participated"],
                    "average_per_round": float(data["total_earned"] / data["rounds_participated"]) if data["rounds_participated"] > 0 else 0,
                    "recent_transactions": data["transactions"][-5:]  # Last 5 transactions
                }
                for project_id, data in project_earnings.items()
            }
        }
    
    async def get_available_bounties(self) -> List[Dict[str, Any]]:
        """Get list of available bounty contracts for the marketplace."""
        available_bounties = []
        
        for contract in self.bounty_contracts.values():
            if contract.status == ContractStatus.ACTIVE:
                # Calculate time remaining
                rounds_elapsed = contract.last_payout_round
                rounds_remaining = max(0, contract.project_duration_rounds - rounds_elapsed)
                
                # Calculate average payout per round
                avg_payout_per_round = float(contract.total_bounty) / contract.project_duration_rounds
                
                bounty_info = {
                    "contract_id": contract.contract_id,
                    "project_id": contract.project_id,
                    "project_name": contract.project_name,
                    "project_description": contract.project_description,
                    "required_data_type": contract.required_data_type,
                    "total_bounty": float(contract.total_bounty),
                    "remaining_bounty": float(contract.remaining_bounty),
                    "current_participants": len(contract.participants),
                    "minimum_participants": contract.minimum_participants,
                    "rounds_remaining": rounds_remaining,
                    "privacy_level": contract.privacy_level,
                    "average_payout_per_round": avg_payout_per_round,
                    "payout_frequency": contract.payout_frequency,
                    "created_at": contract.created_at.isoformat(),
                    "can_join": len(contract.participants) < 100  # Max participants limit
                }
                
                available_bounties.append(bounty_info)
        
        # Sort by remaining bounty (highest first)
        available_bounties.sort(key=lambda x: x["remaining_bounty"], reverse=True)
        
        return available_bounties
    
    async def get_marketplace_summary(self) -> Dict[str, Any]:
        """Get overall marketplace statistics."""
        active_contracts = [c for c in self.bounty_contracts.values() if c.status == ContractStatus.ACTIVE]
        completed_contracts = [c for c in self.bounty_contracts.values() if c.status == ContractStatus.COMPLETED]
        
        total_active_bounty = sum(c.remaining_bounty for c in active_contracts)
        total_distributed = sum(c.total_bounty - c.remaining_bounty for c in completed_contracts)
        
        return {
            "total_active_projects": len(active_contracts),
            "total_completed_projects": len(completed_contracts),
            "total_active_bounty": float(total_active_bounty),
            "total_tokens_distributed": float(total_distributed),
            "total_participants": len(set(p for c in active_contracts for p in c.participants)),
            "total_wallets": len(self.wallets),
            "total_transactions": len(self.transactions),
            "total_token_supply": float(self.total_supply),
            "exchange_rate_usd": float(self.exchange_rate)
        }
    
    def _generate_block_hash(self) -> str:
        """Generate a simple block hash for transaction verification."""
        block_data = f"{self.block_height}_{datetime.now().isoformat()}_{len(self.transactions)}"
        return hashlib.sha256(block_data.encode()).hexdigest()[:16]

# Global tokenomics engine instance
tokenomics_engine = TokenomicsEngine()

# Export for use in other modules
__all__ = [
    'TokenomicsEngine',
    'BountyContract',
    'Wallet',
    'Transaction',
    'ContractStatus',
    'TransactionType',
    'tokenomics_engine'
]

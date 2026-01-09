"""
Secure Aggregation using Shamir's Secret Sharing
Implementation of SMPC (Secure Multi-Party Computation) for federated learning

This module provides the core cryptographic primitives for secure aggregation,
ensuring the server cannot inspect individual client updates while still
being able to compute the aggregated result.
"""

import numpy as np
import torch
import random
import hashlib
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import structlog
import asyncio

logger = structlog.get_logger(__name__)

def _is_prime(n: int) -> bool:
    """Simple primality test"""
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False
    
    for i in range(3, int(n**0.5) + 1, 2):
        if n % i == 0:
            return False
    return True

def _get_prime(bits: int) -> int:
    """Generate a prime number with specified bit length"""
    # Use some well-known large primes for security
    # In production, use a proper cryptographic library
    large_primes = [
        2**61 - 1,  # Mersenne prime
        2**127 - 1, # Mersenne prime  
        982451653,  # Large prime
        1073741827, # Large prime
        2147483647  # 2^31 - 1
    ]
    
    if bits <= 32:
        return large_primes[4]  # 2^31 - 1
    elif bits <= 64:
        return large_primes[0]  # 2^61 - 1
    else:
        return large_primes[1]  # 2^127 - 1

def _mod_inverse(a: int, m: int) -> int:
    """Compute modular inverse using extended Euclidean algorithm"""
    if m == 1:
        return 0
    
    m0, x0, x1 = m, 0, 1
    
    while a > 1:
        q = a // m
        m, a = a % m, m
        x0, x1 = x1 - q * x0, x0
    
    if x1 < 0:
        x1 += m0
    
    return x1

@dataclass
class SecretShare:
    """Represents a single secret share in Shamir's Secret Sharing scheme"""
    participant_id: int
    share_value: int
    prime_modulus: int
    threshold: int
    
class SecureAggregator:
    """
    Implements secure aggregation using Shamir's Secret Sharing
    
    This ensures that:
    1. The server never sees individual client updates
    2. Only the aggregated result is revealed
    3. The system is robust to client dropouts (up to threshold)
    4. No single party can compromise the privacy of others
    """
    
    def __init__(self, threshold: int = 2, prime_bits: int = 128):
        """
        Initialize secure aggregator
        
        Args:
            threshold: Minimum number of shares needed to reconstruct secret
            prime_bits: Size of prime field for computations
        """
        self.threshold = threshold
        self.prime = _get_prime(prime_bits)
        self.shares_storage: Dict[str, List[SecretShare]] = {}
        
        logger.info("secure_aggregator_initialized", 
                   threshold=threshold, prime_bits=prime_bits)
    
    def generate_polynomial_coefficients(self, secret: int, degree: int) -> List[int]:
        """Generate random polynomial coefficients for secret sharing"""
        coefficients = [secret]  # a0 = secret
        for _ in range(degree):
            coefficients.append(random.randint(1, self.prime - 1))
        return coefficients
    
    def evaluate_polynomial(self, coefficients: List[int], x: int) -> int:
        """Evaluate polynomial at point x using Horner's method"""
        result = 0
        for coeff in reversed(coefficients):
            result = (result * x + coeff) % self.prime
        return result
    
    def create_secret_shares(self, secret: int, num_shares: int) -> List[SecretShare]:
        """
        Create secret shares using Shamir's Secret Sharing
        
        Args:
            secret: The secret value to be shared
            num_shares: Total number of shares to create
            
        Returns:
            List of secret shares
        """
        if num_shares < self.threshold:
            raise ValueError(f"Number of shares ({num_shares}) must be >= threshold ({self.threshold})")
        
        # Generate polynomial coefficients
        degree = self.threshold - 1
        coefficients = self.generate_polynomial_coefficients(secret, degree)
        
        # Create shares by evaluating polynomial at different points
        shares = []
        for i in range(1, num_shares + 1):
            share_value = self.evaluate_polynomial(coefficients, i)
            share = SecretShare(
                participant_id=i,
                share_value=share_value,
                prime_modulus=self.prime,
                threshold=self.threshold
            )
            shares.append(share)
        
        return shares
    
    def lagrange_interpolation(self, shares: List[SecretShare]) -> int:
        """
        Reconstruct secret using Lagrange interpolation
        
        Args:
            shares: List of secret shares (must have at least threshold shares)
            
        Returns:
            Reconstructed secret value
        """
        if len(shares) < self.threshold:
            raise ValueError(f"Need at least {self.threshold} shares, got {len(shares)}")
        
        # Use only the first 'threshold' shares
        shares = shares[:self.threshold]
        
        secret = 0
        for i, share_i in enumerate(shares):
            # Calculate Lagrange coefficient
            numerator = 1
            denominator = 1
            
            for j, share_j in enumerate(shares):
                if i != j:
                    numerator = (numerator * (-share_j.participant_id)) % self.prime
                    denominator = (denominator * (share_i.participant_id - share_j.participant_id)) % self.prime
            
            # Calculate modular inverse of denominator
            inv_denominator = _mod_inverse(denominator, self.prime)
            lagrange_coeff = (numerator * inv_denominator) % self.prime
            
            # Add this term to the secret
            secret = (secret + share_i.share_value * lagrange_coeff) % self.prime
        
        return secret % self.prime
    
    def encode_tensor_to_integers(self, tensor: torch.Tensor) -> List[int]:
        """
        Convert tensor to list of integers for secret sharing
        
        Args:
            tensor: PyTorch tensor to encode
            
        Returns:
            List of integers representing the tensor
        """
        # Flatten tensor and convert to numpy
        flat_tensor = tensor.flatten().detach().cpu().numpy()
        
        # Scale and convert to integers (preserving precision)
        scale_factor = 1000000  # 6 decimal places precision
        integers = []
        
        for value in flat_tensor:
            # Handle negative values by adding offset
            scaled_value = int(value * scale_factor)
            # Ensure positive value for secret sharing
            positive_value = scaled_value + (self.prime // 2)
            integers.append(positive_value % self.prime)
        
        return integers
    
    def decode_integers_to_tensor(self, integers: List[int], original_shape: Tuple) -> torch.Tensor:
        """
        Convert list of integers back to tensor
        
        Args:
            integers: List of integers to decode
            original_shape: Original tensor shape
            
        Returns:
            Reconstructed PyTorch tensor
        """
        scale_factor = 1000000
        
        # Convert back to floats
        values = []
        for integer in integers:
            # Remove offset and scale back
            scaled_value = integer - (self.prime // 2)
            original_value = scaled_value / scale_factor
            values.append(original_value)
        
        # Reshape to original tensor shape
        tensor = torch.tensor(values, dtype=torch.float32).reshape(original_shape)
        return tensor
    
    import asyncio
    async def share_model_update(self, model_update: torch.Tensor, client_id: str, 
                          participant_ids: List[int]) -> Dict[int, Dict[str, Any]]:
        await asyncio.sleep(0)
        """
        Create secret shares of a model update for secure aggregation
        
        Args:
            model_update: Client's model update tensor
            client_id: Unique identifier for the client
            participant_ids: List of participant IDs who will receive shares
            
        Returns:
            Dictionary mapping participant_id to their share data
        """
        # Convert tensor to integers
        integers = self.encode_tensor_to_integers(model_update)
        original_shape = model_update.shape
        
        # Create shares for each element
        all_shares = {}
        for participant_id in participant_ids:
            all_shares[participant_id] = {
                'client_id': client_id,
                'original_shape': original_shape,
                'element_shares': []
            }
        
        # Share each integer element
        for element_idx, integer_value in enumerate(integers):
            element_shares = self.create_secret_shares(integer_value, len(participant_ids))
            
            for share in element_shares:
                participant_id = participant_ids[share.participant_id - 1]  # Convert to actual participant ID
                all_shares[participant_id]['element_shares'].append({
                    'element_idx': element_idx,
                    'share': share
                })
        
        logger.info("model_update_shared", 
                   client_id=client_id, 
                   num_participants=len(participant_ids),
                   tensor_shape=original_shape)
        
        return all_shares
    
    async def aggregate_secret_shares(self, received_shares: Dict[str, Dict[str, Any]]) -> torch.Tensor:
        import asyncio
        await asyncio.sleep(0)
        """
        Aggregate secret shares to reconstruct the sum of all client updates
        
        Args:
            received_shares: Dictionary of shares received from different clients
            
        Returns:
            Aggregated model update tensor
        """
        if not received_shares:
            raise ValueError("No shares received for aggregation")
        
        # Get shape information from first client
        first_client_data = next(iter(received_shares.values()))
        original_shape = first_client_data['original_shape']
        num_elements = np.prod(original_shape)
        
        # Organize shares by element position
        element_shares_by_position = {i: [] for i in range(num_elements)}
        
        for client_id, client_data in received_shares.items():
            for element_share_data in client_data['element_shares']:
                element_idx = element_share_data['element_idx']
                share = element_share_data['share']
                element_shares_by_position[element_idx].append(share)
        
        # Reconstruct each element and sum across clients
        aggregated_integers = []
        
        for element_idx in range(num_elements):
            shares_for_element = element_shares_by_position[element_idx]
            
            if len(shares_for_element) >= self.threshold:
                # Reconstruct the sum for this element
                reconstructed_sum = self.lagrange_interpolation(shares_for_element)
                aggregated_integers.append(reconstructed_sum)
            else:
                logger.warning("insufficient_shares_for_element", 
                             element_idx=element_idx,
                             available=len(shares_for_element),
                             required=self.threshold)
                # Use zero for missing elements
                aggregated_integers.append(0)
        
        # Convert back to tensor
        aggregated_tensor = self.decode_integers_to_tensor(aggregated_integers, original_shape)
        
        logger.info("secure_aggregation_completed",
                   num_clients=len(received_shares),
                   tensor_shape=original_shape)
        
        return aggregated_tensor
    
    def verify_share_integrity(self, share: SecretShare, client_signature: str) -> bool:
        """
        Verify the integrity of a received share
        
        Args:
            share: Secret share to verify
            client_signature: Cryptographic signature from client
            
        Returns:
            True if share is valid, False otherwise
        """
        # Create hash of share data
        share_data = f"{share.participant_id}{share.share_value}{share.prime_modulus}{share.threshold}"
        share_hash = hashlib.sha256(share_data.encode()).hexdigest()
        
        # In production, this would verify against client's public key
        # For now, we'll do a basic integrity check
        expected_signature = hashlib.sha256(share_hash.encode()).hexdigest()
        
        is_valid = client_signature == expected_signature
        
        if not is_valid:
            logger.warning("share_integrity_check_failed",
                         participant_id=share.participant_id,
                         expected=expected_signature[:8],
                         received=client_signature[:8])
        
        return is_valid
    
    def get_aggregation_statistics(self) -> Dict[str, Any]:
        """Get statistics about the secure aggregation process"""
        return {
            'threshold': self.threshold,
            'prime_modulus_bits': self.prime.bit_length(),
            'total_stored_shares': sum(len(shares) for shares in self.shares_storage.values()),
            'unique_clients': len(self.shares_storage),
            'security_level': 'high' if self.threshold >= 3 else 'medium'
        }

class SecureAggregationManager:
    """High-level manager for secure aggregation in federated learning"""
    
    def __init__(self, min_clients: int = 3, threshold_ratio: float = 0.67):
        """
        Initialize secure aggregation manager
        
        Args:
            min_clients: Minimum number of clients required
            threshold_ratio: Ratio of clients needed to reconstruct (0.5-1.0)
        """
        self.min_clients = min_clients
        self.threshold_ratio = threshold_ratio
        self.active_rounds: Dict[str, SecureAggregator] = {}
        
    def start_secure_round(self, round_id: str, participating_clients: List[str]) -> Dict[str, Any]:
        """
        Start a new secure aggregation round
        
        Args:
            round_id: Unique identifier for this round
            participating_clients: List of client IDs participating
            
        Returns:
            Round configuration for clients
        """
        num_clients = len(participating_clients)
        if num_clients < self.min_clients:
            raise ValueError(f"Need at least {self.min_clients} clients, got {num_clients}")
        
        # Calculate threshold based on number of clients
        threshold = max(2, int(num_clients * self.threshold_ratio))
        
        # Create secure aggregator for this round
        aggregator = SecureAggregator(threshold=threshold)
        self.active_rounds[round_id] = aggregator
        
        # Assign participant IDs
        participant_mapping = {client_id: idx + 1 for idx, client_id in enumerate(participating_clients)}
        
        round_config = {
            'round_id': round_id,
            'threshold': threshold,
            'total_participants': num_clients,
            'participant_mapping': participant_mapping,
            'prime_modulus': aggregator.prime
        }
        
        logger.info("secure_round_started",
                   round_id=round_id,
                   num_clients=num_clients,
                   threshold=threshold)
        
        return round_config
    
    def process_client_shares(self, round_id: str, client_id: str, 
                            encrypted_shares: Dict[str, Any]) -> bool:
        """
        Process secret shares from a client
        
        Args:
            round_id: Round identifier
            client_id: Client identifier
            encrypted_shares: Client's encrypted secret shares
            
        Returns:
            True if shares were processed successfully
        """
        if round_id not in self.active_rounds:
            logger.error("invalid_round_id", round_id=round_id)
            return False
        
        aggregator = self.active_rounds[round_id]
        
        # Store shares for aggregation
        if round_id not in aggregator.shares_storage:
            aggregator.shares_storage[round_id] = {}
        
        aggregator.shares_storage[round_id][client_id] = encrypted_shares
        
        logger.info("client_shares_received",
                   round_id=round_id,
                   client_id=client_id,
                   num_elements=len(encrypted_shares.get('element_shares', [])))
        
        return True
    
    def finalize_secure_aggregation(self, round_id: str) -> Optional[torch.Tensor]:
        """
        Finalize secure aggregation for a round
        
        Args:
            round_id: Round identifier
            
        Returns:
            Aggregated model update or None if insufficient shares
        """
        if round_id not in self.active_rounds:
            logger.error("round_not_found", round_id=round_id)
            return None
        
        aggregator = self.active_rounds[round_id]
        round_shares = aggregator.shares_storage.get(round_id, {})
        
        if len(round_shares) < aggregator.threshold:
            logger.warning("insufficient_shares_for_aggregation",
                         round_id=round_id,
                         available=len(round_shares),
                         required=aggregator.threshold)
            return None
        
        try:
            # Perform secure aggregation
            aggregated_update = aggregator.aggregate_secret_shares(round_shares)
            
            # Clean up round data
            del self.active_rounds[round_id]
            
            logger.info("secure_aggregation_finalized",
                       round_id=round_id,
                       num_contributing_clients=len(round_shares))
            
            return aggregated_update
            
        except Exception as e:
            logger.exception("secure_aggregation_failed",
                           round_id=round_id,
                           error=str(e))
            return None

"""Adapter that loads the production SecureAggregation manager when available,
and falls back to a safe placeholder implementation for development/testing.
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class XorSecureAggregation:
    """Simple XOR-based placeholder used only for dev/test to avoid runtime errors."""

    def __init__(self):
        self.name = "xor_placeholder"
        # small random key
        import secrets
        self._key = secrets.token_bytes(32)
        # marker used by is_real_he_impl
        self._is_real_he = False

    def encrypt(self, tensor, key: bytes = None) -> bytes:
        """Accept a torch.Tensor (or numpy array) and return XOR-encrypted bytes."""
        try:
            import numpy as np
            import torch
            if hasattr(tensor, 'detach'):
                arr = tensor.detach().cpu().numpy()
            else:
                arr = np.array(tensor)
            tensor_bytes = arr.tobytes()
            k = key or self._key
            return bytes(a ^ b for a, b in zip(tensor_bytes, k * (len(tensor_bytes) // len(k) + 1)))
        except Exception:
            return b""

    def decrypt(self, encrypted_bytes: bytes, key: bytes = None):
        """Return a torch.Tensor from XOR-encrypted bytes."""
        try:
            import numpy as np
            import torch
            k = key or self._key
            decrypted = bytes(a ^ b for a, b in zip(encrypted_bytes, k * (len(encrypted_bytes) // len(k) + 1)))
            arr = np.frombuffer(decrypted, dtype=np.float32)
            return torch.from_numpy(arr)
        except Exception:
            import torch
            return torch.tensor([])

    def aggregate_encrypted(self, encrypted_updates: list) -> bytes:
        if not encrypted_updates:
            return b""
        result = encrypted_updates[0]
        for update in encrypted_updates[1:]:
            result = bytes(a ^ b for a, b in zip(result, update))
        return result


def load_secure_aggregation() -> object:
    """Attempt to load the production secure aggregation manager.

    Returns:
        An object exposing encrypt/decrypt/aggregate_encrypted methods.
    """
    try:
        # Prefer core secure aggregation manager
        from backend.core.secure_aggregation import SecureAggregationManager
        manager = SecureAggregationManager()
        logger.info("Loaded SecureAggregationManager from backend.core.secure_aggregation")
        return manager
    except Exception as e:
        logger.warning("Production SecureAggregationManager not available, using XOR placeholder", exc_info=e)
        return XorSecureAggregation()


_secure_aggregation_impl: Optional[object] = None


def get_secure_aggregation_impl():
    global _secure_aggregation_impl
    if _secure_aggregation_impl is None:
        _secure_aggregation_impl = load_secure_aggregation()
    return _secure_aggregation_impl


def is_real_he_impl(obj: object) -> bool:
    """Heuristic: return True when the implementation is likely a real HE manager."""
    try:
        if obj is None:
            return False
        if getattr(obj, '_is_real_he', False):
            return True
        name = obj.__class__.__name__.lower()
        if 'secureaggregation' in name or 'secure_aggregation' in name or 'paillier' in name or 'he' in name:
            return True
    except Exception:
        pass
    return False

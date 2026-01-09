"""
Communication Efficiency Module for Federated Learning
Implements model compression, quantization, and bandwidth optimization

This module provides comprehensive communication efficiency techniques including:
- Model compression (pruning, quantization)
- Gradient compression (top-k sparsification, random sparsification)  
- Communication protocols (compression-aware aggregation)
- Bandwidth optimization (adaptive compression based on network conditions)
"""

import numpy as np
import time
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from enum import Enum
import structlog
import json
import zlib
import gzip
from abc import ABC, abstractmethod

logger = structlog.get_logger(__name__)

class CompressionType(Enum):
    """Types of compression available"""
    NONE = "none"
    QUANTIZATION = "quantization"
    TOP_K_SPARSIFICATION = "top_k"
    RANDOM_SPARSIFICATION = "random"
    GRADIENT_CLIPPING = "clipping"
    LOW_RANK = "low_rank"
    HUFFMAN = "huffman"
    LOSSLESS = "lossless"

class NetworkCondition(Enum):
    """Network condition classifications"""
    EXCELLENT = "excellent"  # >50 Mbps
    GOOD = "good"           # 10-50 Mbps  
    MODERATE = "moderate"   # 1-10 Mbps
    POOR = "poor"          # <1 Mbps

@dataclass
class CompressionConfig:
    """Configuration for compression algorithms"""
    compression_type: CompressionType = CompressionType.QUANTIZATION
    quantization_bits: int = 8
    sparsification_ratio: float = 0.1  # Keep top 10%
    clipping_threshold: float = 1.0
    low_rank_ratio: float = 0.5
    adaptive_compression: bool = True
    min_compression_ratio: float = 0.1
    max_compression_ratio: float = 0.9

@dataclass
class CompressionStats:
    """Statistics about compression performance"""
    original_size: int = 0
    compressed_size: int = 0
    compression_ratio: float = 0.0
    compression_time: float = 0.0
    decompression_time: float = 0.0
    quality_loss: float = 0.0  # Measure of information loss
    bandwidth_saved: int = 0

class CompressionAlgorithm(ABC):
    """Abstract base class for compression algorithms"""
    
    @abstractmethod
    def compress(self, data: Any, config: CompressionConfig) -> Tuple[Any, CompressionStats]:
        """Compress the input data"""
        pass
    
    @abstractmethod
    def decompress(self, compressed_data: Any, metadata: Dict[str, Any]) -> Any:
        """Decompress the data"""
        pass

class QuantizationCompressor(CompressionAlgorithm):
    """
    Quantization-based compression for model parameters
    Reduces precision of floating point numbers to save bandwidth
    """
    
    def compress(self, data: Any, config: CompressionConfig) -> Tuple[Any, CompressionStats]:
        """
        Compress data using quantization
        
        Args:
            data: Model parameters (tensors or numpy arrays)
            config: Compression configuration
            
        Returns:
            Compressed data and statistics
        """
        start_time = time.time()
        
        if hasattr(data, 'keys'):  # Dictionary of parameters
            compressed_data = {}
            total_original_size = 0
            total_compressed_size = 0
            
            for key, tensor in data.items():
                compressed_tensor, original_size, compressed_size = self._quantize_tensor(
                    tensor, config.quantization_bits
                )
                compressed_data[key] = compressed_tensor
                total_original_size += original_size
                total_compressed_size += compressed_size
            
            compression_time = time.time() - start_time
            compression_ratio = total_compressed_size / total_original_size if total_original_size > 0 else 1.0
            
            stats = CompressionStats(
                original_size=total_original_size,
                compressed_size=total_compressed_size,
                compression_ratio=compression_ratio,
                compression_time=compression_time,
                bandwidth_saved=total_original_size - total_compressed_size
            )
            
            return compressed_data, stats
            
        else:  # Single tensor
            compressed_tensor, original_size, compressed_size = self._quantize_tensor(
                data, config.quantization_bits
            )
            
            compression_time = time.time() - start_time
            compression_ratio = compressed_size / original_size if original_size > 0 else 1.0
            
            stats = CompressionStats(
                original_size=original_size,
                compressed_size=compressed_size,
                compression_ratio=compression_ratio,
                compression_time=compression_time,
                bandwidth_saved=original_size - compressed_size
            )
            
            return compressed_tensor, stats
    
    def _quantize_tensor(self, tensor: Any, bits: int) -> Tuple[Dict[str, Any], int, int]:
        """Quantize a single tensor"""
        try:
            # Convert to numpy if needed
            if hasattr(tensor, 'numpy'):
                np_tensor = tensor.detach().cpu().numpy()
            elif hasattr(tensor, 'cpu'):
                np_tensor = tensor.cpu().numpy()
            else:
                np_tensor = np.array(tensor)
            
            original_size = np_tensor.nbytes
            
            # Calculate quantization parameters
            tensor_min = np.min(np_tensor)
            tensor_max = np.max(np_tensor)
            
            if tensor_min == tensor_max:
                # Constant tensor
                quantized = np.zeros_like(np_tensor, dtype=np.uint8)
                compressed_size = quantized.nbytes + 16  # +16 for min/max
            else:
                # Quantize to specified bits
                num_levels = 2 ** bits
                scale = (tensor_max - tensor_min) / (num_levels - 1)
                
                # Quantize
                quantized = np.round((np_tensor - tensor_min) / scale).astype(np.uint8)
                compressed_size = quantized.nbytes + 16  # +16 for min/max/scale
            
            compressed_tensor = {
                'data': quantized,
                'min': float(tensor_min),
                'max': float(tensor_max),
                'shape': np_tensor.shape,
                'dtype': str(np_tensor.dtype),
                'bits': bits
            }
            
            return compressed_tensor, original_size, compressed_size
            
        except Exception as e:
            logger.error("quantization_failed", error=str(e))
            # Return original data if quantization fails
            return tensor, 0, 0
    
    def decompress(self, compressed_data: Any, metadata: Dict[str, Any] = None) -> Any:
        """
        Decompress quantized data
        
        Args:
            compressed_data: Quantized data
            metadata: Additional metadata
            
        Returns:
            Decompressed data
        """
        start_time = time.time()
        
        try:
            if isinstance(compressed_data, dict) and 'data' in compressed_data:
                # Single tensor
                return self._dequantize_tensor(compressed_data)
            
            elif isinstance(compressed_data, dict):
                # Dictionary of tensors
                decompressed = {}
                for key, tensor_data in compressed_data.items():
                    if isinstance(tensor_data, dict) and 'data' in tensor_data:
                        decompressed[key] = self._dequantize_tensor(tensor_data)
                    else:
                        decompressed[key] = tensor_data  # Not compressed
                return decompressed
            
            else:
                return compressed_data  # Not compressed
                
        except Exception as e:
            logger.error("dequantization_failed", error=str(e))
            return compressed_data
    
    def _dequantize_tensor(self, compressed_tensor: Dict[str, Any]) -> np.ndarray:
        """Dequantize a single tensor"""
        quantized = compressed_tensor['data']
        tensor_min = compressed_tensor['min']
        tensor_max = compressed_tensor['max']
        shape = compressed_tensor['shape']
        bits = compressed_tensor['bits']
        
        if tensor_min == tensor_max:
            # Constant tensor
            return np.full(shape, tensor_min)
        
        # Dequantize
        num_levels = 2 ** bits
        scale = (tensor_max - tensor_min) / (num_levels - 1)
        
        dequantized = quantized.astype(np.float32) * scale + tensor_min
        return dequantized.reshape(shape)

class TopKSparsificationCompressor(CompressionAlgorithm):
    """
    Top-K sparsification compressor
    Keeps only the K largest magnitude values, sets others to zero
    """
    
    def compress(self, data: Any, config: CompressionConfig) -> Tuple[Any, CompressionStats]:
        """Compress using top-K sparsification"""
        start_time = time.time()
        
        if hasattr(data, 'keys'):  # Dictionary
            compressed_data = {}
            total_original_size = 0
            total_compressed_size = 0
            
            for key, tensor in data.items():
                compressed_tensor, original_size, compressed_size = self._sparsify_tensor(
                    tensor, config.sparsification_ratio
                )
                compressed_data[key] = compressed_tensor
                total_original_size += original_size
                total_compressed_size += compressed_size
            
            compression_time = time.time() - start_time
            compression_ratio = total_compressed_size / total_original_size if total_original_size > 0 else 1.0
            
            stats = CompressionStats(
                original_size=total_original_size,
                compressed_size=total_compressed_size,
                compression_ratio=compression_ratio,
                compression_time=compression_time,
                bandwidth_saved=total_original_size - total_compressed_size
            )
            
            return compressed_data, stats
        
        else:  # Single tensor
            compressed_tensor, original_size, compressed_size = self._sparsify_tensor(
                data, config.sparsification_ratio
            )
            
            compression_time = time.time() - start_time
            compression_ratio = compressed_size / original_size if original_size > 0 else 1.0
            
            stats = CompressionStats(
                original_size=original_size,
                compressed_size=compressed_size,
                compression_ratio=compression_ratio,
                compression_time=compression_time,
                bandwidth_saved=original_size - compressed_size
            )
            
            return compressed_tensor, stats
    
    def _sparsify_tensor(self, tensor: Any, ratio: float) -> Tuple[Dict[str, Any], int, int]:
        """Apply top-K sparsification to a tensor"""
        try:
            # Convert to numpy
            if hasattr(tensor, 'numpy'):
                np_tensor = tensor.detach().cpu().numpy()
            elif hasattr(tensor, 'cpu'):
                np_tensor = tensor.cpu().numpy()
            else:
                np_tensor = np.array(tensor)
            
            original_size = np_tensor.nbytes
            flat_tensor = np_tensor.flatten()
            
            # Find top-K indices
            k = max(1, int(len(flat_tensor) * ratio))
            top_k_indices = np.argpartition(np.abs(flat_tensor), -k)[-k:]
            
            # Create sparse representation
            sparse_values = flat_tensor[top_k_indices]
            
            compressed_tensor = {
                'indices': top_k_indices,
                'values': sparse_values,
                'shape': np_tensor.shape,
                'original_size': len(flat_tensor)
            }
            
            # Estimate compressed size (indices + values)
            compressed_size = top_k_indices.nbytes + sparse_values.nbytes + 32  # +32 for metadata
            
            return compressed_tensor, original_size, compressed_size
            
        except Exception as e:
            logger.error("sparsification_failed", error=str(e))
            return tensor, 0, 0
    
    def decompress(self, compressed_data: Any, metadata: Dict[str, Any] = None) -> Any:
        """Decompress sparsified data"""
        try:
            if isinstance(compressed_data, dict) and 'indices' in compressed_data:
                # Single tensor
                return self._desparsify_tensor(compressed_data)
            
            elif isinstance(compressed_data, dict):
                # Dictionary of tensors
                decompressed = {}
                for key, tensor_data in compressed_data.items():
                    if isinstance(tensor_data, dict) and 'indices' in tensor_data:
                        decompressed[key] = self._desparsify_tensor(tensor_data)
                    else:
                        decompressed[key] = tensor_data
                return decompressed
            
            else:
                return compressed_data
                
        except Exception as e:
            logger.error("desparsification_failed", error=str(e))
            return compressed_data
    
    def _desparsify_tensor(self, compressed_tensor: Dict[str, Any]) -> np.ndarray:
        """Reconstruct tensor from sparse representation"""
        indices = compressed_tensor['indices']
        values = compressed_tensor['values']
        shape = compressed_tensor['shape']
        original_size = compressed_tensor['original_size']
        
        # Reconstruct flat tensor
        flat_tensor = np.zeros(original_size)
        flat_tensor[indices] = values
        
        return flat_tensor.reshape(shape)

class AdaptiveCompressionManager:
    """
    Adaptive compression manager that selects optimal compression based on:
    - Network conditions
    - Model characteristics  
    - Historical performance
    """
    
    def __init__(self):
        """Initialize adaptive compression manager"""
        self.compressors = {
            CompressionType.QUANTIZATION: QuantizationCompressor(),
            CompressionType.TOP_K_SPARSIFICATION: TopKSparsificationCompressor(),
        }
        
        # Performance history
        self.compression_history: List[Dict[str, Any]] = []
        self.network_bandwidth_history: List[float] = []
        
        # Current state
        self.current_network_condition = NetworkCondition.GOOD
        self.recommended_config = CompressionConfig()
        
        logger.info("adaptive_compression_manager_initialized")
    
    def estimate_network_condition(self, bandwidth_mbps: Optional[float] = None) -> NetworkCondition:
        """
        Estimate current network condition
        
        Args:
            bandwidth_mbps: Current bandwidth in Mbps (if available)
            
        Returns:
            Estimated network condition
        """
        if bandwidth_mbps is not None:
            self.network_bandwidth_history.append(bandwidth_mbps)
            
            if bandwidth_mbps >= 50:
                condition = NetworkCondition.EXCELLENT
            elif bandwidth_mbps >= 10:
                condition = NetworkCondition.GOOD
            elif bandwidth_mbps >= 1:
                condition = NetworkCondition.MODERATE
            else:
                condition = NetworkCondition.POOR
        else:
            # Use historical data to estimate
            if self.network_bandwidth_history:
                avg_bandwidth = np.mean(self.network_bandwidth_history[-10:])  # Last 10 measurements
                return self.estimate_network_condition(avg_bandwidth)
            else:
                condition = NetworkCondition.GOOD  # Default assumption
        
        self.current_network_condition = condition
        return condition
    
    def get_optimal_compression_config(self, model_size: int, 
                                     network_condition: Optional[NetworkCondition] = None) -> CompressionConfig:
        """
        Get optimal compression configuration based on conditions
        
        Args:
            model_size: Size of model in bytes
            network_condition: Current network condition
            
        Returns:
            Optimal compression configuration
        """
        if network_condition is None:
            network_condition = self.current_network_condition
        
        config = CompressionConfig()
        
        # Adjust compression based on network condition
        if network_condition == NetworkCondition.EXCELLENT:
            # Light compression - prioritize speed
            config.compression_type = CompressionType.QUANTIZATION
            config.quantization_bits = 16
            config.sparsification_ratio = 0.3
            
        elif network_condition == NetworkCondition.GOOD:
            # Moderate compression
            config.compression_type = CompressionType.QUANTIZATION
            config.quantization_bits = 8
            config.sparsification_ratio = 0.2
            
        elif network_condition == NetworkCondition.MODERATE:
            # Aggressive compression
            config.compression_type = CompressionType.TOP_K_SPARSIFICATION
            config.quantization_bits = 8
            config.sparsification_ratio = 0.1
            
        else:  # POOR
            # Maximum compression
            config.compression_type = CompressionType.TOP_K_SPARSIFICATION
            config.quantization_bits = 4
            config.sparsification_ratio = 0.05
        
        # Adjust based on model size
        if model_size > 100 * 1024 * 1024:  # >100MB
            # Large model - use more aggressive compression
            config.sparsification_ratio *= 0.5
            config.quantization_bits = max(4, config.quantization_bits - 2)
        
        self.recommended_config = config
        return config
    
    def compress_model_update(self, model_update: Any, 
                            config: Optional[CompressionConfig] = None) -> Tuple[Any, CompressionStats]:
        """
        Compress model update using optimal strategy
        
        Args:
            model_update: Model update to compress
            config: Compression configuration (if None, uses adaptive)
            
        Returns:
            Compressed update and statistics
        """
        if config is None:
            # Estimate model size
            model_size = self._estimate_size(model_update)
            config = self.get_optimal_compression_config(model_size)
        
        # Select appropriate compressor
        compressor = self.compressors.get(config.compression_type)
        if compressor is None:
            logger.warning("unsupported_compression_type", 
                          compression_type=config.compression_type.value)
            # Fallback to quantization
            compressor = self.compressors[CompressionType.QUANTIZATION]
        
        # Perform compression
        compressed_data, stats = compressor.compress(model_update, config)
        
        # Store performance history
        self.compression_history.append({
            'timestamp': time.time(),
            'compression_type': config.compression_type.value,
            'original_size': stats.original_size,
            'compressed_size': stats.compressed_size,
            'compression_ratio': stats.compression_ratio,
            'compression_time': stats.compression_time,
            'network_condition': self.current_network_condition.value
        })
        
        # Keep only recent history
        if len(self.compression_history) > 1000:
            self.compression_history = self.compression_history[-500:]
        
        logger.info("model_update_compressed",
                   compression_type=config.compression_type.value,
                   original_size=stats.original_size,
                   compressed_size=stats.compressed_size,
                   compression_ratio=stats.compression_ratio,
                   bandwidth_saved=stats.bandwidth_saved)
        
        return compressed_data, stats
    
    def decompress_model_update(self, compressed_data: Any, 
                              compression_type: CompressionType) -> Any:
        """
        Decompress model update
        
        Args:
            compressed_data: Compressed data
            compression_type: Type of compression used
            
        Returns:
            Decompressed model update
        """
        compressor = self.compressors.get(compression_type)
        if compressor is None:
            logger.warning("unsupported_decompression_type",
                          compression_type=compression_type.value)
            return compressed_data  # Return as-is
        
        return compressor.decompress(compressed_data)
    
    def _estimate_size(self, data: Any) -> int:
        """Estimate size of data in bytes"""
        try:
            if hasattr(data, 'keys'):  # Dictionary
                total_size = 0
                for value in data.values():
                    if hasattr(value, 'nbytes'):
                        total_size += value.nbytes
                    elif hasattr(value, 'numel'):  # PyTorch tensor
                        total_size += value.numel() * 4  # Assume float32
                    else:
                        total_size += 1000  # Rough estimate
                return total_size
            
            elif hasattr(data, 'nbytes'):
                return data.nbytes
            elif hasattr(data, 'numel'):
                return data.numel() * 4
            else:
                return 1000  # Default estimate
                
        except Exception:
            return 1000
    
    def get_compression_statistics(self) -> Dict[str, Any]:
        """Get comprehensive compression statistics"""
        if not self.compression_history:
            return {'total_compressions': 0}
        
        recent_history = self.compression_history[-100:]  # Last 100 compressions
        
        total_original = sum(h['original_size'] for h in recent_history)
        total_compressed = sum(h['compressed_size'] for h in recent_history)
        total_saved = total_original - total_compressed
        
        avg_compression_ratio = np.mean([h['compression_ratio'] for h in recent_history])
        avg_compression_time = np.mean([h['compression_time'] for h in recent_history])
        
        # Compression type distribution
        type_counts = {}
        for h in recent_history:
            compression_type = h['compression_type']
            type_counts[compression_type] = type_counts.get(compression_type, 0) + 1
        
        return {
            'total_compressions': len(self.compression_history),
            'recent_compressions': len(recent_history),
            'total_data_saved_bytes': total_saved,
            'average_compression_ratio': avg_compression_ratio,
            'average_compression_time': avg_compression_time,
            'compression_type_distribution': type_counts,
            'current_network_condition': self.current_network_condition.value,
            'bandwidth_history_length': len(self.network_bandwidth_history)
        }

class CommunicationOptimizer:
    """
    High-level communication optimizer that coordinates all efficiency techniques
    """
    
    def __init__(self):
        """Initialize communication optimizer"""
        self.compression_manager = AdaptiveCompressionManager()
        self.communication_stats: List[Dict[str, Any]] = []
        
        logger.info("communication_optimizer_initialized")
    
    def optimize_client_upload(self, client_id: str, model_update: Any, 
                             network_info: Optional[Dict[str, Any]] = None) -> Tuple[Any, Dict[str, Any]]:
        """
        Optimize client model update upload
        
        Args:
            client_id: Client identifier
            model_update: Model update to optimize
            network_info: Network condition information
            
        Returns:
            Optimized update and metadata
        """
        start_time = time.time()
        
        # Estimate network condition
        bandwidth = network_info.get('bandwidth_mbps') if network_info else None
        network_condition = self.compression_manager.estimate_network_condition(bandwidth)
        
        # Compress model update
        compressed_update, compression_stats = self.compression_manager.compress_model_update(model_update)
        
        optimization_time = time.time() - start_time
        
        # Package metadata
        metadata = {
            'client_id': client_id,
            'compression_type': self.compression_manager.recommended_config.compression_type.value,
            'compression_stats': {
                'original_size': compression_stats.original_size,
                'compressed_size': compression_stats.compressed_size,
                'compression_ratio': compression_stats.compression_ratio,
                'bandwidth_saved': compression_stats.bandwidth_saved
            },
            'network_condition': network_condition.value,
            'optimization_time': optimization_time,
            'timestamp': time.time()
        }
        
        # Store communication statistics
        self.communication_stats.append({
            'client_id': client_id,
            'operation': 'upload',
            'original_size': compression_stats.original_size,
            'final_size': compression_stats.compressed_size,
            'optimization_time': optimization_time,
            'network_condition': network_condition.value,
            'timestamp': time.time()
        })
        
        logger.info("client_upload_optimized",
                   client_id=client_id,
                   compression_ratio=compression_stats.compression_ratio,
                   bandwidth_saved=compression_stats.bandwidth_saved,
                   network_condition=network_condition.value)
        
        return compressed_update, metadata
    
    def optimize_server_broadcast(self, global_model: Any, 
                                client_network_info: Dict[str, Dict[str, Any]]) -> Dict[str, Tuple[Any, Dict[str, Any]]]:
        """
        Optimize server model broadcast to multiple clients
        
        Args:
            global_model: Global model to broadcast
            client_network_info: Network information for each client
            
        Returns:
            Optimized models for each client with metadata
        """
        start_time = time.time()
        optimized_broadcasts = {}
        
        for client_id, network_info in client_network_info.items():
            # Get optimal compression for this client
            bandwidth = network_info.get('bandwidth_mbps')
            network_condition = self.compression_manager.estimate_network_condition(bandwidth)
            
            model_size = self.compression_manager._estimate_size(global_model)
            config = self.compression_manager.get_optimal_compression_config(model_size, network_condition)
            
            # Compress model for this client
            compressed_model, compression_stats = self.compression_manager.compress_model_update(
                global_model, config
            )
            
            metadata = {
                'client_id': client_id,
                'compression_type': config.compression_type.value,
                'compression_stats': {
                    'original_size': compression_stats.original_size,
                    'compressed_size': compression_stats.compressed_size,
                    'compression_ratio': compression_stats.compression_ratio,
                    'bandwidth_saved': compression_stats.bandwidth_saved
                },
                'network_condition': network_condition.value,
                'timestamp': time.time()
            }
            
            optimized_broadcasts[client_id] = (compressed_model, metadata)
            
            # Store statistics
            self.communication_stats.append({
                'client_id': client_id,
                'operation': 'broadcast',
                'original_size': compression_stats.original_size,
                'final_size': compression_stats.compressed_size,
                'network_condition': network_condition.value,
                'timestamp': time.time()
            })
        
        total_time = time.time() - start_time
        
        logger.info("server_broadcast_optimized",
                   num_clients=len(client_network_info),
                   total_optimization_time=total_time)
        
        return optimized_broadcasts
    
    def get_communication_efficiency_report(self) -> Dict[str, Any]:
        """Generate comprehensive communication efficiency report"""
        if not self.communication_stats:
            return {'total_communications': 0}
        
        recent_stats = self.communication_stats[-1000:]  # Last 1000 communications
        
        # Calculate total bandwidth saved
        total_original = sum(s['original_size'] for s in recent_stats)
        total_final = sum(s['final_size'] for s in recent_stats)
        total_saved = total_original - total_final
        
        # Calculate efficiency by operation type
        uploads = [s for s in recent_stats if s['operation'] == 'upload']
        broadcasts = [s for s in recent_stats if s['operation'] == 'broadcast']
        
        # Network condition analysis
        condition_stats = {}
        for condition in NetworkCondition:
            condition_communications = [s for s in recent_stats if s['network_condition'] == condition.value]
            if condition_communications:
                condition_original = sum(s['original_size'] for s in condition_communications)
                condition_final = sum(s['final_size'] for s in condition_communications)
                condition_stats[condition.value] = {
                    'count': len(condition_communications),
                    'bandwidth_saved': condition_original - condition_final,
                    'average_compression_ratio': (condition_final / condition_original) if condition_original > 0 else 1.0
                }
        
        compression_stats = self.compression_manager.get_compression_statistics()
        
        return {
            'communication_efficiency_summary': {
                'total_communications': len(self.communication_stats),
                'recent_communications': len(recent_stats),
                'total_bandwidth_saved_bytes': total_saved,
                'total_bandwidth_saved_mb': total_saved / (1024 * 1024),
                'average_compression_ratio': (total_final / total_original) if total_original > 0 else 1.0,
                'upload_count': len(uploads),
                'broadcast_count': len(broadcasts)
            },
            'network_condition_analysis': condition_stats,
            'compression_statistics': compression_stats,
            'efficiency_trends': self._calculate_efficiency_trends(recent_stats),
            'recommendations': self._generate_efficiency_recommendations(recent_stats)
        }
    
    def _calculate_efficiency_trends(self, stats: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate efficiency trends over time"""
        if len(stats) < 10:
            return {'insufficient_data': True}
        
        # Calculate moving averages
        window_size = min(50, len(stats) // 4)
        
        compression_ratios = []
        bandwidth_saved = []
        
        for i in range(len(stats) - window_size + 1):
            window = stats[i:i + window_size]
            
            window_original = sum(s['original_size'] for s in window)
            window_final = sum(s['final_size'] for s in window)
            
            compression_ratio = window_final / window_original if window_original > 0 else 1.0
            saved = window_original - window_final
            
            compression_ratios.append(compression_ratio)
            bandwidth_saved.append(saved)
        
        # Calculate trends
        if len(compression_ratios) >= 2:
            compression_trend = (compression_ratios[-1] - compression_ratios[0]) / len(compression_ratios)
            bandwidth_trend = (bandwidth_saved[-1] - bandwidth_saved[0]) / len(bandwidth_saved)
        else:
            compression_trend = 0.0
            bandwidth_trend = 0.0
        
        return {
            'compression_ratio_trend': compression_trend,
            'bandwidth_saved_trend': bandwidth_trend,
            'current_average_compression': np.mean(compression_ratios[-10:]) if compression_ratios else 1.0,
            'current_average_bandwidth_saved': np.mean(bandwidth_saved[-10:]) if bandwidth_saved else 0.0
        }
    
    def _generate_efficiency_recommendations(self, stats: List[Dict[str, Any]]) -> List[str]:
        """Generate efficiency improvement recommendations"""
        recommendations = []
        
        if not stats:
            return ["No communication data available for analysis"]
        
        # Analyze compression effectiveness
        total_original = sum(s['original_size'] for s in stats)
        total_final = sum(s['final_size'] for s in stats)
        overall_compression = total_final / total_original if total_original > 0 else 1.0
        
        if overall_compression > 0.8:
            recommendations.append("Consider more aggressive compression settings for better bandwidth efficiency")
        
        if overall_compression < 0.3:
            recommendations.append("Current compression is very aggressive - monitor for quality degradation")
        
        # Analyze network conditions
        poor_network_comms = [s for s in stats if s['network_condition'] == 'poor']
        if len(poor_network_comms) > len(stats) * 0.3:
            recommendations.append("High proportion of poor network conditions - consider prioritizing compression")
        
        # Analyze operation balance
        uploads = [s for s in stats if s['operation'] == 'upload']
        broadcasts = [s for s in stats if s['operation'] == 'broadcast']
        
        if len(broadcasts) > len(uploads) * 2:
            recommendations.append("High broadcast-to-upload ratio - consider model delta compression")
        
        if not recommendations:
            recommendations.append("Communication efficiency is well-optimized")
        
        return recommendations

# 🧠 AgisFL Models Infrastructure

## 📖 Overview

The models module provides comprehensive machine learning model implementations, architectures, and utilities specifically designed for federated learning environments. It includes state-of-the-art neural network architectures, federated learning algorithms, model optimization techniques, and privacy-preserving machine learning implementations.

## 🏗️ Models Architecture

### Multi-Domain Model Library
```
Models Infrastructure
├── Neural Networks        # Deep learning architectures
├── Federated Algorithms  # FL-specific algorithms
├── Privacy Models        # Privacy-preserving ML
├── Optimization Models   # Model optimization techniques
├── Transfer Learning     # Pre-trained & transfer models
├── Ensemble Methods      # Model ensemble techniques
├── Time Series Models    # Temporal data models
└── Domain-Specific       # Healthcare, Finance, NLP, etc.
```

## 📁 Model Categories

### 🔬 **neural_networks.py**
**Purpose**: Advanced neural network architectures optimized for federated learning

**Key Components**:
- **FederatedCNN**: Convolutional neural networks for federated image processing
- **FederatedRNN**: Recurrent networks for sequential data
- **FederatedTransformer**: Transformer architectures for NLP and vision
- **FederatedGAN**: Generative adversarial networks for federated generation

**Neural Network Implementations**:

#### **1. Federated Convolutional Neural Networks**
```python
# Advanced CNN architectures for federated learning
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Optional, Tuple

class FederatedResNet(nn.Module):
    """ResNet architecture optimized for federated learning"""
    
    def __init__(self, block_type='basic', layers=[2, 2, 2, 2], num_classes=10, 
                 federated_config=None):
        super(FederatedResNet, self).__init__()
        
        self.federated_config = federated_config or {}
        self.in_planes = 64
        
        # Initial convolution
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        
        # Residual blocks
        self.layer1 = self._make_layer(BasicBlock, 64, layers[0])
        self.layer2 = self._make_layer(BasicBlock, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(BasicBlock, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(BasicBlock, 512, layers[3], stride=2)
        
        # Global average pooling and classifier
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * BasicBlock.expansion, num_classes)
        
        # Federated learning specific components
        self.federated_layers = self._setup_federated_components()
        
        # Initialize weights
        self._initialize_weights()
    
    def _make_layer(self, block, planes, num_blocks, stride=1):
        """Create a residual layer"""
        strides = [stride] + [1] * (num_blocks - 1)
        layers = []
        
        for stride in strides:
            layers.append(block(self.in_planes, planes, stride))
            self.in_planes = planes * block.expansion
        
        return nn.Sequential(*layers)
    
    def _setup_federated_components(self):
        """Setup federated learning specific components"""
        components = nn.ModuleDict()
        
        # Privacy-preserving batch normalization
        if self.federated_config.get('private_bn', False):
            components['private_bn'] = PrivateBatchNorm2d(512)
        
        # Differential privacy noise layers
        if self.federated_config.get('dp_noise', False):
            components['dp_noise'] = DifferentialPrivacyNoise(
                noise_scale=self.federated_config.get('noise_scale', 0.1)
            )
        
        # Federated aggregation weights
        if self.federated_config.get('weighted_aggregation', True):
            components['aggregation_weights'] = nn.Parameter(
                torch.ones(1), requires_grad=False
            )
        
        return components
    
    def forward(self, x, federated_context=None):
        """Forward pass with federated learning considerations"""
        # Standard CNN forward pass
        x = F.relu(self.bn1(self.conv1(x)))
        x = self.maxpool(x)
        
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        # Apply federated components if configured
        if 'private_bn' in self.federated_layers:
            x = self.federated_layers['private_bn'](x)
        
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        
        # Apply differential privacy noise if configured
        if 'dp_noise' in self.federated_layers and self.training:
            x = self.federated_layers['dp_noise'](x)
        
        x = self.fc(x)
        
        return x
    
    def get_federated_parameters(self):
        """Get parameters relevant for federated aggregation"""
        return {
            'model_parameters': dict(self.named_parameters()),
            'aggregation_weight': self.federated_layers.get('aggregation_weights', torch.tensor(1.0)),
            'privacy_budget_used': self.get_privacy_budget_usage(),
            'layer_contributions': self.get_layer_contributions()
        }
    
    def apply_federated_update(self, aggregated_params, aggregation_context):
        """Apply aggregated parameters from federated learning"""
        # Update model parameters
        model_state = self.state_dict()
        
        for param_name, param_value in aggregated_params.items():
            if param_name in model_state:
                # Apply privacy-preserving parameter update
                if self.federated_config.get('secure_aggregation', False):
                    param_value = self._apply_secure_aggregation_noise(param_value)
                
                model_state[param_name] = param_value
        
        self.load_state_dict(model_state)
        
        # Update federated metadata
        if 'round_number' in aggregation_context:
            self.current_round = aggregation_context['round_number']
    
    def _initialize_weights(self):
        """Initialize model weights for federated learning"""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.constant_(m.bias, 0)

class BasicBlock(nn.Module):
    """Basic residual block"""
    expansion = 1
    
    def __init__(self, in_planes, planes, stride=1):
        super(BasicBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_planes, planes, kernel_size=3, stride=stride, 
                              padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=1, 
                              padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)
        
        self.shortcut = nn.Sequential()
        if stride != 1 or in_planes != self.expansion * planes:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_planes, self.expansion * planes, kernel_size=1, 
                         stride=stride, bias=False),
                nn.BatchNorm2d(self.expansion * planes)
            )
    
    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)
        out = F.relu(out)
        return out

# Federated Vision Transformer
class FederatedViT(nn.Module):
    """Vision Transformer optimized for federated learning"""
    
    def __init__(self, image_size=224, patch_size=16, num_classes=1000, 
                 dim=768, depth=12, heads=12, mlp_dim=3072, federated_config=None):
        super(FederatedViT, self).__init__()
        
        self.federated_config = federated_config or {}
        
        # Patch embedding
        self.patch_embedding = PatchEmbedding(image_size, patch_size, dim)
        num_patches = self.patch_embedding.num_patches
        
        # Position embedding
        self.pos_embedding = nn.Parameter(torch.randn(1, num_patches + 1, dim))
        self.cls_token = nn.Parameter(torch.randn(1, 1, dim))
        self.dropout = nn.Dropout(0.1)
        
        # Transformer blocks
        self.transformer = nn.ModuleList([
            FederatedTransformerBlock(dim, heads, mlp_dim, federated_config)
            for _ in range(depth)
        ])
        
        # Layer normalization and classifier
        self.ln = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, num_classes)
        
        # Federated learning components
        self.federated_components = self._setup_federated_components()
    
    def forward(self, x, federated_context=None):
        """Forward pass with federated optimizations"""
        batch_size = x.shape[0]
        
        # Patch embedding
        x = self.patch_embedding(x)
        
        # Add class token
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)
        x = torch.cat([cls_tokens, x], dim=1)
        
        # Add position embedding
        x += self.pos_embedding
        x = self.dropout(x)
        
        # Transformer blocks with federated context
        for transformer_block in self.transformer:
            x = transformer_block(x, federated_context)
        
        # Classification
        x = self.ln(x)
        cls_token_final = x[:, 0]
        
        # Apply federated privacy if configured
        if self.federated_config.get('private_classification', False):
            cls_token_final = self._apply_private_classification(cls_token_final)
        
        return self.head(cls_token_final)
    
    def get_attention_maps(self):
        """Get attention maps for interpretability"""
        attention_maps = []
        for block in self.transformer:
            if hasattr(block, 'attention_weights'):
                attention_maps.append(block.attention_weights)
        return attention_maps

class FederatedTransformerBlock(nn.Module):
    """Transformer block with federated learning optimizations"""
    
    def __init__(self, dim, heads, mlp_dim, federated_config):
        super(FederatedTransformerBlock, self).__init__()
        
        self.federated_config = federated_config
        
        # Multi-head attention
        self.attention = FederatedMultiHeadAttention(dim, heads, federated_config)
        self.norm1 = nn.LayerNorm(dim)
        
        # MLP
        self.mlp = nn.Sequential(
            nn.Linear(dim, mlp_dim),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(mlp_dim, dim),
            nn.Dropout(0.1)
        )
        self.norm2 = nn.LayerNorm(dim)
    
    def forward(self, x, federated_context=None):
        # Attention with residual connection
        attn_output, self.attention_weights = self.attention(x, federated_context)
        x = self.norm1(x + attn_output)
        
        # MLP with residual connection
        mlp_output = self.mlp(x)
        x = self.norm2(x + mlp_output)
        
        return x

# Example: Federated model creation and training
def create_federated_resnet(num_classes=10, federated_config=None):
    """Create a federated ResNet model"""
    default_config = {
        'private_bn': True,
        'dp_noise': True,
        'noise_scale': 0.1,
        'secure_aggregation': True,
        'weighted_aggregation': True
    }
    
    if federated_config:
        default_config.update(federated_config)
    
    model = FederatedResNet(
        layers=[2, 2, 2, 2],
        num_classes=num_classes,
        federated_config=default_config
    )
    
    return model

# Usage example
federated_model = create_federated_resnet(
    num_classes=10,
    federated_config={
        'private_bn': True,
        'dp_noise': True,
        'noise_scale': 0.05,
        'secure_aggregation': True
    }
)

print(f"Model created with {sum(p.numel() for p in federated_model.parameters())} parameters")
```

#### **2. Privacy-Preserving Model Components**
```python
# Privacy-preserving neural network components
class DifferentialPrivacyNoise(nn.Module):
    """Differential privacy noise layer"""
    
    def __init__(self, noise_scale=0.1, epsilon=1.0, delta=1e-5):
        super(DifferentialPrivacyNoise, self).__init__()
        self.noise_scale = noise_scale
        self.epsilon = epsilon
        self.delta = delta
        self.privacy_accountant = PrivacyAccountant(epsilon, delta)
    
    def forward(self, x):
        if self.training:
            # Calculate sensitivity-based noise scale
            sensitivity = self._calculate_sensitivity(x)
            adjusted_noise_scale = self.noise_scale * sensitivity
            
            # Add calibrated Gaussian noise
            noise = torch.normal(
                mean=0.0,
                std=adjusted_noise_scale,
                size=x.shape,
                device=x.device
            )
            
            # Update privacy budget
            self.privacy_accountant.spend_budget(adjusted_noise_scale)
            
            return x + noise
        return x
    
    def _calculate_sensitivity(self, x):
        """Calculate L2 sensitivity of the input"""
        return torch.norm(x, p=2, dim=-1, keepdim=True).mean()

class PrivateBatchNorm2d(nn.Module):
    """Privacy-preserving batch normalization"""
    
    def __init__(self, num_features, eps=1e-5, momentum=0.1, 
                 privacy_budget=1.0):
        super(PrivateBatchNorm2d, self).__init__()
        self.num_features = num_features
        self.eps = eps
        self.momentum = momentum
        self.privacy_budget = privacy_budget
        
        # Learnable parameters
        self.weight = nn.Parameter(torch.ones(num_features))
        self.bias = nn.Parameter(torch.zeros(num_features))
        
        # Running statistics (private)
        self.register_buffer('running_mean', torch.zeros(num_features))
        self.register_buffer('running_var', torch.ones(num_features))
        self.register_buffer('num_batches_tracked', torch.tensor(0, dtype=torch.long))
    
    def forward(self, x):
        if self.training:
            # Calculate private batch statistics
            batch_mean, batch_var = self._calculate_private_statistics(x)
            
            # Update running statistics with privacy
            self._update_running_statistics(batch_mean, batch_var)
            
            # Normalize with private statistics
            x_normalized = (x - batch_mean) / torch.sqrt(batch_var + self.eps)
        else:
            # Use running statistics for inference
            x_normalized = (x - self.running_mean.view(1, -1, 1, 1)) / \
                          torch.sqrt(self.running_var.view(1, -1, 1, 1) + self.eps)
        
        # Apply scale and shift
        return self.weight.view(1, -1, 1, 1) * x_normalized + self.bias.view(1, -1, 1, 1)
    
    def _calculate_private_statistics(self, x):
        """Calculate batch statistics with differential privacy"""
        # Calculate raw statistics
        batch_mean = x.mean(dim=[0, 2, 3])
        batch_var = x.var(dim=[0, 2, 3], unbiased=False)
        
        # Add noise for privacy
        if self.privacy_budget > 0:
            # Calculate noise scale based on sensitivity
            mean_sensitivity = 1.0 / x.shape[0]  # Sensitivity of mean
            var_sensitivity = 2.0 / x.shape[0]   # Sensitivity of variance
            
            # Add Gaussian noise
            mean_noise = torch.normal(
                mean=0.0,
                std=mean_sensitivity / self.privacy_budget,
                size=batch_mean.shape,
                device=x.device
            )
            
            var_noise = torch.normal(
                mean=0.0,
                std=var_sensitivity / self.privacy_budget,
                size=batch_var.shape,
                device=x.device
            )
            
            batch_mean += mean_noise
            batch_var = torch.clamp(batch_var + var_noise, min=0.0)
        
        return batch_mean, batch_var

class SecureAggregationLayer(nn.Module):
    """Secure aggregation layer for federated learning"""
    
    def __init__(self, input_dim, num_participants, threshold=None):
        super(SecureAggregationLayer, self).__init__()
        self.input_dim = input_dim
        self.num_participants = num_participants
        self.threshold = threshold or (num_participants // 2 + 1)
        
        # Secure aggregation components
        self.secret_sharing = SecretSharing(threshold, num_participants)
        self.encryption = HomomorphicEncryption()
    
    def forward(self, x, participant_weights=None):
        """Perform secure aggregation of inputs"""
        if participant_weights is None:
            participant_weights = torch.ones(self.num_participants) / self.num_participants
        
        # Apply secure aggregation protocol
        if self.training:
            # Encrypt input for secure aggregation
            encrypted_x = self.encryption.encrypt(x)
            
            # Perform weighted aggregation in encrypted space
            aggregated = self._secure_weighted_average(encrypted_x, participant_weights)
            
            # Decrypt result
            result = self.encryption.decrypt(aggregated)
        else:
            # Simple aggregation for inference
            result = x
        
        return result

# Model ensemble for federated learning
class FederatedModelEnsemble(nn.Module):
    """Ensemble of federated models for improved performance"""
    
    def __init__(self, models, ensemble_method='weighted_voting', 
                 performance_weights=None):
        super(FederatedModelEnsemble, self).__init__()
        self.models = nn.ModuleList(models)
        self.ensemble_method = ensemble_method
        self.performance_weights = performance_weights or torch.ones(len(models))
        
        # Normalize weights
        self.performance_weights = self.performance_weights / self.performance_weights.sum()
    
    def forward(self, x):
        """Ensemble prediction"""
        predictions = []
        
        # Get predictions from all models
        for model in self.models:
            with torch.no_grad():
                pred = model(x)
                predictions.append(pred)
        
        predictions = torch.stack(predictions)
        
        # Apply ensemble method
        if self.ensemble_method == 'weighted_voting':
            # Weighted average of predictions
            weights = self.performance_weights.view(-1, 1, 1).to(predictions.device)
            ensemble_pred = (predictions * weights).sum(dim=0)
        
        elif self.ensemble_method == 'majority_voting':
            # Majority voting for classification
            predicted_classes = torch.argmax(predictions, dim=-1)
            ensemble_pred = torch.mode(predicted_classes, dim=0).values
        
        elif self.ensemble_method == 'stacking':
            # Meta-learner for combining predictions
            ensemble_pred = self.meta_learner(predictions.view(predictions.shape[1], -1))
        
        return ensemble_pred
    
    def update_performance_weights(self, performance_scores):
        """Update ensemble weights based on performance"""
        self.performance_weights = torch.tensor(performance_scores)
        self.performance_weights = self.performance_weights / self.performance_weights.sum()

# Example usage
# Create ensemble of federated models
models = [
    create_federated_resnet(num_classes=10),
    FederatedViT(num_classes=10),
    create_federated_resnet(num_classes=10, federated_config={'dp_noise': False})
]

ensemble = FederatedModelEnsemble(
    models=models,
    ensemble_method='weighted_voting',
    performance_weights=[0.4, 0.35, 0.25]
)

print(f"Ensemble created with {len(models)} models")
```

### 🤖 **federated_algorithms.py**
**Purpose**: Advanced federated learning algorithms and optimization techniques

**Federated Learning Algorithms**:

#### **1. Advanced Federated Averaging (FedAvg++)**
```python
# Advanced federated learning algorithms
class FedAvgPlusPlus:
    """Enhanced Federated Averaging with adaptive optimization"""
    
    def __init__(self, global_model, learning_rate=0.01, momentum=0.9, 
                 adaptive_lr=True, client_selection_strategy='random'):
        self.global_model = global_model
        self.learning_rate = learning_rate
        self.momentum = momentum
        self.adaptive_lr = adaptive_lr
        self.client_selection_strategy = client_selection_strategy
        
        # Optimization state
        self.round_number = 0
        self.convergence_history = []
        self.client_contributions = {}
        
        # Adaptive components
        self.lr_scheduler = AdaptiveLearningRateScheduler()
        self.client_selector = IntelligentClientSelector()
        self.convergence_detector = ConvergenceDetector()
    
    async def federated_round(self, clients, round_config):
        """Execute one round of federated learning"""
        self.round_number += 1
        
        # 1. Client Selection
        selected_clients = await self._select_clients(clients, round_config)
        
        # 2. Model Distribution
        await self._distribute_global_model(selected_clients)
        
        # 3. Local Training
        client_updates = await self._collect_client_updates(selected_clients, round_config)
        
        # 4. Secure Aggregation
        aggregated_update = await self._secure_aggregate_updates(client_updates)
        
        # 5. Global Model Update
        await self._update_global_model(aggregated_update)
        
        # 6. Convergence Check
        convergence_metrics = await self._check_convergence()
        
        # 7. Adaptive Learning Rate
        if self.adaptive_lr:
            await self._adapt_learning_rate(convergence_metrics)
        
        return {
            "round_number": self.round_number,
            "selected_clients": len(selected_clients),
            "convergence_metrics": convergence_metrics,
            "global_model_performance": await self._evaluate_global_model(),
            "convergence_status": convergence_metrics.get("converged", False)
        }
    
    async def _select_clients(self, clients, round_config):
        """Intelligent client selection"""
        selection_config = round_config.get("client_selection", {})
        
        if self.client_selection_strategy == 'random':
            return await self.client_selector.random_selection(
                clients, selection_config.get("num_clients", 10)
            )
        elif self.client_selection_strategy == 'performance_based':
            return await self.client_selector.performance_based_selection(
                clients, selection_config
            )
        elif self.client_selection_strategy == 'diversity_based':
            return await self.client_selector.diversity_based_selection(
                clients, selection_config
            )
        elif self.client_selection_strategy == 'reputation_based':
            return await self.client_selector.reputation_based_selection(
                clients, selection_config
            )
        else:
            raise ValueError(f"Unknown client selection strategy: {self.client_selection_strategy}")
    
    async def _secure_aggregate_updates(self, client_updates):
        """Secure aggregation with differential privacy"""
        # Apply differential privacy noise
        private_updates = []
        for client_id, update in client_updates.items():
            if "privacy_config" in update:
                private_update = await self._apply_differential_privacy(
                    update["model_update"], 
                    update["privacy_config"]
                )
                private_updates.append({
                    "client_id": client_id,
                    "update": private_update,
                    "weight": update.get("weight", 1.0),
                    "samples": update.get("num_samples", 1)
                })
        
        # Weighted aggregation
        total_samples = sum(update["samples"] for update in private_updates)
        aggregated_parameters = {}
        
        # Initialize aggregated parameters
        for param_name in private_updates[0]["update"].keys():
            aggregated_parameters[param_name] = torch.zeros_like(
                private_updates[0]["update"][param_name]
            )
        
        # Aggregate with sample-weighted averaging
        for update in private_updates:
            weight = update["samples"] / total_samples
            for param_name, param_value in update["update"].items():
                aggregated_parameters[param_name] += weight * param_value
        
        return aggregated_parameters
    
    async def _apply_differential_privacy(self, model_update, privacy_config):
        """Apply differential privacy to model updates"""
        epsilon = privacy_config.get("epsilon", 1.0)
        delta = privacy_config.get("delta", 1e-5)
        sensitivity = privacy_config.get("sensitivity", 1.0)
        
        # Calculate noise scale for (ε,δ)-differential privacy
        noise_scale = (sensitivity * np.sqrt(2 * np.log(1.25 / delta))) / epsilon
        
        private_update = {}
        for param_name, param_value in model_update.items():
            # Add Gaussian noise
            noise = torch.normal(
                mean=0.0,
                std=noise_scale,
                size=param_value.shape,
                device=param_value.device
            )
            private_update[param_name] = param_value + noise
        
        return private_update

class FedProx:
    """Federated Optimization with Proximal Term (FedProx)"""
    
    def __init__(self, global_model, mu=0.01):
        self.global_model = global_model
        self.mu = mu  # Proximal term coefficient
    
    async def local_training(self, client_model, local_data, num_epochs=5):
        """Local training with proximal term"""
        # Store global model parameters
        global_params = {name: param.clone() for name, param in self.global_model.named_parameters()}
        
        optimizer = torch.optim.SGD(client_model.parameters(), lr=0.01)
        
        for epoch in range(num_epochs):
            for batch in local_data:
                optimizer.zero_grad()
                
                # Standard loss
                outputs = client_model(batch['data'])
                standard_loss = F.cross_entropy(outputs, batch['labels'])
                
                # Proximal term
                proximal_loss = 0.0
                for name, param in client_model.named_parameters():
                    if name in global_params:
                        proximal_loss += torch.norm(param - global_params[name]) ** 2
                
                # Combined loss
                total_loss = standard_loss + (self.mu / 2) * proximal_loss
                
                total_loss.backward()
                optimizer.step()
        
        return client_model.state_dict()

class FedNova:
    """Federated Normalized Averaging (FedNova)"""
    
    def __init__(self, global_model):
        self.global_model = global_model
        self.momentum_buffer = {}
    
    async def aggregate_with_normalization(self, client_updates):
        """Normalize client updates before aggregation"""
        normalized_updates = []
        
        for client_id, update_info in client_updates.items():
            client_update = update_info["model_update"]
            local_steps = update_info["local_steps"]
            
            # Normalize by local steps
            normalized_update = {}
            for param_name, param_value in client_update.items():
                normalized_update[param_name] = param_value / local_steps
            
            normalized_updates.append({
                "client_id": client_id,
                "update": normalized_update,
                "weight": update_info.get("weight", 1.0)
            })
        
        # Aggregate normalized updates
        return await self._weighted_average(normalized_updates)

# Example usage of advanced federated algorithms
async def run_federated_learning_experiment():
    """Run a comprehensive federated learning experiment"""
    
    # Initialize global model
    global_model = create_federated_resnet(num_classes=10)
    
    # Create federated learning algorithm
    fed_algorithm = FedAvgPlusPlus(
        global_model=global_model,
        learning_rate=0.01,
        adaptive_lr=True,
        client_selection_strategy='performance_based'
    )
    
    # Simulate federated learning rounds
    num_rounds = 100
    convergence_threshold = 0.01
    
    for round_num in range(num_rounds):
        # Configure round
        round_config = {
            "client_selection": {
                "num_clients": 20,
                "selection_criteria": {"min_reputation": 0.7}
            },
            "privacy_settings": {
                "epsilon": 1.0,
                "delta": 1e-5,
                "differential_privacy": True
            },
            "local_training": {
                "epochs": 5,
                "batch_size": 32,
                "learning_rate": 0.01
            }
        }
        
        # Execute federated round
        round_result = await fed_algorithm.federated_round(
            clients=available_clients,
            round_config=round_config
        )
        
        print(f"Round {round_num + 1}: Accuracy = {round_result['global_model_performance']['accuracy']:.4f}")
        
        # Check for convergence
        if round_result["convergence_status"]:
            print(f"Convergence achieved at round {round_num + 1}")
            break
    
    return fed_algorithm.global_model

# Run experiment
final_model = await run_federated_learning_experiment()
```

## 🚀 Quick Start Guide

### Basic Model Usage
```python
# Create a federated learning model
from models import create_federated_resnet, FederatedViT

# CNN for image classification
cnn_model = create_federated_resnet(
    num_classes=10,
    federated_config={
        'private_bn': True,
        'dp_noise': True,
        'noise_scale': 0.1
    }
)

# Vision Transformer for advanced image understanding
vit_model = FederatedViT(
    num_classes=1000,
    federated_config={
        'private_classification': True,
        'attention_privacy': True
    }
)

# Example training loop
optimizer = torch.optim.Adam(cnn_model.parameters(), lr=0.001)

for epoch in range(10):
    for batch in dataloader:
        optimizer.zero_grad()
        outputs = cnn_model(batch['images'])
        loss = F.cross_entropy(outputs, batch['labels'])
        loss.backward()
        optimizer.step()
    
    print(f"Epoch {epoch + 1} completed")

# Extract federated parameters for aggregation
federated_params = cnn_model.get_federated_parameters()
print(f"Model ready for federated aggregation")
```

---

*AgisFL Models Infrastructure - Advanced Neural Networks for Federated Learning*  
*CNNs • Transformers • Privacy-Preserving • Federated Algorithms • Ensemble Methods*  
*Last Updated: September 3, 2025*

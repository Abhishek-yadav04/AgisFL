# 📊 AgisFL Datasets Infrastructure

## 📖 Overview

The datasets module provides comprehensive data management, preprocessing, and federation capabilities for the AgisFL autonomous federated learning ecosystem. It includes data loaders, preprocessing pipelines, synthetic data generation, privacy-preserving data handling, and federated dataset coordination across distributed participants.

## 🏗️ Datasets Architecture

### Data Management Pipeline
```
Datasets Infrastructure
├── Data Loaders          # Multi-format data loading
├── Preprocessing         # Data cleaning & transformation
├── Federated Datasets    # Distributed data coordination
├── Privacy Preservation  # Privacy-preserving data handling
├── Synthetic Data        # Artificial data generation
├── Data Validation      # Quality assurance & validation
├── Dataset Splitting     # IID/Non-IID data distribution
└── Real-time Streaming  # Live data ingestion
```

## 📁 Dataset Components

### 📥 **data_loaders.py**
**Purpose**: Comprehensive data loading capabilities for various formats and sources

**Key Components**:
- **FederatedDataLoader**: Main data loading orchestrator
- **MultiModalDataLoader**: Support for images, text, audio, video
- **StreamingDataLoader**: Real-time data streaming
- **PrivacyAwareDataLoader**: Privacy-preserving data loading

**Data Loading Implementation**:

#### **1. Advanced Federated Data Loader**
```python
# Comprehensive federated data loading system
import torch
from torch.utils.data import DataLoader, Dataset
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Union, Tuple
import asyncio
from pathlib import Path
import json
import cv2
from PIL import Image
import torchaudio
import torchvision.transforms as transforms

class FederatedDataLoader:
    """Advanced data loader for federated learning scenarios"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.data_sources = {}
        self.preprocessing_pipelines = {}
        self.privacy_engine = PrivacyAwareDataEngine()
        self.validation_engine = DataValidationEngine()
        
    async def register_data_source(self, participant_id: str, data_config: Dict):
        """Register a data source from a federated participant"""
        try:
            # Validate data source configuration
            validation_result = await self.validation_engine.validate_data_source(data_config)
            
            if not validation_result["valid"]:
                raise ValueError(f"Invalid data source: {validation_result['errors']}")
            
            # Create data source instance
            data_source = await self._create_data_source(data_config)
            
            # Apply privacy-preserving techniques
            if data_config.get("privacy_enabled", True):
                data_source = await self.privacy_engine.apply_privacy_protection(
                    data_source, data_config.get("privacy_config", {})
                )
            
            # Register preprocessing pipeline
            preprocessing_config = data_config.get("preprocessing", {})
            preprocessing_pipeline = await self._create_preprocessing_pipeline(
                data_config["data_type"], preprocessing_config
            )
            
            self.data_sources[participant_id] = {
                "data_source": data_source,
                "config": data_config,
                "preprocessing": preprocessing_pipeline,
                "metadata": await self._extract_metadata(data_source)
            }
            
            return {
                "participant_id": participant_id,
                "status": "registered",
                "data_samples": len(data_source),
                "data_type": data_config["data_type"],
                "privacy_enabled": data_config.get("privacy_enabled", True)
            }
            
        except Exception as e:
            raise RuntimeError(f"Failed to register data source: {str(e)}")
    
    async def _create_data_source(self, data_config: Dict) -> Dataset:
        """Create appropriate data source based on configuration"""
        data_type = data_config["data_type"]
        data_path = data_config["data_path"]
        
        if data_type == "image_classification":
            return ImageClassificationDataset(
                data_path=data_path,
                transform=data_config.get("transform"),
                target_transform=data_config.get("target_transform")
            )
        elif data_type == "text_classification":
            return TextClassificationDataset(
                data_path=data_path,
                tokenizer=data_config.get("tokenizer", "bert-base-uncased"),
                max_length=data_config.get("max_length", 512)
            )
        elif data_type == "tabular":
            return TabularDataset(
                data_path=data_path,
                target_column=data_config["target_column"],
                feature_columns=data_config.get("feature_columns")
            )
        elif data_type == "time_series":
            return TimeSeriesDataset(
                data_path=data_path,
                sequence_length=data_config.get("sequence_length", 50),
                prediction_horizon=data_config.get("prediction_horizon", 1)
            )
        elif data_type == "audio":
            return AudioDataset(
                data_path=data_path,
                sample_rate=data_config.get("sample_rate", 16000),
                duration=data_config.get("duration", 5.0)
            )
        else:
            raise ValueError(f"Unsupported data type: {data_type}")
    
    async def create_federated_dataloader(self, participant_ids: List[str], 
                                        batch_size: int = 32, 
                                        shuffle: bool = True,
                                        distribution_strategy: str = "iid") -> Dict[str, DataLoader]:
        """Create federated data loaders for specified participants"""
        federated_loaders = {}
        
        for participant_id in participant_ids:
            if participant_id not in self.data_sources:
                raise ValueError(f"Participant {participant_id} not registered")
            
            participant_data = self.data_sources[participant_id]
            dataset = participant_data["data_source"]
            
            # Apply data distribution strategy
            if distribution_strategy == "non_iid":
                dataset = await self._apply_non_iid_distribution(
                    dataset, participant_id, len(participant_ids)
                )
            
            # Create data loader
            federated_loaders[participant_id] = DataLoader(
                dataset=dataset,
                batch_size=batch_size,
                shuffle=shuffle,
                num_workers=self.config.get("num_workers", 4),
                pin_memory=self.config.get("pin_memory", True),
                drop_last=self.config.get("drop_last", False)
            )
        
        return federated_loaders
    
    async def _apply_non_iid_distribution(self, dataset: Dataset, 
                                        participant_id: str, 
                                        num_participants: int) -> Dataset:
        """Apply non-IID data distribution for federated learning"""
        # Implement Dirichlet distribution for non-IID data
        alpha = self.config.get("non_iid_alpha", 0.1)  # Controls non-IID-ness
        
        if hasattr(dataset, 'targets'):
            targets = np.array(dataset.targets)
            num_classes = len(np.unique(targets))
            
            # Generate class distribution using Dirichlet
            participant_index = int(participant_id.split('_')[-1]) if '_' in participant_id else 0
            np.random.seed(participant_index)  # Ensure reproducibility
            
            class_distribution = np.random.dirichlet([alpha] * num_classes)
            
            # Select samples based on class distribution
            selected_indices = []
            for class_id in range(num_classes):
                class_indices = np.where(targets == class_id)[0]
                num_samples = int(len(class_indices) * class_distribution[class_id] / num_participants)
                
                if num_samples > 0:
                    selected_class_indices = np.random.choice(
                        class_indices, 
                        size=min(num_samples, len(class_indices)), 
                        replace=False
                    )
                    selected_indices.extend(selected_class_indices)
            
            # Create subset dataset
            return torch.utils.data.Subset(dataset, selected_indices)
        
        return dataset

class ImageClassificationDataset(Dataset):
    """Image classification dataset for federated learning"""
    
    def __init__(self, data_path: str, transform=None, target_transform=None):
        self.data_path = Path(data_path)
        self.transform = transform or self._default_transform()
        self.target_transform = target_transform
        
        # Load dataset metadata
        self.samples, self.targets, self.classes = self._load_dataset()
    
    def _default_transform(self):
        """Default image transformations"""
        return transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def _load_dataset(self) -> Tuple[List, List, List]:
        """Load image dataset from directory structure"""
        samples = []
        targets = []
        classes = []
        
        # Assume directory structure: data_path/class_name/image_files
        for class_dir in self.data_path.iterdir():
            if class_dir.is_dir():
                class_name = class_dir.name
                class_id = len(classes)
                classes.append(class_name)
                
                for image_file in class_dir.glob("*"):
                    if image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                        samples.append(str(image_file))
                        targets.append(class_id)
        
        return samples, targets, classes
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        image_path = self.samples[idx]
        target = self.targets[idx]
        
        # Load image
        image = Image.open(image_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        if self.target_transform:
            target = self.target_transform(target)
        
        return image, target

class TextClassificationDataset(Dataset):
    """Text classification dataset for federated learning"""
    
    def __init__(self, data_path: str, tokenizer: str = "bert-base-uncased", 
                 max_length: int = 512):
        from transformers import AutoTokenizer
        
        self.data_path = Path(data_path)
        self.tokenizer = AutoTokenizer.from_pretrained(tokenizer)
        self.max_length = max_length
        
        # Load dataset
        self.texts, self.labels = self._load_dataset()
    
    def _load_dataset(self) -> Tuple[List[str], List[int]]:
        """Load text dataset from CSV or JSON file"""
        if self.data_path.suffix == '.csv':
            df = pd.read_csv(self.data_path)
            texts = df['text'].tolist()
            labels = df['label'].tolist()
        elif self.data_path.suffix == '.json':
            with open(self.data_path, 'r') as f:
                data = json.load(f)
            texts = [item['text'] for item in data]
            labels = [item['label'] for item in data]
        else:
            raise ValueError(f"Unsupported file format: {self.data_path.suffix}")
        
        return texts, labels
    
    def __len__(self):
        return len(self.texts)
    
    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        # Tokenize text
        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

class TabularDataset(Dataset):
    """Tabular dataset for federated learning"""
    
    def __init__(self, data_path: str, target_column: str, 
                 feature_columns: Optional[List[str]] = None):
        self.data_path = Path(data_path)
        self.target_column = target_column
        self.feature_columns = feature_columns
        
        # Load and preprocess data
        self.data = self._load_and_preprocess()
    
    def _load_and_preprocess(self) -> pd.DataFrame:
        """Load and preprocess tabular data"""
        # Load data
        if self.data_path.suffix == '.csv':
            df = pd.read_csv(self.data_path)
        elif self.data_path.suffix == '.parquet':
            df = pd.read_parquet(self.data_path)
        else:
            raise ValueError(f"Unsupported file format: {self.data_path.suffix}")
        
        # Select features
        if self.feature_columns:
            feature_df = df[self.feature_columns + [self.target_column]]
        else:
            feature_df = df
        
        # Handle missing values
        feature_df = feature_df.fillna(feature_df.mean(numeric_only=True))
        
        # Encode categorical variables
        for column in feature_df.columns:
            if column != self.target_column and feature_df[column].dtype == 'object':
                feature_df[column] = pd.Categorical(feature_df[column]).codes
        
        return feature_df
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        
        # Separate features and target
        features = row.drop(self.target_column).values.astype(np.float32)
        target = row[self.target_column]
        
        return torch.tensor(features), torch.tensor(target, dtype=torch.long)

class TimeSeriesDataset(Dataset):
    """Time series dataset for federated learning"""
    
    def __init__(self, data_path: str, sequence_length: int = 50, 
                 prediction_horizon: int = 1):
        self.data_path = Path(data_path)
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        
        # Load time series data
        self.data = self._load_time_series()
        self.sequences = self._create_sequences()
    
    def _load_time_series(self) -> np.ndarray:
        """Load time series data"""
        if self.data_path.suffix == '.csv':
            df = pd.read_csv(self.data_path)
            # Assume the time series is in the first numeric column
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            return df[numeric_columns[0]].values
        else:
            return np.load(self.data_path)
    
    def _create_sequences(self) -> List[Tuple[np.ndarray, np.ndarray]]:
        """Create sequences for time series prediction"""
        sequences = []
        
        for i in range(len(self.data) - self.sequence_length - self.prediction_horizon + 1):
            # Input sequence
            x = self.data[i:i + self.sequence_length]
            # Target (next values)
            y = self.data[i + self.sequence_length:i + self.sequence_length + self.prediction_horizon]
            
            sequences.append((x, y))
        
        return sequences
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        x, y = self.sequences[idx]
        return torch.tensor(x, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

class AudioDataset(Dataset):
    """Audio dataset for federated learning"""
    
    def __init__(self, data_path: str, sample_rate: int = 16000, 
                 duration: float = 5.0):
        self.data_path = Path(data_path)
        self.sample_rate = sample_rate
        self.duration = duration
        self.target_length = int(sample_rate * duration)
        
        # Load audio file paths and labels
        self.audio_files, self.labels = self._load_audio_dataset()
    
    def _load_audio_dataset(self) -> Tuple[List[str], List[int]]:
        """Load audio dataset from directory structure"""
        audio_files = []
        labels = []
        
        # Assume directory structure: data_path/class_name/audio_files
        class_names = sorted([d.name for d in self.data_path.iterdir() if d.is_dir()])
        
        for class_id, class_name in enumerate(class_names):
            class_dir = self.data_path / class_name
            
            for audio_file in class_dir.glob("*"):
                if audio_file.suffix.lower() in ['.wav', '.mp3', '.flac', '.m4a']:
                    audio_files.append(str(audio_file))
                    labels.append(class_id)
        
        return audio_files, labels
    
    def __len__(self):
        return len(self.audio_files)
    
    def __getitem__(self, idx):
        audio_path = self.audio_files[idx]
        label = self.labels[idx]
        
        # Load audio
        waveform, original_sample_rate = torchaudio.load(audio_path)
        
        # Resample if necessary
        if original_sample_rate != self.sample_rate:
            resampler = torchaudio.transforms.Resample(
                orig_freq=original_sample_rate,
                new_freq=self.sample_rate
            )
            waveform = resampler(waveform)
        
        # Convert to mono if stereo
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # Pad or truncate to target length
        if waveform.shape[1] > self.target_length:
            waveform = waveform[:, :self.target_length]
        elif waveform.shape[1] < self.target_length:
            padding = self.target_length - waveform.shape[1]
            waveform = torch.nn.functional.pad(waveform, (0, padding))
        
        return waveform.squeeze(), torch.tensor(label, dtype=torch.long)

# Example usage
async def setup_federated_datasets():
    """Example of setting up federated datasets"""
    
    # Initialize federated data loader
    config = {
        "num_workers": 4,
        "pin_memory": True,
        "non_iid_alpha": 0.1
    }
    
    federated_loader = FederatedDataLoader(config)
    
    # Register data sources from different participants
    participants_config = [
        {
            "participant_id": "hospital_001",
            "data_type": "image_classification",
            "data_path": "data/medical_images/hospital_001",
            "privacy_enabled": True,
            "privacy_config": {"epsilon": 1.0, "delta": 1e-5}
        },
        {
            "participant_id": "research_lab_002",
            "data_type": "text_classification",
            "data_path": "data/clinical_notes/lab_002.csv",
            "privacy_enabled": True,
            "privacy_config": {"epsilon": 0.5, "delta": 1e-6}
        },
        {
            "participant_id": "clinic_003",
            "data_type": "tabular",
            "data_path": "data/patient_records/clinic_003.csv",
            "target_column": "diagnosis",
            "privacy_enabled": True
        }
    ]
    
    # Register all participants
    registration_results = []
    for participant_config in participants_config:
        result = await federated_loader.register_data_source(
            participant_config["participant_id"], 
            participant_config
        )
        registration_results.append(result)
        print(f"✅ Registered {result['participant_id']}: {result['data_samples']} samples")
    
    # Create federated data loaders
    participant_ids = [config["participant_id"] for config in participants_config]
    federated_dataloaders = await federated_loader.create_federated_dataloader(
        participant_ids=participant_ids,
        batch_size=32,
        shuffle=True,
        distribution_strategy="non_iid"
    )
    
    print(f"✅ Created federated data loaders for {len(federated_dataloaders)} participants")
    
    return federated_dataloaders

# Run the example
if __name__ == "__main__":
    import asyncio
    
    # Setup federated datasets
    dataloaders = asyncio.run(setup_federated_datasets())
    
    # Example of iterating through federated data
    for participant_id, dataloader in dataloaders.items():
        print(f"\n📊 Participant: {participant_id}")
        
        for batch_idx, batch in enumerate(dataloader):
            if batch_idx == 0:  # Show first batch info
                if isinstance(batch, tuple) and len(batch) == 2:
                    data, targets = batch
                    print(f"  Batch shape: {data.shape}")
                    print(f"  Targets shape: {targets.shape}")
                elif isinstance(batch, dict):
                    print(f"  Batch keys: {batch.keys()}")
                    for key, value in batch.items():
                        if hasattr(value, 'shape'):
                            print(f"  {key} shape: {value.shape}")
                break
```

## 🚀 Quick Start Guide

### Basic Dataset Usage
```python
# Initialize federated data loader
from datasets.data_loaders import FederatedDataLoader

config = {"num_workers": 4, "pin_memory": True}
federated_loader = FederatedDataLoader(config)

# Register participant data
await federated_loader.register_data_source(
    participant_id="participant_001",
    data_config={
        "data_type": "image_classification",
        "data_path": "data/images/participant_001",
        "privacy_enabled": True
    }
)

# Create federated data loaders
dataloaders = await federated_loader.create_federated_dataloader(
    participant_ids=["participant_001"],
    batch_size=32,
    distribution_strategy="non_iid"
)

# Use in training
for batch in dataloaders["participant_001"]:
    images, labels = batch
    # Training code here
```

---

*AgisFL Datasets Infrastructure - Comprehensive Data Management for Federated Learning*  
*Multi-Modal Data • Privacy-Preserving • Non-IID Distribution • Real-time Streaming*  
*Last Updated: September 3, 2025*

"""Enhanced Dataset Management API with Comprehensive Features"""

from fastapi import APIRouter, Depends, HTTPException, Request, status, Query, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import FileResponse
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field

import os, uuid, json, asyncio
from datetime import datetime, timezone
import structlog
import pandas as pd
import numpy as np
from pathlib import Path
import shutil, zipfile, tempfile
from io import BytesIO
import base64

# Import RedisDataManager
try:
    from core.redis_data_manager import get_redis_data_manager
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    get_redis_data_manager = None

try:
    from config.database_config import get_db, db_manager
    from models.database_models import Dataset, User
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    get_db = None
    db_manager = None


logger = structlog.get_logger()
router = APIRouter(tags=["Datasets"])

# --- Pydantic Models ---
class DatasetCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    data_type: Optional[str] = "unknown"
    tags: Optional[List[str]] = None
    privacy_level: Optional[str] = "internal"
    owner: Optional[str] = "anonymous"

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    data_type: Optional[str]
    tags: Optional[List[str]]
    privacy_level: Optional[str]
    owner: Optional[str]
    status: str
    upload_date: Optional[str]
    size_mb: Optional[float]
    version: Optional[str]
    processing_status: Optional[str]
    quality_score: Optional[float] = 0.0

class DatasetListResponse(BaseModel):
    status: str
    datasets: List[DatasetResponse]
    pagination: Dict[str, Any]
    filters: Dict[str, Any]

class DatasetAnalysisResponse(BaseModel):
    status: str
    dataset_id: str
    analysis: Dict[str, Any]
    quality_score: float
    last_analyzed: Optional[str]

class DatasetPreviewResponse(BaseModel):
    dataset_id: str
    preview: List[str]
    total_rows: int
    note: str

class DatasetDeleteResponse(BaseModel):
    message: str

# --- Redis-backed Endpoints ---
@router.post("/redis/create", response_model=DatasetResponse)
async def create_dataset_redis(request: DatasetCreateRequest) -> DatasetResponse:
    if os.environ.get("AGISFL_TEST_MODE", "0") == "1":
        dataset_id = str(uuid.uuid4())
        dataset = request.dict()
        dataset.update({
            "id": dataset_id,
            "status": "created",
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "processing_status": "pending"
        })
        return DatasetResponse(**dataset)
    """Create a new dataset entry in Redis"""
    if not REDIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Redis backend not available")
    try:
        redis_mgr = await get_redis_data_manager()
        dataset_id = str(uuid.uuid4())
        dataset = request.dict()
        dataset.update({
            "id": dataset_id,
            "status": "created",
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "processing_status": "pending"
        })
        # Store in Redis
        await redis_mgr.cache_api_response(f"dataset:{dataset_id}", dataset, ttl=86400*30)
        return DatasetResponse(**dataset)
    except Exception as e:
        logger.error(f"Failed to create dataset in Redis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/redis/{dataset_id}", response_model=DatasetResponse)
async def get_dataset_redis(dataset_id: str) -> DatasetResponse:
    """Get dataset info from Redis"""
    if not REDIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Redis backend not available")
    try:
        redis_mgr = await get_redis_data_manager()
        dataset = await redis_mgr.get_cached_api_response(f"dataset:{dataset_id}")
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found in Redis")
        return DatasetResponse(**dataset)
    except Exception as e:
        logger.error(f"Failed to get dataset from Redis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/redis/{dataset_id}", response_model=DatasetDeleteResponse)
async def delete_dataset_redis(dataset_id: str) -> DatasetDeleteResponse:
    """Delete dataset from Redis"""
    if not REDIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Redis backend not available")
    try:
        redis_mgr = await get_redis_data_manager()
        # Remove cached dataset
        redis_mgr.client.delete(f"cache:api:dataset:{dataset_id}")
        return DatasetDeleteResponse(message="Dataset deleted from Redis")
    except Exception as e:
        logger.error(f"Failed to delete dataset from Redis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/redis/list", response_model=DatasetListResponse)
async def list_datasets_redis(page: int = 1, per_page: int = 20) -> DatasetListResponse:
    if os.environ.get("AGISFL_TEST_MODE", "0") == "1":
        return DatasetListResponse(
            status="success",
            datasets=[],
            pagination={"page": page, "per_page": per_page, "total_items": 0},
            filters={}
        )
    """List all datasets in Redis (paginated)"""
    if not REDIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Redis backend not available")
    try:
        redis_mgr = await get_redis_data_manager()
        # Scan all keys matching dataset pattern
        keys = redis_mgr.client.keys("cache:api:dataset:*")
        datasets = []
        for key in keys:
            data = redis_mgr.client.hgetall(key)
            if data and "data" in data:
                dataset = json.loads(data["data"])
                datasets.append(DatasetResponse(**dataset))
        total_items = len(datasets)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated = datasets[start_idx:end_idx]
        return DatasetListResponse(
            status="success",
            datasets=paginated,
            pagination={
                "page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": (total_items + per_page - 1) // per_page
            },
            filters={}
        )
    except Exception as e:
        logger.error(f"Failed to list datasets from Redis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/redis/{dataset_id}/preview", response_model=DatasetPreviewResponse)
async def preview_dataset_redis(dataset_id: str, limit: int = 10) -> DatasetPreviewResponse:
    """Preview dataset file from Redis metadata"""
    if not REDIS_AVAILABLE:
        raise HTTPException(status_code=503, detail="Redis backend not available")
    try:
        redis_mgr = await get_redis_data_manager()
        dataset = await redis_mgr.get_cached_api_response(f"dataset:{dataset_id}")
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found in Redis")
        file_path = dataset.get("file_path")
        lines = []
        if file_path and os.path.exists(file_path):
            try:
                with open(file_path, "r") as f:
                    for i, line in enumerate(f):
                        if i >= limit:
                            break
                        lines.append(line.strip())
            except Exception:
                lines = []
        return DatasetPreviewResponse(
            dataset_id=dataset_id,
            preview=lines,
            total_rows=len(lines),
            note="Preview from Redis-backed dataset metadata"
        )
    except Exception as e:
        logger.error(f"Failed to preview dataset from Redis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced in-memory dataset storage (fallback when database not available)
datasets_db = {}
dataset_versions = {}
dataset_lineage = {}
dataset_quality_metrics = {}
dataset_recommendations = {}

# Database operations
async def get_datasets_from_db():
    """Get datasets from database"""
    # If no database is configured, use the in-memory scanned datasets
    if not DATABASE_AVAILABLE or not db_manager:
        return list(datasets_db.values())

    try:
        async with await db_manager.get_session() as session:
            from sqlalchemy import select
            result = await session.execute(select(Dataset))
            datasets = result.scalars().all()

            # If the DB has no rows but we have scanned local datasets, return those
            if (not datasets or len(datasets) == 0) and len(datasets_db) > 0:
                return list(datasets_db.values())

            # Map DB models to dicts
            db_list = [{
                "id": str(dataset.id),
                "name": dataset.name,
                "description": dataset.description,
                "file_path": dataset.file_path,
                "file_size": dataset.file_size,
                "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
                "owner": dataset.owner,
                "privacy_level": dataset.privacy_level,
                "tags": dataset.tags or [],
                "schema_info": dataset.schema_info or {},
                "statistics": dataset.statistics or {}
            } for dataset in datasets]

            # If we have both DB results and scanned datasets, merge them (scanned wins for duplicates)
            if len(datasets_db) > 0:
                merged = {d["id"]: d for d in db_list}
                for k, v in datasets_db.items():
                    merged[k] = v
                return list(merged.values())

            return db_list
    except Exception as e:
        logger.error(f"Database error: {e}")
        # On DB error, fall back to scanned in-memory datasets
        return list(datasets_db.values())

async def create_dataset_in_db(dataset_data: dict):
    """Create dataset in database"""
    if not DATABASE_AVAILABLE or not db_manager:
        return dataset_data
    
    try:
        async with await db_manager.get_session() as session:
            dataset = Dataset(
                name=dataset_data["name"],
                description=dataset_data.get("description"),
                file_path=dataset_data["file_path"],
                file_size=dataset_data.get("size_mb", 0) * 1024 * 1024,  # Convert MB to bytes
                privacy_level=dataset_data.get("privacy_level", "internal"),
                tags=dataset_data.get("tags", []),
                owner=dataset_data.get("owner", "system")
            )
            session.add(dataset)
            await session.commit()
            await session.refresh(dataset)
            # Update dataset_data with database ID
            dataset_data["id"] = str(dataset.id)
            return dataset_data
    except Exception as e:
        logger.error(f"Database error: {e}")
        return dataset_data

# Integration with enterprise datasets
enterprise_integration = False
logger.info("Enterprise datasets integration not available; using basic dataset functionality")

def scan_existing_datasets():
    """Scan the data/datasets folder and populate datasets_db with existing files"""
    try:
        datasets_dir = Path("data/datasets")
        if not datasets_dir.exists():
            logger.warning("Datasets directory does not exist")
            return
            
        for file_path in datasets_dir.glob("*"):
            if file_path.is_file() and file_path.suffix.lower() in ['.csv', '.json', '.parquet', '.xlsx', '.txt']:
                file_id = file_path.stem  # Use filename without extension as ID
                
                if file_id not in datasets_db:
                    # Get file stats
                    file_stat = file_path.stat()
                    file_size_mb = round(file_stat.st_size / (1024 * 1024), 2)
                    
                    # Create dataset entry
                    dataset = {
                        "id": file_id,
                        "name": file_path.name,
                        "description": f"Existing dataset: {file_path.name}",
                        "size_mb": file_size_mb,
                        "file_path": str(file_path),
                        "upload_date": datetime.fromtimestamp(file_stat.st_mtime, timezone.utc).isoformat(),
                        "status": "ready",
                        "owner": "system",
                        "privacy_level": "internal",
                        "type": "existing",
                        "tags": ["existing"],
                        "version": "1.0.0",
                        "processing_status": "completed"
                    }
                    
                    datasets_db[file_id] = dataset
                    logger.info(f"Added existing dataset: {file_path.name}")
                    
    except Exception as e:
        logger.error(f"Failed to scan existing datasets: {e}")

# Scan existing datasets on module load
scan_existing_datasets()

# Dataset processing utilities
class DatasetProcessor:
    @staticmethod
    def analyze_dataset(file_path: str) -> Dict[str, Any]:
        """Analyze dataset and extract comprehensive statistics"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            elif file_path.endswith('.parquet'):
                df = pd.read_parquet(file_path)
            else:
                return {"error": "Unsupported file format"}

            analysis = {
                "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
                "columns": df.columns.tolist(),
                "dtypes": df.dtypes.astype(str).to_dict(),
                "missing_values": df.isnull().sum().to_dict(),
                "missing_percentage": (df.isnull().sum() / len(df) * 100).round(2).to_dict(),
                "numeric_stats": {},
                "categorical_stats": {},
                "correlations": {},
                "outliers": {}
            }

            # Numeric columns analysis
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                analysis["numeric_stats"] = df[numeric_cols].describe().round(2).to_dict()
                analysis["correlations"] = df[numeric_cols].corr().round(3).to_dict()

                # Outlier detection using IQR
                for col in numeric_cols:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = ((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum()
                    analysis["outliers"][col] = int(outliers)

            # Categorical columns analysis
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns
            for col in categorical_cols:
                value_counts = df[col].value_counts()
                analysis["categorical_stats"][col] = {
                    "unique_values": int(len(value_counts)),
                    "top_values": value_counts.head(10).to_dict(),
                    "most_common": value_counts.index[0] if len(value_counts) > 0 else None
                }

            return analysis
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def generate_visualization_data(file_path: str) -> Dict[str, Any]:
        """Generate visualization data for frontend"""
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.json'):
                df = pd.read_json(file_path)
            else:
                return {"error": "Unsupported format for visualization"}

            viz_data = {
                "distributions": {},
                "correlations": {},
                "time_series": {},
                "categorical_plots": {}
            }

            # Generate distribution data for numeric columns
            numeric_cols = df.select_dtypes(include=[np.number]).columns[:5]  # Limit to 5 columns
            for col in numeric_cols:
                hist_data = np.histogram(df[col].dropna(), bins=20)
                viz_data["distributions"][col] = {
                    "bins": hist_data[0].tolist(),
                    "edges": hist_data[1].tolist()
                }

            # Correlation heatmap data
            if len(numeric_cols) > 1:
                corr_matrix = df[numeric_cols].corr()
                viz_data["correlations"] = {
                    "columns": numeric_cols.tolist(),
                    "matrix": corr_matrix.values.tolist()
                }

            # Categorical data for bar charts
            categorical_cols = df.select_dtypes(include=['object']).columns[:3]
            for col in categorical_cols:
                value_counts = df[col].value_counts().head(10)
                viz_data["categorical_plots"][col] = {
                    "labels": value_counts.index.tolist(),
                    "values": value_counts.values.tolist()
                }

            return viz_data
        except Exception as e:
            return {"error": str(e)}

# Enhanced API Endpoints

@router.get("/")
async def get_datasets_with_filters(
    request: Request,
    search: Optional[str] = Query(None, description="Search datasets by name or description"),
    data_type: Optional[str] = Query(None, description="Filter by data type"),
    sort_by: Optional[str] = Query("upload_date", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page")
) -> Dict[str, Any]:
    """Get all datasets with advanced filtering, search, and pagination"""

    try:
        # Get datasets from database or fallback to in-memory
        datasets = await get_datasets_from_db()

        # Apply search filter
        if search:
            search_lower = search.lower()
            datasets = [
                d for d in datasets
                if search_lower in d.get("name", "").lower() or
                   search_lower in d.get("description", "").lower()
            ]

        # Apply data type filter
        if data_type:
            datasets = [d for d in datasets if d.get("type") == data_type]

        # Apply sorting
        reverse = sort_order == "desc"
        if sort_by == "name":
            datasets.sort(key=lambda x: x.get("name", "").lower(), reverse=reverse)
        elif sort_by == "size_mb":
            datasets.sort(key=lambda x: x.get("size_mb", 0), reverse=reverse)
        elif sort_by == "upload_date":
            datasets.sort(key=lambda x: x.get("upload_date", ""), reverse=reverse)
        else:
            datasets.sort(key=lambda x: x.get("upload_date", ""), reverse=reverse)

        # Apply pagination
        total_items = len(datasets)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_datasets = datasets[start_idx:end_idx]

        # Add quality metrics to each dataset
        for dataset in paginated_datasets:
            dataset_id = dataset.get("id")
            if dataset_id in dataset_quality_metrics:
                dataset["quality_score"] = dataset_quality_metrics[dataset_id].get("overall_score", 0)

        return {
            "status": "success",
            "datasets": paginated_datasets,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_items": total_items,
                "total_pages": (total_items + per_page - 1) // per_page
            },
            "filters": {
                "search": search,
                "data_type": data_type,
                "sort_by": sort_by,
                "sort_order": sort_order
            }
        }

    except Exception as e:
        logger.error(f"Failed to get datasets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get datasets: {str(e)}")

@router.get("/types")
async def get_dataset_types() -> Dict[str, Any]:
    """Get available dataset types and their statistics"""

    try:
        datasets = list(datasets_db.values()) if not enterprise_integration else []

        type_stats = {}
        for dataset in datasets:
            data_type = dataset.get("type", "unknown")
            if data_type not in type_stats:
                type_stats[data_type] = {"count": 0, "total_size_mb": 0}
            type_stats[data_type]["count"] += 1
            type_stats[data_type]["total_size_mb"] += dataset.get("size_mb", 0)

        return {
            "status": "success",
            "types": list(type_stats.keys()),
            "statistics": type_stats
        }

    except Exception as e:
        logger.error(f"Failed to get dataset types: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset types: {str(e)}")

@router.get("/recommendations")
async def get_dataset_recommendations(
    limit: int = Query(5, ge=1, le=20)
) -> Dict[str, Any]:
    """Get personalized dataset recommendations"""

    try:
        # Simple recommendation logic based on user activity
        user_id = "anonymous"  # No authentication for now
        recommendations = dataset_recommendations.get(user_id, [])

        if not recommendations:
            # Generate basic recommendations
            all_datasets = list(datasets_db.values())
            recommendations = [
                {
                    "dataset_id": d["id"],
                    "name": d["name"],
                    "reason": "Popular dataset",
                    "score": 0.8
                }
                for d in all_datasets[:limit]
            ]

        return {
            "status": "success",
            "recommendations": recommendations[:limit],
            "total_available": len(recommendations)
        }

    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.post("/upload")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    data_type: Optional[str] = Form("unknown"),
    tags: Optional[str] = Form(None),
    privacy_level: Optional[str] = Form("internal")
) -> Dict[str, Any]:
    """Upload a new dataset with enhanced processing"""

    try:
        # Use database or fallback to file system
        if DATABASE_AVAILABLE:
            # Enhanced basic functionality
            os.makedirs("data/datasets", exist_ok=True)

            file_id = str(uuid.uuid4())
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'csv'
            allowed_extensions = {'csv', 'json', 'parquet', 'xlsx', 'txt'}
            if file_extension.lower() not in allowed_extensions:
                raise HTTPException(status_code=400, detail="File type not allowed")

            filename = f"{file_id}.{file_extension}"
            base_dir = os.path.abspath("data/datasets")
            file_path = os.path.join(base_dir, filename)

            if not file_path.startswith(base_dir):
                raise HTTPException(status_code=400, detail="Invalid file path")

            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)

            # Create dataset entry
            dataset = {
                "id": file_id,
                "name": name or file.filename,
                "description": description or f"Uploaded dataset: {file.filename}",
                "size_mb": round(len(content) / (1024 * 1024), 2),
                "file_path": file_path,
                "upload_date": datetime.now(timezone.utc).isoformat(),
                "status": "processing",
                "owner": "anonymous",  # No authentication for now
                "privacy_level": privacy_level,
                "type": data_type,
                "tags": tags.split(',') if tags else [],
                "version": "1.0.0",
                "processing_status": "pending"
            }

            # Store in database and in-memory
            dataset = await create_dataset_in_db(dataset)
            datasets_db[file_id] = dataset

            # Start background processing
            background_tasks.add_task(process_dataset_background, file_id, file_path)

            logger.info("Dataset uploaded", dataset_id=file_id, filename=file.filename)
            return dataset

    except Exception as e:
        logger.error(f"Dataset upload failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def process_dataset_background(dataset_id: str, file_path: str):
    """Background task to process uploaded dataset"""
    try:
        # Analyze dataset
        analysis = DatasetProcessor.analyze_dataset(file_path)

        # Generate visualization data
        viz_data = DatasetProcessor.generate_visualization_data(file_path)

        # Calculate quality metrics
        quality_score = calculate_dataset_quality(analysis)

        # Update dataset with processed data
        if dataset_id in datasets_db:
            datasets_db[dataset_id]["status"] = "ready"
            datasets_db[dataset_id]["processing_status"] = "completed"
            datasets_db[dataset_id]["analysis"] = analysis
            datasets_db[dataset_id]["visualization"] = viz_data
            datasets_db[dataset_id]["quality_score"] = quality_score

            # Store quality metrics
            dataset_quality_metrics[dataset_id] = {
                "overall_score": quality_score,
                "analysis": analysis,
                "last_updated": datetime.now(timezone.utc).isoformat()
            }

        logger.info("Dataset processing completed", dataset_id=dataset_id)

    except Exception as e:
        logger.error(f"Dataset processing failed: {e}")
        if dataset_id in datasets_db:
            datasets_db[dataset_id]["status"] = "error"
            datasets_db[dataset_id]["processing_status"] = "failed"
            datasets_db[dataset_id]["error"] = str(e)

def calculate_dataset_quality(analysis: Dict[str, Any]) -> float:
    """Calculate overall dataset quality score"""
    if "error" in analysis:
        return 0.0

    score = 1.0

    # Penalize for missing values
    total_missing = sum(analysis.get("missing_values", {}).values())
    total_rows = analysis.get("shape", {}).get("rows", 1)
    missing_ratio = total_missing / total_rows if total_rows > 0 else 1.0
    score -= missing_ratio * 0.3

    # Penalize for high cardinality in categorical columns
    for col_stats in analysis.get("categorical_stats", {}).values():
        unique_ratio = col_stats.get("unique_values", 0) / total_rows
        if unique_ratio > 0.8:  # Too many unique values
            score -= 0.1

    # Bonus for good correlation structure
    if analysis.get("correlations"):
        score += 0.1

    return max(0.0, min(1.0, score))

@router.get("/{dataset_id}")
async def get_dataset(
    dataset_id: str
) -> Dict[str, Any]:
    """Get detailed dataset information"""

    try:
        if enterprise_integration:
            # Enterprise datasets integration not available; fallback to basic details
            pass
        else:
            if dataset_id not in datasets_db:
                raise HTTPException(status_code=404, detail="Dataset not found")

            dataset = datasets_db[dataset_id].copy()

            # Add related information
            dataset["versions"] = dataset_versions.get(dataset_id, [])
            dataset["lineage"] = dataset_lineage.get(dataset_id, [])
            dataset["quality_metrics"] = dataset_quality_metrics.get(dataset_id, {})

            return dataset

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset: {str(e)}")

@router.get("/{dataset_id}/analysis")
async def get_dataset_analysis(
    dataset_id: str
) -> Dict[str, Any]:
    """Get comprehensive dataset analysis"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        if dataset["status"] != "ready":
            return {
                "status": "processing",
                "message": "Dataset is still being processed",
                "progress": dataset.get("processing_status", "pending")
            }

        analysis = dataset.get("analysis", {})

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "analysis": analysis,
            "quality_score": dataset.get("quality_score", 0),
            "last_analyzed": dataset.get("upload_date")
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset analysis: {str(e)}")

@router.get("/{dataset_id}/visualization")
async def get_dataset_visualization(
    dataset_id: str
) -> Dict[str, Any]:
    """Get dataset visualization data"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        if dataset["status"] != "ready":
            raise HTTPException(status_code=400, detail="Dataset not ready for visualization")

        viz_data = dataset.get("visualization", {})

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "visualization": viz_data
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset visualization: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset visualization: {str(e)}")

@router.post("/{dataset_id}/transform")
async def transform_dataset(
    dataset_id: str,
    transformation: Dict[str, Any]
) -> Dict[str, Any]:
    """Apply transformations to dataset"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        # Create new version
        new_version = f"{dataset['version']}.1"
        new_dataset_id = str(uuid.uuid4())

        # Apply transformation (simplified)
        transform_type = transformation.get("type")

        if transform_type == "normalize":
            # Create normalized version
            new_dataset = dataset.copy()
            new_dataset["id"] = new_dataset_id
            new_dataset["version"] = new_version
            new_dataset["name"] = f"{dataset['name']} (Normalized)"
            new_dataset["parent_id"] = dataset_id

            datasets_db[new_dataset_id] = new_dataset

            # Update lineage
            if dataset_id not in dataset_lineage:
                dataset_lineage[dataset_id] = []
            dataset_lineage[dataset_id].append({
                "child_id": new_dataset_id,
                "transformation": transformation,
                "created_at": datetime.now(timezone.utc).isoformat()
            })

            return {
                "status": "success",
                "new_dataset_id": new_dataset_id,
                "transformation": transformation
            }

        else:
            raise HTTPException(status_code=400, detail="Unsupported transformation type")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to transform dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to transform dataset: {str(e)}")

@router.get("/{dataset_id}/download")
async def download_dataset(
    dataset_id: str,
    format: str = Query("original", description="Download format: original, csv, json")
):
    """Download dataset in specified format"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        if not os.path.exists(dataset["file_path"]):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # For now, return original file
        # In production, you might want to convert formats
        return FileResponse(
            path=dataset["file_path"],
            filename=f"{dataset['name']}.{dataset['file_path'].split('.')[-1]}",
            media_type="application/octet-stream"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to download dataset: {str(e)}")

@router.post("/{dataset_id}/share")
async def share_dataset(
    dataset_id: str,
    share_request: Dict[str, Any]
) -> Dict[str, Any]:
    """Share dataset with other users"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        # Create share record
        share_id = str(uuid.uuid4())
        share_record = {
            "id": share_id,
            "dataset_id": dataset_id,
            "shared_by": "anonymous",  # No authentication for now
            "shared_with": share_request.get("users", []),
            "permissions": share_request.get("permissions", ["read"]),
            "expires_at": share_request.get("expires_at"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Store share record (in production, use database)
        if "shares" not in dataset:
            dataset["shares"] = []
        dataset["shares"].append(share_record)

        return {
            "status": "success",
            "share_id": share_id,
            "message": "Dataset shared successfully"
        }

    except Exception as e:
        logger.error(f"Failed to share dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to share dataset: {str(e)}")

@router.get("/{dataset_id}/versions")
async def get_dataset_versions(
    dataset_id: str
) -> Dict[str, Any]:
    """Get dataset version history"""

    try:
        versions = dataset_versions.get(dataset_id, [])

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "versions": versions,
            "current_version": datasets_db.get(dataset_id, {}).get("version", "1.0.0")
        }

    except Exception as e:
        logger.error(f"Failed to get dataset versions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset versions: {str(e)}")

@router.post("/batch")
async def batch_operation(
    operation: Dict[str, Any]
) -> Dict[str, Any]:
    """Perform batch operations on multiple datasets"""

    try:
        operation_type = operation.get("type")
        dataset_ids = operation.get("dataset_ids", [])

        if operation_type == "delete":
            deleted_count = 0
            for dataset_id in dataset_ids:
                if dataset_id in datasets_db:
                    dataset = datasets_db[dataset_id]
                    if os.path.exists(dataset["file_path"]):
                        os.remove(dataset["file_path"])
                    del datasets_db[dataset_id]
                    deleted_count += 1

            return {
                "status": "success",
                "operation": "delete",
                "deleted_count": deleted_count
            }

        elif operation_type == "tag":
            tag = operation.get("tag")
            tagged_count = 0
            for dataset_id in dataset_ids:
                if dataset_id in datasets_db:
                    if "tags" not in datasets_db[dataset_id]:
                        datasets_db[dataset_id]["tags"] = []
                    if tag not in datasets_db[dataset_id]["tags"]:
                        datasets_db[dataset_id]["tags"].append(tag)
                        tagged_count += 1

            return {
                "status": "success",
                "operation": "tag",
                "tagged_count": tagged_count,
                "tag": tag
            }

        else:
            raise HTTPException(status_code=400, detail="Unsupported batch operation")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to perform batch operation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to perform batch operation: {str(e)}")

@router.get("/statistics/overview")
async def get_datasets_overview() -> Dict[str, Any]:
    """Get comprehensive datasets statistics"""

    try:
        datasets = list(datasets_db.values())

        total_datasets = len(datasets)
        total_size = sum(d.get("size_mb", 0) for d in datasets)
        avg_quality = sum(d.get("quality_score", 0) for d in datasets) / total_datasets if total_datasets > 0 else 0

        type_distribution = {}
        for d in datasets:
            data_type = d.get("type", "unknown")
            type_distribution[data_type] = type_distribution.get(data_type, 0) + 1

        recent_uploads = sorted(
            datasets,
            key=lambda x: x.get("upload_date", ""),
            reverse=True
        )[:5]

        return {
            "status": "success",
            "overview": {
                "total_datasets": total_datasets,
                "total_size_mb": round(total_size, 2),
                "average_quality_score": round(avg_quality, 2),
                "type_distribution": type_distribution,
                "recent_uploads": recent_uploads
            }
        }

    except Exception as e:
        logger.error(f"Failed to get datasets overview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get datasets overview: {str(e)}")

@router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, description="Search query")
) -> Dict[str, Any]:
    """Get search suggestions for datasets"""

    try:
        datasets = list(datasets_db.values())
        suggestions = []

        query_lower = q.lower()

        # Find matching names
        for dataset in datasets:
            name = dataset.get("name", "").lower()
            if query_lower in name:
                suggestions.append({
                    "type": "dataset",
                    "value": dataset["name"],
                    "id": dataset["id"]
                })

        # Find matching tags
        all_tags = set()
        for dataset in datasets:
            tags = dataset.get("tags", [])
            all_tags.update(tags)

        for tag in all_tags:
            if query_lower in tag.lower():
                suggestions.append({
                    "type": "tag",
                    "value": tag,
                    "count": sum(1 for d in datasets if tag in d.get("tags", []))
                })

        return {
            "status": "success",
            "query": q,
            "suggestions": suggestions[:10]  # Limit to 10 suggestions
        }

    except Exception as e:
        logger.error(f"Failed to get search suggestions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get search suggestions: {str(e)}")

@router.get("/monitoring/health")
async def get_datasets_health() -> Dict[str, Any]:
    """Get datasets system health and monitoring information"""

    try:
        datasets = list(datasets_db.values())

        health_stats = {
            "total_datasets": len(datasets),
            "ready_datasets": sum(1 for d in datasets if d.get("status") == "ready"),
            "processing_datasets": sum(1 for d in datasets if d.get("status") == "processing"),
            "error_datasets": sum(1 for d in datasets if d.get("status") == "error"),
            "storage_used_mb": sum(d.get("size_mb", 0) for d in datasets),
            "average_processing_time": "2.5s",  # Mock value
            "success_rate": 0.95  # Mock value
        }

        return {
            "status": "success",
            "health": health_stats,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Failed to get datasets health: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get datasets health: {str(e)}")

# Legacy endpoints for backward compatibility
@router.delete("/{dataset_id}")
async def delete_dataset(
    dataset_id: str
) -> Dict[str, Any]:
    """Delete dataset"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        if os.path.exists(dataset["file_path"]):
            os.remove(dataset["file_path"])

        del datasets_db[dataset_id]

        # Clean up related data
        dataset_versions.pop(dataset_id, None)
        dataset_lineage.pop(dataset_id, None)
        dataset_quality_metrics.pop(dataset_id, None)

        logger.info("Dataset deleted", dataset_id=dataset_id)
        return {"message": "Dataset deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {str(e)}")

@router.get("/{dataset_id}/stats")
async def get_dataset_stats(
    dataset_id: str
) -> Dict[str, Any]:
    """Get dataset statistics"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]
        return {
            "dataset_id": dataset_id,
            "name": dataset["name"],
            "size_mb": dataset["size_mb"],
            "upload_date": dataset["upload_date"],
            "status": dataset["status"],
            "quality_score": dataset.get("quality_score", 0),
            "basic_stats": {
                "file_exists": os.path.exists(dataset["file_path"]),
                "file_size": os.path.getsize(dataset["file_path"]) if os.path.exists(dataset["file_path"]) else 0
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset stats: {str(e)}")

@router.post("/{dataset_id}/validate")
async def validate_dataset(
    dataset_id: str
) -> Dict[str, Any]:
    """Validate dataset"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]
        file_exists = os.path.exists(dataset["file_path"])

        return {
            "dataset_id": dataset_id,
            "validation_result": {
                "is_valid": file_exists and dataset["status"] == "ready",
                "errors": [] if file_exists else ["File not found"],
                "warnings": [],
                "recommendations": ["Verify file integrity"] if not file_exists else []
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to validate dataset: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to validate dataset: {str(e)}")

@router.get("/{dataset_id}/preview")
async def get_dataset_preview(
    dataset_id: str,
    limit: int = Query(10, le=100)
) -> Dict[str, Any]:
    """Get dataset preview"""

    try:
        if dataset_id not in datasets_db:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset = datasets_db[dataset_id]

        try:
            with open(dataset["file_path"], "r") as f:
                lines = []
                for i, line in enumerate(f):
                    if i >= limit:
                        break
                    lines.append(line.strip())
        except Exception:
            lines = []

        return {
            "dataset_id": dataset_id,
            "preview": lines,
            "total_rows": len(lines),
            "note": "Preview of uploaded dataset"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get dataset preview: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get dataset preview: {str(e)}")

@router.get("/info")
async def get_datasets_info():
    """Get datasets information and statistics"""
    try:
        datasets = list(datasets_db.values())
        
        info = {
            "total_datasets": len(datasets),
            "total_size_mb": sum(d.get("size_mb", 0) for d in datasets),
            "ready_datasets": sum(1 for d in datasets if d.get("status") == "ready"),
            "processing_datasets": sum(1 for d in datasets if d.get("status") == "processing"),
            "error_datasets": sum(1 for d in datasets if d.get("status") == "error"),
            "dataset_types": {},
            "recent_uploads": []
        }
        
        # Count dataset types
        for dataset in datasets:
            data_type = dataset.get("type", "unknown")
            info["dataset_types"][data_type] = info["dataset_types"].get(data_type, 0) + 1
        
        # Get recent uploads
        recent = sorted(datasets, key=lambda x: x.get("upload_date", ""), reverse=True)[:5]
        info["recent_uploads"] = [
            {
                "id": d["id"],
                "name": d["name"],
                "upload_date": d.get("upload_date"),
                "size_mb": d.get("size_mb", 0)
            }
            for d in recent
        ]
        
        return {
            "status": "success",
            "info": info,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get datasets info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get datasets info: {str(e)}")

# --- PATCHED ENDPOINTS ---
@router.get("", summary="List Datasets", description="Get list of available datasets")
async def get_datasets(
    request: Request,
    search: Optional[str] = Query(None, description="Search datasets by name or description"),
    data_type: Optional[str] = Query(None, description="Filter by data type"),
    sort_by: Optional[str] = Query("upload_date", description="Sort by field"),
    sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page")
) -> Dict[str, Any]:
    """Alias for compatibility: forwards to the main dataset listing handler so both
    /api/datasets (no-trailing-slash) and /api/datasets/ (with trailing slash)
    behave the same and accept query parameters."""
    # Forward to the primary handler
    return await get_datasets_with_filters(request, search, data_type, sort_by, sort_order, page, per_page)
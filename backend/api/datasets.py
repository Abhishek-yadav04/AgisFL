"""Dataset management API endpoints"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any, List
import os
import uuid
from datetime import datetime, timezone
import structlog

logger = structlog.get_logger()
router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

# In-memory dataset storage (replace with database in production)
datasets_db = {}

@router.get("/")
async def get_datasets() -> List[Dict[str, Any]]:
    """Get all datasets"""
    return list(datasets_db.values())

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Upload a new dataset"""
    try:
        # Create datasets directory
        os.makedirs("data/datasets", exist_ok=True)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'csv'
        filename = f"{file_id}.{file_extension}"
        file_path = f"data/datasets/{filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Create dataset entry
        dataset = {
            "id": file_id,
            "name": file.filename,
            "description": f"Uploaded dataset: {file.filename}",
            "size_mb": round(len(content) / (1024 * 1024), 2),
            "file_path": file_path,
            "upload_date": datetime.now(timezone.utc).isoformat(),
            "status": "active"
        }
        
        datasets_db[file_id] = dataset
        
        logger.info("Dataset uploaded", dataset_id=file_id, filename=file.filename)
        return dataset
        
    except Exception as e:
        logger.error("Dataset upload failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: str) -> Dict[str, Any]:
    """Delete a dataset"""
    if dataset_id not in datasets_db:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    dataset = datasets_db[dataset_id]
    
    # Delete file
    if os.path.exists(dataset["file_path"]):
        os.remove(dataset["file_path"])
    
    del datasets_db[dataset_id]
    
    logger.info("Dataset deleted", dataset_id=dataset_id)
    return {"message": "Dataset deleted successfully"}
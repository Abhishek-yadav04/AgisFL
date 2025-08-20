#!/usr/bin/env python3
"""
AgisFL Enterprise - Universal Runner
Runs anywhere with minimal dependencies
"""

import sys
import os
import subprocess
import json
from pathlib import Path

def install_minimal_deps():
    """Install only essential dependencies"""
    essential_deps = [
        "fastapi==0.109.0",
        "uvicorn[standard]==0.27.0", 
        "pydantic==2.9.0",
        "numpy==1.26.4",
        "scikit-learn==1.5.2",
        "structlog==23.2.0"
    ]
    
    for dep in essential_deps:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", dep])
        except subprocess.CalledProcessError:
            print(f"Warning: Failed to install {dep}")

def create_minimal_main():
    """Create minimal main.py if it doesn't exist"""
    main_content = '''
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgisFL Enterprise", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AgisFL Enterprise - Federated Learning IDS", "status": "operational"}

@app.get("/health")
async def health():
    return {"status": "healthy", "version": "4.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
'''
    
    if not Path("main.py").exists():
        with open("main.py", "w") as f:
            f.write(main_content)

def main():
    """Universal runner main function"""
    print("🚀 AgisFL Enterprise Universal Runner")
    print("=====================================")
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Install minimal dependencies
    print("📦 Installing minimal dependencies...")
    install_minimal_deps()
    
    # Create minimal main if needed
    create_minimal_main()
    
    # Run the application
    print("🎯 Starting AgisFL Enterprise...")
    try:
        import uvicorn
        from main import app
        uvicorn.run(app, host="0.0.0.0", port=8001)
    except ImportError:
        print("❌ Failed to import required modules")
        sys.exit(1)

if __name__ == "__main__":
    main()
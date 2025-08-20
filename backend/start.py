#!/usr/bin/env python3
"""
AgisFL Enterprise Standalone Launcher
Works in any Python environment without dependencies on project structure
"""

import sys
import os
import subprocess
import logging
from pathlib import Path

def setup_logging():
    """Setup basic logging"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    return logging.getLogger(__name__)

def check_python_version():
    """Check Python version compatibility"""
    if sys.version_info < (3, 9):
        raise RuntimeError("Python 3.9 or higher is required")

def install_dependencies(logger):
    """Install required dependencies"""
    logger.info("Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        logger.info("Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        raise

def main():
    """Main launcher function"""
    logger = setup_logging()
    
    try:
        logger.info("🚀 Starting AgisFL Enterprise Platform")
        
        # Check Python version
        check_python_version()
        logger.info(f"✅ Python {sys.version} detected")
        
        # Change to backend directory
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        logger.info(f"📁 Working directory: {backend_dir}")
        
        # Install dependencies if requirements.txt exists
        if Path("requirements.txt").exists():
            install_dependencies(logger)
        
        # Import and run the application
        logger.info("🎯 Launching application...")
        
        # Set environment variables
        os.environ.setdefault("PYTHONPATH", str(backend_dir))
        os.environ.setdefault("ENVIRONMENT", "production")
        
        # Import main application
        from main import app
        import uvicorn
        
        # Run the server
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8001,
            log_level="info",
            access_log=True
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Shutdown requested by user")
    except Exception as e:
        logger.error(f"❌ Application failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
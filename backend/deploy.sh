#!/bin/bash

# AgisFL Enterprise Deployment Script
# Production-ready deployment for any environment

set -e

echo "🚀 AgisFL Enterprise Deployment"
echo "================================"

# Configuration
APP_NAME="agisfl-enterprise"
PORT=${PORT:-8001}
ENVIRONMENT=${ENVIRONMENT:-production}
WORKERS=${WORKERS:-4}

# Create necessary directories
mkdir -p data models logs static

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations (if using Alembic)
if [ -f "alembic.ini" ]; then
    echo "🗄️ Running database migrations..."
    alembic upgrade head
fi

# Start application
echo "🎯 Starting AgisFL Enterprise..."
if [ "$ENVIRONMENT" = "development" ]; then
    python main.py
else
    gunicorn main:app \
        --worker-class uvicorn.workers.UvicornWorker \
        --workers $WORKERS \
        --bind 0.0.0.0:$PORT \
        --timeout 120 \
        --keep-alive 2 \
        --max-requests 1000 \
        --max-requests-jitter 100 \
        --access-logfile logs/access.log \
        --error-logfile logs/error.log \
        --log-level info
fi
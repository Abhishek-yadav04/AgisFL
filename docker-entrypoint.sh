#!/bin/bash
set -e

# AgisFL Enterprise Docker Entrypoint
# Handles initialization, database setup, and service startup

echo "🚀 Starting AgisFL Enterprise Platform v5.0.0"
echo "📅 $(date)"
echo "🌍 Environment: ${ENVIRONMENT:-production}"

# Function to wait for service
wait_for_service() {
    local service_name=$1
    local host=$2
    local port=$3
    local timeout=${4:-30}
    
    echo "⏳ Waiting for ${service_name} at ${host}:${port}..."
    
    for i in $(seq 1 $timeout); do
        if nc -z "$host" "$port" > /dev/null 2>&1; then
            echo "✅ ${service_name} is ready!"
            return 0
        fi
        echo "⏳ ${service_name} not ready, waiting... (${i}/${timeout})"
        sleep 1
    done
    
    echo "❌ ${service_name} not ready after ${timeout} seconds"
    return 1
}

# Wait for PostgreSQL
if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PORT" ]; then
    wait_for_service "PostgreSQL" "$DATABASE_HOST" "$DATABASE_PORT" 60
fi

# Wait for Redis
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    wait_for_service "Redis" "$REDIS_HOST" "$REDIS_PORT" 30
fi

# Run database migrations
echo "🔄 Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head || echo "⚠️ Database migrations failed, continuing..."
else
    echo "ℹ️ No Alembic configuration found, skipping migrations"
fi

# Create required directories
mkdir -p /app/logs /app/data/uploads /app/data/models /app/data/temp

# Set permissions
chmod 755 /app/logs /app/data
chmod 644 /app/config/* 2>/dev/null || true

echo "🔧 Configuration Summary:"
echo "   - Environment: ${ENVIRONMENT:-production}"
echo "   - Workers: ${WORKERS:-4}"
echo "   - Host: ${HOST:-0.0.0.0}"
echo "   - Port: ${PORT:-8000}"
echo "   - Log Level: ${LOG_LEVEL:-INFO}"
echo "   - Debug Mode: ${DEBUG:-false}"
echo "   - Metrics Enabled: ${ENABLE_PROM_METRICS:-true}"

# Handle different run modes
case "${1}" in
    "server"|"")
        echo "🌐 Starting AgisFL Enterprise Server..."
        exec python main.py
        ;;
    "worker")
        echo "👷 Starting AgisFL Worker..."
        exec python -m celery worker -A core.celery_app --loglevel=${LOG_LEVEL:-info}
        ;;
    "scheduler")
        echo "⏰ Starting AgisFL Scheduler..."
        exec python -m celery beat -A core.celery_app --loglevel=${LOG_LEVEL:-info}
        ;;
    "migrate")
        echo "🔄 Running database migrations only..."
        if [ -f "alembic.ini" ]; then
            exec alembic upgrade head
        else
            echo "❌ No Alembic configuration found"
            exit 1
        fi
        ;;
    "shell")
        echo "🐚 Starting interactive shell..."
        exec /bin/bash
        ;;
    "test")
        echo "🧪 Running tests..."
        exec python -m pytest tests/ -v
        ;;
    *)
        echo "❓ Unknown command: $1"
        echo "Available commands: server (default), worker, scheduler, migrate, shell, test"
        exit 1
        ;;
esac
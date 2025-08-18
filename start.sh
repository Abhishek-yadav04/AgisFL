#!/bin/bash

# AgisFL Enterprise - Universal Startup Script for Linux/macOS

# --- Configuration ---
export COLLEGE_PROJECT=true
export JWT_SECRET="agisfl-college-project-2025-secure-jwt-secret-key"

# --- Helper Functions ---
print_header() {
    echo "========================================"
    echo "    AgisFL Enterprise Platform v1.1"
    echo "    Universal Startup Script"
    echo "========================================"
    echo "[USER] Running in standard mode"
    echo "[USER] Real packet capture: SIMULATION"
    echo "[USER] System monitoring: LIMITED"
    echo "[USER] College Project Mode: ENABLED"
    echo
}

function build_frontend() {
    pushd frontend > /dev/null 2>&1 || { echo "[ERROR] Frontend directory not found!"; exit 1; }
    if [ ! -d "node_modules" ]; then
        echo "[FRONTEND] Installing dependencies (first run)..."
        npm install || { echo "[ERROR] npm install failed"; popd > /dev/null; exit 1; }
    else
        echo "[FRONTEND] Dependencies present (node_modules). Skipping npm install."
    fi
    echo "[FRONTEND] Building production bundle..."
    npm run build || { echo "[ERROR] Frontend build failed"; popd > /dev/null; exit 1; }
    popd > /dev/null
    return 0
}


# --- Main Script ---
print_header

echo "Choose startup mode:"
echo "1. Quick Start (Core features, fastest startup)"
echo "2. Production Mode (Full enterprise features)"
echo "3. Development Mode (Hot reload enabled)"
echo "4. Test Mode (Run comprehensive tests)"
echo "5. Desktop Application (Pure desktop app with Electron)"
echo

read -p "Enter choice (1-5) or press Enter for Quick Start: " MODE

# Default to Quick Start if no input
if [ -z "$MODE" ]; then
    MODE=1
fi

# --- Setup Phase ---
cd "$(dirname "$0")" # Change to script's directory

echo
echo "[SETUP] Stopping existing processes..."
killall python python3 uvicorn electron > /dev/null 2>&1
sleep 2

# Setup virtual environment
if [ ! -f "venv/bin/activate" ]; then
    echo "[SETUP] Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to create virtual environment"
        echo "[ERROR] Please ensure Python 3.8+ is installed"
        exit 1
    fi
fi

echo "[SETUP] Activating virtual environment..."
source venv/bin/activate

# --- Installation Phase ---
case "$MODE" in
    1)
        echo "[INSTALL] Installing core dependencies (quick mode)..."
        pip install -q fastapi uvicorn pydantic scikit-learn numpy psutil websockets python-dotenv
        ;;
    2)
        echo "[INSTALL] Installing production dependencies..."
        pip install -q --upgrade pip
        echo "[INSTALL] Installing core packages first..."
        pip install -q fastapi uvicorn pydantic scikit-learn numpy psutil websockets python-dotenv requests aiofiles
        echo "[INSTALL] Installing additional packages..."
        pip install -q jinja2 python-multipart rich click
        echo "[INSTALL] Installing ML packages..."
        pip install -q pandas matplotlib seaborn plotly || echo "[WARNING] Some ML packages failed, continuing..."
        ;;
    3)
        echo "[INSTALL] Installing development dependencies..."
        pip install -q --upgrade pip
        pip install -q -r backend/requirements_production.txt
        pip install -q black flake8 mypy pytest-watch
        ;;
    4)
        echo "[INSTALL] Installing test dependencies..."
        pip install -q --upgrade pip
        pip install -q -r backend/requirements_production.txt
        echo "[TEST] Running comprehensive tests..."
        (cd backend && python -m pytest test_comprehensive.py -v --tb=short)
        if [ $? -ne 0 ]; then
            echo "[ERROR] Tests failed! Check output above."
            exit 1
        fi
        echo "[SUCCESS] All tests passed!"
        ;;
    5)
        echo "[INSTALL] Installing desktop application dependencies..."
        pip install -q -r frontend/requirements.txt
        ;;
esac


# --- Application Start Phase ---
export PYTHONPATH=$(pwd)/backend
export ENVIRONMENT=production
export ADMIN_MODE=${ADMIN_MODE}

# Create logs directory
mkdir -p backend/logs

echo
echo "========================================"
echo "    Starting AgisFL"
echo "========================================"
echo "Mode: $MODE"
echo "Admin: $ADMIN_MODE"
echo "Dashboard: http://127.0.0.1:8001/app"
echo "API Docs: http://127.0.0.1:8001/docs"
echo "Logs: backend/logs/agisfl_enterprise.log"
echo "========================================"
echo

# Build frontend if not skipped
if [ -n "$SKIP_FRONTEND" ]; then
    echo "[FRONTEND] Skipping build (SKIP_FRONTEND set)"
else
    if [ -n "$FRONTEND_BUILT" ]; then
        echo "[FRONTEND] Already built in this run. Skipping duplicate build."
    else
        build_frontend
        if [ $? -ne 0 ]; then
            exit 1
        fi
        export FRONTEND_BUILT=1
    fi
fi

pushd backend > /dev/null 2>&1 || { echo "[ERROR] Backend directory not found!"; exit 1; }

# Start based on mode
if [ "$MODE" == "3" ]; then
    echo "[DEV] Starting with hot reload..."
    uvicorn main:app --host 127.0.0.1 --port 8001 --reload --log-level info
elif [ "$MODE" == "5" ]; then
    echo "[DESKTOP] Starting desktop application..."
    popd > /dev/null
    pushd frontend > /dev/null
    if [ -f "dist-electron/linux-unpacked/agisfl-enterprise" ]; then
        echo "[DESKTOP] Starting built desktop application..."
        ./dist-electron/linux-unpacked/agisfl-enterprise &
    elif [ -f "node_modules/.bin/electron" ]; then
        echo "[DESKTOP] Starting development desktop application..."
        npm run electron:dev
    else
        echo "[ERROR] Desktop application not built. Building now..."
        npm run electron:build
        if [ -f "dist-electron/linux-unpacked/agisfl-enterprise" ]; then
            echo "[DESKTOP] Starting built desktop application..."
            ./dist-electron/linux-unpacked/agisfl-enterprise &
        else
            echo "[ERROR] Failed to build desktop application"
            exit 1
        fi
    fi
    popd > /dev/null
else
    echo "[PROD] Starting production server..."
    if command -v uvicorn &> /dev/null; then
        uvicorn main:app --host 127.0.0.1 --port 8001 --workers 1 --log-level info
    else
        python3 main.py
    fi
fi

popd > /dev/null

# --- End ---
echo
echo "========================================"
echo "AgisFL Enterprise Platform Stopped"
echo "========================================"
if [ "$MODE" == "1" ]; then
    echo "Thank you for using AgisFL Enterprise!"
fi

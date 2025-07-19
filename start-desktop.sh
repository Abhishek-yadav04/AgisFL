
#!/bin/bash

# AgisFL Desktop Application Launcher
echo "=================================================="
echo "  AgisFL - Federated Learning IDS"
echo "  Desktop Application Launcher"
echo "=================================================="
echo

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js 16+ from https://nodejs.org"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available"
    echo "Please ensure npm is installed with Node.js"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Check if Electron is available
if [ -d "node_modules/electron" ]; then
    echo "🚀 Starting AgisFL Desktop Application..."
    echo
    
    # Build the application first
    echo "🔨 Building application..."
    npm run build 2>/dev/null
    
    # Start Electron
    npm run electron
else
    echo "⚠️  Electron not found, starting in web mode..."
    echo "🌐 Starting development server..."
    npm run dev
fi

#!/bin/bash

echo "🚀 Setting up AgisFL - Federated Learning Intrusion Detection System"
echo "=================================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip3 install -r requirements.txt 2>/dev/null || pip3 install flask flask-socketio psutil scapy pandas numpy scikit-learn

# Install SQLite dependency
echo "💾 Installing SQLite support..."
npm install better-sqlite3

# Build the application
echo "🔨 Building application..."
npm run build

# Create desktop shortcut (Linux)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    cat > ~/Desktop/AgisFL.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=AgisFL
Comment=Federated Learning Intrusion Detection System
Exec=$(pwd)/start.sh
Icon=$(pwd)/client/public/favicon.ico
Path=$(pwd)
Terminal=false
StartupNotify=true
EOF
    chmod +x ~/Desktop/AgisFL.desktop
    echo "🖥️  Desktop shortcut created"
fi

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Starting AgisFL..."
npm run dev &
sleep 3
echo "AgisFL is running at http://localhost:5000"
echo "Press Ctrl+C to stop"
wait
EOF

chmod +x start.sh

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "🚀 To start AgisFL:"
echo "   ./start.sh"
echo ""
echo "🌐 Application will be available at: http://localhost:5000"
echo ""
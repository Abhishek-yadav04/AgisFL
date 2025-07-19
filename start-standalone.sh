
#!/bin/bash

echo "Starting AgisFL Federated Learning System..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    echo "Please install Python from https://python.org/"
    exit 1
fi

echo "Installing dependencies..."
npm install
pip3 install flask flask-socketio psutil scapy pandas numpy scikit-learn

echo "Building application..."
npm run build

echo "Starting AgisFL..."
echo
echo "Dashboard will be available at: http://localhost:5000"
echo "Default credentials: admin / password123"
echo

npm start

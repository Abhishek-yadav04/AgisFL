#!/bin/bash

# AgisFL - Federated Learning Intrusion Detection System
# Cross-platform Installation Script for Unix/Linux/macOS

set -e

echo "🛡️  AgisFL - Enterprise-Grade FL-IDS Setup"
echo "==========================================="

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Utility functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get >/dev/null 2>&1; then
            DISTRO="ubuntu"
        elif command -v yum >/dev/null 2>&1; then
            DISTRO="centos"
        elif command -v pacman >/dev/null 2>&1; then
            DISTRO="arch"
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        DISTRO="macos"
    else
        OS="unknown"
        DISTRO="unknown"
    fi

    print_status "Detected OS: $OS ($DISTRO)"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."

    case "$DISTRO" in
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv nodejs npm build-essential libpcap-dev git curl wget
            ;;
        "centos")
            sudo yum update -y
            sudo yum install -y python3 python3-pip nodejs npm gcc-c++ libpcap-devel git curl wget
            ;;
        "arch")
            sudo pacman -Sy
            sudo pacman -S --noconfirm python python-pip nodejs npm base-devel libpcap git curl wget
            ;;
        "macos")
            if ! command_exists brew; then
                print_status "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            brew install python3 node libpcap git curl wget
            ;;
        *)
            print_warning "Unknown distribution. Please install manually: python3, nodejs, libpcap-dev, git"
            ;;
    esac

    print_success "System dependencies installed"
}

# Setup Python environment
setup_python_env() {
    print_status "Setting up Python virtual environment..."

    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Virtual environment created"
    else
        print_warning "Virtual environment already exists"
    fi

    # Activate virtual environment
    source venv/bin/activate

    # Upgrade pip
    pip install --upgrade pip

    # Install Python dependencies
    if [ -f "requirements.txt" ]; then
        print_status "Installing Python dependencies..."
        pip install -r requirements.txt
        print_success "Python dependencies installed"
    else
        print_status "Installing core Python dependencies..."
        pip install flask flask-socketio flask-cors pandas numpy scikit-learn psutil requests cryptography
        print_success "Core Python dependencies installed"
    fi
}

# Setup Node.js environment
setup_nodejs_env() {
    print_status "Setting up Node.js environment..."

    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -c2-)
        print_status "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 16+ manually."
        exit 1
    fi

    # Install client dependencies
    if [ -d "client" ]; then
        cd client
        print_status "Installing frontend dependencies..."
        npm install
        print_success "Frontend dependencies installed"
        cd ..
    fi

    # Install root dependencies if package.json exists
    if [ -f "package.json" ]; then
        print_status "Installing root dependencies..."
        npm install

        echo "Installing Electron for desktop app..."
        npm install --save-dev electron electron-builder || echo "Warning: Failed to install Electron, continuing anyway..."
    fi
}

# Create necessary directories
setup_directories() {
    print_status "Creating necessary directories..."

    mkdir -p logs
    mkdir -p data
    mkdir -p models
    mkdir -p temp
    mkdir -p backups

    print_success "Directories created"
}

# Setup database (SQLite for platform independence)
setup_database() {
    print_status "Setting up database..."

    # Create SQLite database if it doesn't exist
    if [ ! -f "data/agisfl.db" ]; then
        python3 -c "
import sqlite3
import os

os.makedirs('data', exist_ok=True)
conn = sqlite3.connect('data/agisfl.db')
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
)
''')

# Create system_metrics table
cursor.execute('''
CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cpu_percent REAL,
    memory_percent REAL,
    disk_percent REAL,
    network_bytes_sent INTEGER,
    network_bytes_recv INTEGER,
    active_threats INTEGER DEFAULT 0
)
''')

# Create network_packets table
cursor.execute('''
CREATE TABLE IF NOT EXISTS network_packets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_ip TEXT,
    dest_ip TEXT,
    protocol TEXT,
    packet_size INTEGER,
    is_suspicious BOOLEAN DEFAULT FALSE,
    threat_score REAL DEFAULT 0.0
)
''')

# Create fl_models table
cursor.execute('''
CREATE TABLE IF NOT EXISTS fl_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accuracy REAL,
    participant_count INTEGER,
    training_round INTEGER,
    model_data TEXT
)
''')

conn.commit()
conn.close()
print('SQLite database initialized successfully')
"
        print_success "SQLite database initialized"
    else
        print_warning "Database already exists"
    fi
}

# Create environment configuration
setup_config() {
    print_status "Creating configuration files..."

    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOL
# AgisFL Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=sqlite:///data/agisfl.db

# Security Settings
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# FL-IDS Settings
FL_MIN_CLIENTS=2
FL_ROUNDS_PER_TRAINING=10
THREAT_THRESHOLD=0.7
PRIVACY_EPSILON=1.0

# Monitoring Settings
MONITOR_INTERVAL=5
PACKET_CAPTURE_DURATION=10
LOG_LEVEL=INFO
EOL
        print_success "Configuration file created"
    else
        print_warning "Configuration file already exists"
    fi

    # Create systemd service file (Linux only)
    if [ "$OS" = "linux" ]; then
        sudo tee /etc/systemd/system/agisfl.service > /dev/null << EOL
[Unit]
Description=AgisFL - Federated Learning Intrusion Detection System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PWD
Environment=NODE_ENV=production
ExecStart=$PWD/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

        sudo systemctl daemon-reload
        print_success "Systemd service created"
    fi
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."

    # Create start script
    cat > start.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")"

echo "🛡️  Starting AgisFL System..."

# Activate virtual environment
source venv/bin/activate

# Start the application
if [ -f "app.py" ]; then
    echo "Starting Flask backend..."
    python app.py &
    BACKEND_PID=$!
fi

# Start frontend (if in development mode)
if [ "$NODE_ENV" != "production" ] && [ -d "client" ]; then
    echo "Starting React frontend..."
    cd client
    npm start &
    FRONTEND_PID=$!
    cd ..
fi

echo "AgisFL is running!"
echo "Backend PID: $BACKEND_PID"
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Frontend PID: $FRONTEND_PID"
fi

# Wait for interrupt
wait
EOL

    chmod +x start.sh

    # Create stop script
    cat > stop.sh << 'EOL'
#!/bin/bash
echo "🛑 Stopping AgisFL System..."

# Kill Python processes
pkill -f "python.*app.py"

# Kill Node processes (if any)
pkill -f "node.*react-scripts"

echo "AgisFL stopped"
EOL

    chmod +x stop.sh

    print_success "Startup scripts created"
}

# Run tests
run_tests() {
    print_status "Running system tests..."

    source venv/bin/activate

    # Test Python imports
    python3 -c "
try:
    import flask, pandas, numpy, sklearn, psutil
    print('✅ All Python dependencies imported successfully')
except ImportError as e:
    print(f'❌ Import error: {e}')
    exit(1)
"

    # Test Node.js setup
    if command_exists node && [ -d "client" ]; then
        cd client
        if npm list >/dev/null 2>&1; then
            print_success "Frontend dependencies verified"
        else
            print_warning "Some frontend dependencies may be missing"
        fi
        cd ..
    fi

    # Test database connection
    python3 -c "
import sqlite3
try:
    conn = sqlite3.connect('data/agisfl.db')
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM users')
    conn.close()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database error: {e}')
    exit(1)
"

    print_success "System tests completed"
}

# Main installation function
main() {
    echo -e "${CYAN}"
    cat << "EOF"
    ░█▀▀█ █▀▀▀ ─▀─ █▀▀ █▀▀ █ 　 
    ░█▄▄█ █░▀█ ▀█▀ ▀▀█ █▀▀ █ 　 
    ░█▄▄▄ ▀▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ 

    Enterprise-Grade Federated Learning
    Intrusion Detection System
EOF
    echo -e "${NC}\n"

    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended for security reasons"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Detect operating system
    detect_os

    # Install system dependencies
    install_system_deps

    # Setup Python environment
    setup_python_env

    # Setup Node.js environment
    setup_nodejs_env

    # Create directories
    setup_directories

    # Setup database
    setup_database

    # Setup configuration
    setup_config

    # Create startup scripts
    create_startup_scripts

    # Run tests
    run_tests

    echo
    print_success "🎉 AgisFL installation completed successfully!"
    echo
    echo -e "${GREEN}Next steps:${NC}"
    echo "1. Review the configuration in .env file"
    echo "2. Start the system with: ${YELLOW}./start.sh${NC}"
    echo "3. Access the dashboard at: ${CYAN}http://localhost:5000${NC}"
    echo "4. Check logs in the logs/ directory"
    echo
    echo -e "${BLUE}For production deployment:${NC}"
    echo "• Configure firewall settings"
    echo "• Set up SSL certificates"
    echo "• Configure database backups"
    echo "• Review security settings"
    echo
    echo -e "${PURPLE}Documentation:${NC} README.md"
    echo -e "${PURPLE}Support:${NC} Check the GitHub repository for issues and updates"
    echo
}

# Run main installation
main "$@"
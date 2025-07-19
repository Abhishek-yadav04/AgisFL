# AgisFL - Federated Learning Intrusion Detection System

A real-time, desktop-based intrusion detection system that leverages federated learning for distributed threat detection across multiple clients while preserving privacy.

## 🚀 Features

- **Real-time Network Monitoring**: Live packet capture and analysis using system APIs
- **Federated Learning**: Distributed machine learning for collaborative threat detection
- **Cross-Platform Desktop App**: Electron-based application for Windows and Linux
- **Live Threat Detection**: Real-time threat identification and alerting
- **System Metrics**: Comprehensive system performance monitoring
- **Modern UI**: React-based dashboard with real-time data visualization

## 📋 Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **Administrator/Root privileges** (required for network monitoring)

## 🛠️ Installation

### Windows
```bash
# Run the automated setup script
setup.bat
```

### Linux
```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

### Manual Installation
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install flask flask-socketio flask-cors pandas numpy scikit-learn psutil requests cryptography

# Install Electron for desktop app
npm install --save-dev electron electron-builder

# Create necessary directories
mkdir -p logs data models temp backups
```

## 🚀 Running the Application

### Desktop Application (Recommended)
```bash
# Start the desktop app
npm run electron

# Or use the batch/shell script
start-desktop.bat    # Windows
./start-desktop.sh   # Linux
```

### Development Mode
```bash
# Start development server
npm run dev

# Or use the main start script
start.bat    # Windows  
./start.sh   # Linux
```

### Production Web Mode
```bash
# Build and start production server
npm run build
npm start
```

## 📱 Usage

1. **Launch Application**: Run the desktop app or access via web browser at `http://localhost:5000`

2. **Dashboard Overview**: 
   - System metrics (CPU, Memory, Disk, Network)
   - Real-time threat detection
   - Network packet analysis
   - Federated learning client status

3. **Navigation**:
   - **Dashboard**: System overview and key metrics
   - **Network Analysis**: Real-time network monitoring and packet capture
   - **Threat Detection**: Active threats and security alerts
   - **Federated Learning**: FL client management and model training

4. **Real-time Features**:
   - Live system monitoring every 5 seconds
   - Network packet capture and analysis
   - Automatic threat detection and alerting
   - FL model training progress tracking

## 🏗️ Architecture

```
AgisFL/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   └── hooks/         # Custom React hooks
├── server/                # Node.js backend
│   ├── services/          # Monitoring services
│   ├── storage.ts         # Data management
│   └── routes.ts          # API endpoints
├── shared/                # Shared TypeScript definitions
├── electron-main.js       # Electron main process
└── setup scripts          # Platform setup scripts
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security
JWT_SECRET=your-secure-secret
SESSION_SECRET=your-session-secret

# Monitoring Settings
MONITOR_INTERVAL=5
PACKET_CAPTURE_DURATION=10
LOG_LEVEL=INFO

# FL Settings
FL_MIN_CLIENTS=2
FL_ROUNDS_PER_TRAINING=10
THREAT_THRESHOLD=0.7
```

### Database
- Uses SQLite for local data storage
- Database file: `data/agisfl.db`
- Automatically initialized on first run

## 🔒 Security Features

- JWT-based authentication
- Input sanitization
- Secure WebSocket connections  
- Network traffic encryption
- Localhost-only binding by default
- Admin privilege checks for system monitoring

## 🧪 System Requirements

### Minimum Requirements
- **OS**: Windows 10+ or Linux (Ubuntu 18.04+)
- **RAM**: 4GB
- **CPU**: Dual-core 2.0GHz
- **Disk**: 2GB free space
- **Network**: Active network interface

### Recommended Requirements
- **OS**: Windows 11 or Linux (Ubuntu 20.04+)
- **RAM**: 8GB+
- **CPU**: Quad-core 2.5GHz+
- **Disk**: 5GB+ free space
- **Network**: Gigabit Ethernet

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" errors**:
- Run as Administrator (Windows) or with sudo (Linux)
- Network monitoring requires elevated privileges

**Port 5000 already in use**:
- Change PORT in .env file
- Stop other applications using port 5000

**Module not found errors**:
- Run `npm install` to reinstall dependencies
- Check Node.js version (16+ required)

**Database connection issues**:
- Ensure `data/` directory exists
- Check file permissions on `data/agisfl.db`

### Logs
- Application logs: `logs/` directory
- Console output for real-time debugging
- WebSocket connection status in browser dev tools

## 🤝 Development

### Adding New Features
1. Backend: Add services to `server/services/`
2. Frontend: Add components to `client/src/components/`
3. API: Update routes in `server/routes.ts`
4. Types: Update schemas in `shared/schema.ts`

### Building for Distribution
```bash
# Build Electron app
npm run electron:build

# Create installers
npm run dist
```

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and support:
1. Check the troubleshooting section
2. Review logs in `logs/` directory
3. Create an issue on GitHub with system details

## 🔄 Version History

- **v1.0.0**: Initial release with core FL-IDS functionality
  - Real-time network monitoring
  - Federated learning integration
  - Cross-platform desktop support
  - Modern React-based UI

---

**AgisFL** - Securing networks through collaborative intelligence
```# Run the automated setup script
setup.bat
```

### Linux
```bash
# Make script executable and run
chmod +x setup.sh
./setup.sh
```

### Manual Installation
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install flask flask-socketio flask-cors pandas numpy scikit-learn psutil requests cryptography

# Install Electron for desktop app
npm install --save-dev electron electron-builder

# Create necessary directories
mkdir -p logs data models temp backups
```

## 🚀 Running the Application

### Desktop Application (Recommended)
```bash
# Start the desktop app
npm run electron

# Or use the batch/shell script
start-desktop.bat    # Windows
./start-desktop.sh   # Linux
```

### Development Mode
```bash
# Start development server
npm run dev

# Or use the main start script
start.bat    # Windows  
./start.sh   # Linux
```

### Production Web Mode
```bash
# Build and start production server
npm run build
npm start
```

## 📱 Usage

1. **Launch Application**: Run the desktop app or access via web browser at `http://localhost:5000`

2. **Dashboard Overview**: 
   - System metrics (CPU, Memory, Disk, Network)
   - Real-time threat detection
   - Network packet analysis
   - Federated learning client status

3. **Navigation**:
   - **Dashboard**: System overview and key metrics
   - **Network Analysis**: Real-time network monitoring and packet capture
   - **Threat Detection**: Active threats and security alerts
   - **Federated Learning**: FL client management and model training

4. **Real-time Features**:
   - Live system monitoring every 5 seconds
   - Network packet capture and analysis
   - Automatic threat detection and alerting
   - FL model training progress tracking

## 🏗️ Architecture

```
AgisFL/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Application pages
│   │   └── hooks/         # Custom React hooks
├── server/                # Node.js backend
│   ├── services/          # Monitoring services
│   ├── storage.ts         # Data management
│   └── routes.ts          # API endpoints
├── shared/                # Shared TypeScript definitions
├── electron-main.js       # Electron main process
└── setup scripts          # Platform setup scripts
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file:
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security
JWT_SECRET=your-secure-secret
SESSION_SECRET=your-session-secret

# Monitoring Settings
MONITOR_INTERVAL=5
PACKET_CAPTURE_DURATION=10
LOG_LEVEL=INFO

# FL Settings
FL_MIN_CLIENTS=2
FL_ROUNDS_PER_TRAINING=10
THREAT_THRESHOLD=0.7
```

### Database
- Uses SQLite for local data storage
- Database file: `data/agisfl.db`
- Automatically initialized on first run

## 🔒 Security Features

- JWT-based authentication
- Input sanitization
- Secure WebSocket connections  
- Network traffic encryption
- Localhost-only binding by default
- Admin privilege checks for system monitoring

## 🧪 System Requirements

### Minimum Requirements
- **OS**: Windows 10+ or Linux (Ubuntu 18.04+)
- **RAM**: 4GB
- **CPU**: Dual-core 2.0GHz
- **Disk**: 2GB free space
- **Network**: Active network interface

### Recommended Requirements
- **OS**: Windows 11 or Linux (Ubuntu 20.04+)
- **RAM**: 8GB+
- **CPU**: Quad-core 2.5GHz+
- **Disk**: 5GB+ free space
- **Network**: Gigabit Ethernet

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" errors**:
- Run as Administrator (Windows) or with sudo (Linux)
- Network monitoring requires elevated privileges

**Port 5000 already in use**:
- Change PORT in .env file
- Stop other applications using port 5000

**Module not found errors**:
- Run `npm install` to reinstall dependencies
- Check Node.js version (16+ required)

**Database connection issues**:
- Ensure `data/` directory exists
- Check file permissions on `data/agisfl.db`

### Logs
- Application logs: `logs/` directory
- Console output for real-time debugging
- WebSocket connection status in browser dev tools

## 🤝 Development

### Adding New Features
1. Backend: Add services to `server/services/`
2. Frontend: Add components to `client/src/components/`
3. API: Update routes in `server/routes.ts`
4. Types: Update schemas in `shared/schema.ts`

### Building for Distribution
```bash
# Build Electron app
npm run electron:build

# Create installers
npm run dist
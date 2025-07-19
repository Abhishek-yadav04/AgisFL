# 🛡️ AgisFL - Federated Learning Intrusion Detection System

**Enterprise-grade cybersecurity monitoring with real-time threat detection and federated learning capabilities.**

![AgisFL Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Cross--Platform-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

### Automated Installation

#### Windows
```bash
# Download and run setup
curl -o setup.bat https://your-repo/setup.bat
setup.bat
```

#### Linux/macOS
```bash
# Download and run setup
curl -o setup.sh https://your-repo/setup.sh
chmod +x setup.sh
./setup.sh
```

### Manual Installation

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/AgisFL.git
   cd AgisFL
   ```

2. **Install Dependencies**
   ```bash
   # Node.js dependencies
   npm install

   # Python dependencies
   pip install flask flask-socketio psutil scapy pandas numpy scikit-learn jsonwebtoken

   # Additional packages
   npm install jsonwebtoken @types/jsonwebtoken
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Application**
   ```bash
   npm run dev
   ```

## 🔐 Default Credentials

### Admin Access
- **Username:** admin
- **Password:** password123

### Guest Access
- Click "Continue as Guest" for demo mode

## 🖥️ Desktop Application

### Electron Desktop App
```bash
# Install Electron
npm install electron electron-builder

# Start desktop app
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
   - FL model training coordination

## 🔧 Features

### 🛡️ Security Monitoring
- **Real-time Threat Detection**: Advanced pattern recognition for cyber threats
- **Network Traffic Analysis**: Deep packet inspection with Scapy
- **System Resource Monitoring**: CPU, memory, disk, and network metrics
- **Alert Management**: Intelligent notification system with severity filtering

### 🧠 Federated Learning
- **Distributed Training**: Coordinate ML model training across multiple clients
- **Privacy-Preserving**: Differential privacy and secure aggregation
- **Byzantine Fault Tolerance**: Robust against malicious participants
- **Model Versioning**: Track and manage model iterations

### 🖥️ User Interface
- **Cybersecurity Theme**: Dark mode optimized for SOC environments
- **Real-time Updates**: Live data via WebSocket connections
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Interactive Charts**: Dynamic visualization of metrics and threats

### 🔗 Integration
- **Cross-Platform**: Windows, Linux, macOS support
- **SQLite Database**: Lightweight, embedded database
- **REST API**: Full API access for automation
- **WebSocket Support**: Real-time bidirectional communication

## 🏗️ Architecture

```
AgisFL/
├── client/          # React frontend
├── server/          # Node.js/Express backend
├── scripts/         # Python FL engine
├── shared/          # Shared TypeScript schemas
└── electron/        # Desktop app configuration
```

### Technology Stack
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSockets
- **ML Engine**: Python, scikit-learn, pandas
- **Database**: SQLite
- **Monitoring**: psutil, Scapy
- **Desktop**: Electron

## 🔒 Security

- **Network Monitoring**: Real-time packet capture and analysis
- **Threat Intelligence**: ML-based threat detection algorithms
- **Access Control**: Role-based authentication system
- **Data Encryption**: Secure communication protocols
- **Privacy Protection**: Federated learning with differential privacy

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
npm install
pip install -r requirements.txt
```

**WebSocket connection failed**
- Ensure port 5000 is available
- Check firewall settings
- Restart the application

**Database errors**
```bash
# Reset database
rm agisfl.db
npm run dev  # Will recreate database
```

### Performance Optimization

**High CPU usage**
- Reduce monitoring frequency in settings
- Limit packet capture buffer size
- Close unused browser tabs

**Memory issues**
- Restart application periodically
- Monitor for memory leaks in dev tools
- Increase system swap space

## 📊 Monitoring & Analytics

### Key Metrics
- **System Performance**: CPU, Memory, Disk I/O
- **Network Activity**: Bandwidth, Packet rates, Connections
- **Security Events**: Threats detected, Alerts generated
- **FL Training**: Model accuracy, Client participation

### Dashboards
- **Executive Summary**: High-level security posture
- **Technical Details**: Deep-dive metrics and logs
- **Threat Intelligence**: Attack patterns and trends
- **Performance Monitoring**: System health metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/AgisFL/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/AgisFL/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/AgisFL/discussions)

---

**Made with ❤️ for cybersecurity professionals**
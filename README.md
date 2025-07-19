
# AgisFL - Federated Learning Intrusion Detection System

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/agisfl/agisfl)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Cross--Platform-orange.svg)](PLATFORM_GUIDE.md)

## 🎯 Overview

AgisFL is an enterprise-grade Federated Learning Intrusion Detection System that combines advanced cybersecurity monitoring with privacy-preserving machine learning. Built for production environments, it provides real-time threat detection while maintaining data privacy across distributed networks.

### 🏆 Key Features

- **Real-time Network Monitoring**: Live packet capture and analysis
- **AI-Powered Threat Detection**: Machine learning-based intrusion detection
- **Federated Learning**: Privacy-preserving distributed model training
- **Enterprise Security**: Multi-factor authentication and role-based access
- **Cross-Platform Support**: Windows, Linux, macOS compatibility
- **Professional Dashboard**: Modern React-based interface
- **WebSocket Integration**: Real-time data streaming
- **Production Ready**: Scalable architecture with error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.8+ (optional, for ML features)
- 4GB RAM minimum (8GB recommended)
- Modern web browser

### Installation

1. **Clone and Setup**
   ```bash
   git clone https://github.com/agisfl/agisfl.git
   cd agisfl
   node setup-universal.js
   ```

2. **Start Application**
   ```bash
   # Production mode
   npm run build && npm start
   
   # Development mode  
   npm run dev
   ```

3. **Access Dashboard**
   - URL: http://localhost:5000
   - Username: `admin`
   - Password: `password123`

### Docker Deployment (Alternative)

```bash
docker build -t agisfl .
docker run -p 5000:5000 agisfl
```

## 🖥️ Usage Guide

### Authentication

**Admin Login:**
- Username: `admin`
- Password: `password123` 
- MFA: Check console for 6-digit code

**Guest Access:**
- Click "Continue as Guest" for read-only demo mode

### Dashboard Features

1. **System Monitoring**
   - CPU, Memory, Disk, Network metrics
   - Real-time performance graphs
   - System health indicators

2. **Threat Detection**
   - Active threat monitoring
   - ML-powered anomaly detection
   - Automated mitigation responses

3. **Network Analysis**
   - Live packet capture
   - Protocol analysis
   - Traffic pattern recognition

4. **Federated Learning**
   - Distributed client management
   - Model training coordination
   - Privacy-preserving updates

## 🏗️ Architecture

```
AgisFL/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Application pages
│   │   └── hooks/       # Custom React hooks
├── server/          # Node.js backend
│   ├── services/    # Core monitoring services
│   ├── routes.ts    # API endpoints
│   └── websocket.ts # Real-time communication
├── shared/          # Common schemas
└── docs/           # Documentation
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, WebSockets, JWT
- **Database**: PostgreSQL with Drizzle ORM
- **ML Engine**: Python, scikit-learn (optional)
- **Monitoring**: Real-time system metrics
- **Security**: Enterprise authentication, MFA

## 🔒 Security Features

- **Authentication**: JWT-based with MFA support
- **Authorization**: Role-based access control
- **Rate Limiting**: Protection against brute force
- **Data Encryption**: Secure communication protocols
- **Privacy Protection**: Federated learning with differential privacy
- **Audit Logging**: Comprehensive security logging

## 📊 Monitoring Capabilities

### Real-time Metrics
- **System**: CPU, Memory, Disk, Network I/O
- **Network**: Packet analysis, traffic monitoring
- **Security**: Threat detection, anomaly scoring
- **Performance**: Response times, throughput

### ML-Powered Detection
- **Behavioral Analysis**: Network pattern recognition
- **Anomaly Detection**: Statistical and ML-based
- **Threat Classification**: Multi-class threat identification
- **Automated Response**: Intelligent mitigation

## 🌐 Deployment Options

### Development
```bash
npm run dev  # Hot reload enabled
```

### Production
```bash
npm run build && npm start
```

### Platform-Specific
- **Windows**: `start.bat`
- **Linux/macOS**: `./start.sh`
- **Desktop App**: `npm run electron`

## 📱 Cross-Platform Support

AgisFL runs seamlessly across multiple platforms:

- **Web Application**: Any modern browser
- **Desktop Application**: Electron-based native app
- **Server Deployment**: Linux, Windows, macOS servers
- **Cloud Platforms**: Docker, Kubernetes ready

## 🧪 Testing

```bash
# Run all tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint

# Security audit
npm audit
```

## 📚 Documentation

- [User Manual](docs/USER_MANUAL.md) - Complete usage guide
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production deployment
- [Platform Guide](PLATFORM_GUIDE.md) - Cross-platform setup
- [API Documentation](docs/API.md) - Backend API reference

## 🐛 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check dependencies
npm install
node --version  # Requires 18+

# Reset database
rm agisfl.db && npm run dev
```

**WebSocket connection failed:**
- Ensure port 5000 is available
- Check firewall settings
- Verify network connectivity

**Performance issues:**
- Monitor system resources
- Reduce monitoring frequency
- Close unused browser tabs

### Support

- Check [Issues](https://github.com/agisfl/agisfl/issues)
- Review [Documentation](docs/)
- Contact support team

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React and Node.js communities
- Cybersecurity research community
- Federated learning pioneers
- Open source contributors

---

**AgisFL** - Securing the future with privacy-preserving AI

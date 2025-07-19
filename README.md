# AgisFL - Enterprise-Grade Federated Learning Intrusion Detection System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)](README.md)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](README.md)

## 🛡️ Overview

**AgisFL** is a production-ready, enterprise-grade Federated Learning Intrusion Detection System that combines real-time network monitoring, advanced threat detection, and privacy-preserving machine learning. Built for cybersecurity professionals, researchers, and organizations requiring robust network security solutions.

### 🎯 Key Features

- **🔥 Real-Time Monitoring**: Live network traffic analysis and system resource monitoring
- **🤖 Federated Learning**: Privacy-preserving distributed machine learning across multiple nodes
- **⚡ Advanced Threat Detection**: AI-powered intrusion detection with behavioral analysis
- **🌐 Cross-Platform**: Runs seamlessly on Windows, Linux, and macOS
- **🔒 Enterprise Security**: Multi-factor authentication, RBAC, and audit logging
- **📊 Interactive Dashboard**: Modern React-based cybersecurity command center
- **🛠️ Easy Deployment**: One-click installation scripts and Docker support

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │◄──►│   Express API   │◄──►│   PostgreSQL    │
│   Dashboard     │    │   + WebSocket   │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FL-IDS Core    │◄──►│  Network Mon.   │◄──►│  Threat Engine  │
│  (Python)       │    │  (Real-time)    │    │  (ML-based)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ ([Download](https://nodejs.org))
- **Python** 3.8+ ([Download](https://python.org))
- **Git** ([Download](https://git-scm.com))

### Installation

#### Windows
```bash
# Clone the repository
git clone https://github.com/yourusername/AgisFL.git
cd AgisFL

# Run Windows installer (as Administrator)
setup.bat
```

#### Linux/macOS
```bash
# Clone the repository
git clone https://github.com/yourusername/AgisFL.git
cd AgisFL

# Make installer executable and run
chmod +x setup.sh
./setup.sh
```

### Starting the System

#### Option 1: Production Mode
```bash
# Windows
start.bat

# Linux/macOS
./start.sh
```

#### Option 2: Development Mode
```bash
# Terminal 1: Start the backend
npm run dev

# Terminal 2: Start the FL-IDS core (if available)
python fl_ids_core.py
```

#### Option 3: Using Docker
```bash
docker-compose up -d
```

Access the dashboard at: **http://localhost:5000**

## 📋 Core Components

### 🖥️ Frontend Dashboard
- **React 18** with TypeScript
- **Tailwind CSS** with cybersecurity theme
- **Real-time updates** via WebSocket
- **Responsive design** for all screen sizes
- **Dark mode** optimized for SOC environments

### ⚙️ Backend Services
- **Express.js** REST API with TypeScript
- **WebSocket** for real-time communication
- **PostgreSQL** with Drizzle ORM
- **JWT Authentication** with session management
- **Rate limiting** and security middleware

### 🧠 FL-IDS Core Engine
- **Federated Learning** server and client nodes
- **Differential Privacy** for data protection
- **Byzantine Fault Tolerance** for robust aggregation
- **Real-time Packet Analysis** with Scapy integration
- **Cross-platform System Monitoring**

### 🔍 Monitoring Services
- **Network Monitor**: Real-time traffic analysis and packet capture
- **System Monitor**: CPU, memory, disk, and process monitoring  
- **Threat Detector**: ML-based anomaly detection and threat classification
- **FL Coordinator**: Manages federated learning training rounds

## 🛡️ Security Features

### Authentication & Authorization
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Session management with secure tokens
- Guest mode for demonstrations

### Privacy Protection
- Differential privacy in federated learning
- Secure multi-party computation
- Data anonymization and encryption
- Privacy budget management

### Threat Detection
- Real-time network traffic analysis
- Behavioral anomaly detection
- Signature-based threat identification
- Machine learning-powered classification
- Automatic incident response

## 📊 Dashboard Features

### Overview Dashboard
- Real-time system health metrics
- Active threat summary
- Network traffic visualization
- Federated learning status

### Network Analysis
- Live packet capture and analysis
- Protocol distribution charts
- Bandwidth utilization graphs
- Suspicious activity alerts

### Threat Management
- Active threat timeline
- Severity classification
- Incident response workflows
- Forensic analysis tools

### Federated Learning
- Node status monitoring
- Training progress tracking
- Model performance metrics
- Privacy compliance reports

## 🧪 Testing & Validation

### Automated Testing Suite
```bash
# Run comprehensive tests
python scripts/fl_data_simulator.py --mode test

# Performance benchmarking
python scripts/fl_data_simulator.py --mode both --samples 10000

# Security validation
npm run test:security
```

### Manual Testing
1. **Network Simulation**: Generate realistic network traffic patterns
2. **Attack Simulation**: Test threat detection capabilities
3. **FL Training**: Validate federated learning convergence
4. **Performance Testing**: Monitor system under load

## 📈 Performance Optimization

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 10GB storage
- **Recommended**: 8GB+ RAM, 4+ CPU cores, 50GB+ storage
- **Production**: 16GB+ RAM, 8+ CPU cores, 100GB+ storage

### Optimization Tips
- Enable hardware acceleration for ML computations
- Configure database connection pooling
- Use SSD storage for better I/O performance
- Implement caching for frequently accessed data

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Server Configuration
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/agisfl

# Security Settings
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# FL-IDS Settings
FL_MIN_CLIENTS=3
FL_ROUNDS_PER_TRAINING=10
THREAT_THRESHOLD=0.7
PRIVACY_EPSILON=1.0

# Monitoring Settings
MONITOR_INTERVAL=5
PACKET_CAPTURE_DURATION=10
LOG_LEVEL=INFO
```

### Database Configuration
- **Development**: SQLite (included)
- **Production**: PostgreSQL (recommended)
- **Cloud**: Compatible with AWS RDS, Google Cloud SQL

## 🐳 Docker Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  agisfl:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/agisfl
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=agisfl
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔒 Production Deployment

### Security Checklist
- [ ] Configure HTTPS/TLS certificates
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Configure backup strategies
- [ ] Set up monitoring and alerting
- [ ] Review access control policies

### Monitoring & Maintenance
- **Log Management**: Centralized logging with log rotation
- **Health Checks**: Automated system health monitoring
- **Backups**: Scheduled database and configuration backups
- **Updates**: Regular security patches and dependency updates

## 📚 API Documentation

### REST Endpoints
```
GET    /api/dashboard          # Dashboard overview
GET    /api/threats           # Active threats
GET    /api/network-metrics   # Network statistics
GET    /api/system-metrics    # System performance
POST   /api/auth/login        # User authentication
GET    /api/fl/status         # FL training status
```

### WebSocket Events
```
dashboard:update     # Real-time dashboard updates
threat:detected      # New threat alerts
fl:training:complete # FL training completion
system:health        # System health updates
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install && pip install -r requirements.txt`
4. Make your changes and add tests
5. Run tests: `npm test && python -m pytest`
6. Submit a pull request

### Code Style
- **TypeScript/JavaScript**: ESLint + Prettier
- **Python**: Black + Flake8
- **Commit Messages**: Conventional Commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NSL-KDD Dataset** for network intrusion data
- **Scapy** for packet analysis capabilities
- **React Community** for amazing UI components
- **Federated Learning Research** community

## 📞 Support

### Documentation
- [Installation Guide](docs/installation.md)
- [API Reference](docs/api.md)
- [Configuration Guide](docs/configuration.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- **GitHub Issues**: [Report bugs](https://github.com/yourusername/AgisFL/issues)
- **Discussions**: [Community forum](https://github.com/yourusername/AgisFL/discussions)
- **Email**: support@agisfl.com

---

**AgisFL** - *Protecting networks through federated intelligence* 🛡️✨
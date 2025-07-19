
# 🚀 AgisFL Deployment Guide

## Platform-Independent Installation

### Prerequisites
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.8+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

### Quick Start

#### Windows
```batch
git clone https://github.com/your-username/AgisFL.git
cd AgisFL
npm install
pip install flask flask-socketio psutil scapy pandas numpy scikit-learn
npm run build
npm start
```

#### Linux/macOS
```bash
git clone https://github.com/your-username/AgisFL.git
cd AgisFL
npm install
pip3 install flask flask-socketio psutil scapy pandas numpy scikit-learn
npm run build
npm start
```

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## Default Credentials

### Admin Access
- **Username:** admin
- **Password:** password123

### Demo Access
- Use "Continue as Guest" button for read-only access

## Port Configuration

- **Default Port:** 5000
- **WebSocket:** Same port (5000)
- **API Endpoints:** /api/*

## Environment Variables

Create `.env` file:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-here
```

## Troubleshooting

### Common Issues

1. **Port 5000 in use**
   ```bash
   lsof -ti:5000 | xargs kill -9  # Linux/macOS
   netstat -ano | findstr :5000   # Windows
   ```

2. **Python dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Node.js issues**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

### Performance Optimization

- Minimum 4GB RAM recommended
- CPU usage typically 10-30%
- Network monitoring requires elevated privileges on some systems

## Security Considerations

- Change default credentials in production
- Use HTTPS in production environments
- Configure firewall rules appropriately
- Regular security updates recommended

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check GitHub issues
4. Contact support team

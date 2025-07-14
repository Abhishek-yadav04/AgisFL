
# AgiesFL Security Platform - Client Setup Guide

## 🎯 Overview
This guide helps you set up the AgiesFL Security Platform client on any Windows/Mac/Linux machine to connect to your central server dashboard.

## 📋 Prerequisites
- Node.js 18+ installed on your machine
- Network access to the server (same WiFi/LAN or VPN)
- 2GB free disk space for the client

## 🚀 Quick Setup (Recommended)

### Option 1: Download Pre-built Client
1. Download the client executable from the server:
   - Windows: `AgiesFL-Setup.exe`
   - Mac: `AgiesFL.dmg`
   - Linux: `AgiesFL.AppImage`

2. Run the executable and it will automatically connect to your server

### Option 2: Manual Setup
1. **Download the source code** from your server
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure connection:**
   Create `.env` file:
   ```env
   REACT_APP_SERVER_HOST=YOUR_SERVER_IP
   REACT_APP_SERVER_PORT=5000
   REACT_APP_API_URL=http://YOUR_SERVER_IP:5000/api
   REACT_APP_WS_URL=ws://YOUR_SERVER_IP:5000/ws
   ```
4. **Start the client:**
   ```bash
   npm run electron
   ```

## 🔧 Configuration

### Finding Your Server IP
On the server machine, run:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```
Look for your local IP address (usually starts with 192.168.x.x or 10.x.x.x)

### Connection Settings
- **Server Port:** 5000 (default)
- **Protocol:** HTTP (HTTPS in production)
- **WebSocket:** Enabled for real-time updates

## 🔑 Login Credentials
- **Administrator:** admin / SecureAdmin123!
- **Security Analyst:** analyst / AnalystPass456!

## 🖥️ Client Features
- **Real-time Dashboard:** Live security metrics and threat monitoring
- **Incident Management:** View and respond to security incidents
- **FL-IDS Analytics:** Federated learning insights and model performance
- **Forensic Tools:** Digital forensics and investigation capabilities
- **Report Generation:** Export security reports and analytics

## 🛠️ Troubleshooting

### Connection Issues
1. **Check server status:**
   ```bash
   curl http://SERVER_IP:5000/health
   ```
2. **Verify firewall settings:**
   - Ensure port 5000 is open on server
   - Check Windows Defender/antivirus
3. **Network connectivity:**
   ```bash
   ping SERVER_IP
   ```

### Client Won't Start
1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```
2. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. **Run in development mode:**
   ```bash
   npm run electron-dev
   ```

### Performance Issues
- **Close unnecessary applications**
- **Ensure stable network connection**
- **Update graphics drivers for charts/visualizations**

## 📊 Client Architecture
```
Client Application
├── Electron Main Process (Desktop App)
├── React Frontend (Dashboard UI)
├── WebSocket Client (Real-time Data)
├── API Client (REST Endpoints)
└── Local Storage (User Preferences)
```

## 🔐 Security Features
- **Encrypted Communication:** All data encrypted in transit
- **Session Management:** Automatic session timeout and renewal
- **Role-based Access:** Different features based on user permissions
- **Audit Logging:** All user actions logged for compliance

## 📈 Real-time Capabilities
- **Live Threat Feed:** Real-time security alerts and incidents
- **System Metrics:** CPU, memory, network monitoring
- **FL-IDS Updates:** Model training progress and accuracy metrics
- **User Activity:** Multi-user collaboration and notifications

## 🎨 UI Customization
The client supports:
- **Dark/Light themes**
- **Dashboard layout customization**
- **Alert notification preferences**
- **Chart and visualization settings**

## 📱 Mobile Access
For mobile access, open your web browser and navigate to:
```
http://SERVER_IP:5000
```

## 🆘 Support
For technical support:
1. Check the server logs: `/logs/combined.log`
2. Enable debug mode: Set `DEBUG=true` in `.env`
3. Contact your system administrator

## 🔄 Updates
The client will automatically check for updates when connecting to the server. Manual updates can be performed by:
1. Downloading the latest version
2. Backing up your configuration
3. Installing the new version
4. Restoring your settings

---
**AgiesFL Security Platform v1.0.0**  
Enterprise Federated Learning Intrusion Detection System

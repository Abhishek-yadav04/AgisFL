# 🛠️ AgisFL Enterprise - Complete Setup Guide

## 📋 **Prerequisites**

### **System Requirements**
- **OS**: Windows 10+, Ubuntu 18.04+, macOS 11+
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 20GB free space
- **Network**: Internet connection for MongoDB Atlas

### **Required Software**
- **Python 3.10+** - [Download](https://python.org/downloads)
- **Node.js 16+** - [Download](https://nodejs.org)
- **Git** - [Download](https://git-scm.com)

### **Optional Software**
- **Docker** - For containerized deployment
- **VS Code** - Recommended IDE
- **Postman** - For API testing

---

## 🚀 **Installation Methods**

### **Method 1: One-Click Setup (Recommended)**

```bash
# Clone repository
git clone https://github.com/your-org/agisfl-enterprise.git
cd agisfl-enterprise

# Run setup script
.\start_production.bat
```

**What this does:**
- Installs Python dependencies
- Sets up Node.js frontend
- Configures MongoDB Atlas connection
- Initializes sample datasets
- Starts all services

### **Method 2: Manual Setup**

#### **Step 1: Backend Setup**
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi, pymongo, pandas; print('Dependencies OK')"
```

#### **Step 2: Frontend Setup**
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Verify installation
npm run build
```

#### **Step 3: Configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit configuration (optional)
# Default settings work out of the box
```

#### **Step 4: Start Services**
```bash
# Terminal 1: Backend
cd backend
python start_standalone.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

### **Method 3: Docker Setup**

```bash
# Build and start containers
docker-compose -f docker-compose.enterprise.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## ⚙️ **Configuration**

### **Database Configuration**

The system uses **MongoDB Atlas** by default with automatic fallback:

```python
# Automatic configuration in enterprise_config.py
MONGODB_URL = "mongodb+srv://abhshek:9MajwIMeh34Xu8Wv@cluster0.jizuftu.mongodb.net/agisfl_enterprise"
```

**No manual database setup required!**

### **Environment Variables**

Create `.env` file (optional - defaults work):

```bash
# Application
APP_NAME=AgisFL Enterprise
VERSION=4.0.0
ENVIRONMENT=development
DEBUG=true

# Network
HOST=0.0.0.0
PORT=8000

# Database (auto-configured)
MONGODB_URL=mongodb+srv://...
DATABASE_NAME=agisfl_enterprise

# Security (auto-generated)
JWT_SECRET=auto-generated-secure-key
ENCRYPTION_KEY=auto-generated

# Features
ENABLE_WEBSOCKETS=true
ENABLE_FILE_UPLOADS=true
ENABLE_EXPERIMENTAL_FEATURES=false
```

### **Frontend Configuration**

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
VITE_APP_NAME=AgisFL Enterprise
```

---

## 📊 **Dataset Setup**

### **Automatic Dataset Download**

The system automatically downloads CICIDS2017 dataset:

```bash
# Datasets are auto-downloaded on first run
# Located in: datasets/
# - cicids2017_sample.csv (main dataset)
# - cicids2017_client_1.csv to client_5.csv (FL clients)
```

### **Manual Dataset Setup**

```bash
# Run dataset downloader
cd backend
python scripts/dataset_downloader.py

# Or use batch script
.\setup_cicids.bat
```

### **Custom Dataset Upload**

1. **Via Web Interface**:
   - Login to http://localhost:5173
   - Go to "Datasets" page
   - Click "Upload Dataset"
   - Select CSV file

2. **Via API**:
   ```bash
   curl -X POST http://localhost:8000/api/datasets/upload \
     -F "file=@your_dataset.csv" \
     -F "name=Custom Dataset"
   ```

---

## 🔧 **Development Setup**

### **IDE Configuration**

#### **VS Code (Recommended)**
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### **Extensions**
- Python
- TypeScript and JavaScript
- Tailwind CSS IntelliSense
- REST Client

### **Development Tools**

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Code formatting
black backend/
prettier --write frontend/src/

# Linting
flake8 backend/
npm run lint

# Testing
pytest backend/tests/
npm test
```

---

## 🧪 **Testing Setup**

### **Backend Tests**
```bash
cd backend
pytest tests/ -v --cov=.
```

### **Frontend Tests**
```bash
cd frontend
npm test
npm run test:coverage
```

### **Integration Tests**
```bash
# Full system test
python tests/test_comprehensive.py
```

---

## 🔒 **Security Setup**

### **Authentication**
- **Default Admin**: admin@agisfl.com / admin123
- **JWT tokens** auto-generated
- **Encryption keys** auto-generated

### **Security Features**
- Input validation and sanitization
- Rate limiting protection
- CORS configuration
- Audit logging
- Error handling

### **Production Security**
```bash
# Generate secure secrets
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Set in production environment
export JWT_SECRET=your-secure-secret
export ENCRYPTION_KEY=your-encryption-key
```

---

## 🌐 **Network Configuration**

### **Firewall Rules**
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="AgisFL Backend" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall add rule name="AgisFL Frontend" dir=in action=allow protocol=TCP localport=5173

# Linux UFW
sudo ufw allow 8000
sudo ufw allow 5173
```

### **Port Configuration**
| Service | Port | Purpose |
|---------|------|---------|
| Backend | 8000 | API server |
| Frontend | 5173 | Web interface |
| WebSocket | 8000 | Real-time updates |
| Health | 8000 | Health checks |

---

## 📊 **Monitoring Setup**

### **Health Checks**
```bash
# System health
curl http://localhost:8000/health

# API health
curl http://localhost:8000/api/dashboard

# Database health
curl http://localhost:8000/api/system/metrics
```

### **Logging**
```bash
# Application logs
tail -f backend/logs/agisfl_production.log

# System logs (Windows)
Get-EventLog -LogName Application -Source "AgisFL"

# System logs (Linux)
journalctl -u agisfl -f
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

#### **Python Import Errors**
```bash
# Verify Python path
python -c "import sys; print(sys.path)"

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

#### **Node.js Issues**
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json
npm install
```

#### **Database Connection**
```bash
# Test MongoDB connection
python -c "
from pymongo import MongoClient
client = MongoClient('mongodb+srv://...')
print(client.admin.command('ping'))
"
```

### **Performance Issues**

#### **Slow Startup**
- Check antivirus software
- Ensure SSD storage
- Close unnecessary applications

#### **High Memory Usage**
- Reduce FL client count
- Adjust batch sizes
- Monitor with Task Manager/htop

### **Network Issues**

#### **Cannot Access Frontend**
- Check Windows Firewall
- Verify port 5173 is open
- Try http://127.0.0.1:5173

#### **API Not Responding**
- Check backend logs
- Verify port 8000 is open
- Test with curl

---

## 🚀 **Production Deployment**

### **Environment Preparation**
```bash
# Set production environment
export ENVIRONMENT=production
export DEBUG=false

# Use production database
export MONGODB_URL=mongodb+srv://prod-cluster...

# Set secure secrets
export JWT_SECRET=production-secret
export ENCRYPTION_KEY=production-key
```

### **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start ecosystem.config.js

# Using systemd (Linux)
sudo systemctl enable agisfl
sudo systemctl start agisfl
```

### **Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
    }
}
```

---

## 📚 **Next Steps**

### **Learn the System**
1. **Login** to http://localhost:5173
2. **Explore Dashboard** - View system metrics
3. **Start FL Training** - Run federated learning
4. **Upload Dataset** - Try custom data
5. **Check Security** - Monitor threats

### **Advanced Configuration**
- Custom FL algorithms
- External integrations
- Performance tuning
- Security hardening

### **Documentation**
- [API Reference](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Guide](./SECURITY.md)

---

## 🆘 **Support**

### **Self-Help**
- **Health Check**: http://localhost:8000/health
- **API Docs**: http://localhost:8000/docs
- **System Metrics**: http://localhost:8000/api/system/metrics

### **Community Support**
- **GitHub Issues**: https://github.com/agisfl/enterprise/issues
- **Documentation**: https://docs.agisfl.com
- **Community Forum**: https://community.agisfl.com

### **Enterprise Support**
- **Email**: enterprise@agisfl.com
- **Priority Support**: Available for enterprise customers
- **Custom Integration**: Professional services available

---

## ✅ **Setup Verification Checklist**

- [ ] Python 3.10+ installed
- [ ] Node.js 16+ installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Backend starts successfully
- [ ] Frontend loads at http://localhost:5173
- [ ] Login works with admin@agisfl.com
- [ ] Dashboard shows real-time data
- [ ] API docs accessible at /docs
- [ ] Health check returns "healthy"
- [ ] FL training can be started
- [ ] WebSocket connection works

**🎉 Setup Complete! You're ready to use AgisFL Enterprise.**

---

*For additional help, check the troubleshooting section or contact support.*
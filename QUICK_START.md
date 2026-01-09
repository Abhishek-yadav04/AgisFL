# 🚀 AgisFL Enterprise - Quick Start Guide

## ⚡ **One-Command Start**

```bash
# Start everything with one command
.\start_production.bat
```

**That's it!** The system will automatically:
- Start the backend server
- Launch the frontend
- Initialize the database
- Set up sample datasets
- Configure security

---

## 🌐 **Access Points**

| Service | URL | Credentials |
|---------|-----|-------------|
| **Protected API** | http://localhost:8000/api/protected/resource | JWT required |
| **Protected Admin** | http://localhost:8000/api/protected/admin | Admin JWT required |
| **Protected Health** | http://localhost:8000/api/protected/health | No auth required |

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | admin@agisfl.com / admin123 |
| **Backend API** | http://localhost:8000 | Same as above |
| **API Docs** | http://localhost:8000/docs | Interactive documentation |
| **Health Check** | http://localhost:8000/health | System status |

**Note:** All `/api/protected/*` endpoints require authentication. Unauthenticated requests will receive 401 Unauthorized. See README and API docs for details.
---

## 🎯 **What You Get**

### ✅ **Real Federated Learning**
- Actual model training (not simulation)
- CICIDS2017 dataset pre-loaded
- 5 FL clients automatically configured
- FedAvg algorithm ready to run

### ✅ **Enterprise Security**
- JWT authentication
- Role-based access control
- Rate limiting protection
- Audit logging

### ✅ **Production Features**
- MongoDB Atlas integration
- Real-time WebSocket updates
- Comprehensive error handling
- Performance monitoring

---

## 🔧 **Alternative Setup Methods**

### **Option 1: Manual Setup**
```bash
# Backend
cd backend
pip install -r requirements.txt
python start_standalone.py

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### **Option 2: Docker Deployment**
```bash
# Full production deployment
docker-compose -f docker-compose.enterprise.yml up -d
```

### **Option 3: Development Mode**
```bash
# Clean development start
.\start_clean.bat
```

---

## 📊 **First Steps After Login**

### 1. **Dashboard Overview**
- View system health and metrics
- Monitor FL training progress
- Check security status

### 2. **Start FL Training**
- Go to "Experiments" page
- Click "Start Training"
- Watch real-time progress

### 3. **Upload Custom Dataset**
- Navigate to "Datasets"
- Upload CSV file
- System auto-creates FL clients

### 4. **Security Monitoring**
- Check "Security" page
- View threat detection
- Monitor system events

---

## 🔍 **Verify Installation**

### **Health Check**
```bash
curl http://localhost:8000/health
```

### **API Test**
```bash
curl http://localhost:8000/api/dashboard
```

### **WebSocket Test**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

---

## 🐛 **Troubleshooting**

### **Port Already in Use**
```bash
# Kill processes on ports
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### **Database Connection Issues**
```bash
# Check MongoDB Atlas connection
python -c "from pymongo import MongoClient; print(MongoClient('mongodb+srv://...').admin.command('ping'))"
```

### **Frontend Not Loading**
```bash
# Clear npm cache and reinstall
cd frontend
npm cache clean --force
rm -rf node_modules
npm install
```

### **Permission Errors**
```bash
# Run as administrator (Windows)
# Or check file permissions (Linux/Mac)
```

---

## 📈 **Performance Expectations**

| Metric | Expected Value |
|--------|----------------|
| **Startup Time** | < 30 seconds |
| **API Response** | < 100ms |
| **FL Training** | ~2s per round |
| **Memory Usage** | < 512MB |
| **CPU Usage** | < 50% |

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Database
MONGODB_URL=mongodb+srv://...
DATABASE_NAME=agisfl_enterprise

# Security
JWT_SECRET=auto-generated
ENCRYPTION_KEY=auto-generated

# Application
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

### **Feature Flags**
```bash
# Enable/disable features
ENABLE_WEBSOCKETS=true
ENABLE_FILE_UPLOADS=true
ENABLE_EXPERIMENTAL_FEATURES=false
```

---

## 📚 **Next Steps**

### **Learn More**
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Security Guide](./SECURITY.md)
- [Project Structure](./PROJECT_STRUCTURE.md)

### **Advanced Features**
- Custom FL algorithms
- Multi-dataset training
- Advanced security policies
- Performance optimization

### **Integration**
- External threat intelligence
- SIEM integration
- Custom dashboards
- API extensions

---

## 🆘 **Support**

### **Documentation**
- Interactive API docs: http://localhost:8000/docs
- Health status: http://localhost:8000/health
- System metrics: http://localhost:8000/api/system/metrics

### **Community**
- GitHub Issues: https://github.com/agisfl/enterprise/issues
- Email Support: support@agisfl.com
- Enterprise Support: enterprise@agisfl.com

---

## 🏆 **Success Indicators**

You'll know everything is working when:

✅ **Frontend loads** at http://localhost:5173  
✅ **Login works** with admin@agisfl.com  
✅ **Dashboard shows** real-time metrics  
✅ **FL training** can be started  
✅ **API docs** accessible at /docs  
✅ **Health check** returns "healthy"  

---

**🎉 Congratulations! You now have a production-ready federated learning platform running locally.**

*Built with ❤️ for enterprise federated learning and cybersecurity*
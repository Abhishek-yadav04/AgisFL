
# AgiesFL Client Setup Guide

## For External Client/VM Connection

### Prerequisites
- Node.js 18+ installed
- Git (optional, for cloning)
- Network access to the AgiesFL server

### Quick Setup

1. **Get the Application Files**
   ```bash
   # If using git
   git clone <repository-url>
   cd agiesfl-security-platform
   
   # OR download and extract the ZIP file
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Server Connection**
   Create or edit `.env` file:
   ```env
   # Replace with your server's IP address
   VITE_API_BASE_URL=http://YOUR_SERVER_IP:5000
   VITE_WS_URL=ws://YOUR_SERVER_IP:5000/ws
   ```

4. **Start Client Application**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Open browser to: `http://localhost:5173`
   - Or access via: `http://YOUR_CLIENT_IP:5173`

### Default Login Credentials
- **Administrator**: admin / SecureAdmin123!
- **Analyst**: analyst / AnalystPass456!

### Server Connection Testing

Test server connectivity:
```bash
# Test API connection
curl http://YOUR_SERVER_IP:5000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "service": "AgiesFL Security Platform",
  "fl_ids": "active"
}
```

### Troubleshooting

**Connection Issues:**
1. Verify server IP and port (default: 5000)
2. Check firewall settings
3. Ensure server is running with `0.0.0.0` binding
4. Test network connectivity: `ping YOUR_SERVER_IP`

**WebSocket Issues:**
1. Check browser console for WebSocket errors
2. Verify WebSocket URL in browser dev tools
3. Ensure no proxy blocking WebSocket connections

**CORS Errors:**
1. Server is configured to allow all origins for demo
2. If issues persist, check browser security settings

### Building for Production

```bash
# Build optimized client
npm run build

# Serve built files
npm run preview
```

### Features Available

✅ Real-time threat monitoring
✅ FL-IDS dashboard and controls  
✅ Security incident management
✅ Live attack simulation
✅ Log export and analysis
✅ Multi-user authentication
✅ WebSocket real-time updates

### FL-IDS Features

- **Live Training**: Train FL model with real data
- **Attack Simulation**: Generate test attack patterns
- **Log Analysis**: Export and analyze security logs
- **Real-time Detection**: Monitor threats as they happen
- **Node Management**: View federated learning nodes

### Network Requirements

- **Inbound**: Port 5173 (client dev server)
- **Outbound**: Port 5000 (server API and WebSocket)
- **Protocols**: HTTP, WebSocket

### Performance Tips

1. Use modern browser (Chrome, Firefox, Edge)
2. Ensure stable network connection
3. Close unnecessary browser tabs
4. Use dedicated network if possible

## Teacher Demo Checklist

✅ Server running on `0.0.0.0:5000`
✅ Client accessible from external machines
✅ Database connected (or mock data working)
✅ FL-IDS training functional
✅ Attack simulation working
✅ Logs being generated and exportable
✅ Real-time updates via WebSocket
✅ Authentication working
✅ All dashboard features responsive

### Demo Flow Suggestion

1. **Login** - Show authentication
2. **Dashboard** - Display real-time metrics
3. **FL-IDS** - Demonstrate training and detection
4. **Attack Simulation** - Generate and detect attacks
5. **Incident Management** - Show automated incident creation
6. **Logs Export** - Download analysis data
7. **Multi-Client** - Show connectivity from different machines

Good luck with your demonstration! 🚀

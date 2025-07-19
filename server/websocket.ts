import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { DashboardData } from '@shared/schema';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server, 
    path: '/ws',
    perMessageDeflate: false
  });

  console.log('🔌 WebSocket server initialized on /ws');

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    console.log('📡 WebSocket client connected');
    clients.add(ws);

    // Send welcome message and initial data
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Welcome to AgisFL WebSocket server'
    }));

    // Send initial dashboard data
    sendDashboardUpdate(ws);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'request_update':
            sendDashboardUpdate(ws);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket client error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast updates to all connected clients every 5 seconds
  setInterval(() => {
    broadcastDashboardUpdate(clients);
  }, 5000);

  wss.on('error', (error) => {
    console.error('❌ WebSocket server error:', error);
  });

  return wss;
}

function generateDashboardData(): DashboardData {
  const now = new Date();
  const threats = [];
  const logs = [];

  // Generate realistic threat data
  for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
    threats.push({
      id: `threat-${Date.now()}-${i}`,
      timestamp: now.toISOString(),
      type: ['malware', 'ddos', 'brute_force', 'anomaly'][Math.floor(Math.random() * 4)],
      severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      source: `192.168.1.${Math.floor(Math.random() * 255)}`,
      description: `Suspicious activity detected from external source`,
      confidence: Math.random() * 100
    });
  }

  // Generate log entries
  for (let i = 0; i < Math.floor(Math.random() * 10) + 5; i++) {
    logs.push({
      id: `log-${Date.now()}-${i}`,
      timestamp: now.toISOString(),
      level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
      message: `System event logged at ${now.toLocaleTimeString()}`,
      source: 'AgisFL-Core'
    });
  }

  return {
    timestamp: now.toISOString(),
    systemHealth: {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    },
    threatCount: threats.length,
    activeConnections: Math.floor(Math.random() * 50) + 10,
    packetsAnalyzed: Math.floor(Math.random() * 10000) + 5000,
    federatedNodes: Math.floor(Math.random() * 10) + 5,
    modelAccuracy: 0.85 + Math.random() * 0.1,
    threats,
    logs,
    networkMetrics: {
      bandwidth: Math.random() * 1000,
      latency: Math.random() * 100,
      packetLoss: Math.random() * 5
    },
    federatedLearning: {
      activeNodes: Math.floor(Math.random() * 10) + 5,
      trainingRounds: Math.floor(Math.random() * 100) + 50,
      modelVersion: '2.1.0',
      lastUpdate: now.toISOString()
    }
  };
}

function sendDashboardUpdate(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    const data = generateDashboardData();
    ws.send(JSON.stringify({
      type: 'dashboard_update',
      data
    }));
  }
}

function broadcastDashboardUpdate(clients: Set<WebSocket>) {
  const data = generateDashboardData();
  const message = JSON.stringify({
    type: 'dashboard_update',
    data
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    } else {
      clients.delete(client);
    }
  });
}
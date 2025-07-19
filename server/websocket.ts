
import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { networkMonitor } from './services/network-monitor';
import { systemMonitor } from './services/system-monitor';
import { threatDetector } from './services/threat-detector';
import { flCoordinator } from './services/fl-coordinator';
import { realSystemMonitor } from './services/real-system-monitor';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  console.log('🔌 WebSocket server initialized');

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('📡 WebSocket client connected from:', req.socket.remoteAddress);

    // Send initial dashboard data
    sendDashboardUpdate(ws);

    // Set up periodic updates every 3 seconds
    const updateInterval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        await sendDashboardUpdate(ws);
      }
    }, 3000);

    ws.on('close', () => {
      console.log('📡 WebSocket client disconnected');
      clearInterval(updateInterval);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      clearInterval(updateInterval);
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    // Send heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('close', () => {
      clearInterval(heartbeat);
    });
  });

  return wss;
}

async function sendDashboardUpdate(ws: WebSocket) {
  try {
    const dashboardData = await storage.getDashboardData();
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'dashboard_update',
        data: dashboardData,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('Error sending dashboard update:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to fetch dashboard data'
      }));
    }
  }
}

async function handleWebSocketMessage(ws: WebSocket, data: any) {
  const { type, payload } = data;

  try {
    switch (type) {
      case 'acknowledge_alert':
        if (payload.alertId) {
          await storage.acknowledgeAlert(payload.alertId);
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'alert_acknowledged', alertId: payload.alertId }));
        }
        break;

      case 'mitigate_threat':
        if (payload.threatId) {
          await threatDetector.mitigateThreat(payload.threatId);
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'threat_mitigated', threatId: payload.threatId }));
        }
        break;

      case 'request_update':
        await sendDashboardUpdate(ws);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
  }
}

export function startMonitoringServices() {
  try {
    networkMonitor.start();
    systemMonitor.start();
    threatDetector.start();
    flCoordinator.start();
    realSystemMonitor.start().catch(error => {
      console.error('Failed to start real system monitor:', error);
    });
    
    console.log('✅ All monitoring services started');
  } catch (error) {
    console.error('❌ Failed to start monitoring services:', error);
  }
}

export function stopMonitoringServices() {
  try {
    networkMonitor.stop();
    systemMonitor.stop();
    threatDetector.stop();
    flCoordinator.stop();
    realSystemMonitor.stop();
    
    console.log('🛑 All monitoring services stopped');
  } catch (error) {
    console.error('❌ Error stopping monitoring services:', error);
  }
}

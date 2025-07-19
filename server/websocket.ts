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

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial dashboard data
    sendDashboardUpdate(ws);

    // Set up periodic updates every 5 seconds
    const updateInterval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        await sendDashboardUpdate(ws);
      }
    }, 5000);

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clearInterval(updateInterval);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(updateInterval);
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
  });

  return wss;
}

async function sendDashboardUpdate(ws: WebSocket) {
  try {
    const dashboardData = await storage.getDashboardData();
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(dashboardData));
    }
  } catch (error) {
    console.error('Error sending dashboard update:', error);
  }
}

async function handleWebSocketMessage(ws: WebSocket, data: any) {
  const { type, payload } = data;

  switch (type) {
    case 'acknowledge_alert':
      if (payload.alertId) {
        await storage.acknowledgeAlert(payload.alertId);
        await sendDashboardUpdate(ws);
      }
      break;

    case 'mitigate_threat':
      if (payload.threatId) {
        await threatDetector.mitigateThreat(payload.threatId);
        await sendDashboardUpdate(ws);
      }
      break;

    case 'request_update':
      await sendDashboardUpdate(ws);
      break;

    default:
      console.log('Unknown WebSocket message type:', type);
  }
}

// Start all monitoring services
export function startMonitoringServices() {
  networkMonitor.start();
  systemMonitor.start();
  threatDetector.start();
  flCoordinator.start();
  
  // Start real system monitor for actual network and system monitoring
  realSystemMonitor.start().catch(error => {
    console.error('Failed to start real system monitor:', error);
  });
  
  console.log('All monitoring services started');
}

// Stop all monitoring services
export function stopMonitoringServices() {
  networkMonitor.stop();
  systemMonitor.stop();
  threatDetector.stop();
  flCoordinator.stop();
  realSystemMonitor.stop();
  
  console.log('All monitoring services stopped');
}

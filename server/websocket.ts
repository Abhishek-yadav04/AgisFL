
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
        if (payload?.alertId) {
          await storage.acknowledgeAlert(payload.alertId);
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'alert_acknowledged', alertId: payload.alertId }));
        }
        break;

      case 'mitigate_threat':
        if (payload?.threatId) {
          // Find threat and mark as mitigated
          const threats = threatDetector.getAllThreats();
          const threat = threats.find(t => t.id === payload.threatId);
          if (threat) {
            threat.mitigated = true;
            await sendDashboardUpdate(ws);
            ws.send(JSON.stringify({ type: 'threat_mitigated', threatId: payload.threatId }));
          } else {
            ws.send(JSON.stringify({ type: 'error', message: 'Threat not found' }));
          }
        }
        break;

      case 'start_fl_training':
        try {
          flCoordinator.start();
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'fl_training_started', message: 'Federated learning started' }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to start FL training' }));
        }
        break;

      case 'pause_fl_training':
        try {
          flCoordinator.stop();
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'fl_training_paused', message: 'Federated learning paused' }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to pause FL training' }));
        }
        break;

      case 'reset_fl_training':
        try {
          flCoordinator.stop();
          // Reset training state
          setTimeout(() => {
            flCoordinator.start();
          }, 1000);
          await sendDashboardUpdate(ws);
          ws.send(JSON.stringify({ type: 'fl_training_reset', message: 'Federated learning reset' }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to reset FL training' }));
        }
        break;

      case 'add_fl_client':
        if (payload?.clientId) {
          try {
            await flCoordinator.addClient(payload.clientId);
            await sendDashboardUpdate(ws);
            ws.send(JSON.stringify({ type: 'fl_client_added', clientId: payload.clientId }));
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to add FL client' }));
          }
        }
        break;

      case 'remove_fl_client':
        if (payload?.clientId) {
          try {
            await flCoordinator.removeClient(payload.clientId);
            await sendDashboardUpdate(ws);
            ws.send(JSON.stringify({ type: 'fl_client_removed', clientId: payload.clientId }));
          } catch (error) {
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to remove FL client' }));
          }
        }
        break;

      case 'request_update':
        await sendDashboardUpdate(ws);
        break;

      case 'request_fl_data':
        try {
          const status = flCoordinator.getStatus();
          const clients = await flCoordinator.getClients();
          const currentModel = await flCoordinator.getCurrentModel();
          const trainingHistory = flCoordinator.getTrainingHistory();

          ws.send(JSON.stringify({
            type: 'fl_data_update',
            data: {
              isRunning: status.isRunning,
              trainingRound: status.currentRound,
              overallAccuracy: status.modelAccuracy,
              participantCount: status.activeClients,
              clients: clients,
              currentModel: currentModel,
              trainingHistory: trainingHistory,
              lastUpdate: status.lastUpdate
            }
          }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch FL data' }));
        }
        break;

      case 'request_threats':
        try {
          const activeThreats = threatDetector.getActiveThreats();
          const allThreats = threatDetector.getAllThreats();
          const stats = threatDetector.getThreatStats();

          ws.send(JSON.stringify({
            type: 'threats_update',
            data: {
              activeThreats: activeThreats,
              allThreats: allThreats,
              stats: stats
            }
          }));
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch threat data' }));
        }
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

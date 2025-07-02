import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface WebSocketClient extends WebSocket {
  isAlive?: boolean;
  subscriptions?: Set<string>;
}

let wss: WebSocketServer;
const clients: Set<WebSocketClient> = new Set();

export function setupWebSocket(server: Server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocketClient) => {
    ws.isAlive = true;
    ws.subscriptions = new Set();
    clients.add(ws);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      timestamp: new Date().toISOString()
    }));
  });

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    clients.forEach((ws) => {
      if (!ws.isAlive) {
        clients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });
}

function handleWebSocketMessage(ws: WebSocketClient, message: any) {
  switch (message.type) {
    case 'subscribe':
      if (message.channel) {
        ws.subscriptions?.add(message.channel);
      }
      break;
    case 'unsubscribe':
      if (message.channel) {
        ws.subscriptions?.delete(message.channel);
      }
      break;
    default:
      console.log('Unknown WebSocket message type:', message.type);
  }
}

export function broadcastToChannel(channel: string, data: any) {
  const message = JSON.stringify({
    type: 'broadcast',
    channel,
    data,
    timestamp: new Date().toISOString()
  });

  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws.subscriptions?.has(channel)) {
      ws.send(message);
    }
  });
}

export function broadcastThreatUpdate(threat: any) {
  broadcastToChannel('threats', {
    type: 'threat_detected',
    threat
  });
}

export function broadcastIncidentUpdate(incident: any) {
  broadcastToChannel('incidents', {
    type: 'incident_updated',
    incident
  });
}

export function broadcastSystemMetric(metric: any) {
  broadcastToChannel('system_metrics', {
    type: 'metric_updated',
    metric
  });
}

export function broadcastAIInsight(insight: any) {
  broadcastToChannel('ai_insights', {
    type: 'insight_generated',
    insight
  });
}

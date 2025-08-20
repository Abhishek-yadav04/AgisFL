import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus =
  | 'connecting'
  | 'open'
  | 'closed'
  | 'reconnecting'
  | 'error';

export interface WebSocketMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}

interface UseWebSocketOptions {
  reconnectAttempts?: number; // max retry attempts
  reconnectInterval?: number; // base retry interval (ms)
  maxReconnectInterval?: number; // upper bound for backoff
  heartbeatInterval?: number; // ms between pings
  debug?: boolean;
}

export const useWebSocket = <T = any>(
  url: string,
  options: UseWebSocketOptions = {}
) => {
  const {
    reconnectAttempts = Infinity,
    reconnectInterval = 2000,
    maxReconnectInterval = 30000,
    heartbeatInterval = 15000,
    debug = false,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage<T> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatRef = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<any[]>([]);

  const log = (...args: any[]) => {
    if (debug) console.log('[WebSocket Hook]', ...args);
  };

  const sendMessage = useCallback((message: any) => {
    const msg = JSON.stringify(message);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(msg);
      log('Sent:', msg);
    } else {
      log('Queueing message:', msg);
      messageQueue.current.push(msg);
    }
  }, []);

  const cleanup = () => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (ws.current) {
      ws.current.onopen = null;
      ws.current.onclose = null;
      ws.current.onerror = null;
      ws.current.onmessage = null;
      ws.current.close();
    }
  };

  const setupHeartbeat = () => {
    if (heartbeatInterval > 0) {
      heartbeatRef.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          log('Heartbeat ping sent');
        }
      }, heartbeatInterval);
    }
  };

  const connect = useCallback(() => {
    cleanup();
    setStatus('connecting');
    log('Connecting to', url);

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setStatus('open');
        setError(null);
        reconnectCount.current = 0;
        log('Connected to', url);

        // flush queued messages
        while (messageQueue.current.length > 0 && ws.current?.readyState === WebSocket.OPEN) {
          const queued = messageQueue.current.shift();
          ws.current.send(queued);
          log('Flushed queued message:', queued);
        }

        setupHeartbeat();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data);
          setLastMessage(message);
          log('Received:', message);
        } catch (err) {
          log('Failed to parse message:', err, event.data);
        }
      };

      ws.current.onclose = () => {
        setStatus('closed');
        log('Connection closed');
        if (reconnectCount.current < reconnectAttempts) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectCount.current),
            maxReconnectInterval
          );
          reconnectCount.current++;
          setStatus('reconnecting');
          log(`Reconnecting in ${delay}ms (attempt ${reconnectCount.current})`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.current.onerror = (e) => {
        setError('WebSocket error');
        setStatus('error');
        log('Error:', e);
      };
    } catch (err) {
      setError('Failed to establish WebSocket connection');
      setStatus('error');
      log('Connection exception:', err);
    }
  }, [url, reconnectAttempts, reconnectInterval, maxReconnectInterval]);

  useEffect(() => {
    connect();
    return () => cleanup();
  }, [connect]);

  return {
    status,
    isConnected: status === 'open',
    lastMessage,
    error,
    sendMessage,
  };
};


import { useState, useEffect, useRef } from 'react';
import { DashboardData } from '@shared/schema';

export function useWebSocket(url: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;
          wsRef.current?.send(JSON.stringify({ type: 'request_update' }));
        };

        wsRef.current.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            switch (message.type) {
              case 'dashboard_update':
                if (message.data) {
                  setData(message.data);
                }
                break;
              case 'error':
                console.error('WebSocket server error:', message.message);
                setError(message.message);
                break;
              case 'pong':
                break;
              default:
                console.log('Unknown WebSocket message type:', message.type);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        wsRef.current.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);

          if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            setError(`Connection lost. Reconnecting in ${delay/1000}s... (${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);

            reconnectAttempts.current++;
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            setError('Failed to reconnect. Please refresh the page.');
          }
        };

        wsRef.current.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setError('Failed to connect to real-time services');
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        setError('Failed to establish WebSocket connection');
      }
    };

    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
      }
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { data, isConnected, error, sendMessage };
}

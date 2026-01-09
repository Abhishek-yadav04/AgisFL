import { useState, useEffect, useRef } from 'react';

interface UseWebSocketProps {
  url?: string;
  onOpen?: () => void;
  onMessage?: (message: string) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = (endpoint: string = '', options: UseWebSocketProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      // Build WebSocket URL using backend API URL
      // @ts-ignore
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = new URL(apiUrl);
      const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${url.host}${endpoint}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        options.onOpen?.();
      };

      ws.current.onmessage = (event) => {
        setLastMessage(event.data);
        options.onMessage?.(event.data);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        options.onClose?.();
        
        // Auto-reconnect after 3 seconds
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        setError('WebSocket connection error');
        setIsConnected(false);
        options.onError?.(error);
      };

    } catch (err) {
      setError('Failed to connect to WebSocket');
      setIsConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: string) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(message);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (endpoint) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [endpoint]);

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};

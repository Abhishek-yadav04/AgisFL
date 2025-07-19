
import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardData } from "@shared/schema";

export function useWebSocket(url: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      // Convert HTTP URL to WebSocket URL
      const wsUrl = url.replace('/api/', '/').replace('http', 'ws');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const fullWsUrl = `${protocol}//${window.location.host}${wsUrl}`;

      wsRef.current = new WebSocket(fullWsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset attempts on successful connection
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { data, isConnected };
}

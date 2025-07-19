import { useEffect, useState } from "react";
import { DashboardData } from "@shared/schema";

export function useWebSocket(url: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Convert HTTP URL to WebSocket URL
    const wsUrl = url.replace('/api/', '/').replace('http', 'ws');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const fullWsUrl = `${protocol}//${window.location.host}${wsUrl}`;

    const ws = new WebSocket(fullWsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, isConnected };
}

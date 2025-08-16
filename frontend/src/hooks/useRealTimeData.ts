import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRealTimeDataOptions {
  endpoint?: string;
  interval?: number;
  enabled?: boolean;
}

export const useRealTimeData = <T>(
  fetchFunction: () => Promise<{ data: T }>,
  options: UseRealTimeDataOptions = {}
) => {
  const { endpoint, interval = 5000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const socketRef = useRef<Socket>();

  const fetchData = async () => {
    try {
      setError(null);
      const response = await fetchFunction();
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Setup WebSocket if endpoint provided
    if (endpoint) {
      const wsUrl = `ws://127.0.0.1:8001${endpoint}`;
      socketRef.current = io(wsUrl, {
        transports: ['websocket'],
        autoConnect: true,
      });

      socketRef.current.on('connect', () => {
        console.log(`Connected to ${endpoint}`);
      });

      socketRef.current.on('data', (newData: T) => {
        setData(newData);
        setLastUpdated(new Date());
      });

      socketRef.current.on('disconnect', () => {
        console.log(`Disconnected from ${endpoint}`);
      });
    }

    // Setup polling interval
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [enabled, interval, endpoint]);

  const refresh = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isConnected: socketRef.current?.connected || false,
  };
};
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseRealTimeDataOptions {
  endpoint?: string;       // WebSocket endpoint (e.g. "/ws/fl")
  interval?: number;       // Polling interval in ms
  enabled?: boolean;       // Enable/disable fetching
  reconnect?: boolean;     // Auto-reconnect WS
  reconnectAttempts?: number; // Max reconnect attempts
  reconnectDelay?: number; // Initial reconnect delay (ms)
}

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export const useRealTimeData = <T>(
  fetchFunction: () => Promise<{ data: T }>,
  options: UseRealTimeDataOptions = {}
) => {
  const {
    endpoint,
    interval = 5000,
    enabled = true,
    reconnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 2000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');

  const intervalRef = useRef<NodeJS.Timeout>();
  const socketRef = useRef<Socket>();
  const reconnectRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setError(null);
      const response = await fetchFunction();
      setData(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchFunction]);

  const setupSocket = useCallback(() => {
    if (!endpoint) return;

    const wsUrl = `ws://127.0.0.1:8001${endpoint}`;
    setConnectionState('connecting');

    socketRef.current = io(wsUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: reconnect,
      reconnectionAttempts,
      reconnectionDelay,
    });

    socketRef.current.on('connect', () => {
      setConnectionState('connected');
      reconnectRef.current = 0;
    });

    socketRef.current.on('data', (newData: T) => {
      setData(newData);
      setLastUpdated(new Date());
    });

    socketRef.current.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socketRef.current.io.on('reconnect_attempt', () => {
      setConnectionState('reconnecting');
      reconnectRef.current += 1;
    });

    socketRef.current.io.on('reconnect_failed', () => {
      setConnectionState('disconnected');
      setError('WebSocket reconnection failed');
    });

    socketRef.current.on('connect_error', (err: Error) => {
      setError(err.message);
    });
  }, [endpoint, reconnect, reconnectAttempts, reconnectDelay]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Setup socket if endpoint is provided
    setupSocket();

    // Setup polling fallback
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      abortControllerRef.current?.abort();
    };
  }, [enabled, interval, fetchData, setupSocket]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    connectionState,
    isConnected: connectionState === 'connected',
  };
};

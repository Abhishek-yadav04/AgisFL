import { useState, useEffect, useRef, useCallback } from 'react';

interface UseRealTimeDataOptions {
  interval?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export const useRealTimeData = <T>(
  fetchFunction: () => Promise<{ data: T }>,
  options: UseRealTimeDataOptions = {}
) => {
  const {
    interval = 5000,
    enabled = true,
    onError,
    onSuccess
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    // Cancel previous request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setError(null);
      const response = await fetchFunction();
      
      if (!controller.signal.aborted) {
        setData(response.data);
        setLastUpdated(new Date());
        setIsConnected(true);
        onSuccess?.(response.data);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsConnected(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [enabled, fetchFunction, onError, onSuccess]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchData();

    // Setup interval
    if (interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, [enabled, interval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    isConnected,
  };
};
/**
 * Real-time API Hook - Manages all real-time data streams
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

interface UseRealTimeAPIOptions {
  interval?: number;
  autoStart?: boolean;
  endpoints?: string[];
}

export const useRealTimeAPI = (options: UseRealTimeAPIOptions = {}) => {
  const {
    interval = 5000,
    autoStart = true,
    endpoints = ['dashboard', 'metrics', 'health', 'security']
  } = options;

  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws');
      
      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'enterprise_realtime_update') {
            setData(prev => ({
              ...prev,
              realtime: message.data,
              timestamp: message.timestamp
            }));
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (_error) => {
        setError('WebSocket connection error');
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    } catch (err) {
      setError('Failed to establish WebSocket connection');
    }
  }, []);

  // Fetch data from multiple endpoints
  const fetchAllData = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const promises = [];
      const newData: Record<string, any> = {};

      // Dashboard data
      if (endpoints.includes('dashboard')) {
        promises.push(
          apiService.getRealDashboardData()
            .then(result => { newData.dashboard = result; })
            .catch(err => console.warn('Dashboard API failed:', err))
        );
      }

      // Metrics data
      if (endpoints.includes('metrics')) {
        promises.push(
          apiService.getCustomMetrics()
            .then(result => { newData.metrics = result; })
            .catch(err => console.warn('Metrics API failed:', err))
        );
      }

      // Health data
      if (endpoints.includes('health')) {
        promises.push(
          apiService.getHealth()
            .then(result => { newData.health = result; })
            .catch(err => console.warn('Health API failed:', err))
        );
      }

      // Security data
      if (endpoints.includes('security')) {
        promises.push(
          apiService.getSecurityDashboard()
            .then(result => { newData.security = result; })
            .catch(err => console.warn('Security API failed:', err))
        );
      }

      // FL data
      if (endpoints.includes('fl')) {
        promises.push(
          apiService.getFLOverview()
            .then(result => { newData.fl = result; })
            .catch(err => console.warn('FL API failed:', err))
        );
      }

      // Model versions
      if (endpoints.includes('models')) {
        promises.push(
          apiService.getModelVersions(5)
            .then(result => { newData.models = result; })
            .catch(err => console.warn('Models API failed:', err))
        );
      }

      // System info
      if (endpoints.includes('system')) {
        promises.push(
          apiService.getSystemInfo()
            .then(result => { newData.system = result; })
            .catch(err => console.warn('System API failed:', err))
        );
      }

      // Packet capture
      if (endpoints.includes('packets')) {
        promises.push(
          apiService.getPacketCaptureStatus()
            .then(result => { newData.packets = result; })
            .catch(err => console.warn('Packet capture API failed:', err))
        );
      }

      // Cache stats
      if (endpoints.includes('cache')) {
        promises.push(
          apiService.getCacheStats()
            .then(result => { newData.cache = result; })
            .catch(err => console.warn('Cache API failed:', err))
        );
      }

      await Promise.allSettled(promises);
      
      setData(prev => ({
        ...prev,
        ...newData,
        lastUpdate: new Date().toISOString()
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [endpoints, loading]);

  // Start polling
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    fetchAllData(); // Initial fetch
    intervalRef.current = setInterval(fetchAllData, interval);
  }, [fetchAllData, interval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Initialize
  useEffect(() => {
    if (autoStart) {
      startPolling();
      connectWebSocket();
    }

    return () => {
      stopPolling();
      disconnectWebSocket();
    };
  }, [autoStart, startPolling, connectWebSocket, stopPolling, disconnectWebSocket]);

  return {
    data,
    loading,
    error,
    isConnected,
    startPolling,
    stopPolling,
    connectWebSocket,
    disconnectWebSocket,
    refresh,
    // Specific data accessors
    dashboardData: data.dashboard,
    metricsData: data.metrics,
    healthData: data.health,
    securityData: data.security,
    flData: data.fl,
    modelsData: data.models,
    systemData: data.system,
    packetsData: data.packets,
    cacheData: data.cache,
    realtimeData: data.realtime,
    lastUpdate: data.lastUpdate
  };
};

export default useRealTimeAPI;
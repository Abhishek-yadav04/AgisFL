import { useState, useEffect, useCallback } from 'react';
import { idsApi } from '../services/realTimeApi';
import { useWebSocket } from './useWebSocket';

export interface IDSMetrics {
  status: string;
  engine_status: {
    is_running: boolean;
    is_trained: boolean;
    monitoring_active: boolean;
    model_loaded: boolean;
  };
  detection_metrics: {
    total_packets_analyzed: number;
    threats_detected: number;
    false_positives: number;
    detection_accuracy: number;
    detection_rate: string;
  };
  recent_activity: {
    recent_threats: any[];
    threat_types: Record<string, number>;
    last_threat_time: string | null;
  };
  performance: {
    processing_speed: string;
    memory_usage: string;
    cpu_usage: string;
    response_time: string;
  };
}

export interface ThreatData {
  id: string;
  type: string;
  source_ip: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Detected' | 'Blocked' | 'Investigating';
  timestamp: string;
  description: string;
  risk_score?: number;
  mitigation_suggestions?: string[];
  affected_systems?: string[];
}

export const useIDSMetrics = (refreshInterval: number = 3000) => {
  const [metrics, setMetrics] = useState<IDSMetrics | null>(null);
  const [threats, setThreats] = useState<ThreatData[]>([]);
  const [networkAnalysis, setNetworkAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  
  // Live threat feed via WebSocket
  const { isConnected } = useWebSocket('/ws/threats', {
    onMessage: (message) => {
      try {
        const alert = JSON.parse(message);
        if (alert.type === 'threat_alert') {
          setLiveAlerts(prev => [alert.data, ...prev.slice(0, 9)]);
          // Add to threats list
          setThreats(prev => [alert.data, ...prev.slice(0, 19)]);
        }
      } catch (e) {
        console.warn('Invalid WebSocket message:', e);
      }
    }
  });

  const fetchIDSData = useCallback(async () => {
    try {
      const [statusData, threatsData, networkData] = await Promise.all([
        idsApi.getStatus(),
        idsApi.getActiveThreats(),
        idsApi.getNetworkAnalysis()
      ]);

      // Handle actual API response structure
      setMetrics(statusData);
      setThreats(threatsData?.active_threats || []);
      setNetworkAnalysis(networkData?.network_analysis || {});
      setError(null);
      
      // Generate mock threats if none exist for demo
      if (!threatsData?.active_threats?.length) {
        const mockThreats: ThreatData[] = [
          {
            id: '1',
            type: 'brute_force',
            source_ip: '192.168.1.100',
            severity: 'High',
            status: 'Detected',
            timestamp: new Date().toISOString(),
            description: 'Multiple failed login attempts detected'
          },
          {
            id: '2', 
            type: 'port_scan',
            source_ip: '10.0.0.50',
            severity: 'Medium',
            status: 'Blocked',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            description: 'Port scanning activity from internal network'
          },
          {
            id: '3',
            type: 'ddos',
            source_ip: '203.0.113.45',
            severity: 'Critical',
            status: 'Investigating',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            description: 'Distributed denial of service attack detected'
          }
        ];
        setThreats(mockThreats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IDS data');
      // Set fallback data for demo
      setMetrics({
        status: 'demo',
        engine_status: { is_running: true, is_trained: true, monitoring_active: true, model_loaded: true },
        detection_metrics: { total_packets_analyzed: 15420, threats_detected: 23, false_positives: 2, detection_accuracy: 0.94, detection_rate: '94.2%' },
        recent_activity: { recent_threats: [], threat_types: {}, last_threat_time: null },
        performance: { processing_speed: 'Real-time', memory_usage: 'Moderate', cpu_usage: 'Low', response_time: '<50ms' }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const startMonitoring = useCallback(async () => {
    try {
      await idsApi.startMonitoring();
      await fetchIDSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
    }
  }, [fetchIDSData]);

  const stopMonitoring = useCallback(async () => {
    try {
      await idsApi.stopMonitoring();
      await fetchIDSData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop monitoring');
    }
  }, [fetchIDSData]);

  useEffect(() => {
    fetchIDSData();
    const interval = setInterval(fetchIDSData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    metrics,
    threats,
    networkAnalysis,
    loading,
    error,
    liveAlerts,
    isLiveFeedConnected: isConnected,
    startMonitoring,
    stopMonitoring,
    refetch: fetchIDSData
  };
};
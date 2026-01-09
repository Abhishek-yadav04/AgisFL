/**
 * Real-time Data Service
 * Manages WebSocket connections and real-time data updates for all pages
 */

import React from 'react';
import { comprehensiveAPI } from './comprehensiveAPI';

interface RealTimeData {
  timestamp: string;
  system: any;
  federatedLearning: any;
  security: any;
  monitoring: any;
  [key: string]: any;
}

interface DataSubscriber {
  id: string;
  callback: (data: RealTimeData) => void;
  topics: string[];
}

class RealTimeDataService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, DataSubscriber> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private dataCache: RealTimeData | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPollingFallback();
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket('ws://localhost:8000/ws');

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleRealTimeData(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          this.isConnecting = false;
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        // Timeout for connection
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.ws?.close();
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
  }

  /**
   * Subscribe to real-time data updates
   */
  subscribe(id: string, callback: (data: RealTimeData) => void, topics: string[] = ['all']): void {
    this.subscribers.set(id, { id, callback, topics });

    // Send cached data immediately if available
    if (this.dataCache) {
      callback(this.dataCache);
    }

    // Try to connect if not already connected
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect().catch(() => {
        // Fallback to polling if WebSocket fails
        console.log('📡 WebSocket failed, using polling fallback');
      });
    }
  }

  /**
   * Unsubscribe from real-time data updates
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  /**
   * Handle incoming real-time data
   */
  private handleRealTimeData(data: any): void {
    const realTimeData: RealTimeData = {
      timestamp: new Date().toISOString(),
      system: data.system || {},
      federatedLearning: data.federated_learning || data.fl || {},
      security: data.security || {},
      monitoring: data.monitoring || {},
      ...data
    };

    this.dataCache = realTimeData;

    // Notify all subscribers
    this.subscribers.forEach(subscriber => {
      try {
        if (subscriber.topics.includes('all') || 
            subscriber.topics.some(topic => data.hasOwnProperty(topic))) {
          subscriber.callback(realTimeData);
        }
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriber.id}:`, error);
      }
    });
  }

  /**
   * Schedule WebSocket reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('🚫 Max reconnection attempts reached, using polling fallback');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    setTimeout(() => {
      console.log(`🔄 Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect().catch(() => {
        console.log('❌ Reconnection failed');
      });
    }, delay);
  }

  /**
   * Polling fallback when WebSocket is not available
   */
  private startPollingFallback(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      // Only poll if WebSocket is not connected and we have subscribers
      if ((!this.ws || this.ws.readyState !== WebSocket.OPEN) && this.subscribers.size > 0) {
        try {
          await this.fetchRealTimeData();
        } catch (error) {
          console.error('Polling error:', error);
        }
      }
    }, 5000); // Poll every 5 seconds
  }

  /**
   * Fetch real-time data from API endpoints
   */
  private async fetchRealTimeData(): Promise<void> {
    try {
      const responses = await Promise.allSettled([
        comprehensiveAPI.dashboard.realData(),
        comprehensiveAPI.systemMonitoring.currentMetrics(),
        comprehensiveAPI.fl.status(),
        comprehensiveAPI.security.status(),
        comprehensiveAPI.monitoring.systemOverview()
      ]);

      const realTimeData: RealTimeData = {
        timestamp: new Date().toISOString(),
        system: {},
        federatedLearning: {},
        security: {},
        monitoring: {},
        source: 'polling'
      };

      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value && !response.value.fallback) {
          switch (index) {
            case 0: // Dashboard data
              Object.assign(realTimeData, response.value);
              break;
            case 1: // System metrics
              realTimeData.system = response.value;
              break;
            case 2: // FL status
              realTimeData.federatedLearning = response.value;
              break;
            case 3: // Security status
              realTimeData.security = response.value;
              break;
            case 4: // Monitoring overview
              realTimeData.monitoring = response.value;
              break;
          }
        }
      });

      this.handleRealTimeData(realTimeData);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  }

  /**
   * Get current cached data
   */
  getCurrentData(): RealTimeData | null {
    return this.dataCache;
  }

  /**
   * Force refresh data
   */
  async refreshData(): Promise<void> {
    await this.fetchRealTimeData();
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    type: 'websocket' | 'polling' | 'disconnected';
    subscribers: number;
  } {
    const wsConnected = this.ws?.readyState === WebSocket.OPEN;
    
    return {
      connected: wsConnected || this.subscribers.size > 0,
      type: wsConnected ? 'websocket' : (this.subscribers.size > 0 ? 'polling' : 'disconnected'),
      subscribers: this.subscribers.size
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.subscribers.clear();
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();

// React hook for easy integration
export function useRealTimeData(
  topics: string[] = ['all'],
  onData?: (data: RealTimeData) => void
) {
  const [data, setData] = React.useState<RealTimeData | null>(null);
  const [connected, setConnected] = React.useState(false);
  const subscriberId = React.useRef<string>();

  React.useEffect(() => {
    subscriberId.current = `subscriber_${Date.now()}_${Math.random()}`;

    const handleData = (newData: RealTimeData) => {
      setData(newData);
      onData?.(newData);
    };

    realTimeDataService.subscribe(subscriberId.current, handleData, topics);

    // Update connection status
    const updateConnectionStatus = () => {
      const status = realTimeDataService.getConnectionStatus();
      setConnected(status.connected);
    };

    updateConnectionStatus();
    const statusInterval = setInterval(updateConnectionStatus, 2000);

    return () => {
      if (subscriberId.current) {
        realTimeDataService.unsubscribe(subscriberId.current);
      }
      clearInterval(statusInterval);
    };
  }, [topics.join(',')]);

  const refresh = React.useCallback(() => {
    realTimeDataService.refreshData();
  }, []);

  return {
    data,
    connected,
    refresh,
    connectionStatus: realTimeDataService.getConnectionStatus()
  };
}

export default realTimeDataService;
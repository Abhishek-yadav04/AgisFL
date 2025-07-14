
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: any) => void;
  lastMessage: any;
}

const WebSocketContext = createContext<WebSocketContextType>({
  ws: null,
  connectionStatus: 'disconnected',
  sendMessage: () => {},
  lastMessage: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const getWebSocketUrl = () => {
    // Try to get server info from current URL or environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || '5000';
    
    // For external clients, try multiple connection methods
    const urls = [
      `${protocol}//${host}:${port}/ws`,
      `${protocol}//${host}:5000/ws`,
      `ws://localhost:5000/ws`,
      `ws://0.0.0.0:5000/ws`
    ];
    
    return urls;
  };

  const connectWebSocket = async () => {
    const urls = getWebSocketUrl();
    
    for (const url of urls) {
      try {
        console.log(`Attempting WebSocket connection to: ${url}`);
        setConnectionStatus('connecting');
        
        const websocket = new WebSocket(url);
        
        websocket.onopen = () => {
          console.log(`WebSocket connected to: ${url}`);
          setConnectionStatus('connected');
          setWs(websocket);
          
          // Subscribe to channels
          websocket.send(JSON.stringify({
            type: 'subscribe',
            channel: 'threats'
          }));
          
          websocket.send(JSON.stringify({
            type: 'subscribe',
            channel: 'incidents'
          }));
          
          websocket.send(JSON.stringify({
            type: 'subscribe',
            channel: 'system_metrics'
          }));
          
          websocket.send(JSON.stringify({
            type: 'subscribe',
            channel: 'ai_insights'
          }));
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
            console.log('WebSocket message received:', message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          setConnectionStatus('disconnected');
          setWs(null);
          
          // Reconnect after delay
          setTimeout(() => {
            connectWebSocket();
          }, 5000);
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
        };

        // Wait for connection to establish or fail
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            websocket.close();
            reject(new Error('Connection timeout'));
          }, 5000);
          
          websocket.onopen = () => {
            clearTimeout(timeout);
            resolve(websocket);
          };
          
          websocket.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          };
        });
        
        return; // Success, exit the loop
        
      } catch (error) {
        console.error(`Failed to connect to ${url}:`, error);
        continue; // Try next URL
      }
    }
    
    // If all connections failed
    setConnectionStatus('error');
    console.error('All WebSocket connection attempts failed');
  };

  const sendMessage = (message: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{
      ws,
      connectionStatus,
      sendMessage,
      lastMessage,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};

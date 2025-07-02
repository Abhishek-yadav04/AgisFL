import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  send: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);
        console.log('WebSocket message:', message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
      console.log('WebSocket disconnected');
      
      // Don't attempt to reconnect in development to avoid connection spam
      // setTimeout(() => {
      //   if (!socket || socket.readyState === WebSocket.CLOSED) {
      //     console.log('Attempting to reconnect...');
      //     setSocket(null);
      //   }
      // }, 5000);
    };

    ws.onerror = (error) => {
      console.warn('WebSocket error in development:', error);
      // Gracefully handle WebSocket errors in development
      setIsConnected(false);
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, []);

  const subscribe = useCallback((channel: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', channel }));
      setSubscriptions(prev => {
        const newSubs = new Set(prev);
        newSubs.add(channel);
        return newSubs;
      });
    }
  }, [socket]);

  const unsubscribe = useCallback((channel: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'unsubscribe', channel }));
      setSubscriptions(prev => {
        const newSubs = new Set(prev);
        newSubs.delete(channel);
        return newSubs;
      });
    }
  }, [socket]);

  const send = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  const contextValue: WebSocketContextType = {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    send
  };

  return React.createElement(
    WebSocketContext.Provider,
    { value: contextValue },
    children
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
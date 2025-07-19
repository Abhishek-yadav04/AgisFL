import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Alert } from "@shared/schema";

interface NotificationToastProps {
  alerts: Alert[];
}

export function NotificationToast({ alerts }: NotificationToastProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Show only unacknowledged critical and warning alerts
    const newAlerts = alerts.filter(
      alert => !alert.acknowledged && (alert.type === 'critical' || alert.type === 'warning')
    ).slice(0, 3); // Limit to 3 visible alerts
    
    setVisibleAlerts(newAlerts);
  }, [alerts]);

  const dismissAlert = (alertId: number) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-500 border-red-500';
      case 'warning':
        return 'bg-yellow-500 border-yellow-500';
      case 'info':
        return 'bg-blue-500 border-blue-500';
      default:
        return 'bg-gray-500 border-gray-500';
    }
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 space-y-3 z-50">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${getAlertStyles(alert.type)} border bg-opacity-90 backdrop-blur-sm p-4 rounded-lg shadow-lg max-w-sm animate-pulse`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <AlertTriangle className="text-white mr-3 mt-1 h-4 w-4" />
              <div className="flex-1">
                <h4 className="font-semibold text-white">{alert.title}</h4>
                <p className="text-sm text-white opacity-90 mt-1">{alert.message}</p>
                <p className="text-xs text-white opacity-70 mt-2">{formatTime(alert.timestamp)}</p>
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration (default 5 seconds)
    setTimeout(() => {
      hideToast(id);
    }, toast.duration || 5000);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-start p-4 border rounded-lg shadow-lg transition-all duration-300',
              'transform translate-x-0 opacity-100',
              getToastStyles(toast.type)
            )}
          >
            <div className="flex-shrink-0">
              {getToastIcon(toast.type)}
            </div>
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{toast.title}</div>
              {toast.message && (
                <div className="mt-1 text-sm opacity-80">{toast.message}</div>
              )}
            </div>
            <button
              onClick={() => hideToast(toast.id)}
              className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

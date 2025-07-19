import React, { useState, useEffect } from 'react';
import { Alert, AlertType } from '@shared/schema';

interface NotificationToastProps {
  alerts: Alert[];
}

export function NotificationToast({ alerts }: NotificationToastProps) {
  const [displayedAlerts, setDisplayedAlerts] = useState<Set<number>>(new Set());
  const [visibleToasts, setVisibleToasts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Filter for high-priority, non-displayed alerts
    const newAlerts = alerts.filter(alert => 
      !displayedAlerts.has(alert.id) && 
      (alert.severity === 'critical' || alert.severity === 'high')
    );

    if (newAlerts.length > 0) {
      // Limit to 3 simultaneous toasts
      const toShow = newAlerts.slice(0, 3);

      setVisibleToasts(prev => [...prev, ...toShow]);
      setDisplayedAlerts(prev => new Set([...prev, ...toShow.map(a => a.id)]));

      // Auto-dismiss after 5 seconds
      toShow.forEach(alert => {
        setTimeout(() => {
          setVisibleToasts(prev => prev.filter(t => t.id !== alert.id));
        }, 5000);
      });
    }
  }, [alerts, displayedAlerts]);

  const dismissToast = (alertId: number) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== alertId));
  };

  if (visibleToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {visibleToasts.map((alert) => (
        <div
          key={alert.id}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300
            ${alert.severity === 'critical' ? 'bg-red-900 border-red-500' : 
              alert.severity === 'high' ? 'bg-orange-900 border-orange-500' : 
              'bg-yellow-900 border-yellow-500'}
            border-l-4 text-white animate-slide-in
          `}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{alert.type}</h4>
              <p className="text-xs mt-1 opacity-90">{alert.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => dismissToast(alert.id)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
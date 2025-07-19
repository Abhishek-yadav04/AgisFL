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

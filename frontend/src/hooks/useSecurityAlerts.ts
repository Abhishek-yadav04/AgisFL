import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  source: 'ids' | 'fl' | 'system';
  acknowledged: boolean;
}

export const useSecurityAlerts = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const addAlert = useCallback((alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      acknowledged: false
    };

    setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);

    // Toast notification based on severity
    const toastOptions = { duration: alert.type === 'critical' ? 10000 : 4000 };
    
    switch (alert.type) {
      case 'critical':
        toast.error(`🚨 ${alert.title}: ${alert.message}`, toastOptions);
        break;
      case 'high':
        toast.error(`⚠️ ${alert.title}`, toastOptions);
        break;
      case 'medium':
        toast(`🔶 ${alert.title}`, toastOptions);
        break;
      default:
        toast(`ℹ️ ${alert.title}`, toastOptions);
    }

    // In real implementation: send to external systems
    // await sendToSlack(newAlert);
    // await sendEmail(newAlert);
    // await logToElastic(newAlert);
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    addAlert,
    acknowledgeAlert,
    clearAlerts,
    unacknowledgedCount: alerts.filter(a => !a.acknowledged).length
  };
};
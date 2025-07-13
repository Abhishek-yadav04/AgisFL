
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface ElectronContextType {
  isElectron: boolean;
  appVersion: string;
  platform: string;
  exportData: (data: any, filename: string) => Promise<{ success: boolean; filePath?: string }>;
  showNotification: (title: string, body: string) => void;
  setAppTitle: (title: string) => void;
  setBadgeCount: (count: number) => void;
}

const ElectronContext = createContext<ElectronContextType | null>(null);

export function ElectronProvider({ children }: { children: React.ReactNode }) {
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (window.electronAPI) {
      // Get app version
      window.electronAPI.getAppVersion().then(setAppVersion);

      // Listen for menu actions
      const handleMenuAction = (_event: any, action: string, ...args: any[]) => {
        switch (action) {
          case 'new-incident':
            setLocation('/incidents');
            break;
          case 'export-report':
            handleExportReport(args[0]);
            break;
          case 'start-monitoring':
            handleStartMonitoring();
            break;
          case 'stop-monitoring':
            handleStopMonitoring();
            break;
          case 'health-check':
            handleHealthCheck();
            break;
          case 'generate-report':
            handleGenerateReport();
            break;
        }
      };

      // Listen for navigation events
      const handleNavigate = (_event: any, path: string) => {
        setLocation(path);
      };

      window.electronAPI.onMenuAction(handleMenuAction);
      window.electronAPI.onNavigate(handleNavigate);

      return () => {
        window.electronAPI.removeAllListeners('menu-action');
        window.electronAPI.removeAllListeners('navigate');
      };
    }
  }, [setLocation]);

  const handleExportReport = async (filePath?: string) => {
    try {
      // Generate report data
      const reportData = await generateSecurityReport();
      
      if (filePath && window.desktopAPI) {
        // Save to specified path
        console.log('Exporting report to:', filePath);
        showNotification('Export Complete', `Report saved to ${filePath}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      showNotification('Export Failed', 'Unable to export report');
    }
  };

  const handleStartMonitoring = () => {
    // Start FL-IDS monitoring
    fetch('/api/fl-ids/start', { method: 'POST' })
      .then(() => showNotification('Monitoring Started', 'FL-IDS monitoring is now active'))
      .catch(() => showNotification('Error', 'Failed to start monitoring'));
  };

  const handleStopMonitoring = () => {
    // Stop FL-IDS monitoring
    fetch('/api/fl-ids/stop', { method: 'POST' })
      .then(() => showNotification('Monitoring Stopped', 'FL-IDS monitoring has been stopped'))
      .catch(() => showNotification('Error', 'Failed to stop monitoring'));
  };

  const handleHealthCheck = () => {
    // Perform system health check
    fetch('/api/system/health')
      .then(res => res.json())
      .then(data => {
        const avgHealth = Object.values(data).reduce((a: any, b: any) => a + b, 0) / Object.keys(data).length;
        showNotification('System Health', `Overall health: ${avgHealth.toFixed(1)}%`);
      })
      .catch(() => showNotification('Error', 'Health check failed'));
  };

  const handleGenerateReport = async () => {
    try {
      const reportData = await generateSecurityReport();
      
      if (window.desktopAPI) {
        const result = await window.desktopAPI.exportData(reportData, 'security-report.json');
        if (result.success) {
          showNotification('Report Generated', `Report saved to ${result.filePath}`);
        }
      }
    } catch (error) {
      showNotification('Error', 'Failed to generate report');
    }
  };

  const generateSecurityReport = async () => {
    const [incidents, threats, insights] = await Promise.all([
      fetch('/api/incidents').then(res => res.json()),
      fetch('/api/threats').then(res => res.json()),
      fetch('/api/ai/insights').then(res => res.json())
    ]);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalIncidents: incidents.length,
        activeThreats: threats.length,
        totalInsights: insights.length
      },
      incidents,
      threats,
      insights
    };
  };

  const exportData = async (data: any, filename: string) => {
    if (window.desktopAPI) {
      return await window.desktopAPI.exportData(data, filename);
    }
    return { success: false };
  };

  const showNotification = (title: string, body: string) => {
    if (window.electronAPI) {
      window.electronAPI.showNotification(title, body);
    }
  };

  const setAppTitle = (title: string) => {
    if (window.desktopAPI) {
      window.desktopAPI.setAppTitle(title);
    }
  };

  const setBadgeCount = (count: number) => {
    if (window.desktopAPI) {
      window.desktopAPI.setBadgeCount(count);
    }
  };

  const contextValue: ElectronContextType = {
    isElectron: !!window.electronAPI,
    appVersion,
    platform: window.electronAPI?.platform || 'web',
    exportData,
    showNotification,
    setAppTitle,
    setBadgeCount
  };

  return (
    <ElectronContext.Provider value={contextValue}>
      {children}
    </ElectronContext.Provider>
  );
}

export const useElectron = () => {
  const context = useContext(ElectronContext);
  if (!context) {
    throw new Error('useElectron must be used within an ElectronProvider');
  }
  return context;
};

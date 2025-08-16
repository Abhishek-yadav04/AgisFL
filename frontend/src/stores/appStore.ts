import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Layout
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  
  // Real-time settings
  autoRefresh: boolean;
  refreshInterval: number;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  }>;
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Connection status
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  setConnectionStatus: (status: AppState['connectionStatus']) => void;
  
  // Active features
  activeFeatures: {
    realTimeMonitoring: boolean;
    attackSimulation: boolean;
    flTraining: boolean;
    networkCapture: boolean;
  };
  toggleFeature: (feature: keyof AppState['activeFeatures']) => void;
  
  // Performance settings
  performanceMode: 'high' | 'balanced' | 'power-save';
  setPerformanceMode: (mode: AppState['performanceMode']) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      })),
      
      // Layout
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      // Real-time settings
      autoRefresh: true,
      refreshInterval: 5000,
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            read: false,
          },
          ...state.notifications.slice(0, 49), // Keep max 50 notifications
        ]
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      })),
      clearNotifications: () => set({ notifications: [] }),
      
      // Connection status
      connectionStatus: 'disconnected',
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      
      // Active features
      activeFeatures: {
        realTimeMonitoring: true,
        attackSimulation: false,
        flTraining: true,
        networkCapture: true,
      },
      toggleFeature: (feature) => set((state) => ({
        activeFeatures: {
          ...state.activeFeatures,
          [feature]: !state.activeFeatures[feature],
        }
      })),
      
      // Performance settings
      performanceMode: 'balanced',
      setPerformanceMode: (mode) => set({ performanceMode: mode }),
    }),
    {
      name: 'agisfl-app-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        activeFeatures: state.activeFeatures,
        performanceMode: state.performanceMode,
      }),
    }
  )
);
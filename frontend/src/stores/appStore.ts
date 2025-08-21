import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type Theme = 'dark' | 'light';
type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
type PerformanceMode = 'high' | 'balanced' | 'power-save';
type UserRole = 'admin' | 'researcher' | 'operator' | 'guest';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  avatarUrl?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface UserSettings {
  autoRefresh: boolean;
  refreshInterval: 5000 | 10000 | 30000;
  performanceMode: PerformanceMode;
  language: 'en-US' | 'de-DE' | 'ja-JP';
}

// ============================================================================
// STATE INTERFACE
// ============================================================================
interface AppState {
  // UI Slice
  theme: Theme;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // User Session Slice
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;

  // User Settings Slice
  autoRefresh: boolean;
  refreshInterval: number;
  performanceMode: PerformanceMode;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;

  // Notifications Slice
  notifications: Notification[];
  unreadNotificationsCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // System Status Slice
  connectionStatus: ConnectionStatus;
  lastConnected: Date | null;
  activeFeatures: {
    realTimeMonitoring: boolean;
    attackSimulation: boolean;
    flTraining: boolean;
  };
  setConnectionStatus: (status: ConnectionStatus) => void;
  toggleFeature: (feature: keyof AppState['activeFeatures']) => void;
}

// ============================================================================
// ZUSTAND STORE IMPLEMENTATION
// ============================================================================
export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // UI Slice
      theme: 'dark',
      sidebarCollapsed: false,
      activeModal: null,
      
      toggleTheme: () => set(state => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
      }),
      
      toggleSidebar: () => set(state => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

      openModal: (modalId) => set(state => {
        state.activeModal = modalId;
      }),

      closeModal: () => set(state => {
        state.activeModal = null;
      }),

      // User Session Slice
      user: {
        id: 'admin-001',
        name: 'System Administrator',
        email: 'admin@agisfl.com',
        role: 'admin',
        permissions: ['read', 'write', 'admin', 'fl_control', 'security_manage'],
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
      },
      isAuthenticated: true,

      login: (userData) => set(state => {
        state.user = userData;
        state.isAuthenticated = true;
      }),

      logout: () => set(state => {
        state.user = null;
        state.isAuthenticated = false;
      }),

      hasPermission: (permission) => {
        const user = get().user;
        return user?.permissions.includes(permission) ?? false;
      },

      // User Settings Slice
      autoRefresh: true,
      refreshInterval: 5000,
      performanceMode: 'balanced',

      setAutoRefresh: (enabled) => set(state => {
        state.autoRefresh = enabled;
      }),

      setRefreshInterval: (interval) => set(state => {
        state.refreshInterval = interval;
      }),

      setPerformanceMode: (mode) => set(state => {
        state.performanceMode = mode;
      }),

      // Notifications Slice
      notifications: [],
      unreadNotificationsCount: 0,

      addNotification: (notification) => set(state => {
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          read: false,
        };
        state.notifications.unshift(newNotification);
        if (state.notifications.length > 50) {
          state.notifications.pop();
        }
        state.unreadNotificationsCount++;
      }),

      markAsRead: (id) => set(state => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadNotificationsCount--;
        }
      }),
      
      markAllAsRead: () => set(state => {
        state.notifications.forEach(n => { n.read = true; });
        state.unreadNotificationsCount = 0;
      }),

      clearNotifications: () => set(state => {
        state.notifications = [];
        state.unreadNotificationsCount = 0;
      }),

      // System Status Slice
      connectionStatus: 'disconnected',
      lastConnected: null,
      activeFeatures: {
        realTimeMonitoring: true,
        attackSimulation: false,
        flTraining: true,
      },

      setConnectionStatus: (status) => set(state => {
        state.connectionStatus = status;
        if (status === 'connected') {
          state.lastConnected = new Date();
        }
      }),

      toggleFeature: (feature) => set(state => {
        state.activeFeatures[feature] = !state.activeFeatures[feature];
      }),
    })),
    {
      name: 'agisfl-enterprise-app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        autoRefresh: state.autoRefresh,
        refreshInterval: state.refreshInterval,
        performanceMode: state.performanceMode,
      }),
    }
  )
);

// Selectors
export const selectUnreadNotifications = (state: AppState) => 
  state.notifications.filter(n => !n.read);

export const selectIsAdmin = (state: AppState) => 
  state.user?.role === 'admin';
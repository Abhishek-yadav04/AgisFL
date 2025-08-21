import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// 1. TYPE DEFINITIONS
// ============================================================================
// Centralized type definitions for clarity and maintainability.

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
  refreshInterval: 5000 | 10000 | 30000; // 5s, 10s, 30s
  performanceMode: PerformanceMode;
  language: 'en-US' | 'de-DE' | 'ja-JP';
}

// ============================================================================
// 2. STATE INTERFACE
// ============================================================================
// The complete shape of our global state, composed of logical slices.

interface AppState {
  // --- UI Slice ---
  theme: Theme;
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  
  // --- User Session Slice ---
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;

  // --- User Settings Slice ---
  userSettings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // --- Notifications Slice ---
  notifications: Notification[];
  unreadNotificationsCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // --- System Status Slice ---
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
// 3. ZUSTAND STORE IMPLEMENTATION
// ============================================================================
// Uses `immer` for safe immutable updates and `persist` for storing user preferences.

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // ===================================
      // UI Slice
      // For managing the state of the user interface.
      // ===================================
      theme: 'dark',
      sidebarCollapsed: false,
      activeModal: null,
      
      /** Toggles the color scheme between dark and light mode. */
      toggleTheme: () => set(state => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
      }),
      
      /** Toggles the collapsed state of the main sidebar. */
      toggleSidebar: () => set(state => {
        state.sidebarCollapsed = !state.sidebarCollapsed;
      }),

      /** Opens a modal dialog by its unique identifier. */
      openModal: (modalId) => set(state => {
        state.activeModal = modalId;
      }),

      /** Closes any currently active modal dialog. */
      closeModal: () => set(state => {
        state.activeModal = null;
      }),

      // ===================================
      // User Session Slice
      // Handles user authentication and permissions.
      // ===================================
      user: null,
      isAuthenticated: false,

      /** Logs a user in and sets their session data. */
      login: (userData) => set(state => {
        state.user = userData;
        state.isAuthenticated = true;
      }),

      /** Logs the current user out and clears session data. */
      logout: () => set(state => {
        state.user = null;
        state.isAuthenticated = false;
      }),

      /** Checks if the authenticated user has a specific permission. */
      hasPermission: (permission) => {
        const user = get().user;
        return user?.permissions.includes(permission) ?? false;
      },

      // ===================================
      // User Settings Slice
      // Manages user-configurable application settings.
      // ===================================
      userSettings: {
        autoRefresh: true,
        refreshInterval: 5000,
        performanceMode: 'balanced',
        language: 'en-US',
      },

      /** Updates one or more user settings. */
      updateSettings: (settings) => set(state => {
        state.userSettings = { ...state.userSettings, ...settings };
      }),

      // ===================================
      // Notifications Slice
      // Manages a queue of global notifications for the user.
      // ===================================
      notifications: [],
      unreadNotificationsCount: 0,

      /** Adds a new notification to the top of the list. */
      addNotification: (notification) => set(state => {
        const newNotification: Notification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
          read: false,
        };
        state.notifications.unshift(newNotification);
        // Limit the number of notifications stored
        if (state.notifications.length > 50) {
          state.notifications.pop();
        }
        state.unreadNotificationsCount++;
      }),

      /** Marks a single notification as read by its ID. */
      markAsRead: (id) => set(state => {
        const notification = state.notifications.find(n => n.id === id);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadNotificationsCount--;
        }
      }),
      
      /** Marks all notifications as read. */
      markAllAsRead: () => set(state => {
        state.notifications.forEach(n => { n.read = true; });
        state.unreadNotificationsCount = 0;
      }),

      /** Removes all notifications from the store. */
      clearNotifications: () => set(state => {
        state.notifications = [];
        state.unreadNotificationsCount = 0;
      }),

      // ===================================
      // System Status Slice
      // Tracks the real-time status of the application and its features.
      // ===================================
      connectionStatus: 'disconnected',
      lastConnected: null,
      activeFeatures: {
        realTimeMonitoring: true,
        attackSimulation: false,
        flTraining: true,
      },

      /** Sets the current backend connection status. */
      setConnectionStatus: (status) => set(state => {
        state.connectionStatus = status;
        if (status === 'connected') {
          state.lastConnected = new Date();
        }
      }),

      /** Toggles the active state of a core system feature. */
      toggleFeature: (feature) => set(state => {
        state.activeFeatures[feature] = !state.activeFeatures[feature];
      }),
    })),
    {
      name: 'agisfl-enterprise-app-store',
      storage: createJSONStorage(() => localStorage),
      /**
       * The `partialize` option allows us to select which parts of the state
       * should be persisted to localStorage. We only want to save user preferences,
       * not transient state like notifications or connection status.
       */
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        userSettings: state.userSettings,
      }),
    }
  )
);

// ============================================================================
// 4. SELECTORS (Optional but Recommended)
// ============================================================================
// Pre-defined selectors can simplify component logic and improve performance.

export const selectUnreadNotifications = (state: AppState) => 
  state.notifications.filter(n => !n.read);

export const selectIsAdmin = (state: AppState) => 
  state.user?.role === 'admin';

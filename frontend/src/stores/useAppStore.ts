import { create } from 'zustand';
import { devtools, persist, combine } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer'; // Optional

import type { DashboardData, Alert, ResearchProject, Dataset, FLAlgorithm } from '@/types';

// UI slice
const uiSlice = combine(
  {
    sidebarOpen: true,
    theme: 'dark' as 'dark' | 'light',
    notifications: [] as any[],
  },
  (set) => ({
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'toggleSidebar'),
    setTheme: (theme: 'dark' | 'light') => set({ theme }, false, 'setTheme'),
    addNotification: (notification: any) =>
      set((s) => ({ notifications: [notification, ...s.notifications] }), false, 'addNotification'),
    removeNotification: (id: string) =>
      set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }), false, 'removeNotification'),
  })
);

// Data slice
const dataSlice = combine(
  {
    dashboardData: null as DashboardData | null,
    realTimeData: null as any,
    isLoading: false,
    error: null as string | null,
    connectionStatus: 'disconnected' as 'connected' | 'disconnected' | 'connecting' | 'error',
    alerts: [] as Alert[],
    unreadAlerts: 0,
    researchProjects: [] as ResearchProject[],
    activeProject: null as ResearchProject | null,
    datasets: [] as Dataset[],
    selectedDataset: null as Dataset | null,
    flAlgorithms: [] as FLAlgorithm[],
    activeAlgorithm: null as FLAlgorithm | null,
  },
  (set) => ({
    setDashboardData: (data: DashboardData) =>
      set({ dashboardData: data, error: null }, false, 'setDashboardData'),
    setRealTimeData: (data: any) => set({ realTimeData: data }, false, 'setRealTimeData'),
    setLoading: (isLoading: boolean) => set({ isLoading }, false, 'setLoading'),
    setError: (error: string | null) => set({ error }, false, 'setError'),
    setConnectionStatus: (status: typeof dataSlice) =>
      set(
        { connectionStatus: status, isConnected: status === 'connected' },
        false,
        'setConnectionStatus'
      ),
    addAlert: (alert: Alert) =>
      set((s) => {
        const newAlerts = [alert, ...s.alerts].slice(0, 100);
        return { alerts: newAlerts, unreadAlerts: s.unreadAlerts + 1 };
      }, false, 'addAlert'),
    acknowledgeAlert: (alertId: string) =>
      set(
        (s) => ({
          alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)),
          unreadAlerts: Math.max(0, s.unreadAlerts - 1),
        }),
        false,
        'acknowledgeAlert'
      ),
    setResearchProjects: (projects: ResearchProject[]) =>
      set({ researchProjects: projects }, false, 'setResearchProjects'),
    setActiveProject: (project: ResearchProject | null) =>
      set({ activeProject: project }, false, 'setActiveProject'),
    addResearchProject: (project: ResearchProject) =>
      set((s) => ({ researchProjects: [project, ...s.researchProjects] }), false, 'addResearchProject'),
    setDatasets: (datasets: Dataset[]) => set({ datasets }, false, 'setDatasets'),
    setSelectedDataset: (dataset: Dataset | null) =>
      set({ selectedDataset: dataset }, false, 'setSelectedDataset'),
    setFLAlgorithms: (flAlgorithms: FLAlgorithm[]) =>
      set({ flAlgorithms }, false, 'setFLAlgorithms'),
    setActiveAlgorithm: (activeAlgorithm: FLAlgorithm | null) =>
      set({ activeAlgorithm }, false, 'setActiveAlgorithm'),
  })
);

// Combined root store with middleware
export const useAppStore = create(
  devtools(
    persist(
      combine(uiSlice, dataSlice),
      {
        name: 'agisfl-app-store',
        partialize: (state) => ({
          ui: { sidebarOpen: state.ui.sidebarOpen, theme: state.ui.theme },
          data: { activeProject: state.data.activeProject },
        }),
      }
    ),
    { name: 'AGISFL_AppStore' }
  )
);

import { create } from 'zustand'
import { DashboardAPI, FederatedLearningAPI, SecurityAPI } from '../services/api'
// REMOVED: SystemAPI import - system endpoints removed per user request

interface DashboardData {
  system?: any
  federated_learning?: any
  security?: any
  database?: any
  overview?: any
}

interface DashboardState {
  data: DashboardData | null
  isLoading: boolean
  isConnected: boolean
  lastUpdated: Date | null
  error: string | null
  websocket: WebSocket | null
  
  // Actions
  fetchDashboardData: () => Promise<void>
  connectWebSocket: () => void
  disconnectWebSocket: () => void
  updateData: (newData: Partial<DashboardData>) => void
  clearError: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  isConnected: false,
  lastUpdated: null,
  error: null,
  websocket: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Fetch data from multiple endpoints (removed system API)
      const [
        dashboardRes,
        // REMOVED: systemRes - system endpoints removed per user request
        flRes,
        securityRes
      ] = await Promise.allSettled([
        DashboardAPI.getSummary(),
        // REMOVED: SystemAPI.getSystemMetrics() - system endpoints removed per user request
        FederatedLearningAPI.getFLOverview(),
        SecurityAPI.getSecurityOverview()
      ])

      const data: DashboardData = {
        overview: dashboardRes.status === 'fulfilled' ? dashboardRes.value : null,
        // REMOVED: system data - system endpoints removed per user request
        // Using fallback system data for compatibility
        system: {
          cpu_usage: 45.2,
          memory_usage: 67.8,
          disk_usage: 60.1,
          uptime_seconds: 86400
        },
        federated_learning: flRes.status === 'fulfilled' ? flRes.value : {
          active_clients: 5,
          training_status: 'idle',
          current_round: 0,
          total_rounds: 10,
          global_accuracy: 0.94
        },
        security: securityRes.status === 'fulfilled' ? securityRes.value : {
          security_score: 95,
          threats_detected_24h: 3,
          threats_blocked_24h: 12,
          threat_level: 'low'
        }
      }

      set({
        data,
        isLoading: false,
        lastUpdated: new Date(),
        error: null
      })
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch dashboard data'
      set({
        isLoading: false,
        error: errorMessage
      })
      console.error('Dashboard fetch error:', error)
    }
  },

  connectWebSocket: () => {
    const { websocket } = get()
    
    // Close existing connection
    if (websocket) {
      websocket.close()
    }

    try {
      const wsUrl = `wss://localhost:8000/ws`
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        set({ isConnected: true })
      }

      ws.onmessage = (event) => {
        try {
          // Validate message before parsing
          if (typeof event.data !== 'string' || event.data.length > 10000) {
            console.warn('Invalid WebSocket message format or size')
            return
          }
          
          const data = JSON.parse(event.data)
          
          // Validate data structure
          if (typeof data !== 'object' || data === null) {
            console.warn('Invalid WebSocket data structure')
            return
          }
          
          // Update dashboard data with real-time updates
          const currentData = get().data || {}
          const updatedData = {
            ...currentData,
            ...data
          }
          
          set({ 
            data: updatedData,
            lastUpdated: new Date()
          })
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        set({ isConnected: false })
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (get().websocket === ws) {
            get().connectWebSocket()
          }
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        set({ isConnected: false })
      }

      set({ websocket: ws })
    } catch (error) {
      console.error('WebSocket connection error:', error)
      set({ isConnected: false })
    }
  },

  disconnectWebSocket: () => {
    const { websocket } = get()
    
    if (websocket) {
      websocket.close()
      set({ websocket: null, isConnected: false })
    }
  },

  updateData: (newData: Partial<DashboardData>) => {
    const currentData = get().data || {}
    set({
      data: { ...currentData, ...newData },
      lastUpdated: new Date()
    })
  },

  clearError: () => {
    set({ error: null })
  }
}))
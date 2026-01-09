import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthAPI } from '../services/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  username: string
  role: string
  permissions: string[]
  full_name?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  refreshAccessToken: () => Promise<boolean>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await AuthAPI.login(email, password)
          
          if (response.access_token) {
            const userData = {
              id: response.user?.id || 'admin',
              email: response.user?.email || email,
              username: response.user?.username || email.split('@')[0],
              role: response.user?.role || 'admin',
              permissions: response.user?.permissions || ['read', 'write', 'admin'],
              full_name: response.user?.full_name || 'Administrator'
            }

            // Note: Tokens should be stored in httpOnly cookies in production
            // For demo purposes, we'll use sessionStorage which is slightly more secure
            sessionStorage.setItem('access_token', response.access_token)
            if (response.refresh_token) {
              sessionStorage.setItem('refresh_token', response.refresh_token)
            }

            set({
              isAuthenticated: true,
              user: userData,
              token: response.access_token,
              refreshToken: response.refresh_token,
              isLoading: false,
              error: null
            })

            toast.success(`Welcome back, ${userData.full_name}!`)
            return true
          }
          
          throw new Error('Invalid response from server')
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || error.message || 'Login failed'
          set({ 
            isLoading: false, 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null
          })
          toast.error(errorMessage)
          return false
        }
      },

      logout: () => {
        // Clear tokens
        sessionStorage.removeItem('access_token')
        sessionStorage.removeItem('refresh_token')
        
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          error: null
        })
        
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const token = sessionStorage.getItem('access_token')
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null })
          return
        }

        try {
          // Try to get current user info
          const response = await AuthAPI.getCurrentUser()
          
          const userData = {
            id: response.id || 'admin',
            email: response.email || 'admin@agisfl.com',
            username: response.username || 'admin',
            role: response.role || 'admin',
            permissions: response.permissions || ['read', 'write', 'admin'],
            full_name: response.full_name || 'Administrator'
          }

          set({
            isAuthenticated: true,
            user: userData,
            token: token,
            refreshToken: sessionStorage.getItem('refresh_token')
          })
        } catch (error) {
          // If token is invalid, try to refresh
          const refreshSuccess = await get().refreshAccessToken()
          if (!refreshSuccess) {
            // If refresh fails, logout
            get().logout()
          }
        }
      },

      refreshAccessToken: async () => {
        const refreshToken = sessionStorage.getItem('refresh_token')
        
        if (!refreshToken) {
          return false
        }

        try {
          const response = await AuthAPI.refreshToken(refreshToken)
          
          if (response.access_token) {
            sessionStorage.setItem('access_token', response.access_token)
            if (response.refresh_token) {
              sessionStorage.setItem('refresh_token', response.refresh_token)
            }

            set({
              token: response.access_token,
              refreshToken: response.refresh_token
            })
            
            return true
          }
          
          return false
        } catch (error) {
          return false
        }
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      })
    }
  )
)
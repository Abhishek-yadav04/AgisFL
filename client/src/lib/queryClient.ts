
import { QueryClient } from '@tanstack/react-query';

// Enhanced configuration for production reliability
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      onError: (error: any) => {
        console.error('Query error:', error);
        // Log to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          // Add your error tracking service here
        }
      },
    },
    mutations: {
      retry: 1,
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Show user-friendly error message
        if (error?.message) {
          // You can integrate with a toast notification system here
        }
      },
    },
  },
});

// Enhanced fetch function with better error handling
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('agiesfl_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('agiesfl_token');
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If not JSON, use the text response
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    // Network errors or other fetch failures
    if (error instanceof TypeError) {
      throw new Error('Network error: Please check your internet connection');
    }
    throw error;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('agiesfl_token');
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch {
    return false;
  }
};

// Helper function to get user info from token
export const getUserInfo = () => {
  const token = localStorage.getItem('agiesfl_token');
  if (!token) return null;
  
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export default queryClient;

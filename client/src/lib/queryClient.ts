import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors or in development mode
        if (process.env.NODE_ENV === 'development') {
          return false;
        }
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      // Enhanced error handling to prevent console spam
      onError: (error: any) => {
        if (process.env.NODE_ENV !== 'development') {
          console.warn('Query error:', error?.message || 'Unknown error');
        }
      },
      // Use queryFn that handles failures gracefully
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        try {
          const response = await authenticatedFetch(url);
          return await response.json();
        } catch (error) {
          // Return mock data for development
          if (process.env.NODE_ENV === 'development') {
            return getMockData(url, 'GET');
          }
          throw error;
        }
      }
    },
    mutations: {
      onError: (error: any) => {
        if (process.env.NODE_ENV !== 'development') {
          console.error('Mutation error:', error?.message || 'Unknown error');
        }
      }
    }
  },
});

// Check if user is authenticated with better error handling
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // For development, allow access without token
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      return false;
    }

    // Validate token structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      localStorage.removeItem('auth_token');
      return process.env.NODE_ENV === 'development';
    }

    const payload = JSON.parse(atob(parts[1]));
    const isValid = payload.exp > Date.now() / 1000;

    if (!isValid) {
      localStorage.removeItem('auth_token');
      return process.env.NODE_ENV === 'development';
    }

    return true;
  } catch (error) {
    console.warn('Authentication check failed:', error);
    localStorage.removeItem('auth_token');
    return process.env.NODE_ENV === 'development';
  }
};

// API request helper function with comprehensive error handling
export const apiRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<any> => {
  try {
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    // Add request body for non-GET requests
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(endpoint, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed: ${method} ${endpoint}`, error);

    // Return mock data for development to prevent crashes
    if (process.env.NODE_ENV === 'development') {
      return getMockData(endpoint, method);
    }

    throw error;
  }
};

// Mock data helper for development
const getMockData = (endpoint: string, method: string) => {
  const mockData: Record<string, any> = {
    '/api/dashboard': {
      incidents: [],
      threats: [],
      systemHealth: { status: 'healthy' },
      metrics: { cpu: 45, memory: 60, network: 30 }
    },
    '/api/incidents': [],
    '/api/threats': [],
    '/api/system/metrics': [],
    '/api/federated-learning/status': { status: 'inactive' },
    '/api/federated-learning/nodes': [],
    '/api/federated-learning/performance': { accuracy: 0, loss: 0 },
    '/api/user/profile': { 
      name: 'Development User', 
      email: 'dev@agiesfl.com',
      role: 'Administrator'
    }
  };

  return mockData[endpoint] || {};
};

// User authentication and profile functions
export const getUserInfo = async () => {
  try {
    return await apiRequest('GET', '/api/user/profile');
  } catch (error) {
    console.warn('Failed to fetch user info:', error);
    return { 
      name: 'Development User', 
      email: 'dev@agiesfl.com',
      role: 'Administrator'
    };
  }
};

export const logout = () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.clear();
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/login';
  }
};

// Authenticated fetch with fallback for development
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem('auth_token');
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok && process.env.NODE_ENV === 'development') {
      // Return mock response for development
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(getMockData(url, options.method || 'GET')),
      };
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', error);

    // Return mock response for development
    if (process.env.NODE_ENV === 'development') {
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(getMockData(url, options.method || 'GET')),
      };
    }

    throw error;
  }
};

export default queryClient;
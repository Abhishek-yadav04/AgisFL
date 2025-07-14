import { QueryClient } from "@tanstack/react-query";

// Custom fetch wrapper that includes authentication
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('agiesfl_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // For development purposes, handle 401 gracefully by continuing without authentication
    // In production, this should redirect to login
    if (response.status === 401) {
      console.warn('Authentication failed, continuing in demo mode for development');
      // Don't throw error, let the request continue for demo purposes
    }

    if (!response.ok && response.status !== 401) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server');
    }
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('401') || error?.message?.includes('Authentication failed')) {
          return false;
        }
        return failureCount < 3;
      },
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey as [string];
        const response = await authenticatedFetch(url);
        return response.json();
      },
    },
    mutations: {
      mutationFn: async ({ url, method = 'POST', data }: any) => {
        const response = await authenticatedFetch(url, {
          method,
          body: data ? JSON.stringify(data) : undefined,
        });
        return response.json();
      },
    },
  },
});

// API request helper function with comprehensive error handling
export const apiRequest = async (method: string, url: string, data?: any) => {
  try {
    console.log(`[API Request] ${method} ${url}`, data ? { payload: data } : '');
    
    const response = await authenticatedFetch(url, {
      method,
      body: data ? JSON.stringify(data) : undefined,
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error(`[API Error] ${method} ${url} failed:`, result);
      throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log(`[API Success] ${method} ${url}`, result);
    return result;
  } catch (error) {
    console.error(`[API Exception] ${method} ${url}:`, error);
    throw error;
  }
};

// Export the authenticated fetch for manual use
export { authenticatedFetch };
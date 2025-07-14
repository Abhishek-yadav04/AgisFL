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

    // Handle authentication gracefully in development
    if (response.status === 401) {
      console.warn(`[Auth] Unauthenticated request to ${url} - continuing in demo mode`);
      // Return response anyway for development flexibility
    }

    return response;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error(`[Network] Failed to connect to ${url}:`, error);
      // Return a mock response for development
      return new Response(JSON.stringify([]), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    throw error;
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes for better performance
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.message?.includes('401') || error?.message?.includes('Authentication failed')) {
          return false;
        }
        // Don't retry on network errors in development
        if (error?.message?.includes('Network error')) {
          return false;
        }
        return failureCount < 2; // Reduced retry attempts
      },
      refetchOnWindowFocus: false, // Prevents unnecessary refetches
      queryFn: async ({ queryKey }) => {
        try {
          const [url] = queryKey as [string];
          const response = await authenticatedFetch(url);
          
          if (!response.ok) {
            // Handle different HTTP status codes appropriately
            if (response.status === 404) {
              return []; // Return empty array for missing resources
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return response.json();
        } catch (error) {
          console.error(`Query failed for ${queryKey}:`, error);
          // Return empty data instead of throwing for better UX
          return [];
        }
      },
    },
    mutations: {
      mutationFn: async ({ url, method = 'POST', data }: any) => {
        try {
          const response = await authenticatedFetch(url, {
            method,
            body: data ? JSON.stringify(data) : undefined,
          });
          
          if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorData}`);
          }
          
          return response.json();
        } catch (error) {
          console.error(`Mutation failed for ${method} ${url}:`, error);
          throw error;
        }
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

// Note: authenticatedFetch is already exported above
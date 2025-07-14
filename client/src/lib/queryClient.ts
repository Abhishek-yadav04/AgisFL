
import { QueryClient } from "@tanstack/react-query";

// Custom fetch wrapper that includes authentication
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('agiesfl_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle authentication errors
  if (response.status === 401) {
    localStorage.removeItem('agiesfl_token');
    localStorage.removeItem('agiesfl_user');
    window.location.href = '/login';
    throw new Error('Authentication failed');
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response;
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

// Export the authenticated fetch for manual use
export { authenticatedFetch };

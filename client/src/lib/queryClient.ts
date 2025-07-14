import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      // Add error handling to prevent console spam
      onError: (error: any) => {
        console.warn('Query error:', error?.message || 'Unknown error');
      }
    },
  },
});

// Simple authentication check
export const isAuthenticated = () => {
  // For demo purposes, always return true
  // In production, check for valid JWT token
  return true;
};

export default queryClient;
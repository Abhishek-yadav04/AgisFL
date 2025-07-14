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

export default queryClient;
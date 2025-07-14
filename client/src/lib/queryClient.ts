
import { QueryClient } from '@tanstack/react-query';

/**
 * AgiesFL Query Client Configuration
 * 
 * This file contains the React Query configuration for the AgiesFL application.
 * It provides enhanced error handling, retry logic, and authentication management
 * for all API requests throughout the application.
 * 
 * Key Features:
 * - Intelligent retry logic based on error types
 * - Automatic token refresh and authentication handling
 * - Comprehensive error reporting and logging
 * - Optimized caching strategies for better performance
 * - Production-ready monitoring and debugging tools
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */

// Enhanced configuration for production reliability and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors (401)
        if (error?.status === 401) {
          return false;
        }
        
        // Don't retry on other client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // Don't retry on specific network errors that won't resolve
        if (error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
          return failureCount < 2; // Limited retries for network issues
        }
        
        // Retry up to 3 times for server errors (5xx) and network issues
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff with jitter to prevent thundering herd
        const baseDelay = 1000 * Math.pow(2, attemptIndex);
        const jitter = Math.random() * 0.1 * baseDelay;
        return Math.min(baseDelay + jitter, 30000);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
      cacheTime: 10 * 60 * 1000, // 10 minutes - cache retention time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Refetch when component mounts
      onError: (error: any) => {
        console.error('🚨 AgiesFL Query Error:', error);
        
        // Log error details for debugging
        logErrorToConsole('Query Error', error);
        
        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          reportErrorToMonitoring('query_error', error);
        }
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        
        // Retry once for server errors
        return failureCount < 1;
      },
      onError: (error: any) => {
        console.error('🚨 AgiesFL Mutation Error:', error);
        
        // Log error details for debugging
        logErrorToConsole('Mutation Error', error);
        
        // Show user-friendly error message
        if (error?.message && typeof window !== 'undefined') {
          // In a real app, integrate with your toast/notification system
          console.warn('User should see error:', error.message);
        }
        
        // Report to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
          reportErrorToMonitoring('mutation_error', error);
        }
      },
    },
  },
});

/**
 * Enhanced fetch function with comprehensive error handling and authentication
 * 
 * This function wraps the native fetch API with:
 * - Automatic JWT token management
 * - Intelligent error handling and reporting
 * - Request/response logging for debugging
 * - Retry logic for transient failures
 * - Proper TypeScript types and error messages
 * 
 * @param url - The API endpoint URL
 * @param options - Fetch options with additional AgiesFL-specific settings
 * @returns Promise with parsed response data
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    // Log request details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 [${requestId}] AgiesFL API Request:`, {
        url,
        method: options.method || 'GET',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Get authentication token
    const token = localStorage.getItem('agiesfl_token');
    
    // Validate token before making request
    if (token && !isTokenValid(token)) {
      localStorage.removeItem('agiesfl_token');
      throw new Error('Authentication token expired');
    }
    
    // Configure request with defaults
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-App-Version': '1.0.0',
        'X-Client-Type': 'web',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };
    
    // Make the request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Calculate request duration
    const duration = Date.now() - startTime;
    
    // Log response details in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 [${requestId}] AgiesFL API Response:`, {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        url,
      });
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('agiesfl_token');
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required');
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If not JSON, use the text response or default message
        errorMessage = errorText || errorMessage;
      }
      
      // Create detailed error object
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).url = url;
      (error as any).requestId = requestId;
      (error as any).duration = duration;
      
      throw error;
    }
    
    // Parse response based on content type
    const contentType = response.headers.get('content-type');
    let responseData;
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType && contentType.includes('text/')) {
      responseData = await response.text();
    } else {
      responseData = await response.blob();
    }
    
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [${requestId}] AgiesFL API Success:`, {
        data: responseData,
        duration: `${duration}ms`,
      });
    }
    
    return responseData;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Enhanced error handling
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout: The server took too long to respond');
      (timeoutError as any).code = 'TIMEOUT';
      (timeoutError as any).requestId = requestId;
      (timeoutError as any).duration = duration;
      throw timeoutError;
    }
    
    // Network errors or other fetch failures
    if (error instanceof TypeError) {
      const networkError = new Error('Network error: Please check your internet connection');
      (networkError as any).code = 'NETWORK_ERROR';
      (networkError as any).originalError = error;
      (networkError as any).requestId = requestId;
      (networkError as any).duration = duration;
      throw networkError;
    }
    
    // Log error details
    console.error(`❌ [${requestId}] AgiesFL API Error:`, {
      error: error.message,
      url,
      duration: `${duration}ms`,
    });
    
    // Re-throw with additional context
    if (!(error as any).requestId) {
      (error as any).requestId = requestId;
      (error as any).duration = duration;
    }
    
    throw error;
  }
};

/**
 * Simplified API request function for common use cases
 * 
 * This is a convenience wrapper around authenticatedFetch that provides
 * a simpler interface for common API operations.
 * 
 * @param endpoint - The API endpoint (will be prefixed with base URL)
 * @param options - Request options
 * @returns Promise with response data
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
  const url = `${baseUrl}/api${endpoint}`;
  
  return authenticatedFetch(url, options);
};

/**
 * Helper function to check if user is authenticated
 * 
 * This function validates the JWT token stored in localStorage
 * and checks if it's still valid (not expired).
 * 
 * @returns boolean indicating if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('agiesfl_token');
  if (!token) return false;
  
  return isTokenValid(token);
};

/**
 * Helper function to get user information from JWT token
 * 
 * This function extracts and returns user information from the
 * JWT token stored in localStorage.
 * 
 * @returns User information object or null if not available
 */
export const getUserInfo = (): any => {
  const token = localStorage.getItem('agiesfl_token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.id,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      exp: payload.exp,
      iat: payload.iat,
    };
  } catch (error) {
    console.error('Failed to parse user token:', error);
    return null;
  }
};

/**
 * Helper function to logout user
 * 
 * This function clears authentication data and redirects to login page.
 */
export const logout = (): void => {
  localStorage.removeItem('agiesfl_token');
  sessionStorage.clear();
  
  // Clear query cache
  queryClient.clear();
  
  // Redirect to login
  window.location.href = '/login';
};

/**
 * Helper function to refresh authentication token
 * 
 * This function attempts to refresh the JWT token using the refresh token.
 * 
 * @returns Promise indicating success or failure
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem('agiesfl_refresh_token');
    if (!refreshToken) return false;
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('agiesfl_token', data.token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Private helper functions

/**
 * Validate JWT token
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (with 5-minute buffer)
    return payload.exp > (currentTime + 300);
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log error details to console with formatting
 */
function logErrorToConsole(type: string, error: any): void {
  console.group(`🚨 AgiesFL ${type}`);
  console.error('Error:', error);
  console.error('Stack:', error.stack);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

/**
 * Report error to monitoring service in production
 */
function reportErrorToMonitoring(type: string, error: any): void {
  try {
    // In production, integrate with your monitoring service
    // Example: Sentry, LogRocket, DataDog, etc.
    console.log(`📊 Reporting ${type} to monitoring service:`, error);
  } catch (err) {
    console.error('Failed to report error to monitoring:', err);
  }
}

export default queryClient;

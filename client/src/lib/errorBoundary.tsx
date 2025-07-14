
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

/**
 * Enhanced Error Boundary Component for AgiesFL
 * 
 * This error boundary provides comprehensive error handling throughout the application.
 * It catches JavaScript errors anywhere in the child component tree, logs those errors,
 * and displays a fallback UI instead of the component tree that crashed.
 * 
 * Features:
 * - Graceful error recovery with user-friendly messages
 * - Automatic error reporting and logging
 * - Development-specific error details
 * - Production-ready error handling
 * - Unique error IDs for tracking
 * 
 * @author AgiesFL Development Team
 * @version 1.0.0
 * @since 2025-01-14
 */
export class ErrorBoundary extends Component<Props, State> {
  private errorReportingService: any = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    
    // Initialize error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.initializeErrorReporting();
    }
  }

  /**
   * Initialize error reporting service for production monitoring
   * This would integrate with services like Sentry, LogRocket, or custom logging
   */
  private initializeErrorReporting(): void {
    try {
      // In a real production environment, initialize your error reporting service here
      // Example: Sentry.init({ dsn: process.env.REACT_APP_SENTRY_DSN });
      this.errorReportingService = {
        captureException: (error: Error, context?: any) => {
          console.error('Production Error Captured:', error, context);
          // Send to your error tracking service
        }
      };
    } catch (error) {
      console.warn('Failed to initialize error reporting service:', error);
    }
  }

  /**
   * Static method called when an error occurs
   * Updates state to trigger error UI rendering
   */
  static getDerivedStateFromError(error: Error): State {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId 
    };
  }

  /**
   * Component lifecycle method called after an error has been thrown
   * Logs error details and reports to monitoring services
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const errorDetails = {
      error: error.toString(),
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(), // Get user ID if available
      sessionId: this.getSessionId(), // Get session ID if available
    };

    // Log detailed error information
    console.group('🚨 AgiesFL Error Boundary - Error Caught');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Details:', errorDetails);
    console.groupEnd();

    // Update state with error information
    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service in production
    if (this.errorReportingService && process.env.NODE_ENV === 'production') {
      this.errorReportingService.captureException(error, {
        extra: errorDetails,
        tags: {
          component: 'ErrorBoundary',
          application: 'AgiesFL',
          severity: 'high'
        }
      });
    }

    // Log to local storage for debugging
    this.logErrorToLocalStorage(errorDetails);
  }

  /**
   * Get user ID from authentication token if available
   */
  private getUserId(): string | null {
    try {
      const token = localStorage.getItem('agiesfl_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.id || null;
      }
    } catch (error) {
      console.warn('Failed to extract user ID:', error);
    }
    return null;
  }

  /**
   * Get session ID from session storage if available
   */
  private getSessionId(): string | null {
    try {
      return sessionStorage.getItem('agiesfl_session_id') || null;
    } catch (error) {
      console.warn('Failed to get session ID:', error);
    }
    return null;
  }

  /**
   * Log error details to local storage for debugging
   */
  private logErrorToLocalStorage(errorDetails: any): void {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('agiesfl_errors') || '[]');
      existingErrors.push(errorDetails);
      
      // Keep only last 10 errors to prevent storage bloat
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('agiesfl_errors', JSON.stringify(existingErrors));
    } catch (error) {
      console.warn('Failed to log error to local storage:', error);
    }
  }

  /**
   * Reset error state and attempt recovery
   */
  private handleReset = (): void => {
    console.log('🔄 Attempting error recovery...');
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined 
    });
  };

  /**
   * Reload the entire application
   */
  private handleReload = (): void => {
    console.log('🔄 Reloading application...');
    window.location.reload();
  };

  /**
   * Report issue to support (in production this would open a support ticket)
   */
  private handleReportIssue = (): void => {
    const errorReport = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: this.state.error?.toString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.log('📧 Error report generated:', errorReport);
    
    // In production, this would send to support system
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please send this to support.');
      })
      .catch(() => {
        alert('Error report generated. Please check console for details.');
      });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI can be provided via props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              <CardTitle className="text-white text-xl">
                AgiesFL Encountered an Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 mb-2">
                  The application encountered an unexpected error and needs to recover.
                </p>
                <p className="text-gray-500 text-sm">
                  Error ID: <code className="bg-gray-700 px-2 py-1 rounded text-gray-300">
                    {this.state.errorId}
                  </code>
                </p>
              </div>
              
              {/* Development-only error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-900 p-4 rounded border border-gray-600">
                  <h4 className="text-red-400 font-medium mb-2">Development Error Details:</h4>
                  <p className="text-xs text-red-300 font-mono whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-yellow-400 cursor-pointer text-sm">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleReset} 
                  variant="outline" 
                  className="flex-1 border-blue-600 text-blue-400 hover:bg-blue-900/20"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleReload} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Reload App
                </Button>
              </div>
              
              <Button 
                onClick={this.handleReportIssue}
                variant="ghost" 
                className="w-full text-gray-400 hover:text-gray-300"
              >
                Report Issue
              </Button>
              
              {/* Additional help text */}
              <div className="text-center text-xs text-gray-500 border-t border-gray-700 pt-3">
                <p>If this error persists, please contact your system administrator.</p>
                <p className="mt-1">
                  AgiesFL v1.0.0 - Federated Learning Security Platform
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export as default for backward compatibility
export default ErrorBoundary;

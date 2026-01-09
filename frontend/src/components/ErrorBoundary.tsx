import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
  isOnline: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  public state: State = {
    hasError: false,
    retryCount: 0,
    isOnline: navigator.onLine
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to backend monitoring if available
    this.logErrorToBackend(error, errorInfo);
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    if (this.state.hasError && this.state.retryCount < 3) {
      setTimeout(() => this.handleRetry(), 1000);
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  private logErrorToBackend = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('http://localhost:8000/api/monitoring/logs/recent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'ERROR',
          service: 'frontend',
          message: `Frontend Error: ${error.message}`,
          extra_data: {
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
            url: window.location.href
          }
        })
      });
    } catch (logError) {
      console.warn('Failed to log error to backend:', logError);
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount >= 5) return;
    
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorCategory = this.state.error?.message.includes('network') ? 'Network Error' : 
                           this.state.error?.message.includes('timeout') ? 'Timeout Error' : 'Application Error';

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-red-900/20 border border-red-700/50 rounded-full mb-4"
                >
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </motion.div>
                
                <h1 className="text-3xl font-bold text-white mb-2">AgisFL Error Handler</h1>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border text-red-400 bg-red-900/20 border-red-700/50">
                  <Bug className="w-4 h-4 mr-2" />
                  {errorCategory}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
                  <div className="flex items-center space-x-3">
                    {this.state.isOnline ? (
                      <Wifi className="w-5 h-5 text-green-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-gray-300">
                      Connection: {this.state.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Retries: {this.state.retryCount}/5
                  </span>
                </div>

                <div className="p-4 bg-red-900/10 border border-red-700/30 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Error Details</h3>
                  <p className="text-gray-300 font-mono text-sm break-words">
                    {this.state.error?.message || 'An unexpected error occurred'}
                  </p>
                </div>

                <details className="group">
                  <summary className="cursor-pointer p-4 bg-gray-700/20 rounded-lg border border-gray-600/30 hover:bg-gray-700/30 transition-colors">
                    <span className="text-gray-300 font-medium">Technical Details</span>
                  </summary>
                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600/30">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-400">Timestamp:</span>
                        <span className="text-gray-300 ml-2">{new Date().toISOString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">URL:</span>
                        <span className="text-gray-300 ml-2 break-all">{window.location.href}</span>
                      </div>
                      {this.state.error?.stack && (
                        <div>
                          <span className="text-gray-400">Stack Trace:</span>
                          <pre className="text-gray-300 ml-2 mt-2 p-3 bg-gray-800/50 rounded border border-gray-600/30 overflow-x-auto text-xs">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleRetry}
                    disabled={this.state.retryCount >= 5}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>{this.state.retryCount >= 5 ? 'Max Retries' : 'Try Again'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    <span>Dashboard</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Reload</span>
                  </motion.button>
                </div>

                <div className="text-center text-sm text-gray-400">
                  <p>If the problem persists, check backend connectivity.</p>
                  <p className="mt-1">
                    Error ID: <span className="font-mono text-gray-300">{Date.now().toString(36)}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
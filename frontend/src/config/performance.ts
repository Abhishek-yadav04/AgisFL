// Frontend Performance Configuration
export const PERFORMANCE_CONFIG = {
  // API Configuration
  API_TIMEOUT: 5000, // 5 second timeout
  CACHE_TTL: {
    CRITICAL: 3,     // 3 seconds for critical data
    NORMAL: 30,      // 30 seconds for normal data
    STATIC: 300,     // 5 minutes for static data
  },
  
  // Request batching
  BATCH_REQUESTS: true,
  BATCH_DELAY: 100, // 100ms batching delay
  
  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
  
  // Performance monitoring
  TRACK_PERFORMANCE: true,
  SLOW_REQUEST_THRESHOLD: 1000, // 1 second
  
  // Preload configuration
  PRELOAD_CRITICAL_ENDPOINTS: true,
  CRITICAL_ENDPOINTS: [
    '/api/fl/status',
    '/api/fl/overview',
    '/health',
    '/api/dashboard/simple-status'
  ]
};

// Performance utilities
export class PerformanceMonitor {
  private static requests: Array<{endpoint: string, duration: number, timestamp: number}> = [];
  
  static trackRequest(endpoint: string, duration: number) {
    this.requests.push({
      endpoint,
      duration,
      timestamp: Date.now()
    });
    
    // Keep only last 100 requests
    if (this.requests.length > 100) {
      this.requests = this.requests.slice(-100);
    }
    
    // Log slow requests
    if (duration > PERFORMANCE_CONFIG.SLOW_REQUEST_THRESHOLD) {
      console.warn(`Slow request: ${endpoint} took ${duration}ms`);
    }
  }
  
  static getStats() {
    if (this.requests.length === 0) return null;
    
    const durations = this.requests.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const slowRequests = this.requests.filter(r => r.duration > PERFORMANCE_CONFIG.SLOW_REQUEST_THRESHOLD);
    
    return {
      totalRequests: this.requests.length,
      averageDuration: Math.round(avgDuration),
      slowRequests: slowRequests.length,
      slowRequestPercentage: Math.round((slowRequests.length / this.requests.length) * 100)
    };
  }
}

export default PERFORMANCE_CONFIG;

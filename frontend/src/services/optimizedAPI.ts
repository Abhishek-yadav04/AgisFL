// Optimized API service with caching and performance improvements
const BASE_URL = 'http://localhost:8000';

interface CacheEntry {
  data: any;
  expires: number;
}

class OptimizedAPI {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly timeout = 5000; // 5 second timeout

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      console.error(`API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  private async requestWithCache(endpoint: string, cacheTTL: number = 30, options: RequestInit = {}): Promise<any> {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    const now = Date.now();
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > now) {
      return cached.data;
    }
    
    try {
      // Make request
      const data = await this.request(endpoint, options);
      
      // Cache successful response
      this.cache.set(cacheKey, {
        data,
        expires: now + (cacheTTL * 1000)
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.warn(`Using stale cache for ${endpoint} due to error:`, error);
        return cached.data;
      }
      throw error;
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires < now) {
        this.cache.delete(key);
      }
    }
    
    // Limit cache size
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expires - b[1].expires);
      
      // Remove oldest 20 entries
      for (let i = 0; i < 20 && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  // Core APIs - Ultra fast with aggressive caching
  core = {
    health: () => this.requestWithCache('/health', 10),
    status: () => this.requestWithCache('/api/core/status', 5),
    login: (credentials: any) => this.request('/api/core/login', { method: 'POST', body: JSON.stringify(credentials) }),
  };

  // Federated Learning APIs - Optimized for performance
  fl = {
    overview: () => this.requestWithCache('/api/fl/overview', 10),
    algorithms: () => this.requestWithCache('/api/fl/algorithms', 300),
    status: () => this.requestWithCache('/api/fl/status', 3),
    start: (config: any) => this.request('/api/fl/start', { method: 'POST', body: JSON.stringify(config) }),
    stop: () => this.request('/api/fl/stop', { method: 'POST' }),
    clients: () => this.requestWithCache('/api/fl/clients', 10),
    trainingLive: () => this.requestWithCache('/api/fl/training/live', 2),
    reset: () => this.request('/api/fl/reset', { method: 'POST' }),
    
    // Simple training endpoints
    simpleStart: (config: any) => this.request('/api/autofl/simple-start', { method: 'POST', body: JSON.stringify(config) }),
    simpleStatus: () => this.requestWithCache('/api/autofl/simple-status', 5),
    
    // Nested FL APIs with smart caching
    nested: {
      overview: () => this.requestWithCache('/api/fl/fl/overview', 10),
      status: () => this.requestWithCache('/api/fl/fl/status', 3),
      start: (config: any) => this.request('/api/fl/fl/start', { method: 'POST', body: JSON.stringify(config) }),
      stop: () => this.request('/api/fl/fl/stop', { method: 'POST' }),
      pause: () => this.request('/api/fl/fl/pause', { method: 'POST' }),
      resume: () => this.request('/api/fl/fl/resume', { method: 'POST' }),
      metrics: () => this.requestWithCache('/api/fl/fl/metrics', 5),
      history: () => this.requestWithCache('/api/fl/fl/history', 30),
      clients: () => this.requestWithCache('/api/fl/fl/clients', 10),
      experiments: () => this.requestWithCache('/api/fl/fl/experiments', 30),
      strategies: () => this.requestWithCache('/api/fl/fl/strategies', 300),
      evaluate: () => this.request('/api/fl/fl/evaluate'),
      debug: () => this.request('/api/fl/fl/debug'),
    },
  };

  // Advanced FL APIs - High-performance with smart caching
  advancedFL = {
    algorithms: () => this.requestWithCache('/api/advanced-fl/algorithms', 300),
    getAlgorithm: (name: string) => this.requestWithCache(`/api/advanced-fl/algorithms/${name}`, 300),
    experimentsAdvanced: () => this.requestWithCache('/api/advanced-fl/experiments/advanced', 15),
    startAdvanced: (config: any) => this.request('/api/advanced-fl/experiments/start-advanced', { method: 'POST', body: JSON.stringify(config) }),
    
    engine: {
      metrics: () => this.requestWithCache('/api/advanced-fl/engine/metrics', 3),
      history: () => this.requestWithCache('/api/advanced-fl/engine/history', 30),
      strategies: () => this.requestWithCache('/api/advanced-fl/engine/strategies', 300),
      switchAlgorithm: (algorithm: string) => this.request('/api/advanced-fl/engine/algorithm/switch', { method: 'POST', body: JSON.stringify({ algorithm }) }),
      heterogeneity: () => this.requestWithCache('/api/advanced-fl/engine/heterogeneity', 60),
      earlyStoppingConfig: (config: any) => this.request('/api/advanced-fl/engine/early-stopping/config', { method: 'POST', body: JSON.stringify(config) }),
    },
    
    performance: {
      comparison: () => this.requestWithCache('/api/advanced-fl/performance/comparison', 20),
    },
    
    heterogeneity: {
      analysis: () => this.requestWithCache('/api/advanced-fl/heterogeneity/analysis', 60),
    },
    
    optimization: {
      recommendations: () => this.requestWithCache('/api/advanced-fl/optimization/recommendations', 120),
    },
    
    compare: () => this.requestWithCache('/api/advanced-fl/compare', 30),
    comparisons: () => this.requestWithCache('/api/advanced-fl/comparisons', 60),
    switch: (config: any) => this.request('/api/advanced-fl/switch', { method: 'POST', body: JSON.stringify(config) }),
  };

  // System Monitoring APIs - Optimized with caching
  systemMonitoring = {
    overview: () => this.requestWithCache('/api/system-monitoring/overview', 30),
    metrics: () => this.requestWithCache('/api/system-monitoring/metrics', 10),
    status: () => this.requestWithCache('/api/system-monitoring/status', 5),
    currentMetrics: () => this.requestWithCache('/api/system-monitoring/metrics/current', 5),
    metricsHistory: () => this.request('/api/system-monitoring/metrics/history'),
    alerts: () => this.request('/api/system-monitoring/alerts'),
    acknowledgeAlert: (alertId: string) => this.request(`/api/system-monitoring/alerts/${alertId}/acknowledge`, { method: 'POST' }),
    servicesStatus: () => this.requestWithCache('/api/system-monitoring/services/status', 15),
    systemLogs: () => this.request('/api/system-monitoring/logs/system'),
    performanceAnalysis: () => this.requestWithCache('/api/system-monitoring/performance/analysis', 60),
  };

  // Dashboard APIs - Ultra-fast with aggressive caching
  dashboard = {
    overview: () => this.requestWithCache('/api/dashboard/overview', 20),
    enhancedOverview: () => this.requestWithCache('/api/dashboard/overview/enhanced', 30),
    analytics: () => this.requestWithCache('/api/dashboard/analytics', 15),
    enhancedAnalytics: () => this.requestWithCache('/api/dashboard/analytics/enhanced', 25),
    enhancedHealth: () => this.requestWithCache('/api/dashboard/health/enhanced', 10),
    metricsHistory: () => this.requestWithCache('/api/dashboard/metrics/history', 60),
    alerts: () => this.request('/api/dashboard/alerts'),
    acknowledgeAlert: (alertId: string) => this.request(`/api/dashboard/alerts/${alertId}/acknowledge`, { method: 'POST' }),
    realData: () => this.requestWithCache('/api/dashboard/real-data', 5),
    simpleStatus: () => this.requestWithCache('/api/dashboard/simple-status', 3),
  };

  // Security APIs
  security = {
    overview: () => this.requestWithCache('/api/security/overview', 30),
    status: () => this.requestWithCache('/api/security/status', 15),
    score: () => this.requestWithCache('/api/security/score', 60),
    threats: () => this.requestWithCache('/api/security/threats', 10),
    simulate: (config: any) => this.request('/api/security/simulate', { method: 'POST', body: JSON.stringify(config) }),
    redTeamSimulate: (config: any) => this.request('/api/security/red-team/simulate', { method: 'POST', body: JSON.stringify(config) }),
    simulations: () => this.requestWithCache('/api/security/simulations', 30),
    getSimulation: (id: string) => this.requestWithCache(`/api/security/simulations/${id}`, 60),
    simulationHistory: () => this.requestWithCache('/api/security/simulation/history', 120),
    runSimulation: (config: any) => this.request('/api/security/simulation/run', { method: 'POST', body: JSON.stringify(config) }),
  };

  // Health APIs - Fast with caching
  health = {
    main: () => this.requestWithCache('/health', 10),
    detailed: () => this.requestWithCache('/api/health/detailed', 30),
    live: () => this.requestWithCache('/api/health/live', 5),
    database: () => this.requestWithCache('/api/health/database', 15),
    dependencies: () => this.requestWithCache('/api/health/dependencies', 60),
    security: () => this.requestWithCache('/api/health/security', 30),
    readyz: () => this.requestWithCache('/api/health/readyz', 5),
    reset: () => this.request('/api/health/reset', { method: 'POST' }),
  };

  // Metrics APIs - Optimized with intelligent caching
  metrics = {
    main: () => this.requestWithCache('/api/metrics/', 15),
    performance: () => this.requestWithCache('/api/metrics/performance', 10),
    security: () => this.requestWithCache('/api/metrics/security', 30),
    federatedLearning: () => this.requestWithCache('/api/metrics/federated-learning', 5),
    application: () => this.requestWithCache('/api/metrics/application', 20),
    live: () => this.requestWithCache('/api/metrics/live', 2),
    export: () => this.request('/api/metrics/export'),
    record: (data: any) => this.request('/api/metrics/record', { method: 'POST', body: JSON.stringify(data) }),
    reset: () => this.request('/api/metrics/reset', { method: 'POST' }),
    custom: () => this.requestWithCache('/api/metrics/custom', 10),
  };

  // AutoFL APIs
  autoFL = {
    status: () => this.requestWithCache('/api/autofl/status', 10),
    simpleStart: () => this.request('/api/autofl/simple-start', { method: 'POST' }),
    simpleStatus: () => this.requestWithCache('/api/autofl/simple-status', 5),
  };

  // Privacy APIs
  privacy = {
    status: () => this.requestWithCache('/api/privacy/status', 30),
    algorithms: () => this.requestWithCache('/api/privacy/privacy/algorithms', 300),
    analysis: () => this.requestWithCache('/api/privacy/privacy/analysis', 60),
    configure: (config: any) => this.request('/api/privacy/privacy/configure', { method: 'POST', body: JSON.stringify(config) }),
    budget: () => this.requestWithCache('/api/privacy/privacy/budget', 15),
    allocateBudget: (allocation: any) => this.request('/api/privacy/privacy/budget/allocate', { method: 'POST', body: JSON.stringify(allocation) }),
    metrics: () => this.requestWithCache('/api/privacy/privacy/metrics', 10),
    violations: () => this.request('/api/privacy/privacy/violations'),
    audit: () => this.request('/api/privacy/privacy/audit'),
    getAudit: (auditId: string) => this.requestWithCache(`/api/privacy/privacy/audit/${auditId}`, 300),
    health: () => this.requestWithCache('/api/privacy/privacy/health', 30),
  };

  // Models APIs
  models = {
    list: () => this.requestWithCache('/api/models', 60),
    latest: () => this.requestWithCache('/api/models/latest', 30),
    stats: () => this.requestWithCache('/api/models/stats', 60),
    compare: () => this.requestWithCache('/api/models/compare', 120),
    versions: () => this.requestWithCache('/api/models/versions', 60),
    getVersion: (versionId: string) => this.requestWithCache(`/api/models/versions/${versionId}`, 300),
  };

  // Datasets APIs
  datasets = {
    list: () => this.requestWithCache('/api/datasets/', 60),
    status: () => this.requestWithCache('/api/datasets/status', 30),
    testStatus: () => this.requestWithCache('/api/datasets/test-status', 15),
    types: () => this.requestWithCache('/api/datasets/types', 300),
    statistics: () => this.requestWithCache('/api/datasets/statistics/overview', 120),
    recommendations: () => this.requestWithCache('/api/datasets/recommendations', 300),
    searchSuggestions: () => this.requestWithCache('/api/datasets/search/suggestions', 60),
    monitoringHealth: () => this.requestWithCache('/api/datasets/monitoring/health', 30),
    upload: (data: FormData) => this.request('/api/datasets/upload', { method: 'POST', body: data }),
    batch: (data: any) => this.request('/api/datasets/batch', { method: 'POST', body: JSON.stringify(data) }),
    
    // Dataset specific operations
    get: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}`, 60),
    analysis: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}/analysis`, 300),
    preview: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}/preview`, 120),
    stats: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}/stats`, 300),
    validate: (datasetId: string) => this.request(`/api/datasets/${datasetId}/validate`),
    transform: (datasetId: string, config: any) => this.request(`/api/datasets/${datasetId}/transform`, { method: 'POST', body: JSON.stringify(config) }),
    visualization: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}/visualization`, 300),
    versions: (datasetId: string) => this.requestWithCache(`/api/datasets/${datasetId}/versions`, 120),
    download: (datasetId: string) => this.request(`/api/datasets/${datasetId}/download`),
    share: (datasetId: string, config: any) => this.request(`/api/datasets/${datasetId}/share`, { method: 'POST', body: JSON.stringify(config) }),
  };

  // Experiments APIs
  experiments = {
    list: () => this.requestWithCache('/api/experiments', 30),
  };

  // Test API
  test = () => this.requestWithCache('/api/test', 60);

  // Cache management methods
  clearCache(): void {
    this.cache.clear();
    console.log('API cache cleared');
  }

  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  // Preload critical endpoints for instant responses
  async preloadCriticalEndpoints(): Promise<void> {
    const criticalEndpoints = [
      '/api/fl/status',
      '/api/fl/overview',
      '/api/dashboard/simple-status',
      '/health',
      '/api/autofl/simple-status'
    ];

    const promises = criticalEndpoints.map(endpoint => 
      this.requestWithCache(endpoint, 60).catch(err => 
        console.warn(`Failed to preload ${endpoint}:`, err)
      )
    );

    await Promise.allSettled(promises);
    console.log('Critical endpoints preloaded for instant access');
  }
}

// Create singleton instance with performance optimizations
const optimizedAPI = new OptimizedAPI();

// Preload critical endpoints on initialization
optimizedAPI.preloadCriticalEndpoints().catch(err => 
  console.warn('Failed to preload critical endpoints:', err)
);

export default optimizedAPI;
export { OptimizedAPI };
import axios, { AxiosError } from 'axios';

// Auto-detect API base URL
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // If we're on the same host as the backend, use relative URLs
    if (port === '8001' || hostname === '127.0.0.1' || hostname === 'localhost') {
      return '/api';
    }
  }
  return 'http://127.0.0.1:8001/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config: any = error.config || {};
    const status = error.response?.status;
    const isNetwork = !error.response;
    
    if (status === 401) {
      localStorage.removeItem('auth_token');
      return Promise.reject(error);
    }
    
    // Retry logic for network errors and 5xx errors
    if ((isNetwork || (status && status >= 500)) && !config.__retry) {
      config.__retry = 0;
    }
    
    if (config.__retry !== undefined && config.__retry < 3) {
      config.__retry += 1;
      const delay = 300 * Math.pow(2, config.__retry - 1) + Math.random() * 150;
      await new Promise(res => setTimeout(res, delay));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

// Core API endpoints
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getComprehensive: () => api.get('/dashboard/comprehensive'),
  getCharts: () => api.get('/dashboard/charts'),
  getRealTime: () => api.get('/dashboard/real-time'),
  getHealth: () => api.get('/health'),
};

export const federatedLearningAPI = {
  // Strategies & Experiments
  getStrategies: () => api.get('/fl/strategies'),
  getExperiments: () => api.get('/experiments'),
  getStatus: () => api.get('/fl/status'),
  startTraining: () => api.post('/federated/train'),
  getAlgorithms: () => api.get('/research/enterprise/research-algorithms'),

  // 🔹 New Enterprise-Grade FL Algorithms Endpoints
  trainAlgorithm: (algorithm: string, config: any) =>
    api.post(`/fl/algorithms/${encodeURIComponent(algorithm)}/train`, config),

  validateAlgorithm: (algorithm: string, datasetId: string) =>
    api.post(`/fl/algorithms/${encodeURIComponent(algorithm)}/validate`, { dataset_id: datasetId }),

  benchmarkAlgorithm: (algorithm: string, benchmarkSuite: string) =>
    api.post(`/fl/algorithms/${encodeURIComponent(algorithm)}/benchmark`, { suite: benchmarkSuite }),

  optimizeAlgorithm: (algorithm: string, options: any) =>
    api.post(`/fl/algorithms/${encodeURIComponent(algorithm)}/optimize`, options),
};

export const systemAPI = {
  getMetrics: () => api.get('/system/metrics'),
  getHealth: () => api.get('/health'),
};

export const federatedLearningAPI = {
  getStrategies: () => api.get('/fl/strategies'),
  getExperiments: () => api.get('/experiments'),
  getStatus: () => api.get('/fl/status'),
  startTraining: () => api.post('/federated/train'),
  getAlgorithms: () => api.get('/research/enterprise/research-algorithms'),
};

export const securityAPI = {
  getThreats: () => api.get('/threats'),
  getSecurityMetrics: () => api.get('/security/metrics'),
  getSecurityThreats: () => api.get('/security/threats'),
  getLiveThreats: () => api.get('/security/threats/live'),
};

export const networkAPI = {
  getStats: () => api.get('/network/stats'),
  getPackets: () => api.get('/network/packets'),
  getLivePackets: () => api.get('/network/packets/live'),
  getAnomalies: () => api.get('/network/anomalies'),
  getStatistics: () => api.get('/network/statistics'),
};

export const datasetsAPI = {
  getDatasets: () => api.get('/datasets'),
  getDataset: (id: string) => api.get(`/datasets/${id}`),
  uploadDataset: (formData: FormData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDataset: (id: string) => api.delete(`/datasets/${id}`),
  getStatistics: (id: string) => api.get(`/datasets/${id}/statistics`),
  getOverview: () => api.get('/datasets/statistics/overview'),
};

export const researchAPI = {
  getProjects: () => api.get('/research/projects'),
  createProject: (data: any) => api.post('/research/projects', data),
  getProject: (id: string) => api.get(`/research/projects/${id}`),
  updateProject: (id: string, data: any) => api.put(`/research/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/research/projects/${id}`),
  runExperiment: (id: string, config: any) => api.post(`/research/projects/${id}/experiments`, config),
  getAlgorithms: () => api.get('/research/algorithms'),
  getStatistics: () => api.get('/research/statistics'),
  getEnterpriseAlgorithms: () => api.get('/research/enterprise/research-algorithms'),
  getPublications: () => api.get('/research/enterprise/publications'),
};

export const integrationsAPI = {
  getOverview: () => api.get('/integrations/overview'),
  refresh: () => api.post('/integrations/refresh'),
  // Scapy
  getScapyPackets: () => api.get('/network/packets/live'),
  startScapyMonitoring: () => api.post('/network/start'),
  stopScapyMonitoring: () => api.post('/network/stop'),
  getScapyCapabilities: () => api.get('/network/capabilities'),
  // Flower
  getFlowerStatus: () => api.get('/flower/status'),
  getFlowerClients: () => api.get('/flower/clients'),
  setFlowerStrategy: (strategy: string) => api.post(`/flower/strategy/${strategy}`),
  startFlowerTraining: () => api.post('/flower/start'),
  stopFlowerTraining: () => api.post('/flower/stop'),
  // Suricata
  getSuricataAlerts: () => api.get('/suricata/alerts/live'),
  getSuricataRules: () => api.get('/suricata/rules/statistics'),
  getSuricataPerformance: () => api.get('/suricata/performance'),
  startSuricataMonitoring: () => api.post('/suricata/start'),
  // Grafana
  getGrafanaDashboards: () => api.get('/grafana/dashboards'),
  getGrafanaDashboard: (name: string) => api.get(`/grafana/dashboard/${encodeURIComponent(name)}`),
  getGrafanaTimeseries: () => api.get('/grafana/metrics/timeseries'),
};

export const flIdsAPI = {
  getStatus: () => api.get('/fl-ids/status'),
  start: () => api.post('/fl-ids/start'),
  stop: () => api.post('/fl-ids/stop'),
  getFeatures: () => api.get('/fl-ids/features'),
  getRealTimeMetrics: () => api.get('/fl-ids/metrics/real-time'),
  getLiveThreats: () => api.get('/fl-ids/threats/live'),
  toggleSimulation: (enabled: boolean) => api.post(`/fl-ids/simulation/toggle?enabled=${enabled}`),
  getSimulatedAttacks: () => api.get('/fl-ids/simulation/attacks'),
  simulateAttack: (attackType: string) => api.post(`/fl-ids/simulation/attack/${attackType}`),
  getFLStatus: () => api.get('/fl-ids/federated-learning/status'),
  registerClient: (clientData: any) => api.post('/fl-ids/federated-learning/client/register', clientData),
  getPerformanceAnalytics: () => api.get('/fl-ids/analytics/performance'),
  getHealth: () => api.get('/fl-ids/health'),
  getEnterpriseFeatures: () => api.get('/fl-ids/enterprise/features'),
  getClientManagement: () => api.get('/fl-ids/enterprise/client-management'),
  getThreatIntelligence: () => api.get('/fl-ids/enterprise/threat-intelligence'),
};

export const adminAPI = {
  getStatus: () => api.get('/admin/status'),
  requestPrivileges: () => api.post('/admin/request-privileges'),
  enableSimulation: () => api.post('/admin/enable-simulation'),
};

export const optimizerAPI = {
  getStatus: () => api.get('/optimizer/status'),
  optimize: () => api.post('/optimizer/optimize'),
  getMetrics: () => api.get('/optimizer/metrics'),
};

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings: any) => api.post('/settings', settings),
};

export const threatIntelAPI = {
  getLiveFeed: () => api.get('/threat-intel/live-feed'),
  getIOCDatabase: () => api.get('/threat-intel/ioc-database'),
};

export const packetAnalysisAPI = {
  getLiveAnalysis: () => api.get('/packet-analysis/live-analysis'),
  getNetworkTopology: () => api.get('/packet-analysis/network-topology'),
};

export const githubAPI = {
  getThreatAnalysis: () => api.get('/github/threat-analysis'),
  getRepositoryHealth: () => api.get('/github/repository-health'),
};

export default api;

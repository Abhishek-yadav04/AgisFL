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
  getHealth: () => api.get('/health'),
};

export const federatedLearningAPI = {
  getStatus: () => api.get('/fl/status'),
  getStrategies: () => api.get('/fl/strategies'),
  getExperiments: () => api.get('/fl/experiments'),
  startTraining: (config: { rounds: number }) => api.post('/fl/start', config),
  stopTraining: () => api.post('/fl/stop'),
  pauseTraining: () => api.post('/fl/pause'),
  resumeTraining: () => api.post('/fl/resume'),
  setStrategy: (strategy: string) => api.post(`/fl/strategy/${strategy}`),
  getExperiment: (id: string) => api.get(`/fl/experiments/${id}`),
  deleteExperiment: (id: string) => api.delete(`/fl/experiments/${id}`),
};

export const systemAPI = {
  getMetrics: () => api.get('/system/metrics'),
  getHealth: () => api.get('/health'),
};

export const securityAPI = {
  getThreats: () => api.get('/security/threats'),
  getMetrics: () => api.get('/security/metrics'),
  startMonitoring: () => api.post('/security/start'),
  stopMonitoring: () => api.post('/security/stop'),
};

export const networkAPI = {
  getStats: () => api.get('/network/stats'),
  getPackets: () => api.get('/network/packets'),
  getAnomalies: () => api.get('/network/anomalies'),
  startCapture: () => api.post('/network/start'),
  stopCapture: () => api.post('/network/stop'),
};

export const datasetsAPI = {
  getDatasets: () => api.get('/datasets'),
  getDataset: (id: string) => api.get(`/datasets/${id}`),
  uploadDataset: (formData: FormData) => api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteDataset: (id: string) => api.delete(`/datasets/${id}`),
  list: (params: any) => api.get('/datasets', { params }),
  preview: (id: string) => api.get(`/datasets/${id}/preview`),
  download: (id: string) => {
    window.open(`${API_BASE_URL}/datasets/${id}/download`, '_blank');
  },
  upload: (file: File, metadata: any, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }
    return api.post('/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(progress);
        }
      }
    });
  },
  delete: (id: string) => api.delete(`/datasets/${id}`),
};

export const integrationsAPI = {
  getOverview: () => api.get('/integrations/overview'),
  refresh: () => api.post('/integrations/refresh'),
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
  startTraining: (config: any) => api.post('/fl-ids/start-training', config),
  stopTraining: () => api.post('/fl-ids/stop-training'),
  pauseTraining: () => api.post('/fl-ids/pause-training'),
  resumeTraining: () => api.post('/fl-ids/resume-training'),
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

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings: any) => api.post('/settings', settings),
};

export default api;
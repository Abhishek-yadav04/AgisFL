/**
 * Comprehensive API Service - Utilizes ALL Backend Endpoints
 */

const API_BASE = 'http://localhost:8000';

class APIService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // ===== AUTHENTICATION =====
  async login(username: string, password: string, mfaToken?: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, mfa_token: mfaToken }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // ===== MFA =====
  async setupMFA(email: string) {
    return this.request('/api/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyMFA(token: string) {
    return this.request('/api/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getMFAStatus() {
    return this.request('/api/mfa/status');
  }

  // ===== HEALTH & MONITORING =====
  async getHealth() {
    return this.request('/health');
  }

  async getLivenessProbe() {
    return this.request('/api/healthz');
  }

  async getReadinessProbe() {
    return this.request('/api/readyz');
  }

  async getStartupProbe() {
    return this.request('/api/startup');
  }

  // ===== METRICS =====
  async getPrometheusMetrics() {
    const response = await fetch(`${API_BASE}/api/metrics`);
    return response.text();
  }

  async getCustomMetrics() {
    return this.request('/api/metrics/custom');
  }

  // ===== DASHBOARD DATA =====
  async getDashboardData() {
    return this.request('/api/dashboard');
  }

  async getRealDashboardData() {
    return this.request('/api/dashboard/real-data');
  }

  async getEnterpriseDashboard() {
    return this.request('/api/enterprise/dashboard');
  }

  // ===== FEDERATED LEARNING =====
  async getFLOverview() {
    return this.request('/api/fl/overview');
  }

  async getFLAlgorithms() {
    return this.request('/api/fl/algorithms');
  }

  async startFLTraining(config: any) {
    return this.request('/api/fl/train', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async stopFLTraining() {
    return this.request('/api/fl/stop', { method: 'POST' });
  }

  async getFLStatus() {
    return this.request('/api/fl/status');
  }

  async getFLHistory() {
    return this.request('/api/fl/history');
  }

  async getLiveTrainingData() {
    return this.request('/api/fl/live');
  }

  // ===== MODEL VERSIONING =====
  async getModelVersions(limit = 10) {
    return this.request(`/api/models/versions?limit=${limit}`);
  }

  async getModelVersion(versionId: string) {
    return this.request(`/api/models/versions/${versionId}`);
  }

  async getLatestModel() {
    return this.request('/api/models/latest');
  }

  async compareModels(version1: string, version2: string) {
    return this.request('/api/models/compare', {
      method: 'POST',
      body: JSON.stringify({ version1, version2 }),
    });
  }

  async deleteModelVersion(versionId: string) {
    return this.request(`/api/models/versions/${versionId}`, {
      method: 'DELETE',
    });
  }

  async getModelStats() {
    return this.request('/api/models/stats');
  }

  // ===== SECURITY =====
  async getSecurityStatus() {
    return this.request('/security/status');
  }

  async getSecurityDashboard() {
    return this.request('/api/security/dashboard');
  }

  async getThreatDetection() {
    return this.request('/api/security/threats');
  }

  async getSecurityEvents() {
    return this.request('/api/security/events');
  }

  // ===== PACKET CAPTURE =====
  async getPacketCaptureStatus() {
    return this.request('/api/packet-capture/status');
  }

  async startPacketCapture(config: any) {
    return this.request('/api/packet-capture/start', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async stopPacketCapture() {
    return this.request('/api/packet-capture/stop', { method: 'POST' });
  }

  async getPacketCaptureData() {
    return this.request('/api/packet-capture/data');
  }

  async getPacketCaptureRules() {
    return this.request('/api/packet-capture/rules');
  }

  // ===== ENHANCED DATASETS =====
  async getDatasets(filters?: any) {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/api/datasets${queryString ? `?${queryString}` : ''}`);
  }

  async getDatasetStatus() {
    return this.request('/api/datasets/status');
  }

  async getDatasetTypes() {
    return this.request('/api/datasets/types');
  }

  async getDatasetRecommendations(limit = 5) {
    return this.request(`/api/datasets/recommendations?limit=${limit}`);
  }

  async uploadDataset(formData: FormData) {
    const response = await fetch(`${API_BASE}/api/datasets/upload`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
    return response.json();
  }

  async getDatasetDetails(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}`);
  }

  async getDatasetAnalysis(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}/analysis`);
  }

  async getDatasetVisualization(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}/visualization`);
  }

  async transformDataset(datasetId: string, transformation: any) {
    return this.request(`/api/datasets/${datasetId}/transform`, {
      method: 'POST',
      body: JSON.stringify(transformation),
    });
  }

  async downloadDataset(datasetId: string, format = 'original') {
    const response = await fetch(`${API_BASE}/api/datasets/${datasetId}/download?format=${format}`, {
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
    return response.blob();
  }

  async shareDataset(datasetId: string, shareRequest: any) {
    return this.request(`/api/datasets/${datasetId}/share`, {
      method: 'POST',
      body: JSON.stringify(shareRequest),
    });
  }

  async getDatasetVersions(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}/versions`);
  }

  async batchDatasetOperation(operation: any) {
    return this.request('/api/datasets/batch', {
      method: 'POST',
      body: JSON.stringify(operation),
    });
  }

  async getDatasetStatistics() {
    return this.request('/api/datasets/statistics/overview');
  }

  async getDatasetSearchSuggestions(query: string) {
    return this.request(`/api/datasets/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getDatasetHealth() {
    return this.request('/api/datasets/monitoring/health');
  }

  async deleteDataset(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}`, { method: 'DELETE' });
  }

  async getDatasetStats(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}/stats`);
  }

  async validateDataset(datasetId: string) {
    return this.request(`/api/datasets/${datasetId}/validate`, { method: 'POST' });
  }

  async getDatasetPreview(datasetId: string, limit = 10) {
    return this.request(`/api/datasets/${datasetId}/preview?limit=${limit}`);
  }

  // ===== CACHE MANAGEMENT =====
  async getCacheStats() {
    return this.request('/api/cache/stats');
  }

  async getCacheEntry(key: string, cacheType = 'async') {
    return this.request(`/api/cache/entry/${key}?cache_type=${cacheType}`);
  }

  async setCacheEntry(key: string, value: any, ttl?: number, cacheType = 'async') {
    return this.request(`/api/cache/entry?cache_type=${cacheType}`, {
      method: 'POST',
      body: JSON.stringify({ key, value, ttl }),
    });
  }

  async deleteCacheEntry(key: string, cacheType = 'async') {
    return this.request(`/api/cache/entry/${key}?cache_type=${cacheType}`, {
      method: 'DELETE',
    });
  }

  async clearCache(cacheType = 'both') {
    return this.request(`/api/cache/clear?cache_type=${cacheType}`, {
      method: 'DELETE',
    });
  }

  async cleanupCache(cacheType = 'both') {
    return this.request(`/api/cache/cleanup?cache_type=${cacheType}`, {
      method: 'POST',
    });
  }

  // ===== NETWORK =====
  async getNetworkStatus() {
    return this.request('/api/network/status');
  }

  async getNetworkInterfaces() {
    return this.request('/api/network/interfaces');
  }

  async getNetworkTraffic() {
    return this.request('/api/network/traffic');
  }

  // ===== SYSTEM =====
  async getSystemInfo() {
    return this.request('/');
  }

  async getSystemMetrics() {
    return this.request('/api/system/metrics');
  }

  async getSystemProcesses() {
    return this.request('/api/system/processes');
  }

  // ===== REAL-TIME DATA =====
  async getRealTimeData() {
    return this.request('/api/realtime/data');
  }

  async getRealTimeMetrics() {
    return this.request('/api/realtime/metrics');
  }

  // ===== INTEGRATIONS =====
  async getIntegrations() {
    return this.request('/api/integrations');
  }

  async testIntegration(integrationId: string) {
    return this.request(`/api/integrations/${integrationId}/test`, {
      method: 'POST',
    });
  }

  // ===== PRIVACY =====
  async getPrivacySettings() {
    return this.request('/api/privacy/settings');
  }

  async updatePrivacySettings(settings: any) {
    return this.request('/api/privacy/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // ===== RATE LIMITING =====
  async getRateLimitStats() {
    return this.request('/api/rate-limit/stats');
  }

  // ===== VERSION INFO =====
  async getVersionInfo() {
    return this.request('/version');
  }
}

export const apiService = new APIService();
export default apiService;

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, authenticatedFetch, queryClient } from '../queryClient';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock fetch
global.fetch = vi.fn();

describe('QueryClient Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticatedFetch', () => {
    it('should include authorization header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token-12345');
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await authenticatedFetch('/api/dashboard');

      expect(global.fetch).toHaveBeenCalledWith('/api/dashboard', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-12345',
        },
      });
    });

    it('should handle network failures gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new TypeError('Failed to fetch'));

      const response = await authenticatedFetch('/api/test');
      
      // Should return mock response instead of throwing
      expect(response).toBeDefined();
      expect(response.status).toBe(200);
    });

    it('should work without authentication token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'public-data' }),
      });

      await authenticatedFetch('/api/public');

      expect(global.fetch).toHaveBeenCalledWith('/api/public', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('apiRequest', () => {
    it('should handle successful API requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ result: 'success', data: ['item1', 'item2'] }),
      });

      const result = await apiRequest('GET', '/api/incidents');
      
      expect(result).toEqual({ result: 'success', data: ['item1', 'item2'] });
    });

    it('should handle API errors with proper error messages', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' }),
      });

      await expect(apiRequest('GET', '/api/nonexistent')).rejects.toThrow('Resource not found');
    });

    it('should handle POST requests with data', async () => {
      const testData = { title: 'New Incident', severity: 'high' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1, ...testData }),
      });

      const result = await apiRequest('POST', '/api/incidents', testData);
      
      expect(result).toEqual({ id: 1, ...testData });
      expect(global.fetch).toHaveBeenCalledWith('/api/incidents', {
        method: 'POST',
        body: JSON.stringify(testData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('QueryClient Configuration', () => {
    it('should have correct default configuration', () => {
      const defaultOptions = queryClient.getDefaultOptions();
      
      expect(defaultOptions.queries?.staleTime).toBe(300000); // 5 minutes
      expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
    });

    it('should not retry on authentication errors', () => {
      const retryFn = queryClient.getDefaultOptions().queries?.retry as Function;
      const authError = new Error('401: Authentication failed');
      
      expect(retryFn(1, authError)).toBe(false);
    });

    it('should limit retry attempts for other errors', () => {
      const retryFn = queryClient.getDefaultOptions().queries?.retry as Function;
      const genericError = new Error('500: Internal Server Error');
      
      expect(retryFn(1, genericError)).toBe(true);
      expect(retryFn(2, genericError)).toBe(false);
    });
  });
});

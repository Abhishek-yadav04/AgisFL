
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiRequest, authenticatedFetch } from '../queryClient';

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

describe('QueryClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticatedFetch', () => {
    it('should include authorization header when token exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await authenticatedFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mock-token',
        },
      });
    });

    it('should handle authentication failures gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const response = await authenticatedFetch('/api/test');
      expect(response.status).toBe(401);
    });
  });

  describe('apiRequest', () => {
    it('should make successful API requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await apiRequest('GET', '/api/test');
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle API errors properly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(apiRequest('GET', '/api/test')).rejects.toThrow('Server error');
    });
  });
});

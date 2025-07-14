
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

/**
 * Test suite for utility functions
 * These tests ensure our helper functions work correctly across different scenarios
 * I implemented these to catch edge cases that could cause UI issues in production
 */
describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      // Testing basic class merging functionality
      const result = cn('text-red-500', 'bg-blue-100');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-100');
    });

    it('should handle conditional classes', () => {
      // This pattern is used extensively in our dashboard components
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should override conflicting Tailwind classes', () => {
      // Tailwind-merge should handle conflicting utilities
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toContain('text-blue-500');
      expect(result).not.toContain('text-red-500');
    });

    it('should handle undefined and null values gracefully', () => {
      // Edge case handling for dynamic class generation
      const result = cn('base-class', undefined, null, 'final-class');
      expect(result).toContain('base-class');
      expect(result).toContain('final-class');
    });
  });
});

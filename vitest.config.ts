
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest Configuration for NexusGuard AI
 * 
 * I configured this testing setup to ensure comprehensive test coverage
 * across all components and utilities. The configuration includes:
 * - React Testing Library integration for component testing
 * - Path aliases matching the main Vite config
 * - Coverage reporting to track test effectiveness
 * - Mock configurations for external dependencies
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',
    
    // Test file patterns
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Setup files to run before tests
    setupFiles: ['./src/test/setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'src/main.tsx',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    
    // Global test utilities
    globals: true,
  },
  
  // Resolve aliases to match main config
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
});

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test utilities
    globals: true,

    // Test pattern includes both regular and vitest test files
    include: ['**/*.{test,vitest}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Pass custom environment variables to tests
    env: {
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    },

    // Node.js specific test settings
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: ['node_modules/', 'dist/']
    },

    // Use our existing test directory
    root: '.',

    // Browser is disabled
    browser: {
      enabled: false
    }
  },
  resolve: {
    // Ensure TypeScript module resolution works correctly with .ts extensions
    extensions: ['.ts', '.js'],

    // Add module alias support
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './'),
      '@test': resolve(__dirname, './test')
    }
  }
});
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test utilities
    globals: true,

    // Test pattern includes both regular and vitest test files
    include: ['**/*.{test,vitest}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Setup files to run before each test file
    setupFiles: ['./test/setup.ts'],

    // Increased timeout for file system tests
    testTimeout: 10000,

    // Pass custom environment variables to tests
    env: {
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    },

    // Node.js specific test settings
    environmentMatchGlobs: [
      ['**/*.test.ts', 'node'],
      ['**/*.vitest.ts', 'node']
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: ['node_modules/', 'dist/', 'test/setup.ts']
    },

    // Use our existing test directory
    root: '.',

    // Module resolution settings
    deps: {
      inline: ['vitest-adapter']
    },

    // Extension resolution settings
    browser: {
      enabled: false
    },

    // Custom resolver for TypeScript imports
    resolver: {
      exportConditions: ['node', 'import'],
      conditions: ['node', 'import'],
      extensions: ['.ts', '.js']
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
    },

    // Handle ESM correctly
    mainFields: ['module', 'main']
  }
});
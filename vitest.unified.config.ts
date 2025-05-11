/**
 * Vitest Unified Configuration
 * 
 * This configuration is designed to run only properly migrated Vitest tests.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test utilities
    globals: true,

    // Only match properly migrated Vitest test files
    include: [
      '**/template.vitest.ts',
      '**/direct-vitest.test.ts',
      '**/repo.vitest.ts',
      '**/resilient-template.vitest.ts',
      '**/metadata-repository.vitest.ts',
      '**/base-repository.vitest.ts',
      '**/repository.vitest.ts',
      '**/graph.vitest.ts',
      '**/graph-extended.vitest.ts',
      '**/formatters.vitest.ts',
      '**/formatters-json.vitest.ts',
      '**/nlp-search.vitest.ts',
      '**/nlp-utils.vitest.ts',
      '**/update-command.vitest.ts',
      '**/search-command.vitest.ts',
      '**/next-command.vitest.ts',
      '**/error-handling.vitest.ts',
      '**/api-error-handling.vitest.ts',
      '**/nlp-error-handling.vitest.ts',
      '**/optimized-db.vitest.ts'
    ],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
      '**/*.test.ts'     // Exclude any uvu tests
    ],

    // Environment configuration
    environment: 'node',

    // Setup files to run before each test file
    setupFiles: [],

    // Pass custom environment variables to tests
    env: {
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    },

    // Pass through to watch properly
    passWithNoTests: true,

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
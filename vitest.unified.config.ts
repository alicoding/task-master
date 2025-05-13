/**
 * Vitest Unified Configuration
 *
 * This configuration is designed to run only properly migrated Vitest tests.
 * Updated to fix module resolution issues with TypeScript imports.
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test utilities
    globals: true,

    // Include all test files
    include: [
      'test/**/*.vitest.ts',
      'test/**/*.test.ts',
      '**/esm-import-test.vitest.ts',
      '**/capability-map-fixed.test.ts',
      '**/search-command-fixed.test.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/daemon-command*.ts',
      '**/terminal-command*.ts',
      '**/terminal-session*.ts',
      '**/terminal-integration*.ts',
      '**/file-change-analyzer*.ts',
      '**/file-system-watcher*.ts',
      '**/file-tracking*.ts',
      '**/analysis-engine*.ts',
      // Files still excluded (original versions):
      '**/api.vitest.ts', // Needs fixes for file operations and repository integration

      // Fixed alternatives have been created for these tests:
      '**/search-command.test.ts', // Using search-command-fixed.test.ts instead
      '**/capability-map.test.ts', // Using capability-map-fixed.test.ts instead

      // Add exclusions for files with similar names to avoid duplication
      // Fixed versions are included separately
      // Re-enabled: '**/api.test.ts',
      '**/update-command.test.ts',
      '**/json-metadata.test.ts',
      '**/metadata-display.test.ts',
      '**/metadata-repository.test.ts',
      '**/repository-factory.test.ts',
      '**/repo-advanced*.test.ts',
      '**/metadata-fields.ts',
      // Re-enabled: '**/repo.vitest.test.ts',
      '**/continuous-task-processor.vitest.ts',
      '**/nlp-factory-esm.vitest.ts',
      '**/time-window-manager*.vitest.ts'
    ],

    // Environment configuration
    environment: 'node',

    // Setup files to run before each test file - add the setup file to handle module resolution
    setupFiles: ['./test/vitest-setup.ts'],

    // Environment configuration for tsx loader
    env: {},

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
    },

    // Add TypeScript-specific configuration
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    }
  },
  resolve: {
    // Ensure TypeScript module resolution works correctly with .ts extensions
    extensions: ['.ts', '.js', '.mjs', '.cjs', '.json'],

    // Add module alias support
    alias: {
      '@': resolve(__dirname, './'),
      '~': resolve(__dirname, './'),
      '@test': resolve(__dirname, './test')
    },

    // Configure module resolution for TypeScript files
    conditions: ['import', 'node', 'default'],
    mainFields: ['module', 'main'],

    // Don't require explicit file extensions in imports
    preserveSymlinks: false
  }
});
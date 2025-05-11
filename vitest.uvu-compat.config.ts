
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Enable global test utilities
    globals: true,

    // Pattern to match both uvu and Vitest tests
    include: ['**/*.{test,vitest}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    // Environment configuration
    environment: 'node',

    // Resolve uvu tests with Vitest
    setupFiles: ['./test/vitest-setup.ts'],

    // Allow uvu globals
    globals: true
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

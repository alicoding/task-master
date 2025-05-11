import { defineConfig } from 'vitest/config';

// Simplified configuration without the complexity
export default defineConfig({
  test: {
    // Explicitly set the environment to node
    environment: 'node',
    
    // Simple include pattern for tests
    include: ['**/*.{vitest.test,direct-vitest.test}.ts'],
    
    // Disable DOM/browser features
    browser: {
      enabled: false,
    },
    
    // Node.js environment options
    environmentOptions: {
      // Important for TypeScript imports with .ts extensions
      NODE_OPTIONS: '--experimental-specifier-resolution=node'
    },
  },
});
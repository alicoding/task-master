import { defineConfig } from 'vitest/config';

// Simple configuration file specifically for template test
export default defineConfig({
  test: {
    // Simple settings focused on getting tests working
    environment: 'node',
    
    // Only include our template test initially
    include: ['**/template.vitest.ts'],
    
    // Set environment variables for Node.js
    environmentOptions: {
      env: {
        NODE_OPTIONS: '--experimental-specifier-resolution=node'
      }
    },
    
    // Disable browser
    browser: {
      enabled: false,
    }
  }
});
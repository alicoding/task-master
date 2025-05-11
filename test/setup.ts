/**
 * Vitest Setup File
 * 
 * This file runs before tests to set up the testing environment.
 * It handles TypeScript imports with .ts extensions and any other global setup.
 */

// Set NODE_OPTIONS for proper module resolution
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';

// This allows .ts extension imports
// TypeScript's extensionAlias feature doesn't work directly in Vitest
// so we're ensuring imports work correctly with direct Node.js options
import { register } from 'node:module';

// Validate that we're using ESM
if (typeof register === 'function') {
  register('ts-node/esm', import.meta.url);
}

// Global test environment setup can go here
// For example, clearing mocks before tests or adding matchers

// Log setup completion
console.log('Test environment setup complete');
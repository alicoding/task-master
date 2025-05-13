#!/usr/bin/env node
/**
 * Fix Test File Patterns
 * 
 * This script updates the test file pattern in the Vitest configuration
 * to match both uvu and Vitest test files. It also creates a temporary adapter
 * that helps Vitest recognize uvu tests.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory of current file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Custom vitest config with support for uvu tests
const vitestConfig = `
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
`;

// Setup file to help Vitest recognize and adapt uvu tests
const vitestSetup = `
/**
 * Vitest Setup File for Running uvu Tests
 * 
 * This file helps Vitest recognize and run uvu tests by defining a compatibility layer.
 */

import { beforeAll } from 'vitest';
import { TaskRepository } from '../core/repo.ts';

// Global variables used by tests
globalThis.failures = 0;
globalThis.TaskRepository = TaskRepository;

// Convert uvu test to Vitest
function createUvuTestAdapter() {
  // Create a test function that mimics uvu's test function
  const test = (name, fn) => {
    describe(name, () => {
      it('should pass', async () => {
        await fn();
      });
    });
  };

  // Add hooks that mimic uvu's hooks
  test.before = {};
  test.after = {};

  test.before.each = (fn) => {
    beforeEach(async () => {
      await fn();
    });
  };

  test.after.each = (fn) => {
    afterEach(async () => {
      await fn();
    });
  };

  // No-op for test.run() calls
  test.run = () => {};

  // Add to global scope
  globalThis.test = test;

  // Create uvu/assert compatibility
  globalThis.assert = {
    equal: (actual, expected, message) => {
      // Handle array and object comparisons better
      if (actual === undefined && expected !== undefined) {
        expect(actual).toBeDefined();
      } else {
        expect(actual).toEqual(expected);
      }
    },
    is: (actual, expected, message) => {
      expect(actual).toBe(expected);
    },
    ok: (value, message) => {
      expect(value).toBeTruthy();
    },
    not: {
      ok: (value, message) => {
        expect(value).toBeFalsy();
      }
    },
    type: (value, type, message) => {
      expect(typeof value).toBe(type);
    },
    instance: (value, Type, message) => {
      expect(value).toBeInstanceOf(Type);
    },
    match: (actual, expected, message) => {
      expect(actual).toMatchObject(expected);
    },
    throws: (fn, expected, message) => {
      expect(fn).toThrow(expected);
    },
    unreachable: (message) => {
      expect(true).toBe(false, message || "Unreachable code");
    },
    snapshot: (actual, expected, message) => {
      expect(actual).toEqual(expected);
    }
  };
}

// Set up the adapter before running any tests
beforeAll(() => {
  createUvuTestAdapter();
});

// Mock common test dependencies
globalThis.setupTestDb = async () => {
  return {
    db: {},
    sqlite: {}
  };
};

globalThis.cleanupTestDb = async () => {
  // No-op
};

// Export for convenience
export { setupTestDb, cleanupTestDb };
`;

// Create/update files
async function main(): void {
  try {
    console.log('Creating improved Vitest configuration...');
    
    // Create simple Vitest config
    await fs.writeFile(
      path.join(rootDir, 'vitest.uvu-compat.config.ts'),
      vitestConfig,
      'utf-8'
    );
    
    // Create Vitest setup with uvu adapter
    await fs.writeFile(
      path.join(rootDir, 'test', 'vitest-setup.ts'),
      vitestSetup,
      'utf-8'
    );
    
    // Update package.json
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    // Add script to run tests with the new config
    packageJson.scripts['test:compat'] = 'NODE_OPTIONS=--experimental-specifier-resolution=node npx vitest run --config vitest.uvu-compat.config.ts';
    packageJson.scripts['test:compat:ui'] = 'NODE_OPTIONS=--experimental-specifier-resolution=node npx vitest --ui --config vitest.uvu-compat.config.ts';
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    
    console.log('Files created:');
    console.log('- vitest.uvu-compat.config.ts');
    console.log('- test/vitest-setup.ts');
    console.log('\nScripts added:');
    console.log('- npm run test:compat - Run tests with uvu compatibility mode');
    console.log('- npm run test:compat:ui - Run interactive UI tests with uvu compatibility mode');
    
    console.log('\nTo run tests with uvu compatibility, use:');
    console.log('npm run test:compat');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
/**
 * Vitest Adapter for uvu Tests
 *
 * This adapter allows running uvu tests with Vitest with minimal changes.
 * It mimics the uvu API but delegates to Vitest's test functions.
 */

// Handle dynamic import for ESM compatibility
// Set NODE_OPTIONS for proper module resolution
process.env.NODE_OPTIONS = '--experimental-specifier-resolution=node';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * Create a test suite compatible with uvu's API
 * 
 * @param name Test suite name
 * @returns Test suite object with uvu-compatible API
 */
export function test(name: string) {
  // Create the describe block immediately
  const currentDescribe = describe(name);
  const beforeEachFns: Array<Function> = [];
  const afterEachFns: Array<Function> = [];

  // Add before each hooks
  beforeEach(async () => {
    for (const fn of beforeEachFns) {
      await fn();
    }
  });

  // Add after each hooks
  afterEach(async () => {
    for (const afterFn of afterEachFns) {
      await afterFn();
    }
  });

  // Return a test suite with uvu-compatible API
  return Object.assign(
    // Test function
    function(testName: string, testFn: Function): void {
      it(testName, testFn);
    },
    // Test suite properties
    {
      before: {
        each(fn: Function): void {
          beforeEachFns.push(fn);
        }
      },

      after: {
        each(fn: Function): void {
          afterEachFns.push(fn);
        }
      },

      // No-op run since tests are registered immediately
      run(): void {
        // Tests are already registered by the it() calls
        console.log('test.run() called - tests are already registered, this is a no-op in Vitest');
      }
    }
  );
}

/**
 * Assert compatibility layer for uvu to Vitest transition
 */
export const assert = {
  // Core assertions
  equal: (actual: any, expected: any, message?: string) => {
    expect(actual).toEqual(expected);
  },
  is: (actual: any, expected: any, message?: string) => {
    expect(actual).toBe(expected);
  },
  ok: (value: any, message?: string) => {
    expect(value).toBeTruthy();
  },
  not: {
    ok: (value: any, message?: string) => {
      expect(value).toBeFalsy();
    }
  },

  // Extended assertions
  instance: (actual: any, expected: any, message?: string) => {
    expect(actual).toBeInstanceOf(expected);
  },
  type: (actual: any, expected: string, message?: string) => {
    expect(typeof actual).toBe(expected);
  },
  throws: (fn: Function, expected?: any, message?: string) => {
    expect(fn).toThrow(expected);
  },
  unreachable: (message?: string) => {
    throw new Error(message || 'Should not reach here');
  },

  // Collection assertions
  match: (actual: any, expected: any, message?: string) => {
    expect(actual).toMatchObject(expected);
  },
  snapshot: (actual: any, expected: any, message?: string) => {
    expect(actual).toEqual(expected);
  },
  fixture: (actual: any, expected: any, message?: string) => {
    expect(actual).toEqual(expected);
  },

  // Additional helpers
  abort: (message?: string) => {
    throw new Error(message || 'Test aborted');
  }
};

// Export all the test helpers
export default test;

/**
 * Vitest Setup File for Running uvu Tests
 * 
 * This file helps Vitest recognize and run uvu tests by defining a compatibility layer.
 */

import { beforeAll, describe, it, beforeEach, afterEach, expect } from 'vitest';
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

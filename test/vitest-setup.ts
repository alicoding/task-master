
/**
 * Vitest Setup File
 *
 * This file configures the test environment and provides compatibility
 * for both uvu and vitest test patterns.
 */

import { beforeAll, describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { TaskRepository } from '../core/repo';
import { initTestEnvironment, resetTestEnvironment } from './test-env-init';
import * as testUtils from './test-utils';
import { getEventEmitterManager } from './utils/event-emitter-utils';

// Module resolution is now handled by tsx loader
// No need for manual configuration

// Initialize test environment
try {
  initTestEnvironment();
  console.log('Test environment initialized with enhanced error handling');
} catch (error) {
  console.error('Failed to initialize test environment:', error);
}

// Global variables used by tests
globalThis.failures = 0;
globalThis.TaskRepository = TaskRepository;

// Add vi to global scope for mocking
globalThis.vi = vi;

// Add test utilities to global scope
globalThis.testUtils = testUtils;

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
      try {
        await fn();
      } catch (error) {
        console.error('Error in beforeEach:', error);
      }
    });
  };

  test.after.each = (fn) => {
    afterEach(async () => {
      try {
        await fn();
      } catch (error) {
        console.error('Error in afterEach:', error);
      }
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
      },
      equal: (actual, expected, message) => {
        expect(actual).not.toEqual(expected);
      },
      is: (actual, expected, message) => {
        expect(actual).not.toBe(expected);
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
    },
    // Add additional assertions for compatibility
    fixture: (actual, expected, message) => {
      expect(actual).toEqual(expected);
    },
    // Handle deep equality checks
    deepEqual: (actual, expected, message) => {
      expect(actual).toEqual(expected);
    }
  };
}

// Set up the adapter before running any tests
beforeAll(() => {
  createUvuTestAdapter();
  console.log('Test environment setup complete with enhanced TypeScript import support');
});

// Mock common test dependencies with complete database implementation
globalThis.setupTestDb = async () => {
  const mockDb = {
    connection: {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
        get: vi.fn(),
        all: vi.fn().mockReturnValue([])
      }),
      exec: vi.fn()
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({})
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue([])
        })
      })
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({})
      })
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({})
    }),
    query: {
      tasks: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'test-task-id',
          title: 'Test Task',
          description: 'Test Description',
          status: 'todo',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
  };

  return {
    db: mockDb,
    sqlite: {
      exec: vi.fn()
    },
    connection: mockDb.connection
  };
};

globalThis.cleanupTestDb = async () => {
  // No-op for cleanup
};

// Add global afterEach hook to clean up event listeners
afterEach(() => {
  try {
    const eventManager = getEventEmitterManager();
    if (eventManager) {
      eventManager.cleanup();
    }
  } catch (error) {
    console.error('Error cleaning up event emitters:', error);
  }
});

// Export helpers for convenience
export { setupTestDb, cleanupTestDb };

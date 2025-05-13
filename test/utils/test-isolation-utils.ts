/**
 * Test Isolation Utilities for Task Master
 * 
 * This module provides utilities to ensure proper test isolation,
 * including database transaction management and resource cleanup.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createLogger } from '../../core/utils/logger';
import { EventEmitter } from 'events';
import { 
  eventEmitterManager 
} from './event-emitter-utils';
import {
  initializeTestDatabase,
  TestDatabaseFixture
} from './robust-database-test-utils';

// Create logger
const logger = createLogger('TestIsolationUtils');

/**
 * Test context with resources for isolation
 */
export interface TestContext {
  /** Database fixture */
  dbFixture: TestDatabaseFixture;
  /** Event emitter manager */
  eventManager: typeof eventEmitterManager;
  /** Test resources to track */
  resources: Map<string, any>;
  /** Register a resource for cleanup */
  registerResource: (key: string, resource: any, cleanup?: () => void) => void;
  /** Get a registered resource */
  getResource: <T>(key: string) => T | undefined;
  /** Cleanup all resources */
  cleanup: () => void;
  /** Transaction methods */
  beginTransaction: () => void;
  commitTransaction: () => void;
  rollbackTransaction: () => void;
  /** Run in transaction with automatic rollback */
  withTransaction: <T>(fn: () => Promise<T> | T) => Promise<T>;
}

/**
 * Create a test context with isolated resources
 * 
 * @param options Test context options
 * @returns Test context
 */
export function createTestContext(options: {
  /** Whether to use in-memory database */
  inMemory?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
  /** Additional cleanup functions */
  cleanupFunctions?: (() => void)[];
} = {}): TestContext {
  const {
    inMemory = true,
    applyMigrations = true,
    cleanupFunctions = []
  } = options;
  
  // Initialize database
  const dbFixture = initializeTestDatabase(inMemory, applyMigrations);
  
  // Resources for tracking
  const resources = new Map<string, any>();
  const resourceCleanupFunctions = new Map<string, () => void>();
  
  // Create test context
  const context: TestContext = {
    dbFixture,
    eventManager: eventEmitterManager,
    resources,
    
    // Register a resource for cleanup
    registerResource: (key: string, resource: any, cleanup?: () => void) => {
      resources.set(key, resource);
      
      if (cleanup) {
        resourceCleanupFunctions.set(key, cleanup);
      }
    },
    
    // Get a registered resource
    getResource: <T>(key: string): T | undefined => {
      return resources.get(key) as T | undefined;
    },
    
    // Clean up all resources
    cleanup: () => {
      logger.debug('Cleaning up test context resources');
      
      // Clean up individual resources first
      resourceCleanupFunctions.forEach((cleanup, key) => {
        try {
          cleanup();
        } catch (error) {
          logger.error(`Error cleaning up resource '${key}':`, error);
        }
      });
      
      // Clear resource maps
      resources.clear();
      resourceCleanupFunctions.clear();
      
      // Clean up event emitters
      eventEmitterManager.cleanup();
      
      // Clean up database
      dbFixture.cleanup();
      
      // Run additional cleanup functions
      for (const fn of cleanupFunctions) {
        try {
          fn();
        } catch (error) {
          logger.error('Error running cleanup function:', error);
        }
      }
      
      logger.debug('Test context cleanup complete');
    },
    
    // Transaction methods
    beginTransaction: () => dbFixture.beginTransaction(),
    commitTransaction: () => dbFixture.commitTransaction(),
    rollbackTransaction: () => dbFixture.rollbackTransaction(),
    
    // Run in transaction with automatic rollback
    withTransaction: async <T>(fn: () => Promise<T> | T): Promise<T> => {
      return dbFixture.withTransaction(fn);
    }
  };
  
  return context;
}

/**
 * Initialize test database with isolated fixture
 * 
 * @param options Database options
 * @returns Isolated database fixture
 */
export function initIsolatedDatabase(options: {
  /** Whether to use in-memory database */
  inMemory?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
} = {}): TestDatabaseFixture {
  const {
    inMemory = true,
    applyMigrations = true
  } = options;
  
  return initializeTestDatabase(inMemory, applyMigrations);
}

/**
 * Run a test with transaction isolation
 * 
 * @param testFn Test function
 * @param name Test name for logging
 * @returns Wrapped test function
 */
export function withIsolation<T>(
  testFn: (context: TestContext) => Promise<T> | T,
  name: string = 'unnamed'
): () => Promise<T> {
  return async () => {
    logger.debug(`Running test with isolation: ${name}`);
    
    // Create test context
    const context = createTestContext();
    
    try {
      // Run test in transaction
      return await context.withTransaction(() => testFn(context));
    } finally {
      // Clean up resources
      context.cleanup();
    }
  };
}

/**
 * Create a database isolation wrapper for Vitest
 * 
 * @param options Database options
 * @returns Object with beforeEach and afterEach handlers
 */
export function createDatabaseIsolation(options: {
  /** Whether to use in-memory database */
  inMemory?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
} = {}) {
  let fixture: TestDatabaseFixture | null = null;
  
  return {
    beforeEach: () => {
      fixture = initIsolatedDatabase(options);
      return {
        db: fixture.db,
        sqlite: fixture.sqlite
      };
    },
    
    afterEach: () => {
      if (fixture) {
        fixture.cleanup();
        fixture = null;
      }
    }
  };
}

/**
 * Create an event emitter isolation wrapper for Vitest
 * 
 * @returns Object with beforeEach and afterEach handlers
 */
export function createEventEmitterIsolation() {
  const emitters: EventEmitter[] = [];
  
  return {
    beforeEach: () => {
      return {
        createEmitter: (name: string = 'test-emitter') => {
          const emitter = new EventEmitter();
          emitter.setMaxListeners(100); // Increase for tests
          emitters.push(emitter);
          return emitter;
        },
        registerEmitter: (emitter: EventEmitter) => {
          emitters.push(emitter);
        }
      };
    },
    
    afterEach: () => {
      // Clean up all emitters
      for (const emitter of emitters) {
        emitter.removeAllListeners();
      }
      
      emitters.length = 0;
    }
  };
}
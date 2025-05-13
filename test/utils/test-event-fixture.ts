/**
 * Test Event Fixture for Task Master
 * 
 * This module provides a fixture for testing event-based components
 * with proper cleanup to prevent memory leaks.
 */

import { EventEmitter } from 'events';
import { 
  TrackedEventEmitter, 
  eventEmitterManager
} from './event-emitter-utils';
import { createLogger } from '../../core/utils/logger';

// Create logger
const logger = createLogger('TestEventFixture');

/**
 * EventEmitter test fixture
 */
export class EventEmitterFixture {
  private _emitters: EventEmitter[] = [];
  private _cleanupFunctions: (() => void)[] = [];
  
  /**
   * Create a new event emitter for testing
   * 
   * @param name Optional name for debugging
   * @returns New tracked event emitter
   */
  createEmitter(name: string = 'test-emitter'): EventEmitter {
    const emitter = new TrackedEventEmitter(name);
    this._emitters.push(emitter);
    return emitter;
  }
  
  /**
   * Register an existing emitter for cleanup
   * 
   * @param emitter Event emitter to register
   */
  registerEmitter(emitter: EventEmitter): void {
    this._emitters.push(emitter);
  }
  
  /**
   * Add a cleanup function
   * 
   * @param fn Cleanup function
   */
  addCleanup(fn: () => void): void {
    this._cleanupFunctions.push(fn);
  }
  
  /**
   * Remove all event listeners and clean up resources
   */
  cleanup(): void {
    logger.debug(`Cleaning up ${this._emitters.length} emitters and ${this._cleanupFunctions.length} cleanup functions`);
    
    // Clean up emitters
    for (const emitter of this._emitters) {
      try {
        // Handle tracked emitters
        if (emitter instanceof TrackedEventEmitter) {
          emitter.cleanup();
        } else {
          // Handle regular emitters
          emitter.removeAllListeners();
        }
      } catch (error) {
        logger.error('Error cleaning up event emitter:', error);
      }
    }
    
    // Run cleanup functions
    for (const fn of this._cleanupFunctions) {
      try {
        fn();
      } catch (error) {
        logger.error('Error running cleanup function:', error);
      }
    }
    
    // Clear arrays
    this._emitters = [];
    this._cleanupFunctions = [];
  }
}

/**
 * Create an event handler that records events
 * 
 * @returns Event handler object
 */
export function createEventRecorder() {
  const events: { name: string; args: any[] }[] = [];
  
  return {
    /**
     * Handle an event
     * 
     * @param name Event name
     * @param args Event arguments
     */
    handle(name: string, ...args: any[]): void {
      events.push({ name, args });
    },
    
    /**
     * Get all recorded events
     * 
     * @returns Recorded events
     */
    getEvents(): { name: string; args: any[] }[] {
      return [...events];
    },
    
    /**
     * Check if an event has been recorded
     * 
     * @param name Event name
     * @returns Whether the event has been recorded
     */
    hasEvent(name: string): boolean {
      return events.some(event => event.name === name);
    },
    
    /**
     * Get count of recorded events
     * 
     * @param name Optional event name to filter by
     * @returns Number of events
     */
    getCount(name?: string): number {
      if (name) {
        return events.filter(event => event.name === name).length;
      }
      return events.length;
    },
    
    /**
     * Clear recorded events
     */
    clear(): void {
      events.length = 0;
    }
  };
}

/**
 * Create a test fixture for a class that uses events
 * 
 * @param construct Function that creates the instance
 * @param options Test options
 * @returns Test fixture
 */
export function createEventBasedTestFixture<T extends EventEmitter>(
  construct: () => T,
  options: {
    /** Name of the fixture */
    name?: string;
    /** Events to listen for */
    events?: string[];
    /** Additional cleanup function */
    cleanup?: (instance: T) => void;
  } = {}
) {
  const name = options.name || 'EventFixture';
  const events = options.events || [];
  const fixture = new EventEmitterFixture();
  const recorder = createEventRecorder();
  
  // Create instance
  const instance = construct();
  fixture.registerEmitter(instance);
  
  // Register cleanup
  if (options.cleanup) {
    fixture.addCleanup(() => options.cleanup!(instance));
  }
  
  // Register event handlers
  for (const event of events) {
    instance.on(event, (...args: any[]) => {
      recorder.handle(event, ...args);
    });
  }
  
  return {
    instance,
    recorder,
    cleanup: () => fixture.cleanup()
  };
}

/**
 * Wait for an event or timeout
 * 
 * @param emitter Event emitter
 * @param event Event name
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves with event data
 */
export function waitForEvent(
  emitter: EventEmitter,
  event: string,
  timeout: number = 1000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Clean up listener when timeout
      emitter.off(event, listener);
      reject(new Error(`Timeout waiting for event '${event}'`));
    }, timeout);
    
    const listener = (...args: any[]) => {
      // Clean up timer when event occurs
      clearTimeout(timer);
      resolve(args.length === 1 ? args[0] : args);
    };
    
    emitter.once(event, listener);
  });
}

/**
 * Create a global event fixture for the current test
 */
export const testEventFixture = new EventEmitterFixture();
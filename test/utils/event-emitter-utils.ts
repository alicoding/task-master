/**
 * Event Emitter Utilities for Testing
 * 
 * This module provides utilities to manage EventEmitters in tests,
 * including tracking and cleaning up listeners to prevent memory leaks.
 */

import { EventEmitter } from 'events';

// Add global types
declare global {
  var __eventEmitterManager: EventEmitterManager | undefined;
}
import { createLogger } from '../../core/utils/logger';

// Create logger
const logger = createLogger('EventEmitterUtils');

/**
 * Tracked listeners for cleanup
 */
interface TrackedListener {
  emitter: EventEmitter;
  event: string;
  listener: (...args: any[]) => void;
}

/**
 * A wrapped EventEmitter that tracks listeners for automatic cleanup
 */
export class TrackedEventEmitter extends EventEmitter {
  private _trackedListeners: TrackedListener[] = [];
  private _name: string;
  
  /**
   * Create a new tracked event emitter
   * 
   * @param name Optional name for debugging
   */
  constructor(name: string = 'unnamed') {
    super();
    this._name = name;
    this.setMaxListeners(100); // Increase for tests
  }
  
  /**
   * Add an event listener and track it for cleanup
   * 
   * @param event Event name
   * @param listener Listener function
   * @returns This instance for chaining
   */
  override on(event: string, listener: (...args: any[]) => void): this {
    this._trackedListeners.push({ emitter: this, event, listener });
    super.on(event, listener);
    return this;
  }
  
  /**
   * Add a one-time event listener and track it for cleanup
   * 
   * @param event Event name
   * @param listener Listener function
   * @returns This instance for chaining
   */
  override once(event: string, listener: (...args: any[]) => void): this {
    // Wrap the listener to remove it from tracked listeners when it's called
    const wrappedListener = (...args: any[]) => {
      this._removeTrackedListener(this, event, wrappedListener);
      listener(...args);
    };
    
    this._trackedListeners.push({ emitter: this, event, listener: wrappedListener });
    super.once(event, wrappedListener);
    return this;
  }
  
  /**
   * Remove an event listener and untrack it
   * 
   * @param event Event name
   * @param listener Listener function
   * @returns This instance for chaining
   */
  override off(event: string, listener: (...args: any[]) => void): this {
    this._removeTrackedListener(this, event, listener);
    super.off(event, listener);
    return this;
  }
  
  /**
   * Remove all listeners for an event or all events
   * 
   * @param event Optional event name
   * @returns This instance for chaining
   */
  override removeAllListeners(event?: string): this {
    if (event) {
      this._trackedListeners = this._trackedListeners.filter(
        l => !(l.emitter === this && l.event === event)
      );
    } else {
      this._trackedListeners = this._trackedListeners.filter(
        l => l.emitter !== this
      );
    }
    
    super.removeAllListeners(event);
    return this;
  }
  
  /**
   * Clean up all tracked listeners
   */
  cleanup(): void {
    const count = this._trackedListeners.length;
    
    if (count > 0) {
      logger.debug(`Cleaning up ${count} tracked listeners for emitter '${this._name}'`);
    }
    
    // Create a copy since we'll be modifying the array
    const listeners = [...this._trackedListeners];
    
    for (const { emitter, event, listener } of listeners) {
      if (emitter === this) {
        emitter.off(event, listener);
      }
    }
    
    this._trackedListeners = [];
  }
  
  /**
   * Remove a tracked listener
   * 
   * @param emitter Event emitter
   * @param event Event name
   * @param listener Listener function
   */
  private _removeTrackedListener(
    emitter: EventEmitter,
    event: string,
    listener: (...args: any[]) => void
  ): void {
    this._trackedListeners = this._trackedListeners.filter(
      l => !(l.emitter === emitter && l.event === event && l.listener === listener)
    );
  }
}

/**
 * Event emitter manager to track and clean up event listeners
 */
export class EventEmitterManager {
  private _trackedListeners: TrackedListener[] = [];
  private _trackedEmitters: TrackedEventEmitter[] = [];
  
  /**
   * Create a new tracked event emitter
   * 
   * @param name Optional name for debugging
   * @returns Tracked event emitter
   */
  createEmitter(name: string = 'unnamed'): TrackedEventEmitter {
    const emitter = new TrackedEventEmitter(name);
    this._trackedEmitters.push(emitter);
    return emitter;
  }
  
  /**
   * Track an existing event emitter
   * 
   * @param emitter Event emitter to track
   * @param name Optional name for debugging
   */
  trackEmitter(emitter: EventEmitter, name: string = 'unnamed'): void {
    const originalOn = emitter.on.bind(emitter);
    const originalOnce = emitter.once.bind(emitter);
    const originalOff = emitter.off.bind(emitter);
    const originalRemoveAllListeners = emitter.removeAllListeners.bind(emitter);
    const manager = this;
    
    // Patch on method
    emitter.on = function(event: string, listener: (...args: any[]) => void): EventEmitter {
      manager._trackedListeners.push({ emitter, event, listener });
      return originalOn(event, listener);
    };
    
    // Patch once method
    emitter.once = function(event: string, listener: (...args: any[]) => void): EventEmitter {
      const wrappedListener = (...args: any[]) => {
        manager._removeTrackedListener(emitter, event, wrappedListener);
        listener(...args);
      };
      
      manager._trackedListeners.push({ emitter, event, listener: wrappedListener });
      return originalOnce(event, wrappedListener);
    };
    
    // Patch off method
    emitter.off = function(event: string, listener: (...args: any[]) => void): EventEmitter {
      manager._removeTrackedListener(emitter, event, listener);
      return originalOff(event, listener);
    };
    
    // Patch removeAllListeners method
    emitter.removeAllListeners = function(event?: string): EventEmitter {
      if (event) {
        manager._trackedListeners = manager._trackedListeners.filter(
          l => !(l.emitter === emitter && l.event === event)
        );
      } else {
        manager._trackedListeners = manager._trackedListeners.filter(
          l => l.emitter !== emitter
        );
      }
      
      return originalRemoveAllListeners(event);
    };
    
    logger.debug(`Tracking event emitter '${name}'`);
  }
  
  /**
   * Add an event listener to an emitter and track it for cleanup
   * 
   * @param emitter Event emitter
   * @param event Event name
   * @param listener Listener function
   * @returns The emitter for chaining
   */
  addListener(
    emitter: EventEmitter,
    event: string,
    listener: (...args: any[]) => void
  ): EventEmitter {
    this._trackedListeners.push({ emitter, event, listener });
    emitter.on(event, listener);
    return emitter;
  }
  
  /**
   * Remove a tracked listener
   * 
   * @param emitter Event emitter
   * @param event Event name
   * @param listener Listener function
   */
  private _removeTrackedListener(
    emitter: EventEmitter,
    event: string,
    listener: (...args: any[]) => void
  ): void {
    this._trackedListeners = this._trackedListeners.filter(
      l => !(l.emitter === emitter && l.event === event && l.listener === listener)
    );
  }
  
  /**
   * Clean up all tracked listeners and emitters
   */
  cleanup(): void {
    // Clean up tracked emitters first
    for (const emitter of this._trackedEmitters) {
      emitter.cleanup();
    }
    
    // Clean up individually tracked listeners
    const count = this._trackedListeners.length;
    
    if (count > 0) {
      logger.debug(`Cleaning up ${count} individually tracked listeners`);
    }
    
    // Create a copy since we'll be modifying the array
    const listeners = [...this._trackedListeners];
    
    for (const { emitter, event, listener } of listeners) {
      emitter.off(event, listener);
    }
    
    this._trackedListeners = [];
    this._trackedEmitters = [];
    
    logger.debug('Event emitter cleanup complete');
  }
}

/**
 * Create a new event emitter manager instance
 *
 * @returns A new EventEmitterManager instance
 */
export function createEventEmitterManager(): EventEmitterManager {
  return new EventEmitterManager();
}

/**
 * Get the default event emitter manager instance
 */
export function getEventEmitterManager(): EventEmitterManager {
  if (!global.__eventEmitterManager) {
    global.__eventEmitterManager = new EventEmitterManager();
  }
  return global.__eventEmitterManager;
}

/**
 * Safely emit an event with error handling
 *
 * @param emitter Event emitter
 * @param event Event name
 * @param args Event arguments
 */
export function safeEmit(emitter: EventEmitter, event: string, ...args: any[]): void {
  if (!emitter) {
    logger.warn(`Attempted to emit event '${event}' on undefined emitter`);
    return;
  }

  try {
    emitter.emit(event, ...args);
  } catch (error) {
    logger.error(`Error emitting event '${event}':`, error);
  }
}

/**
 * Safely remove all listeners for an event
 *
 * @param emitter Event emitter
 * @param event Event name
 */
export function safeRemoveAllListeners(emitter: EventEmitter, event?: string): void {
  if (!emitter) {
    logger.warn(`Attempted to remove listeners${event ? ` for event '${event}'` : ''} on undefined emitter`);
    return;
  }

  try {
    emitter.removeAllListeners(event);
  } catch (error) {
    logger.error(`Error removing listeners${event ? ` for event '${event}'` : ''}:`, error);
  }
}

/**
 * Create a test event handler fixture for tracking handlers during tests
 */
export function createTestEventHandlerFixture(): {
  handler: (event: string, ...args: any[]) => void;
  getEvents: () => { event: string; args: any[] }[];
  reset: () => void;
} {
  const events: { event: string; args: any[] }[] = [];
  
  const handler = (event: string, ...args: any[]) => {
    events.push({ event, args });
  };
  
  const getEvents = () => [...events];
  
  const reset = () => {
    events.length = 0;
  };
  
  return { handler, getEvents, reset };
}